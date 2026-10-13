import "server-only";
import { cache } from "react";
import { pgTable, text, boolean, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { getDb } from "@/db";
import { sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import type { ModuleManifest } from "./module-contract";
import { effectiveModuleEnabled } from "./module-lifecycle-contract";

export const moduleSettings = pgTable("core_module_settings", { moduleId: text("module_id").primaryKey(), enabled: boolean("enabled").notNull(), version: integer("version").notNull().default(1), changedBy: uuid("changed_by"), updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull() });
export const readModuleSettings = cache(async () => {
  if (!process.env.DATABASE_URL) return { available: false, rows: [] as typeof moduleSettings.$inferSelect[] };
  try {
    const user = await getCurrentUser();
    if (!user || user.mustChangePassword) return { available: true, rows: [] as typeof moduleSettings.$inferSelect[] };
    return { available: true, rows: await getDb().transaction(async tx => {
      await tx.execute(sql`select set_config('app.user_id',${user.id},true)`);
      return tx.select().from(moduleSettings);
    }) };
  }
  catch (error) {
    const cause = error as { code?: string; cause?: { code?: string } };
    // Backward compatible before this additive migration; other failures fail closed.
    if ((cause.code ?? cause.cause?.code) === "42P01") return { available: false, rows: [] as typeof moduleSettings.$inferSelect[] };
    throw new Error("Module lifecycle state unavailable");
  }
});
export async function moduleEnabled(module: ModuleManifest) {
  try { const settings = await readModuleSettings(); return effectiveModuleEnabled(module, settings.rows.find(row => row.moduleId === module.id)?.enabled); }
  catch { return false; }
}
