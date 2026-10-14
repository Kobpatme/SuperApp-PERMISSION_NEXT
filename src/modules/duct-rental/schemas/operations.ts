import { z } from "zod";
import { money } from "../domain/money";

export const id = z.string().uuid();
export const version = z.number().int().positive();
const decimal = z.union([z.string(), z.number()]).transform((value, ctx) => {
  try { return money(value); } catch { ctx.addIssue({ code: "custom", message: "กรุณากรอกจำนวนเงินให้ถูกต้อง (ทศนิยม 2 ตำแหน่ง)" }); return z.NEVER; }
});
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => { const d = new Date(`${value}T00:00:00Z`); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value; }, "กรุณาระบุวันที่ที่มีอยู่จริง");
export const rateInput = z.object({ monthlyFee: decimal, yearlyFee: decimal, contractStart: date.nullable().optional(), contractEnd: date.nullable().optional() }).strict();
export const guaranteeInput = z.object({ contractNumber: z.string().min(1), fullAmount: z.union([z.string().min(1), z.number()]).pipe(decimal), paymentType: z.string().min(1), venderCode: z.string().min(1), receiptNumber: z.string().min(1) }).strict();
export const guaranteeDraftInput = z.object({ contractNumber: z.string().max(10000).optional(), fullAmount: z.union([z.literal("").transform(() => null), decimal]).optional(), paymentType: z.string().max(10000).optional(), venderCode: z.string().max(10000).optional(), receiptNumber: z.string().max(10000).optional() }).strict();
export const cancelInput = z.object({ requestId: id, version, effectiveDate: date, reason: z.string().min(1).max(10000), notes: z.string().max(10000).default("") }).strict();
export const reviewInput = z.object({ version, routeId: id, reviewStatus: z.enum(["keep", "drop"]), notes: z.string().max(10000).default("") }).strict();
export const advanceInput = z.object({ version, notes: z.string().max(10000).default(""), contractDocumentId: id.optional(), contractNumber: z.string().max(200).optional(), thirdPartyNotes: z.string().max(10000).optional() }).strict();
export const signAssignmentInput = z.object({ version, documentId: id.optional(), assigneeId: id, dueAt: z.string().datetime({ offset: true }).optional() }).strict();
export const signaturePlacementInput = z.object({ version, assetId: id, page: z.number().int().min(1).max(100), x: z.number().finite().min(-1000).max(1000), y: z.number().finite().min(-1000).max(1000), signatureOffsetX: z.number().finite().min(-1000).max(1000).optional(), signatureOffsetY: z.number().finite().min(-1000).max(1000).optional(), width: z.number().finite().positive(), height: z.number().finite().positive(), rotation: z.number().finite().min(-180).max(180), scale: z.number().finite().min(0.45).max(1.6), nameOffsetX: z.number().finite().min(-1000).max(1000).optional(), nameOffsetY: z.number().finite().min(-1000).max(1000).optional(), dateOffsetX: z.number().finite().min(-1000).max(1000).optional(), dateOffsetY: z.number().finite().min(-1000).max(1000).optional() }).strict();
export const listInput = z.object({ query: z.string().max(200).default(""), phase: z.string().max(30).default(""), serviceCenter: z.string().max(20).default(""), requestType: z.enum(["", "NEW", "EXTENSION", "CANCELLATION"]).default(""), workflow: z.enum(["", "PENDING", "ACCEPTED", "ACTIVE", "CANCELLED"]).default(""), documents: z.enum(["", "complete", "incomplete"]).default(""), offset: z.coerce.number().int().min(0).max(1000000).default(0), limit: z.coerce.number().int().min(1).max(100).default(50) }).strict();
