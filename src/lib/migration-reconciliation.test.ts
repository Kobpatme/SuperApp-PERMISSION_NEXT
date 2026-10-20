import { describe, expect, it } from "vitest";
import { reconcileImportSummary, stablePayloadChecksum } from "@/lib/migration-reconciliation";

describe("migration reconciliation", () => {
  it("hashes equivalent object payloads deterministically", () => expect(stablePayloadChecksum({ b: 2, a: 1 })).toBe(stablePayloadChecksum({ a: 1, b: 2 })));
  it("requires every source row to be accounted for", () => {
    expect(reconcileImportSummary({ sourceCount: 10, importedCount: 8, skippedCount: 1, anomalyCount: 1, failedCount: 0 })).toMatchObject({ balanced: true, approvable: false });
    expect(reconcileImportSummary({ sourceCount: 10, importedCount: 10, skippedCount: 0, anomalyCount: 0, failedCount: 0 })).toMatchObject({ balanced: true, approvable: true });
    expect(reconcileImportSummary({ sourceCount: 10, importedCount: 9, skippedCount: 0, anomalyCount: 0, failedCount: 0 }).balanced).toBe(false);
  });
});
