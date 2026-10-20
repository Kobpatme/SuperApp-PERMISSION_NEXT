# METRIX document assets

Copied unchanged from read-only METRIX commit `f87220bf94b765e4896388632c3dbeabb5286510`:

- `nt-duct-rental.pdf`: `public/templates/แบบฟอร์มคำขอใช้บริการท่อร้อยสายสื่อสารตัวอย่าง.pdf` — active Source renderer template.
- `nt-duct-rental-example-copy.pdf`: `public/templates/แบบฟอร์มคำขอใช้บริการท่อร้อยสายสื่อสารตัวอย่าง - Copy.pdf` — Source reference copy.
- `nt-duct-rental-blank.pdf`: `public/templates/แบบฟอร์มคำขอใช้บริการท่อร้อยสายสื่อสาร NT.pdf` — Source blank reference.
- `Sarabun-Regular.ttf`: public/fonts/Sarabun-Regular.ttf. PDF-only font; no shared UI font changes.
- `Sarabun-OFL.txt`: upstream [Google Fonts OFL](https://raw.githubusercontent.com/google/fonts/main/ofl/sarabun/OFL.txt). Template redistribution/production use remains an owner acceptance item.

The source `sarabun.zip` is an HTML download page, not a ZIP; it is intentionally not copied. Source contacts/pre-filled template values are retained as part of the static template. No user signature or production record is included here.

NT Form generated fields preserve source mappings except owner-approved DQ03: cable count uses the entered value (falls back to source value 1 when omitted). Dates left blank by source stay blank. Source submitted output is flattened; original template stays unchanged.

`templates.json` records the frozen Source path, safe target filename, SHA-256, byte count and active flag for every PDF. Each has five pages and 164 terminal fields. Named field dictionaries (including Source parent/reference entries) number 195 in the blank reference and 196 in the active/copy templates; tests count these separately from terminal fields. Hash/page/field mapping tests cover all three. Reference preview/download uses a scoped request API with `document.read`/`document.export`; assets are not placed in public storage. Document generation continues to use the same active template as Source.
