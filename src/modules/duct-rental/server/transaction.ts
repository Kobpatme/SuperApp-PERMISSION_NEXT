import { createHash, randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { DatabaseTransaction } from "@/db";
import { runMaterialChange } from "@/lib/material-change";
import { getDuctRentalDb } from "./db";
import { receipts } from "./schema";

// Construct only after verified Core session + module entry check. Never parse actor from JSON.
export type DuctContext = { actorId: string; requestId: string };
export class DuctError extends Error {
  constructor(readonly code: string, message: string, readonly status = 400, options?: ErrorOptions) { super(message, options); }
}
export async function transaction<T>(context: DuctContext, run: (tx: DatabaseTransaction) => Promise<T>): Promise<T> {
  z.string().uuid().parse(context.actorId); z.string().uuid().parse(context.requestId);
  try {
    return await getDuctRentalDb(context.requestId).transaction(async tx => {
      const [role] = await tx.execute<{ unsafe: boolean }>(sql`select r.rolsuper or r.rolbypassrls or exists(select 1 from pg_class c where c.relname='duct_rental_requests' and c.relowner=r.oid) as unsafe from pg_roles r where r.rolname=current_user`);
      if (!role || role.unsafe) throw new DuctError("UNSAFE_RUNTIME_ROLE", "การเชื่อมต่อโมดูลยังไม่ได้กำหนดสิทธิ์ฐานข้อมูลที่จำกัด", 503);
      await tx.execute(sql`select set_config('app.user_id',${context.actorId},true)`);
      const [access] = await tx.execute<{ allowed: boolean }>(sql`select public.duct_rental_has_entry() as allowed`);
      if (!access?.allowed) throw new DuctError("FORBIDDEN", "คุณไม่มีสิทธิ์ใช้งานโมดูลนี้", 403);
      return run(tx);
    });
  } catch (error) {
    if (error instanceof DuctError || error instanceof z.ZodError) throw error;
    const code = databaseCode(error);
    if (code === "42501") throw new DuctError("FORBIDDEN", "ไม่มีสิทธิ์ดำเนินการรายการนี้", 403, { cause: error });
    if (["23505", "23514", "40001", "40P01"].includes(code || "")) throw new DuctError("CONFLICT", "ข้อมูลเปลี่ยนแปลงหรือรายการซ้ำ กรุณาโหลดข้อมูลใหม่", 409);
    throw error;
  }
}
function databaseCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const value = error as { code?: string; cause?: unknown };
  return value.code ?? databaseCode(value.cause);
}
export async function requirePermission(tx: DatabaseTransaction, permission: string, ownerId: string | null, teamId: string | null = null) {
  const [access] = await tx.execute<{ allowed: boolean }>(sql`select public.duct_rental_has_access(${permission},${ownerId}::uuid,${teamId}::uuid) as allowed`);
  if (!access?.allowed) throw new DuctError("FORBIDDEN", "ไม่มีสิทธิ์ดำเนินการรายการนี้", 403);
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}
export async function mutation<T extends Record<string, unknown>>(context: DuctContext, key: string, action: string, input: unknown, run: (tx: DatabaseTransaction) => Promise<T>) {
  z.string().uuid().parse(key);
  const fingerprint = createHash("sha256").update(canonical({ action, input })).digest("hex");
  return transaction(context, async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`${context.actorId}:${key}`},0))`);
    const [existing] = await tx.select().from(receipts).where(and(eq(receipts.actorId, context.actorId), eq(receipts.idempotencyKey, key)));
    if (existing) {
      if (existing.fingerprint !== fingerprint) throw new DuctError("IDEMPOTENCY_CONFLICT", "รหัสคำสั่งนี้ถูกใช้กับข้อมูลอื่นแล้ว", 409);
      return existing.result as T;
    }
    const result = await run(tx);
    await tx.insert(receipts).values({ actorId: context.actorId, idempotencyKey: key, fingerprint, result });
    return result;
  });
}
export async function material<T>(tx: DatabaseTransaction, context: DuctContext, action: string, id: string, ownerId: string, run: () => Promise<T>, before?: Record<string, unknown>, after?: Record<string, unknown>, teamId?: string | null) {
  const eventId = randomUUID();
  return runMaterialChange({
    audit: { actorId: context.actorId, moduleId: "duct-rental", action, entityType: "duct_rental", entityId: id, requestId: context.requestId, before, after },
    activity: { actorId: context.actorId, ownerId, teamId: teamId ?? undefined, moduleId: "duct-rental", eventType: `duct-rental.${action}.v1`, eventVersion: 1, entityType: "duct_rental", entityId: id, occurredAt: new Date(), sourceSystem: "permission_next", sourceEventId: eventId, correlationId: context.requestId, kpiEligible: false, payload: { action } },
    outbox: { topic: `duct-rental.${action}.v1`, idempotencyKey: eventId, aggregateType: "duct_rental", aggregateId: id, payload: { actorId: context.actorId, action } },
  }, run, tx);
}
