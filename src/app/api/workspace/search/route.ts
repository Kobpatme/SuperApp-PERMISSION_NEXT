import { getWorkspaceData } from "@/lib/workspace-server";
import { matchesQuery } from "@/lib/workspace-view";
import { getModule } from "@/lib/module-registry";
import { requireApiIdentity } from "@/lib/request-context";

export async function GET(request: Request) {
  const identity = await requireApiIdentity();
  if (!identity.ok) return identity.response;
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") || "").trim().slice(0, 200);
  const { snapshot, preview, allowedModuleIds } = await getWorkspaceData(url.searchParams.get("preview") === "1");
  const results = query.length < 2 ? [] : snapshot.items.filter((item) => allowedModuleIds.includes(item.moduleId) && matchesQuery(item, query)).slice(0, 20).map((item) => ({
    id: `${item.moduleId}:${item.id}`, title: item.title,
    description: [item.code, item.buildingName, item.statusLabel].filter(Boolean).join(" · "),
    href: `${getModule(item.moduleId)!.href}?${new URLSearchParams({ record: item.id, ...(preview ? { preview: "1" } : {}) })}`,
    moduleId: item.moduleId,
  }));
  return Response.json({ results, ready: snapshot.sources.some((source) => source.status === "ready"), partial: snapshot.sources.some((source) => allowedModuleIds.includes(source.moduleId) && source.status !== "ready") }, { headers: { "Cache-Control": "private, no-store" } });
}
