import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ access: vi.fn(), work: vi.fn(), buildings: vi.fn(), guarantees: vi.fn(), car: vi.fn(), po: vi.fn(), duct: vi.fn() }));
vi.mock("./access", () => ({ getAllAccessContexts: async () => Object.fromEntries(await Promise.all(["work", "buildings", "guarantees", "car-booking", "po-tracking", "duct-rental"].map(async id => [id, await mocks.access(id)]))) }));
vi.mock("./module-registry", () => ({ modules: ["work", "buildings", "guarantees", "car-booking", "po-tracking", "duct-rental"].map(id => ({ id })) }));
vi.mock("./work-queue-server", () => ({ readWorkQueue: mocks.work }));
vi.mock("./permission-building-server", () => ({ listPermissionBuildings: mocks.buildings }));
vi.mock("./deposit-v2-server", () => ({ searchDepositWorkItems: mocks.guarantees }));
vi.mock("./car-booking-service", () => ({ searchCarBookings: mocks.car }));
vi.mock("@/modules/po-tracking/service", () => ({ listPoLines: mocks.po }));
vi.mock("@/modules/duct-rental/server/requests", () => ({ listRequests: mocks.duct }));
import { searchWorkspace } from "./workspace-search-server";
beforeEach(() => { vi.resetAllMocks(); mocks.access.mockImplementation(async (id: string) => ({ allowed: id === "work", userId: "fixture", subject: {} })); mocks.work.mockResolvedValue([]); });
it("never queries denied modules and does not build an entire dashboard to search", async () => {
  mocks.work.mockResolvedValue([{ id: "old", title: "Old task", href: "/work?record=old", statusLabel: "รอ" }]);
  const response = await searchWorkspace("Old task");
  expect(response.results[0].href).toBe("/work?record=old");
  expect(mocks.work).toHaveBeenCalledWith(expect.anything(), "Old task");
  for (const source of [mocks.buildings, mocks.guarantees, mocks.car, mocks.po, mocks.duct]) expect(source).not.toHaveBeenCalled();
});
it("uses detail URLs for buildings, guarantees, PO and duct records", async () => {
  mocks.access.mockImplementation(async (id: string) => ({ allowed: !["work", "car-booking"].includes(id), userId: "fixture", subject: {} }));
  mocks.buildings.mockResolvedValue({ state: "ready", items: [{ id: "b", nameTh: "Building" }] });
  mocks.guarantees.mockResolvedValue([{ id: "g", place: "Guarantee" }]);
  mocks.po.mockResolvedValue({ rows: [{ id: "p", poNumber: "PO", materialCode: "M", description: "material" }] });
  mocks.duct.mockResolvedValue({ rows: [{ id: "d", projectName: "Project", code: "RQ", routeName: "Route" }] });
  expect((await searchWorkspace("query")).results.map(row => row.href)).toEqual(["/buildings/b", "/guarantees/g", "/po-tracking/p", "/duct-rental/d"]);
});
it("returns available sources and marks partial failure without leaking an error", async () => {
  mocks.access.mockResolvedValue({ allowed: true, userId: "fixture", subject: {} });
  mocks.buildings.mockRejectedValue(new Error("private connection metadata"));
  mocks.guarantees.mockResolvedValue([]); mocks.car.mockResolvedValue([]); mocks.po.mockResolvedValue({ rows: [] }); mocks.duct.mockResolvedValue({ rows: [] });
  const result = await searchWorkspace("query"); expect(result.partial).toBe(true); expect(JSON.stringify(result)).not.toContain("private");
});
