import Decimal from "decimal.js";
import { z } from "zod";

export const guaranteeStatuses = ["draft", "evidence_pending", "submitted", "finance_review", "transfer_pending", "partially_refunded", "refunded", "cancelled"] as const;
export type GuaranteeStatus = (typeof guaranteeStatuses)[number];
const transitions: Record<GuaranteeStatus, readonly GuaranteeStatus[]> = {
  draft: ["evidence_pending", "submitted", "cancelled"], evidence_pending: ["submitted", "cancelled"], submitted: ["finance_review", "evidence_pending", "cancelled"],
  finance_review: ["transfer_pending", "evidence_pending", "cancelled"], transfer_pending: ["partially_refunded", "refunded"], partially_refunded: ["partially_refunded", "refunded"], refunded: [], cancelled: [],
};

export function assertGuaranteeTransition(from: GuaranteeStatus, to: GuaranteeStatus) {
  if (!transitions[from].includes(to)) throw new Error(`Invalid guarantee transition: ${from} -> ${to}`);
}

const money = z.string().regex(/^\d+(\.\d{1,2})?$/);
export const refundInputSchema = z.object({ depositTotal: money, existingRefundTotal: money, requestedAmount: money });
export function validateRefundTotals(input: z.infer<typeof refundInputSchema>) {
  const value = refundInputSchema.parse(input);
  const deposit = new Decimal(value.depositTotal);
  const existing = new Decimal(value.existingRefundTotal);
  const requested = new Decimal(value.requestedAmount);
  if (requested.lte(0)) throw new Error("Refund must be positive");
  if (existing.plus(requested).gt(deposit)) throw new Error("Refund exceeds recorded deposits");
  return { remaining: deposit.minus(existing).minus(requested).toFixed(2), fullyRefunded: existing.plus(requested).eq(deposit) };
}
