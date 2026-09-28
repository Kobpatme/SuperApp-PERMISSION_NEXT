/** Pure quotation helpers ported from Permission_Next/quotation-engine.js. */
export type Floor = { numeric: number; label: string };
const groundAliases = new Set(["G", "GF", "M", "MEZZ", "MEZZANINE", "GROUND", "LOBBY"]);

export function parseFloorInput(raw: unknown): Floor | null {
  const cleaned = String(raw ?? "").trim().replace(/^ชั้น\s*/i, "").toUpperCase();
  if (!cleaned) return null;
  if (groundAliases.has(cleaned)) return { numeric: 0, label: "G" };
  const basement = cleaned.match(/^B(\d+)$/);
  if (basement) { const level = Number(basement[1]); return { numeric: -level, label: `B${level}` }; }
  const numeric = cleaned.match(/^(\d+)$/);
  if (numeric) { const level = Number(numeric[1]); return { numeric: level, label: String(level) }; }
  return null;
}

export function formatFloorLabel(numeric: number | null | undefined, fallback = "-") {
  if (numeric == null || Number.isNaN(numeric)) return fallback;
  return numeric === 0 ? "G" : numeric < 0 ? `B${Math.abs(numeric)}` : String(numeric);
}

export function parseWmFloors(value: unknown): Floor[] {
  const raw = String(value ?? "").trim();
  if (!raw || ["no", "null", "none", "-"].includes(raw.toLowerCase())) return [];
  const tokens = raw.split(/[,/|]|\s+ชั้น\s*|\s+และ\s+/).map((part) => part.trim()).filter(Boolean);
  const floors: Floor[] = [];
  const seen = new Set<number>();
  const push = (floor: Floor | null) => { if (floor && !seen.has(floor.numeric)) { seen.add(floor.numeric); floors.push(floor); } };
  tokens.forEach((token) => push(parseFloorInput(token)));
  if (!floors.length) {
    [...raw.matchAll(/\bB(\d+)\b/gi)].forEach((match) => push(parseFloorInput(`B${match[1]}`)));
    [...raw.matchAll(/\b(\d+)\b/g)].forEach((match) => push(parseFloorInput(match[1])));
    if (/\bG\b|\bGF\b|\bชั้น\s*G\b/i.test(raw)) push(parseFloorInput("G"));
  }
  return floors.sort((a, b) => a.numeric - b.numeric);
}

export const countVerticalFloors = (wmNumeric: number, customerNumeric: number) => Math.abs(customerNumeric - wmNumeric) + 1;

export function formatThaiDate(value: Date | string, buddhist = true) {
  const date = value instanceof Date ? value : new Date(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear() + (buddhist ? 543 : 0)}`;
}

export function generateQuotationRef(buildingId: unknown, now = new Date()) {
  const ymd = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const buildingPart = String(buildingId ?? "0000").replace(/\D/g, "").slice(-4).padStart(4, "0");
  return `PN-${ymd}-${hour}${minute}-${buildingPart}`;
}

export function buildQuotationDates(issueDate: Date | string = new Date(), validDays = 7) {
  const issued = issueDate instanceof Date ? issueDate : new Date(issueDate);
  const expires = new Date(issued);
  expires.setDate(expires.getDate() + validDays);
  return { issued, expires, issuedText: formatThaiDate(issued), expiresText: formatThaiDate(expires), validDays };
}

export function sanitizeQuotationFilename(name: unknown, fallback = "quotation") {
  const ascii = String(name || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w.-]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").slice(0, 60);
  return ascii || fallback;
}

export function checkHorizontalDistance(hwire: unknown, maxHorizontal: unknown) {
  const value = Number(hwire), max = Number(maxHorizontal);
  if (!Number.isFinite(value) || value < 0) return { level: "error" as const, message: "ระยะ Horizontal ต้องไม่ติดลบ" };
  if (Number.isFinite(max) && max > 0 && value > max) return { level: "warning" as const,
    message: `เกิน Max H-Wire ของอาคาร (${max.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ม.) — ควรยืนยันกับทีม Permission` };
  return { level: "ok" as const, message: "" };
}

export function buildCopySummaryText(input: {
  quoteRef?: string; customerName?: string; buildingName?: string; wmFloorLabel?: string; custFloorLabel?: string;
  totalCostText?: string; revenueMonthlyText?: string; issuedText?: string; expiresText?: string; salesPerson?: string; remark?: string;
}) {
  return [
    `ใบประเมินราคาเบื้องต้น ${input.quoteRef || ""}`.trim(), `ลูกค้า: ${input.customerName || "-"}`, `อาคาร: ${input.buildingName || "-"}`,
    `ชั้นลูกค้า: ${input.custFloorLabel || "-"} | ชั้น WM: ${input.wmFloorLabel || "-"}`,
    `ยอดเริ่มต้น: ${input.totalCostText || "-"}`,
    input.revenueMonthlyText ? `ค่าใช้จ่ายต่อเนื่องโดยประมาณ: ${input.revenueMonthlyText}` : "",
    `วันที่: ${input.issuedText || "-"} | หมดอายุ: ${input.expiresText || "-"}`,
    input.salesPerson ? `ผู้เสนอราคา: ${input.salesPerson}` : "", input.remark ? `หมายเหตุ: ${input.remark}` : "",
    "", "— ใบประเมินราคาเบื้องต้น ไม่ใช่ใบเสนอราคาสุดท้าย —",
  ].filter(Boolean).join("\n");
}
