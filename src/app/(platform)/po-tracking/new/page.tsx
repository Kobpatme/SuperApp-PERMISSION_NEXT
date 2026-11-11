import type { Metadata } from "next";
import { AccessDenied } from "@/components/access-denied";
import { PageHeader } from "@/components/ui/page-header";
import { getAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import { poPermissions } from "@/modules/po-tracking/service";
import { PoCreateWorkspace } from "@/features/po-tracking/po-excel-form";
import "@/features/po-tracking/po-tracking.css";

export const metadata: Metadata = { title: "สร้าง PO ใหม่" };

export default async function NewPoPage() {
  const access = await getAccessContext("po-tracking");
  if (!access.allowed) return <AccessDenied moduleName="ติดตาม PO" />;
  const canManage = isAuthorized(access.subject, poPermissions.manage);
  const priceVisible = isAuthorized(access.subject, poPermissions.priceRead);
  if (!canManage || !priceVisible) {
    return <main data-ui-screen="po-tracking-new">
      <PageHeader title="สร้าง PO ใหม่" description="ต้องมีสิทธิ์แก้ไข PO และดูราคาเพื่อสร้างใบสั่งซื้อ"
        parent={{ label: "ติดตาม PO", href: "/po-tracking" }} />
      <AccessDenied moduleName="สร้าง PO ใหม่" />
    </main>;
  }
  return <main data-ui-screen="po-tracking-new">
    <PageHeader title="สร้าง PO ใหม่" description="กรอกใบสั่งซื้อเอง หรือนำเข้าจาก Excel พร้อมตรวจรายการซ้ำก่อนบันทึก"
      parent={{ label: "ติดตาม PO", href: "/po-tracking" }} />
    <PoCreateWorkspace canImport={isAuthorized(access.subject, poPermissions.importManage)} />
  </main>;
}
