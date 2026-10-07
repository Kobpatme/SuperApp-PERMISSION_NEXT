import { handleCarBookingRequest } from "@/lib/car-booking-api";
export async function POST(request:Request,context:{params:Promise<{id:string}>}) { return handleCarBookingRequest(request,"return",(await context.params).id); }
