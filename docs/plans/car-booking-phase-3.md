# เฟส 3 — หน้าจอระบบจองรถและจัดสิทธิ์รายบุคคล

วันที่ 08/10/2569; baseline `0c2c8d6`; branch `codex/car-booking-phase-3` เจ้าของอนุมัติให้จัดการและทดสอบจนจบเฟส 3

## สิ่งที่ทำ

- `/car-booking` ใช้ Core Shell/session เดียว: ตรวจรถว่าง → จอง → รายการของฉัน → บันทึก → คืน/ยกเลิก พร้อมข้อความสถานะภาษาไทยและ dialog ที่รองรับ Escape/คืน focus; เปิดให้จองย้อนหลังตามคำยืนยัน
- รายการคืนรถรวม booked ที่เริ่มแล้วแม้อยู่เดือนก่อน ส่วนรายการของฉัน/ทั้งหมดกรองตามเดือน; API อ่าน open bookings แบบแบ่งหน้าเพื่อไม่ทำให้รายการค้างหายไป
- ปฏิทินเดือน/สัปดาห์/วัน มีก่อนหน้า/ถัดไป/วันนี้, สีและทะเบียนประกอบ legend เฉพาะรถที่มีรายการในช่วง, คลิกรายการดูเวลา, query ครอบคลุมสัปดาห์ข้ามเดือน/ปี; มือถือแสดงรายการตามวัน อ่านเฉพาะ projection 4 ฟิลด์ ไม่มีชื่อผู้จอง/ปลายทาง/GPS
- วันที่รายการใช้ `dd/mm/พ.ศ.` และเวลา Bangkok โดยไม่ขึ้นกับ timezone ของเครื่อง; ปฏิทินแสดงเวลาคืนจริง แต่ availability ยังใช้ reservation cap ตามเฟส 2
- แอดมินโมดูลเพิ่ม/แก้รถ ปิดใช้งานแทนลบ ดู/ยกเลิกการจองทั้งหมด และดู GPS บนแผนที่พร้อมรายการพิกัด; GPS เป็น optional และปฏิเสธการขอพิกัดแล้วบันทึกต่อได้
- ตั้งค่าชั้นจอดโดยแอดมิน พร้อม version/optimistic conflict; ค่าเริ่มต้นคืนรถใช้ที่จอดล่าสุดที่ยังอยู่ในตัวเลือก แล้ว fallback 2A/ตัวเลือกแรก เมื่อเปลี่ยน config ไม่แก้ประวัติเดิม
- `/admin/car-booking` และลิงก์ใน Admin กลาง ใช้ `core.user.manage` จัด use/admin รายบุคคลแยกกันได้; แอดมินรถที่ไม่มีสิทธิ์จัดผู้ใช้เข้าหน้านี้ไม่ได้ ใช้ตาราง Core grants เดิม ไม่มีระบบบัญชีหรือ authorization ซ้ำ
- SQL `0026_car_booking_ui.sql` เพิ่ม settings FORCE RLS, role definitions use/admin ที่ไม่มี user assignment อัตโนมัติ และ guarded access functions; runtime ไม่เป็นสมาชิก `car_booking_access_manager` ซึ่งเป็น NOLOGIN/NOINHERIT/NOSUPERUSER/NOBYPASSRLS
- การเปลี่ยนสิทธิ์มี fresh guard, target lock, expected flags และ audit/activity/outbox transaction เดียวกัน; ถอนเฉพาะ car scopes ของ mixed role โดยคงสิทธิ์โมดูลอื่น/team/expiry/session เดิม
- Manifest ในโค้ดเปิดหน้าจอที่พัฒนาแล้ว; ผู้ไม่มี grant ไม่เห็นเมนูและ API ปฏิเสธ ไม่มี deployment หรือการเปิดระบบจริง
- เพิ่ม fixture/browser runner และ CI step; `playwright.config.ts` เดิมไม่รัน fixture ใหม่โดยไม่เตรียมฐานเฉพาะ

ไฟล์หลัก: `src/features/car-booking/`, `src/lib/car-booking-{access,settings,display,calendar}.ts`, pages/API ที่เกี่ยวข้อง และ migration 0026

## หลักฐาน

| การตรวจ | ผลล่าสุด |
|---|---|
| Fresh baseline: lint/typecheck/unit/documents/build | ผ่านก่อนเริ่มแก้; unit 215 ผ่าน/22 skipped |
| lint/typecheck/unit/documents/build | ผ่าน; unit 218 ผ่าน/24 skipped, document 1 ผ่าน, Next 16.3.6 |
| PostgreSQL 16.15 schema/RLS | 10/10 ผ่านด้วย non-owner/non-superuser/NOBYPASSRLS |
| PostgreSQL service integration | 12/12 ผ่าน แยกจาก normal unit ที่ skip ชุดนี้ |
| Migration บน cluster สะอาด | 26 ไฟล์ผ่าน; rerun applied=0 |
| Chromium บน production build | 5/5 ผ่าน: จอง/log/คืน, live grant/revoke, admin รถ/config/GPS, mobile cancel, anonymous/forced-password denial |
| Accessibility | scoped axe WCAG tags บน desktop Light/Dark, mobile Light/Dark, หน้าจัดสิทธิ์และ admin workspace: 0 violations; Escape/คืน focus ผ่าน |
| Design/copy gates | CSS 230 ไฟล์ 0 violations; contrast 58 คู่ 0 failures; static copy 0 findings |
| Dependency audit | `npm audit --omit=dev`: 0 vulnerabilities |

`database.log` เป็นหลักฐานสร้าง cluster สะอาดและ rerun; `verification.log` เป็นรอบล่าสุดรวม schema 10/service 12/browser 5 หลังเติมปฏิทินและ audit rollback ของ access; `e2e-results.json` และภาพอยู่ `docs/quality/car-booking-phase-3/` ตรวจภาพ desktop Light/Dark, mobile Light/Dark และ GPS dialog แล้ว

ทดสอบ live grant/revoke ผ่าน HTTP จริงและ session เดิม พร้อมยืนยัน `/work` ยังเข้าได้; SQL ทดสอบ mixed-role current non-car scopes เท่าก่อนแก้ และ audit INSERT ล้มเหลวแล้ว access change rollback จริง การแก้สิทธิ์ผ่าน Admin เดิมยังคงพฤติกรรม revoke session เดิมของ Core

ข้อผิดพลาดรอบทดสอบที่แก้: ใช้ localhost ให้ตรง URL/origin ของ Next.js, ใช้ role/name ของ select/textarea, รอ mutation สำเร็จก่อนตรวจ revoke, ใช้ชื่อรายการเฉพาะแต่ละรอบ และช่วงเวลาที่ไม่ทับ completed fixture เก่า ไม่ลด origin guard/RLS หรือทิ้งประวัติเพื่อให้ผ่าน

ทำซ้ำด้วย PowerShell 7 และ portable PostgreSQL ที่เตรียมตาม [คู่มือ](../operations/car-booking-database.md):

```powershell
./scripts/car-booking-portable-test.ps1 -ServiceTests -BrowserTests -ClusterName phase3-fresh
```

fixture ใช้ฐาน `permission_next_car_booking_test` บน loopback เท่านั้น ไม่แก้ `.env.local` หรือฐานแอปเดิม และ stop PostgreSQL ใน finally

## Source parity

ใช้ frozen `Code.gs` SHA256 `B22674C71B0905C8A9623880D0D02F28F3DB473FE9F9489E73A3C8CDBB618156` และ `Index.html` SHA256 `A705578D72F9D33CD3A31162A65260957B451993710A5FF610854D6BADF6FECA` ของผู้ใช้ตาม [inventory](../modules/car-booking/source-parity.md)

Native UI workflow เฟส 3 ผ่าน local synthetic verification; แทน FullCalendar/CDN ด้วยปฏิทินที่ใช้ tokens กลางและคง month/week/day/navigation; ปรับความเป็นส่วนตัวตามคำตอบเจ้าของ ไม่ถือว่า source parity ทั้งโมดูลครบ เพราะ report/dashboard/export/import และ real-user UAT ยังอยู่เฟส 4–6

## JEV

ใช้ `jev-orchestrator` แบบ metadata_only: health local/network OK; risk advisory score .94/confidence .22, policy `codex_verify_with_deterministic_checks`, ไม่มี hard gate; ใช้ deterministic tests เป็นหลักตามการอนุมัติเฟสของเจ้าของ

Final evidence_check: supported .81/needs_more_evidence .79, `continue_but_verify`, advisory_only จำกัดคำอ้างว่าเฟส 3 ผ่าน local verification เท่านั้น ไม่ใช้เป็นหลักฐาน production readiness หรือสิทธิ์ deploy

## สิ่งที่ยังไม่ได้ยืนยันและข้อจำกัด

- Browser ใช้ operator connection เฉพาะ synthetic fixture; หลักฐาน RLS/least privilege มาจาก SQL/service tests ที่สลับ runtime role จริงแยกต่างหาก ยังต้อง provision/check runtime role ของ environment จริงก่อนตัดสลับ
- ทดสอบภาพ map ด้วย tile response จำลอง; marker/coordinates/authorization ผ่าน แต่ไม่ได้รับรองการเชื่อมต่อ tile provider จริง ตำแหน่งขอเฉพาะผู้ใช้กดแนบ GPS และแผนที่มี attribution/fallback coordinates
- Mixed-role generic scopes ถูกขยายเป็น permission-specific scopes เพื่อรักษาสิทธิ์อื่นที่มีอยู่ขณะบันทึก ถ้าเพิ่ม capability ใหม่ให้ mixed role ภายหลัง ต้องเพิ่ม scope ของ capability นั้นให้ assignment ที่ถูกขยายด้วย; ไม่มีการสร้าง deny model ซ้อน Core
- ยังไม่ได้รัน remote CI, real-user UAT หรือ benchmark บนข้อมูลจริง; ไม่อ้าง WCAG certification ทั้งแอปจาก scoped axe
- OSP 19 คอลัมน์/export/dashboard อยู่เฟส 4 ต้องให้เจ้าของเลือก Sheets integration หรือไฟล์ export; CSV/import/backfill/hosting/cutover อยู่เฟส 5–6

## ความเสี่ยงและ rollback / ผลกระทบข้อมูลเดิม

ไม่มี push/deploy/production migration/external write และไม่ลบ legacy ข้อมูลที่เขียนเป็น local synthetic fixture เท่านั้น ไม่มีสิทธิ์อัตโนมัติให้พนักงานจริง

ก่อน deployment ย้อน code/manifest commits ได้โดยเก็บ schema/history ไว้; ถ้าภายหลัง apply จริงให้ปิดโมดูลและ forward-fix ห้าม drop ตาราง/ประวัติเพื่อ rollback ดู runtime grants ในคู่มือ

จบเฟส 3 และหยุดที่ขอบเขตนี้ตามเอกสารงาน §10 ซึ่งกำหนด “จบแต่ละเฟสให้หยุดรายงานและรอไฟเขียว” เฟส 4 ยังไม่เริ่ม
