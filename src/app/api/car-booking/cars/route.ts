import { handleCarBookingRequest } from "@/lib/car-booking-api";
export async function GET(request:Request) { return handleCarBookingRequest(request,"cars"); }
export async function POST(request:Request) { return handleCarBookingRequest(request,"cars"); }
