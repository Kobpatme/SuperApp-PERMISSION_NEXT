import { readFileSync } from "node:fs";

// One transport policy for Core, Car, Duct, migrations and bootstrap. When unset,
// preserve existing postgres-js URL/PGSSL behaviour outside the Compose recipe.
export function databaseSslOptions(env = process.env) {
  const mode = env.DATABASE_SSL?.trim();
  const caPath = env.DATABASE_SSL_CA_PATH?.trim();
  if (caPath && mode !== "verify-full") throw new Error("DATABASE_SSL_CA_PATH requires DATABASE_SSL=verify-full");
  if (!mode) return {};
  if (mode === "disable") return { ssl: false };
  if (mode === "require") return { ssl: { rejectUnauthorized: false } };
  if (mode === "verify-full") {
    return { ssl: { rejectUnauthorized: true, ...(caPath ? { ca: readFileSync(caPath, "utf8") } : {}) } };
  }
  throw new Error("DATABASE_SSL must be disable, require or verify-full");
}
