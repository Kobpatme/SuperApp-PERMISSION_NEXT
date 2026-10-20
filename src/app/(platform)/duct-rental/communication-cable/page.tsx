import type { Metadata } from "next";
import { getAccessContext } from "@/lib/access";
import { AccessDenied } from "@/components/access-denied";
import { CableTestWorkspace } from "@/modules/duct-rental/components/cable-test-workspace";

export const metadata: Metadata = { title: "พาดสายสื่อสาร · ทดสอบใช้งาน" };

export default async function Page() {
  const access = await getAccessContext("duct-rental");
  if (!access.allowed) return <AccessDenied moduleName="เช่าท่อและพาดสาย" />;
  return <CableTestWorkspace permissions={access.permissions} />;
}
