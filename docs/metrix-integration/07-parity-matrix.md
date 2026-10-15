# Source → Native parity matrix

> **ปิดข้อพบ 15/10/2569:** RC-01–07 มี implementation/local verification แล้ว ดู [QA guide](../quality/duct-rental/README.md)/[current status](../implementation-status.md) M8เป็นtools/fixtures ไม่ย้ายข้อมูลจริง Human UAT/production rolloutเป็นreleasegatesแยกต่างหาก รายงานตรวจก่อน/หลังเก็บในGit historyที่commit392c327

ตรวจ 14/10/2569: ✅ หมายถึงมี implementation และหลักฐาน local ตามช่อง test; ⚠️ หมายถึงมีขอบเขตต้อง UAT/production review; ❌ หมายถึงยังไม่ทำและอยู่นอกขอบเขต ไม่มีการประกาศ migrated ก่อน human UAT

| หน้า | องค์ประกอบ/ฟังก์ชัน | พฤติกรรม METRIX / อ้างไฟล์ | Super App | สถานะ | test |
|---|---|---|---|---|---|
| identity/navigation | login/profile/admin/theme | AuthProvider, user/auth stores | REPLACE Core identity/RBAC/registry; default-disabled | ✅ | Core gates / browser security / 13 screenshot pairs |
| list | filters/queues/pipeline/details/SLA | duct-rental/page, DuctRentalWorkspace, RULE-020 | server filters/page 50, scoped counts/modal/phase links | ✅ | service scopes/tracking + 1000-row browser |
| new/edit/design | fields/draft/submit/contacts/cable lookup | new/edit/design, ductRentalSchema, RULE-001..003 | native form + reviewed coordinator mapping | ✅ | Source Zod/cables goldens, draft integration, NT browser |
| draftsman | accept/drawing/NT branch/created notice | draftsman, submitPhase, RULE-007 | canonical server graph/non-NT bypass; created banner/continue ล้าง query | ✅ | NT/non-NT DB/browser และ banner/continue assertion ผ่าน |
| permission 1 | NT preview/save/assign/sign/revoke/response | permission, ntFormFiller, RULE-015/017 | private versioned original + assigned-only signer | ✅ | stale original/assignee/revoke tests + browser signing/realtime |
| install | actual fields/confirmation/draft | install, RULE-002/007 | partial save/full gate + INSTALL-phase confirmation | ✅ | validation/service/browser full NT |
| draftsman 2 | CAD/PDF/KMZ/notes | draftsman2 | native files + autosave, drawing gate | ✅ | schema/service/file guards + full NT browser |
| permission 2/3 | accept/submit/read | permission2/permission3 | scoped phases/server transitions | ✅ | full NT/non-NT, denied skip |
| 3rdparty | rates/dates/notices/invoice | 3rdparty, RULE-008 | independent Decimal 2dp monthly/yearly | ✅ | money goldens + NT/non-NT browser |
| contract | five guarantee fields/docs/complete | contract, RULE-009 | partial draft/autosave; contract/receipt/Memo completion | ✅ | service gates + both branches browser |
| missing docs | note/Memo/list whitespace | MissingDocsPanel/utils/list, RULE-004 | preserves filename fallback and trim/list distinction | ✅ | original goldens + Memo service/browser |
| renewal list/year | snapshot/review/totals/stages/final PDF | renewal/[year], useRenewalStore, RULE-010..012 | ALL creation, unique year, keep-only total/private year parent | ✅ | integration unique/review/parent denial + browser stages |
| cancellation new/detail | snapshot/advance/reject/delete | cancellation/useCancellationStore, RULE-013 | atomic completion, terminal guards/archive | ✅ | integration + NT browser cancellation |
| PDF summary/NT | fields/Thai template/actual cable count | DuctRentalPDF/ntFormFiller, RULE-017 | Source layout/active template/referencesครบ3, native vector form and scoped viewer | ✅ | 10PDFtests/hash/fields/render10pages ผ่าน; printing/template ownerUATเป็นreleasegate |
| PDF signing | own assets/crop/position/name/date/default | pdf-preview/useSignatureStore, RULE-016 | private own assets/live preview/date selector/offset ±180/nudge6/scale; audit time และชื่อ server | ✅ | Source movement80/bounds/date tests, signing service/browser และ PDF render ผ่าน |
| RequestDetailModal/PhaseTabs/ProcessFlow | details/files/current phase/accept | components same names | module modal/stepper/links/authorized read | ✅ | service + keyboard/modal browser |
| tasks/NotificationCenter | assigned task/deep link/notifications | useSignatureTaskStore, RULE-019 | module tasks + Core inbox/outbox; pending/signed/revoked separate from inbox read | ✅ | signer-only RLS/reissue/outbox/7 browser flows |
| realtime/StatusBar | refresh/offline/draft preservation | useRequestStore subscriptions/status | empty SSE hints + 15s fallback/dirty protection | ✅ | committed/rollback NOTIFY + cross-user browser + offline recovery |
| delete confirmations | request/year/cancel delete | Source stores, F19 | ADAPT archive/audit; no physical delete | ✅ | service terminal/archive race tests |
| import/reconciliation | legacy rows/files | Source schema/store snapshots | offline deterministic plan, integrity checks and synthetic fixture | ✅ | 7 planner + 5 CLI tests; no apply/real data per owner |
| production users/centers | roles/install_service_centers | profiles/RLS | owner-reviewed Core crosswalk/grants | ⚠️ | synthetic only; actual assignments not provided |
| role presets | ชุดสิทธิ์สำเร็จรูป §5.2 | Design/Draftsman/Permission/Install/3rd Party/Viewer/Management/Admin | 40 permissions/10 editable presets; ไม่ auto assign; replay รักษา customization | ✅ | Source role ownership/catalog exact/replay/Core Admin browser ผ่าน |
| source golden matrix | exhaustive tests §6.5/6.6 | cable pairs/boundaries/roles/transitions/constants | all33pairs/valid boundaries/reference7arrays/role visibility4000/files1600/transitions1500/annual25/cancel25 | ✅ | frozen AST/VM/Source Zod4 fixtures และ native assertions ผ่าน ดู12 |
| real cutover/UAT | production runtime | deployed Source not inspected | lifecycle development/default false until approved UAT | ⚠️ | operator handoff only |
| MOD2/documents/licenses/support | other module/static placeholders | communication-cable and other pages | separate future scope | ❌ | not Duct Rental; no claim of port |

Source controls inventory is retained in Git history at commit392c327; the current [RULE catalogue](03-business-logic-catalog.md) and frozen fixtures preserve provenance. This table does not claim each403attribute has an independent browser assertion or pixel-identical Source UI. Core13pairs compare separately against baseline5f32a111.
