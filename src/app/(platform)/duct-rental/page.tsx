import type { Metadata } from "next";
import { getAccessContext } from "@/lib/access";
import { AccessDenied } from "@/components/access-denied";
import { RequestListWorkspace } from "@/modules/duct-rental/components/request-list";

export const metadata: Metadata = { title: "เช่าท่อร้อยสาย" };

export default async function DuctRentalPage() {
  const access = await getAccessContext("duct-rental");
  if (!access.allowed) return <AccessDenied moduleName="เช่าท่อร้อยสาย" />;
  return <RequestListWorkspace permissions={access.permissions} userId={access.userId} />;
}
