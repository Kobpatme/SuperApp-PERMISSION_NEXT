"use server";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { getIdentityAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import { getModule } from "@/lib/module-registry";
import { moduleSettings } from "@/lib/module-lifecycle";
import { runMaterialChange } from "@/lib/material-change";
import type { AdminActionState } from "./actions";

export async function setModuleEnabledAction(_state: AdminActionState, form: FormData): Promise<AdminActionState> {
  const access = await getIdentityAccessContext();
  if (!access.userId || access.passwordChangeRequired || !isAuthorized(access.subject, "core.module.manage")) return { ok: false, message: "ไม่มีสิทธิ์เปิดหรือปิดโมดูล" };
  const result = z.object({ moduleId: z.string().min(1).max(32), enabled: z.enum(["true", "false"]), version: z.coerce.number().int().nonnegative() }).safeParse(Object.fromEntries(form));
  if (!result.success) return { ok: false, message: "ข้อมูลไม่ถูกต้อง กรุณาโหลดหน้าใหม่" };
  const { moduleId, enabled, version } = result.data, manifest = getModule(moduleId);
  if (!manifest || (enabled === "true" && manifest.lifecycle !== "active")) return { ok: false, message: "โมดูลนี้ยังไม่พร้อมเปิดใช้งาน" };
  try {
    await getDb().transaction(async tx => {
      await tx.execute(sql`select set_config('app.user_id',${access.userId},true)`);
      const [allowed] = await tx.execute<{ allowed: boolean }>(sql`select public.has_scoped_permission('core.module.manage') as allowed`);
      if (!allowed?.allowed) throw new Error("Permission revoked");
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`module:${moduleId}`},0))`);
      const [before] = await tx.select().from(moduleSettings).where(eq(moduleSettings.moduleId, moduleId)).for("update");
      if ((before?.version ?? 0) !== version) throw new Error("Stale version");
      await runMaterialChange({ audit: { actorId: access.userId, moduleId: "core", action: "module.enabled.changed", entityType: "module_setting", requestId: crypto.randomUUID(), before: { moduleId, enabled: before?.enabled ?? manifest.enabledByDefault, version }, after: { moduleId, enabled: enabled === "true", version: version + 1 } } }, async () => {
        await tx.insert(moduleSettings).values({ moduleId, enabled: enabled === "true", version: version + 1, changedBy: access.userId }).onConflictDoUpdate({ target: moduleSettings.moduleId, set: { enabled: enabled === "true", version: version + 1, changedBy: access.userId, updatedAt: new Date() } });
      }, tx);
    });
    revalidatePath("/", "layout");
    return { ok: true, message: `${enabled === "true" ? "เปิด" : "ปิด"}${manifest.name}แล้ว สิทธิ์และประวัติยังคงเดิม` };
  } catch { return { ok: false, message: "บันทึกไม่สำเร็จ สิทธิ์หรือสถานะอาจเปลี่ยนแล้ว กรุณาโหลดใหม่" }; }
}
