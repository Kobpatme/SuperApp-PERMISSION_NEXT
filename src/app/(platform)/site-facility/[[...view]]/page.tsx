import type { Metadata } from "next";
import {notFound} from "next/navigation";
import {AccessDenied} from "@/components/access-denied";
import {getAccessContext} from "@/lib/access";
import {SiteFacilityWorkspace} from "@/modules/site-facility/workspace";
export const metadata:Metadata={title:"Site Facility & Design"};
export default async function Page({params}:{params:Promise<{view?:string[]}>}){
 const path=(await params).view??[],view=path[0]??"sites";
 if(path.length>1||!["sites","reports","datasets"].includes(view))notFound();
 const access=await getAccessContext("site-facility");if(!access.allowed)return <AccessDenied moduleName="Site Facility & Design"/>;
 const route=await getAccessContext("permission-out");
 return <SiteFacilityWorkspace view={view} permissions={access.permissions} canViewRoutes={route.allowed}/>;
}
