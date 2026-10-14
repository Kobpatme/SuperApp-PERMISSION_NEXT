# Source → Native parity matrix

> **แก้สถานะหลังตรวจซ้ำ 14/10/2569:** ตารางด้านล่างแสดง main paths ที่มีโค้ด/หลักฐาน ไม่รับรองครบทุกข้อในไฟล์แนบ M1/M3/M5/M6 ยังมีช่องว่าง ดู [RC-01–07](11-requirement-recheck.md) โดยเฉพาะ role presets, exhaustive goldens, created banner และ signature controls

ตรวจ 14/10/2569: ✅ หมายถึงมี implementation และหลักฐาน local ตามช่อง test; ⚠️ หมายถึงมีขอบเขตต้อง UAT/production review; ❌ หมายถึงยังไม่ทำและอยู่นอกขอบเขต ไม่มีการประกาศ migrated ก่อน human UAT

| หน้า | องค์ประกอบ/ฟังก์ชัน | พฤติกรรม METRIX / อ้างไฟล์ | Super App | สถานะ | test |
|---|---|---|---|---|---|
| identity/navigation | login/profile/admin/theme | AuthProvider, user/auth stores | REPLACE Core identity/RBAC/registry; default-disabled | ✅ | Core gates / browser security / 13 screenshot pairs |
| list | filters/queues/pipeline/details/SLA | duct-rental/page, DuctRentalWorkspace, RULE-020 | server filters/page 50, scoped counts/modal/phase links | ✅ | service scopes/tracking + 1000-row browser |
| new/edit/design | fields/draft/submit/contacts/cable lookup | new/edit/design, ductRentalSchema, RULE-001..003 | native form + reviewed coordinator mapping | ✅ | Source Zod/cables goldens, draft integration, NT browser |
| draftsman | accept/drawing/NT branch/created notice | draftsman, submitPhase, RULE-007 | canonical server graph/non-NT bypass; created success banner ยังขาด RC-04 | ⚠️ | NT/non-NT DB/browser ผ่าน; created notice ยังไม่มี |
| permission 1 | NT preview/save/assign/sign/revoke/response | permission, ntFormFiller, RULE-015/017 | private versioned original + assigned-only signer | ✅ | stale original/assignee/revoke tests + browser signing/realtime |
| install | actual fields/confirmation/draft | install, RULE-002/007 | partial save/full gate + INSTALL-phase confirmation | ✅ | validation/service/browser full NT |
| draftsman 2 | CAD/PDF/KMZ/notes | draftsman2 | native files + autosave, drawing gate | ✅ | schema/service/file guards + full NT browser |
| permission 2/3 | accept/submit/read | permission2/permission3 | scoped phases/server transitions | ✅ | full NT/non-NT, denied skip |
| 3rdparty | rates/dates/notices/invoice | 3rdparty, RULE-008 | independent Decimal 2dp monthly/yearly | ✅ | money goldens + NT/non-NT browser |
| contract | five guarantee fields/docs/complete | contract, RULE-009 | partial draft/autosave; contract/receipt/Memo completion | ✅ | service gates + both branches browser |
| missing docs | note/Memo/list whitespace | MissingDocsPanel/utils/list, RULE-004 | preserves filename fallback and trim/list distinction | ✅ | original goldens + Memo service/browser |
| renewal list/year | snapshot/review/totals/stages/final PDF | renewal/[year], useRenewalStore, RULE-010..012 | ALL creation, unique year, keep-only total/private year parent | ✅ | integration unique/review/parent denial + browser stages |
| cancellation new/detail | snapshot/advance/reject/delete | cancellation/useCancellationStore, RULE-013 | atomic completion, terminal guards/archive | ✅ | integration + NT browser cancellation |
| PDF summary/NT | fields/Thai template/actual cable count | DuctRentalPDF/ntFormFiller, RULE-017 | Source layout/template, native vector form and private viewer | ⚠️ | 7 PDF tests/render all 5 NT pages + offline frozen Source reference; print/layout owner UAT |
| PDF signing | own assets/crop/position/name/date/default | pdf-preview/useSignatureStore, RULE-016 | private assets/editor มี แต่ date selector และ offset range ต่างจาก Source RC-05 | ⚠️ | default layout/image/sign browser ผ่าน; required control parity ยังไม่ครบ |
| RequestDetailModal/PhaseTabs/ProcessFlow | details/files/current phase/accept | components same names | module modal/stepper/links/authorized read | ✅ | service + keyboard/modal browser |
| tasks/NotificationCenter | assigned task/deep link/notifications | useSignatureTaskStore, RULE-019 | module tasks + Core inbox/outbox; pending/signed/revoked separate from inbox read | ✅ | signer-only RLS/reissue/outbox/7 browser flows |
| realtime/StatusBar | refresh/offline/draft preservation | useRequestStore subscriptions/status | empty SSE hints + 15s fallback/dirty protection | ✅ | committed/rollback NOTIFY + cross-user browser + offline recovery |
| delete confirmations | request/year/cancel delete | Source stores, F19 | ADAPT archive/audit; no physical delete | ✅ | service terminal/archive race tests |
| import/reconciliation | legacy rows/files | Source schema/store snapshots | offline deterministic plan, integrity checks and synthetic fixture | ✅ | 7 planner + 5 CLI tests; no apply/real data per owner |
| production users/centers | roles/install_service_centers | profiles/RLS | owner-reviewed Core crosswalk/grants | ⚠️ | synthetic only; actual assignments not provided |
| role presets | ชุดสิทธิ์สำเร็จรูป §5.2 | Design/Draftsman/Permission/Install/3rd Party/Viewer/Management/Admin | มี 40 permissions แต่ไม่มี reusable business role seed RC-01 | ❌ | ต้อง seed/test default bundles โดยไม่ auto-grant ผู้ใช้ |
| source golden matrix | exhaustive tests §6.5/6.6 | cable pairs/boundaries/roles/transitions/constants | lookup covered แต่ validation/role/type/transition matrix ยังไม่ครบ RC-02/03 | ⚠️ | existing tests passed ไม่แทน exhaustive coverage |
| real cutover/UAT | production runtime | deployed Source not inspected | lifecycle development/default false until approved UAT | ⚠️ | operator handoff only |
| MOD2/documents/licenses/support | other module/static placeholders | communication-cable and other pages | separate future scope | ❌ | not Duct Rental; no claim of port |

Controls index [09](09-ui-control-evidence.md) and [RULE catalogue](03-business-logic-catalog.md) preserve Source provenance; this table does not claim every 403 attribute has an independent browser assertion or pixel-identical Source UI. Core before/after is a separate 13-pair pixel comparison against baseline 5f32a111.
