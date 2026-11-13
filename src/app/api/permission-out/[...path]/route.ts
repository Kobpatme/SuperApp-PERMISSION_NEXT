import { permissionOutApi } from "@/modules/permission-out/api";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) { return permissionOutApi(request, (await context.params).path); }
export async function POST(request: Request, context: { params: Promise<{ path: string[] }> }) { return permissionOutApi(request, (await context.params).path); }
