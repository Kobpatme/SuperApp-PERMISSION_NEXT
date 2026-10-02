import { copy } from "@/lib/copy";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "เพิ่มงาน" };
import Link from "next/link";
import { AccessDenied } from "@/components/access-denied";
import { WorkCreateForm } from "@/components/work-create-form";
import { PageHeader } from "@/components/ui/page-header";
import { getAccessContext } from "@/lib/access";

export default async function NewWorkPage() {
  const access = await getAccessContext("work");
  if (!access.allowed) return <AccessDenied moduleName="งานและ KPI" />;
  return <div className="work-native"><PageHeader title="เพิ่มงาน" description={copy.feedback.workCreateDescription} parent={{ label: "งานและ KPI", href: "/work" }} /><WorkCreateForm /><p className="sub"><Link href="/work">กลับไปงานของฉัน</Link></p></div>;
}
