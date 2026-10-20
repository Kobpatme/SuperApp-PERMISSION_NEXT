import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import postgres from "postgres";
import { databaseSslOptions } from "../../src/lib/database-ssl.mjs";

test("unset TLS retains existing URL configuration, explicit disable overrides it", async () => {
  assert.deepEqual(databaseSslOptions({}), {});
  const db = postgres("postgresql://fixture@localhost/fixture?sslmode=require", databaseSslOptions({ DATABASE_SSL: "disable" }));
  try { assert.equal(db.options.ssl, false); } finally { await db.end(); }
});

test("require encrypts while verify-full validates certificate/host", () => {
  assert.deepEqual(databaseSslOptions({ DATABASE_SSL: "require" }), { ssl: { rejectUnauthorized: false } });
  assert.deepEqual(databaseSslOptions({ DATABASE_SSL: "verify-full" }), { ssl: { rejectUnauthorized: true } });
});

test("CA configuration must select verification and missing files fail closed", () => {
  for (const mode of [undefined, "disable", "require"]) {
    assert.throws(() => databaseSslOptions({ DATABASE_SSL: mode, DATABASE_SSL_CA_PATH: "unused" }), /requires/);
  }
  assert.throws(() => databaseSslOptions({ DATABASE_SSL: "verify-full", DATABASE_SSL_CA_PATH: join(tmpdir(), "superapp-nonexistent-ca.pem") }));
  assert.throws(() => databaseSslOptions({ DATABASE_SSL: "prefer" }), /must be/);
});

test("verify-full loads an operator-mounted CA without disabling validation", () => {
  const directory = mkdtempSync(join(tmpdir(), "superapp-ca-test-"));
  try {
    const path = join(directory, "fixture-ca.pem");
    writeFileSync(path, "synthetic CA content; no real certificate");
    assert.deepEqual(databaseSslOptions({ DATABASE_SSL: "verify-full", DATABASE_SSL_CA_PATH: path }), { ssl: { rejectUnauthorized: true, ca: "synthetic CA content; no real certificate" } });
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
