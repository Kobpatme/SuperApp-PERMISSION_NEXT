import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { WorkReadModel } from "@/lib/work-read-model";
import { isWorkView } from "@/lib/work-view";
import { TeamCommandScreen } from "./team-command";
import { AssignmentCenterScreen } from "./assignment-center";
import { PeopleOverviewScreen } from "./people-overview";
import { JobTrackerScreen } from "./job-tracker";
import { KpiWorkspaceScreen } from "./kpi-workspace";
import { WorkReportsScreen } from "./reports";
import { WorkRoutePage } from "@/components/work-route-page";

vi.mock("@/features/work/components/task-actions", () => ({
  TaskActionControls: () => null,
  TaskNoteForm: () => null,
}));
vi.mock("@/app/(platform)/work/actions", () => ({
  assignWorkTasksAction: vi.fn(),
  previewWorkDeadlineAction: vi.fn(),
}));
vi.mock("@/lib/work-mutation-signal", () => ({ useWorkMutationSignal: () => undefined }));
vi.mock("@/features/work/components/report-tools", () => ({ WorkReportTools: () => <button>เครื่องมือรายงาน</button> }));
vi.mock("@/lib/access", () => ({
  getAccessContext: vi.fn(async () => ({ allowed: false, permissions: [], userId: "user-1" })),
}));
vi.mock("@/lib/work-read-model", () => ({ getWorkReadModel: vi.fn() }));

const task = {
  id: "task-1", title: "ตรวจสอบคำขอ", description: "รายละเอียด", status: "in_progress", statusLabel: "กำลังทำ", priority: "normal",
  dueAt: "2026-10-26T00:00:00Z", completedAt: null, updatedAt: "2026-10-25T00:00:00Z", ownerId: "user-1", ownerName: "ผู้ใช้หนึ่ง", teamId: "team-1", teamName: "ทีมอาคาร", jobCode: "JOB-001", mainKpi: "เวลาตอบกลับ", subKpi: "คำขอใหม่", note: "ติดตาม", kpiWeight: "1", version: 1,
};

const readyModel = {
  creationKey: "creation-1", generatedAt: "2026-10-25T00:00:00Z", source: { moduleId: "work", status: "ready", itemCount: 1, message: "พร้อม" },
  tasks: [task], activities: [], items: [], statusCounts: { "กำลังทำ": 1 },
  people: [{ id: "user-1", name: "ผู้ใช้หนึ่ง", teamName: "ทีมอาคาร", positionName: "เจ้าหน้าที่", total: 1, pending: 0, inProgress: 1, onHold: 0, completed: 0, overdue: 1, weightedPerformance: null }],
  jobGroups: [{ key: "JOB-001", label: "JOB-001", hasJobCode: true, tasks: [task] }],
  assignmentOptions: [{ id: "user-1", name: "ผู้ใช้หนึ่ง", teamId: "team-1", teamName: "ทีมอาคาร", positionName: "เจ้าหน้าที่" }],
  kpiOptions: [], personalAssignments: [], kpiCards: [{ id: "score-1", metric: "เวลาตอบกลับ", unit: "ชั่วโมง", weight: "1", target: "4", actual: "3", progress: 75, periodStart: "2026-10-01T00:00:00Z", periodEnd: "2026-10-31T00:00:00Z", calculatedAt: "2026-10-25T00:00:00Z", factCount: 1 }],
  scores: [], facts: [{ id: "fact-1", metric: "เวลาตอบกลับ", value: "3", status: "applied", occurredAt: "2026-10-25T00:00:00Z", calculationVersion: 1, activityEventId: "event-1", ruleVersionId: "rule-1" }],
  report: { taskCount: 1, overdue: 1, dueSoon: 0, completion: 0, sla: 100 }, weightedReport: { totalWeight: "1" },
} as unknown as WorkReadModel;

const unavailableModel = { ...readyModel, source: { ...readyModel.source, status: "unavailable", message: "แหล่งข้อมูลยังไม่พร้อม" } } as WorkReadModel;
const render = (node: React.ReactNode) => renderToStaticMarkup(node);


describe("Work/KPI screen presentation contract", () => {
  it("renders each routed workspace with its meaningful content and controls", () => {
    const cases = [
      [<TeamCommandScreen key="team" model={readyModel} />, ["ภาพรวมทีม", "JOB-001", "/work/assign"]],
      [<AssignmentCenterScreen key="assign" model={readyModel} />, ["ศูนย์มอบหมายงาน", "ผู้รับผิดชอบ", "ดู deadline ล่วงหน้า"]],
      [<PeopleOverviewScreen key="people" model={readyModel} />, ["บุคลากร", "ผู้ใช้หนึ่ง", "/work/tracker?owner=user-1"]],
      [<JobTrackerScreen key="tracker" model={readyModel} />, ["Job Tracker", "JOB-001", "ค้นหา Job code"]],
      [<KpiWorkspaceScreen key="kpi" model={readyModel} />, ["KPI ของฉัน", "เวลาตอบกลับ", "เปิดรายละเอียดตรวจสอบ"]],
      [<WorkReportsScreen key="reports" model={readyModel} />, ["รายงานงาน", "สถานะงาน", "เครื่องมือรายงาน"]],
    ] as const;

    for (const [screen, expected] of cases) {
      const html = render(screen);
      expect(html).toContain('data-work-appearance="workspace"');
      for (const value of expected) expect(html).toContain(value);
    }
  });

  it("renders the unavailable branch in the workspace shell for every routed data screen", () => {
    const screens = [
      <TeamCommandScreen key="team" model={unavailableModel} />, <AssignmentCenterScreen key="assign" model={unavailableModel} />,
      <PeopleOverviewScreen key="people" model={unavailableModel} />, <JobTrackerScreen key="tracker" model={unavailableModel} />,
      <KpiWorkspaceScreen key="kpi" model={unavailableModel} />, <WorkReportsScreen key="reports" model={unavailableModel} />,
    ];
    for (const screen of screens) {
      const html = render(screen);
      expect(html).toContain('data-work-appearance="workspace"');
      expect(html).toContain("ยังไม่");
      expect(html).toContain("แหล่งข้อมูลยังไม่พร้อม");
    }
  });

  it("returns the routed permission-denied branch before loading work data", async () => {
    const html = render(await WorkRoutePage({ view: "team" }));
    expect(html).toContain('role="alert"');
    expect(html).toContain("งานและ KPI");
  });

  it("rejects an invalid routed view instead of silently falling back", async () => {
    await expect(WorkRoutePage({ view: "filters" })).rejects.toThrow();
  });

  it("keeps the actual route vocabulary strict", () => {
    for (const view of ["team", "assign", "people", "tracker", "kpi", "reports", "activity", "due"]) expect(isWorkView(view)).toBe(true);
    expect(isWorkView("filters")).toBe(false);
    expect(isWorkView("not-a-work-view")).toBe(false);
  });
});