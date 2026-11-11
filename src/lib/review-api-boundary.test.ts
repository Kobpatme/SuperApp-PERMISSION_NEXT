import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ identity: vi.fn(), list: vi.fn(), export: vi.fn(), buildings: vi.fn() }));
vi.mock("@/lib/request-context", () => ({ requireApiIdentity: mocks.identity }));
vi.mock("@/lib/deposit-list-server", () => ({ readDepositListPage: mocks.list, readDepositList: mocks.export }));
vi.mock("@/lib/permission-building-server", () => ({ listPermissionBuildings: mocks.buildings }));
import { GET as list } from "@/app/api/guarantees/list/route";
import { GET as exportCsv } from "@/app/api/guarantees/export/route";
import { GET as buildings } from "@/app/api/buildings/list/route";
beforeEach(() => { vi.resetAllMocks(); mocks.identity.mockResolvedValue({ ok: true, user: { id: "fixture" } }); });
it("rejects unauthenticated list/export/map requests before any database loader", async () => {
  mocks.identity.mockResolvedValue({ ok: false, response: Response.json({ code: "AUTHENTICATION_REQUIRED" }, { status: 401 }) });
  for (const handler of [list, exportCsv, buildings]) expect((await handler(new Request("http://fixture/api"))).status).toBe(401);
  for (const loader of [mocks.list, mocks.export, mocks.buildings]) expect(loader).not.toHaveBeenCalled();
});
it("validates list filters before executing the query", async () => {
  expect((await list(new Request("http://fixture/api?team=forged"))).status).toBe(400); expect(mocks.list).not.toHaveBeenCalled();
});
it("exports more than 500 authorized records and neutralizes spreadsheet formulas", async () => {
  mocks.export.mockResolvedValue({ filtered: Array.from({ length: 620 }, (_, i) => ({ cid: i === 619 ? " =HYPERLINK(1)" : `CID-${i}`, no: String(i), status: "new", dateReq: "2026-01-01", deposit: "1" })) });
  const response = await exportCsv(new Request("http://fixture/api?year=2026&month=0"));
  const csv = await response.text(); expect(response.status).toBe(200); expect(csv.split("\r\n")).toHaveLength(621); expect(csv).toContain("' =HYPERLINK(1)"); expect(response.headers.get("cache-control")).toContain("no-store");
});
it("preserves January's zero-based month filter and excludes February", async () => {
  mocks.export.mockResolvedValue({ filtered: [{ cid: "JAN", status: "new", dateReq: "2026-01-01" }, { cid: "FEB", status: "new", dateReq: "2026-02-01" }] });
  const csv = await (await exportCsv(new Request("http://fixture/api?month=0"))).text(); expect(csv).toContain("JAN"); expect(csv).not.toContain("FEB");
});
it("does not turn a failed full-list query into an empty success or expose driver errors", async () => {
  mocks.list.mockRejectedValue(new Error("private query parameters"));
  const response = await list(new Request("http://fixture/api")); expect(response.status).toBe(503); expect(await response.text()).not.toContain("private");
});
