import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { getDb, type Database } from "@/db";
import * as schema from "@/db/schema";

// Core identity stays on its existing connection. Car transactions use a separate,
// constrained login role and bind verified identity inside each transaction.
const state = globalThis as typeof globalThis & { carBookingSql?: ReturnType<typeof postgres> };
export function getCarBookingDb(): Database {
  const url = process.env.CAR_BOOKING_DATABASE_URL;
  if (!url) {
    if (process.env.NODE_ENV === "test") return getDb();
    throw new Error("CAR_BOOKING_DATABASE_URL is required for car runtime");
  }
  state.carBookingSql ??= postgres(url, {
    max: process.env.NODE_ENV === "production" ? 10 : 3,
    idle_timeout: 20, connect_timeout: 10, prepare: false,
  });
  return drizzle(state.carBookingSql, { schema });
}
