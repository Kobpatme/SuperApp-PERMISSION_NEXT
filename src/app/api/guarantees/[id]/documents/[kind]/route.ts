import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { guaranteeWorkEvents, guaranteeWorkItems } from "@/db/schema";
import { getAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import { canWorkAsAssignedTl, getDepositWorkItem } from "@/lib/deposit-v2-server";
import { detectEvidenceType, isEvidenceKind, isStoredEvidencePath } from "@/lib/guarantee-evidence";
import { readGuaranteeEvidence, removeGuaranteeEvidence, writeGuaranteeEvidence } from "@/lib/guarantee-storage";

type RouteContext = { params: Promise<{ id: string; kind: string }> };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const error = (message: string, status: number) => NextResponse.json({ error: message }, { status });

export async function GET(_request: Request, context: RouteContext) {
  const { id, kind } = await context.params;
  if (!uuid.test(id) || !isEvidenceKind(kind)) return error("Invalid document", 400);
  const item = await getDepositWorkItem(id);
  if (!item) return error("Not found", 404);
  const path = String(item[kind] || "");
  if (!isStoredEvidencePath(path) || !path.startsWith(`guarantees/${id}/${kind}/`)) return error("Document not available", 404);
  try {
    const bytes = await readGuaranteeEvidence(path);
    const mime = path.endsWith(".pdf") ? "application/pdf" : path.endsWith(".png") ? "image/png" : "image/jpeg";
    return new NextResponse(bytes, { headers: { "content-type": mime, "content-disposition": `inline; filename="${kind}.${path.split(".").pop()}"`,
      "cache-control": "private, no-store", "x-content-type-options": "nosniff" } });
  } catch (cause) {
    console.error("Unable to open guarantee evidence", cause);
    return error("Document unavailable", 503);
  }
}

export async function POST(request: Request, context: RouteContext) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return error("Invalid request origin", 403);
  const { id, kind } = await context.params;
  if (!uuid.test(id) || !isEvidenceKind(kind)) return error("Invalid document", 400);
  if (!process.env.DATABASE_URL) return error("Database unavailable", 503);
  const access = await getAccessContext("guarantees");
  if (!access.allowed || access.isDevelopmentSession) return error("Permission denied", 403);
  const item = await getDepositWorkItem(id);
  if (!item) return error("Not found", 404);
  const manager = isAuthorized(access.subject, "guarantee.case.update", { ownerId: item.ownerId, teamId: item.teamId }) ||
    isAuthorized(access.subject, "guarantee.case.manage", { ownerId: item.ownerId, teamId: item.teamId });
  const assignedTl = canWorkAsAssignedTl(access, item) && ["pdf_tl_work", "pdf_tl_extra"].includes(kind) && ["tl", "On Process"].includes(item.status);
  if (!manager && !assignedTl) return error("Permission denied", 403);
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 21 * 1024 * 1024) return error("File exceeds 20 MB", 413);
  const form = await request.formData();
  const file = form.get("file");
  const version = Number(form.get("version"));
  if (!(file instanceof File) || !file.size || file.size > 20 * 1024 * 1024) return error("Choose a file up to 20 MB", 400);
  if (!Number.isInteger(version) || version !== item.version) return error("Item changed. Refresh and try again", 409);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectEvidenceType(bytes);
  if (!detected) return error("Only PDF, JPG and PNG are supported", 415);
  const path = `guarantees/${id}/${kind}/${crypto.randomUUID()}.${detected.extension}`;
  try {
    await writeGuaranteeEvidence(path, bytes);
    try {
      await getDb().transaction(async (tx) => {
        const updated = await tx.update(guaranteeWorkItems).set({ data: { ...item, [kind]: path,
          id: undefined, ownerId: undefined, teamId: undefined, tlAssigneeId: undefined, status: undefined, version: undefined },
          version: sql`${guaranteeWorkItems.version} + 1`, updatedAt: new Date() })
          .where(and(eq(guaranteeWorkItems.id, id), eq(guaranteeWorkItems.version, version))).returning({ id: guaranteeWorkItems.id });
        if (!updated.length) throw new Error("Item changed");
        await tx.insert(guaranteeWorkEvents).values({ itemId: id, actorId: access.userId, action: `upload:${kind}`, fromStatus: item.status, toStatus: item.status });
      });
    } catch (cause) {
      await removeGuaranteeEvidence(path);
      throw cause;
    }
    revalidatePath("/guarantees"); revalidatePath(`/guarantees/${id}`);
    return NextResponse.json({ ok: true });
  } catch (cause) {
    console.error("Unable to upload guarantee evidence", cause);
    return error(cause instanceof Error && cause.message === "Item changed" ? "Item changed. Refresh and try again" : "Upload failed", 500);
  }
}
