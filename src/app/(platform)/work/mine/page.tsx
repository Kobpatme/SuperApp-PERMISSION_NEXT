import { copy } from "@/lib/copy";
import type { Metadata } from "next";
import { AccessDenied } from "@/components/access-denied";
import { loadWorkPage } from "@/lib/work-page-data";
import { MyTasksWorkspace } from "@/features/work/screens/my-tasks-workspace";
import { WorkFiltersForm } from "@/features/work/components/work-filters";
export const metadata: Metadata = { title: copy.pages.work_mine };
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const data = await loadWorkPage("work.task.read", await searchParams, true);
  if (!data) return <AccessDenied moduleName="งานและ KPI" />;
  return <><MyTasksWorkspace key={JSON.stringify(data.filters)} filters={<WorkFiltersForm filters={data.filters} model={data.model} appearance="workspace"/>} model={data.model} subject={data.access.subject} userId={data.access.userId} canCreate={data.access.permissions.includes("work.task.create")} />{data.model.tasks.length === 500 && <p role="status">แสดง 500 รายการล่าสุด กรุณาใช้ตัวกรองเพื่อดูช่วงที่ต้องการ</p>}</>;
}
