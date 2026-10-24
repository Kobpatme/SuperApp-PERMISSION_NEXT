# DESIGN — Figma-aligned Enterprise Workspace (ข้อเสนอปรับปรุงทั้งระบบ)

## Current proposal — PLAN ONLY
MaxWell ขอแผนใหม่หลังไม่ยอมรับคุณภาพภาพรอบ Operational Command. ส่วนนี้เป็นข้อเสนอสำหรับงานถัดไป **ไม่ใช่การอนุมัติให้เริ่มแก้โค้ด** และไม่ทำให้ runtime เปลี่ยน. ข้อความใต้หัวข้อ Historical specification ด้านล่างเป็นประวัติเท่านั้น; กติกา sidebar เข้มเสมอของแผนเดิมไม่ใช่เป้าหมายใหม่โดยอัตโนมัติ.

## เป้าหมายและ reference
ปรับชั้น UX/UI ของ SuperApp เดิมให้เป็นผลิตภัณฑ์เดียว โดยรักษา routes, business workflows, permissions, integrations และข้อมูล. ไม่สร้างโครงการใหม่และไม่เปลี่ยนทุกโมดูลเป็น CRM.

Reference หลัก: [User Management reports | Multi theme & Dark mode | Complex Application (Community)](https://www.figma.com/design/VXZx2mWUSIDUyUkW7XEJnq/User-Management-reports-%7C-Multi-theme---Dark-mode-%7C-Complex-Application--Community-?node-id=10-25746&p=f&t=YRHbz6Xgrv8SDwQ9-0).

หลักฐาน: เปิด canvas หน้า Screens จริง เห็น Light/Dark, Mobile/Tablet/Desktop/Large Desktop และหลาย accent variants; ตรวจ light Desktop/Large Desktop แบบซูมแล้ว. **ยังไม่ยืนยัน** exact tokens/fonts/spacing, variants ภายใน, prototype interactions, หน้าฟอร์มเฉพาะทุกแบบ และ license ของ assets/BrixUI. หาก inspect ไม่ได้ ให้ใช้ exported frames/screenshots ที่เจ้าของเลือก ไม่เดาว่าเป็นค่าแท้. ไม่ copy library/assets จนตรวจสิทธิ์ และไม่รับปาก similarity percentage/pixel-perfect โดยไม่มีภาพวัดเทียบ.

## Visual direction ที่เสนอ
- Light mode สว่างทั้ง sidebar/header/workspace แยกด้วย subtle surfaces และเส้นขอบ; Dark mode เปลี่ยน semantic colors ทั้งชุด รวม overlays. **เลิกข้อบังคับ dark sidebar ใน Light mode เมื่อแผนใหม่นี้ได้รับอนุมัติ**
- เสนอคงน้ำเงิน #244fb8 เป็น accent เริ่มต้น; dark accent/hover/on-color ต้องผ่าน contrast. รองรับโครง tokens ที่ขยาย accent ได้ แต่ไม่สร้าง theme picker หลายสีในรอบแรกโดยยังไม่ได้เลือก
- Layout: navigation → breadcrumb/context → title/primary action → search/filter/view controls → table/content → pagination/summary
- Global search และ local search แยกชัด; ไม่ทำให้ค้นหาหรือ primary action หายบนมือถือ
- Expanded sidebar / rail / drawer ใช้เมนูและ permission filtering เดิมร่วมกัน; current destination/deep link/query state ต้องถูกต้อง
- ขนาด sidebar/header/แถว/ช่องว่าง lock จาก visual pilot ไม่ถือค่ารอบเดิมเป็นอนุมัติใหม่โดยอัตโนมัติ
- ตารางเป็น workspace จริง: alignment, row density, selection, filter chips/reset, sort และ pagination สม่ำเสมอ. ไม่วางปุ่มปลอมที่ไม่มี backend หรือสิทธิ์รองรับ
- ไม่บังคับ map, workflow/timeline, calendar หรือ financial details ให้เป็นตาราง CRM; คง mental model ของแต่ละงาน
- หลีกเลี่ยง glass/gradient/glow ตกแต่ง, card ซ้อน card และ motion ที่รบกวนการอ่าน

## Typography / responsive / accessibility
- ใช้ bundled Noto Sans Thai, Manrope, Nunito, Source Code Pro เดิมก่อน ไม่โหลด fonts/CDN หรือเพิ่ม UI/animation library เพียงเพื่อเลียนภาพ
- Thai body line-height≥1.6, heading≥1.35; ตรวจวรรณยุกต์และข้อความยาว ไม่ลดฟอนต์เพื่อยัดข้อมูล และไม่ใช้ negative tracking กับภาษาไทย
- ใช้ type/spacing/radius/elevation scale ที่มีหน้าที่ชัดเจน; ค่าจริง finalize หลัง pilot
- Acceptance widths: 320(reflow stress),375,768,1024,1440,1920px ทั้ง light/dark. 1920 เทียบ Large Desktop. นี่คือขนาดทดสอบที่เสนอ ไม่ใช่ค่าต้นฉบับที่ inspect แล้ว
- เสนอ large desktop expanded nav, intermediate rail ตามพื้นที่, mobile drawer; breakpoint จริง lock หลังเทียบ pilot
- ข้อมูลสำคัญ/คำสั่งยังเข้าถึงได้ทุก viewport; ตารางเลื่อนในกรอบ ไม่ให้ทั้งหน้า overflow; priority columns/detail ใช้ตามบริบท ไม่แปลงทุกตารางเป็น cards
- WCAG2.2AA: text contrast4.5:1, non-text/focus3:1ตามเกณฑ์ที่เกี่ยวข้อง, visible focus, keyboard, labels/errors/live regions, reduced motion, zoom200%/text resize และ touch targets44×44pxสำหรับ mobile/tablet controls โดยตรวจ exceptions ตามบริบทอย่างชัดเจน

## Component และ CSS ownership — เปลี่ยนชั้นนำเสนอ ไม่เพิ่มธีมทับ
- `tokens.css`: semantic tokens/theme values แหล่งเดียว
- `globals.css`: reset/base type/global utilities; ย้าย component/layout selectors ออกเมื่อยืนยัน consumers แล้ว
- `shell.css`: shell/header/sidebar/rail/drawer geometry เท่านั้น
- `ui.css` + `src/components/ui/*`: shared primitives/states
- `components.css`: migration source ไม่ใช่ที่ต่อท้าย theme ใหม่; ย้ายกฎไปเจ้าของและ retire เฉพาะกฎที่ไม่มี consumers
- Work/Buildings/Guarantees/Car/Duct/Admin styles: domain layout/visualization เฉพาะ ห้าม redefine global controls/theme
- ย้าย consumer + ยุบ selector เก่าที่ซ้ำใน batch เดียวกัน พร้อม regression; ห้ามปิดอาการด้วย override เพิ่มอีกชั้น
- ใช้ primitive เดิมถ้าเหมาะสม; เปลี่ยน interface/เพิ่ม dependency ต้องมีเหตุผลและทดสอบ compatibility

## Visual approval gate
เลือก frame/variant และขนาดจอเดียวกัน; ใช้ชุดข้อมูล/เวลา/fonts ที่คงที่และ settle finite motion; review ทั้ง shell/title/toolbar/table/overlays ด้วย side-by-side/overlay. บันทึกความต่างที่ยอมรับได้เช่นภาษาไทย/คอลัมน์ธุรกิจ. **MaxWell ยอมรับ pilot จริงก่อน rollout ทั้งระบบ**; lint/build/axe ไม่อนุมัติความสวยแทนเจ้าของ. ถ้า pilot ไม่ผ่าน ให้แก้ pilot ไม่แก้ทุกหน้าไปก่อน.

## ขอบเขต
ไม่เปลี่ยน auth/RBAC/RLS/audit/schema/migrations, สูตรเงิน/KPI/SLA, records จริง, production credentials หรือความสามารถ backend. ไม่สร้าง Workers/ระบบ AI/model routing. การเปลี่ยน business policy ต้องแยกอนุมัติ. ลำดับงานและการย้อนกลับดู IMPLEMENTATION_HANDOFF.md; behavioral criteria ดู UXUI_SPEC.md.

---
# Historical specification — Operational Command (ไม่ใช่เป้าหมายใหม่)


## Goal + users
ออกแบบเว็บแอพ SuperApp PERMISSION_NEXT ให้มีหน้าตาสวยงามระดับมืออาชีพ ใช้งานง่าย รองรับอุปกรณ์ทุกขนาด และมอบประสบการณ์ผู้ใช้ที่ดีสำหรับพนักงานภายในทีม (คาดว่าไม่เกิน 100 คน) ผู้ใช้ทำงานกับข้อมูลและรายการจำนวนมากเป็นประจำ จึงต้องรองรับงานแบบ high-volume, การค้นหาเร็ว, การสลับบริบทน้อย และการใช้งานด้วยคีย์บอร์ดอย่างมีประสิทธิภาพ

## Visual direction
**Design Direction A: Operational Command**
- Dark navigation shell (sidebar ซ้ายทึบสีเข้ม) แยกจาก Light content workspace (พื้นที่ทำงานสว่าง) ให้ความรู้สึกเหมือน console ระดับมืออาชีพ
- โทนหลัก: น้ำเงินองค์กร **#244fb8** (ตาม AGENTS.md / ux-ui-pro-max) ใช้เป็นสีแบรนด์ primary อย่างสม่ำเสมอทั่วระบบ
- หลีกเลี่ยง: glassmorphism, gradient/glow ที่ไม่สื่อความหมาย, card ซ้อน card, animation ที่ทำให้งานช้าลง (ตาม AGENTS.md)
- แนวทาง: Operational workspace เรียบ สุขุม หนาแน่นอย่างมีระเบียบ เน้นความชัดเจน ความเร็วในการสแกนข้อมูล และลำดับชั้นของคำสั่งมากกว่าการตกแต่ง

## Tokens
- Colors (Light Mode):
  - Primary / Brand: **#244fb8** (primary actions, active nav, table selection)
  - Brand deep: #1E3A8A
  - Brand strong: #2563EB
  - Brand hover: #3B82F6
  - Brand soft: #EFF6FF
  - On-brand: #FFFFFF
  - Background: #F8FAFC
  - Surface: #FFFFFF
  - Surface subtle: #F1F5F9
  - Border: #CBD5E1
  - Border strong: #6B7280
  - Text: #0F172A
  - Text muted: #475569
  - Text subtle: #374151
  - Success: #047857 (พร้อมข้อความกำกับเสมอ)
  - Warning: #B45309 (พร้อมข้อความกำกับเสมอ)
  - Danger: #B91C1C (พร้อมข้อความกำกับเสมอ)
  - Info: #244fb8 (พร้อมข้อความกำกับเสมอ)
  - Contrast requirement: ข้อความปกติอย่างน้อย 4.5:1 ตาม WCAG 2.2 AA
- Colors (Dark Mode):
  - Primary / Brand: #60A5FA
  - Background: #0F172A
  - Surface: #1E293B
  - Text: #F8FAFC
  - Status colors ปรับตาม tokens.css dark mode บล็อก `html[data-theme="dark"]`
- Typography:
  - Thai: Noto Sans Thai (bundled ในโปรเจกต์ `src/app/fonts/noto-sans-thai.woff2`, ใบอนุญาต OFL)
  - English heading: Manrope (bundled, `manrope.woff2`, OFL)
  - English UI/body: Nunito (bundled, `nunito.woff2`, OFL)
  - Code / technical: Source Code Pro (bundled, `source-code-pro.woff2`, OFL)
  - Body: 13–15px, line-height อย่างน้อย 1.45 สำหรับภาษาไทย
  - หัวข้อ: น้ำหนัก Semibold หรือ Bold, ขยายขนาดตามระดับ hierarchy
  - ห้ามใช้ฟอนต์ภายนอก ตามกฎใน UX-UI-LIVELY-UPGRADE.md
- Spacing: หน่วยพื้นฐาน 4px grid (4, 8, 12, 16, 20, 24, 28, 32, 36, 40px)
- Radius / elevation:
  - ปุ่มและการ์ด: border-radius 3px / 5px / 8px / 12px / 16px / 999px
  - เงาอ่อนระดับเดียวสำหรับการ์ดยกขึ้น (shadow-xs / shadow-sm) ไม่มี shadow มากเกินไป
  - Focus ring: 3px ตาม `--focus-ring-width`

## Layout + components
- Navigation: Dark shell sidebar ซ้ายสำหรับนำทางหลัก (module switcher), Topbar บนสำหรับ global search (Ctrl/Cmd+K), notification center, user avatar
- Cards: Restrained borders (border 1px + shadow-xs), ขอบบาง พื้นหลังต่างจากหน้าเล็กน้อย ใช้แยกกลุ่มข้อมูล
- Table/Form: แถวสลับสีอ่อนสำหรับอ่านง่าย ฟอร์มจัดกลุ่มด้วย fieldset หรือการ์ดย่อย sticky header บนตารางใหญ่
- Buttons: Primary (เต็มสี #244fb8), Secondary (ขอบ + สีตัวอักษรแบรนด์), Ghost (สีจางเมื่อ hover)
- Input: ขอบ input มองเห็นชัด สถานะ focus มีแถบสีแบรนด์ (focus ring 3px)
- Status: status-badge แสดงด้วยสี + ข้อความกำกับเสมอ (ไม่ใช้สีเพียงอย่างเดียว)
- Data visualization: แผนภูมิเส้น/แท่งสำหรับหน้า KPI/dashboard ใช้สีจากโทนแบรนด์
- Empty / Error / Loading / Success states: คอมโพเนนต์แยกต่างหาก (`EmptyState`, `ErrorState`, `PageSkeleton`, `AnimatedNumber`)

## Responsive
- Mobile-first: เริ่มออกแบบที่ 375px ขึ้นไป
- Tablet: 768px ปรับ sidebar เป็นแบบ drawer หรือซ่อน
- Desktop: 1024px / 1440px แสดง sidebar เต็มรูปแบบ
- Overflow: ตารางมี scroll แนวนอนภายในกรอบของตัวเอง (`overflow-x: auto`) ไม่มีแถบเลื่อนทั้งหน้า
- Touch target: อย่างน้อย 44px บนมือถือและแท็บเล็ต
- breakpoint ที่ยืนยันแล้วจากโปรเจกต์: 375 / 768 / 1024 / 1440px

## Interaction states
- Default / Hover / Focus / Active: ชัดเจนบนทุกองค์ประกอบที่คลิกได้
- Loading: Skeleton shimmer แทน spinner ในตาราง/การ์ด ตอบสนองภายใน 100–200 ms
- Empty: แสดงข้อความเป็นกันเอง + CTA เช่น "ยังไม่มีรายการเลย ลองเพิ่มรายการแรกดูไหม"
- Error: แสดงข้อความเป็นกันเอง บอกเกิดอะไรขึ้นและทำอะไรต่อได้ ไม่แสดงรหัสภายใน
- Success: แสดงข้อความยืนยันการทำงานสำเร็จ เช่น "เรียบร้อย ✓"
- Disabled: ปิดการโต้ตอบ จางสีลง ไม่มี hover effect

## References
- https://designmd.ai/frknaykc/command-center — VERIFIED, 23 ต.ค. 2569 — DESIGN.md open format, MIT License — แนวทาง dark shell + light workspace, สถานะเชิงความหมาย
- https://designmd.ai/chef/adminforge — VERIFIED, 23 ต.ค. 2569 — DESIGN.md สำหรับ internal admin panel, MIT License — flat surfaces, crisp borders, compact spacing
- https://designmd.ai/chef/hrflow — VERIFIED, 23 ต.ค. 2569 — DESIGN.md สำหรับ HR/employee management, MIT License — warm-professional (ปรับฟอนต์เป็น bundled แล้ว)
- เอกสารโปรเจกต์จริง: `D:/WebApp/SuperApp PERMISSION_NEXT/AGENTS.md`, `docs/product/design-system.md`, `UX-UI-LIVELY-UPGRADE.md`, `src/styles/tokens.css` — อ่านจริงจากเครื่อง

---

หมายเหตุ: คง **DESIGN SPECIFICATION** ที่อนุมัติไว้เดิม; MaxWell อนุมัติ local implementation Phase 1–6 แล้ววันที่ 23 ต.ค. 2569. ผลและข้อจำกัดการตรวจรับอยู่ใน `IMPLEMENTATION_HANDOFF.md`; การอนุมัตินี้ไม่รวม push/deploy หรือเปลี่ยนฐานข้อมูล