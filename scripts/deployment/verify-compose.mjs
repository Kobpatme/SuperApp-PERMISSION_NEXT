// Destructive fixture mutations are allowed only against the internal Compose
// db service and an empty app database. Never point this at a real environment.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readdir } from "node:fs/promises";
import { createServer, request as proxyRequest } from "node:http";
import postgres from "postgres";
import { chromium } from "@playwright/test";

function command(script, env = process.env) {
  const output = execFileSync(process.execPath, [script], { env, encoding: "utf8", windowsHide: true });
  return output;
}
async function denied(db, query) {
  await assert.rejects(() => db.unsafe(query), error => error.code === "42501");
}
async function main() {
  const operator = new URL(process.env.DATABASE_URL_MIGRATE);
  const runtime = new URL(process.env.DATABASE_URL);
  const origin = new URL(process.env.DEPLOY_TEST_BASE_URL);
  if (process.env.COMPOSE_LOCAL_DATABASE !== "1" || operator.hostname !== "db" || runtime.hostname !== "db" || operator.pathname !== runtime.pathname || origin.hostname !== "app") {
    throw new Error("Disposable internal Compose fixture required");
  }
  const db = postgres(operator.href, { max: 1, prepare: false });
  const core = postgres(runtime.href, { max: 1, prepare: false });
  const car = postgres(process.env.CAR_BOOKING_DATABASE_URL, { max: 1, prepare: false });
  const duct = postgres(process.env.DUCT_RENTAL_DATABASE_URL, { max: 1, prepare: false });
  let browser;
  let proxy;
  try {
    assert.equal((await db`select count(*)::int as count from public.profiles`)[0].count, 0, "Use a fresh fixture; existing profiles were not changed");
    const expected = (await readdir("supabase/migrations")).filter(name => /^\d+.*\.sql$/.test(name)).sort();
    const applied = (await db`select name from public.schema_migrations order by name`).map(row => row.name);
    assert.deepEqual(applied, expected);
    const ledger = await db`select * from public.schema_migrations order by name`;
    command("scripts/migrate-postgres.mjs");
    assert.deepEqual(await db`select * from public.schema_migrations order by name`, ledger, "Migration re-run changed the ledger");
    // Assert the actual three application connections are not owner/operator
    // accounts, and their private business data does not cross DB boundaries.
    for (const client of [core, car, duct]) {
      const [role] = await client`select r.rolsuper,r.rolbypassrls,r.rolcreatedb,r.rolcreaterole, exists(select 1 from pg_class c where c.relnamespace='public'::regnamespace and pg_has_role(current_user,c.relowner,'USAGE')) as owns_objects from pg_roles r where rolname=current_user`;
      assert.deepEqual(Object.values(role), [false, false, false, false, false]);
      await denied(client, "create table public.forbidden_ddl(id integer)");
      await denied(client, "alter table public.profiles add column forbidden_column integer");
      await denied(client, "truncate public.profiles cascade");
    }
    await denied(core, "select * from public.car_booking_bookings");
    await denied(core, "select * from public.duct_rental_requests");
    await denied(car, "select * from public.local_credentials");
    await denied(duct, "select * from public.local_credentials");
    await denied(core, "update public.audit_logs set action='forbidden'");
    await denied(core, "delete from public.activity_events");
    await denied(core, "delete from public.schema_migrations");
    await denied(core, "grant permission_core_runtime to permission_car_booking_runtime");
    console.log(`${expected.length} migrations, harmless migration re-run and constrained Core/Car/Duct roles verified`);

    const email = `docker-${randomBytes(6).toString("hex")}@example.test`;
    const temporaryPassword = randomBytes(24).toString("base64url") + "!9a";
    const changedPassword = randomBytes(24).toString("base64url") + "!9a";
    const bootstrapEnv = { ...process.env, INITIAL_ADMIN_EMAIL: email, INITIAL_ADMIN_DISPLAY_NAME: "ผู้ดูแลทดสอบ Docker", INITIAL_ADMIN_PASSWORD: temporaryPassword };
    command("scripts/bootstrap-admin.mjs", bootstrapEnv);
    const before = await db`select p.id,p.email,c.password_hash,c.must_change_password,c.updated_at from public.profiles p join public.local_credentials c on c.user_id=p.id order by p.id`;
    // No credentials needed on re-run; an existing admin is a strict no-op.
    command("scripts/bootstrap-admin.mjs", { ...process.env, INITIAL_ADMIN_EMAIL: "", INITIAL_ADMIN_DISPLAY_NAME: "", INITIAL_ADMIN_PASSWORD: "" });
    assert.deepEqual(await db`select p.id,p.email,c.password_hash,c.must_change_password,c.updated_at from public.profiles p join public.local_credentials c on c.user_id=p.id order by p.id`, before);
    assert.equal(before.length, 1);
    assert.equal(before[0].must_change_password, true);
    const health = await fetch(new URL("/api/health", origin));
    assert.equal(health.status, 200);
    const body = await health.json();
    assert.equal(body.status, "ready");
    assert.ok(body.build.builtAt);
    if (process.env.APP_COMMIT_SHA) assert.equal(body.build.shortCommit, process.env.APP_COMMIT_SHA.slice(0, 12).toLowerCase());

    // Chromium accepts the app's unchanged Secure cookies on localhost, as in
    // the repository's existing browser tests. A fixture-only streaming proxy
    // maps localhost to the internal app; production still requires IT HTTPS.
    proxy = createServer((request, response) => {
      const upstream = proxyRequest(new URL(request.url, origin), { method: request.method, headers: request.headers }, remote => {
        response.writeHead(remote.statusCode, remote.headers); remote.pipe(response);
      });
      upstream.on("error", () => { response.writeHead(502); response.end(); });
      request.pipe(upstream);
    });
    await new Promise((resolve, reject) => { proxy.once("error", reject); proxy.listen(0, "127.0.0.1", resolve); });
    const browserOrigin = new URL(`http://localhost:${proxy.address().port}`);
    browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
    async function context() {
      const ctx = await browser.newContext();
      ctx.setDefaultTimeout(30000); ctx.setDefaultNavigationTimeout(45000);
      await ctx.route("**/*", async route => {
        if (new URL(route.request().url()).origin !== browserOrigin.origin) return route.abort();
        await route.continue();
      });
      return ctx;
    }
    async function login(page, password, destination) {
      await page.goto(new URL("/login", browserOrigin).href);
      await page.locator('input[name="email"]').fill(email);
      await page.locator('input[name="password"]').fill(password);
      await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
      await page.waitForURL(url => url.pathname === destination);
    }
    const first = await context(); const firstPage = await first.newPage();
    await login(firstPage, temporaryPassword, "/change-password");
    await firstPage.locator('input[name="password"]').fill(changedPassword);
    await firstPage.locator('input[name="confirm"]').fill(changedPassword);
    await firstPage.getByRole("button", { name: "บันทึกและเข้าใช้งาน", exact: true }).click();
    await firstPage.waitForURL(url => url.pathname === "/");
    for (const route of ["/", "/work", "/buildings", "/guarantees", "/admin", "/car-booking", "/duct-rental"]) {
      const response = await firstPage.goto(new URL(route, browserOrigin).href);
      assert.ok(response && response.status() < 500, `Module server error: ${route}`);
      assert.notEqual(new URL(firstPage.url()).pathname, "/login", `Lost session at ${route}`);
    }
    const oldToken = (await first.cookies()).find(cookie => cookie.name === "pn_session")?.value;
    assert.ok(oldToken);
    const second = await context(); const secondPage = await second.newPage();
    await login(secondPage, changedPassword, "/");
    const rejected = await fetch(new URL("/api/work/export", origin), { headers: { cookie: `pn_session=${oldToken}` }, redirect: "manual" });
    assert.equal(rejected.status, 401, "Superseded token must fail server authentication");
    await first.close(); await second.close();
    console.log("First-admin no-op, forced password change, health/build identity, main pages and single-session rejection verified");
  } finally {
    await browser?.close();
    if (proxy) { proxy.closeAllConnections(); await new Promise(resolve => proxy.close(resolve)); }
    await Promise.all([db.end(), core.end(), car.end(), duct.end()]);
  }
}
main().catch(error => {
  console.error("Disposable Compose verification failed:", error.code || error.name);
  // Assertion messages contain only fixture expectations, no URLs/credentials.
  if (error.code === "ERR_ASSERTION") console.error(error.message);
  process.exitCode = 1;
});
