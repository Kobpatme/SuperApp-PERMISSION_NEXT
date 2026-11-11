import { test } from "node:test";
import assert from "node:assert/strict";
import { findMissingPredecessors, sortMigrations } from "./migration-ledger.mjs";

const files = [
  "0064_po_tracking_import_grants.sql",
  "0060_platform_admin_full_system_access.sql",
  "0063_po_tracking.sql",
  "not-a-migration.txt",
  "0061_duct_policy_worker_membership_guard.sql",
  "0062_duct_policy_worker_runtime_guard.sql",
];

test("sorts only SQL migrations by their numeric prefix", () => {
  assert.deepEqual(sortMigrations(files), [
    "0060_platform_admin_full_system_access.sql",
    "0061_duct_policy_worker_membership_guard.sql",
    "0062_duct_policy_worker_runtime_guard.sql",
    "0063_po_tracking.sql",
    "0064_po_tracking_import_grants.sql",
  ]);
});

test("reports the exact gap that let 0063 apply before 0060-0062", () => {
  const applied = ["0059_core_runtime.sql"];
  assert.deepEqual(findMissingPredecessors(files, applied, "0063_po_tracking.sql"), [
    "0060_platform_admin_full_system_access.sql",
    "0061_duct_policy_worker_membership_guard.sql",
    "0062_duct_policy_worker_runtime_guard.sql",
  ]);
});

test("allows the target once every predecessor is recorded", () => {
  const applied = [
    "0060_platform_admin_full_system_access.sql",
    "0061_duct_policy_worker_membership_guard.sql",
    "0062_duct_policy_worker_runtime_guard.sql",
  ];
  assert.deepEqual(findMissingPredecessors(files, applied, "0063_po_tracking.sql"), []);
});

test("ignores migrations that come after the target", () => {
  assert.deepEqual(findMissingPredecessors(files, [], "0060_platform_admin_full_system_access.sql"), []);
});
