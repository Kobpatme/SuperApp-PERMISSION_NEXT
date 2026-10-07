import type { Metadata } from "next";
import { getIdentityAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import { AccessDenied } from "@/components/access-denied";
import { CarAccessWorkspace } from "@/features/car-booking/car-access-workspace";
import "@/features/car-booking/car-booking.css";
export const metadata:Metadata={title:"สิทธิ์ระบบจองรถ"};
export default async function CarAccessPage(){
 const access=await getIdentityAccessContext();
 if(access.passwordChangeRequired || !isAuthorized(access.subject,"core.user.manage"))return <AccessDenied moduleName="สิทธิ์ระบบจองรถ"/>;
 return <CarAccessWorkspace/>;
}
