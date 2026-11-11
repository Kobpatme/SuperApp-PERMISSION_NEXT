import type { Metadata } from "next";
import Link from "next/link";
import { AccessDenied } from "@/components/access-denied";
import { PageHeader } from "@/components/ui/page-header";
import { getAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import { poListQuerySchema } from "@/modules/po-tracking/domain";
import { getPoReport, listPoLines, poPermissions } from "@/modules/po-tracking/service";
import { PoTrackingList, PoTrackingReport } from "@/features/po-tracking/po-tracking-list";
import "@/features/po-tracking/po-tracking.css";

export const metadata: Metadata = { title: "ติดตาม PO" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PoTrackingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const access = await getAccessContext("po-tracking");
  if (!access.allowed) return <AccessDenied moduleName="ติดตาม PO" />;
  const params = await searchParams;
  const actor = { userId: access.userId, subject: access.subject };
  const parsed = poListQuerySchema.safeParse({
    q: first(params.q) ?? "", unit: first(params.unit) ?? "", status: first(params.status) ?? "",
    delivery: first(params.delivery) ?? "", order: first(params.order) ?? "", page: first(params.page) ?? "1",
  });
  const query = parsed.success ? parsed.data : poListQuerySchema.parse({});
  const canReport = isAuthorized(access.subject, poPermissions.reportRead);
  const canCreate = isAuthorized(access.subject, poPermissions.manage) && isAuthorized(access.subject, poPermissions.priceRead);
  const wantsReport = first(params.view) === "report";
  const [data, report] = await Promise.all([
    listPoLines(actor, query),
    canReport ? getPoReport(actor) : Promise.resolve(null),
  ]);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  return <main data-ui-screen="po-tracking">
    <PageHeader title="ติดตาม PO" description="ติดตามใบสั่งซื้อ การรับของ ยอดคงค้าง และ ETA จากข้อมูล PO Pending"
      parent={{ label: "ภาพรวม", href: "/" }}
      actions={canReport ? <Link className="po-link" href={wantsReport ? "/po-tracking" : "/po-tracking?view=report"}>{wantsReport ? "กลับรายการ PO" : "ดูรายงาน"}</Link> : undefined} />
    {wantsReport && report
      ? <PoTrackingReport report={report} />
      : <PoTrackingList data={data} report={report} today={today} canManage={canCreate} />}
  </main>;
}
