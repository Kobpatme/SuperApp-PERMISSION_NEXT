# ตรวจการจัดวาง UI ทั้งระบบ — 13 พฤศจิกายน 2569

ขอบเขต: ระยะห่าง แนวปุ่ม ลำดับข้อความ ฟอร์ม ตาราง และการจัดวางบนจอแคบเท่านั้น อ้างอิงต้นงาน `86579cf` การเปลี่ยนตัวแอปจำกัดอยู่ใน CSS ไม่เปลี่ยน workflow, API, สูตรคำนวณ, สิทธิ์, schema หรือข้อมูล

## สิ่งที่แก้

| ส่วนงาน | การจัดวางที่ปรับ/ตรวจ |
| --- | --- |
| Core / ภาพรวม | รวมเจ้าของ PageHeader ใน `src/styles/ui.css`; หัวข้อไม่มี margin แฝง, breadcrumb ตัดบรรทัดได้, ระยะหัวข้อ–คำอธิบาย 4 px, ปุ่มห่าง 8 px, ระยะกลุ่มหัวข้อ–คำสั่ง 16 px; จอไม่เกิน 650 px เรียงกลุ่มคำสั่งใต้หัวข้อ |
| งานและ KPI | ยกเลิกกฎหัวข้อที่ทับ Core ในหน้า mine/rollout/composition; กลุ่มคำสั่ง wrap ได้; ตรวจ dashboard, mine, team, assign, people, tracker, reports, KPI, create และ task dialog |
| อาคาร | ตรวจรายการ แผนที่ เพิ่ม รายละเอียด แก้ไข drawer และ confirmations; ใช้หัวข้อ/ฟอร์ม/คำสั่งส่วนกลางโดยคงความกว้างฟอร์มและลำดับงานเดิม |
| เงินประกัน | ตรวจรายการ รายงาน ผู้รับผิดชอบ เพิ่ม แก้ไข หลักฐาน และ transition/discard dialog; รับระยะและแนวข้อความจาก Core |
| จองรถ | จัดระยะกลุ่มคำสั่ง 8 px; label เริ่มแนวบนและหดตามคอลัมน์ได้; ตัวกรองไม่บังคับความกว้างเกินจอ; ตรวจทุก view และส่วนผู้ดูแลรถ |
| เช่าท่อ / สายสื่อสาร | ยกเลิกกฎ global heading เฉพาะโมดูล; label มีระยะ 8 px และเริ่มแนวบน; ตรวจคำขอ ต่อสัญญา ยกเลิก ติดตาม ลงนาม ตั้งค่า และสายสื่อสาร รวมฟอร์ม/รายละเอียด/modal |
| ติดตาม PO | จัดช่องว่างหัวรายการ–ตาราง; ป้องกันรหัสและสถานะแตกหลายบรรทัด; กลุ่มคำสั่ง wrap ได้; grid ของตัวกรอง/รายละเอียด/ข้อมูลนำเข้าไม่กว้างเกินพื้นที่; ตรวจ list/report/detail/manual-create/Excel |
| วิเคราะห์เส้นทาง PEA/UFM | ใช้ Core tabs/heading/form; แยกระยะช่องกรอก–ปุ่มในชุดข้อมูล; กำหนดขอบเขต file input และ fieldset; ตรวจ analysis/projects/datasets/settings |
| Site Facility | ใช้กฎร่วมกับแผนที่เส้นทาง; บังคับคอลัมน์ sidebar ให้อยู่ในกรอบแม้เปิดตาราง OPEX; ตารางเลื่อนภายในกรอบ; ตรวจ sites/reports/datasets |
| ผู้ดูแล / เข้าสู่ระบบ | ยกเลิกกฎ header เฉพาะ Admin; ตรวจทุกส่วนจัดการ บทบาท/สิทธิ์ ตั้งค่างาน audit dialogs และ login/change-password ในสองธีม |

ฟอร์มร่วมจัด label ชิดด้านบน ระยะ label–control 8 px และกลุ่มคำสั่ง 8 px; header ของ panel/dialog มีช่องว่างชัดเจนและปุ่มปิดไม่ถูกบีบ ส่วนตารางและแผนที่คงโครงสร้างเฉพาะงานเดิม

## วิธีตรวจซ้ำ

ใช้ real components พร้อม synthetic fixtures; จำลอง router, server actions และ API เพื่อไม่อ่าน/แก้ฐานข้อมูลจริง ปรับ fixture เก่าที่ไม่ครอบคลุม `next/image` และตัวโหลด handoff ฝั่ง server ให้แสดงหน้าปัจจุบันได้ เพิ่ม `e2e/layout-consistency.spec.ts` สำหรับ PO และแผนที่สองโมดูล

```powershell
$env:UX_EXTERNAL_SERVER='1'
npx playwright test e2e/work-unified-composition.spec.ts e2e/guarantees-unified-composition.spec.ts e2e/buildings-unified-composition.spec.ts e2e/car-booking-unified-composition.spec.ts e2e/duct-rental-unified-composition.spec.ts e2e/admin-auth-unified-composition.spec.ts e2e/operational-command.spec.ts e2e/layout-consistency.spec.ts --workers=4 --reporter=line
npm test -- --maxWorkers=2
npm run lint
npm run typecheck
npm run test:documents
npm run check:css
npm run check:contrast
npm run build
```

ชุด browser ตรวจขนาด 320/375/390/768/1024/1440 px ตามแต่ละ suite, Light/Dark, overflow, keyboard/focus, dialog และ axe ใน suites เดิม ชุด PO/map เพิ่มการตรวจขอบเขต controls และระยะปุ่มนำเข้าจากช่องกรอก ภาพและ logs เก็บเป็น local artifacts ตามนโยบาย repository ที่ `docs/quality/layout-consistency/`, `docs/quality/work/`, `docs/quality/buildings/`, `docs/quality/guarantees/`, `docs/quality/car-booking/`, `docs/quality/duct-rental/unified/`, `docs/quality/admin-remainder/` และ `.data/ui-layout-*.log`

ผลนี้ใช้ยืนยัน presentation กับข้อมูลจำลอง ไม่ใช่การรับรอง UAT ของข้อมูลจริงหรือการรับรอง WCAG ทั้งระบบ

## ผลตรวจ

- Unit: 6,727 ผ่าน, 103 ข้ามตามเงื่อนไขเดิม, 148 test files ผ่าน / 9 ข้าม
- Full lint และ lint ซ้ำไฟล์ TypeScript ที่แก้: ผ่าน; typecheck: ผ่าน
- Document tests: 1 ผ่าน; CSS quality: 455 ไฟล์ / 0 violations; contrast: 62 คู่ / 0 failures
- Production build หลังแก้ CSS ครั้งสุดท้าย: ผ่าน
- PO / PEA-UFM / Site Facility: 24 เคสผ่านหลังแก้ล่าสุด รวม 4 ขนาดจอ × 2 ธีม ครบ list/report/detail/create/import และ map/dataset/settings
- Core shell/header: 8 เคสผ่านหลังปรับ fixture ให้เลือกธีมผ่าน localStorage และใช้ current shell markers; การตรวจ `/work/new` กับฟอร์มปัจจุบันผ่าน 3 เคส
- Reflow / touch targets / collapsed rail: 6 เคสผ่านหลังแก้ล่าสุด ปุ่มเรียงและชื่อรายการในตารางภาพรวมสูงอย่างน้อย 44 px บนมือถือ; rail รอจบ transition ก่อนวัดความกว้าง
- ตรวจซ้ำ Work mine/team/tracker/dialog หลังเปลี่ยน gap ของปุ่ม: 19 ผ่าน / 1 ไม่ผ่านที่พฤติกรรมเพิ่มบันทึก ไม่ใช่การวัดระยะปุ่ม

### ข้อจำกัดของชุด browser เก่า

รอบรวม 598 เคส: 574 ผ่าน / 24 ไม่ผ่านก่อนแก้และตรวจซ้ำส่วน UI ข้างต้น จึงไม่ควรตีความว่า browser ทั้งหมดผ่าน เคส PO/map, current shell, reflow และการแสดงหน้าเพิ่มงานที่แก้แล้วมีผลตรวจซ้ำแยกตามรายการด้านบน ส่วนที่ยังไม่ผ่านอ้าง selector/รูปแบบเก่า เช่น Building search แบบ textbox, ตารางเงินประกัน/ปุ่ม sort และการคาดจำนวนคอลัมน์ฟอร์มเงินประกัน 4 คอลัมน์ขณะที่ CSS ปัจจุบันกำหนด 3 รวมถึงการตั้งค่าโมดูล การกรอง/แบ่งหน้าตารางเงินประกัน และพฤติกรรม Work note/create บันทึกหลักฐานใน `.data/ui-layout-browser-final.log`, `.data/ui-layout-work-final.log` ผลตรวจซ้ำปัจจุบันอยู่ใน `.data/ui-layout-extra-final.log`, `.data/ui-layout-current-final.log`, `.data/ui-layout-shell-final.log` และ `.data/ui-layout-touch-final.log`

แก้เฉพาะ boundary ที่จำเป็นต่อการแสดงผลและ assertions ของ current shell / หน้าเพิ่มงาน เพื่อให้ตรวจการจัดวางได้ ไม่แก้ production logic เพื่อทำให้ workflow tests ผ่าน โดยยืนยันว่า `src/components/ui/button.tsx`, `src/features/work/components/task-actions.tsx`, `src/components/app-shell.tsx` และ `src/app/(platform)/guarantees/deposit.css` ไม่มี diff ในงานนี้ ตัวอย่างที่เห็นชัดคือ Work note ใช้ default button type โดยไม่ได้ระบุ submit ซึ่งต้องแยกเป็นงานพฤติกรรมหากจะปรับ ไม่อยู่ในขอบเขตครั้งนี้
