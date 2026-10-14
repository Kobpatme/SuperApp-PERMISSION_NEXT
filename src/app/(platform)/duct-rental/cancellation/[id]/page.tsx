import { getAccessContext } from "@/lib/access";
import { AccessDenied } from "@/components/access-denied";
import { CancellationWorkspace } from "@/modules/duct-rental/components/process-workspace";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const access = await getAccessContext("duct-rental"); const { id } = await params; return access.allowed ? <CancellationWorkspace id={id} /> : <AccessDenied moduleName="ยกเลิกการใช้ท่อ" />; }
