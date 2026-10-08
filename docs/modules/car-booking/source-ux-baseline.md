# UX baseline — ระบบจองรถ OSP

หลักฐาน: `D:/WebApp/จองรถ/New Vertion/Index.html` ที่ผู้ใช้ระบุ (hash ใน source-parity.md); discovery วันที่ 08/10/2569 ไม่ใช่หลักฐาน UAT target

| บริบท | พฤติกรรมต้นทางที่ต้องรักษา/ปรับ |
|---|---|
| จุดเข้า | Login รหัสพนักงานของระบบเดิม → workspace; target เข้าจาก Core Shell/session เดียว ไม่มี login โมดูล |
| จอง | วันเวลาเริ่ม/กลับ → รถว่างพร้อมที่จอด → ปลายทาง → จอง → feedback/refresh; server ต้องตรวจทุกฟิลด์ซ้ำ |
| คืน | เลือกรายการเริ่มแล้วและยัง booked → เวลาคืน/ชั้นจอด/เลขไมล์ → fuel details ถ้าเติม → คืน; ที่จอดเริ่มจากรถหรือ 2A |
| รายการของฉัน | open booking → ยกเลิก หรือ dialog บันทึกระหว่างทาง; success อยู่ใน workspace ไม่ทิ้ง context |
| Trip log | เลือกจอดพัก/เติมน้ำมัน → วันเวลา/สถานที่/ไมล์/fuel/note → ขอ GPS แล้วบันทึก; GPS high accuracy, timeout 8s, maximumAge 2m; ไม่มี GPS ยังบันทึกได้ |
| ปฏิทิน | FullCalendar เดือน/สัปดาห์/วัน, prev/next/today; สีตามรถและ legend; click แสดงทะเบียน/คน/เวลา/ปลายทาง; target query เฉพาะช่วงและรอ privacy decision |
| สถานะ | จองล่วงหน้า/กำลังใช้งาน/คืนแล้ว/ยกเลิก พร้อมข้อความ ไม่ใช้สีอย่างเดียว |
| Admin | รถ/การจอง/พนักงาน/dashboard; target ใช้ admin กลางสำหรับพนักงานและ module grants; โมดูลรักษา car/booking/report/GPS workflows |
| Dashboard | เดือน+ปี พ.ศ./ทั้งหมด → counts/distance/fuel/car stats/top5/table/CSV; target แก้ยอด fuel รวม log ตาม OSP |
| Feedback | required/error messages Thai, dialogs และสถานะ loading/success; target ไม่แสดง SQL/stack/Apps Script errors ดิบ |
| Mobile/keyboard | บันทึกระหว่างทางจากโทรศัพท์เป็นงานหลัก; ใช้ native focus trap/Esc/คืน focus, touch targets, reduced motion, no root overflow; ไม่มี WCAG evidence ของต้นทางที่รันได้ |

วันที่ target ต้อง dd/mm/พ.ศ. เวลา HH:mm Asia/Bangkok ทุกทาง; ใช้ enterprise blue/tokens/ADR-0004 ของ Core Shell แทนคัดลอก CDN/CSS/authorization ของ source

อย่าเอาหน้าจอง/คืน/log ไปซ่อนใน generic CRUD queue; คง click path งานแต่ละชนิดและ progressive disclosure รายละเอียด fuel/GPS

## Target verification เฟส 4

เจ้าของเลือก A รายงาน/ดาวน์โหลด + Sheets เดิม รายงานและแดชบอร์ดอยู่ในเมนูแอดมิน กรองเดือน/ทุกเดือนและแบ่งหน้า 50 แถว CSV ดาวน์โหลดครบช่วง รายงานแสดง 19 คอลัมน์ในพื้นที่เลื่อนแนวนอนที่ focus/ArrowRight ได้; ข้อมูล GPS ใน logs_json เป็นรายงาน admin เท่านั้น

Dashboard counts/ระยะทาง/น้ำมัน/รายคัน/top5 ใช้ aggregate รวม trip+return fuel และมีสถานะคิวส่ง/ลองใหม่/ยืนยัน rebuild งานล่าสุดซ่อนใน details เพื่อลดความหนาแน่น ตัวกรอง report แยกจากปฏิทินและไม่แสดงเดือนซ้ำ Screenshot/scoped axe/CSV จริง/keyboard/mobile Light-Dark ผ่าน browser 7 กรณี (รายงาน (historical local reference)); ไม่ถือว่า UAT/Google connectivity จริงผ่านแล้ว
