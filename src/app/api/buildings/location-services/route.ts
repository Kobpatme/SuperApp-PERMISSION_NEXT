import { NextResponse } from "next/server";
import { getAccessContext } from "@/lib/access";
import { isValidCoordinate } from "@/lib/building-location";

type Place = { id: string | null; name: string; address: string; latitude: number; longitude: number };
let requestWindow = Math.floor(Date.now() / 60_000);
let providerRequests = 0;
function underProviderLimit() {
  const minute = Math.floor(Date.now() / 60_000);
  if (minute !== requestWindow) { requestWindow = minute; providerRequests = 0; }
  if (providerRequests >= 55) return false;
  providerRequests += 1;
  return true;
}
function placesFrom(value: unknown): Place[] {
  const values = Array.isArray(value) ? value : value && typeof value === "object" && "data" in value && Array.isArray(value.data) ? value.data : [];
  return values.flatMap((entry: unknown) => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    const latitude = Number(item.lat), longitude = Number(item.lon ?? item.lng);
    if (!isValidCoordinate(latitude, longitude)) return [];
    return [{ id: item.id == null ? null : String(item.id).slice(0, 160), name: String(item.name ?? item.label ?? "สถานที่").slice(0, 200),
      address: String(item.address ?? item.description ?? "").slice(0, 500), latitude, longitude }];
  }).slice(0, 8);
}

export async function GET(request: Request) {
  const access = await getAccessContext("buildings");
  if (!access.allowed || access.passwordChangeRequired) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const key = process.env.LONGDO_MAP_API_KEY;
  if (!key) return NextResponse.json({ error: "map_not_configured" }, { status: 503 });
  const params = new URL(request.url).searchParams;
  const kind = params.get("kind");
  if (!underProviderLimit()) return NextResponse.json({ error: "provider_rate_limit" }, { status: 429 });
  const referer = request.headers.get("referer");
  const safeReferer = (() => {
    if (!referer) return undefined;
    try { const parsed = new URL(referer); return parsed.host === new URL(request.url).host && ["https:", "http:"].includes(parsed.protocol) ? `${parsed.origin}/` : undefined; }
    catch { return undefined; }
  })();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    if (kind === "search") {
      const query = (params.get("q") ?? "").trim().slice(0, 120);
      if (query.length < 2) return NextResponse.json({ items: [] });
      const target = new URL("https://search.longdo.com/mapsearch/json/search");
      target.searchParams.set("keyword", query); target.searchParams.set("limit", "8"); target.searchParams.set("key", key);
      const response = await fetch(target, { signal: controller.signal, cache: "no-store", headers: safeReferer ? { Referer: safeReferer } : undefined });
      if (!response.ok) return NextResponse.json({ error: "place_search_unavailable" }, { status: 502 });
      return NextResponse.json({ items: placesFrom(await response.json()) }, { headers: { "Cache-Control": "private, no-store" } });
    }
    if (kind === "reverse") {
      const latitude = Number(params.get("lat")), longitude = Number(params.get("lon"));
      if (!isValidCoordinate(latitude, longitude)) return NextResponse.json({ error: "invalid_coordinate" }, { status: 400 });
      const target = new URL("https://api.longdo.com/map/services/address");
      target.searchParams.set("lat", String(latitude)); target.searchParams.set("lon", String(longitude));
      target.searchParams.set("locale", "th"); target.searchParams.set("noelevation", "1"); target.searchParams.set("key", key);
      const response = await fetch(target, { signal: controller.signal, cache: "no-store", headers: safeReferer ? { Referer: safeReferer } : undefined });
      if (!response.ok) return NextResponse.json({ error: "reverse_geocode_unavailable" }, { status: 502 });
      const result: unknown = await response.json();
      if (!result || typeof result !== "object") return NextResponse.json({ error: "reverse_geocode_unavailable" }, { status: 502 });
      const item = result as Record<string, unknown>;
      return NextResponse.json({ address: String(item.address ?? "").slice(0, 1000), subdistrict: String(item.subdistrict ?? "").slice(0, 160),
        district: String(item.district ?? "").slice(0, 160), province: String(item.province ?? "").slice(0, 160),
        postcode: String(item.postcode ?? "").slice(0, 24) }, { headers: { "Cache-Control": "private, no-store" } });
    }
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "location_service_unavailable" }, { status: 502 });
  } finally { clearTimeout(timeout); }
}
