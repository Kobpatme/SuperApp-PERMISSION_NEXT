import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url().optional().or(z.literal("")),
  GUARANTEE_STORAGE_DIR: z.string().optional().or(z.literal("")),
  PERMISSION_NAS_BRIDGE_URL: z.string().url().optional().or(z.literal("")),
  PERMISSION_NAS_BRIDGE_SECRET: z.string().min(32).optional().or(z.literal("")),
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
    GUARANTEE_STORAGE_DIR: process.env.GUARANTEE_STORAGE_DIR,
    PERMISSION_NAS_BRIDGE_URL: process.env.PERMISSION_NAS_BRIDGE_URL,
    PERMISSION_NAS_BRIDGE_SECRET: process.env.PERMISSION_NAS_BRIDGE_SECRET,
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
