"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { accessRequests, dataScopeGrants, userRoleAssignments, roles } from "@/db/schema";
import { getIdentityAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import { getModule } from "@/lib/module-registry";
import { revokeUserSessions } from "@/lib/auth-session-service";
import { runMaterialChange } from "@/lib/material-change";
import { validateAccessDecision, validateAccessReason } from "@/lib/access-request-domain";
import type { AdminActionState } from "./actions";

const uuidPattern = /^[0-9a-f-]{36}$/i;
const decisionErrors: Record<string, string> = {
  REQUEST_NOT_FOUND: "ไม่พบคำขอที่ต้องการพิจารณา",
  REQUEST_DECIDED: "คำขอนี้ถูกพิจารณาไปแล้ว",
  ROLE_REQUIRED: "กรุณาเลือกบทบาทที่จะให้เมื่ออนุมัติ",
  ROLE_NOT_FOUND: "ไม่พบบทบาทที่เลือก",
  ROLE_FORBIDDEN: "อนุมัติบทบาทผู้ดูแลระบบสูงสุดผ่านคำขอไม่ได้",
  SCOPE_INVALID: "ขอบเขตข้อมูลไม่ถูกต้อง",
  TEAM_REQUIRED: "ขอบเขต TEAM ต้องเลือกทีม",
};

/** Any signed-in user may ask for a module; the queue is per module to keep it readable. */
export async function requestModuleAccessAction(_state: AdminActionState, form: FormData): Promise<AdminActionState> {
  const access = await getIdentityAccessContext();
  if (!access.userId || access.passwordChangeRequired) return { ok: false, message: "ต้องเข้าสู่ระบบก่อนขอสิทธิ์" };
  const manifest = getModule(String(form.get("moduleId") || ""));
  if (!manifest) return { ok: false, message: "กรุณาเลือกโมดูลที่ต้องการขอสิทธิ์" };
  const reason = validateAccessReason(form.get("reason"));
  if (!reason.ok) return { ok: false, message: reason.message };
  const id = crypto.randomUUID();
  try {
    await runMaterialChange({ audit: { actorId: access.userId, moduleId: "core", action: "access.request.create", entityType: "access_request",
      entityId: id, requestId: crypto.randomUUID(), after: { moduleId: manifest.id, moduleName: manifest.name, reason: reason.reason } } }, async (tx) => {
      await tx.insert(accessRequests).values({ id, requesterId: access.userId, moduleId: manifest.id, reason: reason.reason });
    });
    revalidatePath("/admin");
    return { ok: true, message: `ส่งคำขอใช้ ${manifest.name} แล้ว ผู้ดูแลระบบจะพิจารณา` };
  } catch {
    return { ok: false, message: "มีคำขอของโมดูลนี้ที่ยังรออยู่แล้ว หรือบันทึกไม่สำเร็จ" };
  }
}

/** Approval grants the chosen role and scope in the same transaction as the decision and audit. */
export async function decideAccessRequestAction(_state: AdminActionState, form: FormData): Promise<AdminActionState> {
  const access = await getIdentityAccessContext();
  if (!access.userId || access.passwordChangeRequired || !isAuthorized(access.subject, "core.role.manage")) return { ok: false, message: "ไม่มีสิทธิ์พิจารณาคำขอ" };
  const requestId = String(form.get("requestId") || "");
  if (!uuidPattern.test(requestId)) return { ok: false, message: "ไม่พบคำขอที่ต้องการพิจารณา" };
  const decision = String(form.get("decision") || "");
  const validated = validateAccessDecision(decision, form.get("note"));
  if (!validated.ok) return { ok: false, message: validated.message };
  try {
    const message = await getDb().transaction(async (tx) => {
      const [request] = await tx.select().from(accessRequests).where(eq(accessRequests.id, requestId)).for("update");
      if (!request) throw new Error("REQUEST_NOT_FOUND");
      if (request.status !== "pending") throw new Error("REQUEST_DECIDED");
      const decidedAt = new Date();
      if (decision === "reject") {
        await tx.update(accessRequests).set({ status: "rejected", decidedBy: access.userId, decidedAt, decisionNote: validated.note }).where(eq(accessRequests.id, requestId));
        await runMaterialChange({ audit: { actorId: access.userId, moduleId: "core", action: "access.request.reject", entityType: "access_request", entityId: requestId,
          requestId: crypto.randomUUID(), before: { status: "pending" }, after: { status: "rejected", note: validated.note } } }, async () => undefined, tx);
        return "ปฏิเสธคำขอแล้ว ผู้ขอจะเห็นเหตุผลในระบบ";
      }
      const roleId = String(form.get("roleId") || "");
      const scopeType = String(form.get("scopeType") || "OWN");
      const teamId = String(form.get("teamId") || "");
      if (!uuidPattern.test(roleId)) throw new Error("ROLE_REQUIRED");
      const [role] = await tx.select({ id: roles.id, code: roles.code, name: roles.name }).from(roles).where(eq(roles.id, roleId)).limit(1);
      if (!role) throw new Error("ROLE_NOT_FOUND");
      if (role.code === "platform_admin") throw new Error("ROLE_FORBIDDEN");
      if (!["OWN", "TEAM", "ALL"].includes(scopeType)) throw new Error("SCOPE_INVALID");
      if (scopeType === "TEAM" && !uuidPattern.test(teamId)) throw new Error("TEAM_REQUIRED");
      const [assignment] = await tx.insert(userRoleAssignments).values({ userId: request.requesterId, roleId: role.id, teamId: uuidPattern.test(teamId) ? teamId : null, createdBy: access.userId })
        .returning({ id: userRoleAssignments.id });
      await tx.insert(dataScopeGrants).values({ assignmentId: assignment.id, scopeType });
      await tx.update(accessRequests).set({ status: "approved", decidedBy: access.userId, decidedAt, decisionNote: validated.note, grantedRoleId: role.id }).where(eq(accessRequests.id, requestId));
      await revokeUserSessions(tx, request.requesterId, "admin_revoked");
      await runMaterialChange({ audit: { actorId: access.userId, moduleId: "core", action: "access.request.approve", entityType: "access_request", entityId: requestId,
        requestId: crypto.randomUUID(), before: { status: "pending" }, after: { status: "approved", role: role.name, scopeType, teamId: uuidPattern.test(teamId) ? teamId : null } } }, async () => undefined, tx);
      return `อนุมัติและให้บทบาท ${role.name} แล้ว ผู้ใช้ต้องเข้าสู่ระบบใหม่`;
    });
    revalidatePath("/admin");
    return { ok: true, message };
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (decisionErrors[code]) return { ok: false, message: decisionErrors[code] };
    console.error("Unable to decide access request", error);
    return { ok: false, message: "บันทึกการตัดสินใจไม่สำเร็จ กรุณาลองใหม่" };
  }
}
