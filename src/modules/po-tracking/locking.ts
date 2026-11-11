import { sql } from "drizzle-orm";
import type { DatabaseTransaction } from "@/db";
/** Online writers share the maintenance gate; unrelated PO numbers never block one another. */
export async function lockPoNumbers(tx: DatabaseTransaction, numbers: string[]) {
  await tx.execute(sql`set local lock_timeout = '5s'`);
  await tx.execute(sql`set local statement_timeout = '30s'`);
  await tx.execute(sql`select pg_advisory_xact_lock_shared(hashtextextended('po-tracking-maintenance',0))`);
  for (const number of [...new Set(numbers)].sort()) await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${'po-number:' + number},0))`);
}
