import { getAccessContext } from "@/lib/access";
import { buildDashboardSnapshot } from "@/lib/dashboard-server";
import { modules } from "@/lib/module-registry";
import type { AccessContext } from "@/lib/access";
import type { ModuleId } from "@/lib/module-registry";
import { requireApiIdentity } from "@/lib/request-context";

export const dynamic = "force-dynamic";

export async function GET() {
  const identity = await requireApiIdentity();
  if (!identity.ok) return identity.response;
  const access = await Promise.all(modules.map((module) => getAccessContext(module.id)));
  const accessByModule = Object.fromEntries(modules.map((module, index) => [module.id, access[index]])) as Record<ModuleId, AccessContext>;
  const snapshot = await buildDashboardSnapshot(accessByModule);
  return Response.json(snapshot, { headers: { "Cache-Control": "private, no-store" } });
}
