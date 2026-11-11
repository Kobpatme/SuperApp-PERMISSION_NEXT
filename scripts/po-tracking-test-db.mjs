// Runs the PO tracking integration test against an isolated staging clone.
// Windows-safe: sets the guard env without relying on shell VAR=value syntax.
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const result = spawnSync(process.execPath, [resolve("node_modules", "vitest", "vitest.mjs"), "run", "src/modules/po-tracking/service.integration.test.ts"], {
  stdio: "inherit",
  env: { ...process.env, PO_TRACKING_STAGING_TEST: "1" },
});
process.exit(result.status ?? 1);
