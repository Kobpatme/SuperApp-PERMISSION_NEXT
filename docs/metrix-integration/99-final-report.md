# รายงานส่งมอบ METRIX — เช่าท่อร้อยสาย

ตรวจปิดข้อพบ 14–15/10/2569 บน branch codex/metrix-duct-rental-foundation ตามไฟล์ CODEX-METRIX-DUCT-RENTAL-MODULE.md, frozen METRIX f87220bf94b765e4896388632c3dbeabb5286510 และคำตอบเจ้าของ DQ01/02/03/07/09

**งาน implementation และ automated local verification ครบตามขอบเขต “ทำให้ 100% แต่ไม่ย้ายข้อมูล” ปิด RC-01–07 แล้ว** ไม่มีการย้ายข้อมูลจริง, apply ฐานหลัก/production, grants ผู้ใช้จริง หรือ deploy โมดูลหลักยัง development/default-disabled จน human UAT/rollout ได้รับอนุมัติ

รายละเอียดข้อกำหนด→ผลลัพธ์→หลักฐานทุกข้ออยู่ใน [รายงานปิดข้อพบ](12-parity-closure.md) และ [parity matrix](07-parity-matrix.md) [ผลตรวจก่อนแก้](11-requirement-recheck.md) เก็บเป็น audit history ไม่ใช่รายการค้างปัจจุบัน

| สิ่งส่งมอบ | ผล |
|---|---|
| Native/Core | Core identity/scoped RBAC/audit/activity/outbox, module registry/Admin toggle, ไม่มี Source auth/shell/theme ซ้ำ |
| Request workflows | NTครบ10ขั้น/non-NT bypass, accept/draft/autosave/validation/private docs/missing Memo/COMPLETE, active owner edits และ terminal readonly |
| Role/financial | 40capabilities/10editable Source business presets ไม่มี auto-assign; Source JSON คงครบใน private financial row พร้อม Decimal2dp/projection checks |
| PDF/signatures | active templateเดิมและ referencesครบ3/hash/field mapping; actual cable count; own assets/default/crop/live preview/date/offset/nudge/scale/rotation; assigned current original/server actor+audit time |
| Annual/cancel/SLA | COMPLETE-only immutable snapshots, unique year/keep total/private final contract, atomic cancellation, Bangkok SLA/Core notifications/realtime/dirty-state protection |
| Import | deterministic offline planner/validation/manifests/checksums/crosswalk/fixtures, dry-run writes0 ไม่มี apply mode ตามคำสั่งเจ้าของ |

คืน created success banner, Source signature controls และ active edits แล้ว เพิ่ม Source-derived exhaustive matrix ไม่ใช้ test countรวมแทน coverage: cable×fiber33คู่และvalid boundaryครบ, validation124, visibility4000/file1600/request transitions1500/annual25/cancel25/guarantee64/movement80/reference constants7ชุด/SLA boundaries5และ7วันข้ามtimezone

**ผลตรวจจริง:** unit6,164ผ่าน/65opt-inข้าม; แยกรัน constrained PostgreSQL24ผ่าน; catalogถึง0056/role presets/replay/no auto grantsผ่าน; 56migration transactional rollbackเหลือ0tables/functions; offline CLI5ผ่าน; browser8ผ่าน179.7วินาที; Core13คู่ changedPixels0; axe13views violations0; 1000rows/page50ใช้4SQLต่อcall15calls; lint/typecheck/build/document mapping/CSSผ่าน; PDF tests10และrender/inspect10pagesผ่าน

ทุก SQL/browser record ใช้ synthetic fixture บน clusterใหม่ loopback55447 แยกจาก configured main DB Browser projectcopyเท่านั้นเปิด lifecycle Source original/discovery git statusว่าง ไม่แก้ Core tokens/global CSS/fonts/sidebar/topbar รูป/JSON/log QA เก็บ localและignored ดู [QA](../quality/duct-rental/README.md)

ก่อนเปิดจริงยังต้อง human UAT ด้วยผู้รับผิดชอบจริง, identities/teams/scopes/coordinator mapping, template/retention/printing review และ operator backup/storage/runtime/rollout review หากจะย้ายข้อมูลจริงต้องคำสั่งใหม่พร้อม reviewed crosswalk/reconciliation ไม่มีการทำ production actions เพื่อให้คะแนนความครบเป็น100%

M0–M9 ในส่วน implementation/automated evidence ปิดครบตาม owner scope; M8คือtools/fixtures ไม่ใช่ real cutover ไม่อ้าง human UAT/production readiness หรือ source deployed drift/load100concurrentusers ผ่านแล้ว

JEVรับเฉพาะsanitized metadata เป็นadvisory supported.66/needs-more.83/gather-more โดยไม่ระบุข้อขาด ไม่ใช้แทน deterministic checks หรือเป็น production approval รายงานแยกข้อจำกัดของ release/สภาพแวดล้อมจริงชัดเจน
