import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ access: vi.fn(), model: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/access", () => ({ getAccessContext: mocks.access }));
vi.mock("@/lib/work-read-model", () => ({ getWorkReadModel: mocks.model }));
vi.mock("@/features/work/screens/my-work", () => ({ MyWorkDashboard: () => null, MyTasksScreen: () => null }));
vi.mock("@/features/work/screens/team-command", () => ({ TeamCommandScreen: () => null }));
vi.mock("@/features/work/screens/assignment-center", () => ({ AssignmentCenterScreen: () => null }));
vi.mock("@/features/work/screens/people-overview", () => ({ PeopleOverviewScreen: () => null }));
vi.mock("@/features/work/screens/job-tracker", () => ({ JobTrackerScreen: () => null }));
vi.mock("@/features/work/screens/kpi-workspace", () => ({ KpiWorkspaceScreen: () => null }));
vi.mock("@/features/work/screens/reports", () => ({ WorkReportsScreen: () => null }));
import { WorkRoutePage } from "@/components/work-route-page";
const userId = "00000000-0000-4000-8000-000000000001";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.access.mockResolvedValue({ allowed: true, userId, permissions: ["work.task.manage"] });
  mocks.model.mockResolvedValue({ generatedAt: "2026-10-08T00:00:00Z", tasks: [] });
});
it.each(["mine", "mine-list", "due"])("scopes %s to the current owner before fetching a limited task set", async (view) => {
  await WorkRoutePage({ view });
  expect(mocks.model).toHaveBeenCalledWith(expect.anything(), { owner: userId });
});
it("retains the authorized team scope for team views", async () => {
  await WorkRoutePage({ view: "team" });
  expect(mocks.model).toHaveBeenCalledWith(expect.anything(), {});
});
