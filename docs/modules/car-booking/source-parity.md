# Source parity — ระบบจองรถ

วันที่ 08/10/2569; เฟส6เพิ่ม intake pause/preflight/cutover plan และผ่าน automated journey/browser8+recovery; เจ้าของเลื่อน CSVจริงไปย้ายครั้งเดียวภายหลัง ยังไม่ยืนยัน human UAT/real migration/Sheets/cutover

หลังเจ้าของอนุญาตติดตั้ง local UAT: ฐานหลักในเครื่องติดตั้ง0024–0027และ car poolจำกัดสิทธิ์แล้ว readyForUat=true; main rollback material journey และ browser/APIผ่าน ผู้ดูแลเดิม1บัญชีได้รับ car use/admin ไม่มี CSV/legacy cutover/Google writes/human sign-off ดู [รายงานเปิด UAT](../../plans/car-booking-local-uat.md)

Source ที่ผู้ใช้ระบุ: `D:/WebApp/จองรถ/New Vertion/Code.gs` SHA256 `B22674C71B0905C8A9623880D0D02F28F3DB473FE9F9489E73A3C8CDBB618156`; `Index.html` SHA256 `A705578D72F9D33CD3A31162A65260957B451993710A5FF610854D6BADF6FECA` ไม่มี Git SHA ที่ยืนยันได้

| ฟีเจอร์/หลักฐานต้นทาง | การจัดประเภท | สถานะ target | หลักฐานที่จะต้องมี |
|---|---|---|---|
| bookCar/checkCarConflict/checkEmployeeConflict, Index handleBookCar | ADAPT | partial — service/API/native UI ผ่าน local tests; รอ UAT | ว่าง/ซ้อน/ขอบพอดี/cancelled/คืนเร็ว/person conflict/batch self-conflict/concurrent winner เดียวบน DB |
| returnCar/checkPreviousBookingNotReturned/updateCarMileageAndFloor | ADAPT | partial — service/API/native UI ผ่าน local tests; รอ UAT | owner/admin; order; เวลา/ไมล์/fuel validation; row locks; double-return; audit rollback |
| cancelBooking/cancelBookingByAdmin | ADAPT | partial — service/API/native UI ผ่าน local tests; รอ UAT | booked เท่านั้น, ownership, cancelled ไม่ล็อกช่วงและไม่อยู่ OSP |
| addBookingLog/getBookingLogs/getBookingGpsLogsForAdmin | ADAPT | partial — service/API/UI/map ผ่าน local tests; external map tiles และ UAT ยังไม่ยืนยัน | fuel/ไมล์/status validation; GPS optional; admin-only map; cross-user denial |
| Index initCalendar/getEffectiveBookingEnd/renderCalendarLegend | ADAPT | partial — projection/API/month-week-day UI/legend ผ่าน local tests; รอ UAT | date-range query; labels/legend; visibility CB-03; actual return display |
| getInitialData/ข้อมูลรถ/ผู้ใช้ล่าสุด/ที่จอด | PORT | partial — vehicle state/API/UI/default floor/versioned config ผ่าน local tests; รอ UAT | เริ่มแล้ว/ยังไม่คืน/ไม่เคยใช้; return default floor |
| addCar/updateCar/deleteCar และ Index admin | REPLACE | partial — admin service/API/UI/deactivation ผ่าน local tests; รอ UAT | server-admin guard; archive ตาม CB-05; preserve historical references |
| buildOSPSummaryRow (1686), mapBookingLogRow_ | ADAPT | partial — native formatter/service ผ่าน unit/SQL; รอ real-user UAT | 19 columns/order; 10+30=40 liters/400+1200=1600; none/return-only/multi-log; Buddhist/Bangkok; zero-mile decision CB-12 |
| rebuildAllBookingsOSP (2230)/previewRebuildBookingsOSP | ADAPT | partial — เลือก A; queue/retry/lease/backup/SAP/manual/dedup ผ่าน mock+SQL; real Sheets ยังไม่ยืนยัน | deterministic rebuild; backup/SAP/manual-row preservation; duplicates/rejected report; เจ้าของตั้ง secrets ก่อนทดสอบจริง |
| buildDashboardResponseFromOSP (2039)/downloadBookingsByMonth (2153) | REPLACE | partial — native aggregate/filter/stats/top5/CSV เพิ่มแล้ว; browser verification ในรายงานเฟส 4 | aggregate เดียวกับ OSP รวม trip fuel; filters/stats/top5; ดาวน์โหลดใช้ได้จริง |
| login/logout/Employees admin/name fallback | REPLACE | partial — Core session/UI ใช้จริงใน browser; legacy employee mapping รอ import | ใช้ Core identity/user_id; employee_code normalized crosswalk; no duplicate identity/login |
| Apps Script authContext/admin flags/Sheet access | REPLACE | partial — SQL/runtime roles และ live grants/browser/API ผ่าน local tests; production provisioning ยังไม่ทำ | server RBAC+scope+least privilege RLS ทั้งสามตาราง; direct API deny; live grant/revoke without re-login |
| CSV import 5 sheets (ข้อกำหนดใหม่) | PORT | partial — importer/parser14 + PostgreSQL10 ผ่าน รวม reviewed target สำหรับวันย้าย; CSVจริงเจ้าของเลื่อน | dry-run/idempotency/counts/monthly totals/mapping/orphans/rejections ผ่าน synthetic; ตรวจ real crosswalk/สิทธิ์/ยอดก่อนเปิดใช้งานจริง |
| UAT/cutover/rollback (ข้อกำหนดใหม่) | ADAPT | partial — automated browser8/preflight6/recoveryผ่าน และ checklist พร้อม | human UAT/one-time final export/import/runtime/Sheets connection/legacy freeze/real cutover ตาม [เฟส6](../../plans/car-booking-phase-6.md) |

เฟส 1 เพิ่มฐาน/schema/exclusion/RLS/calendar projection/OSP numeric aggregation และผ่าน SQL integration 10 กรณีบน PostgreSQL 16.15 แล้ว ([รายงาน](../../plans/car-booking-phase-1.md)); เฟส 2 เพิ่ม service/API booking/return/cancel/log/cars/calendar/GPS พร้อม integration 10 กรณี ([รายงาน](../../plans/car-booking-phase-2.md)) เฟส 3 เพิ่ม native UI, versioned parking config และ Core access editor พร้อม SQL 22/browser 5 กรณี ([รายงาน](../../plans/car-booking-phase-3.md)); สถานะ partial ยืนยัน local UI/service/API ส่วน missing ยังเป็นช่องว่างจริง import/real Sheets/UAT ยังไม่ครบ ไม่ถือว่า foundation/service ทำให้ source parity complete เจ้าของยืนยัน calendar privacy, late-return cap, zero mileage และ parking config แล้ว เฟส 4 เพิ่มรายงาน/แดชบอร์ด/CSV และ Sheets adapter พร้อม SAP preservation ที่ผ่าน local mock/SQL/browser 7 กรณีแล้ว ([รายงาน](../../plans/car-booking-phase-4.md)); real Sheets/import/UAT ยังไม่ยืนยัน

ไม่มี RETIRE ฟีเจอร์ธุรกิจจากการที่ target ยังไม่มี implementation การแทน identity/hard-delete/bug aggregation เป็นข้อกำหนดเอกสารงาน ไม่ใช่ข้ออ้างลด workflow

เจ้าของยืนยัน late-return cap, zero mileage, calendar privacy และเลือก A สำหรับ Sheets/SAP preservation แล้ว; import/hosting/UAT ยังต้องยืนยัน; แผนและคำถามอยู่ [เฟส 0](../../plans/car-booking-phase-0.md)

JEV evidence_check เฟส 3 supported=.81/needs_more_evidence=.79 (advisory) ไม่มีการอ้าง source parity complete จนผ่าน §11 บน DB ทดสอบและ UAT
