# กฎธุรกิจและ state machines

อ้าง source SHA ใน 01; ตัวอย่างด้านล่างอ่านจากเงื่อนไขจริง ไม่ใช่อัตราธุรกิจที่ตั้งขึ้นใหม่ RULE ที่ยังไม่มี golden/integration ใน target ระบุใน 99; pure fixtures ต้องสร้างด้วยการรัน source functions อีกครั้งก่อน M3 ทุกสูตรอยู่ client ยกเว้น API/DDL ที่ระบุ

## RULE-001 — Draft และการรับงาน

- ที่มา: `app/api/requests/create-draft/route.ts:5–22,28–74`; `accept-phase/route.ts:47–128`; `useRequestStore.ts:361,432`
- Input/output: verified active user → RQ-text ID, DESIGN, ทุก phase pending, signoff pending; accept(id,phase) → phase accepted
- เงื่อนไข: create ไม่อนุญาต readonly management; owner จาก verified user ไม่รับ ownerId client; accept ตรวจ role owned phase + current_phase ตรง phase; timestamp ISO; ไม่มีเงิน/ภาษี
- Edge: accept ไม่ตรวจว่าเดิม done จึงอาจรับซ้ำ; error 401/403/404/409; owner fallback display_name→ownerName→metadata→email
- ตัวอย่าง: design สร้าง→DESIGN/pending; install รับ INSTALL ปัจจุบัน→accepted; design รับ INSTALL→403 (server)

## RULE-002 — Design/Install validation

- ที่มา: `schemas/ductRentalSchema.ts:99–172`; new/page.tsx:216–234
- Input/output: form → Zod data/errors; requestType default NEW; project/route/detail/coords/district/province string min1; enum owner/job/center/cable; diameter >=.1; distance>=.01; cableCount integer>=1 optional (empty/null/undefined→undefined); ไม่มี trim/coordinate/email validation ใน schema
- Install: actual coords/ML/installDate min1; actualDistance>=.01; pipeCount coerced optional; dates ไม่มี semantic range ใน schema
- Round: form onBlur distance ใช้ Number.toFixed(2); ไม่ใช้กับเงิน หน่วย distance m/diameter mm ตาม UI/PDF
- ตัวอย่าง: cableCount=''→undefined; cableCount=1→1; cableCount=0→validation error; actualDistance=.01 ผ่าน/.009 ไม่ผ่าน/'' ไม่ผ่าน

## RULE-003 — Cable/Fiber/Diameter mapping

- ที่มา: `schemas/ductRentalSchema.ts:26–60,140–155`
- Input/output: cableType+fiberType→diameter; Drop OFC 2=6.5; ADSS 12/24/48/60=8.7,72=10.5,96=12,120=13.5,144=15,312=18; ARSS 12/24=11,48/60=12,120=15,144/216=17,312=18.7
- เงื่อนไข: unknown cable→[]; unknown fiber→undefined; abs(input diameter−expected)>.001 → error; ไม่เกี่ยวกับภาษี/วันที่
- ตัวอย่าง: ADSS/72 Core→10.5; Drop OFC/2 Core→6.5; ADSS/2 Core→undefined/error

## RULE-004 — เอกสารขาดและ COMPLETE gate

- ที่มา: `lib/utils.ts:74–87`; duct-rental/page.tsx:78–82; `useRequestStore.ts:488–500`
- Input/output: phase, missingDocs, files→boolean; DESIGN ไม่ต้อง memo; หลัง DESIGN ต้อง fileType=memo หรือชื่อ lowercase includes 'memo'; helper ใช้ !!missingDocs.trim(); list ใช้ !!missingDocs ไม่ trim
- Edge: file ไม่ระบุ name ไม่พบ memo; note whitespace แตกต่างกัน ไม่แก้เงียบ; ไม่มีเงิน/วันที่
- ตัวอย่าง: DESIGN ไม่มีไฟล์→ไม่ขาด; COMPLETE memo+missingDocs=' '→helper ไม่ขาด/list ขาด; COMPLETE drawing ไม่มี memo→ขาด

## RULE-005 — Phase visibility/หน้าที่ตาม role

- ที่มา: `lib/utils.ts:8–67`; `useUserStore.ts:266–275`; `useAuthStore.ts:35–54`; migration 20260421
- Input/output: role+request phases→visible/preferred; admin/viewer/sr_manager/division_manager/director เห็นทุกงาน; design=DESIGN, draftsman=สอง DRAFTSMAN, permission=สาม PERMISSION, install=INSTALL, 3rdparty=สอง 3RD_PARTY; touched คือ current หรือ status defined !=pending; preferred เลือก owned touched ที่ลำดับล่าสุด
- Edge: unknown role ไม่เห็น request; management action ไม่ได้; permissions flags บางส่วนไม่ใช้ใน canAccept/canSubmit; SQL SELECT กว้างกว่า UI; target ต้องใช้ verified capability/scope แทน
- ตัวอย่าง: draftsman current DRAFTSMAN_2→เห็นและเลือก DRAFTSMAN_2; install current DESIGN/pending INSTALL→ไม่เห็น; viewer current COMPLETE→เห็น/COMPLETE

## RULE-006 — File visibility

- ที่มา: `lib/utils.ts:97–122`; RequestDetailModal.tsx:180
- Input/output: role+file phase/type→boolean; global roles/permission/3rdparty ทุกไฟล์; design ซ่อน invoice; draftsman ซ่อน invoice/memo; install เฉพาะ DRAFTSMAN/PERMISSION_1/INSTALL และ type drawing/permission_letter/confirmation_form หรือไม่มี type
- Edge: unknown role fallback=true ใน source (`METRIX-BUG`); target ห้ามใช้ fallback เป็น authorization ตาม master; scope ของ parent ต้องตรวจด้วย
- ตัวอย่าง: design/invoice→false; install/DRAFTSMAN/drawing→true; install/DESIGN/drawing→false

## RULE-007 — Request phase graph และ side effects

- ที่มา: `useRequestStore.ts:402–542`; phase page handlers ใน 08/09; draftsman/page.tsx:85–128
- Graph: DESIGN→DRAFTSMAN→PERMISSION_1→INSTALL→DRAFTSMAN_2→PERMISSION_2→3RD_PARTY_1→PERMISSION_3→3RD_PARTY_2→COMPLETE; Draftsman owner.trim().toUpperCase() มีค่าและ!=NT →3RD_PARTY_1 โดยข้าม 4 phase กลาง
- UI requirements: Drawing (saved/new); Permission1 NT form+signed+permission letter+confirmation; Install schema; Draftsman2 new PDF (CAD/KMZ optional); Permission2 forward; rate notice+invoice (saved/new), signed optional; Permission3 forward; contract/guarantee/receipt+RULE004
- Submit store: current done; next COMPLETE เพิ่ม COMPLETE done; INSTALL/DRAFTSMAN_2/3RD_PARTY_1/3RD_PARTY_2 map extraData ไป respective blobs; ไม่ reset next accepted/done; store ไม่ตรวจ graph/accepted/current มาจาก server ต้องตัดสิน DQ05 ก่อน canonical transition gate
- ตัวอย่าง: Draftsman NT→PERMISSION_1; Draftsman TRUE→3RD_PARTY_1; Draftsman owner=''→PERMISSION_1 (ไม่ถือเป็น non-NT)

## RULE-008 — ค่าเช่าเป็นข้อมูลกรอก ไม่ได้สร้างอัตรา

- ที่มา: `3rdparty/page.tsx:115–205`; `useRequestStore.ts:564`; SQL initial cancellation/routes numeric(12,2)
- Input/output: monthlyFee/yearlyFee string→Number แต่ละช่องอิสระ; empty→0; notes/date strings; save draft ไม่ progress; autosave ยิงทุก change ไม่ debounce; submit ไม่คำนวณ yearly จาก monthly ไม่คิด tax/prorata
- Round/edge: JS binary float; SQL child snapshots 2 decimals; request JSON ไม่มี scale; วันที่เริ่ม/สิ้นสุดยังไม่มี validation ลำดับ; finance policy รอ DQ02
- ตัวอย่าง: monthly='100',yearly='500'→100/500; ''/''→0/0; '-1'/'2'→-1/2 ใน handler (อย่าอ้างว่าต้นทาง validate เงินแล้ว)

## RULE-009 — Contract/Guarantee complete

- ที่มา: `contract/page.tsx:77–116`; `useRequestStore.ts:574,488`
- Input/output: contractNumber/fullAmount/paymentType/venderCode/receiptNumber strings + contractFile/receiptFile→COMPLETE; fields ตรวจ truthy ไม่ได้คำนวณจำนวนเงิน; fullAmount ยัง text; 1000ms delayed autosave ไม่มี cancellation
- Edge: no memo/note→RULE004 block; strings whitespace ยัง truthy; signed/contract uploads ทำนอก state transaction ในต้นทาง
- ตัวอย่าง: ครบ fields+receipt+contract+memo→COMPLETE; ไม่มี receipt→block; fullAmount=''→block

## RULE-010 — Active routes/annual year

- ที่มา: `renewal/page.tsx:40–97`; cancellation/new/page.tsx:30–32
- Input/output: requests→เฉพาะ currentPhase COMPLETE&&!cancelledAt; ต่อปีหน้า getFullYear()+1 (ค.ศ.); id String(year); unique year ใน SQL; snapshot ชื่อ/ท่อ/ศูนย์/จังหวัด/อำเภอ/เงิน/วันที่; route review=pending; fee absent→0
- Edge: ไม่กรองตาม contract end date; ไม่ต้องมี route; no day-count/prorata; timezone source browser local, targetกำหนด Bangkok
- ตัวอย่าง: COMPLETE ไม่ cancelled→include; COMPLETE cancelledAt truthy→exclude; 2026→renewal id '2027'

## RULE-011 — Estimated renewal total

- ที่มา: `useRenewalStore.ts:64–65,210–237`; SQL initial numeric(14,2)
- Input/output: routes→sum yearlyFee เฉพาะ reviewStatus='keep'; create sum (yearlyFee||0), update fetch all routes sum Number(yearly_fee); ไม่ tax/prorata/derive yearly
- Edge: pending/drop ไม่นับ; float drift; create header/routes และ review/header writes ไม่ transaction; DQ02 ต้องตัดสิน
- ตัวอย่าง: keep 100+drop200→100; pending100→0; keep .1+.2→JS .30000000000000004 (DB 2dp .30)

## RULE-012 — Renewal state/status/owner

- ที่มา: `useRenewalStore.ts:240–311`; renewal/[year]/page.tsx:196–281, UI controls 09; `processTracking.ts:12–37`
- Flow UI: draft (Design review Keep/Drop; pending ต้องครบก่อนส่ง)→sent_to_3rdparty (Permission start memo)→memo_preparing (3rdparty confirm)→provider_confirmed (3rdparty contract)→contracted; aliases reviewing/approved ยังมี type/labels; approveRenewalเก่าให้ provider_confirmed แต่ UI canApprove=false
- Store methods ไม่มี from-state guard; saveContractDetails ตั้ง contracted แม้ไม่มี file/number; UI button requirements ต้องพอร์ต; owner sent/provider/approved=3rd Party, memo=Team Permission, contracted=Completed, others Team Design
- ตัวอย่าง: sent_to_3rdparty→owner3rd Party; memo_preparing→Team Permission; unknown→Team Design; ไม่สรุปว่า SQL รองรับเฉพาะ UI graph

## RULE-013 — Cancellation transitions/snapshot

- ที่มา: `useCancellationStore.ts:130–233`; cancellation/[id]/page.tsx:79–95,139–141
- create snapshot active route + reason/effectiveDate→cancel_initiated; UI Permission/admin: pending/cancel_initiated→in_progress→tracking→completed; admin reject→rejected; aliases pending=initiated, approved=completed
- Side effects: complete ตั้ง approved_by/at แล้ว cancelRoute เขียน request.cancelledAt=effectiveDate/cancellationId แยก write; rejected ใช้ rejected_by/at ไม่ cancel request; notesถูกแทน ไม่ append history; actor text client เป็น data ไม่ใช่ auth
- ตัวอย่าง: pending→in_progress; tracking→completed และ request cancelled; rejected→ไม่มี advance action

## RULE-014 — SLA วันปฏิทิน

- ที่มา: `lib/processTracking.ts:1–72`; list/page.tsx:131–172
- Input/output: startDate+days+completedAt→ISO due / On Track,Near Due,Overdue,Completed; Renew=7 Cancel=5; addDays Date.setDate (ไม่ยกเว้นเสาร์อาทิตย์); daysLeft=ceil((due−now)/86400000); <0 Overdue; <=1 Near Due; อื่น On Track
- Edge: completedAt truthy มาก่อน invalid date; invalid start→On Track; `METRIX-BUG`: สาย 1–23 ชั่วโมง ceil=-0 ยัง Near Due; cancellation rejected ใช้ completedAt จาก rejectedAt/update; locale th-TH พ.ศ.; sourceไม่ระบุ timezone ต้อง test Bangkok
- ตัวอย่าง: เหลือ2วัน→On Track; deadlineผ่าน1ชั่วโมง→Near Due; ผ่าน24ชั่วโมง→Overdue; completedAt='x'→Completed

## RULE-015 — Signoff/task lifecycle

- ที่มา: permission/page.tsx:200–369; pdf-preview/page.tsx:134–144,365–409; `useRequestStore.ts:594–655`; `useSignatureTaskStore.ts:94–163`; migration 20260809
- Input/output: admin assigned active Sr.Manager→pending signature task due now+3วัน; close open tasks ก่อน assign; NT form regeneration/reset→pending คง assigned แต่ล้าง signature; signed payload+timestamp→signed และ complete matching open task; re-read pending→acknowledged
- Edge: source handler signPermission1ไม่ตรวจ assigned เอง; preview buttonตรวจ assigned/currentUser/SrManager/NT/not signed แต่ handler ตรวจแค่ current/not signed; SQL readonly/uploadขัดกัน DQ01; uniqueness open request/user/kind
- ตัวอย่าง: assigned SrManager+NT/not signed→button enabled; unassigned SrManager→disabled; already signed→disabled/reset→pending

## RULE-016 — Signature assets

- ที่มา: `useSignatureStore.ts:38–117`; pdf-preview/page.tsx:303–364
- Input/output: localStorage assets แยก owner; defaultก่อนupdatedAt desc; save first assetหรือsetAsDefault→defaultและunsetเดิม; default switchเฉพาะ owner; label.trim()||Signature; placement clamp ±180, scale .45–1.6, nudge6; ไม่ใช่ cryptographic signature
- Edge: remove default fallback index==0 ของ arrayทุกowner อาจไม่ตั้ง default ถ้า index0 เป็นอีก owner (`METRIX-BUG`); data URL browser persistenceต้องมี privacy/retention decision
- ตัวอย่าง: owner ไม่มีasset/save→default; second saveไม่set default→defaultเดิม; scale1.7→1.6

## RULE-017 — NT PDF field mapping/summary

- ที่มา: `components/pdf/ntFormFiller.ts:60–108,186–230,438–536`; DuctRentalPDF.tsx; pdfUtils.tsx
- Input/output: design→named fields (คำขอ/ถนน/coords/จังหวัด/cable/fiber/diameter/distance/contacts); จำนวนเส้น='1'คงที่; install contacts fallback design; วันที่ปล่อยว่าง; Latin-named coordinates ใช้ทั้ง coordinate text ไม่แยก lat/lng; NT form rasterizesทุกpageและลงชื่อ/วันที่บนpage4; summaryแยก react-pdf
- Round: distance summary Number.toFixed(2); sign date DD / MM / Gregorian year; Sarabun local; asset placement/renderต้อง visual QA
- ตัวอย่าง: cableCount5→PDFจำนวนเส้น1; installContactName='' design='A'→'A'; ไม่มีdesign→{}; DQ03ห้ามแก้เงียบ

## RULE-018 — Upload/storage/preview

- ที่มา: `lib/supabase/storage.ts:11–68`; `useRequestStore.ts:657–724`; PdfUploadZone.tsx:167–209
- Input/output: request/phase/file→storage path requests/id/phase/timestamp-sanitizedName; whitespace→'-', ตัดนอก ASCII letters/digits/._-; upsert=false; request_files metadata; memo uploadล้างmissing_docs; signed URLอายุ3600s; preview popupconfirmก่อนselect file
- Edge: ชื่อภาษาไทยอาจเหลือแต่extension; timestampไม่ใช่versionlock; no server MIME/size gateในstore; targetใช้private file authorization/attachment signature checksตามmaster
- ตัวอย่าง: 'a b.pdf'→'a-b.pdf'; 'แบบ.pdf'→'.pdf'; 'memo' upload→missing_docs null

## RULE-019 — Refresh/local notifications

- ที่มา: `useRequestStore.ts:273–359,766–789`; `AuthProvider.tsx`; signature store/task inbox
- Input/output: full initial fetch + realtime request/file delta + reconcile15s; offlineสถานะ offline; channel error→error; disposeล้างinterval/listeners/channel; localnotifications uuid/timestamp/read flags; signature notificationspersistentแยก
- Edge: loadAll requests/filesไม่มีpagination และ loop files.filterต่อrow; renew/cancel loadersกลืนบางerror; targetต้อง scoped pagination/refreshรักษาdraft ไม่คัดunboundedfetch
- ตัวอย่าง: offline→offline; SUBSCRIBED→connected; request DELETE→remove from local map

## RULE-020 — List filters/counters/workflow status

- ที่มา: duct-rental/page.tsx:78–126,174–229
- Input/output: normalizedSearch trim/lower includes id/project/route/owner/province/center; phase/type/center/docs/workflow exact; undefined requestType→NEW; cancelledAt→CANCELLED มาก่อน COMPLETE→ACTIVE มาก่อน phase status uppercase defaultPENDING; countsจากfiltered requestsแต่waiting/missing queuesจากrequestList; process rows sort startDate descending
- Edge: no sort/pagination controlในlist; whitespace missingDocsต่าง RULE004; urgent linksเลือกแถวแรก; clearfiltersคืน ALL/search=''
- ตัวอย่าง: cancelled COMPLETE→CANCELLED; COMPLETE normal→ACTIVE; DESIGN statusmissing→PENDING

กฎ auth/profile/admin ของระบบต้นทางอยู่ใน 08 โดยต้อง REPLACE กับ Core ไม่พอร์ต simpleHash/sessionStorage roles/API service-role; MOD2 communication-cable เป็นโมดูลคนละตัว/static demo ไม่รวมใน Duct Rental; legacy HTML ยังไม่ได้ audit logic ไม่ถือเป็น dead codeที่ลบได้
