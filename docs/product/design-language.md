# Design Language — Clean Light Minimal

Status: P0 spec (active for the redesign) · 2026-10-22
หลัก: เอกสารนี้เป็นสเปกของงานออกแบบใหม่ ใช้คู่กับ `docs/product/design-system.md` (สถาปัตยกรรม token)

## 1. หลักการ 5 ข้อ

1. **อ่านง่ายก่อนสวย** — ระยะห่างหายใจได้ ลำดับชั้นชัด ตัวเลขเด่น อ่านตารางยาวไม่ล้า
2. **เบาแต่คม** — ขอบ 1px เงา 2 ระดับ ไม่มีเส้นหนา/เส้นประ ใช้พื้นขาวเป็นหลัก
3. **สีจำกัด** — ขาว/เทาเป็นพื้น น้ำเงิน `#244fb8` เป็น accent เดียว สีสถานะมีความหมายคงที่
4. **ขยับเท่าที่สื่อ** — motion บอกการเปลี่ยนแปลงเท่านั้น ไม่มีอะไรวิ่งวนในหน้างาน
5. **เข้าถึงได้จริง** — contrast วัดจริง, focus เห็นชัด, ใช้คีย์บอร์ดได้ทั้งหมด

## 2. Type scale (ใช้ token เท่านั้น)

| Token | ค่า | ใช้กับ |
|---|---|---|
| `--text-micro` | 11px | label เล็ก, meta |
| `--text-caption` | 12px | คำอธิบายรอง, ชิป, หัวตาราง |
| `--text-body` | 13px | เนื้อหาทั่วไป |
| `--text-body-strong` | 14px | **nav item**, label ฟอร์ม, เนื้อหาเน้น |
| `--text-h3` | 16px | หัวข้อย่อยในการ์ด |
| `--text-h2` | 20px | หัวข้อส่วน |
| `--text-h1` | clamp(24px,2vw,30px) | หัวหน้าหลัก (หนึ่งเดียวต่อหน้า) |
| `--text-stat` | 24px | ตัวเลขสรุป KPI |

**กฎที่ปรับจากเดิม**
- nav item (sidebar) ใช้ `--text-body-strong` (14px) **ไม่ใช่** `--text-h3` (16px)
- ตัวเลขทั้งหมดใช้ `font-variant-numeric: tabular-nums`
- ภาษาไทย line-height ≥ 1.5 สำหรับเนื้อหา, ≥ 1.35 สำหรับหัวข้อ

## 3. Spacing

ใช้ `--space-1 … --space-10` (4/8/12/16/20/24/28/32/36/40px) เท่านั้น
**ห้ามฮาร์ดโค้ด px** ในงานใหม่ (ของเดิมที่เหลือให้ทยอยแก้ในเฟสที่แตะไฟล์นั้น)

- ระยะขอบการ์ด: 16–20px · ระยะห่างการ์ด: 12–16px
- ระยะห่างระหว่างส่วน (section): 20–24px

## 4. Radius

| ค่า | ใช้กับ |
|---|---|
| `--radius-xs` 3px | ชิปเล็ก, tooltip |
| `--radius-sm` 5px | input, ปุ่มเล็ก |
| `--radius-md` 8px | **ปุ่ม, nav item, การ์ดย่อย** |
| `--radius-lg` 12px | การ์ด/พาเนลหลัก |
| `--radius-xl` 16px | เฉพาะ container ใหญ่ (dialog) |
| `999px` | pill/badge |

**กฎที่ปรับ:** nav item ใช้ `--radius-md` (ไม่ใช่ xl) — ลดความมนเกินจำเป็น

## 5. Border & Elevation

- **ขอบมาตรฐาน 1px** `--color-border` — ห้าม `2px` และห้าม `dashed` ในงานใหม่
- ขอบที่ต้องมองเห็นเพื่อใช้งาน (input, checkbox, ปุ่มรอง) ใช้ `--color-border-strong`
- เงา: `--shadow-xs` (การ์ดนิ่ง) · `--shadow-sm` (hover) · `--shadow-md` (ลอย/dialog) · `--shadow-lg` (modal เด่น)
- hover ของการ์ดที่คลิกได้: ยกขึ้น 2px + `--shadow-sm` + ขอบเน้นน้ำเงิน 45%

## 6. Focus (บังคับ)

```
outline: 3px solid var(--color-focus-ring);
outline-offset: 2px;
```
ใช้กับ **ทุก** ตัวควบคุมที่โฟกัสได้ (ของเดิมมีบางที่ใช้ 4px — ปรับเป็น 3px ให้ตรงกันทั้งระบบ)

## 7. หลักฐาน contrast (วัดจริงด้วยสูตร WCAG — 2026-10-22)

**Light mode**

| คู่สี | อัตราส่วน | ผล |
|---|---|---|
| text `#182334` / bg `#f4f6f9` | 14.60 | ผ่าน AA |
| text / surface `#ffffff` | 15.80 | ผ่าน AA |
| muted `#536278` / surface | 6.20 | ผ่าน AA |
| muted / subtle `#eef2f7` | 5.52 | ผ่าน AA |
| brand `#244fb8` / surface | 7.28 | ผ่าน AA |
| ขาว / brand | 7.28 | ผ่าน AA |
| brand / brand-soft `#e9efff` | 6.33 | ผ่าน AA |
| success `#167143` / success-soft | 5.30 | ผ่าน AA |
| warning `#865100` / warning-soft | 5.93 | ผ่าน AA |
| danger `#b42332` / danger-soft | 5.65 | ผ่าน AA |
| info `#245db1` / info-soft | 5.60 | ผ่าน AA |
| **border `#d7dee8` / surface** | **1.35** | ใช้เป็นเส้นตกแต่งเท่านั้น |
| border-strong `#77879b` / surface | 3.67 | ผ่านเกณฑ์ UI (≥3.0) → **ใช้กับขอบตัวควบคุม** |

**Dark mode**

| คู่สี | อัตราส่วน | ผล |
|---|---|---|
| text `#eff3f9` / bg `#111925` | 15.85 | ผ่าน AA |
| text / surface `#1b2636` | 13.69 | ผ่าน AA |
| muted `#b9c6d8` / surface | 8.81 | ผ่าน AA |
| brand `#9bbcff` / surface | 8.01 | ผ่าน AA |
| on-brand `#12213c` / brand | 8.43 | ผ่าน AA |
| success / success-soft | 6.90 | ผ่าน AA |
| warning / warning-soft | 6.97 | ผ่าน AA |
| danger / danger-soft | 6.62 | ผ่าน AA |
| info / info-soft | 5.72 | ผ่าน AA |
| border `#3a4a61` / surface | 1.69 | เส้นตกแต่งเท่านั้น |
| border-strong `#8294ad` / surface | 4.93 | ผ่านเกณฑ์ UI |

**ข้อสรุป:** โทเคนสีปัจจุบันผ่าน WCAG AA สำหรับข้อความทั้งหมด — **ไม่ต้องเปลี่ยนค่าสีหลัก** งานคือจัด **การใช้** ให้สม่ำเสมอ

## 8. Component baseline

| คอมโพเนนต์ | สเปก |
|---|---|
| **Sidebar** | ขอบขวา 1px · nav item สูง 44–48px · radius-md · ตัวอักษร 14px น้ำหนัก 700 · active = พื้น brand-soft + ขอบ brand 45% + แถบซ้าย 3px |
| **Topbar** | สูง 60px · ชิดขอบแบบ sticky · ค้นหาเป็นพื้น subtle ขอบ 1px |
| **การ์ด/พาเนล** | ขอบ 1px · radius-lg · `--shadow-xs` · padding 16–20px |
| **ตาราง** | หัวตารางพื้น subtle ตัวอักษร caption ตัวพิมพ์ใหญ่ · แถวสูง ≥44px · hover พื้น subtle · เลื่อนในกรอบตัวเอง |
| **ปุ่ม** | หลัก = พื้น brand ตัวอักษรขาว · รอง = พื้นขาว ขอบ 1px · สูง 36–40px (มือถือ ≥44px) · active scale 0.98 |
| **ชิปสถานะ** | pill · พื้น soft + ตัวอักษรเข้มของสถานะนั้น · **มีข้อความกำกับเสมอ** |
| **ช่องกรอก** | สูง 40–44px · ขอบ border-strong · radius-sm · focus ring 3px |
| **PageHeader** | eyebrow น้ำหนัก 800 ตัวพิมพ์ใหญ่ · h1 หนึ่งเดียว · ขีดเน้นน้ำเงินใต้หัวข้อ 120px · action ชิดขวา |
| **การ์ดตัวเลข (metric)** | ตัวเลข `--text-stat` · tabular-nums · แถบสีบอกความหมายด้านซ้าย/บน 3px |

## 9. Motion inventory

**เก็บไว้ (มีประโยชน์):** page-enter (fade-up 8–12px) · card-stagger (60ms/ใบ สูงสุด 5 ใบ) · row-enter (3 แถวแรก) · modal-scale + backdrop-dim · toast in/out · popover-enter · skeleton-shimmer · marker-enter (แผนที่)

**ปรับ/ลด:** sidebar-slide (เฉพาะตอนเปิดมือถือ) · marker-breathe (เฉพาะ empty state, ไม่วนในหน้างาน) · ปุ่ม active scale 0.98–0.99 (ห้ามเด้ง)

**ห้าม:** animation วนไม่หยุดในหน้าที่ต้องอ่านนาน · หน่วงการคลิก/พิมพ์ · animate `width/height/top/left`

## 10. Checklist ก่อนส่งแต่ละเฟส

- [ ] typecheck / test / build ผ่าน
- [ ] contrast ข้อความใหม่ (ถ้ามี) วัดจริงแล้ว
- [ ] focus มองเห็นทุกตัวควบคุมที่แตะ
- [ ] `prefers-reduced-motion` ยังทำงาน
- [ ] Light + Dark ตรวจด้วยตา
- [ ] responsive 375 / 768 / 1024 / 1440 — ไม่มีสกอลล์แนวนอน
- [ ] ไม่มีสี/ระยะที่ฮาร์ดโค้ดในโค้ดใหม่
- [ ] ไอคอนเป็น SVG ไม่ใช้อีโมจิ
- [ ] สถานะมีข้อความกำกับเสมอ
