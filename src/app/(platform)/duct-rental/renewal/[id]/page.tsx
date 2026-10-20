import { getAccessContext } from "@/lib/access";
import { AccessDenied } from "@/components/access-denied";
import { RenewalWorkspace } from "@/modules/duct-rental/components/process-workspace";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const access = await getAccessContext("duct-rental"); const { id } = await params; return access.allowed ? <RenewalWorkspace id={id} /> : <AccessDenied moduleName="ต่อสัญญาเช่าท่อ" />; }
