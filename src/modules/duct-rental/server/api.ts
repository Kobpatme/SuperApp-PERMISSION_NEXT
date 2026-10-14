import { z } from "zod";
import { getAccessContext } from "@/lib/access";
import { authenticationRequiredResponse } from "@/lib/request-context";
import { logEvent } from "@/lib/logger";
import { createRequest, changeRequest, listRequests, readRequest } from "./requests";
import { advanceRenewal, changeCancellation, createCancellation, createRenewal, readProcesses, readRenewal, readCancellation, reviewRenewal } from "./processes";
import { downloadDocument, generateNtDocument, previewNtDocument, summaryDocument, uploadDocument, uploadAnnualDocument, ntTemplate } from "./files";
import { assignSignature, changeSignatureAsset, readSignatureAsset, readSigning, revokeSignature, saveSignatureAsset, signDocument, previewSignature } from "./signing";
import { DuctError, type DuctContext } from "./transaction";
import { id as idSchema } from "../schemas/operations";
import { readOptions, readSettings, saveSettings } from "./options";
import { changeSignals } from "./events";
import { readTracking } from "./tracking";

const noStore = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };
async function limitedBody(request: Request, max: number) {
  const advertised = Number(request.headers.get("content-length"));
  if (Number.isFinite(advertised) && advertised > max) throw new DuctError("PAYLOAD", "ข้อมูลมีขนาดใหญ่เกินกำหนด", 413);
  const reader = request.body?.getReader(); if (!reader) throw new DuctError("PAYLOAD", "ไม่มีข้อมูลคำขอ");
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    for (;;) {
      const item = await reader.read(); if (item.done) break;
      size += item.value.length;
      if (size > max) { await reader.cancel(); throw new DuctError("PAYLOAD", "ข้อมูลมีขนาดใหญ่เกินกำหนด", 413); }
      chunks.push(item.value);
    }
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
  return body;
}
function binary(file: { bytes: Uint8Array; name: string; mediaType: string }, download: boolean) {
  return new Response(new Uint8Array(file.bytes).buffer, { headers: { ...noStore, "Content-Type": file.mediaType, "Content-Disposition": `${download ? "attachment" : "inline"}; filename="duct-document.${file.mediaType === "application/pdf" ? "pdf" : "bin"}"; filename*=UTF-8''${encodeURIComponent(file.name)}` } });
}
export async function handleDuctRentalRequest(request: Request, path: string[]) {
  const requestId = crypto.randomUUID();
  try {
    const access = await getAccessContext("duct-rental");
    if (!access.userId) return authenticationRequiredResponse({ code: "AUTHENTICATION_REQUIRED", message: "กรุณาเข้าสู่ระบบ" });
    if (!access.allowed || access.passwordChangeRequired) throw new DuctError("FORBIDDEN", "คุณไม่มีสิทธิ์ใช้งานโมดูลเช่าท่อร้อยสาย", 403);
    const context: DuctContext = { actorId: access.userId, requestId };
    if (!path.length || path.length > 3) throw new DuctError("NOT_FOUND", "ไม่พบคำสั่งที่ต้องการ", 404);
    const [resource, id, operation] = path, url = new URL(request.url);
    if (id) idSchema.parse(id);
    if (request.method === "GET") {
      if (resource === "events" && !id && !operation) return changeSignals(request, context);
      if (operation && !(resource === "requests" && ["summary", "nt-preview", "nt-template"].includes(operation)) || ["documents", "assets"].includes(resource) && !id || ["options", "settings", "processes", "signatures"].includes(resource) && !!id) throw new DuctError("NOT_FOUND", "ไม่พบคำสั่งที่ต้องการ", 404);
      if (resource === "documents" && id) return binary(await downloadDocument(id, context, url.searchParams.get("download") === "1"), url.searchParams.get("download") === "1");
      if (resource === "assets" && id) return binary(await readSignatureAsset(id, context), false);
      if (resource === "requests" && id && operation === "summary") return binary(await summaryDocument(id, context), true);
      if (resource === "requests" && id && operation === "nt-template") return binary(await ntTemplate(id, context, url.searchParams.get("variant") || "original", url.searchParams.get("download") === "1"), url.searchParams.get("download") === "1");
      if (resource === "requests" && id && operation === "nt-preview") return binary(await previewNtDocument(id, context, url.searchParams.get("reference") ?? undefined, url.searchParams.get("download") === "1"), url.searchParams.get("download") === "1");
      const data = resource === "requests" ? id ? await readRequest(id, context) : await listRequests(Object.fromEntries(url.searchParams), context)
        : resource === "options" && !id ? await readOptions(context, url.searchParams.get("center") ?? "")
        : resource === "settings" && !id ? await readSettings(context)
        : resource === "tracking" && !id ? await readTracking(Object.fromEntries(url.searchParams), context)
        : resource === "processes" ? await readProcesses(context, z.coerce.number().int().min(0).parse(url.searchParams.get("offset") ?? 0), { query: url.searchParams.get("query") ?? "", status: url.searchParams.get("status") ?? "" })
        : resource === "renewals" && id ? await readRenewal(id, context)
        : resource === "cancellations" && id ? await readCancellation(id, context)
        : resource === "signatures" ? await readSigning(context, url.searchParams.get("task") || undefined, z.coerce.number().int().min(0).max(1000000).parse(url.searchParams.get("offset") ?? 0), url.searchParams.get("query") ?? "") : undefined;
      if (data === undefined) throw new DuctError("NOT_FOUND", "ไม่พบคำสั่งที่ต้องการ", 404);
      return Response.json({ data }, { headers: noStore });
    }
    if (request.method !== "POST" || request.headers.get("origin") !== url.origin) throw new DuctError("FORBIDDEN", "คำขอไม่ถูกต้อง", 403);
    const key = idSchema.parse(request.headers.get("idempotency-key"));
    if (request.headers.get("content-type")?.startsWith("multipart/form-data")) {
      const body = await limitedBody(request, resource === "assets" ? 2 * 1024 * 1024 + 65536 : 25 * 1024 * 1024 + 65536);
      const form = await new Request(request.url, { method: "POST", headers: { "Content-Type": request.headers.get("content-type")! }, body: body.buffer }).formData();
      const file = form.get("file"); if (!(file instanceof File)) throw new DuctError("FILE", "กรุณาเลือกไฟล์");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const data = resource === "requests" && id && operation === "documents" ? await uploadDocument(id, { version: form.get("version"), fileType: form.get("fileType"), ...(form.get("supersedesId") ? { supersedesId: form.get("supersedesId") } : {}) }, { name: file.name, bytes }, key, context)
        : resource === "renewals" && id && operation === "documents" ? await uploadAnnualDocument(id, z.coerce.number().int().positive().parse(form.get("version")), { name: file.name, bytes }, key, context)
        : resource === "assets" && !id ? await saveSignatureAsset(z.string().parse(form.get("name")), bytes, z.enum(["true", "false"]).parse(form.get("setDefault") ?? "false") === "true", key, context) : undefined;
      if (data === undefined) throw new DuctError("NOT_FOUND", "ไม่พบคำสั่งอัปโหลด", 404);
      return Response.json({ data }, { headers: noStore, status: 201 });
    }
    if (!request.headers.get("content-type")?.startsWith("application/json")) throw new DuctError("PAYLOAD", "คำขอต้องเป็น JSON");
    let raw: unknown;
    try { raw = JSON.parse(new TextDecoder().decode(await limitedBody(request, 65536))); }
    catch (error) { if (error instanceof DuctError) throw error; throw new DuctError("PAYLOAD", "ข้อมูลคำขอไม่ถูกต้อง"); }
    const object = z.record(z.unknown()).parse(raw);
    if (resource === "signatures" && id && operation === "preview") return binary(await previewSignature(id, raw, context), false);
    const version = () => z.number().int().positive().parse(object.version);
    const data = resource === "requests" ? !id ? await createRequest(object.design, object.teamId == null ? null : idSchema.parse(object.teamId), key, context, z.boolean().parse(object.draft ?? false))
      : operation === "nt-form" ? await generateNtDocument(id, version(), key, context, object.reference === undefined ? undefined : z.string().parse(object.reference))
      : operation === "assign" ? await assignSignature(id, raw, key, context)
      : ["accept", "submit", "save", "archive"].includes(operation) ? await changeRequest(id, operation as "accept" | "submit" | "save" | "archive", version(), object.data ?? {}, key, context) : undefined
      : resource === "renewals" ? !id ? await createRenewal(raw, key, context) : operation === "review" ? await reviewRenewal(id, raw, key, context) : ["advance", "archive"].includes(operation) ? await advanceRenewal(id, raw, key, context, operation === "archive") : undefined
      : resource === "cancellations" ? !id ? await createCancellation(raw, key, context) : ["advance", "reject", "archive"].includes(operation) ? await changeCancellation(id, operation as "advance" | "reject" | "archive", raw, key, context) : undefined
      : resource === "signatures" && id ? operation === "sign" ? await signDocument(id, raw, key, context) : operation === "revoke" ? await revokeSignature(id, version(), key, context) : undefined
      : resource === "assets" && id && ["default", "archive"].includes(operation) ? await changeSignatureAsset(id, operation as "default" | "archive", key, context) : undefined;
    if (resource === "settings" && !id) return Response.json({ data: await saveSettings(raw, key, context) }, { headers: noStore });
    if (data === undefined) throw new DuctError("NOT_FOUND", "ไม่พบคำสั่งที่ต้องการ", 404);
    return Response.json({ data }, { headers: noStore });
  } catch (error) {
    if (error instanceof DuctError) return Response.json({ code: error.code, message: error.message }, { status: error.status, headers: noStore });
    if (error instanceof z.ZodError) return Response.json({ code: "VALIDATION", message: "กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง", fields: error.issues.map(issue => ({ path: issue.path.join("."), message: /[\u0e00-\u0e7f]/.test(issue.message) ? issue.message : "ข้อมูลไม่ถูกต้อง" })) }, { status: 400, headers: noStore });
    logEvent("error", "duct-rental.request.failed", { requestId, errorType: error instanceof Error ? error.name : "UnknownError" });
    return Response.json({ code: "REQUEST_FAILED", message: "ดำเนินการไม่สำเร็จ กรุณาลองใหม่หรือติดต่อผู้ดูแล" }, { status: 500, headers: noStore });
  }
}
