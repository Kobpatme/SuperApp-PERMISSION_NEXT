import { config } from "dotenv";
import { createInterface } from "node:readline/promises";
import { randomBytes } from "node:crypto";
import { stdin, stdout } from "node:process";
import { hash } from "@node-rs/argon2";
import postgres from "postgres";

config({ path: ".env.local" });
config();

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const prompt = createInterface({ input: stdin, output: stdout });
const email = (await prompt.question("Admin email: ")).trim().toLowerCase();
const displayName = (await prompt.question("Display name: ")).trim();
prompt.close();
if (!/^\S+@\S+\.\S+$/.test(email) || displayName.length < 2) throw new Error("Invalid administrator email or display name");

async function readHidden(label) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") return "";
  stdout.write(label);
  stdin.setRawMode(true);
  stdin.resume();
  return new Promise((resolve, reject) => {
    let value = "";
    const finish = () => { stdin.off("data", onData); stdin.setRawMode(false); stdin.pause(); stdout.write("\n"); resolve(value); };
    const onData = (chunk) => {
      const text = String(chunk);
      for (const char of text) {
        if (char === "\u0003") { stdin.setRawMode(false); reject(new Error("Cancelled")); return; }
        if (char === "\r" || char === "\n") { finish(); return; }
        if (char === "\b" || char === "\u007f") { if (value) { value = value.slice(0, -1); stdout.write("\b \b"); } continue; }
        if (char >= " ") { value += char; stdout.write("*"); }
      }
    };
    stdin.on("data", onData);
  });
}

const suppliedPassword = await readHidden("Temporary password (leave blank to generate): ");
const commonPasswords = new Set(["password", "password123", "1234567890", "qwerty123", "welcome123", "admin123"]);
if (suppliedPassword && (suppliedPassword.length < 12 || suppliedPassword.length > 256 || !/[a-zA-Z]/.test(suppliedPassword) || !/\d/.test(suppliedPassword) || !/[^a-zA-Z0-9]/.test(suppliedPassword) || commonPasswords.has(suppliedPassword.toLocaleLowerCase("en-US")))) {
  throw new Error("Temporary password must be at least 12 characters and include letters, numbers and a symbol");
}
const password = suppliedPassword || `${randomBytes(18).toString("base64url")}!9a`;
const passwordHash = await hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 });
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
try {
  await sql.begin(async (tx) => {
    const [role] = await tx`select id from public.roles where code='platform_admin'`;
    const [position] = await tx`select id from public.positions where code='platform_admin'`;
    if (!role || !position) throw new Error("Run npm run db:migrate before bootstrap");
    const [user] = await tx`insert into public.profiles(email,display_name,position_id,status) values(${email},${displayName},${position.id},'active')
      on conflict(lower(email)) do update set display_name=excluded.display_name,position_id=excluded.position_id,status='active' returning id`;
    await tx`insert into public.local_credentials(user_id,password_hash,must_change_password) values(${user.id},${passwordHash},true)
      on conflict(user_id) do update set password_hash=excluded.password_hash,must_change_password=true,failed_attempts=0,locked_until=null,updated_at=now()`;
    let [assignment] = await tx`select id from public.user_role_assignments where user_id=${user.id} and role_id=${role.id} and valid_until is null limit 1`;
    if (!assignment) [assignment] = await tx`insert into public.user_role_assignments(user_id,role_id,created_by) values(${user.id},${role.id},${user.id}) returning id`;
    const [scope] = await tx`select id from public.data_scope_grants where assignment_id=${assignment.id} and scope_type='ALL' limit 1`;
    if (!scope) await tx`insert into public.data_scope_grants(assignment_id,scope_type) values(${assignment.id},'ALL')`;
  });
  stdout.write(suppliedPassword
    ? "Platform administrator is ready with the supplied temporary password. Sign in and change it immediately.\n"
    : `Platform administrator is ready. Temporary password: ${password}\nSign in and change it immediately; it will not be shown again.\n`);
} finally { await sql.end(); }
