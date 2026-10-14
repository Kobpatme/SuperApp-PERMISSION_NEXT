import { getAccessContext } from "@/lib/access";
import { AccessDenied } from "@/components/access-denied";
import { TrackingWorkspace } from "@/modules/duct-rental/components/tracking-workspace";
export default async function Page({ searchParams }: { searchParams: Promise<{ sla?: string }> }) { const access=await getAccessContext("duct-rental"), { sla }=await searchParams, initialSla=["Near Due","Overdue"].includes(sla??"")?sla:"";return access.allowed?<TrackingWorkspace key={initialSla} initialSla={initialSla}/>:<AccessDenied moduleName="ติดตามกระบวนการเช่าท่อ"/>; }
