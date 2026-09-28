import type { DashboardItem, DashboardSnapshot } from "@/lib/dashboard";
import { modules, type ModuleId } from "@/lib/module-registry";

/** Fictional examples. Only the server's development session may opt into this snapshot. */
export function buildPreviewSnapshot(allowed: ModuleId[], userId: string, reference = new Date().toISOString()): DashboardSnapshot {
  const buildings = ["อาคารตัวอย่าง อรุณ", "อาคารตัวอย่าง สวนเหนือ", "อาคารตัวอย่าง ริมธาร", "อาคารตัวอย่าง เมโทร", "อาคารตัวอย่าง พาร์ค", "อาคารตัวอย่าง ศูนย์กลาง"];
  const descriptions = {
    work: ["ตรวจสอบเอกสารก่อนส่งอนุมัติ", "ติดตามความคืบหน้ากับทีมอาคาร", "สรุปผลการดำเนินงานประจำสัปดาห์", "นัดหมายเข้าตรวจพื้นที่"],
    buildings: ["ทบทวนเงื่อนไขค่าใช้จ่าย", "ตรวจสอบรายละเอียดใบเสนอราคา", "ติดตามเอกสารประกอบอาคาร", "ยืนยันข้อมูลติดต่ออาคาร"],
    guarantees: ["ติดตามคำขอคืนเงินประกัน", "ตรวจความครบถ้วนของเอกสาร", "ติดตามผลการพิจารณา", "ตรวจสอบหลักฐานการคืนเงิน"],
  };
  const statuses = ["รอตรวจสอบ", "กำลังดำเนินการ", "รอเอกสาร", "รออนุมัติ"];
  const items: DashboardItem[] = allowed.flatMap((moduleId) => Array.from({ length: 28 }, (_, index) => {
    const code = `${moduleId === "work" ? "WK" : moduleId === "buildings" ? "BLD" : "GT"}-${String(index + 1).padStart(4, "0")}`;
    const due = new Date(reference);
    due.setUTCDate(due.getUTCDate() + [-1, 0, 0, 1, 2, 4, 7][index % 7]);
    return {
      id: `example-${code}`, code, moduleId,
      kind: moduleId === "work" ? "task" : moduleId === "buildings" ? "building" : "guarantee",
      priority: index % 7 === 0 ? "urgent" : index % 3 === 0 ? "attention" : "normal",
      title: descriptions[moduleId][index % 4], buildingName: buildings[index % buildings.length],
      description: "ข้อมูลสมมติสำหรับทดลองหน้าจอและขั้นตอนการใช้งาน ไม่มีผลต่อข้อมูลจริง",
      href: modules.find((module) => module.id === moduleId)!.href,
      dueAt: index % 9 === 8 ? undefined : due.toISOString(),
      statusLabel: statuses[index % statuses.length],
      ownerId: index % 3 === 0 ? userId : `example-team-${index % 2}`,
      ownerName: index % 3 === 0 ? "ฉัน" : index % 2 ? "ทีมปฏิบัติการ" : "ทีมอาคาร",
      nextAction: index % 4 === 2 ? "รวบรวมเอกสารที่ยังขาด แล้วส่งให้ผู้รับผิดชอบตรวจสอบ" : "ตรวจสอบรายละเอียดและประสานงานกับผู้รับผิดชอบ",
      updatedAt: reference,
    };
  }));
  return { generatedAt: reference, items, sources: allowed.map((moduleId) => ({ moduleId, status: "ready", itemCount: items.filter((item) => item.moduleId === moduleId).length, message: "ข้อมูลตัวอย่าง" })) };
}
