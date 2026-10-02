import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url().optional().or(z.literal("")),
  LONGDO_MAP_API_KEY: z.string().trim().max(256).optional().or(z.literal("")),
  GUARANTEE_STORAGE_DIR: z.string().optional().or(z.literal("")),
  PERMISSION_NAS_BRIDGE_URL: z.string().url().optional().or(z.literal("")),
  PERMISSION_NAS_BRIDGE_SECRET: z.string().min(32).optional().or(z.literal("")),
  TRUSTED_PROXY_COUNT: z.coerce.number().int().min(0).default(0),
  AUTH_IDLE_TIMEOUT_MINUTES: z.coerce.number().int().min(5).max(720).default(30),
  AUTH_ABSOLUTE_TIMEOUT_HOURS: z.coerce.number().int().min(1).max(72).default(12),
});

export function requireDatabaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL is required for database access");
  return value;
}

export function getServerEnv() {
  const result = serverEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    LONGDO_MAP_API_KEY: process.env.LONGDO_MAP_API_KEY,
    GUARANTEE_STORAGE_DIR: process.env.GUARANTEE_STORAGE_DIR,
    PERMISSION_NAS_BRIDGE_URL: process.env.PERMISSION_NAS_BRIDGE_URL,
    PERMISSION_NAS_BRIDGE_SECRET: process.env.PERMISSION_NAS_BRIDGE_SECRET,
    TRUSTED_PROXY_COUNT: process.env.TRUSTED_PROXY_COUNT,
    AUTH_IDLE_TIMEOUT_MINUTES: process.env.AUTH_IDLE_TIMEOUT_MINUTES,
    AUTH_ABSOLUTE_TIMEOUT_HOURS: process.env.AUTH_ABSOLUTE_TIMEOUT_HOURS,
  });
  if (!result.success) throw new Error(`Invalid server environment: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
  return result.data;
}

export function getEnvironmentReadiness() {
  const serverEnv = getServerEnv();
  return {
    identity: Boolean(serverEnv.DATABASE_URL),
    database: Boolean(serverEnv.DATABASE_URL),
    nasBridge: Boolean(serverEnv.PERMISSION_NAS_BRIDGE_URL && serverEnv.PERMISSION_NAS_BRIDGE_SECRET),
    productionReady: serverEnv.NODE_ENV !== "production" || Boolean(
      serverEnv.DATABASE_URL && serverEnv.GUARANTEE_STORAGE_DIR,
    ),
  };
}
