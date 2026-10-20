import { createHash } from "node:crypto";
import { z } from "zod";

export function stablePayloadChecksum(value: unknown) {
  const stable = JSON.stringify(value, (_, nested) => nested && typeof nested === "object" && !Array.isArray(nested)
    ? Object.fromEntries(Object.entries(nested).sort(([a], [b]) => a.localeCompare(b))) : nested);
  return createHash("sha256").update(stable).digest("hex");
}

const summarySchema = z.object({ sourceCount: z.number().int().nonnegative(), importedCount: z.number().int().nonnegative(), skippedCount: z.number().int().nonnegative(), anomalyCount: z.number().int().nonnegative(), failedCount: z.number().int().nonnegative() });
export function reconcileImportSummary(input: unknown) {
  const summary = summarySchema.parse(input);
  const accounted = summary.importedCount + summary.skippedCount + summary.anomalyCount + summary.failedCount;
  return { ...summary, accounted, balanced: accounted === summary.sourceCount, approvable: accounted === summary.sourceCount && summary.failedCount === 0 && summary.anomalyCount === 0 };
}
