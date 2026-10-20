import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedAssets = new Set(["firebase-config.js", "firebase-client.js"]);
const defaultSourceDir = "D:\\WebApp\\ระบบขอคืนเงินประกัน_V2";

export async function GET(_request: Request, context: { params: Promise<{ asset: string }> }) {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  const { asset } = await context.params;
  if (!allowedAssets.has(asset)) return new Response("Not found", { status: 404 });
  const sourceDir = process.env.GUARANTEE_LEGACY_DIR || defaultSourceDir;
  // This compatibility route intentionally reads from a configured directory
  // outside the Next.js bundle. The asset allowlist above prevents path traversal.
  const contents = await readFile(join(/* turbopackIgnore: true */ sourceDir, asset), "utf8");
  return new Response(contents, { headers: { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-store" } });
}
