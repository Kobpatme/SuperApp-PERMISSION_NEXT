import { copy } from "@/lib/copy";
import type { Metadata } from "next";
export const metadata: Metadata = { title: copy.pages.work_new };
import Link from "next/link";
import { AccessDenied } from "@/components/access-denied";
import { WorkCreateForm } from "@/components/work-create-form";
import { PageHeader } from "@/components/ui/page-header";
import { getWorkReadModel } from "@/lib/work-read-model";
import { getAccessContext } from "@/lib/access";

export default async function NewWorkPage() {
  const access = await getAccessContext("work");
  if (!access.allowed) return <AccessDenied moduleName="งานและ KPI" />;
  return <div className="work-native"><PageHeader title="เพิ่มงาน" description={copy.feedback.workCreateDescription} parent={{ label: "งานและ KPI", href: "/work" }} /><WorkCreateForm model={await getWorkReadModel(access)} userId={access.userId}/><p className="sub"><Link href="/work">กลับไปงานของฉัน</Link></p></div>;
}
