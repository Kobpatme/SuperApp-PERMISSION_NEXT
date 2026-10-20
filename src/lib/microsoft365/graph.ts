import "server-only";
import { getMicrosoft365Config } from "@/lib/microsoft365/config";

const GRAPH_ROOT = "https://graph.microsoft.com/v1.0";

type TokenResponse = {
  access_token: string;
  expires_in: number;
};

let tokenCache: { accessToken: string; expiresAt: number } | undefined;

async function getApplicationAccessToken() {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 60_000) return tokenCache.accessToken;

  const config = getMicrosoft365Config();
  const body = new URLSearchParams({
    client_id: config.M365_CLIENT_ID,
    client_secret: config.M365_CLIENT_SECRET,
    grant_type: "client_credentials",
    scope: "https://graph.microsoft.com/.default",
  });

  const response = await fetch(`https://login.microsoftonline.com/${config.M365_TENANT_ID}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Microsoft identity token request failed (${response.status})`);
  }

  const token = await response.json() as TokenResponse;
  tokenCache = {
    accessToken: token.access_token,
    expiresAt: now + Math.max(token.expires_in - 60, 60) * 1000,
  };
  return tokenCache.accessToken;
}

export class MicrosoftGraphError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "MicrosoftGraphError";
  }
}

export async function graphGet<T>(path: string): Promise<T> {
  if (!path.startsWith("/")) throw new Error("Microsoft Graph path must start with /");
  const accessToken = await getApplicationAccessToken();
  const response = await fetch(`${GRAPH_ROOT}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    let graphMessage = "";
    try {
      const payload = await response.json() as { error?: { code?: string; message?: string } };
      graphMessage = [payload.error?.code, payload.error?.message].filter(Boolean).join(": ");
    } catch {
      // Do not include response bodies that may contain tenant data.
    }
    throw new MicrosoftGraphError(response.status, graphMessage || `Microsoft Graph request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

