import { z } from "zod";
import { getDiameterForCable } from "../domain/cables";
export { getDiameterForCable, getFiberTypeOptions } from "../domain/cables";
// Ported from METRIX f87220b schemas/ductRentalSchema.ts. Zod 4 -> target Zod 3.

export const OWNER_DUCT_OPTIONS = [
  "NT",
  "TRUE",
  "AWN",
  "SIC",
  "กทม.",
  "กรมทางหลวงท้องถิ่น",
  "กรมทางหลวงชนบท",
  "กรมทางหลวง",
  "3BB",
  "SYMC",
  "ITEL",
  "JASTEL",
] as const;

export const REQUEST_TYPE_OPTIONS = [
  { value: "NEW", label: "ขอเช่าท่อใหม่" },
  { value: "EXTENSION", label: "ต่อสัญญา" },
  { value: "CANCELLATION", label: "ขอยกเลิกใช้งาน" },
] as const;

export const JOB_TYPE_OPTIONS = ["Network", "Access", "Regulatory"] as const;

export const CABLE_TYPE_OPTIONS = ["Drop OFC", "ADSS", "ARSS"] as const;

export const SERVICE_CENTER_OPTIONS = [
  "BKK 1",
  "BKK 2",
  "BKK 3",
  "BKK 4",
  "RYG",
  "HYI",
  "PLK",
  "PKT",
  "CBI",
  "UDN",
  "KKN",
  "CMI",
  "RBI",
  "AYA",
  "NMA",
  "UBN",
  "SNI",
] as const;

export const VENDOR_CODE_OPTIONS = [
  { code: "1129267", name: "บมจ.โทรคมนาคมแห่งชาติ (NT)" },
  { code: "1123020", name: "บจก.ทรู อินเทอร์เน็ต คอร์ปอเรชั่น (True)" },
  { code: "1128244", name: "บจก.ทรู มูฟ เอช ยูนิเวอร์แซล คอมมิวนิเคชั่น (TUC)" },
  { code: "1125116", name: "บจก.แอดวานซ์ ไวร์เลส เน็ทเวอร์ค (AWN)" },
  { code: "1129145", name: "บจก.สมาร์ท อินฟราเน็ต (SIC)" },
  { code: "1123017", name: "บจก.ทริปเปิลที บรอดแบนด์ (3BB)" },
  { code: "1128532", name: "บจก.ซิมโฟนี่ คอมมิวนิเคชั่น (SYMC)" },
  { code: "1125372", name: "บจก.อินเตอร์ลิงค์ เทเลคอม (ITEL)" },
  { code: "1123143", name: "จัสเทล เน็ทเวิร์ค (JASTEL)" },
  { code: "1126266", name: "บมจ.อมตะ คอร์ปอเรชั่น (Amata)" },
] as const;

const optionalPositiveInteger = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.coerce.number().finite().int("กรุณากรอกเป็นจำนวนเต็ม").min(1, "กรุณากรอกจำนวนที่มากกว่า 0").optional()
);

export const DuctRentalSchema = z.object({
  requestType: z.enum(["NEW", "EXTENSION", "CANCELLATION"]).default("NEW"),
  projectName: z.string().min(1, "กรุณากรอกชื่อโครงการ"),
  routeName: z.string().min(1, "กรุณากรอกชื่อเส้นทาง / ถนน"),
  ownerDuct: z.enum(OWNER_DUCT_OPTIONS),
  memoNumber: z.string().optional(),
  routeDetail: z.string().min(1, "กรุณากรอกรายละเอียดเส้นทาง"),
  jobType: z.enum(JOB_TYPE_OPTIONS),
  serviceCenter: z.enum(SERVICE_CENTER_OPTIONS),
  supportInfo: z.string().optional(),

  cableType: z.enum(CABLE_TYPE_OPTIONS, {
    errorMap: () => ({ message: "กรุณาเลือกชนิดสาย" }),
  }),
  fiberType: z.string().min(1, "กรุณาเลือก Fiber Type"),
  cableCount: optionalPositiveInteger,
  diameter: z.coerce.number().finite().min(0.1, "กรุณากรอกไดมิตเตอร์"),
  distance: z.coerce.number().finite().min(0.01, "กรุณากรอกระยะทาง"),

  startCoords: z.string().min(1, "กรุณากรอกพิกัดต้นทาง"),
  endCoords: z.string().min(1, "กรุณากรอกพิกัดปลายทาง"),
  subDistrict: z.string().optional(),
  district: z.string().min(1, "กรุณากรอกอำเภอ/เขต"),
  province: z.string().min(1, "กรุณากรอกจังหวัด"),
  postalCode: z.string().optional(),
  uihArea: z.string().optional(),
  permissionRequestNumber: z.string().optional(),

  designContactName: z.string().optional(),
  designContactPhone: z.string().optional(),
  designContactEmail: z.string().optional(),
  installContactName: z.string().optional(),
  installContactPhone: z.string().optional(),
  installContactEmail: z.string().optional(),

  memoUrl: z.string().optional(),
  ductDrawingUrl: z.string().optional(),
}).superRefine((data, ctx) => {
  const expectedDiameter = getDiameterForCable(data.cableType, data.fiberType);

  if (!expectedDiameter) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["fiberType"],
      message: "Fiber Type ไม่ตรงกับชนิดสายที่เลือก",
    });
    return;
  }

  if (Math.abs(Number(data.diameter) - expectedDiameter) > 0.001) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["diameter"],
      message: `ไดมิตเตอร์ต้องเป็น ${expectedDiameter.toFixed(2)} mm ตามชนิดสายที่เลือก`,
    });
  }
});

export type DuctRentalFormData = z.infer<typeof DuctRentalSchema>;

export const InstallDetailSchema = z.object({
  actualStartCoords: z.string().min(1, "กรุณากรอกพิกัดจริงต้นทาง"),
  actualEndCoords: z.string().min(1, "กรุณากรอกพิกัดจริงปลายทาง"),
  actualDistance: z.coerce.number().finite().min(0.01, "กรุณากรอกระยะทางจริง"),
  markLength: z.string().min(1, "กรุณากรอก Mark length (ML)"),
  pipeCount: z.coerce.number().finite().optional(),
  installDate: z.string().min(1, "กรุณาระบุวันที่ติดตั้ง"),
  installNotes: z.string().optional(),
  supervisorName: z.string().optional(),
});

export type InstallDetailData = z.infer<typeof InstallDetailSchema>;
