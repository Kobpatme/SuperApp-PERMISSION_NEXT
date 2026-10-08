# รายงาน OSP และงานส่ง Google Sheets

เจ้าของเลือกวิธี A ตาม §7.3: หน้ารายงาน/ดาวน์โหลด พร้อมส่งเข้า Google Sheets เดิม งานเฟส 4 ทดสอบเฉพาะฐาน loopback และ Google API จำลอง ยังไม่ได้สร้างบัญชีบริการ ตั้ง hosting หรือเขียนชีตจริง

## ใช้งานรายงาน

ผู้มี `car_booking.module.admin` เปิดระบบจองรถ → รายงาน OSP หรือแดชบอร์ด เลือกเดือน/ทุกเดือน รายการแบ่งหน้า 50 แถว ดาวน์โหลด CSV ครบทั้งช่วงที่เลือก ไม่จำกัดแค่หน้าปัจจุบัน CSV มี BOM สำหรับภาษาไทย และป้องกันการตีความข้อความเป็นสูตร

กรองตามวันเริ่มใน Asia/Bangkok วันที่แสดง พ.ศ. OSP มี 19 คอลัมน์ตาม spec ยอดระยะทาง/น้ำมันของแดชบอร์ดนับเฉพาะคืนแล้ว รวมเติมระหว่างทางและตอนคืน ส่วนจำนวนการจองรวมรายการกำลังใช้/ล่วงหน้าและไม่รวมยกเลิก เลขไมล์เริ่ม 0 คำนวณได้ ใช้ PostgreSQL numeric/Decimal ไม่ใช้ floating-point คำนวณเงิน

ข้อมูล `logs_json` มี GPS เมื่อผู้ใช้แนบไว้ ต้องจำกัดผู้ดูรายงาน/ไฟล์/ชีตให้ผู้ได้รับอนุญาต CSV/หน้า native ให้ SAP เริ่มต้น `ไม่มี SAP`; SAP ที่แก้ในชีตเดิมถูกเก็บไว้เฉพาะตอน merge ส่งชีต ไม่ดึงการแก้ในชีตมาเป็นข้อมูลในฐาน native

## การตั้งค่าที่เจ้าของต้องทำก่อนเปิดใช้จริง

ตาม §7.3 เจ้าของสร้าง Google Cloud service account, เปิด Sheets API และแชร์เฉพาะ spreadsheet เดิมให้บัญชีบริการแก้ไขได้ เจ้าหน้าที่ที่อ่านชีตใช้ Viewer เก็บ private key และ bearer secret ใน secret store ของ hosting เท่านั้น ไม่ส่ง credential ผ่าน chat หรือ commit ลง repo ไม่ใช้ domain-wide delegation

| Environment | ความหมาย |
|---|---|
| `CAR_BOOKING_OSP_SYNC_ENABLED` | `true` เมื่อผ่านการตั้งค่าและทดสอบจริงแล้ว; ค่าอื่นปิดการส่งและเก็บคิวไว้ |
| `CAR_BOOKING_OSP_SPREADSHEET_ID` | ID spreadsheet เดิมที่แชร์แล้ว |
| `CAR_BOOKING_OSP_SHEET_TITLE` | ชื่อ tab เดิม ค่าเริ่มต้น `BookingsOSP` |
| `CAR_BOOKING_GOOGLE_CLIENT_EMAIL` | อีเมล service account |
| `CAR_BOOKING_GOOGLE_PRIVATE_KEY` | RSA PEM; รองรับ newline หรือ `\\n` จาก secret store |
| `CAR_BOOKING_OSP_WORKER_SECRET` | ค่าสุ่มที่ปลอดภัยยาวอย่างน้อย 32 ตัวอักษร แยกจาก session/password |
| `CAR_BOOKING_OSP_WORKER_USER_ID` | UUID ของ Core principal ที่ active, ไม่บังคับเปลี่ยนรหัส และได้รับ car admin แล้ว |

runtime ต้องเป็น non-owner/non-superuser/NOBYPASSRLS ตาม [คู่มือฐานข้อมูล](car-booking-database.md) เพิ่ม SELECT/INSERT/UPDATE บน `car_booking_osp_jobs` และ SELECT/UPDATE บน `car_booking_osp_state` ให้ role runtime ที่เจ้าของอนุมัติ ไม่ให้ DELETE หรือ membership ของ worker/helper roles ไม่มีการให้สิทธิ์พนักงานจริงอัตโนมัติ

ผู้ดูแล hosting ตั้ง scheduler เรียก `POST /api/internal/car-booking/osp` ด้วย `Authorization: Bearer` ของ secret โดยไม่ใส่ secret ใน URL คำขอไม่ต้องมี user session; เฉพาะ path นี้ใช้ bearer guard แทน proxy session จากนั้นตรวจสิทธิ์ principal ใน DB ใหม่ body ไม่สามารถเลือก principal ได้ scheduler/proxy ต้องรองรับเวลาอย่างน้อยตาม timeout งานและไม่ส่ง token ลง access log รอบเวลา/hosting ยังต้องยืนยันก่อน deployment ไม่มีการตั้ง scheduler จริงในเฟสนี้

## คิว การลองใหม่ และ rebuild

เมื่อสถานะเป็น completed trigger เพิ่มงานใน transaction เดียวกับคืนรถ/ประวัติ ความล้มเหลวภายนอกจึงไม่ย้อนการคืนรถ แอดมินเห็นรอส่ง/กำลังส่ง/ส่งแล้ว/ไม่สำเร็จ และกดลองส่งรายการที่ล้มเหลว หรือเปิด “สร้างรายงานทั้งชีตใหม่” → อ่านคำอธิบาย → ยืนยันเพื่อเข้าคิว การกดปุ่มไม่เรียก Google ในคำขอผู้ใช้

worker ล็อก lease เดียว 15 นาที เลือกงานถึงกำหนดไม่เกิน 100 งานต่อรอบ รวมเป็น snapshot ของรายการคืนแล้วทั้งหมด เรียง start_time/id และ upsert โดย `_booking_id` (`legacy_id` ถ้ามี ไม่เช่นนั้น UUID) ทุกรอบรวม completed ใหม่ล่าสุด งานที่เหลือจะถูกทำในรอบต่อไป ข้อมูล native เป็นแหล่งจริง

ก่อนเขียน อ่านค่าทั้ง tab ตรวจ 19 headers, เก็บ SAP เดิมและแถว manual/legacy ที่ยังไม่อยู่ในฐาน native รวมแถว ID ซ้ำ แล้วใช้ batch เดียว: duplicate tab เป็น backup ตาม job UUID → ขยาย grid ถ้าจำเป็น → เขียน A:S/ล้างท้ายแถวซ้ำ ไม่ลบ tab และเก็บ formatting เดิม การ retry job เดิมใช้ backup ชื่อเดิม ผล merge ซ้ำคงเดิม

ค่าที่ส่งเป็น literal strings รวมตัวเลขเพื่อคงทศนิยมตรงกับ native; ไม่ส่ง `formulaValue` เจ้าหน้าที่ที่ใช้สูตร/การรวมตัวเลขโดยอ้างชีตต้องตรวจความเข้ากันได้ในการทดสอบจริงก่อนตัดสลับ ชีตสำรองอยู่ใน spreadsheet เดิมและต้องกำหนดนโยบายเก็บสำรองโดยเจ้าของ ไม่มีการลบ backup อัตโนมัติ

หากพบ header ไม่ตรง (`HEADER_MISMATCH`), คอลัมน์เพิ่มเติมที่มีค่า (`EXTRA_COLUMNS`), SAP ขัดแย้ง (`SAP_CONFLICT`), สูตรในแถว manual/SAP (`FORMULA_REVIEW`), หรือ cell เกิน 50,000 ตัวอักษร (`CELL_TOO_LARGE`) จะหยุดก่อนเขียน ไม่ตัดข้อมูลหรือเลือกค่าทิ้งเงียบ ๆ ให้ผู้รับผิดชอบตรวจ/สำรองก่อนปรับชีตและลองใหม่ ห้ามแก้ข้อมูลพร้อมกับรอบ rebuild

Network timeout ต่อคำขอ 45 วินาที; failure เก็บเฉพาะรหัสปลอดภัย ไม่เก็บ response/secret อัตราลองใหม่เริ่ม 60 วินาที เพิ่มแบบ exponential สูงสุดประมาณ 17 ชั่วโมง; admin retry ทำให้ถึงกำหนดทันที หาก worker หยุดระหว่างส่งหรือ Google สำเร็จแต่บันทึก DB ไม่สำเร็จ งาน running จะถูกเรียกใหม่หลัง lease หมดและ merge แบบ idempotent Audit/activity/outbox เก็บการขอ rebuild/retry และผลส่งใน transaction เดียวกับสถานะ

## ทดสอบจริงและถอยกลับ

ก่อนเปิดจริง เจ้าของทดสอบกับชีตสำเนาที่อนุมัติ: สิทธิ์ SA/principal, headers/SAP/manual rows, backup, ส่งซ้ำ, คิว retry และผลรายเดือนเทียบต้นทาง ตรวจ numeric-text compatibility และข้อจำกัดขนาด spreadsheet ด้วย ไม่ถือว่าการทดสอบ API จำลองยืนยันการเชื่อมต่อจริงแล้ว

ถ้าต้องหยุดส่ง ตั้ง sync enabled เป็น false และหยุด scheduler คิวและประวัติยังอยู่ ใช้ native CSV ได้ ถ้าต้องคืนเนื้อหาชีต ใช้ backup ที่ตรวจแล้วโดยเจ้าของ ห้าม drop ตาราง/ประวัติหรือแก้ฐานจริงเพื่อ rollback ก่อน deploy สามารถ revert code commits โดยคง schema/data ไว้

อ้างอิง protocol: [OAuth service account](https://developers.google.com/identity/protocols/oauth2/service-account), [Sheets batch update](https://developers.google.com/workspace/sheets/api/guides/batchupdate), [duplicateSheet/updateCells requests](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/request#UpdateCellsRequest)
