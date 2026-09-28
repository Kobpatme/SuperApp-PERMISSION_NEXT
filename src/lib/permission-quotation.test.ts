import { describe, expect, it } from "vitest";
import { buildQuotationDates, checkHorizontalDistance, countVerticalFloors, generateQuotationRef, parseFloorInput, parseWmFloors } from "./permission-quotation";

describe("Permission_Next quotation helpers", () => {
  it("parses basement, ground and numbered floors", () => {
    expect(parseFloorInput("ชั้น B2")).toEqual({ numeric: -2, label: "B2" });
    expect(parseFloorInput("GF")).toEqual({ numeric: 0, label: "G" });
    expect(parseWmFloors("3, G, B1, 3").map((floor) => floor.label)).toEqual(["B1", "G", "3"]);
    expect(countVerticalFloors(-1, 3)).toBe(5);
  });

  it("preserves quote reference, validity and horizontal-distance warnings", () => {
    expect(generateQuotationRef("BLD-12345", new Date(2026, 8, 25, 9, 5))).toBe("PN-20260925-0905-2345");
    expect(buildQuotationDates(new Date(2026, 8, 25), 7).expiresText).toBe("02/10/2569");
    expect(checkHorizontalDistance(21, 20).level).toBe("warning");
    expect(checkHorizontalDistance(-1, 20).level).toBe("error");
  });
});
