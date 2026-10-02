import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ access: vi.fn(), remove: vi.fn() }));
vi.mock("@/lib/access", () => ({ getAccessContext: mocks.access }));
vi.mock("@/lib/building-delete-server", () => ({ deleteBuildingRecord: mocks.remove,
  BuildingDeleteError: class extends Error { constructor(readonly code: string) { super(code); } } }));
import { DELETE } from "./route";
import { BuildingDeleteError } from "@/lib/building-delete-server";

const id = "ec0b26ca-42cd-4154-becf-edae00ded87a";
function request(body: unknown = { confirmationName: "อาคารทดสอบ", version: 1 }, origin = "http://localhost:3000") {
  return new Request(`http://localhost:3000/api/buildings/${id}`, { method: "DELETE", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
const context = { params: Promise.resolve({ id }) };
beforeEach(() => { vi.clearAllMocks(); mocks.access.mockResolvedValue({ userId: "admin", allowed: true, passwordChangeRequired: false, role: "admin" }); mocks.remove.mockResolvedValue(undefined); });

describe("building DELETE API", () => {
  it("returns 401 without a session", async () => { mocks.access.mockResolvedValue({ userId: "" }); expect((await DELETE(request(), context)).status).toBe(401); expect(mocks.remove).not.toHaveBeenCalled(); });
  it.each(["manager", "permission", "viewer"])("rejects non-admin %s", async (role) => {
    mocks.access.mockResolvedValue({ userId: "user", allowed: true, role }); expect((await DELETE(request(), context)).status).toBe(403); expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("rejects cross-origin deletion", async () => { expect((await DELETE(request(undefined, "https://other.example"), context)).status).toBe(403); expect(mocks.remove).not.toHaveBeenCalled(); });
  it("rejects invalid input and ids before mutation", async () => {
    expect((await DELETE(request({ version: 0 }), context)).status).toBe(400);
    expect((await DELETE(request(), { params: Promise.resolve({ id: "invalid" }) })).status).toBe(400);
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("executes validated deletion through the transaction service", async () => {
    const response = await DELETE(request(), context); expect(response.status).toBe(200); expect(await response.json()).toEqual({ deleted: true });
    expect(mocks.remove).toHaveBeenCalledWith(expect.objectContaining({ role: "admin" }), id, { confirmationName: "อาคารทดสอบ", version: 1 }, expect.any(String));
  });
  it.each(["building_changed", "building_has_dependencies"] as const)("returns conflict for %s", async (code) => {
    mocks.remove.mockRejectedValue(new BuildingDeleteError(code)); const response = await DELETE(request(), context); expect(response.status).toBe(409); expect(await response.json()).toEqual({ error: code });
  });
  it("hides internal errors", async () => { mocks.remove.mockRejectedValue(new Error("private database details")); const response = await DELETE(request(), context); expect(await response.json()).toEqual({ error: "building_delete_failed" }); });
});
