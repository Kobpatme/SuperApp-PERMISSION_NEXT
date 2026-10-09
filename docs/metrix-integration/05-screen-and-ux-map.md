# แผนหน้าจอและการเดินทาง

Source pathsอยู่ใต้ `app/(dashboard)/dashboard/duct-rental`; target planned `/duct-rental` ใช้ศัพท์ phaseเดิมและshared tokensเดิม รายการhandler/label/placeholder/disabled conditions403 attributesอยู่ [09](09-ui-control-evidence.md) ยังไม่ได้ยืนยันผ่าน browserต้นทาง

| หน้า/modal | Flow/controls/validation | หลังสำเร็จ/สถานะพิเศษ |
|---|---|---|
| list + DuctRentalWorkspace | landingคิว+pipeline+signature queue+Renew/Cancel tracking; new/renew/cancel; filters/search/reset; waiting/missing/urgent shortcuts; request edit/delete/open/detail/accept | empty/error/realtime status; filtersเฉพาะlist; detailเปิดmodal; openตามpreferred owned phase |
| new | 33 schemafields/contacts/service-center lookup/cable/fiber diameter; memo/duct PDF; draft/submit/progress filled% | create-draft→save/upload→Draftsman?created=1; draftไม่progress; fielderrors/saving/read-only |
| edit | same form/draft/upload/confirm submit | sameRQ/save; confirmdialog; owner/design edit; readonlymanagementblocked |
| design detail | readfields/contacts/PDFsummary/NTform/phase tabs | download/preview/saveNTform; request notfound fallback |
| draftsman | pending accept→accepted; drawing preview/upload/save/submit; nonNT route bypass | NT→permission; nonNT→3rdparty; createdbannerreturn/continue; missingdocs panel |
| permission1 | accept; permission number; generateNTpreview modal/save; admin assigns signer/revoke; signed docs/download; response files+submit | popup pdf-preview page4; awaiting/signed/re-sign; responseupload only signed; INSTALLเมื่อครบ |
| install | accept/actualcoords/distance/ML/pipe/date/supervisor/notes/files/saveonly/submit | zoderrors; draft save; Draftsman2เมื่อsubmit |
| draftsman2 | accept; CAD/PDF/KMZ dragdrop/preview; notesautosave; submit PDFrequired | Permission2; autosaved/errors |
| permission2 | accept/read previousfields/files/ส่ง NT | 3rdparty |
| 3rdparty rates | accept/fee/month+year independent/dates/notes autosave; rate notice/invoice/signed; saved draft reusable/submit | Permission3; money policy conflictDQ02 |
| permission3 | accept/read priorfiles/submit | contract |
| contract | accept/contract number/full amount/payment type/vendor/receipt/notesautosave; contract+receipt PDF; incomplete banner/disabledcomplete | list COMPLETE; no missing docs; stringsยังไม่decimalvalidated |
| missing-docs page/panel | textarea/save/clearnote/read-only bycurrentphase | save returns workflow; whitespace inconsistencyDQ04 |
| renewal list | yearcards/status/nextyear create/open/deleteconfirm; active routes snapshots | yearly unique; no active→empty; newestyearfirst |
| renewal year | expandable routecards/Keep/Drop/reviewnotes/statusfilter; submitreview; Memo; confirmprovider; number/contractnotes/PDF; deleteconfirm | phase labels and roleconditions; summary pending/keep/drop/cost; no unreviewed beforeUI submit |
| cancellation new | active route select/read snapshot/reason/effective date/notes/submit | cancellation detail; validation/error/no active routes |
| cancellation detail | fourstep progress/action notes/advance/reject/deleteconfirm/details | trackingcomplete→requestcancelled; separatewrite race noted; rejected readonly |
| pdf-preview | confirm/cancelgeneric PDF; signingstep chooseasset/upload/default/select/nudgex/y/scale/reset/name/date/preview/confirm | postMessage+storagecallback;signedsavefile+taskcomplete; closepopup; keyboardarrow buttons, no moduleglobalshortcuts found |
| RequestDetailModal | tabs/data/files sorted+filtered/download+accept | native popup; close/back; process phase link |
| tasks/inbox | assigned open work/read/clickdeep-link/due/status | acknowledged/completed/cancelled; core equivalent needed |

Responsiveต้นทางใช้flex/gridและmobilevariants แต่ยังไม่มีviewport evidence; targetต้อง desktop/tablet/mobileครบactions ใช้localCSS+Coretoken ห้ามคัดsourceTailwind/globalthemes การแสดงตารางoverflowต้องอยู่ในกรอบและมีalternatemobiledetail

ไม่มีevidenceของbulkaction/savedview/sortbutton/pagination/mapในDuct Rental จึงระบุ “ไม่พบ” ไม่เติมbusinessfeatureจากchecklist; 09เป็นฐานแตกbutton-by-buttonparity tests ยังต้องตรวจJSXข้อความเต็ม/empty/loading/error/accessด้วยbrowserและทดสอบThai長ชื่อ/200%zoomก่อนM8
