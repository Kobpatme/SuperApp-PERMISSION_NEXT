/** Import a JSON array exported from Permission_Next's Firestore buildings collection.
 * Dry-run by default. The importer never reads Firestore credentials or overwrites mapped records. */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import postgres from "postgres";
import "dotenv/config";

const args = process.argv.slice(2);
const inputPath = args.find((arg) => !arg.startsWith("--"));
const apply = args.includes("--apply");
const ownerTeamArg = args.find((arg) => arg.startsWith("--owner-team-id="));
const ownerTeamId = ownerTeamArg?.split("=")[1] || null;
if (!inputPath) {
  console.error("Usage: node scripts/import-permission-buildings.mjs <firestore-buildings.json> [--owner-team-id=<uuid>] [--apply]");
  process.exitCode = 2;
} else {
  const raw = JSON.parse(await readFile(inputPath, "utf8"));
  const records = Array.isArray(raw) ? raw : Array.isArray(raw.buildings) ? raw.buildings : null;
  if (!records) throw new Error("Expected a JSON array or { buildings: [...] }");
  const seen = new Set();
  const prepared = records.map((record, index) => {
    if (!record || typeof record !== "object" || Array.isArray(record)) throw new Error(`Record ${index + 1} is not an object`);
    const sourceId = String(record._docId ?? record.id ?? "").trim();
    const nameTh = String(record.name_th ?? "").trim();
    if (!sourceId || !nameTh) throw new Error(`Record ${index + 1} needs _docId/id and name_th`);
    if (seen.has(sourceId)) throw new Error(`Duplicate source ID at record ${index + 1}`);
    seen.add(sourceId);
    const code = `PN-${createHash("sha256").update(sourceId).digest("hex").slice(0, 16).toUpperCase()}`;
    const nameEn = String(record.name_eng ?? "").trim() || null;
    const searchText = [code, nameTh, nameEn, record.location].filter(Boolean).join(" ").normalize("NFC").toLocaleLowerCase("th-TH");
    return { sourceId, code, nameTh, nameEn, searchText, conditions: record };
  });
  console.log(`Validated ${prepared.length} Permission_Next buildings. Mode: ${apply ? "APPLY" : "DRY RUN"}.`);
  if (!apply) console.log("No database changes made. Export the Firestore buildings collection, then rerun with --apply when ready.");
  else {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for --apply");
    if (ownerTeamId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ownerTeamId))
      throw new Error("--owner-team-id must be a UUID");
    const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
    try {
      const counts = await sql.begin(async (tx) => {
        let inserted = 0, skipped = 0;
        for (const item of prepared) {
          const existing = await tx`select building_id from building_source_mappings where source_system = 'permission_next' and source_id = ${item.sourceId}`;
          if (existing.length) { skipped++; continue; }
          const [building] = await tx`insert into buildings (code, name_th, name_en, search_text, owner_team_id)
            values (${item.code}, ${item.nameTh}, ${item.nameEn}, ${item.searchText}, ${ownerTeamId}) returning id`;
          await tx`insert into building_source_mappings (building_id, source_system, source_id, raw_name)
            values (${building.id}, 'permission_next', ${item.sourceId}, ${item.nameTh})`;
          await tx`insert into building_condition_versions (building_id, version, effective_from, conditions, reason)
            values (${building.id}, 1, now(), ${tx.json(item.conditions)}, 'Initial Permission_Next import')`;
          inserted++;
        }
        return { inserted, skipped };
      });
      console.log(`Imported ${counts.inserted}; already mapped ${counts.skipped}.`);
    } finally { await sql.end(); }
  }
}
