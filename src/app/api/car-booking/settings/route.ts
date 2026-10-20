import { handleCarBookingRequest } from "@/lib/car-booking-api";
export async function GET(request:Request){return handleCarBookingRequest(request,"settings");}
export async function PATCH(request:Request){return handleCarBookingRequest(request,"settings");}
