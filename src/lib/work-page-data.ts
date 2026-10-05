import "server-only";
import { getAccessContext } from "@/lib/access";
import { getWorkReadModel } from "@/lib/work-read-model";
import { parseWorkFilters } from "@/lib/work-query";
export async function loadWorkPage(permission?: string, params: Record<string, string | string[] | undefined> = {}) {
  const access = await getAccessContext("work");
  if (!access.allowed || (permission && !access.permissions.includes(permission))) return null;
  try { const filters = parseWorkFilters(params); return { access, filters, model: await getWorkReadModel(access, filters, permission === "work.report.read" ? permission : undefined) }; }
  catch { return null; }
}
