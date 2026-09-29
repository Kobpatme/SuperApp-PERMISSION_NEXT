import "server-only";
import { and, desc, eq, gt, inArray, isNull, lte, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { dataScopeGrants, guaranteeWorkEvents, guaranteeWorkItems, profiles, roles, userRoleAssignments } from "@/db/schema";
import { getAccessContext, type AccessContext } from "@/lib/access";
import { isAssignedGuaranteeTl, isAuthorized } from "@/lib/authorization";
import type { DepositItem } from "@/lib/deposit-v2-domain";

export type DepositRecord = DepositItem & { id: string; ownerId: string; teamId: string | null; tlAssigneeId: string | null; version: number; status: string; place: string; createdAt: string; updatedAt: string };

export function canWorkAsAssignedTl(access: AccessContext, item: { tlAssigneeId?: string | null }) {
  return isAssignedGuaranteeTl(access.subject, item.tlAssigneeId);
}

export function canCreateDepositWorkItem(access: AccessContext) {
  const teamIds = access.subject?.teamIds ?? [];
  return isAuthorized(access.subject, "guarantee.case.create", { ownerId: access.userId }) ||
    isAuthorized(access.subject, "guarantee.case.manage", { ownerId: access.userId }) ||
    teamIds.some((teamId) => isAuthorized(access.subject, "guarantee.case.create", { ownerId: access.userId, teamId }) ||
      isAuthorized(access.subject, "guarantee.case.manage", { ownerId: access.userId, teamId }));
}

function scopeCondition(access: AccessContext): SQL | undefined {
  const grants = access.subject?.grants.filter((grant) => grant.permission === "guarantee.case.read") ?? [];
  const tlScope = access.subject?.grants.some((grant) => grant.permission === "guarantee.tl.work" &&
    (grant.scope === "OWN" || grant.scope === "ALL"));
  if (!grants.length && !tlScope) return undefined;
  if (grants.some((grant) => grant.scope === "ALL")) return eq(guaranteeWorkItems.id, guaranteeWorkItems.id);
  const conditions: SQL[] = [];
  if (tlScope) conditions.push(eq(guaranteeWorkItems.tlAssigneeId, access.userId));
  if (grants.some((grant) => grant.scope === "OWN")) conditions.push(eq(guaranteeWorkItems.ownerId, access.userId));
  if (grants.some((grant) => grant.scope === "TEAM") && access.subject?.teamIds.length) conditions.push(inArray(guaranteeWorkItems.teamId, [...access.subject.teamIds]));
  const selected = grants.filter((grant) => grant.scope === "SELECTED_TEAMS" && grant.selectedTeamId).map((grant) => grant.selectedTeamId!);
  if (selected.length) conditions.push(inArray(guaranteeWorkItems.teamId, selected));
  return conditions.length ? or(...conditions) : undefined;
}

function toRecord(row: typeof guaranteeWorkItems.$inferSelect): DepositRecord {
  return { ...row.data, id: row.id, ownerId: row.ownerId, teamId: row.teamId, tlAssigneeId: row.tlAssigneeId, status: row.status,
    place: row.place, area: row.area || String(row.data.area || ""), version: row.version,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() } as DepositRecord;
}

export async function listDepositWorkItems(limit = 500, requestedTeamId?: string, installationTeamOnly = false): Promise<{ items: DepositRecord[]; state: "ready" | "not_configured" | "unavailable"; truncated: boolean; generatedAt: string }> {
  const generatedAt = new Date().toISOString();
  const access = await getAccessContext("guarantees");
  if (!access.allowed) return { items: [], state: "unavailable", truncated: false, generatedAt };
  if (!process.env.DATABASE_URL) return { items: [], state: "not_configured", truncated: false, generatedAt };
  const baseScope = scopeCondition(access);
  if (requestedTeamId && !/^[0-9a-f-]{36}$/i.test(requestedTeamId)) return { items: [], state: "ready", truncated: false, generatedAt };
  const canViewRequestedTeam = !requestedTeamId || access.subject?.grants.some((grant) => grant.permission === "guarantee.case.read" &&
    (grant.scope === "ALL" || (grant.scope === "TEAM" && access.subject?.teamIds.includes(requestedTeamId)) ||
      (grant.scope === "SELECTED_TEAMS" && grant.selectedTeamId === requestedTeamId)));
  if (!canViewRequestedTeam) return { items: [], state: "ready", truncated: false, generatedAt };
  if (!baseScope) return { items: [], state: "ready", truncated: false, generatedAt };
  const installationTeamScope = or(
    eq(guaranteeWorkItems.status, "tl"),
    and(eq(guaranteeWorkItems.status, "On Process"), sql`lower(coalesce(${guaranteeWorkItems.data}->>'complete_tl', '')) = 'on process'`),
    and(eq(guaranteeWorkItems.status, "done"), sql`lower(coalesce(${guaranteeWorkItems.data}->>'off_service_status', '')) = 'pending'`),
  );
  const scope = and(baseScope, requestedTeamId ? eq(guaranteeWorkItems.teamId, requestedTeamId) : undefined, installationTeamOnly ? installationTeamScope : undefined);
  try {
    const rows = await getDb().select().from(guaranteeWorkItems).where(scope).orderBy(desc(guaranteeWorkItems.updatedAt)).limit(limit + 1);
    return { items: rows.slice(0, limit).filter((row) => isAuthorized(access.subject, "guarantee.case.read", { ownerId: row.ownerId, teamId: row.teamId }) || canWorkAsAssignedTl(access, row)).map(toRecord), state: "ready", truncated: rows.length > limit, generatedAt };
  } catch (error) {
    console.error("Unable to load guarantee work items", error);
    return { items: [], state: "unavailable", truncated: false, generatedAt };
  }
}

export async function getDepositWorkItem(id: string): Promise<DepositRecord | null> {
  const access = await getAccessContext("guarantees");
  if (!access.allowed || !process.env.DATABASE_URL) return null;
  const scope = scopeCondition(access);
  if (!scope) return null;
  const [row] = await getDb().select().from(guaranteeWorkItems).where(and(eq(guaranteeWorkItems.id, id), scope)).limit(1);
  if (!row || (!isAuthorized(access.subject, "guarantee.case.read", { ownerId: row.ownerId, teamId: row.teamId }) && !canWorkAsAssignedTl(access, row))) return null;
  return toRecord(row);
}

export async function listTlAssignees() {
  const access = await getAccessContext("guarantees");
  if (!access.allowed || !process.env.DATABASE_URL) return [];
  const now = new Date();
  const rows = await getDb().select({ id: profiles.id, displayName: profiles.displayName })
    .from(userRoleAssignments).innerJoin(roles, eq(roles.id, userRoleAssignments.roleId))
    .innerJoin(profiles, eq(profiles.id, userRoleAssignments.userId))
    .innerJoin(dataScopeGrants, eq(dataScopeGrants.assignmentId, userRoleAssignments.id))
    .where(and(eq(roles.code, "guarantee_tl"), eq(profiles.status, "active"),
      or(eq(dataScopeGrants.permissionCode, "guarantee.tl.work"), isNull(dataScopeGrants.permissionCode)), inArray(dataScopeGrants.scopeType, ["OWN", "ALL"]),
      lte(userRoleAssignments.validFrom, now), or(isNull(userRoleAssignments.validUntil), gt(userRoleAssignments.validUntil, now))));
  return [...new Map(rows.map((row) => [row.id, row])).values()];
}

export async function getDepositWorkEvents(id: string) {
  const item = await getDepositWorkItem(id);
  if (!item) return [];
  return getDb().select({ id: guaranteeWorkEvents.id, action: guaranteeWorkEvents.action,
    fromStatus: guaranteeWorkEvents.fromStatus, toStatus: guaranteeWorkEvents.toStatus,
    reason: guaranteeWorkEvents.reason, occurredAt: guaranteeWorkEvents.occurredAt })
    .from(guaranteeWorkEvents).where(eq(guaranteeWorkEvents.itemId, id)).orderBy(desc(guaranteeWorkEvents.occurredAt)).limit(50);
}
