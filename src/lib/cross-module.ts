import { isAuthorized, type AuthorizationSubject, type ResourceScope } from "@/lib/authorization";
import { normalizeBuildingAlias } from "@/lib/buildings";

export type SearchRecord = ResourceScope & {
  id: string; type: "building" | "task" | "guarantee" | "estimate"; title: string; subtitle?: string;
  href: string; permission: string; terms: readonly string[];
};

export function searchWorkspace(subject: AuthorizationSubject, query: string, records: readonly SearchRecord[], limit = 20) {
  const needle = normalizeBuildingAlias(query);
  if (needle.length < 2) return [];
  return records.filter((record) => isAuthorized(subject, record.permission, record))
    .map((record) => {
      const title = normalizeBuildingAlias(record.title);
      const haystack = normalizeBuildingAlias([record.title, record.subtitle, ...record.terms].filter(Boolean).join(" "));
      const score = title === needle ? 100 : title.startsWith(needle) ? 70 : haystack.includes(needle) ? 30 : 0;
      return { record, score };
    }).filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.record.title.localeCompare(b.record.title, "th"))
    .slice(0, Math.max(1, Math.min(limit, 100))).map(({ record }) => record);
}

export type Building360Source = { id: string; buildingId: string; occurredAt?: Date; [key: string]: unknown };
export function assembleBuilding360<T extends Building360Source>(buildingId: string, sources: Record<string, readonly T[]>) {
  const sections = Object.fromEntries(Object.entries(sources).map(([key, rows]) => [key, rows.filter((row) => row.buildingId === buildingId).sort((a, b) => (b.occurredAt?.getTime() ?? 0) - (a.occurredAt?.getTime() ?? 0))]));
  return { buildingId, sections };
}

export type WorkspaceCommand = { id: string; label: string; href: string; permission: string };
export function availableCommands(subject: AuthorizationSubject, commands: readonly WorkspaceCommand[]) {
  const granted = new Set(subject.grants.map((grant) => grant.permission));
  return commands.filter((command) => granted.has(command.permission));
}
