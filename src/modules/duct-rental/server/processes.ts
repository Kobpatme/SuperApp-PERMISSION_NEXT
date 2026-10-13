import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { renewalTotal } from "../domain/money";
import { cancellationTransitions, renewalTransitions } from "../domain/workflow";
import { advanceInput, cancelInput, id as idSchema, reviewInput } from "../schemas/operations";
import { cancellations, documents, rates, renewalRoutes, renewals, requests } from "./schema";
import { lockRequest, snapshot } from "./requests";
import { DuctError, material, mutation, requirePermission, transaction, type DuctContext } from "./transaction";

export async function createRenewal(raw: unknown, key: string, context: DuctContext) {
  const input = z.object({ year: z.number().int().min(2000).max(9999), teamId: idSchema.nullable().default(null) }).strict().parse(raw);
  return mutation(context, key, "renewal.created", input, async tx => {
    // One global year represents every active route. A scoped partial snapshot would silently omit routes.
    for (const permission of ["duct_rental.module.view", "duct_rental.renewal.create", "duct_rental.rate.read"]) await requirePermission(tx, permission, null);
    const active = await tx.select().from(requests).where(and(eq(requests.phase, "COMPLETE"), isNull(requests.cancelledAt), isNull(requests.archivedAt))).for("share");
    // No end-date filter and no monthly x 12: source RULE010 preserves all active routes.
    const rateRows = await tx.select().from(rates);
    const rateMap = new Map(rateRows.map(rate => [rate.requestId, rate]));
    const id = randomUUID();
    await material(tx, context, "renewal.created", id, context.actorId, async () => {
      await tx.insert(renewals).values({ id, year: input.year, ownerId: context.actorId, teamId: input.teamId });
      if (active.length) await tx.insert(renewalRoutes).values(active.map(row => {
        const rate = rateMap.get(row.id);
        return { renewalId: id, requestId: row.id, snapshot: snapshot(row), monthlyFee: rate?.monthlyFee ?? "0.00", yearlyFee: rate?.yearlyFee ?? "0.00", contractStart: rate?.contractStart, contractEnd: rate?.contractEnd };
      }));
    }, undefined, { year: input.year, routes: active.length, status: "draft" }, input.teamId);
    return { id, version: 1, routes: active.length };
  });
}
export async function reviewRenewal(id: string, raw: unknown, key: string, context: DuctContext) {
  idSchema.parse(id); const input = reviewInput.parse(raw);
  return mutation(context, key, "renewal.reviewed", { id, input }, async tx => {
    const [row] = await tx.select().from(renewals).where(eq(renewals.id, id)).for("update");
    if (!row) throw new DuctError("NOT_FOUND", "ไม่พบงานต่อสัญญา", 404);
    await requirePermission(tx, "duct_rental.renewal.review", row.ownerId, row.teamId);
    if (row.status !== "draft" || row.version !== input.version || row.archivedAt) throw new DuctError("STATE", "งานต่อสัญญาเปลี่ยนสถานะแล้ว กรุณาโหลดใหม่", 409);
    const [route] = await tx.select().from(renewalRoutes).where(and(eq(renewalRoutes.id, input.routeId), eq(renewalRoutes.renewalId, id))).for("update");
    if (!route) throw new DuctError("NOT_FOUND", "ไม่พบเส้นทางในงานนี้", 404);
    await material(tx, context, "renewal.reviewed", id, row.ownerId, async () => {
      await tx.update(renewalRoutes).set({ reviewStatus: input.reviewStatus, reviewNotes: input.notes, reviewedBy: context.actorId, reviewedAt: new Date() }).where(eq(renewalRoutes.id, route.id));
      const routes = await tx.select().from(renewalRoutes).where(eq(renewalRoutes.renewalId, id));
      await tx.update(renewals).set({ totalYearlyCost: renewalTotal(routes), version: row.version + 1, updatedAt: new Date() }).where(eq(renewals.id, id));
    }, { routeId: route.id, reviewStatus: route.reviewStatus, notes: route.reviewNotes, totalYearlyCost: row.totalYearlyCost }, { routeId: route.id, reviewStatus: input.reviewStatus, notes: input.notes }, row.teamId);
    return { id, version: row.version + 1 };
  });
}
export async function advanceRenewal(id: string, raw: unknown, key: string, context: DuctContext, archive = false) {
  idSchema.parse(id); const input = advanceInput.parse(raw);
  return mutation(context, key, archive ? "renewal.archived" : "renewal.advanced", { id, input }, async tx => {
    const [row] = await tx.select().from(renewals).where(eq(renewals.id, id)).for("update");
    if (!row) throw new DuctError("NOT_FOUND", "ไม่พบงานต่อสัญญา", 404);
    if (row.version !== input.version || row.archivedAt) throw new DuctError("STATE", "ข้อมูลเปลี่ยนแปลงแล้ว กรุณาโหลดใหม่", 409);
    const transition = renewalTransitions[row.status as keyof typeof renewalTransitions];
    if (!archive && !transition) throw new DuctError("STATE", "งานต่อสัญญาเสร็จสมบูรณ์แล้ว", 409);
    if (!archive && row.status !== "provider_confirmed" && (input.contractNumber !== undefined || input.thirdPartyNotes !== undefined || input.contractDocumentId !== undefined)) throw new DuctError("STATE", "บันทึกรายละเอียดสัญญาได้หลังผู้ให้บริการยืนยันแล้ว", 409);
    await requirePermission(tx, archive ? "duct_rental.renewal.archive" : transition.permission, row.ownerId, row.teamId);
    const routes = await tx.select().from(renewalRoutes).where(eq(renewalRoutes.renewalId, id));
    if (!archive && row.status === "draft" && routes.some(route => route.reviewStatus === "pending")) throw new DuctError("REVIEW_REQUIRED", "กรุณาตรวจทุกเส้นทางก่อนส่งต่อ");
    if (!archive && transition.next === "contracted") {
      const [doc] = input.contractDocumentId ? await tx.select().from(documents).where(and(eq(documents.id, input.contractDocumentId), eq(documents.fileType, "renewal_contract"), isNull(documents.archivedAt))) : [];
      if (!doc || !routes.some(route => route.requestId === doc.requestId)) throw new DuctError("DOCUMENT_REQUIRED", "กรุณาแนบสัญญารายปีให้ตรงกับเส้นทางในงานนี้");
    }
    const change = archive ? { archivedAt: new Date() } : { status: transition.next, totalYearlyCost: renewalTotal(routes), contractDocumentId: input.contractDocumentId ?? row.contractDocumentId,
      contractNumber: input.contractNumber ?? row.contractNumber, thirdPartyNotes: input.thirdPartyNotes ?? row.thirdPartyNotes,
      ...(row.status === "draft" ? { reviewedBy: context.actorId, reviewedAt: new Date() } : {}),
      ...(transition.next === "provider_confirmed" ? { approvedBy: context.actorId, approvedAt: new Date() } : {}),
      ...(transition.next === "contracted" ? { contractedBy: context.actorId, contractedAt: new Date() } : {}) };
    await material(tx, context, archive ? "renewal.archived" : "renewal.advanced", id, row.ownerId, async () => { await tx.update(renewals).set({ ...change, version: row.version + 1, updatedAt: new Date() }).where(eq(renewals.id, id)); }, { status: row.status, totalYearlyCost: row.totalYearlyCost }, { ...change, archivedAt: archive ? "archived" : undefined }, row.teamId);
    return { id, version: row.version + 1 };
  });
}
export async function createCancellation(raw: unknown, key: string, context: DuctContext) {
  const input = cancelInput.parse(raw);
  return mutation(context, key, "cancellation.created", input, async tx => {
    const row = await lockRequest(tx, input.requestId, input.version);
    await requirePermission(tx, "duct_rental.cancellation.create", row.ownerId, row.teamId);
    await requirePermission(tx, "duct_rental.cancellation.create", context.actorId, row.teamId);
    await requirePermission(tx, "duct_rental.rate.read", row.ownerId, row.teamId);
    if (row.phase !== "COMPLETE" || row.cancelledAt || row.archivedAt) throw new DuctError("STATE", "ขอยกเลิกได้เฉพาะเส้นทางที่ใช้งานอยู่", 409);
    const [rate] = await tx.select().from(rates).where(eq(rates.requestId, row.id));
    const id = randomUUID();
    await material(tx, context, "cancellation.created", id, context.actorId, async () => {
      await tx.insert(cancellations).values({ id, requestId: row.id, ownerId: context.actorId, teamId: row.teamId, snapshot: snapshot(row), reason: input.reason, effectiveDate: input.effectiveDate, monthlyFee: rate?.monthlyFee ?? "0.00", yearlyFee: rate?.yearlyFee ?? "0.00", contractStart: rate?.contractStart, contractEnd: rate?.contractEnd });
    }, undefined, { requestId: row.id, reason: input.reason, effectiveDate: input.effectiveDate, status: "cancel_initiated" }, row.teamId);
    return { id, version: 1 };
  });
}
export async function changeCancellation(id: string, action: "advance" | "reject" | "archive", raw: unknown, key: string, context: DuctContext) {
  idSchema.parse(id); const input = advanceInput.parse(raw);
  return mutation(context, key, `cancellation.${action}`, { id, input }, async tx => {
    const [row] = await tx.select().from(cancellations).where(eq(cancellations.id, id)).for("update");
    if (!row) throw new DuctError("NOT_FOUND", "ไม่พบงานยกเลิก", 404);
    await requirePermission(tx, `duct_rental.cancellation.${action}`, row.ownerId, row.teamId);
    if (row.version !== input.version || row.archivedAt || (action !== "archive" && ["completed", "rejected"].includes(row.status))) throw new DuctError("STATE", "งานยกเลิกเปลี่ยนสถานะแล้ว กรุณาโหลดใหม่", 409);
    const status = action === "reject" ? "rejected" : action === "archive" ? row.status : cancellationTransitions[row.status as keyof typeof cancellationTransitions];
    if (!status) throw new DuctError("STATE", "ไม่สามารถเปลี่ยนสถานะนี้ได้", 409);
    const completedAt = status === "completed" ? new Date() : row.completedAt;
    // Lock route before final mutation; both rows and material evidence are atomic.
    const request = status === "completed" ? await lockRequest(tx, row.requestId) : null;
    if (request) {
      await requirePermission(tx, "duct_rental.cancellation.advance", request.ownerId, request.teamId);
      if (request.cancelledAt || request.archivedAt) throw new DuctError("STATE", "เส้นทางนี้สิ้นสุดแล้ว", 409);
    }
    await material(tx, context, `cancellation.${action}`, id, row.ownerId, async () => {
      await tx.update(cancellations).set({ status, notes: action === "archive" ? row.notes : input.notes, completedAt, completedBy: status === "completed" ? context.actorId : row.completedBy, rejectedAt: action === "reject" ? new Date() : row.rejectedAt, rejectedBy: action === "reject" ? context.actorId : row.rejectedBy, archivedAt: action === "archive" ? new Date() : null, version: row.version + 1, updatedAt: new Date() }).where(eq(cancellations.id, id));
      if (request) await tx.update(requests).set({ cancelledAt: row.effectiveDate, version: request.version + 1, updatedAt: new Date() }).where(eq(requests.id, request.id));
    }, { status: row.status, notes: row.notes }, { status, notes: input.notes, effectiveDate: row.effectiveDate, requestId: row.requestId }, row.teamId);
    return { id, version: row.version + 1, status };
  });
}
export async function readProcesses(context: DuctContext, offset = 0) {
  z.number().int().min(0).max(1000000).parse(offset);
  return transaction(context, async tx => ({
    renewals: await tx.select().from(renewals).where(isNull(renewals.archivedAt)).orderBy(desc(renewals.createdAt)).limit(100).offset(offset),
    cancellations: await tx.select().from(cancellations).where(isNull(cancellations.archivedAt)).orderBy(desc(cancellations.createdAt)).limit(100).offset(offset),
  }));
}
export async function readRenewal(id: string, context: DuctContext) {
  idSchema.parse(id);
  return transaction(context, async tx => {
    const [row] = await tx.select().from(renewals).where(eq(renewals.id, id));
    if (!row) throw new DuctError("NOT_FOUND", "ไม่พบงานต่อสัญญา", 404);
    return { ...row, routes: await tx.select().from(renewalRoutes).where(eq(renewalRoutes.renewalId, id)) };
  });
}
