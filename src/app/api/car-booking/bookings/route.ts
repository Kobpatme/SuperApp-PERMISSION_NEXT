import { handleCarBookingRequest } from "@/lib/car-booking-api";
export async function GET(request:Request) { return handleCarBookingRequest(request,"bookings"); }
export async function POST(request:Request) { return handleCarBookingRequest(request,"bookings"); }
