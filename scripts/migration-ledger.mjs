// Pure helpers for the migration ledger so ordering rules are testable
// without a database connection.

const MIGRATION_FILE = /^\d+.*\.sql$/;

/** Migration files in ledger order (zero-padded numeric prefix). */
export function sortMigrations(files) {
  return [...files].filter((file) => MIGRATION_FILE.test(file)).sort();
}

/**
 * Earlier migrations that the ledger has never recorded.
 * Applying a later migration over a gap hides security fixes: the applied file
 * succeeds, so nothing signals that earlier policy migrations never ran.
 */
export function findMissingPredecessors(files, appliedNames, target) {
  const applied = new Set(appliedNames);
  return sortMigrations(files).filter((file) => file < target && !applied.has(file));
}
