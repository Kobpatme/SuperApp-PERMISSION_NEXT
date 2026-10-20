import { getAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import { getMicrosoft365ConfigStatus } from "@/lib/microsoft365/config";
import { MicrosoftGraphError } from "@/lib/microsoft365/graph";
import { checkSharePointReadiness } from "@/lib/microsoft365/sharepoint";
import { requireApiIdentity } from "@/lib/request-context";

export const dynamic = "force-dynamic";

export async function GET() {
  const identity = await requireApiIdentity();
  if (!identity.ok) return identity.response;
  const access = await getAccessContext("buildings");
  if (!access.allowed || !isAuthorized(access.subject, "core.role.manage")) {
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
    console.error("SharePoint readiness check failed", error);
    return Response.json({
      ok: false,
      stage: status === 401 ? "authentication" : status === 403 ? "authorization" : "resource",
      error: "SharePoint readiness check failed",
    }, { status: status >= 400 && status < 600 ? status : 502 });
  }
}
