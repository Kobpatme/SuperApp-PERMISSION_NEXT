import { describe, expect, it } from "vitest";
import { validateAttachmentMetadata } from "@/lib/attachments";

const valid = {
  moduleId: "building", entityType: "building", entityId: "4b8965d8-26c5-4510-b653-cdf443778324",
  provider: "nas", storageKey: "B001/contracts/a.pdf", fileName: "a.pdf", mediaType: "application/pdf",
  sizeBytes: 1024, checksumSha256: "a".repeat(64),
};

describe("attachment boundary", () => {
  it("accepts bounded private-storage metadata", () => expect(validateAttachmentMetadata(valid)).toEqual(valid));
  it("rejects traversal, paths in names and unapproved media", () => {
    expect(() => validateAttachmentMetadata({ ...valid, storageKey: "../secret" })).toThrow();
    expect(() => validateAttachmentMetadata({ ...valid, fileName: "folder/a.pdf" })).toThrow();
    expect(() => validateAttachmentMetadata({ ...valid, mediaType: "text/html" })).toThrow();
  });
});
