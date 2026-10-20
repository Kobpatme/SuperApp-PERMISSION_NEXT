import { config } from "dotenv";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { hash } from "@node-rs/argon2";
import postgres from "postgres";
import { databaseSslOptions } from "../src/lib/database-ssl.mjs";

config({ path: ".env.local" });
config();

async function readHidden(label) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") return "";
  stdout.write(label);
  stdin.setRawMode(true);
  stdin.resume();
  return new Promise((resolve, reject) => {
    let value = "";
    const finish = (error) => {
      stdin.off("data", onData); stdin.setRawMode(false); stdin.pause(); stdout.write("\n");
      if (error) reject(error); else resolve(value);
    };
    const onData = (chunk) => {
      for (const char of String(chunk)) {
        if (char === "\u0003") { finish(new Error("Cancelled")); return; }
        if (char === "\r" || char === "\n") { finish(); return; }
        if (char === "\b" || char === "\u007f") { value = value.slice(0, -1); continue; }
        if (char >= " ") value += char;
      }
    };
    stdin.on("data", onData);
  });
}

async function credentials() {
  let email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  let displayName = process.env.INITIAL_ADMIN_DISPLAY_NAME?.trim();
  if (stdin.isTTY && (!email || !displayName)) {
    const prompt = createInterface({ input: stdin, output: stdout });
    try {
      email ||= (await prompt.question("Admin email: ")).trim().toLowerCase();
      displayName ||= (await prompt.question("Display name: ")).trim();
    } finally { prompt.close(); }
  }
  const password = process.env.INITIAL_ADMIN_PASSWORD || await readHidden("Temporary password (hidden): ");
  if (!email || !/^\S+@\S+\.\S+$/.test(email) || email.length > 254 || !displayName || displayName.length < 2 || displayName.length > 180) {
    throw new Error("INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_DISPLAY_NAME are required");
  }
  // Same existing local-auth password policy and Argon2id parameters.
  const common = new Set(["password", "password123", "1234567890", "qwerty123", "welcome123", "admin123"]);
  if (password.length < 12 || password.length > 256 || !/[a-zA-Z]/.test(password) || !/\d/.test(password) || !/[^a-zA-Z0-9]/.test(password) || common.has(password.toLowerCase())) {
    throw new Error("INITIAL_ADMIN_PASSWORD must be 12-256 characters with letters, numbers and a symbol");
  }
  return { email, displayName, password };
}

async function main() {
  if (!process.env.DATABASE_URL_MIGRATE) throw new Error("DATABASE_URL_MIGRATE is required for first-admin bootstrap");
  const sql = postgres(process.env.DATABASE_URL_MIGRATE, { ...databaseSslOptions(), max: 1, prepare: false });
  try {
    const created = await sql.begin(async tx => {
      await tx`select pg_advisory_xact_lock(hashtext('permission-next:first-admin'))`;
      // Any previous admin assignment blocks bootstrap, even suspended/expired.
      // Recovery is an operator procedure; bootstrap never resets an account.
      const [existing] = await tx`select 1 from public.user_role_assignments a join public.roles r on r.id=a.role_id where r.code='platform_admin' limit 1`;
      if (existing) return false;
      const [role] = await tx`select id from public.roles where code='platform_admin'`;
      const [position] = await tx`select id from public.positions where code='platform_admin'`;
      if (!role || !position) throw new Error("Apply migrations before bootstrap");
      const { email, displayName, password } = await credentials();
      const passwordHash = await hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 });
      // No UPSERT: never promote or reset an existing email.
      const [user] = await tx`insert into public.profiles(email,display_name,position_id,status) values(${email},${displayName},${position.id},'active') returning id`;
      await tx`insert into public.local_credentials(user_id,password_hash,must_change_password) values(${user.id},${passwordHash},true)`;
      const [assignment] = await tx`insert into public.user_role_assignments(user_id,role_id,created_by) values(${user.id},${role.id},${user.id}) returning id`;
      await tx`insert into public.data_scope_grants(assignment_id,scope_type) values(${assignment.id},'ALL')`;
      await tx`insert into public.audit_logs(actor_id,module_id,action,entity_type,entity_id,metadata) values(${user.id},'core','auth.bootstrap','profile',${user.id},'{"firstAdmin":true}'::jsonb)`;
      return true;
    });
    stdout.write(created ? "First administrator created. Sign in, change the temporary password and remove INITIAL_ADMIN_* from the environment.\n" : "An administrator already exists; no changes made.\n");
  } finally { await sql.end(); }
}

main().catch(error => {
  // Driver messages can contain connection information. Never output SQL/URLs.
  process.stderr.write(error.code ? `Bootstrap failed (${error.code}).\n` : `Bootstrap failed: ${error.message}\n`);
  process.exitCode = 1;
});
