# BUILDING-EXPENSE-LONGDO-MAP-INTEGRATION.md

> Project: **SuperApp PERMISSION_NEXT**
> Module: **อาคารและค่าใช้จ่าย (Building & Expense)**
> Feature: **Longdo Map / Location Intelligence Integration**
> Target: Production-ready integration inspired by Longdo `Where am I?` UX, without embedding the demo page directly.

---

# 1. Objective

เพิ่มความสามารถด้านแผนที่และตำแหน่งให้โมดูล **อาคารและค่าใช้จ่าย** โดยใช้ **Longdo Map API 3** และบริการที่เกี่ยวข้อง เพื่อให้ข้อมูลอาคารไม่ได้เป็นเพียงรายการในตาราง แต่สามารถ:

- มองเห็นอาคารบนแผนที่
- ค้นหาอาคารจากแผนที่
- เลือก/แก้ไขตำแหน่งอาคาร
- ใช้ตำแหน่งปัจจุบันของผู้ใช้เมื่อผู้ใช้กดอนุญาต
- แปลงพิกัดเป็นข้อมูลที่อยู่
- วิเคราะห์ค่าใช้จ่ายตามพื้นที่
- แสดง Marker / Cluster / Expense Layer / Heatmap
- เปิดรายละเอียดอาคารจาก Marker
- เชื่อมข้อมูลอาคาร ค่าใช้จ่าย เงินประกัน งาน และ KPI ในอนาคต
- รองรับ Desktop / Tablet / Mobile
- คง UX/UI และ business logic เดิมของ SuperApp PERMISSION_NEXT

**ห้ามทำเป็นเพียงหน้าตัวอย่าง Map แยกออกจากระบบ**

Feature นี้ต้องกลายเป็นส่วนหนึ่งของ workflow จริงในโมดูลอาคารและค่าใช้จ่าย

---

# 2. Critical Rules for Codex

## 2.1 Inspect before editing

ก่อนแก้ไขโค้ดใด ๆ:

1. ตรวจสอบโครงสร้าง repository ทั้งหมด
2. ตรวจสอบ framework / runtime / package manager
3. ตรวจสอบ routing
4. ตรวจสอบ state management
5. ตรวจสอบ database / ORM / API layer
6. ตรวจสอบ auth และ RBAC
7. ตรวจสอบ design system / component library
8. ตรวจสอบโมดูลอาคารและค่าใช้จ่ายปัจจุบัน
9. ตรวจสอบ schema อาคารและค่าใช้จ่าย
10. ตรวจสอบ test framework
11. ตรวจสอบ environment/config pattern
12. ตรวจสอบ error handling / logging pattern
13. ตรวจสอบ responsive behavior
14. ตรวจสอบ dark/light theme ถ้ามี
15. ตรวจสอบงานที่ยังไม่ commit / migration ที่ค้างอยู่

**ห้ามเดา stack แล้วสร้าง architecture ใหม่ทับของเดิม**

ให้ปรับ implementation ให้เข้ากับ architecture ที่ repository ใช้อยู่จริง

---

## 2.2 Preserve existing behavior

ต้องรักษา:

- business rules เดิม
- permissions เดิม
- data compatibility
- routes เดิม
- API contracts เดิม ถ้าไม่จำเป็นต้องเปลี่ยน
- workflow ที่ผู้ใช้ใช้งานอยู่
- design language ของ PERMISSION_NEXT
- ความใกล้เคียงกับระบบต้นฉบับที่กำลังถูก restore อยู่

หากจำเป็นต้องเปลี่ยน contract/schema:

- ทำ migration อย่างปลอดภัย
- backward-compatible เท่าที่ทำได้
- อธิบายเหตุผลใน implementation summary

---

## 2.3 Do NOT iframe the demo

ห้ามใช้:

```html
<iframe src="https://mapdemo.longdo.com/whereami/">
```

หรือวิธีฝังหน้า demo ภายนอกโดยตรง

ให้สร้าง UX แบบเดียวกันด้วย integration ของ Longdo Map ภายใน application

---

# 3. Recommended Longdo Services

Primary:

- **Longdo Map API 3**
- **Longdo Place API / Reverse Geocoding**

Official references:

- https://map.longdo.com/products/api/map-api3
- https://map.longdo.com/products/api/place
- https://map.longdo.com/products/api

API 3 ใช้ Vector Tiles และเหมาะกับ feature เช่น:

- modern interactive map
- 3D map capabilities
- marker
- cluster marker
- heatmap

Place service ใช้สำหรับ:

- place search
- suggest/search
- reverse geocoding

อย่าใช้ Longdo Map API Version 1

---

# 4. Product Direction

เปลี่ยนโมดูลจาก:

```text
อาคาร
→ รายการ
→ รายละเอียด
→ ค่าใช้จ่าย
```

เป็น:

```text
อาคาร
│
├── รายการอาคาร
├── แผนที่อาคาร
├── รายละเอียดอาคาร
│   └── ตำแหน่ง
├── ค่าใช้จ่าย
├── วิเคราะห์พื้นที่
└── รายงาน
```

และเตรียม architecture ให้เชื่อมต่อได้ในอนาคต:

```text
Building
   │
   ├── Location
   ├── Expense
   ├── Deposit / Guarantee
   ├── Work / Task
   └── KPI
```

---

# 5. Required User Experience

## 5.1 Building Map Page

เพิ่มหน้า **แผนที่อาคาร**

ตัวอย่าง layout:

```text
┌─────────────────────────────────────────────────────────────┐
│ อาคารและค่าใช้จ่าย       [ค้นหาอาคาร...]      [Filters]  │
├──────────────────┬──────────────────────────────────────────┤
│ Summary / Filter │                                          │
│                  │                                          │
│ อาคารทั้งหมด     │                LONGDO MAP                │
│ xxx              │                                          │
│                  │        ● Building A                      │
│ มีค่าใช้จ่าย     │                   ● Building B           │
│ xx               │                                          │
│                  │             ◎ Current Location           │
│ รอดำเนินการ      │                                          │
│ xx               │                          ● Building C     │
│                  │                                          │
│ จังหวัด          │                                          │
│ สถานะ            │                  [+] [-] [◎] [Fullscreen]│
├──────────────────┴──────────────────────────────────────────┤
│ Map | Satellite/available base map | Expense | Heatmap     │
└─────────────────────────────────────────────────────────────┘
```

ต้อง responsive:

### Desktop
- side panel + map
- map ใช้พื้นที่หลัก
- filter panel collapse ได้

### Tablet
- compact filter drawer
- map เป็นพื้นที่หลัก

### Mobile
- map เกือบเต็ม viewport
- filter เป็น drawer / bottom sheet
- detail เป็น bottom sheet
- touch target อย่างน้อยประมาณ 44px
- ห้ามเกิด horizontal overflow

---

# 6. Map Modes

หน้า Map ต้องรองรับอย่างน้อย 4 modes

## 6.1 Building Mode

แสดงอาคารทั้งหมดที่มีพิกัด

Marker ต้องสามารถ:

- click/tap
- focus
- open Building Detail Card
- highlight selected building
- zoom/fly to building

---

## 6.2 Status Mode

แสดงสถานะอาคาร/งานที่เกี่ยวข้อง

ห้ามใช้สีเพียงอย่างเดียวเป็นตัวสื่อความหมาย

ต้องมี:

- color
- icon หรือ shape
- legend
- accessible label

สถานะต้อง map จากสถานะจริงในระบบ ไม่สร้าง enum ใหม่ซ้ำโดยไม่จำเป็น

---

## 6.3 Expense Mode

แสดงภาพรวมค่าใช้จ่ายบนพื้นที่

อาจใช้:

- marker badge
- scaled marker
- aggregated cluster value

ตัวอย่าง:

```text
฿12.5K
฿85.2K
฿3.6K
```

ต้องรองรับ filter:

- date range
- expense category
- building
- province/district
- status

ยอดเงินที่แสดงต้องมาจาก business logic / source of truth เดียวกับหน้า Expense ปัจจุบัน

**ห้ามคำนวณนิยามยอดค่าใช้จ่ายใหม่เองจนตัวเลขไม่ตรงกับโมดูลเดิม**

---

## 6.4 Heatmap Mode

Heatmap ใช้เพื่อแสดงความหนาแน่น เช่น:

- จำนวนอาคาร
- จำนวนรายการค่าใช้จ่าย
- ยอดค่าใช้จ่าย

UI ต้องให้ผู้ใช้รู้ว่ากำลัง heatmap ค่าอะไร

ตัวอย่าง control:

```text
Heatmap metric:
( ) Building count
( ) Expense transaction count
(●) Expense amount
```

ถ้า dataset เล็กจน heatmap ไม่มีความหมาย ให้แสดง empty/help state ที่เหมาะสม

---

# 7. Current Location / Where Am I UX

สร้าง interaction คล้ายแนวคิด `Where am I?`

ปุ่ม:

```text
◎ ตำแหน่งปัจจุบัน
```

เมื่อกด:

1. ตรวจสอบ browser geolocation support
2. ขอ permission
3. แสดง loading state
4. รับ latitude / longitude
5. รับ accuracy ถ้ามี
6. focus/fly map ไปยังตำแหน่ง
7. แสดง Current Location marker
8. ถ้าอยู่ใน Building Location Picker:
   - อนุญาตให้นำตำแหน่งนี้ไปเป็น candidate
   - reverse geocode
   - ให้ผู้ใช้ตรวจสอบ
   - ผู้ใช้ต้องกดยืนยันก่อนบันทึก

ห้ามบันทึกตำแหน่งโดยอัตโนมัติทันทีที่ browser ส่ง location กลับมา

---

# 8. Geolocation Privacy

สำคัญมาก:

- ห้าม background tracking
- ห้าม polling GPS ต่อเนื่องโดยไม่มีเหตุผล
- ห้ามเก็บ history ตำแหน่งของพนักงาน
- ขอ location เมื่อผู้ใช้กด action ที่เกี่ยวข้อง
- แสดงเหตุผลก่อน/ระหว่างการขอ permission
- รองรับกรณี permission denied
- รองรับกรณี location unavailable
- รองรับ timeout
- ไม่ block workflow หลักถ้าผู้ใช้ไม่อนุญาต GPS

ข้อความ error ต้องเป็นภาษาที่ผู้ใช้เข้าใจ ไม่แสดง raw browser error อย่างเดียว

---

# 9. Building Location Picker

เพิ่ม Location Picker ใน:

- Create Building
- Edit Building
- Building Detail (view mode)
- workflow อื่นที่เหมาะสมหลังตรวจ repo

Layout:

```text
ตำแหน่งอาคาร
────────────────────────────────

[ 🔍 ค้นหาสถานที่ / ที่อยู่ ]

┌───────────────────────────────┐
│                               │
│             MAP               │
│               📍              │
│                               │
└───────────────────────────────┘

[ ◎ ใช้ตำแหน่งปัจจุบัน ]

Latitude      xx.xxxxxx
Longitude     xxx.xxxxxx
Accuracy      xx m

จังหวัด       ...
อำเภอ/เขต     ...
ตำบล/แขวง     ...
รหัสไปรษณีย์  ...

[รีเซ็ตตำแหน่ง]     [ยืนยันตำแหน่ง]
```

---

# 10. Location Selection Methods

ต้องรองรับ:

## A. GPS

```text
location_source = gps
```

## B. Map pin

ผู้ใช้กดบนแผนที่ / ลาก marker

```text
location_source = manual_pin
```

## C. Search

ผู้ใช้ค้นหาสถานที่แล้วเลือกผลลัพธ์

```text
location_source = search
```

## D. Existing/imported coordinates

สำหรับข้อมูลเดิม

```text
location_source = import
```

อย่า overwrite ค่า source เดิมถ้าไม่ได้เกิดการเปลี่ยนพิกัดใหม่

---

# 11. Reverse Geocoding

เมื่อพิกัดเปลี่ยน:

```text
lat/lng
   ↓
Reverse Geocode
   ↓
province
district
subdistrict
postcode
address metadata
```

ต้อง:

- debounce เมื่อ marker ถูกลาก
- cancel/ignore stale requests
- มี loading indicator
- มี retry ที่สมเหตุสมผล
- handle API failure
- ไม่ทำให้ผู้ใช้เสียพิกัดที่เลือกหาก reverse geocode ล้มเหลว
- ให้ผู้ใช้ยืนยันก่อน save

ข้อมูลจาก reverse geocoding เป็น assistive data ไม่ใช่เหตุผลให้บันทึก location โดยไม่มี confirmation

---

# 12. Search / Suggest

Location Picker ควรมีช่อง:

```text
ค้นหาสถานที่ / ชื่ออาคาร / ที่อยู่
```

รองรับ:

- keyboard navigation ถ้า UI library ทำได้
- loading
- no result
- error
- clear search
- selecting result
- move map to result
- temporary marker
- confirm position

อย่าเรียก API ทุก keystroke แบบไม่มี debounce

---

# 13. Suggested Data Model

Codex ต้องตรวจ schema จริงก่อน

ถ้า field เหล่านี้ยังไม่มี ให้เพิ่มตาม convention ของ project:

```text
latitude
longitude
location_accuracy
location_source
location_verified
location_verified_at
location_verified_by
location_updated_at

address
subdistrict
district
province
postcode

longdo_place_id
```

ชนิดข้อมูลให้เลือกตาม DB จริง

ข้อแนะนำ:

```text
latitude   decimal/numeric with sufficient precision
longitude  decimal/numeric with sufficient precision
```

หรือชนิด spatial ถ้า stack ปัจจุบันรองรับและมีเหตุผลจริง

อย่าเพิ่ม spatial complexity โดยไม่จำเป็น

---

# 14. Validation

พิกัด:

```text
-90 <= latitude <= 90
-180 <= longitude <= 180
```

ต้องป้องกัน:

- NaN
- null inconsistencies
- lat/lng สลับกัน
- malformed imported coordinate
- partial coordinate: มี lat แต่ไม่มี lng

กฎ:

```text
latitude == null && longitude == null
```

ยอมรับได้สำหรับข้อมูลเก่า

แต่:

```text
latitude != null && longitude == null
```

ไม่ควรถือเป็น valid location

---

# 15. Location Verification

สร้างแนวคิด:

```text
location_verified = true/false
```

เมื่อผู้ใช้ที่มีสิทธิ์ยืนยันตำแหน่ง:

- location_verified = true
- location_verified_at = timestamp
- location_verified_by = current user

เมื่อ lat/lng ถูกเปลี่ยนภายหลัง:

- reset verified state ตาม business rule ที่เหมาะสม

ตรวจ RBAC จริงก่อนกำหนดว่า role ไหนยืนยันได้

---

# 16. Building Detail Card

เมื่อกด marker ให้เปิด card / side panel / bottom sheet

ตัวอย่าง:

```text
ABC Tower
BLD-00128

📍 แขวง...
   เขต...
   กรุงเทพฯ ...

สถานะ          กำลังดำเนินการ
ค่าใช้จ่ายสะสม  ฿125,600
รายการ          8 รายการ

[ดูข้อมูลอาคาร]
[ดูค่าใช้จ่าย]
```

Optional ถ้าข้อมูลมีอยู่จริง:

- responsible owner
- guarantee/deposit status
- latest activity
- latest expense date

ห้ามสร้างข้อมูล placeholder ให้เหมือนเป็นข้อมูลจริง

---

# 17. Map → Existing Module Navigation

ต้องเชื่อม navigation จริง:

Marker → Building Detail

Building Detail → Expense

Expense row → Building

Building list → Show on Map

ตัวอย่าง action:

```text
ดูบนแผนที่
```

เมื่อกดจากรายการอาคาร:

```text
/buildings/map?building=<id>
```

หรือ routing pattern ที่ project ใช้อยู่จริง

Map ต้อง:

- เปิดหน้า
- focus building
- select marker
- แสดง detail

---

# 18. Filters

Map filter อย่างน้อยควร reuse filter logic ที่มีอยู่ใน module

รองรับตามข้อมูลจริง:

- building search
- building status
- province
- district
- expense category
- date range
- expense status
- owner / assignee ถ้ามี
- location verified/unverified

Filter state ควรสามารถสะท้อนใน URL/query state ถ้า architecture เดิมรองรับ เพื่อให้:

- refresh แล้วไม่หาย
- back/forward ใช้งานได้
- copy URL แชร์ context ได้

---

# 19. Building List Integration

ใน Building List:

เพิ่ม indicator:

```text
📍 มีตำแหน่ง
```

หรือ

```text
ยังไม่ได้ระบุตำแหน่ง
```

เพิ่ม action:

```text
ดูบนแผนที่
```

เพิ่ม optional filter:

```text
Location:
All
Has location
No location
Unverified
```

---

# 20. Expense Integration

Expense records ต้องสัมพันธ์กับ building เดิม

Map aggregation ต้องใช้:

```text
expense
→ building_id
→ building.latitude / building.longitude
```

ห้าม duplicate พิกัดลง expense ทุก record เว้นแต่ schema/business case เดิมต้องการจริง

---

# 21. API Key / Configuration

ห้าม hard-code:

```text
LONGDO_KEY = "xxxxx"
```

ลง source file

ใช้ config/env convention ของ project เช่น:

```text
LONGDO_MAP_API_KEY
```

หรือ prefix ที่ framework ต้องใช้

Codex ต้อง:

1. ตรวจ pattern env ของ project
2. เพิ่ม example variable ใน `.env.example` ถ้ามี
3. ห้าม commit secret จริง
4. document setup
5. รองรับ missing key ด้วย friendly configuration error
6. ไม่ crash ทั้ง application เพราะ Map key หาย

หมายเหตุ:

Public browser map keys อาจถูกส่งไป client ตามรูปแบบ SDK แต่ต้องใช้ restriction ที่ Longdo รองรับ เช่น domain/referrer restriction และต้องไม่เอา server-side secret อื่นไป expose โดยไม่จำเป็น

---

# 22. Longdo Adapter Layer

อย่าให้ component ทุกตัวเรียก SDK ตรง ๆ กระจัดกระจาย

สร้าง integration boundary เช่น:

```text
services/
  map/
    longdo/
      client
      loader
      geolocation
      geocoding
      placeSearch
      types
```

หรือ directory ตาม convention จริง

Component layer:

```text
components/
  map/
    MapCanvas
    CurrentLocationButton
    BuildingMarker
    BuildingMarkerCluster
    LocationPicker
    MapLegend
    MapToolbar
    BuildingMapDetail
```

ชื่อจริงให้สอดคล้องกับ project

เป้าหมายคือ:

- isolate vendor dependency
- test ง่าย
- เปลี่ยน provider ในอนาคตได้
- ไม่ pollute domain model ด้วย SDK object

---

# 23. Do Not Store SDK Objects

ห้ามเก็บ Longdo Map object / Marker object ลง database หรือ global serializable store

เก็บเฉพาะ domain data:

```text
latitude
longitude
metadata
```

SDK instances ให้อยู่ใน component/service lifecycle เท่านั้น

---

# 24. Loading the Map SDK

ต้อง:

- load SDK ครั้งเดียว
- ป้องกัน duplicate script
- handle load failure
- handle remount
- cleanup event listeners
- cleanup markers/layers
- ป้องกัน memory leak

ถ้า framework รองรับ SSR:

- ห้ามเรียก `window`, `navigator`, SDK browser APIs บน server
- ใช้ client-only boundary ตาม framework จริง

---

# 25. Performance

ต้องออกแบบรองรับอาคารจำนวนมาก

## Marker strategy

ถ้า marker มาก:

- cluster
- lazy/viewport-aware rendering ถ้า SDK/API เหมาะสม
- ไม่สร้าง heavy React/Vue component หลายพันตัวโดยไม่จำเป็น

## Data query

หลีกเลี่ยง:

```text
GET /buildings → ดึงทุก column ทุก record
```

ถ้า dataset ใหญ่

ควรมี map-oriented payload เช่น:

```text
id
code
name
latitude
longitude
status
expense_summary
```

โดยต้องปรับให้เข้ากับ backend จริง

---

# 26. Aggregation

Expense Mode / Heatmap ไม่ควรดาวน์โหลด expense transaction ทั้งหมดมาคำนวณฝั่ง browser ถ้าข้อมูลเยอะ

ให้พิจารณา server aggregation:

```text
GROUP BY building_id
SUM(amount)
COUNT(*)
```

ตาม filter

ต้องใช้ business definition ของ amount เดิม

---

# 27. Caching

ใช้ cache อย่างระมัดระวังสำหรับ:

- reverse geocode result ของ coordinate เดิม
- place search ตามนโยบาย/ข้อกำหนดของ provider
- aggregate map data

ห้าม cache ข้าม tenant/user boundary ถ้าระบบเป็น multi-tenant

ห้าม cache sensitive result แบบไม่จำกัด

ตรวจ Terms ของ Longdo ก่อนทำ persistent caching ของ provider data

---

# 28. Request Control

สำหรับ Search / Reverse Geocoding:

- debounce
- request cancellation หรือ stale response protection
- rate-limit client interactions ตามสมควร
- avoid duplicate requests
- handle HTTP/API errors
- log provider failures แบบไม่ leak key

---

# 29. Security

ต้องตรวจ:

- XSS ใน place/building labels
- unsanitized HTML ใน map popup
- API key leakage
- authorization ของ building/expense API
- IDOR
- tenant isolation ถ้ามี
- server endpoint permissions
- query validation
- SQL injection ผ่าน filter
- overly verbose production logs

Map UI ไม่ใช่ authorization boundary

ถึง marker จะไม่แสดง ผู้ใช้ก็ต้องไม่สามารถเรียกข้อมูลที่ไม่มีสิทธิ์ผ่าน API ได้

---

# 30. RBAC

Reuse permission system เดิม

แยกสิทธิ์อย่างเหมาะสม เช่น:

```text
building.view
building.create
building.update
building.location.update
building.location.verify
expense.view
```

แต่ **อย่าสร้าง permission ใหม่โดยอัตโนมัติ** ถ้าระบบเดิมมี permission ที่ครอบคลุมอยู่แล้ว

Codex ต้อง inspect ก่อน

---

# 31. Accessibility

ต้องมี:

- keyboard-accessible controls
- visible focus
- aria labels ตาม framework
- button labels ชัดเจน
- map mode legend
- status ไม่พึ่งสีอย่างเดียว
- sufficient contrast
- screen-reader-friendly summary ของ selected building
- loading/error state ที่อ่านได้

Map interaction ไม่ควรเป็นวิธีเดียวในการเข้าถึง building

รายการอาคารต้องยังใช้งานได้

---

# 32. UX States

ทุก map feature ต้องออกแบบอย่างน้อย:

## Loading

```text
กำลังโหลดแผนที่...
```

## Map provider unavailable

```text
ไม่สามารถโหลดแผนที่ได้ในขณะนี้
คุณยังสามารถใช้งานข้อมูลอาคารและค่าใช้จ่ายส่วนอื่นได้ตามปกติ
```

## Missing API configuration

แสดงเฉพาะสำหรับ environment ที่เหมาะสม โดยไม่เปิด secret

## Location permission denied

```text
ไม่สามารถเข้าถึงตำแหน่งปัจจุบันได้
คุณยังสามารถค้นหาสถานที่หรือเลือกตำแหน่งบนแผนที่ได้
```

## Location unavailable

มี retry

## No building coordinates

มี empty state

## No filter result

มี clear-filter action

---

# 33. Responsive Requirements

ทดสอบอย่างน้อย:

- 360px
- 390px
- 768px
- 1024px
- 1366px
- 1440px+

ต้องตรวจ:

- text overflow
- card clipping
- map resize
- bottom sheet
- sticky/fixed toolbar
- modal height
- safe viewport
- mobile browser address bar
- touch gestures
- long Thai text

นี่เป็นจุดสำคัญเพราะ PERMISSION_NEXT เคยมีปัญหาเรื่องข้อความล้นและ typography

---

# 34. Typography

ใช้ typography tokens เดิมของ application

ห้ามใช้ text เล็กเกินไปเพื่อยัดข้อมูลลง map

Guideline:

- primary labels อ่านได้ชัด
- secondary metadata ยังอ่านได้บน mobile
- currency มี hierarchy
- truncate เฉพาะจุดที่จำเป็น
- tooltip/title ไม่ใช่ทางแก้หลักสำหรับข้อมูลสำคัญ

---

# 35. Map Visual Style

Map UI ต้องดูเป็นส่วนหนึ่งของ PERMISSION_NEXT

ไม่ใช่:

```text
หน้า SuperApp
+
กล่อง Longdo แบบ default ที่ดูเหมือนคนละระบบ
```

Customize surrounding UI:

- toolbar
- cards
- filters
- sheet
- legend
- controls
- states

โดยใช้ design tokens เดิม

อย่า override base-map visual จนขัด Terms/API

---

# 36. Fullscreen Map

รองรับ fullscreen map view หาก SDK/browser รองรับ

Fullscreen ต้อง:

- ยังเข้าถึง search/filter ได้
- selected building ไม่หาย
- exit ได้ชัดเจน
- mobile ใช้งานได้
- Esc ออกจาก fullscreen บน desktop ถ้า implementation รองรับ

---

# 37. Map Base Layer

ให้ใช้ base layers ที่ Longdo API 3 รองรับจริง

ห้าม hard-code ชื่อ mode จาก demo โดยไม่ตรวจ API

UI สามารถมี selector เช่น:

```text
แผนที่
ภาพถ่าย/ชั้นข้อมูลอื่น (ถ้ามีและรองรับ)
```

ให้ Codexยืนยันจาก official API ก่อน implement

---

# 38. Optional 3D

Map API 3 รองรับความสามารถ 3D ตามข้อมูลผลิตภัณฑ์

แต่สำหรับ Phase แรก:

**3D เป็น optional enhancement ไม่ใช่ acceptance blocker**

ลำดับความสำคัญ:

1. reliable map
2. location picker
3. building marker
4. expense integration
5. filtering
6. cluster
7. heatmap
8. 3D enhancement

---

# 39. Offline / Poor Network

ไม่จำเป็นต้องสร้าง offline map ในรอบนี้

แต่:

- map failure ต้องไม่ทำให้ module crash
- cached application data ยังอ่านได้ตาม architecture เดิม
- retry provider load ได้
- network error ต้องมี state

---

# 40. Audit / History

ถ้า project มี audit log อยู่แล้ว:

เมื่อเปลี่ยน location ให้บันทึก event ผ่าน audit mechanism เดิม เช่น:

```text
BUILDING_LOCATION_UPDATED
BUILDING_LOCATION_VERIFIED
```

ข้อมูลที่มีประโยชน์:

- building id
- changed by
- timestamp
- old coordinate
- new coordinate
- source

ห้ามสร้าง audit system ใหม่ซ้ำกับของเดิม

---

# 41. Migration Strategy

ต้องรองรับข้อมูลอาคารเก่าที่ไม่มีพิกัด

Migration ห้าม:

- ใส่พิกัดปลอม
- default อาคารทั้งหมดไปที่ Bangkok center
- mark verified โดยอัตโนมัติ

ข้อมูลเดิม:

```text
latitude = null
longitude = null
location_verified = false
```

ถือว่า valid legacy record

---

# 42. Backfill Tool (Recommended)

ถ้ามีอาคารจำนวนมาก:

สร้าง admin workflow หรือ import mechanism ตาม architecture เดิม:

```text
Building without location
→ Search
→ Pick location
→ Confirm
→ Next
```

Optional bulk import:

```csv
building_code,latitude,longitude
```

ต้อง validate ทุก row

แสดง:

- success
- failed
- reason

ห้าม silently skip bad rows

---

# 43. Map Summary

บน Map Page แสดง summary ที่มีประโยชน์ เช่น:

```text
อาคารทั้งหมด                1,248
มีตำแหน่ง                     1,095
ยังไม่ได้ระบุตำแหน่ง            153
มีค่าใช้จ่ายในช่วงที่เลือก        438
ค่าใช้จ่ายรวม              ฿x,xxx,xxx
```

ตัวเลขต้องตอบสนองต่อ filter ที่เหมาะสม

---

# 44. URL / Deep Link

ถ้า routing architecture รองรับ:

```text
/buildings/map
/buildings/map?buildingId=...
/buildings/map?province=...
/buildings/map?mode=expense
```

ใช้ชื่อ route ตาม convention จริง

Deep link ต้องไม่ bypass permissions

---

# 45. Error Boundary

Map integration เป็น external dependency

ถ้า framework รองรับ error boundary:

ครอบ map feature เพื่อป้องกัน provider error ทำให้ทั้ง page/module blank

Failure ของ map ต้อง degrade gracefully

---

# 46. Observability

ใช้ logging/telemetry system เดิมถ้ามี

ควร track:

- map load failure
- provider request failure
- reverse geocode failure
- location permission denied (แบบ aggregate ไม่เก็บพิกัดส่วนตัวโดยไม่จำเป็น)
- malformed building coordinates

ห้าม log API secret

---

# 47. Testing

## Unit tests

ครอบคลุม:

- coordinate validation
- map domain mapper
- expense aggregation mapper
- filter serialization
- location source logic
- verified reset logic
- reverse geocode response mapper

---

## Integration tests

ครอบคลุม:

- building API with location
- update building location
- permissions
- expense map summary
- invalid coordinates
- old building with null coordinates

---

## Component tests

ครอบคลุม:

- map loading state
- missing key
- permission denied
- location unavailable
- building detail sheet
- filter behavior
- confirm/cancel location
- responsive behavior ที่ test framework รองรับ

---

## E2E

อย่างน้อย:

### E2E-01
เปิด Map page → อาคารที่มี location แสดง

### E2E-02
ค้นหาอาคาร → focus marker

### E2E-03
กด marker → detail card แสดงข้อมูลถูกต้อง

### E2E-04
กดดูค่าใช้จ่าย → ไป Expense context ถูกอาคาร

### E2E-05
แก้ไขอาคาร → ใช้ GPS → preview → confirm → save

### E2E-06
permission denied → ยังเลือก manual pin ได้

### E2E-07
เลือก location ด้วย search → reverse geocode → save

### E2E-08
Expense Mode → total ตรงกับ source of truth

### E2E-09
Heatmap filter date → result เปลี่ยนตาม filter

### E2E-10
Mobile 390px → ไม่มี overflow / inaccessible controls

### E2E-11
Longdo SDK fail → page อื่นใน module ยังใช้ได้

### E2E-12
Unauthorized user → update location ไม่ได้

---

# 48. Regression Testing

ก่อนจบงานต้องตรวจของเดิม:

- Building list
- Building create
- Building edit
- Building detail
- Expense list
- Expense create/edit ถ้ามี
- Expense summary
- Deposit/Guarantee integration ที่เกี่ยวข้อง
- Work/KPI links ที่เกี่ยวข้อง
- Dashboard
- Auth
- RBAC
- responsive navigation

Feature Map ห้ามทำให้ workflow เดิม regress

---

# 49. Performance Acceptance

Codex ต้องใช้ profiler/network/devtools ตามที่ทำได้และแก้ issue เห็นชัด

ตรวจ:

- SDK loaded once
- no duplicate map initialization
- no infinite geolocation calls
- no API call on every render
- no reverse geocode storm
- no thousands of unnecessary DOM markers
- no large unbounded expense payload
- no event listener leak

---

# 50. Acceptance Criteria

งานถือว่าเสร็จเมื่อ:

- [ ] มีหน้า Building Map ใช้งานจริง
- [ ] ใช้ Longdo Map API ที่เหมาะสม ไม่ iframe demo
- [ ] แสดง Building markers จากข้อมูลจริง
- [ ] Marker click เปิดรายละเอียดอาคาร
- [ ] มี search/filter
- [ ] มี current location action
- [ ] Location Picker ใช้ใน create/edit building ได้
- [ ] เลือก location ผ่าน GPS ได้
- [ ] เลือก location ผ่าน map ได้
- [ ] search place ได้ถ้า API/config พร้อม
- [ ] reverse geocode ได้
- [ ] ผู้ใช้ confirm ก่อน save
- [ ] ข้อมูล location persist จริง
- [ ] มี location source
- [ ] รองรับ legacy building ที่ไม่มี location
- [ ] มี Expense Mode
- [ ] Expense totals ตรงกับโมดูลค่าใช้จ่าย
- [ ] มี Cluster สำหรับ dataset ที่เหมาะสม
- [ ] มี Heatmap หรือ equivalent supported implementation
- [ ] map filter ทำงานจริง
- [ ] responsive
- [ ] ไม่มี horizontal overflow
- [ ] ไม่มีข้อความล้นผิดปกติ
- [ ] loading/error/empty states ครบ
- [ ] permission denied ไม่ทำ workflow พัง
- [ ] API key ไม่ hard-code
- [ ] auth/RBAC ไม่ถูก bypass
- [ ] tests ผ่าน
- [ ] lint/typecheck ผ่าน
- [ ] build ผ่าน
- [ ] regression checks ผ่าน
- [ ] documentation อัปเดต
- [ ] ไม่มี placeholder/mock data ตกค้างใน production path
- [ ] ไม่มี console error ที่รู้แล้วปล่อยทิ้งไว้

---

# 51. Implementation Phases

## Phase 0 — Discovery

Inspect repo และเขียนสรุปสั้น ๆ ก่อนลงมือ:

```text
Current stack:
Building module:
Expense module:
Database:
Auth/RBAC:
Design system:
Test setup:
Map-related code already present:
Risks:
```

จากนั้นลงมือได้เลย ไม่ต้องรอ human confirmation เว้นแต่มี destructive/irreversible decision จริง ๆ

---

## Phase 1 — Domain & Database

- audit schema
- add location fields
- migration
- validation
- DTO/schema updates
- API serializers
- permission checks

---

## Phase 2 — Longdo Integration Foundation

- environment config
- SDK loader
- map adapter
- error/loading states
- provider types
- place/geocoding wrapper

---

## Phase 3 — Location Picker

- map canvas
- pin selection
- drag/update
- current location
- search
- reverse geocoding
- preview
- confirmation
- form integration

---

## Phase 4 — Building Map

- route/page
- query API
- markers
- selection
- building detail
- filters
- search
- deep link

---

## Phase 5 — Expense Intelligence

- expense aggregation
- expense mode
- date filters
- category filters
- cluster summary
- heatmap

---

## Phase 6 — UX Polish

- responsive
- mobile bottom sheet
- toolbar
- map legend
- fullscreen
- typography
- overflow fixes
- skeleton/loading
- error states

---

## Phase 7 — Security & Performance

- RBAC
- API validation
- request control
- SDK lifecycle
- cleanup
- query optimization
- key/config review

---

## Phase 8 — Test & Regression

- unit
- integration
- E2E
- lint
- typecheck
- build
- regression

---

# 52. Out of Scope for This Pass

อย่า feature-creep ไปทำสิ่งเหล่านี้ เว้นแต่มีของเดิมอยู่แล้วและจำเป็นต่อ integration:

- live employee tracking
- fleet tracking
- route optimization
- navigation system
- turn-by-turn navigation
- full GIS platform
- polygon territory editor
- geofencing attendance
- background GPS collection

Route API สามารถต่อยอดภายหลังได้ แต่ไม่ใช่เป้าหมายหลักของงานนี้

---

# 53. UX Quality Standard

ผลลัพธ์ต้องให้ความรู้สึกว่า:

> Map ถูกออกแบบมาเป็นส่วนหนึ่งของ PERMISSION_NEXT ตั้งแต่ต้น

ไม่ใช่:

> เอา library map มาแปะเพิ่มทีหลัง

ต้องมี consistency ใน:

- spacing
- radius
- typography
- button
- icon
- filter
- dialog
- sheet
- loading
- error
- animation
- responsive behavior

---

# 54. Important Existing PERMISSION_NEXT Context

โปรเจกต์กำลังถูกปรับให้:

- UX/UI เป็นมืออาชีพขึ้น
- แก้ข้อความล้น
- แก้ typography ที่เล็กเกินไป
- ลบข้อความระบบ/ข้อความตกค้าง
- รักษาความใกล้เคียงกับระบบต้นฉบับ
- ทำให้โมดูลทำงานร่วมกันอย่างเป็นระบบ
- ไม่ใช่การนำหลายระบบมายำรวมกัน

ดังนั้นการเพิ่ม Map:

**ห้ามทำให้โมดูลอาคารและค่าใช้จ่ายหลุดจากต้นฉบับ**

ให้ Map เป็น enhancement ที่อยู่บนฐาน workflow เดิม

---

# 55. Codex Working Rules

ทำงานแบบ end-to-end

Codex ต้อง:

1. Inspect
2. Plan internally
3. Implement
4. Migrate
5. Integrate
6. Test
7. Fix
8. Re-test
9. Build
10. Review diff
11. Remove dead/debug code
12. Document

อย่าหยุดหลังสร้าง component อย่างเดียว

อย่าจบงานโดยบอกว่า:

```text
"ส่วน backend ยังต้องทำต่อ"
"ยังไม่ได้เชื่อม database"
"ยังไม่ได้ทำ mobile"
"ควรเพิ่ม test ภายหลัง"
```

หากสิ่งนั้นอยู่ในขอบเขตและสามารถทำได้ใน repository ให้ทำให้ครบ

---

# 56. No Fake Completion

ห้ามรายงานว่าเสร็จ หาก:

- map ใช้ mock data
- save ไม่ลง DB
- expense total เป็น placeholder
- heatmap ใช้ random data
- GPS button เป็น UI เปล่า
- search ยังไม่เรียก service
- permissions ไม่ตรวจ
- test fail
- build fail
- console error
- API key hard-coded

ถ้ามี blocker จริง ให้ระบุ:

```text
BLOCKER
Cause:
Impact:
Completed:
Remaining:
Exact action required:
```

---

# 57. Final Codex Report

เมื่อทำเสร็จ ให้รายงาน:

```text
# Implementation Summary

## Architecture
...

## Files Changed
...

## Database Changes
...

## Longdo Integration
...

## Building Map
...

## Location Picker
...

## Expense / Heatmap
...

## Security
...

## Responsive / UX
...

## Tests
- unit:
- integration:
- e2e:
- lint:
- typecheck:
- build:

## Regression
...

## Environment Variables
...

## Manual Setup Required
...

## Known Limitations
...

## Follow-up Recommendations
...
```

---

# 58. Definition of Done

Definition of Done ของงานนี้ไม่ใช่แค่:

```text
เปิดแผนที่ได้
```

แต่คือ:

```text
Building location is a real domain capability of PERMISSION_NEXT.

Users can locate, verify, inspect and analyze buildings spatially.

Expense data can be understood geographically.

The feature is secure, responsive, tested, maintainable and integrated
with the existing Building & Expense workflow.
```

---

# 59. START COMMAND FOR CODEX

ใช้ข้อความด้านล่างนี้สั่ง Codex หลังวางไฟล์นี้ไว้ที่ root ของ repository

```text
ทำงานตามไฟล์ BUILDING-EXPENSE-LONGDO-MAP-INTEGRATION.md แบบ end-to-end

โปรเจกต์เป้าหมายคือ SuperApp PERMISSION_NEXT โดยงานนี้ต้องเพิ่ม Longdo Map ให้โมดูล "อาคารและค่าใช้จ่าย" อย่างเป็นส่วนหนึ่งของระบบจริง ไม่ใช่ demo และห้าม iframe หน้า mapdemo.longdo.com/whereami/

ก่อนแก้ไข ให้ inspect repository ปัจจุบันอย่างละเอียดก่อน โดยตรวจ framework, routing, database/ORM, API, auth/RBAC, design system, Building module, Expense module, schema, tests, environment configuration และโค้ด map/location ที่มีอยู่แล้ว จากนั้นให้ implementation ปรับตัวเข้ากับ architecture จริง ห้ามเดา stack และห้ามสร้างระบบใหม่ซ้อนระบบเดิมโดยไม่จำเป็น

ใช้แนวทาง Longdo Map API 3 + Place/Reverse Geocoding ตาม official documentation และทำ abstraction/integration layer ที่ maintainable ไม่กระจาย SDK calls ไปทั่ว components

ให้ทำครบ:
- Building Map page
- Building markers จากข้อมูลจริง
- marker cluster ตามความเหมาะสม
- Building Detail Card/Bottom Sheet
- search/filter
- deep-link/focus building from Building List
- Current Location / Where-am-I interaction
- Building Location Picker ใน create/edit
- GPS location
- manual pin
- place search
- reverse geocoding
- user confirmation ก่อน save
- location source / verification metadata
- database migration ที่ backward-compatible
- legacy buildings ที่ไม่มีพิกัด
- Expense Map Mode
- expense aggregation ที่ใช้ business logic เดิม
- Heatmap
- responsive desktop/tablet/mobile
- loading/error/empty/permission-denied states
- security/RBAC
- API key ผ่าน environment/config ห้าม hard-code
- performance/request control
- unit/integration/E2E tests ตามสิ่งที่ project รองรับ
- lint/typecheck/build
- regression test โมดูลอาคาร ค่าใช้จ่าย และ integration ที่เกี่ยวข้อง

ให้ระวังปัญหาที่เคยพบใน PERMISSION_NEXT เป็นพิเศษ ได้แก่ ข้อความล้น typography เล็กเกินไป responsive ที่ผิด และข้อความระบบ/debug ที่ตกค้าง

ห้ามทำให้ UX/UI ของโมดูลอาคารและค่าใช้จ่ายหลุดจากต้นฉบับที่กำลัง restore อยู่ ให้ Map เป็น enhancement บน workflow เดิม และใช้ design tokens/components ของ PERMISSION_NEXT

ไม่ต้องหยุดถามฉันในรายละเอียด implementation ที่สามารถตัดสินใจจาก repository, conventions, tests และ best practices ได้ ให้ทำงานต่อเนื่องจนเสร็จและแก้ปัญหาที่พบระหว่างทางด้วยตัวเอง หากพบ blocker จริงที่ต้องใช้ข้อมูลภายนอก เช่น Longdo API key ให้ทำทุกส่วนที่ทำได้ให้เสร็จก่อน พร้อมสร้าง env placeholder/documentation และ graceful fallback โดยห้ามใส่ key ปลอมลง production path

ก่อนจบ:
1. ตรวจ diff ทั้งหมด
2. ลบ mock/placeholder/debug/dead code
3. รัน tests
4. รัน lint
5. รัน typecheck
6. รัน production build
7. แก้ error/warning ที่เกี่ยวข้องกับงานนี้
8. ตรวจ responsive
9. ตรวจ regression
10. สรุปไฟล์ที่เปลี่ยน database migration environment variables tests และสิ่งที่ต้องตั้งค่าเอง

อย่ารายงานว่าเสร็จถ้ายังใช้ mock data, save ไม่ลง database, totals ไม่ตรง source of truth, permission ไม่ครบ, test/build fail หรือ map integration ยังเป็นเพียง UI เปล่า

เริ่มจากอ่าน BUILDING-EXPENSE-LONGDO-MAP-INTEGRATION.md ทั้งไฟล์ แล้ว inspect repository และลงมือทำได้ทันที
```
