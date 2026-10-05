import { copy } from "@/lib/copy";
import type { Metadata } from "next";
import { AccessDenied } from "@/components/access-denied";
import { loadWorkPage } from "@/lib/work-page-data";
import { PeopleOverviewScreen } from "@/features/work/screens/people-overview";
import { WorkFiltersForm } from "@/features/work/components/work-filters";
export const metadata: Metadata = { title: copy.pages.work_people };
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const data = await loadWorkPage("work.task.read", await searchParams);
  if (!data) return <AccessDenied moduleName="งานและ KPI" />;
  return <><WorkFiltersForm filters={data.filters} model={data.model}/><PeopleOverviewScreen model={data.model} subject={data.access.subject} />{data.model.tasks.length === 500 && <p role="status">แสดง 500 รายการล่าสุด กรุณาใช้ตัวกรองเพื่อดูช่วงที่ต้องการ</p>}</>;
}
