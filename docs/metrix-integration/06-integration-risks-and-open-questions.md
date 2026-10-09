# ความเสี่ยงและคำถาม

| ID | หลักฐาน/ข้อขัดแย้ง | การดำเนินการก่อนตอบ |
|---|---|---|
| DQ01 | `pdf-preview/page.tsx:134–144` ให้ assigned Sr.Manager เซ็น แต่ 20260707 RLS readonly และ request_files insert role deny | รอ owner ตัดสิน capability ลงนามเฉพาะ assigned task; ไม่พอร์ต auth/RLS ที่ขัดกัน |
| DQ02 | `useRenewalStore.ts:64,230` float sum เทียบ numeric(14,2) ของ SQL และ master decimal-only | รอ owner ยืนยัน monetary result/rounding; ไม่พอร์ต float ลงบริการ target |
| DQ03 | `ntFormFiller.ts:83` จำนวนเส้นคงที่ 1 แต่ schema รับ cableCount | เก็บ behavior ใน catalog ไม่แก้ PDF เงียบ ๆ; owner ตัดสินก่อน PDF acceptance |
| DQ04 | list missingDocs truthy แต่ completion helper trim; SLA ceil ถือ lateness <24h เป็น Near Due | golden ต้องเก็บทั้งสอง behavior; ไม่เปลี่ยนกฎโดยไม่มี decision |
| DQ05 | UI phase transition แคบกว่า store submitPhase/SQL role from-to sets; store ไม่มี optimistic version | ก่อน M4 ระบุว่า UI workflow เป็น canonical transition หรือรองรับ backward/admin correction ใด; server ต้อง guard + version/audit |
| DQ06 | User/role/center visibility เดิมแมปกับ teams/scope อย่างไร | ให้แอดมินจัด role ผ่าน UI; ไม่มี auto grant/import ผู้ใช้จริง |
| DQ07 | ย้ายข้อมูลเก่าทั้งหมดหรือเฉพาะ active? ระบบเดิมใช้คู่ขนานหรือไม่? | ไม่มี real export/import/sync; M7 รอ dataset/crosswalk/cutover policy |
| DQ08 | PDF template/font license, signature retention/asset persistence และความหมายลงนาม | ไม่ส่ง template/ลายเซ็นไป production; ตรวจ render/license/version binding ก่อน M6 |
| DQ09 | static module lifecycle เดิมยังไม่มี admin DB toggle | โครงโมดูล default-disabled; การเพิ่ม module toggle ส่วนกลางต้องได้รับ scope ชัดเจนก่อนแก้ shared; role grant/revoke มี UI เดิม |

Security architecture adaptations ที่ master กำหนดชัดแล้ว: shared identity/server RBAC+scope, private authorized files, no hard delete, audit/activity/outbox transaction, concurrency/idempotency ไม่คัด source service_role/browser writes/SQL errors/client flags มาใช้

คำถามที่ส่งเจ้าของระหว่างทำงาน: DQ01 และ DQ02 ยังรอคำตอบ ข้อนี้หยุดเฉพาะการเลือกกฎลงนาม/เงิน ไม่หยุด discovery/nonfinancial domain/module catalog

ขอบเขตยังไม่ได้ยืนยัน: production inventory/data volumes, source deployed configuration/schema drift, browser ทุก flow, binary PDF/font render, source legacy HTML ไม่ใช้ใน Next runtime; ไม่มีการอ้าง source parity complete
