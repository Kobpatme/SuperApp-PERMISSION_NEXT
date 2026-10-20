import { z } from "zod";

export const cableStages = ["DESIGN", "REVIEW", "SUBMITTED", "PERMIT", "CONFIRM", "INSTALL", "COMPLETE", "REVISION"] as const;
export type CableStage = typeof cableStages[number];
export const cableLabels: Record<CableStage, string> = { DESIGN: "ออกแบบเส้นทาง", REVIEW: "ตรวจเอกสารและรับงาน", SUBMITTED: "ยื่นขออนุญาต", PERMIT: "รับใบอนุญาต", CONFIRM: "ยืนยันแบบก่อนติดตั้ง", INSTALL: "ติดตั้ง", COMPLETE: "ปิดงาน", REVISION: "แก้ไขแบบ / เอกสาร" };
export const cableActionLabels: Record<CableStage, string> = { DESIGN: "ส่งตรวจเอกสาร", REVIEW: "ยืนยันยื่นขออนุญาตแล้ว", SUBMITTED: "ยืนยันได้รับใบอนุญาตแล้ว", PERMIT: "ส่งให้ทีมออกแบบยืนยัน", CONFIRM: "ยืนยันแบบและส่งติดตั้ง", INSTALL: "ตรวจรับและปิดงาน", COMPLETE: "ปิดงานแล้ว", REVISION: "ส่งตรวจเอกสารฉบับแก้ไข" };
const text = (max: number) => z.string().trim().max(max).default("");
export const cableInput = z.object({ authority: z.enum(["PEA", "MEA"]), projectName: z.string().trim().min(1, "กรุณากรอกชื่อโครงการ").max(200), routeName: text(200), startPoint: text(200), endPoint: text(200), cableType: text(100), contact: text(200), submissionNumber: text(100), permitNumber: text(100), notes: text(4000) }).strict();
export type CableInput = z.infer<typeof cableInput>;
export const cableChange = z.object({ version: z.number().int().positive(), action: z.enum(["save", "advance", "revise", "archive"]), data: cableInput, reason: text(2000) }).strict();
export function cablePermission(stage: CableStage) {
  return `duct_rental.${stage === "DESIGN" || stage === "REVISION" || stage === "CONFIRM" ? "design" : stage === "INSTALL" ? "install" : "permission1"}.submit`;
}
export function cableNext(stage: CableStage, data: CableInput, revise = false, reason = ""): CableStage {
  if (revise) {
    if (stage !== "SUBMITTED" || !reason.trim()) throw new Error("ส่งกลับได้เฉพาะงานที่ยื่นแล้ว และต้องระบุเหตุผล");
    return "REVISION";
  }
  if (stage === "COMPLETE") throw new Error("งานนี้ปิดแล้ว");
  if (["DESIGN", "REVISION"].includes(stage) && (!data.routeName || !data.startPoint || !data.endPoint || !data.cableType)) throw new Error("กรุณากรอกเส้นทาง จุดต้นทาง จุดปลายทาง และประเภทสายให้ครบ");
  if (stage === "REVIEW" && !data.submissionNumber) throw new Error("กรุณากรอกเลขรับเรื่องก่อนยืนยันการยื่น");
  if (stage === "SUBMITTED" && !data.permitNumber) throw new Error("กรุณากรอกเลขใบอนุญาต");
  if (stage === "INSTALL" && !data.notes) throw new Error("กรุณาบันทึกผลติดตั้งและตรวจรับก่อนปิดงาน");
  const next: Record<Exclude<CableStage, "COMPLETE">, CableStage> = { DESIGN: "REVIEW", REVIEW: "SUBMITTED", SUBMITTED: "PERMIT", PERMIT: "CONFIRM", CONFIRM: "INSTALL", INSTALL: "COMPLETE", REVISION: "REVIEW" };
  return next[stage as Exclude<CableStage, "COMPLETE">];
}
