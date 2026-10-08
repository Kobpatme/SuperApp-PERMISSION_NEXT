"use client";
/** Existing API clients navigate on 401 instead of leaving a revoked account on a stale screen. */
export async function sessionFetch(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  if (response.status === 401) {
    const reason = response.headers.get("x-pn-session-reason") === "superseded" ? "superseded" : "expired";
    window.location.replace(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}&reason=${reason}`);
  }
  return response;
}
