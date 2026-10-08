# ระบบจองรถ — เฟส 4 รายงานและ Google Sheets

วันที่ 08/10/2569; branch `codex/car-booking-phase-4`; fresh baseline `030156f` จากเฟส 3 ผู้ใช้อนุมัติเฟส 4 และตอบ CB-04 ว่า A: รายงาน/ดาวน์โหลดพร้อมส่งเข้า Google Sheets เดิม

## ผลที่เพิ่ม

รายงาน OSP 19 คอลัมน์ตาม §7 แสดง พ.ศ./Asia/Bangkok เฉพาะ completed เรียง start_time/id รองรับเลขไมล์ 0 และ Decimal ค่าน้ำมันรวม log กับตอนคืนรถ Dashboard เดือน/ทั้งหมดใช้ fuel aggregate เดียวกัน มี counts/ระยะทาง/ลิตร/เงิน/สถิติรถ/top5/ตาราง 50 แถวต่อหน้า ดาวน์โหลด CSV ครบช่วงที่เลือกผ่าน HTTP จริง มี BOM/quote/newline และป้องกัน formula interpretation

migration 0027 เพิ่ม durable queue/lease state ที่ FORCE RLS trigger เพิ่มงานใน transaction คืนรถ งานส่งเกิดผ่าน worker ที่มี bearer secret และ fixed Core principal ผู้มีสิทธิ์ car admin เท่านั้น UI เข้าคิว rebuild/retry ไม่เรียก Google ในคำขอผู้ใช้ จึงไม่รอ network ตอนคืนรถ

Google Sheets adapter ใช้ service account JWT/Sheets scope, อ่าน tab เดิมก่อน merge `_booking_id`, เก็บ SAP/แถว manual/legacy, รวม duplicate และสำรองก่อนเขียนแบบ batch เดียว Backup job เดิมใช้ซ้ำเมื่อ retry ข้อมูลขัดแย้ง/สูตร/คอลัมน์เกิน/เซลล์ยาวเกินจะหยุดก่อนเขียน คู่มือและเงื่อนไข numerical text compatibility: [OSP operations](../operations/car-booking-osp.md)

ปรับ SELECT RLS เป็น statement initplans เพื่อไม่เรียก RBAC ซ้ำทุกแถว พร้อมคง OWN predicate/fresh grants ในทุกคำขอ ไม่เปลี่ยน mutation policies, FORCE RLS หรือ permission scope การถอนสิทธิ์ session เดิมและ cross-user denial ยังผ่านฐานจริง

## หลักฐานและผลทดสอบ

Fresh baseline lint/typecheck/unit/documents/build ผ่านทั้งหมด, unit 218 ผ่าน/24 skipped ก่อนเริ่มเฟส Logs `docs/quality/car-booking-phase-4/baseline-*.log`

| Gate | ผลล่าสุด |
|---|---|
| lint / typecheck | exit 0 |
| unit | 229 ผ่าน / 27 skipped; 56 files ผ่าน / 3 skipped; DB opt-in แยกด้านล่าง |
| document mapping | 1 ผ่าน |
| build | Next.js 16.3.8; exit 0 |
| PostgreSQL 16.15 | fresh migrations 27/rerun 0; schema 10/service 15 ผ่านบน non-owner/non-superuser/NOBYPASSRLS |
| Browser | Chromium 7/7 ผ่าน; ดาวน์โหลดจริง/keyboard horizontal scroll/scoped axe Light-Dark desktop-mobile/root overflow 0 |
| CSS / contrast / copy | 240 files / 0 violations; 58 คู่ / 0 failures; static copy 0 findings |
| audit | `npm audit --omit=dev`: 0 vulnerabilities หลังแพตช์ 16.3.8 |

SQL/service ตรวจ zero-mile/BE dates/กรองเดือนตาม Bangkok/completed-only/cancelled exclusion/ยอด 40 ลิตรและ 1,600 บาท; staff report/dashboard/sync denial; trigger queue/audit rollback; network failure safe code; retry/concurrent workers writer เดียว; benchmark 5,000 bookings/10,000 logs Pure tests ตรวจ exact decimals, CSV, SAP/manual/dedup/rebuild repeat, conflict abort, signed JWT/Sheets scope, atomic backup/update, backup reuse และ worker bearer/body-forgery rejection

Logs ล่าสุด: `database-measured.log` เป็น SQL/service หลังปรับ performance; `browser-final.log` รวม schema 10 (เพิ่ม queue FORCE RLS/direct staff denial) และ browser 7; `final-*.log` เป็น gates ล่าสุด; `performance.json` ตัวเลขที่สร้างจาก test จริง Browser ใช้ fixture operator แยกจาก non-owner RLS tests ไม่ถือว่า fixture role เป็น production runtime ภาพรายงาน desktop/mobile Light/Dark และ dashboard ตรวจแล้ว

## ความเร็วตาม §9

ข้อมูลจำลอง 5,000 การจอง completed และ 10,000 logs มี zero-mile/fuel/checkpoint วัดบน portable PostgreSQL local ผล service wall time รวม transaction/fresh grant checks; ไม่ใช่ production/network benchmark

| คำสั่ง | ก่อนปรับ RLS | หลังปรับ RLS |
|---|---:|---:|
| รายงานเดือน 50 แถว จากเดือนที่มี 744 รายการ | 1,534 ms | 75 ms |
| Dashboard เดือน พร้อม totals/car/top5/50 bookings | 1,755 ms | 44 ms |
| CSV ทุกเดือน ประมาณ 5.1 MB | 10,684 ms | 1,067 ms |

หลักฐาน `performance-before-optimization.json` และ `performance.json` รายงาน/แดชบอร์ดใช้ SQL bounded query ไม่มี query ราย booking ฝั่ง application; full CSV/Sheets snapshot อ่านทั้งหมดโดยตั้งใจ ไม่ใช้ endpoint list ส่งข้อมูลทุกคนทุกครั้ง เป้าหมาย initial load ผ่าน service measurement เท่านั้น ต้องวัดเครือข่าย/hostingจริงก่อน UAT

## Dependency patch และข้อผิดพลาดที่แก้

Audit พบ Next.js 16.3.6 อยู่ใน advisory ใหม่ จึงล็อก Next/ESLint config เป็น 16.3.8 ตาม [upstream advisory](https://github.com/advisories/GHSA-4jqv-mc3x-m676) และรัน gate/build/browser ใหม่ ไม่เปลี่ยนไป minor 16.4

รอบต้นพบ expected ปี พ.ศ. ของ fixture 2041 ผิด (ถูกต้อง 2584), fixture benchmark ขาด parking_floor ที่ DB บังคับ และ axe พบ mobile scroll region ไม่ focusable แก้ fixture/keyboard focus ไม่ลด constraint/accessibility assertions รอบหนึ่ง initdb arguments ล้มเหลวก่อนสร้างฐาน; รัน cluster ใหม่สำเร็จ ไม่แตะ process/ฐานที่ไม่เกี่ยวข้อง

## ขอบเขตและความพร้อมจริง

เฟส 4 นี้ไม่มี external write, production migration, deployment, push, real-user grants หรือ secret ใน repo Google HTTP ใช้ mock และ RSA key จำลองใน memory ทดสอบ protocol/idempotency ไม่ได้ยืนยันสิทธิ์/ขนาด/เชื่อมต่อ Google จริง เจ้าของต้องสร้าง SA แชร์ชีตและตั้ง hosting secret/scheduler ตาม §7.3 แล้วทดสอบกับสำเนาที่อนุมัติ

Native SAP เป็น default ส่วน SAP ที่เคยแก้ใน Sheets เก็บตอน merge ข้อมูล manual ที่ยังไม่ import คงไว้ท้ายรายการ ไม่อ้าง source parity ทั้งโมดูลครบ CSV legacy import/backfill อยู่เฟส 5, production least privilege/UAT/hosting/cutover เฟส 6

Rollback: ปิดการส่ง/หยุด scheduler โดยเก็บคิวและประวัติ; ก่อน deploy revert code commits ได้ หลัง apply จริงใช้ forward-fix ไม่ drop ตาราง/backup/history รายละเอียดในคู่มือ

## JEV และขอบเขตเฟส

ใช้ `jev-orchestrator` metadata_only: health local/network OK; risk 1.09/confidence .20, human_review .80 ไม่มี deterministic hard gate เป็น advisory ไม่ใช่ authorization หรือหลักฐาน production ผล deterministic gates เป็นหลัก

Final evidence_check supported .56 / needs_more_evidence .84, policy `do_not_rely_on_claim` เป็น advisory จึงไม่อ้างความพร้อมจริงของ Google/production หรือ source parity ทั้งโมดูล ใช้ command logs/DB/browser เป็นหลักฐานของ local verification เท่านั้น Remote CI และ real-user UAT ยังไม่ได้รัน

Checkpoint continue: `escalate` confidence .28 / `fallback_to_codex` (advisory only) ไม่ใช่คำสั่ง production หรือ hard gate; ใช้ผล deterministic checks ปิด local phase และคง owner-managed release gates ที่ยังไม่ยืนยันไว้ตามเดิม

Code commits: `9adc9c3` formatter/schema/Sheets adapter, `1d0f878` report/worker/API, `96ed56e` UI/browser และ `32dd929` dependency patch ทุก commit อยู่ branch เฟส 4 ในเครื่อง ยังไม่ได้ push

เฟส 4 implementation/local verification จบแล้ว หยุดที่ขอบเขตเฟส 4 ตาม spec §10 ไม่เริ่ม import โดยอัตโนมัติ

ทำซ้ำด้วย PowerShell 7, portable PG และ Chromium ตามคู่มือฐานข้อมูล: `npm run build` แล้ว `./scripts/car-booking-portable-test.ps1 -ServiceTests -BrowserTests -ClusterName phase4-new-fixture` ใช้ชื่อ cluster ใหม่สำหรับ benchmark ที่ตรวจยอดเดือนแบบคงที่ ทดสอบบน loopback/ฐานชื่อเฉพาะ และ stop DB ใน finally
