import { config } from "dotenv";
import { spawnSync } from "node:child_process";
import postgres from "postgres";

config({ path: ".env.local" });

const databaseName = "permission_next_position_scope_test";
const adminUrl = process.env.DATABASE_URL_MIGRATE;
if (!adminUrl) throw new Error("DATABASE_URL_MIGRATE is required");

const admin = new URL(adminUrl);
admin.pathname = "/postgres";
const target = new URL(adminUrl);
target.pathname = `/${databaseName}`;

const sql = postgres(admin.href, { max: 1, prepare: false });
try {
  try {
    await sql.unsafe(`create database ${databaseName}`);
    process.stdout.write(`created ${databaseName}\n`);
  } catch (error) {
    if (error.code !== "42P04") throw error;
    process.stdout.write(`${databaseName} already exists\n`);
  }
} finally {
  await sql.end();
}

const migration = spawnSync(process.execPath, ["scripts/migrate-postgres.mjs"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL_MIGRATE: target.href },
});
if (migration.status !== 0) process.exit(migration.status ?? 1);

process.stdout.write(`ready ${target.href.replace(/:([^:@/]+)@/, ":***@")}\n`);
