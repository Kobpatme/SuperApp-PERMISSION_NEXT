import { headers } from "next/headers";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";

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

export async function requireApiIdentity(): Promise<ApiIdentityResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, response: Response.json({ code: "AUTHENTICATION_REQUIRED", error: "Authentication required" }, { status: 401, headers: { "Cache-Control": "no-store" } }) };
  if (user.mustChangePassword) return { ok: false, response: Response.json({ code: "PASSWORD_CHANGE_REQUIRED", error: "Password change required" }, { status: 403, headers: { "Cache-Control": "no-store" } }) };
  return { ok: true, user };
}
