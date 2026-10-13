import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as coreSchema from "@/db/schema";
import type { Database } from "@/db";

const state = globalThis as typeof globalThis & { ductRentalSql?: ReturnType<typeof postgres> };
// Fail closed in every environment. Never fall back to Core's privileged pool.
export function getDuctRentalDb(): Database {
  const url = process.env.DUCT_RENTAL_DATABASE_URL;
  if (!url) throw new Error("DUCT_RENTAL_DATABASE_URL is required for duct runtime");
  state.ductRentalSql ??= postgres(url, { max: process.env.NODE_ENV === "production" ? 8 : 3, idle_timeout: 20, connect_timeout: 10, prepare: false });
  return drizzle(state.ductRentalSql, { schema: coreSchema });
}
