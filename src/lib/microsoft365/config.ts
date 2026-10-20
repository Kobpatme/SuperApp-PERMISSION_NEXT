import { z } from "zod";

const optionalId = z.string().uuid().optional().or(z.literal(""));

const microsoft365EnvSchema = z.object({
  M365_TENANT_ID: z.string().uuid(),
  M365_CLIENT_ID: z.string().uuid(),
  M365_CLIENT_SECRET: z.string().min(1),
  SHAREPOINT_HOSTNAME: z.string().min(1).regex(/^[a-z0-9.-]+$/i),
  SHAREPOINT_SITE_PATH: z.string().startsWith("/sites/"),
  SHAREPOINT_DOCUMENT_LIBRARY: z.string().min(1).default("Shared Documents"),
  SHAREPOINT_ROOT_FOLDER: z.string().min(1).default("Permission Next"),
  SHAREPOINT_SITE_ID: optionalId,
  SHAREPOINT_DRIVE_ID: optionalId,
});

export type Microsoft365Config = z.infer<typeof microsoft365EnvSchema>;

export type Microsoft365ConfigStatus = {
  configured: boolean;
  missing: string[];
  invalid: string[];
};

const requiredKeys = [
  "M365_TENANT_ID",
  "M365_CLIENT_ID",
  "M365_CLIENT_SECRET",
  "SHAREPOINT_HOSTNAME",
  "SHAREPOINT_SITE_PATH",
] as const;

function configInput() {
  return {
    M365_TENANT_ID: process.env.M365_TENANT_ID,
    M365_CLIENT_ID: process.env.M365_CLIENT_ID,
    M365_CLIENT_SECRET: process.env.M365_CLIENT_SECRET,
    SHAREPOINT_HOSTNAME: process.env.SHAREPOINT_HOSTNAME,
    SHAREPOINT_SITE_PATH: process.env.SHAREPOINT_SITE_PATH,
    SHAREPOINT_DOCUMENT_LIBRARY: process.env.SHAREPOINT_DOCUMENT_LIBRARY || "Shared Documents",
    SHAREPOINT_ROOT_FOLDER: process.env.SHAREPOINT_ROOT_FOLDER || "Permission Next",
    SHAREPOINT_SITE_ID: process.env.SHAREPOINT_SITE_ID,
    SHAREPOINT_DRIVE_ID: process.env.SHAREPOINT_DRIVE_ID,
  };
}

export function getMicrosoft365ConfigStatus(): Microsoft365ConfigStatus {
  const input = configInput();
  const missing = requiredKeys.filter((key) => !input[key]);
  if (missing.length) return { configured: false, missing: [...missing], invalid: [] };

  const parsed = microsoft365EnvSchema.safeParse(input);
  if (parsed.success) return { configured: true, missing: [], invalid: [] };

  return {
    configured: false,
    missing: [],
    invalid: [...new Set(parsed.error.issues.map((issue) => String(issue.path[0] || "unknown")))],
  };
}

export function getMicrosoft365Config(): Microsoft365Config {
  const status = getMicrosoft365ConfigStatus();
  if (!status.configured) {
    const details = [...status.missing.map((key) => `${key} is missing`), ...status.invalid.map((key) => `${key} is invalid`)];
    throw new Error(`Microsoft 365 configuration is not ready: ${details.join(", ")}`);
  }
  return microsoft365EnvSchema.parse(configInput());
}

