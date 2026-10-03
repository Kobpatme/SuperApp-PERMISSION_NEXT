# การตั้งค่า UX และการเข้าสู่ระบบ

Q1: ช่องทางช่วยเหลือยังไม่ได้เลือก จึงใช้ “ติดต่อผู้ดูแลระบบ” เป็นค่าแสดงผลทั่วไป ตั้งรายละเอียดเพิ่มเติมผ่าน `SUPPORT_CONTACT_TEXT` (ไม่เกิน240ตัวอักษร); ไม่กำหนดโทรศัพท์ อีเมล หรือ LINE แทนเจ้าของ.

Q2: คง `TRUSTED_PROXY_COUNT=0` จนเจ้าของยืนยันเส้นทาง reverse proxy จริง. ค่านี้ทำให้ไม่เชื่อ header IP จาก client; rate limit ตามอีเมล5ครั้ง/15นาที และ account lockout ยังทำงาน. IP limit20ครั้ง/15นาทีจะใช้เมื่อกำหนดจำนวน proxy ที่เชื่อถือได้อย่างถูกต้องเท่านั้น. ห้ามเพิ่มค่าโดยเดาและต้องทดสอบ chain/IP spoofing หลังเปลี่ยน topology. Production Node instance เรียก instrumentation.register ตอนบูตและบันทึก `auth.trusted_proxy_not_configured` เมื่อค่าเป็น0 โดยไม่บันทึก URL ฐานข้อมูลหรือ secret. คำเตือนอยู่ใน server log ไม่แสดงในหน้าเข้าสู่ระบบ.

Q3: ใช้ PN mark ปัจจุบัน; `AuthBrand`/`AuthShell` รับ `imageSrc` สำหรับรูปโลโก้ที่ได้รับอนุมัติในอนาคต. กำหนดwidth/height40ไว้แล้วเพื่อไม่ให้layoutขยับ.

Q4: น้ำเงินเดิมตาม ADR-0004; semantic tokens รองรับLight/Darkและcontrast AA. ไม่ใช้จานสีเขียวจากMaster7.1.

`getCurrentUser` ใช้ React request cache ไม่เก็บidentityข้ามrequest. ตรวจactive profile, strict absolute expiry และ strict idle expiryก่อนคืนuserทุกrequest. lastSeenAtเขียนเมื่อเก่ากว่า60วินาที โดย UPDATE มีเงื่อนไขexpiry/idleและintervalอีกครั้ง. เมื่อเลิกใช้งานค่าidleอาจถึงกำหนดเร็วขึ้นไม่เกิน60วินาทีเทียบกับเวลาของrequestล่าสุดที่ยังไม่ต้องเขียน; ไม่ขยายabsolute expiryและไม่ฟื้นsessionที่หมดเวลา. ค่าidle30นาที/absolute12ชั่วโมงและmustChangePasswordเดิมคงไว้. ไม่มีkeep-aliveendpointใหม่; การเตือนidleก่อนหมดเวลาเป็นbacklogที่ต้องประเมินauthsurfaceแยก.

Proxy overwrites `x-pn-request-path` จากURLภายในของrequestก่อนส่งupstream; clientส่งheaderเองแทนค่าไม่ได้. Layoutใช้safeNextPathก่อนredirect`/login?next=...&reason=expired`; APIยังคืน401/403ตามเดิม. Static icon/manifest/robotsเป็นpublic metadataเท่านั้น.

## การตรวจซ้ำในเครื่อง

ใช้Node22และPostgreSQLloopback. ตั้ง`UX_TEST_DATABASE_URL`เป็นฐานlocalสำหรับเชื่อมต่อ (ไม่พิมพ์credentialในlog). Helperบังคับฐานเป้าหมาย`permission_next_ux_test`และปฏิเสธhostที่ไม่ใช่loopback. `npm run test:ux:seed`สร้างฐานแยกและใช้migrationsเดิม; ไม่มีmigrationใหม่ในงานนี้. Seedมีsynthetic users/long Thai recordsเท่านั้น. CP5ใช้roleux_staffที่มีเฉพาะread4permissions; roleviewerเดิมที่เคยใช้ในCP2/3มีreadadminด้วย จึงเปลี่ยนเฉพาะfixtureเพื่อให้ตรวจผู้ใช้ทั่วไปเข้มขึ้น ไม่แก้permissionmatrixจริง.

รัน`npm ci`, lint/typecheck/check:css/check:contrast/test/test:documents/build และ`npm audit --omit=dev`. Windowsให้เปิด`node scripts/ux-test-db.mjs server`แล้วตั้ง`UX_EXTERNAL_SERVER=1`ก่อน`npm run test:e2e`เพื่อเลี่ยงmanagedserverteardownค้าง; Linux CIใช้managedserverพร้อมPostgreSQL16service. Playwrightartifactเก็บ14วัน. Browser security tests resetเฉพาะfixture IDs101–103และsynthetic rate keys; ไม่ใช้บัญชีจริง.

ไม่ deploy หรือแตะproduction DBในงานนี้. UATกับผู้ใช้จริงและการเชื่อมต่อNAS/Microsoft365ยังไม่ได้ยืนยัน.
