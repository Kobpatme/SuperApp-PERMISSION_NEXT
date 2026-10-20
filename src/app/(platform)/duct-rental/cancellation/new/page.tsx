import { getAccessContext } from "@/lib/access";
import { AccessDenied } from "@/components/access-denied";
import { CancellationForm } from "@/modules/duct-rental/components/process-workspace";
export default async function Page({ searchParams }: { searchParams: Promise<{ request?: string }> }) { const access = await getAccessContext("duct-rental"); const { request } = await searchParams; return access.allowed && access.permissions.includes("duct_rental.cancellation.create") ? <CancellationForm selected={request} /> : <AccessDenied moduleName="ขอยกเลิกการใช้ท่อ" />; }
