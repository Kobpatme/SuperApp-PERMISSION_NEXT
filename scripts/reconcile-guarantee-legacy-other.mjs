/** Reconcile the legacy `other` field omitted by the 2026-09-25 CSV export.
 *
 * Values and descriptions were read from the matching Firestore `deposits`
 * documents on 2026-09-26. This script is intentionally local-only and
 * idempotent; it updates only rows whose imported amount matches the evidence.
 */
import postgres from "postgres";
import { config } from "dotenv";

config({ path: ".env.local" });

const evidence = [
  ["YqCEtYwXtjCRP9uyugBA", 18080, "ค่ากรมธรรม์"],
  ["xpHrE101rIQRGOsU8cAj", 5000, "ค่าประสานงาน"],
  ["ujZqLFNUFxEPQeGwNKMH", 16140.95, "ค่าจัดทำประกันภัย"],
  ["oqq80cWrROOyNlpJX1Yv", 1500, "ค่าบริการเจ้าหน้าที่ประสานงาน"],
  ["Ogq3JhjDLNyA4AMz2kaC", 5371.4, "ค่าจัดทำประกันภัย"],
  ["jPn0UMyT714PmnIsoVF6", 24187.35, "ค่ากรมธรรม์"],
  ["d1vhmbqIoY7js3tEwakv", 15086, "ค่าจัดทำประกันภัย"],
  ["7vCAcAD3j6g1R9bTPPcI", 22606, "ค่ากรมธรรม์"],
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required in .env.local");
  const url = new URL(databaseUrl);
  if (!["127.0.0.1", "localhost"].includes(url.hostname) || url.pathname !== "/permission_superapp_dev")
    throw new Error("This reconciliation only runs against the local permission_superapp_dev database");

  const apply = process.argv.includes("--apply");
  const sql = postgres(databaseUrl, { max: 1, prepare: false });
  try {
    const result = await sql.begin(async (tx) => {
      let updated = 0;
      let unchanged = 0;
      for (const [sourceId, expectedOther, description] of evidence) {
        const [item] = await tx`select id, data, version from guarantee_work_items
          where data->>'id_firestore' = ${sourceId} limit 1`;
        if (!item) throw new Error(`Missing imported work item ${sourceId}`);
        const actualOther = Number(item.data.other ?? 0);
        if (Math.abs(actualOther - expectedOther) > 0.001)
          throw new Error(`Amount mismatch for ${sourceId}: expected ${expectedOther}, found ${actualOther}`);
        if (item.data.other_desc === description && item.data.migration_review_required === false) {
          unchanged++;
          continue;
        }
        if (!apply) { updated++; continue; }

        const before = { other: actualOther, other_desc: item.data.other_desc, migration_review_required: item.data.migration_review_required };
        const nextData = {
          ...item.data,
          other_desc: description,
          migration_review_required: false,
          legacy_other_verified: { source: "firestore/deposits", verified_at: "2026-09-26" },
        };
        await tx`update guarantee_work_items set data = ${tx.json(nextData)}, version = version + 1, updated_at = now()
          where id = ${item.id} and version = ${item.version}`;
        await tx`insert into audit_logs (module_id, action, entity_type, entity_id, request_id, before, after, metadata)
          values ('guarantees', 'legacy_other.reconcile', 'guarantee_work_item', ${item.id},
            ${`legacy-other-reconcile-2026-09-26-${sourceId}`}, ${tx.json(before)},
            ${tx.json({ other: expectedOther, other_desc: description, migration_review_required: false })},
            ${tx.json({ source_system: "firestore/deposits", source_id: sourceId, verified_at: "2026-09-26" })})`;
        updated++;
      }
      return { updated, unchanged };
    });
    console.log(`${apply ? "Applied" : "Validated"} ${evidence.length} legacy other-cost records; updated ${result.updated}; unchanged ${result.unchanged}.`);
  } finally {
    await sql.end();
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
