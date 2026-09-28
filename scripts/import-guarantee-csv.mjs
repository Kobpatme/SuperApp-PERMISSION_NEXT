/** Import the legacy deposit report into the native guarantee V2 work queue.
 *
 * Safety properties:
 * - local permission_superapp_dev database only
 * - dry-run unless --apply is present
 * - source ID idempotency through data.id_firestore
 * - one transaction for profiles, team, items and audit events
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import postgres from "postgres";
import { config } from "dotenv";

config({ path: ".env.local" });

const requiredHeaders = ["ID", "สถานะ", "อาคาร", "ลูกค้า", "เจ้าของงาน", "พื้นที่", "CID", "PR No.", "วันตั้งเบิก", "ยอดรวม",
  "ประกันติดตั้ง", "ประกันรื้อถอน", "ค่าธรรมเนียม", "คืนประกันติดตั้ง", "คืนประกันรื้อถอน"];
const allowedStatuses = new Set(["new", "fin", "att", "tl", "On Process", "ret", "clo", "done", "Cancel"]);
const numericPattern = /^\d+(?:,\d{3})*(?:\.\d+)?$|^\d+(?:\.\d+)?$/;

export function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  const input = text.replace(/^\uFEFF/, "");
  for (let index = 0; index < input.length; index++) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') { field += '"'; index++; }
      else if (char === '"') quoted = false;
      else field += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += char;
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field");
  if (field || row.length) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  const nonEmpty = rows.filter((entry) => entry.some((value) => value.trim() !== ""));
  if (!nonEmpty.length) return [];
  const headers = nonEmpty[0].map((value) => value.trim());
  const missing = requiredHeaders.filter((header) => !headers.includes(header));
  if (missing.length) throw new Error(`Missing CSV headers: ${missing.join(", ")}`);
  return nonEmpty.slice(1).map((values, rowIndex) => {
    if (values.length !== headers.length) throw new Error(`CSV row ${rowIndex + 2} has ${values.length} fields; expected ${headers.length}`);
    return Object.fromEntries(headers.map((header, index) => [header, values[index].trim()]));
  });
}

function money(value, field, sourceId) {
  if (!value) return 0;
  if (!numericPattern.test(value)) throw new Error(`Invalid ${field} amount for source ID ${sourceId}: ${value}`);
  const parsed = Number(value.replaceAll(",", ""));
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Invalid ${field} amount for source ID ${sourceId}`);
  return parsed;
}

function ownerKey(name) { return createHash("sha256").update(name.normalize("NFC")).digest("hex").slice(0, 12); }

export function mapDepositRow(row, snapshotDate = "2026-09-25") {
  const sourceId = row.ID.trim();
  const status = row["สถานะ"].trim();
  const place = row["อาคาร"].trim();
  const owner = row["เจ้าของงาน"].trim();
  if (!sourceId || !place || !owner) throw new Error("Every row needs ID, building and owner");
  if (!allowedStatuses.has(status)) throw new Error(`Unsupported status ${status} for source ID ${sourceId}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row["วันตั้งเบิก"])) throw new Error(`Invalid request date for source ID ${sourceId}`);
  const deposit = money(row["ประกันติดตั้ง"], "installation deposit", sourceId);
  const demolish = money(row["ประกันรื้อถอน"], "removal deposit", sourceId);
  const fee = money(row["ค่าธรรมเนียม"], "fee", sourceId);
  const sourceTotal = money(row["ยอดรวม"], "total", sourceId);
  const other = Math.round((sourceTotal - deposit - demolish - fee) * 100) / 100;
  if (other < 0) throw new Error(`Components exceed total for source ID ${sourceId}`);
  const data = {
    id_firestore: sourceId,
    source_system: "legacy_guarantee_csv",
    source_snapshot: snapshotDate,
    place,
    area: row["พื้นที่"],
    customer: row["ลูกค้า"],
    cid: row.CID,
    pr: row["PR No."],
    owner,
    dateReq: row["วันตั้งเบิก"],
    deposit,
    demolish,
    fee,
    other,
    other_desc: other ? "รอตรวจสอบส่วนต่างจากยอดรวมในรายงานต้นทาง" : "",
    source_total: sourceTotal,
    depReturn: row["คืนประกันติดตั้ง"],
    demoReturn: row["คืนประกันรื้อถอน"],
    pdf_payment: "",
    pdf_layout: "",
    pdf_additional: "",
    pdf_tl_work: "",
    pdf_tl_extra: "",
    pdf_demo_off: "",
    pdf_user_final: "",
    migration_review_required: other > 0,
  };
  return { sourceId, status, place, area: row["พื้นที่"] || null, owner, ownerKey: ownerKey(owner), data,
    createdAt: `${row["วันตั้งเบิก"]}T00:00:00+07:00`, updatedAt: `${snapshotDate}T00:00:00+07:00`, other };
}

async function main() {
  const file = process.argv.slice(2).find((argument) => !argument.startsWith("--"));
  if (!file) throw new Error("Usage: node scripts/import-guarantee-csv.mjs <deposit-report.csv> [--apply]");
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required in .env.local");
  const url = new URL(databaseUrl);
  if (!["127.0.0.1", "localhost"].includes(url.hostname) || url.pathname !== "/permission_superapp_dev")
    throw new Error("This importer only runs against the local permission_superapp_dev database");
  const rows = parseCsv(await readFile(file, "utf8"));
  const snapshotMatch = file.match(/(\d{4}-\d{2}-\d{2})(?=\.csv$)/i);
  const snapshotDate = snapshotMatch?.[1] ?? new Date().toISOString().slice(0, 10);
  const records = rows.map((row) => mapDepositRow(row, snapshotDate));
  if (new Set(records.map((record) => record.sourceId)).size !== records.length) throw new Error("Duplicate source IDs in CSV");
  const review = records.filter((record) => record.other > 0);
  const owners = [...new Set(records.map((record) => record.owner))];
  console.log(`Validated ${records.length} deposit items; ${owners.length} owners; ${review.length} total mismatches. Mode: ${process.argv.includes("--apply") ? "APPLY" : "DRY RUN"}.`);
  console.log(`Status counts: ${[...new Set(records.map((record) => record.status))].sort().map((status) => `${status}=${records.filter((record) => record.status === status).length}`).join(", ")}.`);
  if (!process.argv.includes("--apply")) return;

  const sql = postgres(databaseUrl, { max: 1, prepare: false });
  try {
    const result = await sql.begin(async (tx) => {
      const [team] = await tx`insert into teams (code, name) values ('guarantee', 'เงินประกันอาคาร')
        on conflict (code) do update set name = excluded.name, updated_at = now() returning id`;
      const ownerIds = new Map();
      for (const name of owners) {
        const key = ownerKey(name);
        const [profile] = await tx`insert into profiles (id, employee_code, email, display_name, status)
          values (gen_random_uuid(), ${`legacy-deposit-${key}`}, ${`legacy-deposit-${key}@local.invalid`}, ${name}, 'active')
          on conflict (employee_code) do update set display_name = excluded.display_name, updated_at = now() returning id`;
        await tx`insert into user_teams (user_id, team_id, is_primary) values (${profile.id}, ${team.id}, true)
          on conflict (user_id, team_id) do update set is_primary = excluded.is_primary`;
        ownerIds.set(name, profile.id);
      }
      let inserted = 0, skipped = 0;
      for (const record of records) {
        const existing = await tx`select id from guarantee_work_items where data->>'id_firestore' = ${record.sourceId} limit 1`;
        if (existing.length) { skipped++; continue; }
        const ownerId = ownerIds.get(record.owner);
        const [item] = await tx`insert into guarantee_work_items (owner_id, team_id, status, place, area, data, created_at, updated_at)
          values (${ownerId}, ${team.id}, ${record.status}, ${record.place}, ${record.area}, ${tx.json(record.data)}, ${record.createdAt}, ${record.updatedAt}) returning id`;
        await tx`insert into guarantee_work_events (item_id, actor_id, action, to_status, reason, occurred_at)
          values (${item.id}, ${ownerId}, 'import', ${record.status}, 'Initial legacy deposit CSV import; attachments unavailable', ${record.updatedAt})`;
        inserted++;
      }
      return { inserted, skipped, teamId: team.id };
    });
    console.log(`Imported ${result.inserted}; already present ${result.skipped}; review required ${review.length}; team ${result.teamId}.`);
  } finally { await sql.end(); }
}

if (process.argv[1]?.replaceAll("\\", "/").endsWith("/import-guarantee-csv.mjs"))
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
