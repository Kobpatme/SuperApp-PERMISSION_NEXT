import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { getEnvironmentReadiness } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const readiness = getEnvironmentReadiness();
  let databaseReachable: boolean | null = null;
  if (readiness.database) {
    try {
      await getDb().execute(sql`select 1`);
      databaseReachable = true;
    } catch {
      databaseReachable = false;
    }
  }
  const ready = readiness.productionReady && databaseReachable !== false;
  return Response.json(
    { status: ready ? "ready" : "degraded", checks: { ...readiness, databaseReachable } },
    { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
