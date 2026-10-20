import { describe, expect, it } from "vitest";
import { detectEvidenceType, isStoredEvidencePath } from "@/lib/guarantee-evidence";

describe("private guarantee evidence", () => {
  it("accepts only verified PDF, JPEG and PNG signatures", () => {
    expect(detectEvidenceType(new Uint8Array([0x25, 0x50, 0x44, 0x46]))?.mime).toBe("application/pdf");
    expect(detectEvidenceType(new Uint8Array([0xff, 0xd8, 0xff]))?.extension).toBe("jpg");
    expect(detectEvidenceType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.extension).toBe("png");
    expect(detectEvidenceType(new Uint8Array([0x3c, 0x68, 0x74, 0x6d, 0x6c]))).toBeNull();
  });
  it("does not treat arbitrary external URLs as private bucket paths", () => {
    expect(isStoredEvidencePath("https://example.invalid/document.pdf")).toBe(false);
    expect(isStoredEvidencePath("guarantees/123e4567-e89b-12d3-a456-426614174000/pdf_payment/123e4567-e89b-12d3-a456-426614174001.pdf")).toBe(true);
  });
});
