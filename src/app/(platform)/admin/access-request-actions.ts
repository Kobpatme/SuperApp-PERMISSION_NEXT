"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { accessRequests, dataScopeGrants, rolePermissions, roles, teams, userRoleAssignments } from "@/db/schema";
import { getIdentityAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import { getModule } from "@/lib/module-registry";
import { revokeUserSessions } from "@/lib/auth-session-service";
import { runMaterialChange } from "@/lib/material-change";
import { createNotification } from "@/lib/notifications";
import { accessDecisionNotification, dataScopeLabel, validateAccessDecision, validateAccessReason } from "@/lib/access-request-domain";
import { parseAssignmentScope, parseCapabilityScopeOverrides } from "@/lib/admin-access-contract";
import { buildGrantValues, unsupportedFallbackScope } from "@/lib/assignment-grant-plan";
import type { AdminActionState } from "./actions";

const uuidPattern = /^[0-9a-f-]{36}$/i;
const decisionErrors: Record<string, string> = {
  REQUEST_NOT_FOUND: "ไม่พบคำขอที่ต้องการพิจารณา",
  REQUEST_DECIDED: "คำขอนี้ถูกพิจารณาไปแล้ว",
  ROLE_REQUIRED: "กรุณาเลือกบทบาทที่จะให้เมื่ออนุมัติ",
  ROLE_NOT_FOUND: "ไม่พบบทบาทที่เลือก",
  ROLE_FORBIDDEN: "อนุมัติบทบาทผู้ดูแลระบบสูงสุดผ่านคำขอไม่ได้",
  INVALID_SCOPE: "ขอบเขตข้อมูลไม่ถูกต้อง",
  SELECTED_TEAMS_REQUIRED: "ขอบเขตแบบเลือกทีมต้องเลือกอย่างน้อยหนึ่งทีม",
  TEAM_REQUIRED: "ขอบเขต TEAM ต้องเลือกทีม",
  TEAM_INVALID: "มีทีมที่เลือกไม่พร้อมใช้งาน",
  UNKNOWN_CAPABILITY: "มีสิทธิ์ที่ไม่ได้ประกาศในระบบ",
  SCOPE_NOT_ALLOWED: "สิทธิ์ที่เลือกไม่อนุญาตขอบเขตข้อมูลนี้",
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

function decisionFailure(error: unknown): AdminActionState {
  const raw = error instanceof Error ? error.message : "";
  if (raw.startsWith("SCOPE_UNSUPPORTED|")) {
    const [, label, scope] = raw.split("|");
    return { ok: false, message: `สิทธิ์ "${label}" ไม่รองรับขอบเขต ${dataScopeLabel(scope)} กรุณากำหนดขอบเขตเฉพาะสิทธิ์นี้` };
  }
  if (decisionErrors[raw]) return { ok: false, message: decisionErrors[raw] };
  console.error("Unable to decide access request", error);
  return { ok: false, message: "บันทึกการตัดสินใจไม่สำเร็จ กรุณาลองใหม่" };
}

/**
 * Approval grants the chosen role, its data scope and any per-capability scope in
 * the same transaction as the decision, the notification and the audit entry.
 * The grant is stored with source "access_request" so editing the user later
 * cannot silently delete it.
 */
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
      const moduleName = getModule(request.moduleId)?.name ?? request.moduleId;
      if (decision === "reject") {
        await tx.update(accessRequests).set({ status: "rejected", decidedBy: access.userId, decidedAt, decisionNote: validated.note }).where(eq(accessRequests.id, requestId));
        await createNotification(tx, { recipientId: request.requesterId, ...accessDecisionNotification({ decision: "rejected", moduleName, note: validated.note }) });
        await runMaterialChange({ audit: { actorId: access.userId, moduleId: "core", action: "access.request.reject", entityType: "access_request", entityId: requestId,
          requestId: crypto.randomUUID(), before: { status: "pending" }, after: { status: "rejected", note: validated.note } } }, async () => undefined, tx);
        return "ปฏิเสธคำขอแล้ว ระบบแจ้งเหตุผลให้ผู้ขอแล้ว";
      }
      const roleId = String(form.get("roleId") || "");
      if (!uuidPattern.test(roleId)) throw new Error("ROLE_REQUIRED");
      const [role] = await tx.select({ id: roles.id, code: roles.code, name: roles.name }).from(roles).where(eq(roles.id, roleId)).limit(1);
      if (!role) throw new Error("ROLE_NOT_FOUND");
      if (role.code === "platform_admin") throw new Error("ROLE_FORBIDDEN");
      const requestedScope = parseAssignmentScope(form.get("scopeType"), form.getAll("teamIds"));
      const teamId = String(form.get("teamId") || "");
      if (requestedScope.scopeType === "TEAM" && !uuidPattern.test(teamId)) throw new Error("TEAM_REQUIRED");
      const teamIdsToCheck = requestedScope.scopeType === "SELECTED_TEAMS"
        ? requestedScope.selectedTeamIds
        : requestedScope.scopeType === "TEAM" ? [teamId] : [];
      if (teamIdsToCheck.length) {
        const activeTeams = await tx.select({ id: teams.id }).from(teams).where(and(inArray(teams.id, [...teamIdsToCheck]), eq(teams.isActive, true)));
        if (activeTeams.length !== teamIdsToCheck.length) throw new Error("TEAM_INVALID");
      }
      const capabilityCodes = (await tx.select({ code: rolePermissions.permissionCode }).from(rolePermissions).where(eq(rolePermissions.roleId, role.id)))
        .map((row) => row.code);
      const scopeEntries = [...form.entries()].filter(([key]) => key.startsWith("capScope."))
        .map(([key, value]) => ({ code: key.slice("capScope.".length), scope: String(value) }));
      let scopeOverrides;
      try {
        scopeOverrides = parseCapabilityScopeOverrides(scopeEntries, capabilityCodes);
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "SCOPE_NOT_ALLOWED");
      }
      const unsupported = unsupportedFallbackScope(capabilityCodes, requestedScope.scopeType, scopeOverrides);
      if (unsupported) throw new Error(`SCOPE_UNSUPPORTED|${unsupported.label}|${requestedScope.scopeType}`);
      const [assignment] = await tx.insert(userRoleAssignments).values({ userId: request.requesterId, roleId: role.id,
        teamId: requestedScope.scopeType === "TEAM" ? teamId : null, source: "access_request", createdBy: access.userId })
        .returning({ id: userRoleAssignments.id });
      const grantValues = buildGrantValues({ capabilityCodes, defaultScope: requestedScope, overrides: scopeOverrides });
      if (grantValues.length) await tx.insert(dataScopeGrants).values(grantValues.map((value) => ({ ...value, assignmentId: assignment.id })));
      await tx.update(accessRequests).set({ status: "approved", decidedBy: access.userId, decidedAt, decisionNote: validated.note, grantedRoleId: role.id }).where(eq(accessRequests.id, requestId));
      await revokeUserSessions(tx, request.requesterId, "admin_revoked");
      await createNotification(tx, { recipientId: request.requesterId, priority: "high",
        ...accessDecisionNotification({ decision: "approved", moduleName, roleName: role.name, scopeLabel: dataScopeLabel(requestedScope.scopeType) }) });
      await runMaterialChange({ audit: { actorId: access.userId, moduleId: "core", action: "access.request.approve", entityType: "access_request", entityId: requestId,
        requestId: crypto.randomUUID(), before: { status: "pending" }, after: { status: "approved", role: role.name, scopeType: requestedScope.scopeType,
          selectedTeamIds: requestedScope.selectedTeamIds, capabilityScopeOverrides: scopeOverrides } } }, async () => undefined, tx);
      return `อนุมัติและให้บทบาท ${role.name} แล้ว ระบบแจ้งผู้ขอและให้เข้าสู่ระบบใหม่`;
    });
    revalidatePath("/admin");
    return { ok: true, message };
  } catch (error) {
    return decisionFailure(error);
  }
}
