# PLAN: Super App รวมระบบ (Multi-Mod Platform)

## 1. เป้าหมายหลัก

- รวมระบบที่มีอยู่แล้วหลายตัว โดยเริ่มจากระบบเก็บงาน, ข้อมูลอาคาร/ประเมินราคา และขอคืนเงินประกันอาคาร ก่อนขยายไปถึง 6-7 mod
- ใช้บัญชีผู้ใช้และฐานข้อมูลร่วมกันทุก mod
- **แต่ละ mod ต้องให้ประสบการณ์การใช้งานใกล้เคียงของเดิมมากที่สุด** — ผู้ใช้เดิมสลับมาใช้แล้วรู้สึกคุ้นเคย ไม่ต้องเรียนรู้ใหม่ทั้งหมด
- ประสบการณ์รวม: สวย / เร็ว / ปลอดภัย

## 2. หลักการออกแบบเพื่อคงประสบการณ์เดิมของแต่ละ mod

นี่คือส่วนสำคัญที่สุดของแผนนี้ เพราะเป้าหมายคือ "รวมที่เก็บข้อมูล" ไม่ใช่ "บังคับทุก mod ให้หน้าตาเหมือนกันหมด"

| หลักการ | รายละเอียด |
|---|---|
| แยก Shell กับ Mod ออกจากกัน | Shell (เมนู, header, การแจ้งเตือน) เป็นกลาง ส่วนเนื้อหาภายในแต่ละ mod คงเลย์เอาต์/ฟีเจอร์/ศัพท์เฉพาะเดิมไว้ |
| Audit ระบบเดิมก่อนย้าย | ก่อนเริ่มแต่ละ mod ต้องบันทึก: หน้าจอหลักมีอะไรบ้าง, ลำดับขั้นตอนการทำงาน (workflow), ศัพท์/ป้ายชื่อที่ผู้ใช้คุ้นเคย, ฟีเจอร์ที่ใช้บ่อยที่สุด |
| Theming ต่อ mod ได้ | ใช้ token กลาง (สี ตัวอักษร ระยะห่าง) เป็นฐาน แต่อนุญาตให้แต่ละ mod ปรับสีเน้น (accent) หรือไอคอนเฉพาะตัวได้ ถ้าเป็นเอกลักษณ์ของระบบเดิม |
| ห้ามเปลี่ยน workflow โดยไม่จำเป็น | ลำดับการกรอกฟอร์ม, ปุ่ม, ขั้นตอนอนุมัติ ฯลฯ ให้คงเดิม เว้นแต่ของเดิมมีปัญหาการใช้งานจริง (แก้เฉพาะจุดที่จำเป็น ไม่ redesign ทั้งยวง) |
| Data mapping ไม่ใช่ redesign | ย้ายโครงสร้างข้อมูลเดิมเข้า schema ใหม่แบบ 1:1 ให้มากที่สุด เพื่อลดความเสี่ยงข้อมูลผิดเพี้ยนและพฤติกรรมเปลี่ยน |
| ทดสอบกับผู้ใช้เดิม | ให้ผู้ใช้จริงของแต่ละระบบเดิมทดลองใช้ mod ใหม่ เทียบกับของเดิม ก่อนตัดสินใจ cutover |

## 3. สถาปัตยกรรมระบบ

### 3.1 โครงสร้างรวม
```
Super App
├── Core Shell (Auth, เมนูกลาง, แจ้งเตือน, ค้นหา)
├── Mod 1: ระบบเก็บงาน (MAXIWA KPI)
├── Mod 2: ค่าใช้จ่ายอาคาร (Permission Next)
├── Mod 3: ขอคืนเงินประกันอาคาร (Building Guarantee Refund)
├── Mod: การเงิน/บัญชี
├── Mod: CRM/ลูกค้า
├── Mod: รายงาน/แดชบอร์ด
└── Mod: (เพิ่มเติมตามระบบเดิมที่เหลือ)
```

#### Module Registry

| Mod | ระบบ | Source repository | Route เป้าหมาย |
|---|---|---|---|
| 1 | ระบบเก็บงาน (MAXIWA KPI) | `D:\WebApp\SLA_Preformance\MAXIWA KPI` (local source of truth), `https://github.com/Kobpatme/maxiwa_KPI.git` (repository reference) | `/work` |
| 2 | ค่าใช้จ่ายอาคาร (Permission Next) | `https://github.com/Kobpatme/Permission_Next.git` | `/buildings` |
| 3 | ขอคืนเงินประกันอาคาร | `D:\WebApp\ระบบขอคืนเงินประกัน_V2` (local source of truth), `https://github.com/Kobpatme/maxiwa.git` (repository reference) | `/guarantees` |

เลข Mod ในตารางนี้เป็นเลขอ้างอิงกลางของโครงการ และต้องใช้ตรงกันในเอกสาร, เมนู, route mapping, migration และ test plan

### 3.2 Technology baseline (ข้อสรุป)
- **Frontend / Application Backend**: Next.js App Router + TypeScript strict; ใช้ Server Components เป็นค่าเริ่มต้น, Server Actions สำหรับ mutation และ Route Handlers สำหรับ integration, webhook และ download endpoint
- **Backend Infrastructure**: Supabase
- **Database**: Supabase PostgreSQL ตัวเดียว แยก schema/domain ต่อ mod และมีตาราง Core Platform ร่วม
- **Database Access**: Drizzle ORM ฝั่ง server เท่านั้น; Supabase SDK ใช้เฉพาะ Auth และ Storage ห้ามใช้เป็น data-access layer ของ business domain
- **Authentication**: Supabase Auth ผ่าน Core Shell เพียงจุดเดียว ทุก mod ใช้ session กลางและไม่มีหน้า Login แยก
- **Authorization**: ตรวจ Server-side RBAC ทุก operation และใช้ PostgreSQL Row Level Security เป็นชั้นป้องกันข้อมูลเพิ่มเติม
- **File Storage**: Supabase Storage แบบ Private bucket; ตรวจสิทธิ์ฝั่ง server ก่อนสร้าง Signed URL อายุสั้น
- **Deployment**: Vercel + Supabase
- **Production**: Supabase Pro พร้อม external backup สำหรับฐานข้อมูลและไฟล์
- รายละเอียดการตัดสินใจและข้อห้ามอยู่ใน `ARCHITECTURE-BASELINE.md`

### 3.3 ความปลอดภัย
- Encrypt ข้อมูลอ่อนไหว (เลขกรมธรรม์ เลขบัญชี ฯลฯ)
- Audit log ทุกการแก้ไขข้อมูล
- Supabase session กลาง หมดอายุและ refresh ตามนโยบายของ Core Shell
- ตรวจ session และ RBAC ซ้ำใน Server Action/Route Handler ทุกจุด ห้ามเชื่อ role ที่ส่งจาก browser
- RLS ต้องเปิดในทุกตารางที่มีข้อมูลผู้ใช้ ทีม หรือข้อมูลข้าม mod และมี automated policy tests
- Drizzle connection สำหรับ request ปกติต้องไม่ใช้ database role ที่ bypass RLS; แยก elevated connection สำหรับ migration/background job เท่านั้น
- Storage เป็น Private bucket และออก Signed URL หลังตรวจสิทธิ์เท่านั้น
- แยกสิทธิ์การเข้าถึงข้อมูลข้าม mod (คนละแผนกไม่เห็นข้อมูลกัน ถ้าจำเป็น)

### 3.4 ความเร็ว
- Code splitting ต่อ mod (โหลดเฉพาะ mod ที่เปิดใช้งาน)
- Cache ข้อมูลที่เรียกบ่อย (เช่นสรุปสถานะหน้าแรก)
- Realtime/polling เฉพาะจุดที่จำเป็น (เช่นสถานะเคลมประกัน)

## 4. ขั้นตอนการทำงาน (Phased Rollout)

### Phase 0: เตรียมฐานราก (1-2 สัปดาห์)
- [ ] วาง Core Shell: Auth, เมนูกลาง, layout พื้นฐาน
- [ ] วาง Database กลาง + ตารางร่วม (users, notifications, files, activity_log)
- [ ] วาง Design token กลาง (สี, ฟอนต์, spacing) แบบยืดหยุ่นให้ mod ปรับได้

### Phase 1: Mod 1 — ระบบเก็บงาน / MAXIWA KPI (2-3 สัปดาห์)
- [ ] Audit ระบบเดิม: หน้าจอ, workflow, ฟีเจอร์หลัก
- [ ] ออกแบบ data schema ย้ายจากของเดิม
- [ ] พัฒนา UI ให้ใกล้เคียงของเดิม + เชื่อมกับ Core Shell
- [ ] ทดสอบกับผู้ใช้เดิม เทียบพฤติกรรมการใช้งาน

### Phase 2: Mod 2 — ค่าใช้จ่ายอาคาร / Permission Next (2-3 สัปดาห์)
- [ ] Audit Map, filter, building drawer, quotation workflow และ Firestore data เดิม
- [ ] ออกแบบ Drizzle schema และแผนย้ายข้อมูลเข้า Supabase PostgreSQL
- [ ] ย้าย Map UI ให้ใกล้เคียงต้นฉบับและใช้ Supabase Auth session จาก Core Shell
- [ ] ย้ายไฟล์เข้า Private Storage และออก Signed URL ฝั่ง server
- [ ] ทดสอบ role, RLS, workflow และผลการคำนวณเทียบระบบเดิม

### Phase 3: Mod 3 — ขอคืนเงินประกันอาคาร (2-3 สัปดาห์)
- [ ] Audit ระบบเดิม (ขั้นตอนเคลม, สถานะ, เอกสารที่เกี่ยวข้อง)
- [ ] ออกแบบ data schema + เชื่อม notification กลาง (แจ้งเตือนเมื่อสถานะเปลี่ยน)
- [ ] พัฒนา UI ตามของเดิม
- [ ] ทดสอบกับผู้ใช้เดิม

### Phase 4: Mod ที่เหลือ (ทำทีละตัว ตามลำดับความสำคัญ)
- [ ] Mod 4 ...
- [ ] Mod 5 ...
- [ ] Mod 6-7 ...
(ทำซ้ำกระบวนการ audit → schema → UI → ทดสอบ ทีละ mod)

### Phase 5: รวมระบบเต็มรูปแบบ
- [ ] แดชบอร์ดรวมข้ามทุก mod (สรุปสถานะ, แจ้งเตือนรวม)
- [ ] ตัด (cutover) ระบบเดิมทีละตัวเมื่อ mod ใหม่เสถียรและผู้ใช้ยอมรับแล้ว
- [ ] เก็บ log/monitor หลังตัดระบบเดิม เผื่อต้อง rollback

## 5. เกณฑ์ความสำเร็จของแต่ละ mod ก่อน cutover

- ผู้ใช้เดิมทำงานหลักได้ครบ ไม่ต้องถามวิธีใช้ใหม่
- เวลาในการทำงาน (เช่น สร้างงาน, ยื่นเคลม) ไม่ช้ากว่าระบบเดิม
- ข้อมูลย้ายมาครบถ้วน ไม่ตกหล่น
- ผ่านการทดสอบความปลอดภัยเบื้องต้น (สิทธิ์การเข้าถึง, encrypt ข้อมูลอ่อนไหว)

## 6. สิ่งที่ต้องตัดสินใจก่อนเริ่ม Phase 0

- [ ] ระบบเดิมแต่ละตัวเขียนด้วยอะไร (ภาษา/เฟรมเวิร์ก/ฐานข้อมูล) เพื่อวางแผนย้ายข้อมูล
- [ ] จำนวนผู้ใช้งานจริงโดยประมาณ
- [ ] มี requirement ด้าน compliance พิเศษหรือไม่ (เช่นข้อมูลประกัน/การเงินที่ต้องเก็บตามกฎหมาย)
- [ ] ใครคือผู้ใช้เดิมที่จะช่วยทดสอบเทียบ UX ในแต่ละ mod
