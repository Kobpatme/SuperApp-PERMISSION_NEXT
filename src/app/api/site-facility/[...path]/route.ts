import { permissionOutApi } from "@/modules/permission-out/api";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request,{params}:{params:Promise<{path:string[]}>}){return permissionOutApi(request,(await params).path,"site-facility");}
export async function POST(request:Request,{params}:{params:Promise<{path:string[]}>}){return permissionOutApi(request,(await params).path,"site-facility");}
