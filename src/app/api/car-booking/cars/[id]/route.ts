import { handleCarBookingRequest } from "@/lib/car-booking-api";
export async function PATCH(request:Request,context:{params:Promise<{id:string}>}) { return handleCarBookingRequest(request,"cars",(await context.params).id); }
