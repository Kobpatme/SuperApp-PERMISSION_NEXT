# ความเสี่ยงและคำถาม

| ID | หลักฐาน/ข้อขัดแย้ง | การดำเนินการก่อนตอบ |
|---|---|---|
| DQ01 | `pdf-preview/page.tsx:134–144` ให้ assigned Sr.Manager เซ็น แต่ 20260707 RLS readonly และ request_files insert role deny | เจ้าของยืนยัน: ใช้สิทธิ์ลงนามแยกเฉพาะงานที่ได้รับมอบหมาย ผูกกับผู้รับ/เวอร์ชันเอกสาร ส่วนอื่นคงอ่านอย่างเดียว |
| DQ02 | `useRenewalStore.ts:64,230` float sum เทียบ numeric(14,2) ของ SQL และ master decimal-only | เจ้าของยืนยัน: ใช้ decimal ตามความละเอียดฐานข้อมูล 2 ตำแหน่ง; numeric ของ PostgreSQL ปัดครึ่งออกจากศูนย์ จึงใช้ Decimal ROUND_HALF_UP |
| DQ03 | `ntFormFiller.ts:83` จำนวนเส้นคงที่ 1 แต่ schema รับ cableCount | เจ้าของยืนยัน: ใช้จำนวนสายที่กรอกในคำขอ; ไม่กรอกใช้ fallback 1 ตามต้นทาง |
| DQ04 | list missingDocs truthy แต่ completion helper trim; SLA ceil ถือ lateness <24h เป็น Near Due | golden ต้องเก็บทั้งสอง behavior; ไม่เปลี่ยนกฎโดยไม่มี decision |
| DQ05 | UI phase transition แคบกว่า store submitPhase/SQL role from-to sets; store ไม่มี optimistic version | พอร์ต UI graph เป็น canonical ตาม master server workflow: DESIGN ส่งตรงได้; ขั้นถัดไปต้องรับงาน; non-NT ข้ามตามต้นทาง; ไม่มี backward/admin correction ที่ source UI ให้ใช้ |
| DQ06 | User/role/center visibility เดิมแมปกับ teams/scope อย่างไร | ให้แอดมินจัด role ผ่าน UI; ไม่มี auto grant/import ผู้ใช้จริง |
| DQ07 | ย้ายข้อมูลเก่าทั้งหมดหรือเฉพาะ active? ระบบเดิมใช้คู่ขนานหรือไม่? | เจ้าของยืนยัน: ยังไม่ย้ายข้อมูลจริง ให้เตรียมเครื่องมือและ fixture; ไม่มี real export/import/sync |
| DQ08 | PDF template/font license, signature retention/asset persistence และความหมายลงนาม | ไม่ส่ง template/ลายเซ็นไป production; ตรวจ render/license/version binding ก่อน M6 |
| DQ09 | static module lifecycle เดิมยังไม่มี admin DB toggle | เจ้าของอนุญาตเพิ่มเปิด/ปิดใน Core โดยคงดีไซน์เดิม; ใช้ Core capability ALL, version/audit และ DB flag ตรวจทุกคำขอ; โมดูลยัง development/default-disabled ระหว่างพัฒนา |

Security architecture adaptations ที่ master กำหนดชัดแล้ว: shared identity/server RBAC+scope, private authorized files, no hard delete, audit/activity/outbox transaction, concurrency/idempotency ไม่คัด source service_role/browser writes/SQL errors/client flags มาใช้

DQ01/02/03/07/09 ได้รับคำตอบโดยตรงจากเจ้าของแล้ว ไม่ต้องขออนุมัติซ้ำ

Security adaptation เพิ่มเติม: การสร้าง annual renewal ที่ unique ทั่วระบบต่อปีต้องมี module.view/renewal.create/rate.read แบบ ALL เพื่อไม่สร้าง snapshot ที่ขาดเส้นทางจาก scope filter; actor และ team ของแต่ละคำขอยังบังคับ RLS ตามปกติ การ fallback ลายเซ็นเริ่มต้นจำกัดเฉพาะเจ้าของเดียวกัน แก้ cross-owner bug ในต้นทางตามข้อกำหนด private assets

ขอบเขตlocalที่ยืนยันแล้ว: native browser8flows/24PostgreSQLservices, PDFrender/Sourceoffline reference/Core13pairs/axe13views/1000-rowpaging ดูcurrent QA guide ไม่ถือhumanUATหรือproductionloadว่าผ่าน

ยังไม่ยืนยัน: deployed Source drift/production inventory/real data quality/real users and scopes/template printing and retention approval/human UAT/production load/concurrent 100 users Source legacy HTML เก็บเป็น reference ไม่ใช้ใน Next runtime เจ้าของยืนยันไม่ย้ายข้อมูลจริง; offline tools/fixtures ส่งมอบตาม [10](10-offline-import.md)
