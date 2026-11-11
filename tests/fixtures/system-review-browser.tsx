import { createRoot } from "react-dom/client";
import { DepositWorkspace } from "../../src/components/deposit-workspace";
import { depositListQuery, filterDepositList } from "../../src/lib/deposit-list-query";
import { getListPageKpiMetrics, getSidebarFinancialMetrics } from "../../src/lib/deposit-v2-domain";
const items = Array.from({ length: 620 }, (_, index) => ({ id: `fixture-${index}`, cid: `CID-${index}`, no: String(index), place: index === 619 ? "รายการเก่าทดสอบ" : `อาคารทดสอบ ${index}`, status: "new", owner: "ผู้ใช้จำลอง", area: "CMI", dateReq: "2026-01-01", updatedAt: "2026-01-01T00:00:00Z", deposit: "1" }));
window.fetch = async input => {
  const url = new URL(String(input), window.location.href);
  if (url.pathname !== "/api/guarantees/list") return new Response(null, { status: 404 });
  const query = depositListQuery.parse(Object.fromEntries(url.searchParams)), filtered = filterDepositList(items, query);
  return Response.json({ items: filtered.slice((query.page - 1) * 20, query.page * 20), total: filtered.length, page: query.page, owners: ["ผู้ใช้จำลอง"], areas: ["CMI"], years: [2026], kpis: getListPageKpiMetrics(filtered), finance: getSidebarFinancialMetrics(filtered) });
};
createRoot(document.getElementById("root")!).render(<DepositWorkspace items={items.slice(0, 500)} preview={false} state="ready" truncated generatedAt="2026-01-01T00:00:00Z" canCreate={false} canPreview={false}/>);
