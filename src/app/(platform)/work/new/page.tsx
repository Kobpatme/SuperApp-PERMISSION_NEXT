import { copy } from "@/lib/copy";
import type { Metadata } from "next";
export const metadata: Metadata = { title: copy.pages.work_new };
import { AccessDenied } from "@/components/access-denied";
import { WorkCreateForm } from "@/components/work-create-form";
import { WorkScreenShell } from "@/features/work/components/work-screen-shell";
import { getWorkReadModel } from "@/lib/work-read-model";
import { getAccessContext } from "@/lib/access";

export default async function NewWorkPage() {
  const access = await getAccessContext("work");
  if (!access.allowed) return <AccessDenied moduleName="งานและ KPI" />;
  return <WorkScreenShell title="เพิ่มงาน" description={copy.feedback.workCreateDescription} parent={{ label: "งานและ KPI", href: "/work" }} appearance="workspace"><WorkCreateForm model={await getWorkReadModel(access)} userId={access.userId}/></WorkScreenShell>;
}
