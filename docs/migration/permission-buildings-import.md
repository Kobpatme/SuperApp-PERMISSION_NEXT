# Permission_Next buildings → SuperApp

The authoritative source project is `Kobpatme/Permission_Next@afaee997afecf0f42e059b7100fa90ed0d188784`. The local checkout `D:\WebApp\Permission_Next` is only a comparison artifact. Its `app.js` contains no building records; the records live in Firestore collection `buildings` in the named `permission-building` database. The formula registry is a separate Firestore configuration document. Neither was available locally for this migration.

Export only actual building documents from the Firestore `buildings` collection as a JSON array, retaining each document ID as `_docId`. Exclude configuration and authentication documents (for example `permission_next_auth` and its backup). Keep the export outside the repository because it contains operational information. Review duplicate IDs and missing Thai names before import.

Dry run:

```powershell
node scripts/import-permission-buildings.mjs 'C:\secure\permission-buildings.json'
```

After applying database migrations and setting `DATABASE_URL`, import with an owner team so TEAM-scoped users can see the records:

```powershell
node scripts/import-permission-buildings.mjs 'C:\secure\permission-buildings.json' --owner-team-id=<team-uuid> --apply
```

The import is transactional and idempotent by `building_source_mappings` (`permission_next`, source ID). Repeated runs skip already mapped records; they do not overwrite edits in SuperApp. Raw legacy fields and BOQ live in `building_condition_versions.conditions`; the UI derives the BOQ classification and stale Check Permission state without modifying the source snapshot. Importing the Firestore formula configuration and validating full quotation calculations against source golden cases remain separate prerequisites before enabling price estimates. The NAS bridge remains the document path under SuperApp authorization; this import does not copy NAS files.
