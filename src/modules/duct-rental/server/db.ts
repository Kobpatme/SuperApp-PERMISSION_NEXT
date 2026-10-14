import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as coreSchema from "@/db/schema";
import type { Database } from "@/db";

const state = globalThis as typeof globalThis & { ductRentalSql?: ReturnType<typeof postgres> };
// Fail closed in every environment. Never fall back to Core's privileged pool.
export function getDuctRentalDb(fixtureRequestId?: string): Database {
  const url = process.env.DUCT_RENTAL_DATABASE_URL;
  if (!url) throw new Error("DUCT_RENTAL_DATABASE_URL is required for duct runtime");
  state.ductRentalSql ??= postgres(url, { max: process.env.NODE_ENV === "production" ? 8 : 3, idle_timeout: 20, connect_timeout: 10, prepare: false });
  const fixtureMetrics = process.env.DUCT_RENTAL_FIXTURE_METRICS === "1" && new URL(url).pathname === "/permission_next_duct_rental_test" && ["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname);
  return drizzle(state.ductRentalSql, { schema: coreSchema, logger: fixtureMetrics ? { logQuery(query: string) {
    console.log(JSON.stringify({ event: "duct_fixture_query", trace: fixtureRequestId ?? "change-stream", time: Date.now(), kind: query.trim().split(/\s/, 1)[0].toLowerCase(), queue: query.includes("duct_rental_phase_permission"), count: query.includes("count(*)"), search: query.includes("strpos"), pipeline: query.includes("group by") }));
  } } : undefined });
}
export async function listenDuctRentalChanges(callback: () => void) {
  getDuctRentalDb(); return state.ductRentalSql!.listen("duct_rental_changed", callback);
}
