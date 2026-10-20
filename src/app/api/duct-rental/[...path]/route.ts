import { handleDuctRentalRequest } from "@/modules/duct-rental/server/api";
export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) { return handleDuctRentalRequest(request, (await context.params).path); }
export async function POST(request: Request, context: { params: Promise<{ path: string[] }> }) { return handleDuctRentalRequest(request, (await context.params).path); }
