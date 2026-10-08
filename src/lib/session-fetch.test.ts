import { afterEach, expect, it, vi } from "vitest";
import { sessionFetch } from "@/lib/session-fetch";
afterEach(() => vi.unstubAllGlobals());
it.each(["superseded", "expired"])("navigates API clients to the safe %s login reason", async reason => {
  const replace = vi.fn(); vi.stubGlobal("window", { location: { pathname: "/work", search: "?view=mine", replace } });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401, headers: { "x-pn-session-reason": reason } })));
  expect((await sessionFetch("/api/work/export")).status).toBe(401);
  expect(replace).toHaveBeenCalledWith(`/login?next=%2Fwork%3Fview%3Dmine&reason=${reason}`);
});
it("does not navigate on an authorized response", async () => {
  const replace = vi.fn(); vi.stubGlobal("window", { location: { replace } }); vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
  await sessionFetch("/api/work/export"); expect(replace).not.toHaveBeenCalled();
});
