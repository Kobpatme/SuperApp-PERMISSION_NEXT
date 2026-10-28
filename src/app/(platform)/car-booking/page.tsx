import type { Metadata } from "next";
import { getAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import { AccessDenied } from "@/components/access-denied";
import { PageHeader } from "@/components/ui/page-header";
import { CarBookingWorkspace } from "@/features/car-booking/car-booking-workspace";
import "@/features/car-booking/car-booking.css";
export const metadata:Metadata={title:"ระบบจองรถ"};
export default async function CarBookingPage(){
 const access=await getAccessContext("car-booking");
 if(!access.allowed)return <AccessDenied moduleName="ระบบจองรถ"/>;
 return <main data-ui-screen="car-booking">
   <PageHeader title="ระบบจองรถ" description="จองและคืนรถ บันทึกการเดินทาง และรายงานการใช้รถ OSP" parent={{ label: "ภาพรวม", href: "/" }} actions={<span className="cb-scope">{isAuthorized(access.subject,"car_booking.module.admin")?"ผู้ดูแลระบบจองรถ":"จัดการรายการของตนเอง"}</span>} />
   <CarBookingWorkspace userId={access.userId} admin={isAuthorized(access.subject,"car_booking.module.admin")} canManageAccess={isAuthorized(access.subject,"core.user.manage")}/>
 </main>;
}
