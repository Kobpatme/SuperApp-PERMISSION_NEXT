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
  return drizzle(getSqlClient(), { schema });
}

export type Database = ReturnType<typeof getDb>;
export type DatabaseTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
