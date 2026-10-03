import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ sessionCookieName: "permission_next_session" }));

import { proxy } from "./proxy";

describe("proxy authentication boundary", () => {
  it("redirects browser pages with a safe internal next path", () => {
    const response = proxy(new NextRequest("http://localhost:3000/buildings?status=active"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login?next=%2Fbuildings%3Fstatus%3Dactive");
  });

  it("returns JSON 401 for unauthenticated API requests", async () => {
    const response = proxy(new NextRequest("http://localhost:3000/api/dashboard"));
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ code: "AUTHENTICATION_REQUIRED", error: "Authentication required" });
  });

  it("does not guard health checks", () => {
    const response = proxy(new NextRequest("http://localhost:3000/api/health"));
    expect(response.status).toBe(200);
  });
  it("overwrites a forged return header with the parsed local URL",()=>{
    const response=proxy(new NextRequest("http://localhost:3000/work?view=mine",{headers:{cookie:"permission_next_session=fixture","x-pn-request-path":"//evil.example"}}));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-request-x-pn-request-path")).toBe("/work?view=mine");
    expect(response.headers.get("x-pn-request-path")).toBeNull();
  });
  it.each(["/icon.png","/apple-icon.png","/manifest.webmanifest","/robots.txt"])("allows only public metadata asset %s",path=>{expect(proxy(new NextRequest(`http://localhost:3000${path}`)).status).toBe(200);});
});
