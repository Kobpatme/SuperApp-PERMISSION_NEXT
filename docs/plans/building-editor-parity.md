# คืนฟอร์มเพิ่มและแก้ไขอาคาร — 2026-10-03

Baseline HEAD: 7233bf4. รัน `ux-gate.ps1 -Phase building-crud-baseline`: lint/typecheck/unit/documents/build/contrast/audit exit0. Source checkout สะอาดและ GitHub main ตรง approved `afaee997afecf0f42e059b7100fa90ed0d188784`.

หลักฐาน source: Permission_Next.html:669–715; app.js:3440–3495 (เปิด/เติมฟอร์ม), 3538–3660 (บันทึก), 3400–3437 (duplicate), 2649–2665 (installation overrides), 2847–2920 (BOQ). Target เดิม: building-create-form มีชื่อ/รหัส/ทีม/ตำแหน่ง; drawer ลิงก์ “แก้ไข” ไปหน้าอ่าน; API item มี DELETE ไม่มี PATCH.

ขอบเขต: คืนฟิลด์ข้อมูลทั่วไป/สถานะ/การติดตั้ง/ผู้ติดต่อ/หมายเหตุ, ค่าใช้จ่าย8รายการ, installation overrides5รายการ และค่าใช้จ่ายเพิ่มเติม fixed/revenue share. ฟอร์มร่วม create/edit; เปิดแก้จาก drawer/หน้ารายละเอียด. รักษาค่าและ metadata ที่ไม่ได้แก้. ใช้ building version ตรวจการแก้พร้อมกัน และเพิ่ม condition version กับค่าธรรมเนียมใน transaction เดียวกับ audit/activity/outbox. ไม่เปลี่ยนสูตร ใบเสนอราคา permission matrix หรือ schema. รหัสอาคารเพิ่มได้อัตโนมัติเมื่อเว้นว่างตามต้นทางที่ไม่ได้บังคับรหัส.

ทดสอบ: domain golden cases/decimal/invalid fields; isolated PostgreSQL browser เพิ่ม→แก้→reload→ค้นหา; scope/forced-password/duplicate/stale-version; audit และ rollback; Light/Dark/mobile/axe. ไม่เขียนข้อมูลจริงหรือ external systems.

JEV: health network_ok; route shared_versioned_editor confidence.97. Risk runtime hard gate triggered by summary wording; jev_called=false ไม่มีคะแนน จึงไม่ใช้เป็นการอนุมัติ ใช้ขอบเขตแก้ไข local ที่ผู้ใช้สั่ง พร้อม deterministic tests. ผล inventory evidence/prioritize และ continue จะบันทึกในรายงาน.

Rollback: revert source commits; ไม่มี migration ใหม่. ประวัติ conditions เดิมไม่ถูก overwrite และข้อมูลที่สร้างโดยการทดสอบอยู่ฐาน permission_next_ux_test เท่านั้น.
