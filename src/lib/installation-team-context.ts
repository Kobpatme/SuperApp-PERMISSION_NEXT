import "server-only";
import { and, asc, eq, ilike, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { teams } from "@/db/schema";
import type { AccessContext } from "@/lib/access";

export type InstallationTeamOption = { id: string; code: string; name: string };
export type InstallationTeamContext = { teams: InstallationTeamOption[]; canViewAll: boolean };

export async function getInstallationTeamContext(access: AccessContext): Promise<InstallationTeamContext> {
  const grants = access.subject?.grants.filter((grant) => grant.permission === "guarantee.case.read") ?? [];
  const canViewAll = grants.some((grant) => grant.scope === "ALL");
  const allowedIds = access.subject?.teamIds ?? [];
  if (!canViewAll && !allowedIds.length) return { teams: [], canViewAll: false };
  const conditions = [eq(teams.isActive, true), ilike(teams.code, "installation_%")];
  if (!canViewAll) conditions.push(inArray(teams.id, [...allowedIds]));
  const rows = await getDb().select({ id: teams.id, code: teams.code, name: teams.name }).from(teams)
    .where(and(...conditions)).orderBy(asc(teams.name));
  return { teams: rows, canViewAll };
}

export function installationTeamCodeForArea(area: string) {
  const normalized = area.trim().toLocaleUpperCase("en-US");
  return ["BKK 1", "BKK 2", "BKK 3", "BKK 4", "CBI", "CMI", "PKT", "SNI"].includes(normalized)
    ? `installation_${normalized.toLocaleLowerCase("en-US").replace(/ /g, "_")}` : null;
}

export async function getInstallationTeamForArea(area: string) {
  const code = installationTeamCodeForArea(area);
  if (!code) return null;
  const [team] = await getDb().select({ id: teams.id, code: teams.code, name: teams.name }).from(teams)
    .where(and(eq(teams.code, code), eq(teams.isActive, true))).limit(1);
  return team ?? null;
}
