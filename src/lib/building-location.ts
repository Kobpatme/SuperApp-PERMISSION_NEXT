import { z } from "zod";

export const coordinateSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
}).strict();

export const locationUpdateSchema = coordinateSchema.extend({
  accuracy: z.number().finite().min(0).max(10_000_000).nullable().optional(),
  source: z.enum(["gps", "manual_pin", "search", "import"]),
  verified: z.literal(true),
  address: z.string().trim().max(1000).nullable().optional(),
  subdistrict: z.string().trim().max(160).nullable().optional(),
  district: z.string().trim().max(160).nullable().optional(),
  province: z.string().trim().max(160).nullable().optional(),
  postcode: z.string().trim().max(24).nullable().optional(),
  placeId: z.string().trim().max(160).nullable().optional(),
});

export type BuildingLocationSource = "gps" | "manual_pin" | "search" | "import";
export type LocationUpdate = z.infer<typeof locationUpdateSchema>;

export function isValidCoordinate(latitude: unknown, longitude: unknown): latitude is number {
  return typeof latitude === "number" && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 &&
    typeof longitude === "number" && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
}

export function locationVerificationAfterChange(previous: { latitude: number | null; longitude: number | null }, next: { latitude: number | null; longitude: number | null }) {
  const changed = previous.latitude !== next.latitude || previous.longitude !== next.longitude;
  return { changed, verified: false as const };
}
