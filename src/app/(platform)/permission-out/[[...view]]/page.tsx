import type { Metadata } from "next";
import { notFound,redirect } from "next/navigation";
import { AccessDenied } from "@/components/access-denied";
import { getAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import { PermissionOutWorkspace } from "@/modules/permission-out/workspace";
export const metadata: Metadata = { title: "วิเคราะห์เส้นทาง PEA / UFM" };
export default async function Page({ params,searchParams }: { params: Promise<{ view?: string[] }>;searchParams:Promise<Record<string,string|string[]|undefined>> }) {
  const path = (await params).view ?? [], view = path[0] ?? "analysis";
  if(path.length===1&&view==="sites"){const query=await searchParams;const q=typeof query.q==="string"?`?q=${encodeURIComponent(query.q)}`:"";redirect(`/site-facility${q}`);}
  if (path.length > 1 || !["analysis","projects","reports","datasets","settings"].includes(view)) notFound();
  const access = await getAccessContext("permission-out");
  if (!access.allowed) return <AccessDenied moduleName="วิเคราะห์เส้นทาง PEA / UFM" />;
  const cable=await getAccessContext("duct-rental");
  return <PermissionOutWorkspace view={view} permissions={access.permissions} canOpenCable={cable.allowed&&isAuthorized(cable.subject,"duct_rental.request.create",{ownerId:cable.userId})} />;
}
