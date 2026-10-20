import { describe, expect, it } from "vitest";
import { normalizeBuildingAlias, prepareBuildingInput } from "@/lib/buildings";

describe("canonical building input", () => {
  it("normalizes aliases deterministically without dropping Thai text", () => {
    expect(normalizeBuildingAlias("  อาคาร_สำนักงานใหญ่ / A  ")).toBe("อาคาร สำนักงานใหญ่ a");
  });
  it("builds normalized searchable text and rejects unsafe codes", () => {
    expect(prepareBuildingInput({ code: "BKK-01", nameTh: "อาคารหลัก", nameEn: "Main Tower" }).searchText).toBe("bkk 01 อาคารหลัก main tower");
    expect(() => prepareBuildingInput({ code: "BKK 01", nameTh: "อาคารหลัก" })).toThrow();
  });
});
