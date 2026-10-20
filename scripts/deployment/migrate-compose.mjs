await import("../migrate-postgres.mjs");
if (process.exitCode) process.exit(process.exitCode);
await import("./provision-compose-db.mjs");
