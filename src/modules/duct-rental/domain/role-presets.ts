import { ductRentalCapabilities } from "../capabilities";

const reader = ["module.view", "document.read", "document.export", "rate.read"];
const worker = [...reader, "document.upload", "request.update"];
const phases = (...resources: string[]) => resources.flatMap(resource => [`${resource}.accept`, `${resource}.submit`]);
const preset = (legacyRole: string, name: string, permissions: string[]) => ({
  code: `duct_rental_${legacyRole}`, legacyRole, name,
  description: "ชุดเริ่มต้นจาก METRIX; แอดมินแก้และมอบ scope ผ่าน Core ได้ ไม่มีการมอบให้ผู้ใช้โดยอัตโนมัติ",
  permissions: permissions.map(code => `duct_rental.${code}`),
});

// Frozen Source phase ownership and reachable annual/cancellation controls.
// Use ALL to reproduce Source visibility within touched phases; narrower scopes remain optional.
// Sr. Manager has assigned-only signing (DQ01); it gains no workflow write capability.
export const ductRentalRolePresets = [
  { ...preset("admin", "เช่าท่อ · ผู้ดูแลโมดูล", []), permissions: ductRentalCapabilities.map(capability => capability.code) },
  preset("design", "เช่าท่อ · ทีมออกแบบ", [...worker, "request.create", ...phases("design"), "renewal.create", "renewal.review", "cancellation.create"]),
  preset("draftsman", "เช่าท่อ · ทีมเขียนแบบ", [...worker, ...phases("draftsman", "draftsman2")]),
  preset("permission", "เช่าท่อ · ทีมขออนุญาต", [...worker, ...phases("permission1", "permission2", "permission3"), "renewal.memo", "cancellation.advance"]),
  preset("install", "เช่าท่อ · ทีมติดตั้ง", [...worker, ...phases("install")]),
  preset("3rdparty", "เช่าท่อ · ทีมผู้ให้บริการ", [...worker, ...phases("thirdparty1", "thirdparty2"), "renewal.confirm", "renewal.contract"]),
  preset("viewer", "เช่าท่อ · ผู้ดูข้อมูลและแก้ข้อมูลคำขอของตน", [...reader, "request.update"]),
  preset("director", "เช่าท่อ · Director อ่านอย่างเดียว", reader),
  preset("division_manager", "เช่าท่อ · Division Manager อ่านอย่างเดียว", reader),
  preset("sr_manager", "เช่าท่อ · Sr. Manager อ่านและลงนามงานที่มอบหมาย", [...reader, "signoff.sign"]),
];
