# สัญญาข้อมูลที่ใช้จริง

ปรับล่าสุด 14/10/2569 ต้นทาง frozen SHA `f87220bf94b765e4896388632c3dbeabb5286510` ไม่ได้ตรวจ schema หรือข้อมูล deployed จริง การตรวจ DDL และ RLS ใช้ฐาน loopback fixture แยกเท่านั้น

| Source | Target ที่ใช้จริง | Mapping / ข้อบังคับ |
|---|---|---|
| profiles / auth | Core profiles, roles, teams, data scopes | ใช้ Core identity เดิม; crosswalk actor/center ต้องตรวจโดยเจ้าของ ไม่คัด password/session/client role |
| requests | duct_rental_requests | UUID ฝั่ง server, human request code, source_id สำหรับ crosswalk; owner/team immutable, phase/status/version, design/install/as-built JSON, missingDocs และ cancelledAt |
| rate_notice_data / guarantee_data | private duct_rental_rates JSON + numeric projections | คง Source keys/notes/extensions; trigger ตรวจ JSON money ตรง projection numeric(12,2), ROUND_HALF_UP; request เก็บเฉพาะ non-price fields; ค่าเดือนและปีอิสระ ไม่คูณ 12 ไม่เพิ่มภาษี |
| request_files | duct_rental_documents | private storage key/checksum/bytes/MIME/phase/type/version; original NT มี design_snapshot; document มี request parent หรือ renewal parent เพียงอย่างเดียว |
| permission1_signoff / notifications | duct_rental_signoff_configs, duct_rental_sign_tasks + Core outbox/inbox | เลือก signer ก่อนสร้าง NT ได้; task ผูก original version และ assignee; original ปัจจุบันเท่านั้นที่ลงนามได้; เปลี่ยน signer/regenerate/revoke ทำให้ task เก่าใช้ไม่ได้ |
| browser signature assets | duct_rental_signature_assets | private PNG ผูก owner, default/archive; ไม่คัด localStorage อัตโนมัติ |
| annual_renewals | duct_rental_renewals | year unique ทั่วโมดูล, owner/team/version/status, actor/timestamps, private final contract document; total numeric(14,2) |
| annual_renewal_routes | duct_rental_renewal_routes | immutable route snapshot/fees, keep/drop/review notes, reviewed actor/time; ผลรวมเฉพาะ keep |
| cancellations | duct_rental_cancellations | immutable snapshot/fees, effectiveDate/reason/notes/status/version; completion และ request.cancelledAt เขียน atomic |
| replay protection | duct_rental_mutation_receipts | actor + UUID idempotency key + fingerprint; replay คืนผลเดิม, payload ต่างปฏิเสธ |
| service center coordinator | module settings / reviewed Core teams | ไม่เดาชื่อคนหรือ team จริง; admin mapping versioned |

ชื่อจริงและชนิดอยู่ใน `src/modules/duct-rental/server/schema.ts`; migrations 0029–0056 รวม permission catalog/presets, FORCE RLS, scope functions, workflow/document guards, lossless financial JSON และ indexes ไม่มีตาราง Supabase Auth ซ้ำ ดู architecture contract/verification ใน [12](12-parity-closure.md) migrations ใหม่ทดสอบเฉพาะ fixture ไม่มี real backfill

การอ่านใช้ Core active session/live grants และ OWN/TEAM/SELECTED_TEAMS/ALL; signed-only reader ไม่ได้สิทธิ์แก้ request การสร้าง annual snapshot ต้องมี module.view/renewal.create/rate.read แบบ ALL เพื่อไม่สร้างปีที่ขาดเส้นทาง Runtime login แยกต้อง NOSUPERUSER/NOBYPASSRLS และไม่เป็น table owner

Request mutations และ signing ใช้ advisory lock ร่วมตาม request ก่อน row lock เพื่อกัน archive/sign race เอกสาร NT เก่าหลัง design เปลี่ยนใช้ลงนามไม่ได้ งาน terminal/archived แก้ต่อไม่ได้ Audit/activity/outbox/receipt อยู่ transaction เดียวกับ business write

Source JSON ทุกช่องยังมี mapping ตาม RULE-002/003 และ offline import planner; legacy URL ไม่ใช้เป็น public runtime URL ประวัติ signoff นำไปเป็นข้อมูลตรวจทานเท่านั้น ไม่สร้างงานเซ็นที่มีอำนาจจริง ดู [เครื่องมือ dry run](10-offline-import.md)
