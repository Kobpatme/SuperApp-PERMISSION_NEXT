import { getAccessContext } from "@/lib/access";
import { AccessDenied } from "@/components/access-denied";
import { RequestForm } from "@/modules/duct-rental/components/request-form";
export default async function NewDuctRequestPage() {
  const access = await getAccessContext("duct-rental");
  if (!access.allowed || !access.permissions.includes("duct_rental.request.create")) return <AccessDenied moduleName="สร้างคำขอเช่าท่อ" />;
  return <RequestForm user={{ id: access.userId, displayName: access.displayName, email: access.email }} permissions={access.permissions} />;
}
