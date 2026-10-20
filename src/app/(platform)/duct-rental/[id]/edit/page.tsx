import { getAccessContext } from "@/lib/access";
import { AccessDenied } from "@/components/access-denied";
import { RequestEdit } from "@/modules/duct-rental/components/request-form";
export default async function EditDuctRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await getAccessContext("duct-rental");
  if (!access.allowed) return <AccessDenied moduleName="แก้ไขคำขอเช่าท่อ" />;
  const { id } = await params;
  return <RequestEdit id={id} user={{ id: access.userId, displayName: access.displayName, email: access.email }} permissions={access.permissions} />;
}
