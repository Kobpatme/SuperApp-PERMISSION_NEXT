# Source parity — ระบบจองรถ

วันที่ 08/10/2569; สถานะ discovery เฟส 0; ยังไม่มี native implementation

Source ที่ผู้ใช้ระบุ: `D:/WebApp/จองรถ/New Vertion/Code.gs` SHA256 `B22674C71B0905C8A9623880D0D02F28F3DB473FE9F9489E73A3C8CDBB618156`; `Index.html` SHA256 `A705578D72F9D33CD3A31162A65260957B451993710A5FF610854D6BADF6FECA` ไม่มี Git SHA ที่ยืนยันได้

| ฟีเจอร์/หลักฐานต้นทาง | การจัดประเภท | สถานะ target | หลักฐานที่จะต้องมี |
|---|---|---|---|
| bookCar/checkCarConflict/checkEmployeeConflict, Index handleBookCar | ADAPT | missing | ว่าง/ซ้อน/ขอบพอดี/cancelled/คืนเร็ว/person conflict/batch self-conflict/concurrent winner เดียวบน DB |
| returnCar/checkPreviousBookingNotReturned/updateCarMileageAndFloor | ADAPT | missing | owner/admin; order; เวลา/ไมล์/fuel validation; row locks; double-return; audit rollback |
| cancelBooking/cancelBookingByAdmin | ADAPT | missing | booked เท่านั้น, ownership, cancelled ไม่ล็อกช่วงและไม่อยู่ OSP |
| addBookingLog/getBookingLogs/getBookingGpsLogsForAdmin | ADAPT | missing | fuel/ไมล์/status validation; GPS optional; admin-only map; cross-user denial |
| Index initCalendar/getEffectiveBookingEnd/renderCalendarLegend | ADAPT | missing | date-range query; labels/legend; visibility CB-03; actual return display |
| getInitialData/ข้อมูลรถ/ผู้ใช้ล่าสุด/ที่จอด | PORT | missing | เริ่มแล้ว/ยังไม่คืน/ไม่เคยใช้; return default floor |
| addCar/updateCar/deleteCar และ Index admin | REPLACE | missing | server-admin guard; archive ตาม CB-05; preserve historical references |
| buildOSPSummaryRow (1686), mapBookingLogRow_ | ADAPT | missing | 19 columns/order; 10+30=40 liters/400+1200=1600; none/return-only/multi-log; Buddhist/Bangkok; zero-mile decision CB-12 |
| rebuildAllBookingsOSP (2230)/previewRebuildBookingsOSP | ADAPT | missing | deterministic rebuild; backup/SAP/manual-row preservation ถ้าเลือก A; duplicates/rejected report |
| buildDashboardResponseFromOSP (2039)/downloadBookingsByMonth (2153) | REPLACE | missing | aggregate เดียวกับ OSP รวม trip fuel; filters/stats/top5; ดาวน์โหลดใช้ได้จริง |
| login/logout/Employees admin/name fallback | REPLACE | missing สำหรับ module | ใช้ Core identity/user_id; employee_code normalized crosswalk; no duplicate identity/login |
| Apps Script authContext/admin flags/Sheet access | REPLACE | missing | server RBAC+scope+least privilege RLS ทั้งสามตาราง; direct API deny; live grant/revoke without re-login |
| CSV import 5 sheets (ข้อกำหนดใหม่) | PORT | missing | CSV ยังไม่มี; dry-run, idempotency, counts/monthly totals/mapping/orphans/rejections |

เฟส 1 เพิ่มฐาน/schema/exclusion/RLS/calendar projection/OSP numeric aggregation และผ่าน SQL integration 10 กรณีบน PostgreSQL 16.15 แล้ว ([รายงาน](../../plans/car-booking-phase-1.md)); ช่อง missing ข้างต้นยังหมายถึง workflow/service/UI ที่ยังไม่มี ไม่ถือว่า SQL foundation ทำให้ source parity complete เจ้าของยืนยัน calendar privacy, late-return cap, zero mileage และ parking config แล้ว ส่วน Sheets/SAP/import/UAT ยังอยู่เฟสถัดไป

ไม่มี RETIRE ฟีเจอร์ธุรกิจจากการที่ target ยังไม่มี implementation การแทน identity/hard-delete/bug aggregation เป็นข้อกำหนดเอกสารงาน ไม่ใช่ข้ออ้างลด workflow

ข้อแตกต่างที่ต้องตัดสิน: late-return range กับ actual return source; zero start mileage ของ OSP; calendar privacy; Sheets/SAP preservation; แผนและคำถามอยู่ [เฟส 0](../../plans/car-booking-phase-0.md)

JEV evidence_check ให้ needs_more_evidence=0.88 ไม่มีการอ้าง source parity complete จนผ่าน §11 บน DB ทดสอบและ UAT
