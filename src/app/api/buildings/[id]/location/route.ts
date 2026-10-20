import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { buildings } from "@/db/schema";
import { getAccessContext } from "@/lib/access";
import { locationUpdateSchema } from "@/lib/building-location";
import { isAuthorized } from "@/lib/authorization";
import { runMaterialChange } from "@/lib/material-change";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getAccessContext("buildings");
  if (!access.allowed || access.passwordChangeRequired) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "invalid_building" }, { status: 400 });

  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "invalid_payload" }, { status: 400 }); }
  const parsed = locationUpdateSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "invalid_location" }, { status: 400 });
  const db = getDb();
  const [building] = await db.select().from(buildings).where(eq(buildings.id, id)).limit(1);
  if (!building || !isAuthorized(access.subject, "building.record.read", { teamId: building.ownerTeamId })) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!isAuthorized(access.subject, "building.record.update", { teamId: building.ownerTeamId })) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const input = parsed.data;
  const after = { latitude: input.latitude, longitude: input.longitude, accuracy: input.accuracy ?? null, source: input.source,
    verified: true, address: input.address ?? null, subdistrict: input.subdistrict ?? null, district: input.district ?? null,
    province: input.province ?? null, postcode: input.postcode ?? null, placeId: input.placeId ?? null };
  const before = { latitude: building.latitude, longitude: building.longitude, accuracy: building.locationAccuracy, source: building.locationSource,
    verified: building.locationVerified, address: building.address, subdistrict: building.subdistrict, district: building.district,
    province: building.province, postcode: building.postcode, placeId: building.longdoPlaceId };
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  await runMaterialChange({ audit: { actorId: access.userId, moduleId: "buildings", action: "building.location.update", entityType: "building",
    entityId: building.id, requestId, before, after, metadata: { source: input.source, verified: true } } }, async (tx) => {
    const changed = await tx.update(buildings).set({ latitude: String(input.latitude), longitude: String(input.longitude),
      locationAccuracy: input.accuracy == null ? null : String(input.accuracy), locationSource: input.source,
      locationVerified: true, locationVerifiedAt: new Date(), locationVerifiedBy: access.userId, locationUpdatedAt: new Date(),
      address: input.address ?? null, subdistrict: input.subdistrict ?? null, district: input.district ?? null,
      province: input.province ?? null, postcode: input.postcode ?? null, longdoPlaceId: input.placeId ?? null,
      version: building.version + 1, updatedAt: new Date() }).where(and(eq(buildings.id, building.id), eq(buildings.version, building.version))).returning({ id: buildings.id });
    if (!changed.length) throw new Error("Building location changed during the update");
  });
  return NextResponse.json({ saved: true, location: after });
}
