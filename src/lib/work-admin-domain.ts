import Decimal from "decimal.js";
import { z } from "zod";
export const businessDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => { const date = new Date(`${v}T00:00:00Z`); return !Number.isNaN(date.getTime()) && date.toISOString().slice(0,10) === v; }, "วันที่ไม่ถูกต้อง");
export const decimalWeight = z.string().regex(/^\d+(\.\d{1,6})?$/).refine(v => new Decimal(v).gt(0) && new Decimal(v).lte(100), "น้ำหนักต้องมากกว่า 0 และไม่เกิน 100");
export const workKpiConfigSchema = z.object({ teamId: z.string().uuid(), mainKpi: z.string().trim().min(1).max(180), subKpi: z.string().trim().min(1).max(180), slaDays: z.coerce.number().int().min(0).max(366), mainWeight: decimalWeight });
export type WorkKpiConfig = z.infer<typeof workKpiConfigSchema>;
export const holidayInputSchema = z.object({ id: z.string().uuid().optional(), expectedVersion: z.number().int().positive().optional(), holidayDate: businessDateSchema, name: z.string().trim().min(1).max(180), source: z.enum(["company","thai"]), isActive: z.boolean() });
export function safeSystemUrl(value: string) {
  if (/^\/(?!\/)/.test(value) && !/[\\\u0000-\u0020]/.test(value)) return true;
  try { const url = new URL(value); return ["http:","https:"].includes(url.protocol) && !url.username && !url.password && !/[\u0000-\u0020]/.test(value); } catch { return false; }
}
export const systemLinkSchema = z.object({ id: z.string().uuid().optional(), expectedVersion: z.number().int().positive().optional(), name: z.string().trim().min(1).max(180), description: z.string().trim().max(1000), url: z.string().trim().max(2000).refine(safeSystemUrl, "ลิงก์ไม่ถูกต้อง"), icon: z.string().trim().max(80), status: z.enum(["Active","Maintenance","Coming Soon","Hidden"]), visibleToAll: z.boolean(), roleIds: z.array(z.string().uuid()).max(100), teamIds: z.array(z.string().uuid()).max(100) });
export const personalKpiSchema = z.object({ userId: z.string().uuid(), teamId: z.string().uuid(), expectedVersion: z.number().int().min(0), assignments: z.array(z.object({ metricId: z.string().uuid(), weight: decimalWeight, enabled: z.boolean() })).min(1).max(200) }).superRefine((value, ctx) => {
  if (new Set(value.assignments.map(a => a.metricId)).size !== value.assignments.length) ctx.addIssue({ code: "custom", message: "KPI ซ้ำ" });
  const enabled = value.assignments.filter(a => a.enabled);
  if (!enabled.length || !enabled.reduce((sum,a) => sum.add(a.weight), new Decimal(0)).eq(100)) ctx.addIssue({ code: "custom", message: "น้ำหนัก KPI ที่ใช้ต้องรวมเป็น 100%" });
});
export function visibleSystemLink(link: { status: string; visibleToAll: boolean; roleIds: string[]; teamIds: string[] }, roleIds: readonly string[], teamIds: readonly string[]) {
  return link.status !== "Hidden" && (link.visibleToAll || link.roleIds.some(id => roleIds.includes(id)) || link.teamIds.some(id => teamIds.includes(id)));
}
