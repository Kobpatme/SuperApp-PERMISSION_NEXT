import { z } from "zod";
import { getWorkflowStatusKey, sortCompletedLast, type DepositItem } from "./deposit-v2-domain";
export const depositListQuery = z.object({
  q: z.string().trim().max(200).default(""), status: z.string().max(60).default(""), owner: z.string().max(200).default(""), area: z.string().max(200).default(""),
  view: z.enum(["dashboard", "queue", "list", "on_service", "done", "analytics"]).default("list"), sort: z.enum(["default", "asc", "desc"]).default("default"),
  page: z.coerce.number().int().min(1).max(100000).default(1), team: z.string().uuid().optional(), installation: z.enum(["0", "1"]).default("0"),
  year: z.string().regex(/^\d{4}$/).or(z.literal("")).default(""), month: z.string().regex(/^(?:[0-9]|1[01])$/).or(z.literal("")).default(""),
});
export type DepositListQuery = z.infer<typeof depositListQuery>;
const normalized = (value: unknown) => String(value ?? "").trim().toLocaleLowerCase("th-TH");
export function filterDepositList<T extends DepositItem>(items: T[], query: DepositListQuery) {
  const rows = items.filter(item => {
    const workflow = getWorkflowStatusKey(item);
    return (!query.status || workflow === query.status) && (!query.owner || item.owner === query.owner) && (!query.area || item.area === query.area)
      && (query.view !== "on_service" || ["on_service", "off_service_pending"].includes(workflow)) && (query.view !== "done" || workflow === "done")
      && [item.cid, item.no, item.place, item.customer, item.owner, item.pr, item.area].map(normalized).join(" ").includes(normalized(query.q));
  });
  if (query.sort !== "default") return rows.sort((a, b) => String(a.no || "").localeCompare(String(b.no || ""), "th", { numeric: true }) * (query.sort === "asc" ? 1 : -1));
  return sortCompletedLast(rows, (a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")) || String(b.id).localeCompare(String(a.id)));
}
