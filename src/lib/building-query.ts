import { z } from "zod";

export const buildingFilterKeys = ["status", "group", "type", "installType", "surveyType", "area"] as const;
export const defaultBuildingPageSize = 2_000;
export const buildingQuerySchema = z.object({
  query: z.string().trim().max(120).default(""),
  page: z.coerce.number().int().positive().max(100_000).default(1),
  limit: z.coerce.number().int().min(20).max(defaultBuildingPageSize).default(defaultBuildingPageSize),
  after: z.string().regex(/^(?:[A-Za-z0-9_-]+)?$/).max(500).default(""),
  before: z.string().regex(/^(?:[A-Za-z0-9_-]+)?$/).max(500).default(""),
  status: z.string().trim().max(120).default(""), group: z.string().trim().max(120).default(""),
  type: z.string().trim().max(120).default(""), installType: z.string().trim().max(120).default(""),
  surveyType: z.string().trim().max(120).default(""), area: z.string().trim().max(120).default(""),
});
export type BuildingQuery = z.infer<typeof buildingQuerySchema>;

export function parseBuildingQuery(params: Record<string, string | string[] | undefined>): BuildingQuery {
  const scalar = (key: string) => typeof params[key] === "string" ? params[key] : undefined;
  const parsed = buildingQuerySchema.parse({ query: scalar("q"), page: scalar("page"), limit: scalar("limit"), after: scalar("after"), before: scalar("before"),
    status: scalar("status"), group: scalar("group"), type: scalar("type"), installType: scalar("installType"),
    surveyType: scalar("surveyType"), area: scalar("area") });
  if (parsed.after && parsed.before) throw new Error("Only one building cursor direction is allowed");
  return parsed;
}

export function buildingQueryParams(query: BuildingQuery, navigation: { page?: number; after?: string; before?: string } = {}) {
  return new URLSearchParams(Object.entries({ q: query.query, status: query.status, group: query.group, type: query.type,
    installType: query.installType, surveyType: query.surveyType, area: query.area, page: String(navigation.page ?? query.page),
    after: navigation.after ?? query.after, before: navigation.before ?? query.before }).filter(([, value]) => value));
}

export type BuildingCursor = { nameTh: string; id: string };
export function encodeBuildingCursor(value: BuildingCursor) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}
export function decodeBuildingCursor(value: string): BuildingCursor | null {
  if (!value) return null;
  try {
    const parsed = z.object({ nameTh: z.string().max(500), id: z.string().uuid() }).parse(JSON.parse(Buffer.from(value, "base64url").toString("utf8")));
    return parsed;
  } catch { return null; }
}
