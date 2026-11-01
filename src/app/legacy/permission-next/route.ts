/**
 * ARCHIVED REFERENCE PROTOTYPE — Permission Next (อาคาร / buildings module)
 *
 * เก็บไว้เป็นเอกสารอ้างอิงด้านภาพและเวิร์กโฟลว์ก่อนการย้ายระบบเท่านั้น
 * (ดู ARCHITECTURE-BASELINE.md: "เก็บ prototype ปัจจุบันเป็น visual/workflow reference ก่อน migration")
 *
 * ไม่ใช่ส่วนหนึ่งของฟีเจอร์อาคารที่ใช้งานจริง ห้ามนำเข้า (import) เชื่อมโยง หรือนำทางจากเปลือกโปรแกรมตัวกลาง
 * การทำงานเดิมของไฟล์นี้คืออ่าน `mods/permission-next/Permission_Next.html` แล้วแทรกสคริปต์เชื่อมต่อเซสชัน
 * (`window.__SUPER_APP_SESSION__`) และสะพาน postMessage สำหรับธีม/แถบด้านข้าง โค้ดรันไทม์นั้นทับซ้อนกับการจัดการ
 * เซสชันของเปลือกโปรแกรมตัวกลางที่มีอยู่แล้ว (`@/components/app-shell.tsx`, `workspace-theme-toggle.tsx`,
 * `module-nav.tsx`) จึงถูกลบออก ไฟล์ HTML ต้นแบบยังคงอยู่บนดิสก์ที่ `mods/permission-next/Permission_Next.html`
 *
 * แหล่งข้อมูลเดียว (single source of truth) ของฟีเจอร์อาคารปัจจุบัน:
 *   - src/features/buildings/              คอมโพนเนนต์ UI (แบบฟอร์มแก้ไข, ลบอาคาร, แผนที่, ตัวเลือกตำแหน่ง)
 *   - src/app/api/buildings/               Route Handlers (สร้าง / แก้ไข / ลบ / บริการที่ตั้ง)
 *   - src/lib/permission-building-domain.ts โดเมน logique (การทำให้เป็นปกติ, ค่าบริการ BOQ)
 *   - src/lib/permission-quotation.ts      ฟังก์ชันช่วยเหลือใบเสนอราคา
 *
 * เส้นทางอาคารที่ใช้งานจริงถูกเสิร์ฟภายใต้ `/buildings` ผ่าน `src/app/(platform)/buildings/`
 */
import { getAccessContext } from "@/lib/access";

export const runtime = "nodejs";

export async function GET() {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  const access = await getAccessContext("buildings");
  if (!access.allowed) return new Response("Forbidden", { status: 403 });
  const body = [
    "<!DOCTYPE html>",
    "<html lang=\"th\">",
    "<head><meta charset=\"utf-8\"><title>Permission Next — ต้นแบบอ้างอิง (เก็บถาวร)</title></head>",
    "<body style=\"font-family:sans-serif;padding:24px;color:#1f2937\">",
    "<h1>Permission Next — ต้นแบบอ้างอิง (เก็บถาวร)</h1>",
    "<p>หน้านี้คือต้นแบบเดิมของฟีเจอร์อาคาร ซึ่งเก็บไว้เป็นเอกสารอ้างอิงด้านภาพและเวิร์กโฟลว์ก่อนการย้ายระบบเท่านั้น ไม่ใช่ส่วนหนึ่งของฟีเจอร์อาคารที่ใช้งานจริง</p>",
    "<p>ฟีเจอร์อาคารที่ใช้งานจริงอยู่ที่ <a href=\"/buildings\">/buildings</a> และถูกพัฒนาเป็นแหล่งเดียวจาก:</p>",
    "<ul>",
    "<li><code>src/features/buildings/</code> — คอมโพนเนนต์ UI (แบบฟอร์มแก้ไข, ลบอาคาร, แผนที่, ตัวเลือกตำแหน่ง)</li>",
    "<li><code>src/app/api/buildings/</code> — Route Handlers (สร้าง / แก้ไข / ลบ / บริการที่ตั้ง)</li>",
    "<li><code>src/lib/permission-building-domain.ts</code> — โดเมน logique (การทำให้เป็นปกติ, ค่าบริการ BOQ)</li>",
    "<li><code>src/lib/permission-quotation.ts</code> — ฟังก์ชันช่วยเหลือใบเสนอราคา</li>",
    "</ul>",
    "<p>โค้ดรันไทม์เดิม (การแทรกเซสชันและสะพาน postMessage) ถูกลบออกเนื่องจากทับซ้อนกับการจัดการเซสชันของเปลือกโปรแกรมตัวกลาง</p>",
    "</body>",
    "</html>",
  ].join("");

  return new Response(body, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
