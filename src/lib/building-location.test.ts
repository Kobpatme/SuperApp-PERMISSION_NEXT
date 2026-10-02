import { describe, expect, it } from "vitest";
import { isValidCoordinate, locationUpdateSchema, locationVerificationAfterChange } from "@/lib/building-location";

describe("building location validation", () => {
  it("accepts valid Thailand coordinates and keeps legacy nulls outside the update contract", () => {
    expect(isValidCoordinate(13.7563, 100.5018)).toBe(true);
    expect(locationUpdateSchema.safeParse({ latitude: 13.7563, longitude: 100.5018, source: "manual_pin", verified: true }).success).toBe(true);
    expect(locationUpdateSchema.safeParse({ latitude: null, longitude: null, source: "manual_pin", verified: true }).success).toBe(false);
  });

  it("rejects partial, swapped-range, NaN and out-of-range coordinates", () => {
    expect(isValidCoordinate(13, null)).toBe(false);
    expect(isValidCoordinate(100.5, 13.7)).toBe(false);
    expect(isValidCoordinate(Number.NaN, 100)).toBe(false);
    expect(locationUpdateSchema.safeParse({ latitude: 91, longitude: 0, source: "gps", verified: true }).success).toBe(false);
  });

  it("requires a source and explicit confirmation before a persistence payload is valid", () => {
    expect(locationUpdateSchema.safeParse({ latitude: 1, longitude: 2, source: "gps", verified: false }).success).toBe(false);
    expect(locationUpdateSchema.safeParse({ latitude: 1, longitude: 2, source: "import", verified: true }).success).toBe(true);
  });

  it("marks a moved position as requiring re-verification", () => {
    expect(locationVerificationAfterChange({ latitude: 1, longitude: 2 }, { latitude: 1, longitude: 3 })).toEqual({ changed: true, verified: false });
    expect(locationVerificationAfterChange({ latitude: 1, longitude: 2 }, { latitude: 1, longitude: 2 })).toEqual({ changed: false, verified: false });
  });
});
