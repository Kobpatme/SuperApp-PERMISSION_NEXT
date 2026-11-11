import { headers } from "next/headers";
import { getCurrentUser, getSessionFailureReason, type CurrentUser } from "@/lib/auth";
import { SessionUnavailableError } from "./session-errors";

export type RequestContext = {
  requestId: string;
  correlationId: string;
  userId: string;
  email: string;
};

export class AuthenticationError extends Error {
  readonly status = 401;
  constructor() {
    super("Authentication required");
    this.name = "AuthenticationError";
  }
}

export async function requireRequestContext(): Promise<RequestContext> {
  const [user, requestHeaders] = await Promise.all([getCurrentUser(), headers()]);
  if (!user) throw new AuthenticationError();
  const incomingRequestId = requestHeaders.get("x-request-id")?.trim();
  const requestId = incomingRequestId && incomingRequestId.length <= 128 ? incomingRequestId : crypto.randomUUID();
  const incomingCorrelationId = requestHeaders.get("x-correlation-id")?.trim();
  return {
    requestId,
    correlationId: incomingCorrelationId && incomingCorrelationId.length <= 128 ? incomingCorrelationId : requestId,
    userId: user.id,
    email: user.email ?? "",
  };
}

export type ApiIdentityResult = { ok: true; user: CurrentUser } | { ok: false; response: Response };

export async function authenticationRequiredResponse(body: Record<string, string> = { code: "AUTHENTICATION_REQUIRED", error: "Authentication required" }) {
  return Response.json(body, { status: 401, headers: { "Cache-Control": "no-store", "X-PN-Session-Reason": await getSessionFailureReason() } });
}

export async function requireApiIdentity(): Promise<ApiIdentityResult> {
  let user;
  try { user = await getCurrentUser(); }
  catch (error) {
    if (!(error instanceof SessionUnavailableError)) throw error;
    return { ok: false, response: Response.json({ code: "SESSION_UNAVAILABLE", message: error.message }, { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "5" } }) };
  }
  if (!user) return { ok: false, response: await authenticationRequiredResponse() };
  if (user.mustChangePassword) return { ok: false, response: Response.json({ code: "PASSWORD_CHANGE_REQUIRED", error: "Password change required" }, { status: 403, headers: { "Cache-Control": "no-store" } }) };
  return { ok: true, user };
}
