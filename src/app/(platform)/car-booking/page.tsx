import type { Metadata } from "next";
import { getAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import { AccessDenied } from "@/components/access-denied";
import { CarBookingWorkspace } from "@/features/car-booking/car-booking-workspace";
import "@/features/car-booking/car-booking.css";
export const metadata:Metadata={title:"ระบบจองรถ"};
export default async function CarBookingPage(){
 const access=await getAccessContext("car-booking");
 if(!access.allowed)return <AccessDenied moduleName="ระบบจองรถ"/>;
 return <CarBookingWorkspace userId={access.userId} admin={isAuthorized(access.subject,"car_booking.module.admin")} canManageAccess={isAuthorized(access.subject,"core.user.manage")}/>;
}
