import { getAccessContext } from "@/lib/access";
import { getMicrosoft365ConfigStatus } from "@/lib/microsoft365/config";
import { MicrosoftGraphError } from "@/lib/microsoft365/graph";
import { checkSharePointReadiness } from "@/lib/microsoft365/sharepoint";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await getAccessContext("buildings");
  if (!access.allowed || access.role !== "admin") {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const configuration = getMicrosoft365ConfigStatus();
  if (!configuration.configured) {
    return Response.json({ ok: false, stage: "configuration", configuration }, { status: 503 });
  }

  try {
    const sharePoint = await checkSharePointReadiness();
    return Response.json({ ok: true, stage: "connected", sharePoint }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const status = error instanceof MicrosoftGraphError ? error.status : 502;
    return Response.json({
      ok: false,
      stage: status === 401 ? "authentication" : status === 403 ? "authorization" : "resource",
      error: error instanceof Error ? error.message : "SharePoint readiness check failed",
    }, { status: status >= 400 && status < 600 ? status : 502 });
  }
}

