import { describe, expect, it } from "vitest";
import { signatureLayout } from "../domain/signature-layout";
import { cropSignaturePixels, isNearWhitePaperPixel } from "../domain/signature-image";
describe("frozen METRIX signature geometry and image preparation", () => {
  it("keeps global, image, name and date offsets independent", () => {
    const base = signatureLayout(600, 840, { x: 0, y: 0, scale: 1 });
    expect(base.image).toEqual({ x: 269.4, y: 640.2, width: 61.199999999999996, height: 35.28 });
    const shifted = signatureLayout(600, 840, { x: 5, y: -3, scale: 1, signatureOffsetX: 10, nameOffsetY: 7 });
    expect(shifted.image.x - base.image.x).toBe(15); expect(shifted.name.y - base.name.y).toBe(4); expect(shifted.date.y - base.date.y).toBe(-3);
  });
  it("removes only the source near-white paper threshold, preserving coloured/light ink", () => {
    expect(isNearWhitePaperPixel(221, 221, 221)).toBe(true); expect(isNearWhitePaperPixel(220, 255, 255)).toBe(false);
    expect(isNearWhitePaperPixel(227, 255, 255)).toBe(false); expect(isNearWhitePaperPixel(228, 255, 255)).toBe(true);
  });
  it("crops to alpha>16 with four-pixel padding and detects an empty image", () => {
    const pixels = new Uint8ClampedArray(20 * 20 * 4).fill(255);
    const at = (10 * 20 + 10) * 4; pixels[at] = pixels[at + 1] = pixels[at + 2] = 0;
    const result = cropSignaturePixels(pixels, 20, 20); expect(result).toMatchObject({ width: 9, height: 9, hasInk: true });
    expect(result.pixels[(4 * 9 + 4) * 4 + 3]).toBe(255); expect(result.pixels[3]).toBe(0);
    expect(cropSignaturePixels(new Uint8ClampedArray(4), 1, 1).hasInk).toBe(false);
  });
});
