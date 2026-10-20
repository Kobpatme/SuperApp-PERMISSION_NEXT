import { z } from "zod";
import { getWorkflowStatusKey, parseMoney, type DepositItem } from "@/lib/deposit-v2-domain";

export const depositStatuses = ["new", "fin", "att", "tl", "On Process", "ret", "clo", "done", "Cancel"] as const;
export type DepositStatus = (typeof depositStatuses)[number];
export const depositStatusSchema = z.enum(depositStatuses);
const money = z.coerce.number().finite().min(0).max(999_999_999);
const optionalText = z.string().trim().max(500).optional().default("");
const optionalDate = z.string().trim().refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), "Invalid date").optional().default("");
const optionalUrl = z.string().trim().refine((value) => !value || /^https:\/\//i.test(value), "Document URL must use HTTPS").optional().default("");

export const depositItemInputSchema = z.object({
  place: z.string().trim().min(1, "กรุณาระบุชื่ออาคาร").max(250),
  area: optionalText, customer: optionalText, cid: optionalText, pr: optionalText,
  contact: optionalText, tel: optionalText, mobile: optionalText, project: optionalText,
  deal: optionalText, no: optionalText, payTo: optionalText, payType: optionalText,
  detail: z.string().trim().max(2000).optional().default(""), note: z.string().trim().max(2000).optional().default(""),
  tl_team: optionalText, inspected_by: z.enum(["", "TL", "Building Dept"]).default(""),
  deposit: money, demolish: money, fee: money, other: money, other_desc: optionalText,
  dateReq: optionalDate, dateDue: optionalDate, dateCheck: optionalDate, dateAcc: optionalDate, install_date: optionalDate, tl_due_date: optionalDate,
  date_return: optionalDate, service_cancel_date: optionalDate,
  depReturn: z.enum(["Yes", "No"]).default("No"),
  demoReturn: z.enum(["Yes", "No"]).default("No"),
  pdf_payment: optionalUrl, pdf_layout: optionalUrl, pdf_additional: optionalUrl, pdf_tl_work: optionalUrl,
  pdf_tl_extra: optionalUrl, pdf_user_final: optionalUrl, pdf_demo_off: optionalUrl,
}).superRefine((value, ctx) => {
  if (value.other > 0 && !value.other_desc) ctx.addIssue({ code: "custom", path: ["other_desc"], message: "กรุณาระบุรายละเอียดค่าใช้จ่ายอื่น" });
  if (value.demoReturn === "Yes" && !value.demolish) ctx.addIssue({ code: "custom", path: ["demoReturn"], message: "ไม่มีเงินประกันรื้อถอนให้คืน" });
});
export type DepositItemInput = z.infer<typeof depositItemInputSchema>;

const next: Record<DepositStatus, readonly DepositStatus[]> = {
  new: ["fin", "Cancel"], fin: ["att", "done", "Cancel"], att: ["tl", "done", "Cancel"],
  tl: ["On Process", "att", "Cancel"], "On Process": ["ret", "Cancel"],
  ret: ["tl", "clo", "done", "Cancel"], clo: ["done", "Cancel"], done: [], Cancel: [],
};
export const availableDepositTransitions = (status: DepositStatus) => next[status];

export function validateDepositTransition(item: DepositItem, to: DepositStatus, reason = "") {
  const from = depositStatusSchema.parse(item.status);
  if (!next[from].includes(to)) throw new Error(`ไม่สามารถเปลี่ยนสถานะจาก ${from} เป็น ${to}`);
  if ((to === "Cancel" || (from === "tl" && to === "att") || (from === "ret" && to === "tl")) && !reason.trim()) {
    throw new Error("กรุณาระบุเหตุผล");
  }
  if (to === "done" && ["fin", "att"].includes(from) && (parseMoney(item.deposit) || parseMoney(item.demolish))) {
    throw new Error("ปิดอัตโนมัติได้เฉพาะรายการที่ไม่มีเงินประกัน");
  }
  if (to === "done" && ["fin", "att"].includes(from) && (parseMoney(item.fee) || parseMoney(item.other)) && !item.pdf_payment) {
    throw new Error("ต้องมีหลักฐานการจ่ายก่อนปิดรายการที่มีค่าใช้จ่าย");
  }
  if (to === "tl" && from === "att" && (!item.pdf_payment || !item.tl_team || !item.pdf_layout)) {
    throw new Error("ต้องมีหลักฐานการจ่าย แบบ Drawing และทีมติดตั้งก่อนส่งงาน");
  }
  if (to === "ret" && item.inspected_by !== "Building Dept" && !item.pdf_tl_work) {
    throw new Error("ต้องมีหลักฐานงานทีมติดตั้งก่อนส่งตรวจรับ");
  }
  if (to === "done" && from === "clo" && item.inspected_by !== "Building Dept" && !item.pdf_user_final) {
    throw new Error("ต้องมีหลักฐานปิดงานก่อนปิดรายการ");
  }
  if (to === "done" && from === "ret" && item.inspected_by !== "Building Dept") {
    throw new Error("การปิดจากขั้นตอนขอคืนเงินโดยตรงใช้ได้เฉพาะฝ่ายอาคารตรวจรับ");
  }
  return { from, to, workflowKey: getWorkflowStatusKey({ ...item, status: to }) };
}
