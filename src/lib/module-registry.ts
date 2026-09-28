export const modules = [
  {
    id: "work",
    number: 1,
    href: "/work",
    name: "งานและ KPI",
    shortLabel: "MOD 1",
    description: "จัดการงาน ติดตามผล และตรวจสอบความคืบหน้าของทีม",
    purpose: "งานและผลการดำเนินงาน",
    repository: "Kobpatme/maxiwa_KPI",
    accent: "violet",
    searchTerms: ["maxiwa", "kpi", "งาน", "sla", "performance"],
  },
  {
    id: "buildings",
    number: 2,
    href: "/buildings",
    name: "อาคารและค่าใช้จ่าย",
    shortLabel: "MOD 2",
    description: "ค้นหาข้อมูลอาคาร ค่าใช้จ่าย ใบเสนอราคา และเอกสารภายใน",
    purpose: "อาคารและเอกสาร",
    repository: "Kobpatme/Permission_Next",
    accent: "blue",
    searchTerms: ["permission", "อาคาร", "ค่าใช้จ่าย", "เอกสาร", "nas", "drawing"],
  },
  {
    id: "guarantees",
    number: 3,
    href: "/guarantees",
    name: "เงินประกัน",
    shortLabel: "MOD 3",
    description: "ติดตามเอกสาร ขั้นตอน และสถานะการขอคืนเงินประกัน",
    purpose: "เงินประกันและการติดตาม",
    repository: "Kobpatme/maxiwa",
    accent: "amber",
    searchTerms: ["คืนเงิน", "ประกัน", "อาคาร", "ติดตาม", "เอกสาร"],
  },
] as const;

export const overviewDestination = {
  id: "overview",
  href: "/",
  name: "ภาพรวม",
  shortLabel: "HOME",
  description: "งานเร่งด่วนและรายการที่ต้องติดตามจากทุกระบบ",
  searchTerms: ["home", "หน้าหลัก", "ภาพรวม", "workspace"],
} as const;

export type ModuleId = (typeof modules)[number]["id"];

export function getModule(id: string) {
  return modules.find((module) => module.id === id);
}

export function isModuleId(value: string): value is ModuleId {
  return modules.some((module) => module.id === value);
}
