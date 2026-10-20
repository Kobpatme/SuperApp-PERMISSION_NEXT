import Decimal from "decimal.js";
import { z } from "zod";

const money = z.string().regex(/^\d+(\.\d{1,4})?$/);
export const estimateInputSchema = z.object({
  taxRate: z.string().regex(/^0(\.\d+)?$|^1(\.0+)?$/),
  items: z.array(z.object({ description: z.string().trim().min(1).max(500), quantity: money, unit: z.string().trim().min(1).max(30), unitPrice: money })).min(1).max(500),
});

export function calculateEstimate(input: unknown) {
  const parsed = estimateInputSchema.parse(input);
  const items = parsed.items.map((item, index) => {
    const amount = new Decimal(item.quantity).mul(item.unitPrice).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    return { ...item, sequence: index + 1, amount: amount.toFixed(2) };
  });
  const subtotal = items.reduce((sum, item) => sum.plus(item.amount), new Decimal(0));
  const tax = subtotal.mul(parsed.taxRate).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  return { items, subtotal: subtotal.toFixed(2), tax: tax.toFixed(2), total: subtotal.plus(tax).toFixed(2) };
}

export type EstimateStatus = "draft" | "submitted" | "revision_requested" | "approved" | "cancelled";
const transitions: Record<EstimateStatus, readonly EstimateStatus[]> = {
  draft: ["submitted", "cancelled"], submitted: ["revision_requested", "approved"], revision_requested: ["submitted", "cancelled"], approved: [], cancelled: [],
};
export function assertEstimateTransition(from: EstimateStatus, to: EstimateStatus) {
  if (!transitions[from].includes(to)) throw new Error(`Invalid estimate transition: ${from} -> ${to}`);
}
export function assertIndependentApproval(requestedBy: string, decidedBy: string) {
  if (requestedBy === decidedBy) throw new Error("Self-approval is not permitted");
}
