import { NextResponse } from "next/server";
import { z } from "zod";
import { getAccessContext } from "@/lib/access";
import { BuildingDeleteError, deleteBuildingRecord } from "@/lib/building-delete-server";

const inputSchema = z.object({ confirmationName: z.string().trim().min(1).max(500), version: z.number().int().positive() }).strict();

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getAccessContext("buildings");
  if (!access.userId) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  if (!access.allowed || access.passwordChangeRequired || access.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "invalid_building" }, { status: 400 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "invalid_payload" }, { status: 400 }); }
  const input = inputSchema.safeParse(raw);
  if (!input.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  try {
    await deleteBuildingRecord(access, id, input.data, crypto.randomUUID());
    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (error instanceof BuildingDeleteError) {
      const status = error.code === "forbidden" ? 403 : error.code === "not_found" ? 404 : error.code === "confirmation_mismatch" ? 400 : 409;
      return NextResponse.json({ error: error.code }, { status });
    }
    return NextResponse.json({ error: "building_delete_failed" }, { status: 409 });
  }
}
