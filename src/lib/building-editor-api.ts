import { NextResponse } from "next/server";
import { z } from "zod";
import { getAccessContext } from "./access";
import { BuildingEditorError, buildingRecordSchema, saveBuildingRecord } from "./building-editor-server";
import { logEvent } from "./logger";

export async function mutateBuildingRequest(request: Request, id?: string) {
  const access = await getAccessContext("buildings");
  if (!access.userId) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  if (!access.allowed || access.passwordChangeRequired) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (id && !z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "invalid_building" }, { status: 400 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "invalid_payload" }, { status: 400 }); }
  const input = buildingRecordSchema.safeParse(raw);
  if (!input.success || id && (!input.data.version || !input.data.reason)) return NextResponse.json({ error: "invalid_building" }, { status: 400 });
  const requestId = crypto.randomUUID();
  try {
    const saved = await saveBuildingRecord(access, input.data, requestId, id);
    return NextResponse.json({ id: saved, saved: true }, { status: id ? 200 : 201 });
  } catch (error) {
    if (error instanceof BuildingEditorError) return NextResponse.json({ error: error.code }, { status: error.code === "forbidden" ? 403 : error.code === "not_found" ? 404 : error.code === "invalid_building" ? 400 : 409 });
    logEvent("error", "building.save.failed", { requestId, errorType: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json({ error: "building_save_failed" }, { status: 500 });
  }
}
