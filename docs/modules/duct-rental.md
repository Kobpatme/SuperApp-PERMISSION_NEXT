# โมดูลเช่าท่อร้อยสาย

Native module key `duct-rental`, capability prefix `duct_rental`, base route `/duct-rental` ใช้ Core session/RBAC/data scopes/audit/activity/outbox และ identity เดิม Source freeze METRIX `f87220bf94b765e4896388632c3dbeabb5286510` ดู [รายงาน](../metrix-integration/99-final-report.md)

## Release และสิทธิ์

Manifest ยัง `lifecycle: development`, `enabledByDefault: false` จน human UAT บันทึกผ่าน ไม่ให้ business users อัตโนมัติ Catalog 40 capabilities รองรับ OWN/TEAM/SELECTED_TEAMS/ALL: module/request/document/rate, accept+submit 9 phases, annual 6, cancellation 4, signoff assign/sign/revoke และ settings Core Admin toggle ต้อง `core.module.manage` ALL และ version ปัจจุบัน โมดูลที่ development เปิดไม่ได้

การดูราคาแยก rate.read, ดูไฟล์ตาม phase+document.read, export ตาม document.export การลงนามต้อง signoff.sign และเป็น assignee ของ current original เท่านั้น จึงไม่เพิ่ม request.update ให้ Sr. Manager การสร้าง annual year ต้อง module.view/renewal.create/rate.read ALL เพื่อสร้าง snapshot ครบทั้งปี

## Persistence และ mutations

ใช้ `DUCT_RENTAL_DATABASE_URL` เป็น constrained PostgreSQL runtime login สมาชิก `duct_rental_runtime` ไม่เป็น owner/NOSUPERUSER/NOBYPASSRLS ไม่มี fallback ไป migration/admin login Migrations 0029–0052 มี FORCE RLS, live Core scopes, workflow/document/version/immutable guards

Mutation: Core session → capability/scope → Zod → canonical business rule → version/UUID idempotency/fingerprint → business+audit+activity+outbox+receipt transaction เดียว Request/sign ใช้ advisory lock ร่วมก่อน row locks ป้องกัน sign/archive races Partial draft บันทึกได้แต่ submit ต้อง full schema เอกสารและรับงานครบ Source non-NT bypass คงเดิม งาน terminal/archived เป็นอ่านอย่างเดียว

Private storage อ่านผ่าน authenticated API เท่านั้น ห้าม serve directory เป็น public เอกสารสูงสุด 25 MB / PNG ลายเซ็น 2 MB ตรวจ MIME/checksum/path และ parent ที่มีสิทธิ์ Document ผูก request หรือ annual year เพียงหนึ่ง parent NT original ต้อง server generated และ immutable design snapshot; signed PDF สร้างจาก original ปัจจุบัน+own PNG+verified Core name+server date ไม่รับ forged signed PDF upload

Fees ใช้ Decimal ROUND_HALF_UP 2dp และ PostgreSQL numeric ค่าต่อเดือน/ปีกรอกแยก ไม่มีภาษี/prorata/x12 Annual snapshots เฉพาะ COMPLETE และไม่ cancelled; global year unique, sum keep only Final annual contract PDF mandatory Cancellation completion เขียน request.cancelledAt กับสถานะเดียวกันแบบ atomic

## UI และ change hints

Scoped list/filter/count/page 50; native phase forms/draft/autosave, private file/PDF preview, assigned signature editor, annual/cancel/tracking/settings Refresh ใช้ empty PostgreSQL NOTIFY หลัง commit → SSE ไม่มี business payload/actor/SQL ใน event ตรวจ Core ใหม่ทุก reconnect ราว 30s และ visible polling 15s Dirty draft/files หยุด auto replace พร้อมแจ้งข้อมูลเปลี่ยน

PDFJS worker/standard fonts อยู่ local public assets เฉพาะ runtime viewer; PDF template/Sarabun อยู่ server module assets ไม่เปิดข้อมูล private Module CSS ใช้ Core tokens ไม่เปลี่ยน global theme/header/sidebar

## Operator handoff

หลัง UAT: review backup/migrations/private directory/constrained login, map real users/teams/center coordinators และ grant scopes ที่ตรวจแล้ว, ยืนยัน template/font rights และ signature retention, เปลี่ยน lifecycle เป็น active ด้วย reviewed release แล้วเปิดผ่าน Core Admin ไม่มี production apply/grants/cutover ในงานนี้ Rollback ปิดโมดูล/ถอน grants โดยรักษา business history/audit

Offline import เป็น dry run เท่านั้นตาม owner DQ07 ดู [เครื่องมือ](../metrix-integration/10-offline-import.md) Synthetic QA ไม่เป็น production authorization และไม่พิสูจน์ data quality ของระบบจริง
