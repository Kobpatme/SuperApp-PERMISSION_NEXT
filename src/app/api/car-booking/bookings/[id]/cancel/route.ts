import { handleCarBookingRequest } from "@/lib/car-booking-api";
export async function POST(request:Request,context:{params:Promise<{id:string}>}) { return handleCarBookingRequest(request,"cancel",(await context.params).id); }
