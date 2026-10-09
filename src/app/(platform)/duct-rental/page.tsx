import type { Metadata } from "next";
import { getAccessContext } from "@/lib/access";
import { AccessDenied } from "@/components/access-denied";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "เช่าท่อร้อยสาย" };

export default async function DuctRentalPage() {
  const access = await getAccessContext("duct-rental");
  if (!access.allowed) return <AccessDenied moduleName="เช่าท่อร้อยสาย" />;
  return <>
    <PageHeader title="เช่าท่อร้อยสาย" description="คำขอเช่าท่อ ต่อสัญญา และยกเลิกการใช้ท่อ" />
    <EmptyState title="กำลังเตรียมระบบเช่าท่อร้อยสาย" description="ระบบยังไม่เปิดรับรายการ กรุณาติดต่อผู้ดูแลเพื่อสอบถามกำหนดเปิดใช้งาน" />
  </>;
}
