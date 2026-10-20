import type { DuctRentalFormData } from "../schemas/design";
// METRIX ntFormFiller.ts buildFieldValues; DQ03 approved exception: actual cable count.
export function ntFieldValues(data?: Partial<DuctRentalFormData>): Record<string, string> {
  if (!data) return {};
  return {
    "เลขที่คำขอ": data.permissionRequestNumber || "", "ชื่อถนน (3)": data.routeDetail || data.routeName || "",
    "Start (3)": data.startCoords || "", "End (3)": data.endCoords || "", "Latitude (3)": data.startCoords || "", "Longitude (3)": data.endCoords || "",
    "แขวง/ตำบล (3)": data.subDistrict || "", "เขต/อำเภอ (3)": data.district || "", "จังหวัด (3)": data.province || "", "รหัสไปรษณีย์ (3)": data.postalCode || "",
    "จำนวนเส้น (3)": String(data.cableCount ?? 1), "ชนิดของสายสื่อสาร (3)": data.cableType || "", "ขนาด (3)": data.fiberType || "",
    "เส้นผ่านศูนย์กลาง (3)": data.diameter ? String(data.diameter) : "", "ระยะทาง (3)": data.distance ? String(data.distance) : "",
    "ชื่อ/นามสกุลผู้ประสานงาน (4)": data.designContactName || "", "โทรศัพท์ผู้ประสานงาน (4)": data.designContactPhone || "", "โทรศัพท์มือถือผู้ประสานงาน (4)": data.designContactPhone || "", "อีเมล์ผู้ประสานงาน (4)": data.designContactEmail || "",
    "ชื่อ/นามสกุลผู้ประสานงาน (5)": data.installContactName || data.designContactName || "", "โทรศัพท์ผู้ประสานงาน (5)": data.installContactPhone || data.designContactPhone || "", "โทรศัพท์มือถือผู้ประสานงาน (5)": data.installContactPhone || data.designContactPhone || "", "อีเมล์ผู้ประสานงาน (5)": data.installContactEmail || data.designContactEmail || "",
  };
}
