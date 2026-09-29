import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { teams } from "@/db/schema";

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
