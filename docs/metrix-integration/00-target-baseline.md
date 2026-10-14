# Target baseline ก่อนเพิ่ม METRIX

Baseline frozen commit `5f32a111ebeeb3fea8918db7e702d95bc7302bdf` ตรวจ 10/10/2569 บน SuperApp PERMISSION_NEXT Source frozen `f87220bf94b765e4896388632c3dbeabb5286510` อ้างรายละเอียด [01](01-overview-and-stack.md) และ [08](08-source-file-index.md)

ตอนเริ่มงาน Core ใช้ Next 16.3.8/React 19/PostgreSQL, opaque session/single active session/live RBAC และ audit/activity/outbox การตั้ง enabled ของ module อยู่ในโค้ด ยังไม่มี Core Admin toggle ฐาน local หลักมี migration ledger 28 รายการ

Baseline gate ที่บันทึกเมื่อเริ่ม: lint/typecheck/build ผ่าน, unit 267 ผ่าน/41 opt-in ข้าม, document mapping 1 ผ่าน ตัวเลขนี้เป็นประวัติเท่านั้น ดู [99](99-final-report.md) สำหรับผลล่าสุด

QA before/after ใช้ git archive ของ baseline นี้เป็น project แยกใน ignored `.data/duct-rental-browser/baseline` กับ node_modules เดิม ไม่มี .env ถูกคัดเข้า fixture project เปรียบเทียบ login/home/work/buildings แบบ desktop/mobile Light/Dark รวม 13 คู่ Mask เฉพาะเวลา live refresh ของ Work ที่เปลี่ยนตามเวลาจริง ไม่มีการแก้ Source หรือ baseline commit เพื่อให้ภาพตรง
