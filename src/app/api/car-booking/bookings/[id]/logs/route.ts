import { handleCarBookingRequest } from "@/lib/car-booking-api";
type Context={params:Promise<{id:string}>};
export async function GET(request:Request,context:Context) { return handleCarBookingRequest(request,"logs",(await context.params).id); }
export async function POST(request:Request,context:Context) { return handleCarBookingRequest(request,"logs",(await context.params).id); }
