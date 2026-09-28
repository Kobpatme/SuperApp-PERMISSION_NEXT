import { isAuthorized } from "@/lib/authorization";
import { getAccessContext } from "@/lib/access";
import { writeAuditLog } from "@/lib/audit-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ path: string[] }> };

function bridgeUrl(path: string[], requestUrl: string) {
  const base = (process.env.PERMISSION_NAS_BRIDGE_URL || "http://127.0.0.1:8766").replace(/\/$/, "");
  const incoming = new URL(requestUrl);
  return `${base}/api/nas/${path.map(encodeURIComponent).join("/")}${incoming.search}`;
}

async function proxy(request: Request, context: RouteContext) {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin) return Response.json({ error: "Invalid request origin" }, { status: 403 });
  }
  const access = await getAccessContext("buildings");
  const canReadDocuments = access.permissions.includes("*") || isAuthorized(access.subject, "building.attachment.read");
  if (!access.allowed || !canReadDocuments) return Response.json({ error: "คุณไม่มีสิทธิ์ใช้งานเอกสารอาคาร" }, { status: 403 });

  const { path } = await context.params;
  const isUpload = path.join("/") === "building-documents/upload";
  const canUpload = access.permissions.includes("*") || isAuthorized(access.subject, "building.attachment.upload");
  if (isUpload && (request.method !== "POST" || !canUpload)) {
    return Response.json({ error: "บัญชีนี้ไม่มีสิทธิ์เพิ่มเอกสาร" }, { status: 403 });
  }

  const secret = process.env.PERMISSION_NAS_BRIDGE_SECRET;
  if (!secret) return Response.json({ error: "ยังไม่ได้ตั้งค่าความปลอดภัยของ NAS Bridge" }, { status: 503 });

  const headers = new Headers();
  headers.set("x-permission-bridge-secret", secret);
  headers.set("x-permission-actor-id", access.userId);
  const contentType = request.headers.get("content-type");
  const contentLength = request.headers.get("content-length");
  if (contentType) headers.set("content-type", contentType);
  if (contentLength) headers.set("content-length", contentLength);

  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers,
    cache: "no-store",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
    init.duplex = "half";
  }

  try {
    const upstream = await fetch(bridgeUrl(path, request.url), init);
    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.set("cache-control", "private, no-store");
    responseHeaders.delete("connection");
    responseHeaders.delete("keep-alive");

    if (isUpload && upstream.ok) {
      await writeAuditLog({
        actorId: access.userId,
        moduleId: "buildings",
        action: "document.upload",
        entityType: "building_document",
        metadata: { fileName: new URL(request.url).searchParams.get("fileName") || "" },
      });
    }
    if (path[0] === "download" && upstream.ok) {
      await writeAuditLog({ actorId: access.userId, moduleId: "buildings", action: "document.download", entityType: "building_document" });
    }

    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch (error) {
    console.error("NAS bridge request failed", error);
    return Response.json({ error: "ไม่สามารถเชื่อมต่อคลังเอกสารภายในได้" }, { status: 503 });
  }
}

export const GET = proxy;
export const POST = proxy;
