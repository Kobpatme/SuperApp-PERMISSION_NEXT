import { getAccessContext } from "@/lib/access";
import { AccessDenied } from "@/components/access-denied";
import { RequestWorkspace } from "@/modules/duct-rental/components/request-workspace";
export default async function DuctRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await getAccessContext("duct-rental"); if (!access.allowed) return <AccessDenied moduleName="เช่าท่อร้อยสาย" />;
  const { id } = await params; return <RequestWorkspace id={id} userId={access.userId} />;
}
