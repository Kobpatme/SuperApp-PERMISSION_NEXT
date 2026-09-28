import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";

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
