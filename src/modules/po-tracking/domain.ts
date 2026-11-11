import Decimal from "decimal.js";
import { z } from "zod";

export const poUnits = ["M", "PC", "SET", "EA"] as const;
export type PoUnit = (typeof poUnits)[number];
export const poStatuses = ["open", "on_hold", "closed"] as const;
export type PoStatus = (typeof poStatuses)[number];
export const poDeliveryStates = ["incomplete", "pending", "partial", "received"] as const;
export type PoDeliveryState = (typeof poDeliveryStates)[number];
export const poOrigins = ["import", "manual"] as const;
export type PoOrigin = (typeof poOrigins)[number];

export const poOriginLabels: Record<PoOrigin, string> = {
  import: "นำเข้าจากไฟล์",
  manual: "สร้างใหม่ในระบบ",
};

export const poStatusLabels: Record<PoStatus, string> = {
  open: "ติดตามอยู่",
  on_hold: "พักรายการ",
  closed: "ปิดรายการ",
};
export const poDeliveryLabels: Record<PoDeliveryState, string> = {
  incomplete: "ข้อมูลจำนวนไม่ครบ",
  pending: "ยังไม่รับของ",
  partial: "รับบางส่วน",
  received: "รับครบแล้ว",
};
export const poUnitLabels: Record<PoUnit, string> = { M: "เมตร", PC: "ชิ้น", SET: "ชุด", EA: "อัน" };

export type PoLineTotalsInput = {
  orderedQty: string | null;
  initialReceivedQty: string | null;
  receiptQty?: string | null;
};

export type PoLineTotals = {
  ordered: Decimal | null;
  received: Decimal | null;
  outstanding: Decimal | null;
  delivery: PoDeliveryState;
  overReceived: boolean;
};

/** Outstanding is always derived: ordered − (imported aggregate received + active receipt events). */
export function deriveLineTotals(input: PoLineTotalsInput): PoLineTotals {
  const ordered = input.orderedQty === null || input.orderedQty === "" ? null : new Decimal(input.orderedQty);
  const initial = input.initialReceivedQty === null || input.initialReceivedQty === "" ? null : new Decimal(input.initialReceivedQty);
  if (ordered === null || initial === null) {
    return { ordered, received: null, outstanding: null, delivery: "incomplete", overReceived: false };
  }
  const events = input.receiptQty === null || input.receiptQty === undefined || input.receiptQty === "" ? new Decimal(0) : new Decimal(input.receiptQty);
  const received = initial.plus(events);
  const outstanding = ordered.minus(received);
  const delivery: PoDeliveryState = outstanding.lte(0) ? "received" : received.gt(0) ? "partial" : "pending";
  return { ordered, received, outstanding, delivery, overReceived: outstanding.lt(0) };
}

export function formatQty(value: Decimal | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const decimal = value instanceof Decimal ? value : new Decimal(value);
  if (!decimal.isFinite()) return "—";
  const [whole, fraction = ""] = decimal.toFixed(4).replace(/\.?0+$/, "").split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction ? `${grouped}.${fraction}` : grouped;
}

export function formatAmount(value: Decimal | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const decimal = value instanceof Decimal ? value : new Decimal(value);
  if (!decimal.isFinite()) return "—";
  const [whole, fraction] = decimal.toFixed(2).split(".");
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${fraction}`;
}

export function formatIsoDate(value: string | null | undefined): string {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("th-TH", {
    day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC",
  });
}

function validDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

const dateOnly = z.string().trim().refine(validDateOnly, "วันที่ไม่ถูกต้อง");
const quantityText = z.string().trim().regex(/^\d{1,18}(?:\.\d{1,4})?$/, "จำนวนไม่ถูกต้อง").refine(
  (value) => new Decimal(value).gt(0), "จำนวนต้องมากกว่าศูนย์",
);
const nonNegativeQuantityText = z.string().trim().regex(/^\d{1,18}(?:\.\d{1,4})?$/, "จำนวนไม่ถูกต้อง").refine(
  (value) => new Decimal(value).gte(0), "จำนวนต้องไม่ติดลบ",
);
const moneyText = z.string().trim().regex(/^\d{1,15}(?:\.\d{1,4})?$/, "ราคาไม่ถูกต้อง").refine(
  (value) => new Decimal(value).gte(0), "ราคาต้องไม่ติดลบ",
);
const optionalDate = z.union([z.literal(""), dateOnly]).default("");

export const recordReceiptSchema = z.object({
  lineId: z.string().uuid(),
  receivedOn: dateOnly,
  quantity: quantityText,
  reference: z.string().trim().min(1, "ต้องระบุเลขอ้างอิง").max(120),
  note: z.string().trim().max(1000).default(""),
});
export type RecordReceiptInput = z.infer<typeof recordReceiptSchema>;

const replacementSchema = z.object({
  receivedOn: dateOnly,
  quantity: quantityText,
  reference: z.string().trim().min(1, "ต้องระบุเลขอ้างอิง").max(120),
  note: z.string().trim().max(1000).default(""),
});

export const correctReceiptSchema = z.object({
  receiptId: z.string().uuid(),
  reason: z.string().trim().min(3, "ต้องระบุเหตุผลอย่างน้อย 3 ตัวอักษร").max(500),
  replacement: replacementSchema.optional(),
});
export type CorrectReceiptInput = z.infer<typeof correctReceiptSchema>;

export const updateLineSchema = z.object({
  lineId: z.string().uuid(),
  version: z.coerce.number().int().positive(),
  status: z.enum(poStatuses),
  etaDate: z.union([z.literal(""), dateOnly]).default(""),
  etaText: z.string().trim().max(200).default(""),
  note: z.string().trim().max(2000).default(""),
}).refine((value) => !(value.etaDate && value.etaText), { message: "เลือกวัน ETA หรือข้อความ ETA อย่างใดอย่างหนึ่ง", path: ["etaDate"] });
export type UpdateLineInput = z.infer<typeof updateLineSchema>;

const manualLineFields = {
  materialCode: z.string().trim().min(1, "ต้องระบุรหัสวัสดุ").max(80),
  description: z.string().trim().min(1, "ต้องระบุรายละเอียด").max(500),
  unit: z.enum(poUnits),
  orderedQty: quantityText,
  unitPrice: z.union([z.literal(""), moneyText]).default(""),
  poReleaseDate: dateOnly,
  etaDate: optionalDate,
  etaText: z.string().trim().max(200).default(""),
  note: z.string().trim().max(2000).default(""),
} as const;

const manualEtaCheck = { message: "เลือกวัน ETA หรือข้อความ ETA อย่างใดอย่างหนึ่ง", path: ["etaDate"] };

/** One manual PO line. The PO number/vendor are shared by every line. */
export const manualPoLineSchema = z.object(manualLineFields)
  .refine((value) => !(value.etaDate && value.etaText), manualEtaCheck);
export type ManualPoLineInput = z.infer<typeof manualPoLineSchema>;

/**
 * Create a multi-line PO without touching the imported source lineage.
 * Duplicate material codes are allowed (split deliveries) but must keep one
 * unit, so quantities are never silently combined across M/PC/SET/EA.
 */
export const createManualPoSchema = z.object({
  poNumber: z.string().trim().min(1, "ต้องระบุเลขที่ PO").max(40),
  vendorCode: z.string().trim().max(60).default(""),
  vendorName: z.string().trim().max(300).default(""),
  orderCode: z.string().trim().max(60).default(""),
  note: z.string().trim().max(2000).default(""),
  lines: z.array(manualPoLineSchema).min(1, "ต้องมีอย่างน้อยหนึ่งรายการ").max(50, "สร้างได้ไม่เกิน 50 รายการต่อครั้ง"),
}).superRefine((value, ctx) => {
  const units = new Map<string, string>();
  value.lines.forEach((line, index) => {
    const existing = units.get(line.materialCode);
    if (existing && existing !== line.unit) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["lines", index, "unit"], message: "วัสดุเดียวกันต้องใช้หน่วยนับเดียวกัน" });
    }
    units.set(line.materialCode, line.unit);
  });
});
export type CreateManualPoInput = z.infer<typeof createManualPoSchema>;

/** Edit the controlled master data of a manual line; imported lines use updateLineSchema. */
export const updateManualLineSchema = z.object({
  lineId: z.string().uuid(),
  version: z.coerce.number().int().positive(),
  poNumber: z.string().trim().min(1, "ต้องระบุเลขที่ PO").max(40),
  ...manualLineFields,
  initialReceivedQty: nonNegativeQuantityText.default("0"),
  lastGrDate: optionalDate,
  orderCode: z.string().trim().max(60).default(""),
  vendorCode: z.string().trim().max(60).default(""),
  vendorName: z.string().trim().max(300).default(""),
  status: z.enum(poStatuses),
}).refine((value) => !(value.etaDate && value.etaText), manualEtaCheck);
export type UpdateManualLineInput = z.infer<typeof updateManualLineSchema>;

export const poListQuerySchema = z.object({
  q: z.string().trim().max(120).default(""),
  unit: z.union([z.enum(poUnits), z.literal("")]).default(""),
  status: z.union([z.enum(poStatuses), z.literal("")]).default(""),
  delivery: z.union([z.enum(poDeliveryStates), z.literal("")]).default(""),
  order: z.string().trim().max(60).default(""),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});
export type PoListQuery = z.infer<typeof poListQuerySchema>;

export type PoLineView = {
  id: string;
  origin: PoOrigin;
  poNumber: string;
  materialCode: string;
  description: string;
  unit: PoUnit;
  orderedQty: string | null;
  initialReceivedQty: string | null;
  receiptQty: string;
  receiptCount: number;
  unitPrice: string | null;
  poAmount: string | null;
  sourceOutstandingQty: string | null;
  poReleaseDate: string;
  lastGrDate: string | null;
  etaDate: string | null;
  etaText: string | null;
  orderCode: string | null;
  vendorCode: string | null;
  vendorName: string | null;
  status: PoStatus;
  note: string;
  version: number;
  sourceId: string | null;
  totals: PoLineTotals;
};

export type PoReceiptView = {
  id: string;
  receivedOn: string;
  quantity: string;
  reference: string;
  note: string;
  recordedByName: string;
  replacesReceiptId: string | null;
  voidedAt: string | null;
  voidedByName: string | null;
  voidReason: string | null;
};

export type PoSummary = {
  unknownAmountLines?: number;
  unit: PoUnit;
  lines: number;
  incompleteLines: number;
  ordered: string;
  initialReceived: string;
  receiptQty: string;
  outstanding: string;
  amount: string | null;
};
