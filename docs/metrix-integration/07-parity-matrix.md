# Source parity matrix

สถานะยังไม่มีฟีเจอร์ธุรกิจที่ประกาศ migrated; ไม่มี RETIRE จากการที่ target ยังไม่ทำ Source SHA 01 / controls09 / RULE03 / release gate99

| หน้า/ฟังก์ชัน | METRIX behavior | Target | จัดประเภท | สถานะ/test |
|---|---|---|---|---|
| login/profile/admin/session | identity/Supabase/clientflags | Coreเดิม | REPLACE | ⚠️ Core baselineผ่าน; moduleintegrationยังไม่เปิด |
| navigation/moduleguard/capabilities | Sidebar/role | registry+CoreRBAC | ADAPT | ⚠️ manifest/catalog/guard ผ่าน tests; default-disabled; admin lifecycle toggle ยังไม่มี |
| new/edit/design | schema/cablelookup/draft/submit/contacts/files/PDF | domain/schema + nativeforms | PORT | ⚠️ validation/cable source golden ผ่าน; ❌ UI/persistence |
| list/pipeline/filters/queues/detail/accept | RULE004/005/020 | scoped query+workspace/modal | ADAPT | ❌ M4/M5 |
| all10phase screens | RULE007/state/docs/autosave | nativeworkflow+servertransaction | ADAPT | ❌ DQ05/phase testsก่อนเปิด |
| NT form/signer/revoke/response | RULE015/017 | private document version+assigned capability | ADAPT | ❌ DQ01/DQ03/DQ08 |
| install/AsBuilt/rates/payment/contract | RULE002/007/008/009 | nativeforms+authorizedfiles | PORT | ❌ M4–M6 |
| missingdocs | RULE004 list/helperต่างกัน | preservebothfunctions | PORT | ⚠️ pure source golden ผ่าน; ❌ UI |
| annualrenewal/list/detail/keep/drop/cost/status/contract | RULE010–012 | nativeyearlyworkflow | ADAPT | ❌ DQ02/M2–M6 |
| cancellation/new/progress/reject/details | RULE013 | transaction cancel+request | ADAPT | ❌ M2–M6 |
| PDFsummary/template/preview/signatures/print | RULE016–018 | moduleprivategeneration/preview | PORT | ❌ render/license/UAT |
| files/upload/download/preview | RULE006/018 | Coreprivate authorizedattachments | REPLACE | ❌ sourceunknownroleallowห้ามใช้ |
| realtime/localpersistentnotifications/tasks | RULE019/015 | Coreoutbox/inbox+moduletaskUI | ADAPT | ❌ M4/M6 |
| deleteconfirms | sourceharddelete | archive/audit/restore | ADAPT | ❌ ตามmasterpreservehistory |
| moduleUX keyboard/mobile/error/empty/access/overflow | 05/09 | sameactions/Coretokens/localstyles | ADAPT | ❌ browser/axe/visualM8 |
| realimport/reconciliation | datasetยังไม่ให้ | dryrun/idempotenttestDBonly | ADAPT | ❌ DQ06/07 |
| MOD2/placeholderotherpages | othermodule/static | separate future scope | KEEP | ⚠️ ไม่ใช่DuctRental ไม่อ้างว่าพอร์ตแล้ว |

รายละเอียดparityต่อbutton/field/disabled/placeholderอยู่09 (403attributes/24files) รายการนี้ยังไม่ใช่signoffว่า UIครบ หน้าตาSuperAppยังต้องbefore/after evidenceตามM8แม้การแก้registryไม่เพิ่มเมนูในสถานะdisabled
