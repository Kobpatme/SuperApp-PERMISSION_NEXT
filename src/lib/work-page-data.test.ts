import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ access: vi.fn(), model: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/access", () => ({ getAccessContext: mocks.access }));
vi.mock("@/lib/work-read-model", () => ({ getWorkReadModel: mocks.model }));
import { loadWorkPage } from "@/lib/work-page-data";
const userId = "00000000-0000-4000-8000-000000000001";
const other = "00000000-0000-4000-8000-000000000002";
beforeEach(() => { vi.clearAllMocks(); mocks.access.mockResolvedValue({ allowed: true, userId, permissions: ["work.task.read"] }); });
it("pushes personal ownership into the read model before its row limit, overriding a forged owner filter", async () => {
  await loadWorkPage("work.task.read", { owner: other, status: "queued" }, true);
  expect(mocks.model).toHaveBeenCalledWith(expect.anything(), { owner: userId, status: "queued" }, undefined);
});
it("preserves other-owner filters for the team workspace", async () => {
  await loadWorkPage("work.task.read", { owner: other });
  expect(mocks.model).toHaveBeenCalledWith(expect.anything(), { owner: other }, undefined);
});
it("does not query the read model when access is denied", async () => {
  mocks.access.mockResolvedValue({ allowed: false, permissions: [] });
  expect(await loadWorkPage("work.task.read", {}, true)).toBeNull();
  expect(mocks.model).not.toHaveBeenCalled();
});
