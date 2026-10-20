# Local PostgreSQL for building migration (development only)

PostgreSQL 17.11 portable is installed at `C:\Users\kobpat_m\AppData\Local\Programs\PostgreSQL-17.11-portable\pgsql`. Its data cluster is `C:\Users\kobpat_m\AppData\Local\PostgreSQL\permission-superapp-dev`; it listens only on `127.0.0.1:5432` and is not a Windows service. The local database is `permission_superapp_dev`. A randomly generated SCRAM password is held in the gitignored `.env.local` as `DATABASE_URL`; never commit or share that file.

Start after reboot:

```powershell
& 'C:\Users\kobpat_m\AppData\Local\Programs\PostgreSQL-17.11-portable\pgsql\bin\pg_ctl.exe' -D 'C:\Users\kobpat_m\AppData\Local\PostgreSQL\permission-superapp-dev' -l 'C:\Users\kobpat_m\AppData\Local\PostgreSQL\permission-superapp-dev\server.log' -o '-h 127.0.0.1 -p 5432' -w start
```

Check status with the same `pg_ctl.exe` and `-D` path plus `status`. Stop with `stop -m fast`. This is a local development database, not a production service or backup.

On 2026-09-25, `permission_next_buildings_2026-09-25.csv` was inspected and loaded into `migration_staging.staging_permission_buildings_csv` as 34 text columns (`c01`–`c34`) using the source export's column order. There are 925 rows and 925 unique IDs. All 925 were promoted into canonical `public.buildings`, each with one source mapping and one condition version. 1,682 numeric fee records were stored in typed `public.building_condition_fees`. The CSV includes 53 rows where fee columns contain nonnumeric values (including location/contact-like text); these buildings are marked `_migration.fee_review_required` in their condition snapshot and **none of their fees or totals are imported/displayed** until reviewed. The raw values remain in the staging table. Another 31 rows lack an update date. The source's global L1/L2/L3 formula registry was not part of the CSV.

To validate staging without writing canonical data, run `node scripts/import-permission-csv-staging.mjs`. `--apply` promotes any source IDs not already mapped; it is guarded to the loopback `permission_superapp_dev` database and skips existing mappings. This is not a general-purpose production migration. Do not edit or delete staging rows until the 53 financial exceptions have been reconciled against an authorized source.

Run `npm run dev` and open `http://127.0.0.1:3000/buildings`. The development-only `DEV_ALLOW_LOCAL_BUILDING_READ=1` flag permits the local development session to read these records only when `DATABASE_URL` points to this loopback database. It is not an authentication or production access policy. The current 925-record local dataset is loaded into a map workspace with immediate client-side search, autocomplete (including arrow-key/Enter selection), six filters, status cards, marker popups, and detail tabs. The unused right-hand building list was removed; search suggestions still open detail records, including buildings without coordinates. The page reads canonical PostgreSQL records and typed fees, not Firestore. There are 839 buildings with usable coordinates; the other 86 have no map pins. Map tiles require access to OpenStreetMap or Esri; self-hosted Leaflet assets and building search still work without tile access. A future larger deployment should switch the initial bulk read to a scoped search API.

The staging table is a local copy, not a replacement for the original Firestore database. Firestore direct read returned `PERMISSION_DENIED`; use an authorized export rather than bypassing access controls. Do not import source authentication documents or NAS files into the database. Rows with malformed financial fields retain those raw values in `_migration.fee_review_values` for display as review-only data; they are never included in numeric totals until reconciled.
