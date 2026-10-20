import { readFile } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const defaultSourceDir = "D:\\WebApp\\SLA_Preformance\\MAXIWA KPI";
const allowedRoots = new Set(["config.js", "favicon.ico", "favicon.svg", "css", "js"]);
const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8", ".ico": "image/x-icon", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml",
};

export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  const { path } = await context.params;
  if (!path.length || !allowedRoots.has(path[0]) || path.some((part) => part === ".." || part.includes("/") || part.includes("\\"))) {
    return new Response("Not found", { status: 404 });
  }
  const distRoot = normalize(join(process.env.MAXIWA_LEGACY_DIR || defaultSourceDir, "dist"));
  const filePath = normalize(join(distRoot, ...path));
  if (filePath !== distRoot && !filePath.startsWith(`${distRoot}${sep}`)) return new Response("Forbidden", { status: 403 });
  try {
    const file = await readFile(filePath);
    const contents: BodyInit = path.join("/") === "config.js"
      ? 'window.API_BASE = "/legacy/maxiwa/api";\n'
      : new Blob([new Uint8Array(file)]);
    return new Response(contents, {
      headers: {
        "Content-Type": contentTypes[extname(filePath).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
