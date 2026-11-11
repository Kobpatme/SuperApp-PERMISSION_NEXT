import "server-only";
import { getDb } from "@/db";
import { getAccessContext } from "./access";
import { listDepositWorkItems, type DepositRecord } from "./deposit-v2-server";
import { filterDepositList, type DepositListQuery } from "./deposit-list-query";
import { getListPageKpiMetrics, getSidebarFinancialMetrics, parseDateValue } from "./deposit-v2-domain";

/** Walk authorized keyset pages. Never truncate a search/export at a UI row limit. */
export async function readDepositList(query: DepositListQuery) {
  const access = await getAccessContext("guarantees");
  if (!access.allowed) throw new Error("DEPOSIT_FORBIDDEN");
  return getDb().transaction(async tx => {
  const items: DepositRecord[] = [];
  let cursor: { updatedAt: string; id: string } | undefined;
  for (;;) {
    const page = await listDepositWorkItems(500, query.team, query.installation === "1", cursor, tx, access, query.q);
    if (page.state !== "ready") throw new Error("DEPOSIT_UNAVAILABLE");
    items.push(...page.items);
    const last = page.items.at(-1);
    if (!page.truncated || !last) break;
    cursor = { updatedAt: last.updatedAt, id: last.id };
  }
  const filtered = filterDepositList(items, query);
  return { filtered, owners: [...new Set(items.map(item => item.owner).filter(Boolean))].sort(), areas: [...new Set(items.map(item => item.area).filter(Boolean))].sort(), years: [...new Set(items.map(item => parseDateValue(item.dateReq)?.getFullYear()).filter((year): year is number => !!year))].sort((a, b) => b - a), kpis: getListPageKpiMetrics(filtered), finance: getSidebarFinancialMetrics(filtered) };
  }, { isolationLevel: "repeatable read", accessMode: "read only" });
}
export async function readDepositListPage(query: DepositListQuery) {
  const { filtered, ...summary } = await readDepositList(query);
  const page = Math.min(query.page, Math.max(1, Math.ceil(filtered.length / 20)));
  return { ...summary, items: filtered.slice((page - 1) * 20, page * 20), total: filtered.length, page };
}
export type DepositListPage = Awaited<ReturnType<typeof readDepositListPage>>;
