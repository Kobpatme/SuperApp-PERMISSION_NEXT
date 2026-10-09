# ADR-001 — โมดูล native พร้อม source freeze

วันที่ 10/10/2569 สถานะ: เลือกสำหรับ implementation ที่ไม่มี business conflict; release ยังไม่อนุมัติ

เลือก A: native Next.js TypeScript module `src/modules/duct-rental/{domain,schemas,server,ui,tests}` ตาม source Next/React/TS ไม่มี backend ภาษาอื่นที่จำเป็นต้องเก็บไว้ Source Supabase stores เป็น persistence adapters ไม่ใช่เหตุผลคง backend เดิม

Core เดิมเป็นเจ้าของ session/RBAC/data scope/audit/notification; routes ใต้ `/duct-rental`, capabilities prefix `duct_rental.*.*`, tables `duct_*` เมื่อข้อมูลและ policy พร้อม ไม่เพิ่ม Zustand/Supabase/Tailwind/theme/iframe หรือ auth ซ้ำ การปรับ CSS ใช้ CSS modules หรือ module-only selectors ใช้ token เดิม

Trade-off: พอร์ต handlers/transaction/PDF ให้ครบใช้เวลามากกว่าคัด stores แต่ตรวจ deny paths/concurrency และ source golden ได้ การเลือก A ไม่เป็นการอนุมัติเปลี่ยน source business behavior; DQ01–05 ต้องมี decision/evidence ก่อนเปิดใช้ส่วนที่ขัดกัน ไม่มี deploy/production migration

Module registry integration และ permission catalog เป็น shared edits ที่แผนอนุญาต UI shared/fonts/tokens/global CSS/layout ไม่แก้ Module อยู่ development/default-disabled จน workflow/security/UAT ผ่าน ไม่เพิ่มโมดูลที่ใช้งานไม่ได้ใน navigation
