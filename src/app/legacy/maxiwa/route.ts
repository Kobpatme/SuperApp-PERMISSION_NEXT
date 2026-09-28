import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getCurrentUser } from "@/lib/auth";
import { getAccessContext } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const defaultSourceDir = "D:\\WebApp\\SLA_Preformance\\MAXIWA KPI";

function sourceDir() {
  return process.env.MAXIWA_LEGACY_DIR || defaultSourceDir;
}

function scriptValue(value: string) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

const embeddedStyles = String.raw`
<style>
  html.super-app-embedded {
    --mx-bg:#f6f7fb; --mx-bg-soft:#f1f3f8; --mx-panel:#fff; --mx-panel-strong:#fff;
    --mx-surface:#f8f9fc; --mx-surface-hover:#f1f2f8; --mx-line:rgba(24,34,53,.09);
    --mx-line-strong:rgba(24,34,53,.14); --mx-text:#182235; --mx-muted:#748095;
    --mx-accent:#344158; --mx-accent-2:#6d5ce7; --mx-shadow:0 12px 34px rgba(24,34,53,.065);
  }
  html.super-app-embedded[data-theme="dark"] {
    --mx-bg:#101521; --mx-bg-soft:#0d121d; --mx-panel:#171e2c; --mx-panel-strong:#1b2332;
    --mx-surface:#1c2433; --mx-surface-hover:#242d3e; --mx-line:rgba(183,195,214,.12);
    --mx-line-strong:rgba(183,195,214,.2); --mx-text:#edf1f7; --mx-muted:#98a4b6;
    --mx-accent:#d9deea; --mx-accent-2:#9b8cf4; --mx-shadow:0 16px 42px rgba(0,0,0,.22);
  }
  .super-app-embedded body { background:linear-gradient(180deg,#f6f7fb,#f1f3f8); }
  .super-app-embedded #root > .min-h-screen { padding:18px 22px 32px !important; }
  .super-app-embedded #root > .min-h-screen > .max-w-\[1640px\] { max-width:1720px !important; }
  .super-app-embedded aside button.mx-btn.mx-btn-soft.w-full.mt-6 { display:none !important; }
  .super-app-embedded aside > div:first-child .mx-brand-mark { display:none !important; }
  .super-app-embedded button[aria-label*="mode"] { display:none !important; }
  .super-app-embedded .mx-shell-card { border-radius:13px !important; box-shadow:var(--mx-shadow); }
  .super-app-embedded .mx-btn,.super-app-embedded .mx-input,.super-app-embedded .mx-select,.super-app-embedded .mx-textarea { border-radius:10px !important; }
  .super-app-embedded .mx-nav-active { background:#efedff; color:#5948ce; border-color:rgba(109,92,231,.14); box-shadow:inset 3px 0 0 #6d5ce7; }
  .super-app-embedded[data-theme="dark"] .mx-nav-active { background:#292442; color:#c6bcfa; border-color:rgba(155,140,244,.2); box-shadow:inset 3px 0 0 #9b8cf4; }
  .super-app-embedded aside { border-radius:14px !important; }
  .super-app-embedded main > header { border-radius:13px !important; }
  @media (min-width:1280px) {
    .super-app-embedded #root > .min-h-screen > div { grid-template-columns:278px minmax(0,1fr) !important; gap:18px !important; }
    .super-app-embedded aside { padding:18px !important; }
  }
  .super-app-embedded aside > div:first-child { margin-bottom:18px !important; }
  .super-app-embedded aside .mx-muted-card { border-radius:11px !important; padding:13px !important; }
  .super-app-embedded main { gap:16px !important; }
  .super-app-embedded main > header > div { padding:18px 20px !important; }
  .super-app-embedded main > header h1 { font-size:30px !important; }
  .super-app-embedded section.mx-shell-card { border-color:var(--mx-line) !important; }
  .super-app-embedded body { font-family:'DM Sans','Noto Sans Thai','Segoe UI',sans-serif; color:var(--mx-text); }
  .super-app-embedded #root > .min-h-screen { background:var(--mx-bg) !important; }
  .super-app-embedded aside { background:var(--mx-panel) !important; border:1px solid var(--mx-line) !important; }
  .super-app-embedded main > header { background:color-mix(in srgb,var(--mx-panel) 94%,transparent) !important; border:1px solid var(--mx-line) !important; box-shadow:var(--mx-shadow) !important; backdrop-filter:blur(16px); }
  .super-app-embedded main > header h1 { color:var(--mx-text) !important; font-weight:750 !important; letter-spacing:-.04em !important; }
  .super-app-embedded main > header p,.super-app-embedded .text-slate-500,.super-app-embedded .text-slate-400 { color:var(--mx-muted) !important; }
  .super-app-embedded .mx-shell-card,.super-app-embedded .mx-data-card,.super-app-embedded .mx-muted-card { background:var(--mx-panel) !important; border-color:var(--mx-line) !important; }
  .super-app-embedded .mx-data-card:hover,.super-app-embedded .mx-shell-card:hover { border-color:var(--mx-line-strong) !important; }
  .super-app-embedded .mx-btn-primary { background:var(--mx-accent-2) !important; box-shadow:0 8px 18px color-mix(in srgb,var(--mx-accent-2) 24%,transparent) !important; }
  .super-app-embedded .mx-btn-primary:hover { filter:brightness(.96); transform:translateY(-1px); }
  .super-app-embedded .mx-btn-soft { background:var(--mx-panel-strong) !important; color:var(--mx-text) !important; border-color:var(--mx-line-strong) !important; }
  .super-app-embedded .mx-btn-soft:hover { background:var(--mx-surface-hover) !important; }
  .super-app-embedded .mx-nav-active { border-radius:10px !important; }
  .super-app-embedded .mx-input,.super-app-embedded .mx-select,.super-app-embedded .mx-textarea { background:var(--mx-panel-strong) !important; border-color:var(--mx-line-strong) !important; color:var(--mx-text) !important; }
  .super-app-embedded .mx-input::placeholder,.super-app-embedded .mx-textarea::placeholder { color:var(--mx-muted) !important; }
  .super-app-embedded :focus-visible { outline:3px solid color-mix(in srgb,var(--mx-accent-2) 24%,transparent); outline-offset:2px; }
  .super-app-embedded .mx-status-completed,.super-app-embedded .mx-status-process,.super-app-embedded .mx-status-pending,.super-app-embedded .mx-status-hold,.super-app-embedded .mx-status-cancelled { border-radius:999px !important; }
  .super-app-embedded .mx-progress-fill { background:linear-gradient(90deg,#8979ef,var(--mx-accent-2)) !important; }
  @media (max-width:767px) { .super-app-embedded #root > .min-h-screen { padding:12px !important; } }
</style>`;

function bootScript(empId: string) {
  return String.raw`<script>
  (async function () {
    const embedded = window.self !== window.top && new URLSearchParams(window.location.search).get('embedded') === 'super-app';
    if (embedded) document.documentElement.classList.add('super-app-embedded');
    function hideModuleAuth() {
      if (!embedded) return;
      document.querySelectorAll('button,a').forEach(function (element) {
        const text = (element.textContent || '').trim().toLowerCase();
        if (text.includes('ออกจากระบบ') || text === 'logout' || text === 'log out') element.style.setProperty('display', 'none', 'important');
      });
    }
    function notify(type, message) {
      if (embedded) window.parent.postMessage({ type: type, message: message || '' }, window.location.origin);
    }
    function applyWorkspaceTheme(theme) {
      if (theme !== 'light' && theme !== 'dark') return;
      document.documentElement.dataset.theme = theme;
      localStorage.setItem('maxiwa-kpi-theme', theme);
    }
    window.addEventListener('message', function (event) {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      if (event.data?.type === 'WORKSPACE_THEME') applyWorkspaceTheme(event.data.theme);
    });
    if (embedded) {
      window.parent.postMessage({ type: 'WORKSPACE_THEME_REQUEST' }, window.location.origin);
      setTimeout(function () { window.parent.postMessage({ type: 'WORKSPACE_THEME_REQUEST' }, window.location.origin); }, 120);
    }
    function loadApplication() {
      const script = document.createElement('script');
      script.src = '/legacy/maxiwa/assets/js/maxiwa.js';
      script.onload = function () { hideModuleAuth(); new MutationObserver(hideModuleAuth).observe(document.body, { childList:true, subtree:true }); notify('MAXIWA_APP_READY'); };
      script.onerror = function () { notify('MAXIWA_BOOT_ERROR', 'โหลดส่วนติดต่อของ MAXIWA KPI ไม่สำเร็จ'); };
      document.body.appendChild(script);
    }
    if (!embedded) { loadApplication(); return; }
    const empId = ${scriptValue(empId)};
    if (!empId) { notify('MAXIWA_BOOT_ERROR', 'บัญชี Super App ยังไม่ได้ผูก Employee ID สำหรับ MAXIWA KPI'); return; }
    try {
      const browserSessionId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
      const result = await window.API.getInitialData(empId, browserSessionId);
      if (!result || !result.user) throw new Error('ไม่พบข้อมูลผู้ใช้ใน MAXIWA KPI');
      const user = Object.assign({}, result.user, { kpis: result.kpis || [] });
      sessionStorage.setItem('maxiwa-kpi-session', JSON.stringify(user));
      window.MAXIWA_ACTIVE_SESSION = {
        empId: String(user.empId || user.empid || empId),
        sessionId: String(user.serverSessionId || browserSessionId)
      };
      loadApplication();
    } catch (error) {
      const detail = error && error.message ? error.message.replace(/^HTTP\s+\d+:\s*/, '') : 'เชื่อมต่อ API ไม่สำเร็จ';
      notify('MAXIWA_BOOT_ERROR', detail);
    }
  })();
</script>`;
}

export async function GET() {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  const access = await getAccessContext("work");
  if (!access.allowed) return new Response("Forbidden", { status: 403 });
  const user = await getCurrentUser();
  const employeeId = String(
    (user?.email ? user.email.split("@")[0] : "") ||
    process.env.MAXIWA_DEV_EMP_ID || "",
  ).trim();

  let html = await readFile(join(sourceDir(), "dist", "index.html"), "utf8");
  html = html
    .replace('href="/favicon.svg"', 'href="/legacy/maxiwa/assets/favicon.svg"')
    .replace('href="/favicon.ico"', 'href="/legacy/maxiwa/assets/favicon.ico"')
    .replace('href="/css/tailwind.css"', 'href="/legacy/maxiwa/assets/css/tailwind.css"')
    .replace('src="./config.js"', 'src="/legacy/maxiwa/assets/config.js"')
    .replace('src="./js/api.js"', 'src="/legacy/maxiwa/assets/js/api.js"')
    .replace('<script src="./js/maxiwa.js"></script>', bootScript(employeeId))
    .replace("</head>", `${embeddedStyles}</head>`);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": "frame-ancestors 'self'",
    },
  });
}
