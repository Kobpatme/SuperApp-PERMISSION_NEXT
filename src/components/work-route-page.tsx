import { notFound } from "next/navigation";
import { AccessDenied } from "@/components/access-denied";
import { getAccessContext } from "@/lib/access";
import { getWorkReadModel, type WorkReadModel } from "@/lib/work-read-model";
import { MyTasksScreen, MyWorkDashboard } from "@/features/work/screens/my-work";
import { TeamCommandScreen } from "@/features/work/screens/team-command";
import { AssignmentCenterScreen } from "@/features/work/screens/assignment-center";
import { PeopleOverviewScreen } from "@/features/work/screens/people-overview";
import { JobTrackerScreen } from "@/features/work/screens/job-tracker";
import { KpiWorkspaceScreen } from "@/features/work/screens/kpi-workspace";
import { WorkReportsScreen } from "@/features/work/screens/reports";
import { WorkEmpty, WorkScreenShell, WorkUnavailable } from "@/features/work/components/work-screen-shell";
import { isWorkView, type WorkView } from "@/lib/work-view";

function ActivityScreen({ model }: { model: WorkReadModel }) {
  if (model.source.status !== "ready") return <WorkScreenShell title="กิจกรรมงาน" description="ตรวจสอบการเปลี่ยนแปลงที่เกี่ยวข้องกับงาน"><WorkUnavailable message="ยังโหลดกิจกรรมไม่ได้" detail={model.source.message} /></WorkScreenShell>;
  return <WorkScreenShell title="กิจกรรมงาน" description="ติดตามการสร้าง มอบหมาย เปลี่ยนสถานะ และบันทึกงานในขอบเขตสิทธิ์" parent={{ label: "งานของฉัน", href: "/work" }}>{model.activities.length ? <section className="work-panel"><ol className="work-activity-list work-activity-list-expanded">{model.activities.map((event) => <li key={event.id}><span className="work-activity-dot" aria-hidden="true"/><div><strong>{event.eventLabel}</strong><span>{event.ownerName} · รายการ {event.entityId}</span><time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</time></div></li>)}</ol></section> : <WorkEmpty title="ยังไม่มีกิจกรรมงาน" detail="กิจกรรมที่อยู่ในขอบเขตสิทธิ์ของคุณจะแสดงที่นี่เมื่อมีการเปลี่ยนแปลง" />}</WorkScreenShell>;
}

function DueScreen({ model, userId }: { model: WorkReadModel; userId: string }) {
  const now = Date.parse(model.generatedAt);
  const tasks = model.tasks.filter((task) => task.ownerId === userId && task.dueAt && Date.parse(task.dueAt) <= now + 86_400_000 && !["completed", "cancelled"].includes(task.status));
  return <WorkScreenShell title="งานที่ควรเร่ง" description="รวมงานของฉันที่ครบกำหนดวันนี้หรือเกินกำหนด" parent={{ label: "งานของฉัน", href: "/work" }}>{tasks.length ? <section className="work-panel"><WorkTaskListForDue tasks={tasks}/></section> : <WorkEmpty title="ยังไม่มีงานที่ต้องเร่ง" detail="งานที่ครบกำหนดวันนี้หรือเกินกำหนดจะแสดงที่นี่" />}</WorkScreenShell>;
}

function WorkTaskListForDue({ tasks }: { tasks: WorkReadModel["tasks"] }) {
  return <div className="work-due-list">{tasks.map((task) => <div key={task.id}><div><strong>{task.title}</strong><span>{task.jobCode || "ยังไม่มีรหัสงาน"}</span></div><span className="work-danger-text">{task.dueAt ? new Date(task.dueAt).toLocaleDateString("th-TH") : "ไม่กำหนด"}</span></div>)}</div>;
}

export async function WorkRoutePage({ view, recordId, ownerId }: { view: string; recordId?: string; ownerId?: string }) {
  if (!isWorkView(view)) notFound();
  const currentView = view as WorkView;
  const access = await getAccessContext("work");
  if (!access.allowed) return <AccessDenied moduleName="งานและ KPI" />;
  const model = await getWorkReadModel(access);
  const canCreate = Boolean(access.subject?.grants.some((grant) => grant.permission === "work.task.create"));
  const hasPermission = (permission: string) => access.permissions.includes(permission);
  if (["assign", "team"].includes(currentView) && !hasPermission("work.task.manage")) return <AccessDenied moduleName="งานและ KPI" />;
  if (currentView === "people" && !hasPermission("work.task.manage") && !hasPermission("kpi.team.read")) return <AccessDenied moduleName="งานและ KPI" />;
  if (currentView === "kpi" && !hasPermission("kpi.score.read")) return <AccessDenied moduleName="งานและ KPI" />;
  if (currentView === "reports" && !hasPermission("work.report.read")) return <AccessDenied moduleName="งานและ KPI" />;
  if (currentView === "activity" && !hasPermission("activity.event.read")) return <AccessDenied moduleName="งานและ KPI" />;
  switch (currentView) {
    case "mine": return <MyWorkDashboard model={model} subject={access.subject} userId={access.userId} detailId={recordId} canCreate={canCreate} />;
    case "mine-list": return <MyTasksScreen model={model} subject={access.subject} userId={access.userId} canCreate={canCreate} />;
    case "team": return <TeamCommandScreen model={model} subject={access.subject} />;
    case "assign": return <AssignmentCenterScreen model={model} />;
    case "people": return <PeopleOverviewScreen model={model} subject={access.subject} />;
    case "tracker": return <JobTrackerScreen model={model} subject={access.subject} ownerId={ownerId} />;
    case "kpi": return <KpiWorkspaceScreen model={model} />;
    case "reports": return <WorkReportsScreen model={model} />;
    case "activity": return <ActivityScreen model={model} />;
    case "due": return <DueScreen model={model} userId={access.userId} />;
  }
}
