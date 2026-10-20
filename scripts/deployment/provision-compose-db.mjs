// Local Compose fixture only. Production logins are provisioned/reviewed by IT.
import { readFile } from "node:fs/promises";
import postgres from "postgres";
import { databaseSslOptions } from "../../src/lib/database-ssl.mjs";

async function main() {
  if (process.env.COMPOSE_LOCAL_DATABASE !== "1") throw new Error("Local Compose provisioning must be explicitly selected");
  const operator = new URL(process.env.DATABASE_URL_MIGRATE);
  const names = ["DATABASE_URL", "CAR_BOOKING_DATABASE_URL", "DUCT_RENTAL_DATABASE_URL"];
  const targets = names.map(name => new URL(process.env[name]));
  if (operator.hostname !== "db" || targets.some(url => url.hostname !== "db" || url.pathname !== operator.pathname || url.port !== operator.port)) {
    throw new Error("Only the internal Compose db service on the same database is allowed");
  }
  const users = targets.map(url => decodeURIComponent(url.username));
  if (new Set([...users, decodeURIComponent(operator.username)]).size !== 4 || users.some(name => !/^[a-z][a-z0-9_]{0,62}$/.test(name)) || users[1] !== "permission_car_booking_runtime") {
    throw new Error("Distinct fixture logins required; Car login must match the existing grants script");
  }
  const db = postgres(operator.href, { ...databaseSslOptions(), max: 1, prepare: false });
  try {
    await db.begin(async tx => {
      for (const [index, url] of targets.entries()) {
        const password = decodeURIComponent(url.password);
        if (!password) throw new Error("Fixture database passwords must be supplied through .env");
        const [quoted] = await tx`select quote_literal(${password}) as password`;
        const [existing] = await tx`select oid,rolsuper,rolbypassrls,rolcreatedb,rolcreaterole from pg_roles where rolname=${users[index]}`;
        if (existing) {
          if (existing.rolsuper || existing.rolbypassrls || existing.rolcreatedb || existing.rolcreaterole) throw new Error("Unsafe existing fixture login");
          // Re-run does not rotate passwords or change an existing role.
        } else {
          await tx.unsafe(`create role "${users[index]}" login inherit nosuperuser nocreatedb nocreaterole nobypassrls password ${quoted.password}`);
        }
      }
      await tx.unsafe(`grant permission_core_runtime to "${users[0]}"`);
      await tx.unsafe(`grant duct_rental_runtime to "${users[2]}"`);
      await tx.unsafe(await readFile("scripts/car-booking-runtime-grants.sql", "utf8"));
    });
    console.log("Local Compose runtime logins provisioned; migration credentials are not passed to the app.");
  } finally { await db.end(); }
}

main().catch(error => {
  process.stderr.write(error.code ? `Local provisioning failed (${error.code}).\n` : `Local provisioning failed: ${error.message}\n`);
  process.exitCode = 1;
});
