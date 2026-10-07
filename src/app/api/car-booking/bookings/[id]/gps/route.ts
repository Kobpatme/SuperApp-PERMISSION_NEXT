import { handleCarBookingRequest } from "@/lib/car-booking-api";
export async function GET(request:Request,context:{params:Promise<{id:string}>}) { return handleCarBookingRequest(request,"gps",(await context.params).id); }
