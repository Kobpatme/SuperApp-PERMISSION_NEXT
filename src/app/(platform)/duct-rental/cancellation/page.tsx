import { getAccessContext } from "@/lib/access";
import { AccessDenied } from "@/components/access-denied";
import { ProcessList } from "@/modules/duct-rental/components/process-workspace";
export default async function Page() { const access = await getAccessContext("duct-rental"); return access.allowed ? <ProcessList kind="cancellation" permissions={access.permissions} /> : <AccessDenied moduleName="ยกเลิกการใช้ท่อ" />; }
