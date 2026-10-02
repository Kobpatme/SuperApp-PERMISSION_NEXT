import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { buildingConditionVersions, buildings } from "@/db/schema";
import { getAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import { buildingInputSchema, prepareBuildingInput } from "@/lib/buildings";
import { locationUpdateSchema } from "@/lib/building-location";
import { runMaterialChange } from "@/lib/material-change";

const createSchema = buildingInputSchema.extend({ location: locationUpdateSchema.optional() }).strict();

export async function POST(request: Request) {
  const access = await getAccessContext("buildings");
  if (!access.allowed || access.passwordChangeRequired) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "invalid_payload" }, { status: 400 }); }
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "invalid_building" }, { status: 400 });
  const input = prepareBuildingInput(parsed.data);
  if (!isAuthorized(access.subject, "building.record.create", { ownerId: access.userId, teamId: input.ownerTeamId })) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const id = crypto.randomUUID();
  const now = new Date();
  const location = parsed.data.location;
  try {
    await runMaterialChange({ audit: { actorId: access.userId, moduleId: "buildings", action: "building.create", entityType: "building",
      entityId: id, requestId: request.headers.get("x-request-id") || crypto.randomUUID(), after: { id, code: input.code, nameTh: input.nameTh,
        nameEn: input.nameEn, ownerTeamId: input.ownerTeamId, hasLocation: Boolean(location), locationSource: location?.source ?? null } } }, async (tx) => {
      await tx.insert(buildings).values({ id, code: input.code, nameTh: input.nameTh, nameEn: input.nameEn, ownerTeamId: input.ownerTeamId,
        status: "active", searchText: input.searchText, version: 1,
        ...(location ? { latitude: String(location.latitude), longitude: String(location.longitude),
          locationAccuracy: location.accuracy == null ? null : String(location.accuracy), locationSource: location.source,
          locationVerified: true, locationVerifiedAt: now, locationVerifiedBy: access.userId, locationUpdatedAt: now,
          address: location.address ?? null, subdistrict: location.subdistrict ?? null, district: location.district ?? null,
          province: location.province ?? null, postcode: location.postcode ?? null, longdoPlaceId: location.placeId ?? null } : {}) });
      await tx.insert(buildingConditionVersions).values({ buildingId: id, version: 1, effectiveFrom: now,
        conditions: { status: "", group: "", type: "", install_type: "", area: "", province: location?.province ?? "",
          address: location?.address ?? "", lat: location?.latitude ?? null, lng: location?.longitude ?? null }, reason: "เริ่มต้นข้อมูลอาคาร", createdBy: access.userId });
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "building_create_failed" }, { status: 409 });
  }
}
