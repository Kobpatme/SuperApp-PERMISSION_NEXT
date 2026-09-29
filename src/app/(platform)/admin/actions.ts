"use server";

import { hash } from "@node-rs/argon2";
import { and, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { authSessions, dataScopeGrants, localCredentials, permissions, positions, profiles, rolePermissions, roles, teams, userRoleAssignments, userTeams } from "@/db/schema";
import { adminCapabilityCatalog, parseAssignmentScope, parseCatalogCapabilities } from "@/lib/admin-access-contract";
import { getIdentityAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import { runMaterialChange } from "@/lib/material-change";

export type AdminActionState = { ok: boolean; message: string };
const denied = { ok: false, message: "ไม่มีสิทธิ์จัดการผู้ใช้" };
const passwordOptions = { memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 };

async function requireAdmin(permission = "core.user.manage") {
  const access = await getIdentityAccessContext();
  if (!isAuthorized(access.subject, permission)) return null;
  return access;
}

function validPassword(value: string) {
  return value.length >= 12 && /[a-zA-Z]/.test(value) && /\d/.test(value) && /[^a-zA-Z0-9]/.test(value);
}

export async function createUserAction(_state: AdminActionState, form: FormData): Promise<AdminActionState> {
  const access = await requireAdmin();
  if (!access) return denied;
  const displayName = String(form.get("displayName") || "").trim();
  const email = String(form.get("email") || "").trim().toLocaleLowerCase("en-US");
  const employeeCode = String(form.get("employeeCode") || "").trim();
  const positionId = String(form.get("positionId") || "");
  const teamId = String(form.get("teamId") || "");
  const password = String(form.get("password") || "");
  if (displayName.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || !/^[0-9a-f-]{36}$/i.test(positionId)) return { ok: false, message: "กรอกชื่อ อีเมล และตำแหน่งให้ครบ" };
  if (!validPassword(password)) return { ok: false, message: "รหัสผ่านชั่วคราวต้องมีอย่างน้อย 12 ตัว และมีตัวอักษร ตัวเลข และสัญลักษณ์" };
  const [position] = await getDb().select().from(positions).where(and(eq(positions.id, positionId), eq(positions.isActive, true))).limit(1);
  if (!position) return { ok: false, message: "ไม่พบตำแหน่งที่เลือก" };
  if (position.scopeType === "TEAM" && !/^[0-9a-f-]{36}$/i.test(teamId)) return { ok: false, message: "ตำแหน่งนี้ต้องกำหนดทีม" };
  if (teamId && !(await getDb().select({ id: teams.id }).from(teams).where(and(eq(teams.id, teamId), eq(teams.isActive, true))).limit(1)).length) return { ok: false, message: "ไม่พบทีมที่เลือก" };
  try {
    const passwordHash = await hash(password, passwordOptions);
    const id = crypto.randomUUID();
    await runMaterialChange({ audit: { actorId: access.userId, moduleId: "core", action: "user.create", entityType: "profile", entityId: id,
      requestId: crypto.randomUUID(), after: { email, displayName, employeeCode, positionId, teamId: teamId || null, status: "active" } } }, async (tx) => {
      await tx.insert(profiles).values({ id, email, displayName, employeeCode: employeeCode || null, positionId, status: "active" });
      await tx.insert(localCredentials).values({ userId: id, passwordHash, mustChangePassword: true });
      if (teamId) await tx.insert(userTeams).values({ userId: id, teamId, isPrimary: true });
      const [assignment] = await tx.insert(userRoleAssignments).values({ userId: id, roleId: position.roleId, teamId: teamId || null, createdBy: access.userId }).returning({ id: userRoleAssignments.id });
      await tx.insert(dataScopeGrants).values({ assignmentId: assignment.id, scopeType: position.scopeType });
    });
    revalidatePath("/admin");
    return { ok: true, message: "เพิ่มผู้ใช้แล้ว ผู้ใช้ควรเปลี่ยนรหัสผ่านหลังเข้าสู่ระบบครั้งแรก" };
  } catch (error) {
    console.error("Unable to create local user", error);
    return { ok: false, message: "เพิ่มผู้ใช้ไม่สำเร็จ อีเมลหรือรหัสพนักงานอาจซ้ำ" };
  }
}

export async function createPositionAction(_state: AdminActionState, form: FormData): Promise<AdminActionState> {
  const access = await requireAdmin("core.position.manage");
  if (!access) return denied;
  const code = String(form.get("code") || "").trim().toLocaleLowerCase("en-US").replace(/[^a-z0-9_-]/g, "_");
  const name = String(form.get("name") || "").trim();
  const roleId = String(form.get("roleId") || "");
  const scopeType = String(form.get("scopeType") || "OWN");
  if (!code || name.length < 2 || !/^[0-9a-f-]{36}$/i.test(roleId) || !["OWN", "TEAM", "ALL"].includes(scopeType)) return { ok: false, message: "ข้อมูลตำแหน่งไม่ครบ" };
  try {
    const id = crypto.randomUUID();
    await runMaterialChange({ audit: { actorId: access.userId, moduleId: "core", action: "position.create", entityType: "position", entityId: id,
      requestId: crypto.randomUUID(), after: { code, name, roleId, scopeType } } }, async (tx) => {
      await tx.insert(positions).values({ id, code, name, roleId, scopeType });
    });
    revalidatePath("/admin");
    return { ok: true, message: "เพิ่มตำแหน่งแล้ว" };
  } catch { return { ok: false, message: "เพิ่มตำแหน่งไม่สำเร็จ รหัสตำแหน่งอาจซ้ำ" }; }
}

export async function updatePositionAction(_state: AdminActionState, form: FormData): Promise<AdminActionState> {
  const access = await requireAdmin("core.position.manage");
  if (!access) return denied;
  const positionId = String(form.get("positionId") || "");
  const name = String(form.get("name") || "").trim();
  const roleId = String(form.get("roleId") || "");
  const scopeType = String(form.get("scopeType") || "OWN");
  if (!/^[0-9a-f-]{36}$/i.test(positionId) || name.length < 2 || !/^[0-9a-f-]{36}$/i.test(roleId) || !["OWN", "TEAM", "ALL"].includes(scopeType)) return { ok: false, message: "ข้อมูลตำแหน่งไม่ครบ" };
  const [before] = await getDb().select().from(positions).where(eq(positions.id, positionId)).limit(1);
  if (!before) return { ok: false, message: "ไม่พบตำแหน่ง" };
  const [role] = await getDb().select({ id: roles.id }).from(roles).where(eq(roles.id, roleId)).limit(1);
  if (!role) return { ok: false, message: "ไม่พบชุดสิทธิ์" };
  const after = { ...before, name, roleId, scopeType };
  await runMaterialChange({ audit: { actorId: access.userId, moduleId: "core", action: "position.update", entityType: "position", entityId: positionId, requestId: crypto.randomUUID(), before, after } }, async (tx) => {
    await tx.update(positions).set({ name, roleId, scopeType, updatedAt: new Date() }).where(eq(positions.id, positionId));
  });
  revalidatePath("/admin");
  return { ok: true, message: `บันทึกตำแหน่ง ${name} แล้ว การมอบหมายเดิมยังคงเดิมจนกว่าจะทบทวนผู้ใช้` };
}

export async function createTeamAction(_state: AdminActionState, form: FormData): Promise<AdminActionState> {
  const access = await requireAdmin("core.team.manage");
  if (!access) return { ok: false, message: "ไม่มีสิทธิ์จัดการทีม" };
  const code = String(form.get("code") || "").trim().toLocaleLowerCase("en-US").replace(/[^a-z0-9_-]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  const name = String(form.get("name") || "").trim();
  if (code.length < 2 || code.length > 64 || name.length < 2 || name.length > 120) {
    return { ok: false, message: "กรอกรหัสทีม 2–64 ตัว และชื่อทีม 2–120 ตัวอักษร" };
  }
  try {
    const id = crypto.randomUUID();
    await runMaterialChange({ audit: { actorId: access.userId, moduleId: "core", action: "team.create", entityType: "team", entityId: id,
      requestId: crypto.randomUUID(), after: { code, name, isActive: true } } }, async (tx) => {
      await tx.insert(teams).values({ id, code, name, isActive: true });
    });
    revalidatePath("/admin");
    return { ok: true, message: `เพิ่มทีม ${name} แล้ว และพร้อมกำหนดให้ผู้ใช้` };
  } catch (error) {
    console.error("Unable to create team", error);
    return { ok: false, message: "เพิ่มทีมไม่สำเร็จ รหัสทีมอาจซ้ำกับทีมที่มีอยู่" };
  }
}

export async function updateTeamAction(_state: AdminActionState, form: FormData): Promise<AdminActionState> {
  const access = await requireAdmin("core.team.manage");
  if (!access) return { ok: false, message: "ไม่มีสิทธิ์จัดการทีม" };
  const teamId = String(form.get("teamId") || "");
  const name = String(form.get("name") || "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(teamId) || name.length < 2 || name.length > 120) return { ok: false, message: "ชื่อทีมต้องมี 2–120 ตัวอักษร" };
  const [before] = await getDb().select().from(teams).where(eq(teams.id, teamId)).limit(1);
  if (!before || !before.isActive) return { ok: false, message: "ไม่พบทีม" };
  await runMaterialChange({ audit: { actorId: access.userId, moduleId: "core", action: "team.update", entityType: "team", entityId: teamId, requestId: crypto.randomUUID(), before, after: { ...before, name } } }, async (tx) => {
    await tx.update(teams).set({ name, updatedAt: new Date() }).where(eq(teams.id, teamId));
  });
  revalidatePath("/admin");
  return { ok: true, message: `เปลี่ยนชื่อทีมเป็น ${name} แล้ว` };
}

export async function createRoleAction(_state: AdminActionState, form: FormData): Promise<AdminActionState> {
  const access = await requireAdmin("core.role.manage");
  if (!access) return { ok: false, message: "ไม่มีสิทธิ์จัดการบทบาท" };
  const code = String(form.get("code") || "").trim().toLocaleLowerCase("en-US").replace(/[^a-z0-9_-]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  const name = String(form.get("name") || "").trim();
  const description = String(form.get("description") || "").trim();
  const sourceRoleId = String(form.get("sourceRoleId") || "");
  if (code.length < 2 || code.length > 64 || name.length < 2 || name.length > 120) return { ok: false, message: "กรอกรหัสและชื่อบทบาทให้ครบ" };
  let capabilityCodes: string[] = [];
  if (sourceRoleId) {
    if (!/^[0-9a-f-]{36}$/i.test(sourceRoleId)) return { ok: false, message: "บทบาทต้นแบบไม่ถูกต้อง" };
    const rows = await getDb().select({ code: rolePermissions.permissionCode }).from(rolePermissions).where(eq(rolePermissions.roleId, sourceRoleId));
    capabilityCodes = rows.map((row) => row.code).filter((value) => adminCapabilityCatalog.some((item) => item.code === value));
  }
  try {
    const id = crypto.randomUUID();
    await runMaterialChange({ audit: { actorId: access.userId, moduleId: "core", action: "role.create", entityType: "role", entityId: id, requestId: crypto.randomUUID(), after: { code, name, description, capabilityCodes } } }, async (tx) => {
      await tx.insert(roles).values({ id, code, name, description: description || null, isSystem: false });
      if (capabilityCodes.length) await tx.insert(rolePermissions).values(capabilityCodes.map((permissionCode) => ({ roleId: id, permissionCode })));
    });
    revalidatePath("/admin");
    return { ok: true, message: `สร้างบทบาท ${name} แล้ว` };
  } catch (error) {
    console.error("Unable to create role", error);
    return { ok: false, message: "สร้างบทบาทไม่สำเร็จ รหัสอาจซ้ำหรือ capability catalog ยังไม่ถูก sync" };
  }
}

export async function updateRolePermissionsAction(_state: AdminActionState, form: FormData): Promise<AdminActionState> {
  const access = await requireAdmin("core.role.manage");
  if (!access) return { ok: false, message: "ไม่มีสิทธิ์จัดการบทบาท" };
  const roleId = String(form.get("roleId") || "");
  const name = String(form.get("name") || "").trim();
  const description = String(form.get("description") || "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(roleId) || name.length < 2 || name.length > 120) return { ok: false, message: "ข้อมูลบทบาทไม่ครบ" };
  let capabilityCodes: string[];
  try { capabilityCodes = parseCatalogCapabilities(form.getAll("permissionCode")); }
  catch { return { ok: false, message: "พบ capability ที่ไม่ได้ประกาศใน module manifest" }; }
  const [role] = await getDb().select().from(roles).where(eq(roles.id, roleId)).limit(1);
  if (!role) return { ok: false, message: "ไม่พบบทบาท" };
  if (role.isSystem) return { ok: false, message: "บทบาทระบบแก้ไขไม่ได้ กรุณาสร้างสำเนาเพื่อปรับสิทธิ์" };
  const existing = await getDb().select({ code: rolePermissions.permissionCode }).from(rolePermissions).where(eq(rolePermissions.roleId, roleId));
  const affected = await getDb().select({ userId: userRoleAssignments.userId }).from(userRoleAssignments).where(and(eq(userRoleAssignments.roleId, roleId), isNull(userRoleAssignments.validUntil)));
  try {
    await runMaterialChange({ audit: { actorId: access.userId, moduleId: "core", action: "role.permissions.update", entityType: "role", entityId: roleId, requestId: crypto.randomUUID(), before: { name: role.name, description: role.description, capabilityCodes: existing.map((item) => item.code) }, after: { name, description, capabilityCodes }, metadata: { affectedUsers: affected.length, sessionsRevoked: true } } }, async (tx) => {
      const catalogRows = adminCapabilityCatalog.filter((item) => capabilityCodes.includes(item.code)).map((item) => {
        const [, resource, action] = item.code.split(".");
        return { code: item.code, moduleId: item.moduleId, resource, action, description: item.labelTh };
      });
      if (catalogRows.length) await tx.insert(permissions).values(catalogRows).onConflictDoNothing();
      await tx.update(roles).set({ name, description: description || null, updatedAt: new Date() }).where(eq(roles.id, roleId));
      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
      if (capabilityCodes.length) await tx.insert(rolePermissions).values(capabilityCodes.map((permissionCode) => ({ roleId, permissionCode })));
      const affectedUserIds = [...new Set(affected.map((item) => item.userId))];
      if (affectedUserIds.length) await tx.delete(authSessions).where(inArray(authSessions.userId, affectedUserIds));
    });
    revalidatePath("/admin");
    return { ok: true, message: `บันทึกสิทธิ์ของ ${name} แล้ว ผู้ใช้ที่ได้รับผลต้องเข้าสู่ระบบใหม่` };
  } catch (error) {
    console.error("Unable to update role permissions", error);
    return { ok: false, message: "บันทึกบทบาทไม่สำเร็จ" };
  }
}

export async function deleteTeamAction(_state: AdminActionState, form: FormData): Promise<AdminActionState> {
  const access = await requireAdmin("core.team.manage");
  if (!access) return { ok: false, message: "ไม่มีสิทธิ์จัดการทีม" };
  const teamId = String(form.get("teamId") || "");
  if (!/^[0-9a-f-]{36}$/i.test(teamId)) return { ok: false, message: "ไม่พบทีมที่ต้องการลบ" };
  const [team] = await getDb().select({ id: teams.id, code: teams.code, name: teams.name, isActive: teams.isActive })
    .from(teams).where(eq(teams.id, teamId)).limit(1);
  if (!team || !team.isActive) return { ok: false, message: "ทีมนี้ถูกลบหรือไม่มีอยู่แล้ว" };
  const [member, activeAssignment] = await Promise.all([
    getDb().select({ userId: userTeams.userId }).from(userTeams).where(eq(userTeams.teamId, teamId)).limit(1),
    getDb().select({ id: userRoleAssignments.id }).from(userRoleAssignments)
      .where(and(eq(userRoleAssignments.teamId, teamId), isNull(userRoleAssignments.validUntil))).limit(1),
  ]);
  if (member.length || activeAssignment.length) return { ok: false, message: `ยังลบทีม ${team.name} ไม่ได้ กรุณาย้ายผู้ใช้ออกจากทีมก่อน` };
  await runMaterialChange({ audit: { actorId: access.userId, moduleId: "core", action: "team.deactivate", entityType: "team", entityId: teamId,
    requestId: crypto.randomUUID(), before: team, after: { ...team, isActive: false }, metadata: { deletionMode: "soft", historyPreserved: true } } }, async (tx) => {
    await tx.update(teams).set({ isActive: false, updatedAt: new Date() }).where(eq(teams.id, teamId));
  });
  revalidatePath("/admin");
  return { ok: true, message: `ลบทีม ${team.name} แล้ว โดยเก็บประวัติงานและ KPI เดิมไว้` };
}

export async function updateUserAccessAction(_state: AdminActionState, form: FormData): Promise<AdminActionState> {
  const access = await requireAdmin();
  if (!access) return denied;
  const userId = String(form.get("userId") || "");
  const displayName = String(form.get("displayName") || "").trim();
  const email = String(form.get("email") || "").trim().toLocaleLowerCase("en-US");
  const employeeCode = String(form.get("employeeCode") || "").trim();
  const positionId = String(form.get("positionId") || "");
  const teamId = String(form.get("teamId") || "");
  const status = String(form.get("status") || "");
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return { ok: false, message: "ไม่พบบัญชีผู้ใช้ที่ต้องการแก้ไข" };
  if (displayName.length < 2 || displayName.length > 120) return { ok: false, message: "ชื่อต้องมี 2–120 ตัวอักษร" };
  if (email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) return { ok: false, message: "รูปแบบอีเมลไม่ถูกต้อง" };
  if (employeeCode.length > 64) return { ok: false, message: "รหัสพนักงานต้องไม่เกิน 64 ตัวอักษร" };
  if (!/^[0-9a-f-]{36}$/i.test(positionId) || !["active", "inactive"].includes(status)) return { ok: false, message: "เลือกตำแหน่งและสถานะให้ครบ" };

  const [position] = await getDb().select({ id: positions.id, roleId: positions.roleId, scopeType: positions.scopeType, roleCode: roles.code })
    .from(positions).innerJoin(roles, eq(roles.id, positions.roleId)).where(and(eq(positions.id, positionId), eq(positions.isActive, true))).limit(1);
  if (!position) return { ok: false, message: "ไม่พบตำแหน่งที่เลือก" };
  let requestedScope: ReturnType<typeof parseAssignmentScope>;
  try { requestedScope = parseAssignmentScope(form.get("scopeType") || position.scopeType, form.getAll("selectedTeamId")); }
  catch { return { ok: false, message: "ขอบเขต SELECTED_TEAMS ต้องเลือกอย่างน้อยหนึ่งทีม" }; }
  if (requestedScope.scopeType === "TEAM" && !/^[0-9a-f-]{36}$/i.test(teamId)) return { ok: false, message: "ขอบเขต TEAM ต้องกำหนดทีมหลัก" };
  if (teamId && !(await getDb().select({ id: teams.id }).from(teams).where(and(eq(teams.id, teamId), eq(teams.isActive, true))).limit(1)).length) {
    return { ok: false, message: "ไม่พบทีมที่เลือก" };
  }
  if (requestedScope.selectedTeamIds.length) {
    const validTeams = await getDb().select({ id: teams.id }).from(teams).where(and(inArray(teams.id, requestedScope.selectedTeamIds), eq(teams.isActive, true)));
    if (validTeams.length !== requestedScope.selectedTeamIds.length) return { ok: false, message: "มีทีมในขอบเขตที่ไม่พร้อมใช้งาน" };
  }

  const [before] = await getDb().select({ email: profiles.email, displayName: profiles.displayName, employeeCode: profiles.employeeCode,
    status: profiles.status, positionId: profiles.positionId, teamId: userTeams.teamId, roleCode: roles.code,
    assignmentRoleId: userRoleAssignments.roleId })
    .from(profiles).leftJoin(positions, eq(positions.id, profiles.positionId)).leftJoin(roles, eq(roles.id, positions.roleId))
    .leftJoin(userTeams, and(eq(userTeams.userId, profiles.id), eq(userTeams.isPrimary, true)))
    .leftJoin(userRoleAssignments, and(eq(userRoleAssignments.userId, profiles.id), isNull(userRoleAssignments.validUntil)))
    .where(eq(profiles.id, userId)).limit(1);
  if (!before) return { ok: false, message: "ไม่พบบัญชีผู้ใช้ที่ต้องการแก้ไข" };
  const beforeGrants = await getDb().select({ scopeType: dataScopeGrants.scopeType, selectedTeamId: dataScopeGrants.selectedTeamId })
    .from(userRoleAssignments).innerJoin(dataScopeGrants, eq(dataScopeGrants.assignmentId, userRoleAssignments.id))
    .where(and(eq(userRoleAssignments.userId, userId), isNull(userRoleAssignments.validUntil), isNull(dataScopeGrants.permissionCode)));

  const removesAdminAccess = before.roleCode === "platform_admin" && (position.roleCode !== "platform_admin" || status !== "active");
  const normalizedTeamId = teamId || null;
  const currentScope = beforeGrants[0]?.scopeType;
  const currentSelected = beforeGrants.map((grant) => grant.selectedTeamId).filter(Boolean).sort().join(",");
  const requestedSelected = [...requestedScope.selectedTeamIds].sort().join(",");
  const accessChanged = before.positionId !== positionId || before.teamId !== normalizedTeamId || before.assignmentRoleId !== position.roleId ||
    currentScope !== requestedScope.scopeType || currentSelected !== requestedSelected;
  const statusChanged = before.status !== status;
  const after = { email, displayName, employeeCode: employeeCode || null, status, positionId, teamId: normalizedTeamId,
    roleId: position.roleId, scopeType: requestedScope.scopeType, selectedTeamIds: requestedScope.selectedTeamIds };
  try {
    await runMaterialChange({ audit: { actorId: access.userId, moduleId: "core", action: "user.access.update", entityType: "profile",
      entityId: userId, requestId: crypto.randomUUID(), before, after, metadata: { sessionsRevoked: accessChanged || statusChanged } } }, async (tx) => {
      const now = new Date();
      if (removesAdminAccess) {
        await tx.execute(sql`select ${roles.id} from ${roles} where ${roles.code} = 'platform_admin' for update`);
        const otherAdmins = await tx.select({ id: profiles.id }).from(profiles)
          .innerJoin(positions, eq(positions.id, profiles.positionId)).innerJoin(roles, eq(roles.id, positions.roleId))
          .where(and(eq(profiles.status, "active"), eq(roles.code, "platform_admin"), ne(profiles.id, userId))).limit(1);
        if (!otherAdmins.length) throw new Error("LAST_PLATFORM_ADMIN");
      }
      await tx.update(profiles).set({ email, displayName, employeeCode: employeeCode || null, status, positionId, updatedAt: now }).where(eq(profiles.id, userId));
      if (accessChanged) {
        await tx.update(userRoleAssignments).set({ validUntil: now }).where(and(eq(userRoleAssignments.userId, userId), isNull(userRoleAssignments.validUntil)));
        await tx.delete(userTeams).where(eq(userTeams.userId, userId));
        if (normalizedTeamId) await tx.insert(userTeams).values({ userId, teamId: normalizedTeamId, isPrimary: true });
        const [assignment] = await tx.insert(userRoleAssignments).values({ userId, roleId: position.roleId, teamId: normalizedTeamId, createdBy: access.userId })
          .returning({ id: userRoleAssignments.id });
        if (requestedScope.scopeType === "SELECTED_TEAMS") {
          await tx.insert(dataScopeGrants).values(requestedScope.selectedTeamIds.map((selectedTeamId) => ({ assignmentId: assignment.id, scopeType: requestedScope.scopeType, selectedTeamId })));
        } else {
          await tx.insert(dataScopeGrants).values({ assignmentId: assignment.id, scopeType: requestedScope.scopeType });
        }
      }
      if ((accessChanged || statusChanged) && userId !== access.userId) await tx.delete(authSessions).where(eq(authSessions.userId, userId));
    });
    revalidatePath("/admin");
    return { ok: true, message: `บันทึกข้อมูลและสิทธิ์ของ ${displayName} แล้ว` };
  } catch (error) {
    if (error instanceof Error && error.message === "LAST_PLATFORM_ADMIN") return { ok: false, message: "ไม่สามารถลดสิทธิ์ผู้ดูแลระบบคนสุดท้ายได้" };
    console.error("Unable to update user access", error);
    return { ok: false, message: "บันทึกไม่สำเร็จ อีเมลหรือรหัสพนักงานอาจซ้ำกับบัญชีอื่น" };
  }
}

export async function resetPasswordAction(_state: AdminActionState, form: FormData): Promise<AdminActionState> {
  const access = await requireAdmin();
  if (!access) return denied;
  const userId = String(form.get("userId") || "");
  const password = String(form.get("password") || "");
  if (!/^[0-9a-f-]{36}$/i.test(userId) || !validPassword(password)) return { ok: false, message: "รหัสผ่านต้องมีอย่างน้อย 12 ตัว และมีตัวอักษร ตัวเลข และสัญลักษณ์" };
  const [target] = await getDb().select({ id: profiles.id }).from(profiles).where(eq(profiles.id, userId)).limit(1);
  if (!target) return { ok: false, message: "ไม่พบบัญชีผู้ใช้" };
  const passwordHash = await hash(password, passwordOptions);
  await runMaterialChange({ audit: { actorId: access.userId, moduleId: "core", action: "user.password.reset", entityType: "profile",
    entityId: userId, requestId: crypto.randomUUID(), metadata: { sessionsRevoked: true } } }, async (tx) => {
    await tx.update(localCredentials).set({ passwordHash, failedAttempts: 0, lockedUntil: null, mustChangePassword: true, passwordChangedAt: new Date(), updatedAt: new Date() }).where(eq(localCredentials.userId, userId));
    await tx.delete(authSessions).where(eq(authSessions.userId, userId));
  });
  revalidatePath("/admin");
  return { ok: true, message: "รีเซ็ตรหัสผ่านและออกจากระบบทุกอุปกรณ์แล้ว" };
}

export async function revokeUserSessionsAction(_state: AdminActionState, form: FormData): Promise<AdminActionState> {
  const access = await requireAdmin();
  if (!access) return denied;
  const userId = String(form.get("userId") || "");
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return { ok: false, message: "ไม่พบบัญชีผู้ใช้" };
  const [target] = await getDb().select({ id: profiles.id, email: profiles.email }).from(profiles).where(eq(profiles.id, userId)).limit(1);
  if (!target) return { ok: false, message: "ไม่พบบัญชีผู้ใช้" };
  await runMaterialChange({ audit: { actorId: access.userId, moduleId: "core", action: "user.sessions.revoke", entityType: "profile", entityId: userId, requestId: crypto.randomUUID(), metadata: { allSessions: true } } }, async (tx) => {
    await tx.delete(authSessions).where(eq(authSessions.userId, userId));
  });
  revalidatePath("/admin");
  return { ok: true, message: `ยกเลิกเซสชันทั้งหมดของ ${target.email} แล้ว` };
}
