import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { requireDatabaseUrl } from "@/lib/env";
import * as schema from "@/db/schema";

type SqlClient = ReturnType<typeof postgres>;
const globalForDatabase = globalThis as typeof globalThis & { permissionNextSql?: SqlClient };

function getSqlClient() {
  if (!globalForDatabase.permissionNextSql) {
    globalForDatabase.permissionNextSql = postgres(requireDatabaseUrl(), {
      max: process.env.NODE_ENV === "production" ? 10 : 3,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });
  }
  return globalForDatabase.permissionNextSql;
}

export function getDb() {
  const fixtureMetrics = process.env.PARITY_QUERY_METRICS === "1" && new URL(requireDatabaseUrl()).pathname === "/permission_next_sync_session_test";
  return drizzle(getSqlClient(), { schema, logger: fixtureMetrics ? { logQuery(query: string) {
    // Synthetic fixture only; never print query text, parameters, identities or credentials.
    console.log(JSON.stringify({ event: "fixture.db.query", kind: query.trim().split(/\s/, 1)[0].toLowerCase() }));
  } } : undefined });
}

export type Database = ReturnType<typeof getDb>;
export type DatabaseTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
