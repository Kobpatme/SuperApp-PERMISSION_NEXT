import { searchWorkspace } from "@/lib/workspace-search-server";
import { requireApiIdentity } from "@/lib/request-context";

export async function GET(request: Request) {
  const identity = await requireApiIdentity();
  if (!identity.ok) return identity.response;
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") || "").trim().slice(0, 200);
  const data = query.length < 2 ? { results: [], ready: true, partial: false } : await searchWorkspace(query);
  return Response.json(data, { headers: { "Cache-Control": "private, no-store" } });
}
