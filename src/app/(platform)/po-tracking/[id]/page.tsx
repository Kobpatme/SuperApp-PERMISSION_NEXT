import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccessDenied } from "@/components/access-denied";
import { PageHeader } from "@/components/ui/page-header";
import { getAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import { getPoLine, poPermissions } from "@/modules/po-tracking/service";
import { PoLineDetail } from "@/features/po-tracking/po-line-detail";
import "@/features/po-tracking/po-tracking.css";

export const metadata: Metadata = { title: "รายละเอียด PO" };

export default async function PoTrackingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await getAccessContext("po-tracking");
  if (!access.allowed) return <AccessDenied moduleName="ติดตาม PO" />;
  const { id } = await params;
  const actor = { userId: access.userId, subject: access.subject };
  const data = await getPoLine(actor, id);
  if (!data) notFound();
  const priceVisible = isAuthorized(access.subject, poPermissions.priceRead);
  return <main data-ui-screen="po-tracking-detail">
    <PageHeader title={`PO ${data.line.poNumber}`} description={`${data.line.materialCode} · ${data.line.description}`}
      parent={{ label: "ติดตาม PO", href: "/po-tracking" }} />
    <PoLineDetail line={data.line} receipts={data.receipts} importRun={data.importRun}
      priceVisible={priceVisible}
      canRecord={isAuthorized(access.subject, poPermissions.receiptRecord)}
      canCorrect={isAuthorized(access.subject, poPermissions.receiptCorrect)}
      canManage={isAuthorized(access.subject, poPermissions.manage)} />
  </main>;
}
