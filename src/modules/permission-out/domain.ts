import { analyzeRoutes as runGeometry } from "./geometry.mjs";
import Decimal from "decimal.js";
import { z } from "zod";

export const sourceSha = "55380a5d5bdd7e82caa3fbd87ac4b72f979d383e";
export const algorithmVersion = "permission-out-sampled-diff-v1";
export const coordinateSchema = z.tuple([z.number().finite().min(-180).max(180), z.number().finite().min(-90).max(90)]);
const decimal = z.string().regex(/^\d{1,12}(?:\.\d{1,8})?$/);
export const routeSchema = z.object({
  key: z.string().min(1).max(500), name: z.string().max(300), coords: z.array(coordinateSchema).min(2).max(10000),
  diameter: decimal.nullable().default(null), poles: z.number().int().min(0).max(10000000).nullable().default(null),
  province: z.string().max(100).default(""), cableStatus: z.string().max(100).default(""), sourceFile: z.string().max(255).default(""),
  metadata: z.record(z.string().max(4000)).default({}),
  provinces: z.array(z.string()).default([]), category: z.enum(["network","ready-access","customer"]).default("network"),
});
export type RouteLine = z.infer<typeof routeSchema>;
export type Coordinate = z.infer<typeof coordinateSchema>;
export type Segment = RouteLine & { length: number; status: "new" | "same" | "remove"; overlapType: "none" | "partial" | "full"; peaAreas?: { key: string; name: string; coverageRatio: number;areaId?:string;officeType?:string }[] };
export const analysisOptionsSchema = z.object({ threshold: z.number().min(1).max(500), interval: z.number().min(1).max(500), dedupe: z.boolean().default(false) });
export const formulaSchema = z.object({
  name: z.string().trim().min(1).max(100), polesPerKm: decimal, rate: decimal, surchargePercent: decimal,
  effectiveFrom: z.string().datetime(), rounding: z.literal("summary_half_up_2"),
});
export type Formula = z.infer<typeof formulaSchema>;
export const siteSchema = z.object({
  key: z.string().trim().min(1).max(120),code:z.string().trim().max(120).default(""), name: z.string().max(300), regional: z.string().max(100).default(""), area: z.string().max(100).default(""),
  province: z.string().max(100).default(""), grade: z.string().max(100).default(""), type: z.string().max(100).default(""), owner: z.string().max(200).default(""),
  siteType:z.string().max(200).default(""),district:z.string().max(200).default(""),nodeEquipment:z.string().max(500).default(""),customers:z.coerce.number().int().min(0).max(10000000).default(0),remark:z.string().max(2000).default(""),
  latitude: z.number().finite().min(-90).max(90).nullable(), longitude: z.number().finite().min(-180).max(180).nullable(),
  properties: z.record(z.string().max(4000)).default({}),
});
export type Site = z.infer<typeof siteSchema>;

// Source math: spherical distance, equirectangular nearest segment, interval
// sampling, 90% self coverage. Source SHA above is the behavioral reference.
export { distance, lineLength, sampleLine, deduplicate } from "./geometry.mjs";
export function analyzeRoutes(base: RouteLine[], compare: RouteLine[], rawOptions: unknown): Segment[] {
  return runGeometry(base,compare,analysisOptionsSchema.parse(rawOptions));
}
export function calculateFees(segments: Segment[], rawFormula: Formula) {
  const formula = formulaSchema.parse(rawFormula);
  const items = segments.map(segment => {
    const poles = segment.poles ?? new Decimal(String(segment.length)).div(1000).mul(formula.polesPerKm).ceil().toNumber();
    return { key: segment.key, poles, poleSource: segment.poles === null ? "distance" : "provided", cost: segment.diameter === null ? null : new Decimal(segment.diameter).mul(poles).mul(formula.rate).toString() };
  });
  const subtotal = items.reduce((sum, i) => sum.plus(i.cost ?? 0), new Decimal(0)), surcharge = subtotal.mul(formula.surchargePercent).div(100);
  return { items, incomplete: items.some(i => i.cost === null), subtotal: subtotal.toFixed(2, Decimal.ROUND_HALF_UP), surcharge: surcharge.toFixed(2, Decimal.ROUND_HALF_UP), total: subtotal.plus(surcharge).toFixed(2, Decimal.ROUND_HALF_UP) };
}
const selections=(value:unknown)=>typeof value==="string"?(value?value.split("|"):[]):value??[];
export const filterSchema = z.object({ q: z.string().max(200).default(""), province:z.preprocess(selections,z.array(z.string().max(100)).max(77)),status:z.preprocess(selections,z.array(z.enum(["new","same","remove"])).max(3)),overlap:z.preprocess(selections,z.array(z.enum(["none","partial","full"])).max(3)),cableStatus:z.preprocess(selections,z.array(z.string().max(100)).max(100)),category:z.preprocess(selections,z.array(z.enum(["network","ready-access","customer"])).max(3)), area: z.string().max(300).default("") });
export function filterSegments(segments: Segment[], raw: unknown) {
  const filter = filterSchema.parse(raw);
  return segments.filter(s => (!filter.q || `${s.key} ${s.name} ${s.sourceFile}`.toLowerCase().includes(filter.q.toLowerCase())) && (!filter.province.length || filter.province.some(p=>s.province===p||s.provinces.includes(p))) && (!filter.status.length || filter.status.includes(s.status)) && (!filter.overlap.length || filter.overlap.includes(s.overlapType)) && (!filter.area || s.peaAreas?.some(a => a.key === filter.area)) && (!/maxi/i.test(s.sourceFile) || ((!filter.cableStatus.length || filter.cableStatus.includes(s.cableStatus)) && (!filter.category.length || filter.category.includes(s.category)))));
}
export function stripSensitive(properties: Record<string, string>) {
  return Object.fromEntries(Object.entries(properties).filter(([key]) => !/opex|ค่าใช้จ่าย|cost|expense|secret|password|token|api[_ -]?key|authorization|credential/i.test(key)));
}
export function summarizeDiff(previous: { key: string; data: unknown }[], next: { key: string; data: unknown }[]) {
  const canonical = (value: unknown): string => {
    if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
    if (value && typeof value === "object") return `{${Object.entries(value).sort(([a],[b]) => a.localeCompare(b)).map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`).join(",")}}`;
    return JSON.stringify(value) ?? "null";
  };
  const old = new Map(previous.map(row => [row.key, canonical(row.data)])), keys = new Set(next.map(row => row.key));
  let added = 0, updated = 0, unchanged = 0;
  for (const row of next) { const before = old.get(row.key); if (before === undefined) added++; else if (before === canonical(row.data)) unchanged++; else updated++; }
  return { added, updated, unchanged, removed: previous.filter(row => !keys.has(row.key)).length, total: next.length };
}
