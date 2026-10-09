import type { ModuleCapability } from "@/lib/module-contract";

function capability(code: string, labelTh: string, risk: ModuleCapability["risk"] = "normal"): ModuleCapability {
  return { code, labelTh, descriptionTh: labelTh, risk, allowedScopes: ["OWN", "TEAM", "SELECTED_TEAMS", "ALL"] };
}

// Source: METRIX f87220b phase handlers/useRequestStore. These are grants, not legacy role flags.
export const ductPhaseResources = [
  ["design", "ออกแบบ"], ["draftsman", "เขียนแบบ"], ["permission1", "ขออนุญาตครั้งที่ 1"],
  ["install", "ติดตั้ง"], ["draftsman2", "แบบหลังติดตั้ง"], ["permission2", "ขออนุญาตครั้งที่ 2"],
  ["thirdparty1", "แจ้งอัตราค่าเช่า"], ["permission3", "ดำเนินการชำระเงิน"], ["thirdparty2", "บันทึกสัญญา"],
] as const;

export const ductRentalCapabilities: ModuleCapability[] = [
  capability("duct_rental.module.view", "ดูโมดูลเช่าท่อร้อยสาย"),
  capability("duct_rental.request.create", "สร้างคำขอเช่าท่อ"),
  capability("duct_rental.request.update", "แก้ไขข้อมูลคำขอเช่าท่อ", "sensitive"),
  capability("duct_rental.request.archive", "เก็บคำขอเช่าท่อเข้าประวัติ", "sensitive"),
  capability("duct_rental.document.read", "ดูเอกสารเช่าท่อ"),
  capability("duct_rental.document.upload", "แนบเอกสารเช่าท่อ", "sensitive"),
  capability("duct_rental.document.export", "ส่งออกเอกสารเช่าท่อ", "sensitive"),
  capability("duct_rental.rate.read", "ดูอัตราค่าเช่าท่อ", "sensitive"),
  ...ductPhaseResources.flatMap(([resource, label]) => [
    capability(`duct_rental.${resource}.accept`, `รับงาน${label}`),
    capability(`duct_rental.${resource}.submit`, `ส่งงาน${label}`, "sensitive"),
  ]),
  capability("duct_rental.renewal.create", "สร้างงานต่อสัญญารายปี"),
  capability("duct_rental.renewal.review", "ตรวจเส้นทางและส่งต่อสัญญา", "sensitive"),
  capability("duct_rental.renewal.memo", "จัดทำบันทึกต่อสัญญา", "sensitive"),
  capability("duct_rental.renewal.confirm", "ยืนยันผู้ให้บริการต่อสัญญา", "sensitive"),
  capability("duct_rental.renewal.contract", "บันทึกสัญญารายปี", "sensitive"),
  capability("duct_rental.renewal.archive", "เก็บงานต่อสัญญาเข้าประวัติ", "sensitive"),
  capability("duct_rental.cancellation.create", "ขอยกเลิกการใช้ท่อ", "sensitive"),
  capability("duct_rental.cancellation.advance", "ดำเนินงานยกเลิกการใช้ท่อ", "sensitive"),
  capability("duct_rental.cancellation.reject", "ปฏิเสธงานยกเลิกการใช้ท่อ", "sensitive"),
  capability("duct_rental.cancellation.archive", "เก็บงานยกเลิกเข้าประวัติ", "sensitive"),
  capability("duct_rental.signoff.assign", "มอบหมายผู้ลงนามเอกสาร", "administrative"),
  capability("duct_rental.signoff.sign", "ลงนามเอกสารที่ได้รับมอบหมาย", "sensitive"),
  capability("duct_rental.signoff.revoke", "ขอให้ลงนามเอกสารใหม่", "administrative"),
  capability("duct_rental.settings.manage", "ตั้งค่าโมดูลเช่าท่อร้อยสาย", "administrative"),
];
