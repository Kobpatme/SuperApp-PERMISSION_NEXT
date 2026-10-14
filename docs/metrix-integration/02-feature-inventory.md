# บัญชีฟีเจอร์

> ปรับสถานะ 14/10/2569: F01–F19 มี native implementation/server guards และหลักฐาน local ตาม [parity matrix](07-parity-matrix.md) F19 เป็น archive เพื่อเก็บประวัติ; F20 ใช้ Core; F21–F22 อยู่นอก Duct Rental ยังไม่พอร์ต ข้างล่างเป็นข้อเท็จจริงจาก Source ไม่ใช่คำกล่าวว่า UAT/production ผ่าน


สถานะ “มีโค้ด” แปลว่าพบ reachable Next/store handler ไม่ใช่การยืนยัน deployment/ข้อมูลจริง ทุก path อ้างจาก source SHA ใน 01 รายการ controls รายละเอียดอยู่ 09

| ID | ฟีเจอร์ | ผู้ใช้ | ไฟล์ต้นทาง | อ่าน/เขียน | สถานะต้นทาง |
|---|---|---|---|---|---|
| F01 | คิวรายการ/ค้นหา/กรอง phase, request type, center, documents, workflow; pipeline/urgent/SLA | ตาม phase; viewer/management ทุกงาน | duct-rental/page.tsx; DuctRentalWorkspace.tsx | requests/renewals/cancellations | มีโค้ด |
| F02 | สร้าง draft/ส่ง Design/แก้ฟอร์ม/diameter lookup/ติดต่อ/ไฟล์ | Design/admin; owner edit | new, [id]/edit, design; ductRentalSchema; useRequestStore; create-draft API | requests/request_files | มีโค้ด |
| F03 | รับงาน; Drawing; non-NT ข้ามไปแจ้งอัตรา | Draftsman/admin | [id]/draftsman; accept-phase API | requests/files | มีโค้ด |
| F04 | NT Form สร้าง/preview/save; มอบหมาย signer/revoke/response docs | Permission/admin/Sr.Manager | [id]/permission; pdf-preview; ntFormFiller; signature stores | requests/files/notifications/local signature assets | มีโค้ด แต่สิทธิ์ SQL ขัดกัน |
| F05 | Actual install/ML/วันที่/notes/แนบไฟล์ | Install/admin | [id]/install; InstallDetailSchema | install_data/files | มีโค้ด |
| F06 | As-built CAD/PDF/KMZ/auto-save notes | Draftsman/admin | [id]/draftsman2 | as_built_data/files | มีโค้ด |
| F07 | ยื่นเอกสาร NT รอบ 2 | Permission/admin | [id]/permission2 | phase_statuses/current_phase | มีโค้ด |
| F08 | Rate notice/invoice/signed form; monthly/yearly/manual dates; draft/autosave | 3rdparty/admin | [id]/3rdparty; useRequestStore | rate_notice_data/files | มีโค้ด ไม่มีสูตร monthly×12 |
| F09 | Payment request | Permission/admin | [id]/permission3 | files/current_phase | มีโค้ด |
| F10 | สัญญา/guarantee amount/payment/vendor/receipt; COMPLETE gate | 3rdparty/admin | [id]/contract; useRequestStore | guarantee_data/files | มีโค้ด |
| F11 | หมายเหตุเอกสารขาด | phase actor | [id]/missing-docs; MissingDocsPanel | missing_docs | มีโค้ด; whitespace gate ต่างกัน |
| F12 | ต่อสัญญาปีถัดไป/active-route snapshots/keep/drop/notes/รวมเฉพาะ keep | Design/admin | renewal/page, renewal/[year]; useRenewalStore | annual_renewals/routes | มีโค้ด; float |
| F13 | ส่ง 3rdparty→Memo→confirm provider→contract file | Design/Permission/3rdparty/admin | renewal/[year]; useRenewalStore | annual_renewals | มีโค้ด; approveRenewal handler เก่าไม่ถูกเรียก UI |
| F14 | ขอยกเลิก active route/เหตุผล/effective date; progress/tracking/completed/reject | Design create; Permission advance; admin reject | cancellation/new, [id]; useCancellationStore/cancelRoute | cancellations + requests | มีโค้ด; 2 writes ไม่ atomic |
| F15 | PDF สรุป/NT template/ลายเซ็นหน้า 4/resize/nudge/default assets/download | scoped reader/signer | components/pdf/*; pdf-preview; PdfUploadZone/ViewButton/StorageDownloadButton | bytes/files/signature assets | มีโค้ด; ต้อง render parity |
| F16 | Modal รายละเอียด/รับงาน/ไฟล์/phase tabs | scoped reader/phase actor | RequestDetailModal, PhaseTabs, ProcessFlow, ContactCard | requests/files | มีโค้ด |
| F17 | Signature task inbox/read/complete/cancel/due 3 วัน/Realtime | assigned signer/admin | tasks/page; NotificationCenter; useSignatureTaskStore | notifications | มีโค้ด |
| F18 | Request notifications local/refresh offline status | scoped reader | useRequestStore; StatusBar; AuthProvider | browser + Supabase subscriptions | มีโค้ด ต้องแทน Core notifications/refresh |
| F19 | ลบ request/renewal/cancellation ถาวร | admin | stores + confirm dialogs | physical delete | ต้อง ADAPT เป็น archive ตาม master ไม่ลบจริง |
| F20 | Auth/profile/admin/reset/idle/logout/theme/layout | Core roles | app/api/admin/auth/profile; providers/layout/user/auth stores | profiles/auth | REPLACE ด้วย Core เดิม ไม่สร้าง identity ซ้ำ |
| F21 | Communication-cable MOD2 | ผู้ใช้โมดูลอื่น | communication-cable/page | local mock state | แยกโมดูล ไม่ใช่ Duct Rental; ยังไม่พอร์ต |
| F22 | Documents/licenses/support | ผู้ใช้ทั่วไป | pages ชื่อเดียวกัน | static placeholders | ไม่อ้างเป็น document management ที่ทำแล้ว |

ไม่พบ Excel/CSV import/export, map runtime, bulk mutation, saved views, global keyboard shortcuts ภายใน Duct Rental จาก index/handlers; PDF export มีจริง ห้ามสร้าง invoice/tax/prorata engine จากชื่อฟีเจอร์ ไม่มีหลักฐานสูตรภาษีหรือการคำนวณวันเช่า
