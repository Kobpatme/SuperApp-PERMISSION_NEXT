import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config();
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const email = String(process.argv[2] || "").trim().toLowerCase();
if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Usage: node scripts/verify-admin.mjs user@example.com");
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
try {
  const [account] = await sql`
    select p.email,p.status,p.display_name,pos.name as position,c.must_change_password,
      count(distinct rp.permission_code)::int as permission_count
    from public.profiles p
    join public.local_credentials c on c.user_id=p.id
    left join public.positions pos on pos.id=p.position_id
    left join public.user_role_assignments ura on ura.user_id=p.id and ura.valid_until is null
    left join public.role_permissions rp on rp.role_id=ura.role_id
    where lower(p.email)=lower(${email})
    group by p.email,p.status,p.display_name,pos.name,c.must_change_password`;
  if (!account) throw new Error("Account not found");
  process.stdout.write(`${JSON.stringify(account)}\n`);
} finally { await sql.end(); }
