import { z } from "zod";

export const buildingFilterKeys = ["status", "group", "type", "installType", "surveyType", "area"] as const;
export const buildingQuerySchema = z.object({
  query: z.string().trim().max(120).default(""),
  page: z.coerce.number().int().positive().max(100_000).default(1),
  limit: z.coerce.number().int().min(20).max(200).default(100),
  status: z.string().trim().max(120).default(""), group: z.string().trim().max(120).default(""),
  type: z.string().trim().max(120).default(""), installType: z.string().trim().max(120).default(""),
  surveyType: z.string().trim().max(120).default(""), area: z.string().trim().max(120).default(""),
});
export type BuildingQuery = z.infer<typeof buildingQuerySchema>;

export function parseBuildingQuery(params: Record<string, string | string[] | undefined>): BuildingQuery {
  const scalar = (key: string) => typeof params[key] === "string" ? params[key] : undefined;
  return buildingQuerySchema.parse({ query: scalar("q"), page: scalar("page"), limit: scalar("limit"),
    status: scalar("status"), group: scalar("group"), type: scalar("type"), installType: scalar("installType"),
    surveyType: scalar("surveyType"), area: scalar("area") });
}

export function buildingQueryParams(query: BuildingQuery, page = query.page) {
  return new URLSearchParams(Object.entries({ q: query.query, status: query.status, group: query.group, type: query.type,
    installType: query.installType, surveyType: query.surveyType, area: query.area, page: String(page) }).filter(([, value]) => value));
}
