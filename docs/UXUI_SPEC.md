# UX/UI SPEC — Figma-aligned system overhaul

## Current proposal — PLAN ONLY
ข้อเสนอนี้ใช้กับงานถัดไปหลังได้รับอนุมัติ; ส่วน Historical specification ด้านล่างเป็นประวัติ ไม่ใช่ acceptance ที่ผ่านแล้ว. เป้าหมายคือ workflow เดิมที่ถูกต้องใน presentation ใหม่ ไม่สร้างฟีเจอร์หรือ policy ใหม่เพื่อให้เหมือนตัวอย่าง.

## ขอบเขตที่ต้องตรวจครบ
Source inventory ปัจจุบันมี **37 page.tsx route templates** ไม่เท่ากับ37หน้าจอ: ยังต้องแตก query views, tabs, drawers, dialogs, dynamic views, role variants และ loading/error/not-found states. รายการทุก route และ coverage ledger อยู่ใน IMPLEMENTATION_HANDOFF.md; ต้องขยาย ledger ก่อนปิดงาน ไม่อนุมานจากชื่อไฟล์ว่าหน้านั้นใช้งานครบแล้ว.

## Shared interaction contracts
- Navigation: คง destinations/query/deep links และ server-side filtering เดิม; ไม่เปลี่ยน permission logic ด้วยการซ่อนปุ่ม; keyboard/active/disclosure states ถูกต้องทั้ง expanded/rail/drawer
- Search: global palette ค้นหาเมนู/รายการตามสิทธิ์; local search ค้นหาในงานปัจจุบัน; loading/debounce/empty/error/retry ชัด และไม่แสดงผลเก่าหลังคำค้นใหม่
- Table: sort/filter/reset/pagination/selection ทำงานร่วมกัน; เปลี่ยนหน้าหรือ filter ต้องไม่ทำ bulk action กับรายการที่ผู้ใช้ไม่รู้ว่ายังถูกเลือก; ตรวจพฤติกรรมเดิมก่อนเปลี่ยน semantics
- Bulk actions: เฉพาะคำสั่งและ server permissions ที่มีอยู่; preview ผลกระทบ/confirmation ตามความเสี่ยงเดิม ไม่เพิ่ม endpoint หรือการมอบสิทธิ์
- Forms: labels/hints/required/validation/errors ผูกกับ controls; focus ช่องผิดแรก, submit pending ป้องกันซ้ำ; failure ไม่ทำข้อมูลกรอกหาย; unsaved guard; success แสดงผลจาก server จริงไม่ใช้ optimistic success กับธุรกรรมสำคัญ
- Dialog/drawer: name, focus trap, Escape, return focus และปุ่มปิด; กรณีข้อมูลยังไม่บันทึกต้องคง safeguard เดิม; รองรับ mobile keyboard และเนื้อหายาว
- Feedback: loading/empty/filtered-empty/no-access/partial/error/success ต้องแยกความหมาย; ข้อความไทยบอกเกิดอะไรและทำอะไรต่อ; ไม่รั่ว SQL/stack/credentials; status มีข้อความร่วมกับสีและ aria-live ตามความเหมาะสม
- Theme: light/dark ครบทั้ง shell/table/forms/overlays/maps fallback/charts/print; เก็บ preference ผ่านกลไกเดิมเท่าที่มี ไม่เพิ่ม DB schema เพื่อ theme

## Module workflows และการออกแบบที่ต้องรักษา
### Core / Dashboard / Account
เข้าสู่ระบบ → เห็นเฉพาะพื้นที่ที่มีสิทธิ์ → Dashboard งานที่ควรจัดการ → ค้นหา/เปิดรายการ → กลับบริบทเดิม. ตรวจ notification/read state, account disclosure, เปลี่ยนรหัส,หมด session/ไม่มีสิทธิ์/404/error/recovery. การปรับ login/change-password จำกัด presentation; auth actions/validation policy เดิมห้ามเปลี่ยน.

### Work / KPI
ภาพรวมส่วนตัวและทีม, รายการงาน, เพิ่มงาน, มอบหมาย, people, tracker, KPI, reports, activity และ detail/note/status/hold/extend ที่มีจริง. รักษา source mental model, SLA/KPI weights/วันทำการ/รายงาน exact values. ตรวจ search/filter/selection/export เฉพาะที่มี backend และขอบเขตเจ้าของ/ทีมตามสิทธิ์.

### Buildings
คง map-first + รายการอาคาร + ค้นหา/filter/เลือกอาคาร → detail → create/edit → เงื่อนไข/ค่าธรรมเนียม/ใบเสนอราคา/เอกสาร ที่มีจริง. แผนที่หรือ NAS ใช้ไม่ได้ต้องมี fallback ที่ยังทำงานกับรายการได้;ไม่แทนที่ข้อมูลจริงด้วยตัวอย่าง. Financial values/history/location verification ไม่เปลี่ยนจากการปรับ UI.

### Guarantees
คิวตามขั้นตอน → รายละเอียด → เอกสาร/หลักฐาน → TL/ทีมติดตั้ง/คำขอคืนเงิน/ประวัติ ตามความสามารถเดิม. คง workflow-step + financial mental model; four-eyes/version/conflict/permissions และยอดเงินห้ามลดหรือเปลี่ยน. No-access/empty/partial ต้องไม่แสดงว่าเงินเป็น0เมื่อข้อมูลโหลดไม่สำเร็จ.

### Duct Rental / Communication Cable
รายการ/สร้าง/แก้ไขคำขอ, dynamic phase views, เอกสาร/PDF, signing tasks, ต่อสัญญา, ยกเลิก, tracking, communication cable และ settings. คง phase order, document gates, signing authority, realtime/pause/dirty behavior และ idempotent mutations; timeline/status/table ใช้ visual language กลางแต่ไม่ flatten ขั้นตอนธุรกิจ.

### Car Booking
ปฏิทินและรายการ, จอง/คืน/ยกเลิก/บันทึกการใช้รถ, reports/OSP และ admin ตาม views จริง. รักษา calendar mental model, overlap checks,สถานะรถ/การจอง/สิทธิ์. Calendar/mobile agenda เปลี่ยนเฉพาะ presentation ของข้อมูลเดิม ไม่สร้าง backend behavior ใหม่.

### Admin
ผู้ใช้/ทีม/ตำแหน่ง/roles/permission matrix/access preview/audit/ตั้งค่าและ car admin ตาม tabs จริง. งานสำคัญต้องเห็นคนเป้าหมาย สิทธิ์ ผลกระทบ และ confirm; ตรวจ readonly/admin/หมดสิทธิ์กลางคัน. เปลี่ยนแค่การนำเสนอ ไม่เพิ่ม/ลด grants หรือแก้ admin actions.

## State × role × viewport acceptance
- ทุก screen/view ใน ledger ต้องระบุ default/loading/empty/filtered-empty/invalid/error/success/partial/no-access/disabled/conflict ที่เกี่ยวข้อง; ถ้า N/A ต้องมีเหตุผล ไม่เช็กผ่านรวมเพราะพบ EmptyState component ตัวเดียว
- ทดสอบ allowed + denied และ own/team/admin เท่าที่ route ใช้จริง ด้วย synthetic accounts ที่ provision อย่างได้รับอนุมัติ; ห้ามปรับสิทธิ์บัญชีจริงเพื่อทดสอบ
- Widths320/375/768/1024/1440/1920 × light/dark; main flows ต้องไม่มี page overflow, Thai clipping หรือ controls ที่เอื้อมไม่ถึง
- Keyboard-only, focus visibility/not obscured, dialog restoration, zoom200%, text resize, reduced motion และ screen-reader smoke test
- Touch targets ตรวจทั้งกว้าง/สูงและ labeled hit area ไม่ตรวจเพียง min-height
- axe/contrast ไม่ใช่ full WCAG certification และไม่แทน visual review หรือ UAT

## Release acceptance checklist (ใหม่ — ยังไม่ผ่าน)
- [ ] Route/view/state ledger ครบ รวม dynamic/query/tab variants และ non-page states
- [ ] Visual pilot ได้รับ MaxWell sign-off พร้อมภาพ reference/actual ขนาดเดียวกัน และรายการความต่างที่ยอมรับ
- [ ] Shared shell/components ใช้ theme เดียวตาม mode; ไม่เกิด CSS ownership conflicts หรือ override theme ใหม่
- [ ] Core และทุก module batch รักษา feature/workflow/permission behavior ที่มีเดิม; ไม่มี command ปลอมหรือ feature หาย
- [ ] Representative matrix ครบทุก batch และ critical flows ครบทุก acceptance viewport/mode
- [ ] Authenticated E2E สำเร็จบนฐานทดสอบแยกที่ได้รับอนุมัติ; fixture/SSR tests ระบุ coverage ตามจริง ไม่แทน E2E
- [ ] Manual keyboard/zoom/text/Thai/screen-reader/target-size checks ผ่านใน scope ที่บันทึก
- [ ] lint/typecheck/unit/document/build/Playwright ผ่านใหม่บน source snapshot สุดท้าย; skipped/unrun ไม่ถือว่าผ่าน
- [ ] ไม่มี regression เพิ่มด้าน startup/theme flash/layout shift/interaction เมื่อเทียบ baseline ที่วัดจริง
- [ ] MaxWell ยอมรับภาพและการใช้งานระบบจริงครบ scope; reviewer/UAT/release gates ไม่ถูกปิดด้วย producer self-report
- [ ] Rollback ของ code/config ที่เกี่ยวข้องทำได้โดยไม่เสีย user changes หรือแก้ข้อมูล; push/deploy ได้รับอนุมัติแยก

---
# Historical specification — previous local implementation


## Top user tasks
1. เข้าสู่ระบบและดูภาพรวมหน้าแรก (Dashboard) พร้อมดูงานค้าง รออนุมัติ เกินกำหนด
2. นำทางระหว่างฟีเจอร์หลักของ SuperApp (งาน, อาคาร, ท่อลม, การค้ำประกัน, รายงาน) ได้ง่ายผ่าน Core Shell
3. ค้นหาข้าม module ด้วย Command Palette (Ctrl/Cmd + K)
4. กรอกแบบฟอร์มและรับข้อตอบสนองทันที (loading, success, error, empty)
5. ดูข้อมูลสรุป KPI และ activity timeline บนหน้า dashboard
6. แก้ไขโปรไฟล์และการตั้งค่าพื้นฐาน (รวมถึง Light/Dark mode)

## Primary flow
Entry (หน้า login) → เข้าสู่ระบบผ่าน Core Shell → เห็นหน้า dashboard ("สวัสดี คุณ{ชื่อ} วันนี้มี {n} งานรออยู่") → เลือก module จาก sidebar หรือ command palette → ดำเนินการหลัก (ดูรายการ, กรอกฟอร์ม, อนุมัติ ฯลฯ) → รับข้อตอบสนอง (สำเร็จ/ผิดพลาด) → กลับสู่ dashboard หรือดำเนินการต่อ

## Information hierarchy
1. สิ่งที่ต้องเห็นก่อน: ชื่อแอพ/โลโก้, สถานะการเข้าสู่ระบบ, เมนูนำทางหลัก (sidebar), การแจ้งเตือน
2. ข้อมูลสำคัญสำหรับการตัดสินใจ: ตัวเลขสรุป KPI, การแจ้งเตือนที่ต้องใส่ใจ, ปุ่มกระทำหลัก (primary action)
3. ข้อมูลรอง: รายละเอียดย่อย, ประวัติการทำงาน, การตั้งค่า, ข้อมูลเสริมใน card

## Accessibility + localization
- Keyboard: นำทางด้วยแป้น Tab ได้ครบทุกองค์ประกอบที่โต้ตอบ, command palette รองรับ arrow keys, Enter, Esc
- Focus: มองเห็นจุดโฟกัสชัดเจนทุกตัวควบคุม (focus ring 3px ตาม tokens.css)
- Contrast: ตรงตาม WCAG 2.2 AA (ข้อความปกติอย่างน้อย 4.5:1) ตรวจด้วยเครื่องมือจริง ไม่ใช่แค่ compile
- Labels: ป้ายกำกับทุกฟอร์ม มีข้อความอธิบายเมื่อจำเป็น สถานะสื่อด้วยข้อความร่วมกับสี
- Text resizing: ขยายตัวอักษรได้โดยไม่ทำให้レイเอาต์เสียหาย
- Thai text handling: รองรับตัวสระ วรรณยุกต์ ภาษาไทย ไม่ตัดคำกลางคำ awkwardly line-height อย่างน้อย 1.45
- aria-live: สำหรับ toast และข้อความสถานะแบบเรียลไทม์
- Touch target: อย่างน้อย 44px บนมือถือ
- Skip link ("ข้ามไปยังเนื้อหาหลัก") อยู่ด้านบนของหน้า
- aria-label, aria-expanded, aria-controls, role บน combobox/dialog/listbox patterns

## Responsive behavior
- Phone (375px): Sidebar ซ่อน ใช้แฮมเบอร์เกอร์เมนู/ดรอว์เวอร์ ฟอร์มจัดเรียงแนวตั้ง search ซ่อนเมื่อแคบ
- Tablet (768px): Sidebar แบบย่อ ตารางเลื่อนภายในกรอบ module tabs overflow-x
- Desktop (1024px / 1440px): แสดงเต็มรูปแบบ พร้อม sidebar dark shell
- ไม่มีฟังก์ชันหายไปเมื่อเปลี่ยนขนาดหน้าจอ ไม่มี horizontal scroll บน core flow

## Acceptance checks
- [ ] กระบวนการหลักเสร็จสมบูรณ์โดยไม่มีขั้นตอนเกินจำเป็น
- [ ] มีสถานะ loading, empty, invalid, error และ success ครบถ้วนทุกหน้าหลัก
- [ ] คอมโพเนนต์สำคัญใช้งานผ่านคีย์บอร์ดได้ มี focus มองเห็นได้
- [ ] ไม่มีข้อความถูกตัด หรือ overflow แนวนอนในมุมมองหลัก (375 / 768 / 1024 / 1440px)
- [ ] ความต่างสีข้อความปกติอย่างน้อย 4.5:1 ได้รับการประเมินด้วยเครื่องมือจริง
- [ ] ขนาดจุดสัมผัสอย่างน้อย 44px บนมือถือ/แท็บเล็ต
- [ ] เคารพ prefers-reduced-motion (แอนิเมชันใช้ transform และ opacity เท่านั้น)
- [ ] ข้อความภาษาไทยเป็นกันเอง ไม่แสดง error ดิบ/รหัสภายใน/รายละเอียดระบบให้ผู้ใช้เห็น
- [ ] สถานะทุกสถานะมีสีควบคู่กับข้อความกำกับเสมอ

---

หมายเหตุ: MaxWell อนุมัติ local implementation Phase 1–6 วันที่ 23 ต.ค. 2569. ผล browser/component verification อยู่ใน `IMPLEMENTATION_HANDOFF.md`. ยังคงช่องตรวจรับระดับระบบไว้จนมี authenticated UAT ครบ; ผล fixture ไม่ใช่การรับรอง WCAG ทุกหน้า