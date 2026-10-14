# หน้าจอ native ที่ส่งมอบ

Source controls 403 attributes จาก 24 ไฟล์อยู่ [09](09-ui-control-evidence.md) เส้นทาง target อยู่ใต้ `/duct-rental` ใช้ Core tokens/session/navigation และ CSS เฉพาะโมดูล

| Target | Source | การทำงาน |
|---|---|---|
| /duct-rental | duct-rental/page, DuctRentalWorkspace | คิว pipeline, filters/search, 50 แถวต่อหน้า, detail modal, accept, missing/urgent และ SLA รวม Renew/Cancel |
| /new, /[id]/edit, /[id]/design | new/edit/design | partial draft/full submit, cable→fiber→diameter, contacts/coordinator, files, summary/NT preview |
| /[id]/draftsman | draftsman | accept/drawing/save/submit; NT ไป Permission 1, non-NT ไปแจ้งอัตรา |
| /[id]/permission | permission | accept/permission number, preview→confirm NT, signer config ก่อน NT, private signed original/revoke, response upload gates |
| /[id]/install | install | actual coordinates/distance/ML/pipes/date/supervisor/notes และ confirmation ของ INSTALL โดยเฉพาะ |
| /[id]/draftsman2 | draftsman2 | CAD/PDF/KMZ, draft/notes autosave และ required PDF gate |
| /[id]/permission2, /permission3 | permission2/3 | accept/read prior data/files/ส่งต่อขั้นถัดไป |
| /[id]/3rdparty | 3rdparty | independent monthly/yearly fees, dates, notices/invoice, partial save/submit |
| /[id]/contract | contract | five guarantee fields, contract/receipt/Memo, missing documents และ COMPLETE gate |
| /[id]/missing-docs | MissingDocsPanel/page | อ่าน/บันทึก marker ตามสิทธิ์, แนบ Memo clears marker |
| /renewal, /renewal/[id] | renewal list/[year] | year snapshot, keep/drop/review notes, exact total, stages, private final PDF; optional number/notes |
| /cancellation/new, /cancellation/[id] | cancellation new/detail | active route, snapshot, date/reason/notes, stages/reject/archive; atomic completion |
| /tasks | tasks/NotificationCenter/pdf-preview | own assigned current original, asset draw/upload/default/archive, position/scale/rotation/name/date controls, page-4 preview→confirm |
| /tracking | processTracking/list SLA | Source owner/reference/status/count/SLA, search/page, Renew 7 days / Cancel 5 days |
| /settings | install_service_centers/profile configuration | reviewed center→Core team coordinator mapping; admin scope |
| module-local PDF modal | pdf-preview | paging/zoom/rotation/download/print, Blob private fetch, local PDFJS worker/fonts |

Refresh: singleton SSE ต่อ tab รับเฉพาะ empty change hint หลัง commit, reconnect ตรวจ Core session ทุกครั้ง/จบรอบ 30 วินาที; visible polling 15 วินาทีเป็น fallback ขณะมีร่างไม่ทับ fields/files และแสดงว่าข้อมูลเปลี่ยน มี online/offline/live status และ manual refresh

Modal ใช้ Escape/focus trap/คืน focus; controls มี labels และ visible focus สถานะมีข้อความ ไม่พึ่งสีอย่างเดียว ทดสอบ keyboard, 320/390/640/1440 px และ Light/Dark แล้ว 640 px เป็นการทดสอบ reflow เทียบ viewport ที่ 200% ไม่ใช่การยืนยัน actual browser zoom ทุกหน้า

Source delete แปลงเป็น archive เพื่อรักษาประวัติตาม master Source auth/profile/admin/theme แทนด้วย Core จึงไม่สร้าง sidebar/theme/login ซ้ำ ฟังก์ชันและลำดับ Source เป็นหลัก แต่ข้อความยืนยัน/error ทำเป็นไทยและ UI ใช้ operational workspace เดิม
