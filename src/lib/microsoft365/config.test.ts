import { afterEach, describe, expect, it } from "vitest";
import { getMicrosoft365ConfigStatus } from "@/lib/microsoft365/config";

const keys = [
  "M365_TENANT_ID",
  "M365_CLIENT_ID",
  "M365_CLIENT_SECRET",
  "SHAREPOINT_HOSTNAME",
  "SHAREPOINT_SITE_PATH",
] as const;

const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of keys) {
    const value = original[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("Microsoft 365 configuration", () => {
  it("reports missing values without exposing secrets", () => {
    for (const key of keys) delete process.env[key];
    const status = getMicrosoft365ConfigStatus();
    expect(status.configured).toBe(false);
    expect(status.missing).toEqual([...keys]);
    expect(JSON.stringify(status)).not.toContain("client_secret");
  });

  it("accepts the Permission Next SharePoint target", () => {
    process.env.M365_TENANT_ID = "8c72a69d-38fd-413a-911b-1defb46dfbec";
    process.env.M365_CLIENT_ID = "11111111-1111-4111-8111-111111111111";
    process.env.M365_CLIENT_SECRET = "test-only-secret";
    process.env.SHAREPOINT_HOSTNAME = "uihoffice.sharepoint.com";
    process.env.SHAREPOINT_SITE_PATH = "/sites/UIHOutsidePlantDatabaseDesign";
    expect(getMicrosoft365ConfigStatus()).toEqual({ configured: true, missing: [], invalid: [] });
  });
});

