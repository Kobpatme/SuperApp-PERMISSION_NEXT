import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ access: vi.fn(), save: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ getSessionFailureReason: async () => "expired" }));
vi.mock("./access", () => ({ getAccessContext: mocks.access }));
vi.mock("./building-editor-server", async importOriginal => {
  const original = await importOriginal<typeof import("./building-editor-server")>();
  return { ...original, saveBuildingRecord: mocks.save };
});
import { mutateBuildingRequest } from "./building-editor-api";
import { BuildingEditorError } from "./building-editor-server";
const id = "00000000-0000-4000-8000-000000000901";
function request(input: unknown = { nameTh: "อาคารทดสอบ" }, origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/buildings", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(input) });
}
beforeEach(() => { vi.clearAllMocks(); mocks.access.mockResolvedValue({ userId: id, allowed: true, passwordChangeRequired: false }); mocks.save.mockResolvedValue(id); });
describe("building editor API guards", () => {
  it("rejects missing identity, forced password and cross-origin calls before mutation", async () => {
    mocks.access.mockResolvedValueOnce({ userId: "" }); expect((await mutateBuildingRequest(request())).status).toBe(401);
    mocks.access.mockResolvedValueOnce({ userId: id, allowed: true, passwordChangeRequired: true }); expect((await mutateBuildingRequest(request())).status).toBe(403);
    expect((await mutateBuildingRequest(request(undefined, "https://other.example"))).status).toBe(403);
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it("requires a valid id, concurrency version and reason for updates", async () => {
    expect((await mutateBuildingRequest(request(), "bad-id")).status).toBe(400);
    expect((await mutateBuildingRequest(request(), id)).status).toBe(400);
    expect((await mutateBuildingRequest(request({ nameTh: "อาคารทดสอบ", version: 1, reason: "แก้ไข" }), id)).status).toBe(200);
    expect(mocks.save).toHaveBeenCalledTimes(1);
  });
  it("validates money before creating and returns a created record only after service completion", async () => {
    expect((await mutateBuildingRequest(request({ nameTh: "อาคารทดสอบ", fees: { main_fee: "-1" } }))).status).toBe(400);
    expect(mocks.save).not.toHaveBeenCalled();
    const result = await mutateBuildingRequest(request()); expect(result.status).toBe(201); expect(await result.json()).toEqual({ id, saved: true });
  });
  it.each(["building_changed", "building_duplicate"] as const)("returns a conflict without leaking records for %s", async code => {
    mocks.save.mockRejectedValue(new BuildingEditorError(code)); const result = await mutateBuildingRequest(request());
    expect(result.status).toBe(409); expect(await result.json()).toEqual({ error: code });
  });
  it("does not expose unexpected database errors", async () => {
    mocks.save.mockRejectedValue(new Error("private database details"));
    const result = await mutateBuildingRequest(request()); expect(result.status).toBe(500); expect(await result.json()).toEqual({ error: "building_save_failed" });
  });
});
