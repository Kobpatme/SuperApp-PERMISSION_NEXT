# โมดูลเช่าท่อและพาดสาย

## การแบ่งงานและร่างพาดสาย — 15/10/2569

เมนูหลักอยู่ใน Sidebar ใต้กลุ่ม “เช่าท่อและพาดสาย” แบบพับ/ขยายเหมือนโมดูลอื่น: เช่าท่อร้อยสาย (`/duct-rental`), ต่อสัญญา (`/duct-rental/renewal`), พาดสายสื่อสาร (`/duct-rental/communication-cable`) รองรับ desktop/collapsed/mobile และ active state ของหน้าย่อย ส่วนยกเลิกการใช้ท่อ ติดตามต่อสัญญา/ยกเลิก และลงนามยังเป็นทางลัดงานสนับสนุนภายในหน้า ไม่มี3ปุ่มหลักซ้ำด้านบน URL เดิมและ annual snapshot workflow คงเดิม

เจ้าของขอร่างโฟลว์พาดสายก่อน และต่อมาขอทดสอบด้วยบัญชีเดิมในแอปหลัก จึงเพิ่มรายการ/สร้างร่าง/แก้ไข/ส่งต่อ/ส่งกลับ/ปิดงาน/เก็บประวัติ ผ่าน API `cables` และตารางแยก `communication_cable_requests` ใน migration0058 ใช้ Core session, scoped grants, FORCE RLS, server validation, version lock, idempotency และ audit/activity/outbox transaction เดียว มี empty NOTIFY หลัง commit และ fallback refresh15s โดยพักระหว่างเปิดฟอร์ม

โฟลว์ทดลอง: ออกแบบ → ตรวจเอกสาร → ยื่น → รับใบอนุญาต → ยืนยันแบบ → ติดตั้ง → ปิดงาน ส่งกลับจากยื่นได้เมื่อระบุเหตุผล แล้วกลับมาตรวจเอกสารก่อนยื่นใหม่ ทุกขั้นเป็นข้อเสนอสำหรับ UAT ยังไม่ใช่กฎหน่วยงานที่ยืนยันแล้ว ไม่มี SLA/ค่าเช่าจำลอง ไม่มีแนบไฟล์หรือการยื่นภายนอก ดู [คู่มือทดสอบ](../operations/cable-trial-uat.md)

อ่าน Source frozen `f87220bf94b765e4896388632c3dbeabb5286510` ใหม่: `app/(dashboard)/dashboard/communication-cable/page.tsx` เป็น prototype ด้วย React state และตัวอย่างข้อมูล มีขั้นรับ/ยื่น/แก้ไข/Permit/ติดตั้ง แต่ไม่มี durable workflow จึงไม่คัดลอกข้อมูลตัวอย่างหรือ SLA120 เป็นนโยบายจริง งานต่อสัญญาและลงนามยังรองรับเฉพาะเช่าท่อจนกำหนด contract ของพาดสาย ภายหลังต้องยืนยันแบบฟอร์ม ช่องทางยื่น ผู้อนุมัติ ราคา/เงินประกัน SLA และเงื่อนไขต่อสัญญา/ยกเลิก

ชื่อใน manifest เปลี่ยนเป็นเช่าท่อและพาดสาย โดยรักษา module ID และ catalog40capabilities ป้ายสิทธิ์เดิมยังใช้คำเช่าท่อตาม migration ที่ติดตั้งแล้ว งานพาดสายใช้ request.create/update/archive และ design.submit/permission1.submit/install.submit ตามขั้น พร้อม module.view และ scope เดิม ไม่มี auto grants หรือการเพิ่มสิทธิ์ผู้ใช้จริง

Native module key `duct-rental`, capability prefix `duct_rental`, base route `/duct-rental` ใช้ Core session/RBAC/data scopes/audit/activity/outbox และ identity เดิม Source freeze METRIX `f87220bf94b765e4896388632c3dbeabb5286510` ดู [สถานะปัจจุบัน](../implementation-status.md), [parity](../metrix-integration/07-parity-matrix.md) และ [deployment](../operations/duct-rental-deployment.md)

## Release และสิทธิ์

เจ้าของอนุญาตเปิด local UAT ด้วยบัญชีเดิม: manifest เปลี่ยนเป็น `lifecycle: active`, คง `enabledByDefault: false` เพื่อให้ Core Admin เปิดเป็นราย environment ได้ ไม่ใช่หลักฐานพร้อม production Catalog40capabilities รองรับ OWN/TEAM/SELECTED_TEAMS/ALL ตามโมดูลเช่าท่อเดิม งานพาดสายรอบนี้เป็น owner-scoped ไม่มี team assignment จึงใช้ OWN/ALL สำหรับคำขอทดลอง Core Admin toggle ต้อง `core.module.manage` ALL และ version ปัจจุบัน Human UAT และ production rollout review ยังเป็นเงื่อนไขแยก

การดูราคาแยก rate.read, ดูไฟล์ตาม phase+document.read, export ตาม document.export การลงนามต้อง signoff.sign และเป็น assignee ของ current original เท่านั้น จึงไม่เพิ่ม request.update ให้ Sr. Manager การสร้าง annual year ต้อง module.view/renewal.create/rate.read ALL เพื่อสร้าง snapshot ครบทั้งปี

## Persistence และ mutations

ใช้ `DUCT_RENTAL_DATABASE_URL` เป็น constrained PostgreSQL runtime login สมาชิก `duct_rental_runtime` ไม่เป็น owner/NOSUPERUSER/NOBYPASSRLS ไม่มี fallback ไป migration/admin login Migrations0029–0058 มี FORCE RLS, live Core scopes, workflow/document/version/immutable guards และ private Source financial JSON/projection checks

Mutation: Core session → capability/scope → Zod → canonical business rule → version/UUID idempotency/fingerprint → business+audit+activity+outbox+receipt transaction เดียว Request/sign ใช้ advisory lock ร่วมก่อน row locks ป้องกัน sign/archive races Partial draft บันทึกได้แต่ submit ต้อง full schema เอกสารและรับงานครบ Source non-NT bypass คงเดิม งาน terminal/archived เป็นอ่านอย่างเดียว

Private storage อ่านผ่าน authenticated API เท่านั้น ห้าม serve directory เป็น public เอกสารสูงสุด 25 MB / PNG ลายเซ็น 2 MB ตรวจ MIME/checksum/path และ parent ที่มีสิทธิ์ Document ผูก request หรือ annual year เพียงหนึ่ง parent NT original ต้อง server generated และ immutable design snapshot; signed PDF สร้างจาก original ปัจจุบัน+own PNG+verified Core name+editable Source display date ส่วน audit/signedAt ใช้เวลาจริงของ server ไม่รับ forged signed PDF upload

มี 10 editable business role presets สำหรับเลือก/คัดลอกใน Core Admin ไม่มีการมอบแก่ผู้ใช้จริงอัตโนมัติ Working/Viewer request.update บังคับ owner exception; management readonly ส่วน Sr. Manager ลงนาม assigned current original ตาม DQ01 Active metadata edits ไม่เปลี่ยนขั้นตอน/scope และทำให้ NT snapshot เก่าใช้ลงนามไม่ได้ templates ทั้ง3มี hash/field inventory และ scoped preview/export ดู [QA](../quality/duct-rental/README.md)

Fees ใช้ Decimal ROUND_HALF_UP 2dp และ PostgreSQL numeric ค่าต่อเดือน/ปีกรอกแยก ไม่มีภาษี/prorata/x12 Annual snapshots เฉพาะ COMPLETE และไม่ cancelled; global year unique, sum keep only Final annual contract PDF mandatory Cancellation completion เขียน request.cancelledAt กับสถานะเดียวกันแบบ atomic

## UI และ change hints

Scoped list/filter/count/page 50; native phase forms/draft/autosave, private file/PDF preview, assigned signature editor, annual/cancel/tracking/settings Refresh ใช้ empty PostgreSQL NOTIFY หลัง commit → SSE ไม่มี business payload/actor/SQL ใน event ตรวจ Core ใหม่ทุก reconnect ราว 30s และ visible polling 15s Dirty draft/files หยุด auto replace พร้อมแจ้งข้อมูลเปลี่ยน

PDFJS worker/standard fonts อยู่ local public assets เฉพาะ runtime viewer; PDF template/Sarabun อยู่ server module assets ไม่เปิดข้อมูล private Module CSS ใช้ Core tokens ไม่เปลี่ยน global theme/header/sidebar

## Operator handoff

ก่อน production: review backup/migrations/private directory/constrained login, map real users/teams/center coordinators และ grant scopes ที่ตรวจแล้ว, ยืนยัน template/font rights และ signature retention แล้วเปิดผ่าน Core Admin ตาม environment ที่อนุมัติ งานนี้เปิดทดสอบ local เท่านั้น Rollback ปิดโมดูลโดยรักษา business history/audit และตารางพาดสายไว้

Offline import เป็น dry run เท่านั้นตาม owner DQ07 ดู [เครื่องมือ](../metrix-integration/10-offline-import.md) Synthetic QA ไม่เป็น production authorization และไม่พิสูจน์ data quality ของระบบจริง
