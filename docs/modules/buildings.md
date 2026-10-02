# Buildings module

Status: Current incremental V2 implementation.

The map-first workflow remains. `/buildings` parses bounded URL filters, applies team data scope and text/filter predicates on the server, and returns at most 100 full records per page. Stable `(name_th, id)` keyset cursors drive previous/next navigation and selected filter state remains shareable in the URL. The client map and drawer operate only on the bounded current page. Documents load only after opening the Documents tab.

`/buildings/[canonical UUID]` is Building 360. Related tasks, guarantee cases, estimates, attachments and activity are queried by canonical Building UUID and each section is filtered by its server capability and owner/team scope.

Current limitation: the map uses the bounded current cursor page rather than a separate viewport projection. Filter predicates use the latest condition JSON pending dedicated indexed projection columns. A production-like database is needed to decide whether viewport projection adds enough value and to validate query plans.

## Longdo map and location workflow

The Buildings map at `/buildings/map` uses Longdo Map API 3 through a client-only adapter. Place search and reverse geocoding are requested through `/api/buildings/location-services`; the API key is read from `LONGDO_MAP_API_KEY` at runtime and is never committed. Request a key in the Longdo developer console and restrict it to the deployed application host. Leave the variable unset in local environments without a key: the map shows a configuration state and location search reports that the service is unavailable.

Apply `supabase/migrations/0018_building_location.sql` before deploying the location write API. The additive location columns are nullable to preserve legacy buildings. Existing coordinates in imported condition JSON remain readable as unverified legacy coordinates; no coordinate is invented or automatically marked verified. New or changed coordinates are stored only after the user confirms a GPS, manual pin, or Place search candidate. The write API checks building read and update authorization, team scope, and the current condition version, then records verification metadata and an audit event.

Expense mode reads payable fee rows from the latest existing Building BOQ condition version and uses the same fee classification and amount logic as the Building module. It is an aggregation of current BOQ conditions, not a ledger of paid transactions; this repository has no separate expense transaction table. Date filters use the condition version's effective date. Rows requiring fee review are not counted as payable totals. Heatmap metrics can show located building counts, payable fee row counts, or category amount.

The map loads a bounded maximum of 10,000 authorized buildings per request, with a separately authorized lookup for a deep-linked selected building. Unlocated legacy buildings remain available in the Building List and can be located from Building 360 when the user has update access. Current device location is used only to orient the map and is not saved to a building.
# การลบอาคารโดยผู้ดูแลระบบ

- ปุ่ม “ลบอาคาร” ในหน้ารายละเอียดปรากฏเฉพาะ `platform_admin` ที่มีสิทธิ์อ่านและแก้ไขอาคารในขอบเขตข้อมูลนั้น โดย API ตรวจสิทธิ์ซ้ำฝั่ง server
- ต้องพิมพ์ชื่ออาคารยืนยัน และส่ง version ปัจจุบัน; API `DELETE /api/buildings/[id]` ตรวจ origin และล็อกแถวภายใน transaction
- ลบข้อมูลอาคารจริง รวมเงื่อนไข/อัตราค่าใช้จ่าย ผู้ติดต่อ ชื่ออื่น และ source mapping พร้อมเก็บ snapshot ใน audit `building.delete` ใน transaction เดียวกัน
- ปฏิเสธการลบเมื่อมีงาน โครงการ รายการงานนอกระบบ เงินประกัน ใบเสนอราคา หรือเอกสารเชื่อมอยู่; ไม่ลบไฟล์ NAS/SharePoint
- ไม่ต้องเพิ่ม migration หรือตัวแปร environment สำหรับการลบ
- ทดสอบ PostgreSQL local แบบ rollback: `$env:BUILDING_DELETE_INTEGRATION='1'; npx vitest run src/lib/building-delete.integration.test.ts` อนุญาตเฉพาะ database บน loopback ที่ชื่อลงท้าย `_dev`
