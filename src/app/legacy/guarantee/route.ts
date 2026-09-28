import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getAccessContext } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const defaultSourceDir = "D:\\WebApp\\ระบบขอคืนเงินประกัน_V2";

function sourceDir() {
  return process.env.GUARANTEE_LEGACY_DIR || defaultSourceDir;
}

const embeddedHead = String.raw`
<script>
  if (window.self !== window.top && new URLSearchParams(window.location.search).get('embedded') === 'super-app') {
    document.documentElement.classList.add('super-app-embedded');
  }
</script>
<style>
  html.super-app-embedded {
    --bg:#f6f7fb; --white:#fff; --surface:#f8f9fc; --surface-strong:#fff; --surface-muted:#f0f2f7;
    --border:#e5e8ef; --border-focus:#6d5ce7; --bg-f:#f6f7fb; --table-hover:#f8f7ff;
    --txt:#182235; --txt2:#667289; --txt3:#8b94a5; --navy:#344158;
    --blue:#6d5ce7; --blue-l:#efedff; --blue-m:#d8d2fb; --blue-d:#5745ca;
    --blue-focus:#5d4bd5; --blue-rgb:109,92,231; --gray-l:#f1f2f7;
    --r:13px; --r-sm:9px; --r-md:13px; --r-lg:18px;
    --shadow:0 1px 2px rgba(24,34,53,.04),0 4px 12px rgba(24,34,53,.04);
    --shadow-md:0 9px 26px rgba(24,34,53,.07); --shadow-lg:0 18px 44px rgba(24,34,53,.10);
  }
  html.super-app-embedded[data-theme="dark"] {
    --bg:#101521; --white:#171e2c; --surface:#101521; --surface-strong:#1b2332; --surface-muted:#1c2433;
    --border:#2a3445; --border-focus:#9b8cf4; --bg-f:#0d121d; --table-hover:#20293a;
    --txt:#edf1f7; --txt2:#a9b4c4; --txt3:#7f8b9e; --navy:#d9deea;
    --blue:#9b8cf4; --blue-l:#292442; --blue-m:#63569a; --blue-d:#c6bcfa;
    --blue-focus:#aa9cf7; --blue-rgb:155,140,244; --gray-l:#242d3e;
    --shadow:0 1px 2px rgba(0,0,0,.18),0 5px 14px rgba(0,0,0,.14);
    --shadow-md:0 12px 30px rgba(0,0,0,.20); --shadow-lg:0 20px 48px rgba(0,0,0,.28);
  }
  .super-app-embedded body { background:var(--bg); font-family:'Noto Sans Thai','Inter','Figtree',sans-serif; }
  .super-app-embedded #loginOverlay,
  .super-app-embedded #forgotOverlay,
  .super-app-embedded #admin-nav,
  .super-app-embedded button[onclick="logout()"],
  .super-app-embedded #theme-toggle-btn { display:none !important; }
  .super-app-embedded .sidebar { width:232px; border-color:var(--border); box-shadow:none; }
  .super-app-embedded .sidebar-logo { padding:16px 18px 14px; }
  .super-app-embedded .sidebar-logo .logo-box { display:none !important; }
  .super-app-embedded .main { background:linear-gradient(180deg,#f8f9fc,#f3f5f9); }
  .super-app-embedded[data-theme="dark"] .main { background:linear-gradient(180deg,#101521,#0d121d); }
  .super-app-embedded .topbar { height:60px; padding:0 24px; background:rgba(255,255,255,.92); backdrop-filter:blur(16px); }
  .super-app-embedded .nav-item { border-radius:9px; padding:9px 10px; }
  .super-app-embedded .nav-item.active { background:var(--blue-l); color:var(--blue-d); }
  .super-app-embedded .btn,.super-app-embedded .form-control,.super-app-embedded input,
  .super-app-embedded select,.super-app-embedded textarea { border-radius:9px; }
  .super-app-embedded .card,.super-app-embedded .db-card,.super-app-embedded .db-hero-stat-card { border:1px solid var(--border); border-radius:13px; box-shadow:var(--shadow); }
  .super-app-embedded body { color:var(--txt); font-family:'DM Sans','Noto Sans Thai','Inter','Segoe UI',sans-serif; }
  .super-app-embedded .sidebar { background:var(--white); box-shadow:var(--shadow-sm); }
  .super-app-embedded .sidebar-logo { border-bottom:1px solid var(--border); }
  .super-app-embedded .topbar { border-bottom:1px solid var(--border); box-shadow:0 1px 0 rgba(255,255,255,.75),0 5px 18px rgba(24,34,53,.04); }
  .super-app-embedded[data-theme="dark"] .topbar { background:rgba(23,30,44,.94); box-shadow:0 1px 0 rgba(255,255,255,.03),0 8px 24px rgba(0,0,0,.16); }
  .super-app-embedded .main { background:var(--bg-f); }
  .super-app-embedded .nav-item { color:var(--txt2); transition:background .16s,color .16s,transform .16s; }
  .super-app-embedded .nav-item:hover { background:var(--table-hover); color:var(--txt); transform:translateX(2px); }
  .super-app-embedded .nav-item.active { box-shadow:inset 3px 0 0 var(--blue); font-weight:700; }
  .super-app-embedded .card,.super-app-embedded .db-card,.super-app-embedded .db-hero-stat-card { background:var(--white); border-color:var(--border); box-shadow:var(--shadow); transition:border-color .16s,box-shadow .16s; }
  .super-app-embedded .card:hover,.super-app-embedded .db-card:hover { border-color:var(--blue-m); box-shadow:var(--shadow-md); }
  .super-app-embedded .btn,.super-app-embedded .form-control,.super-app-embedded input,.super-app-embedded select,.super-app-embedded textarea { border-color:var(--border); box-shadow:none; }
  .super-app-embedded .btn:focus-visible,.super-app-embedded input:focus-visible,.super-app-embedded select:focus-visible,.super-app-embedded textarea:focus-visible,.super-app-embedded .nav-item:focus-visible { outline:3px solid rgba(var(--blue-rgb),.18); outline-offset:2px; }
  .super-app-embedded table th { color:var(--txt3); font-size:11px; letter-spacing:.04em; }
  .super-app-embedded table tbody tr { border-color:var(--border); transition:background .16s; }
  .super-app-embedded table tbody tr:hover { background:var(--table-hover); }
  @media(max-width:900px){.super-app-embedded .sidebar{width:220px}}
</style>`;

const embeddedBridge = String.raw`
<script>
  (function () {
    const embedded = window.self !== window.top && new URLSearchParams(window.location.search).get('embedded') === 'super-app';
    if (!embedded) return;
    document.body.style.overflow = 'auto';
    document.getElementById('loginOverlay')?.style.setProperty('display', 'none', 'important');

    function applyWorkspaceTheme(theme) {
      if (theme !== 'light' && theme !== 'dark') return;
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      if (typeof refreshActiveThemeViews === 'function') refreshActiveThemeViews();
    }

    function applySuperAppSession(session) {
      if (!session || !session.email) return;
      CURRENT_USER = {
        id: session.id || session.email,
        employee_id: session.email,
        email: session.email,
        name: session.display_name || session.displayName || session.email,
        role: session.role === 'admin' ? 'admin' : 'user',
        can_see_tl: session.role === 'admin'
      };
      setupUserSession();
      document.getElementById('admin-nav')?.style.setProperty('display', 'none', 'important');
      document.getElementById('loginOverlay')?.style.setProperty('display', 'none', 'important');
    }

    window.addEventListener('message', function (event) {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      if (event.data?.type === 'SUPER_APP_SESSION') applySuperAppSession(event.data.session);
      if (event.data?.type === 'WORKSPACE_THEME') applyWorkspaceTheme(event.data.theme);
    });
    window.parent.postMessage({ type: 'GUARANTEE_APP_READY' }, window.location.origin);
    window.parent.postMessage({ type: 'WORKSPACE_THEME_REQUEST' }, window.location.origin);
    setTimeout(function () { window.parent.postMessage({ type: 'WORKSPACE_THEME_REQUEST' }, window.location.origin); }, 120);
  })();
</script>`;

export async function GET() {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  const access = await getAccessContext("guarantees");
  if (!access.allowed) return new Response("Forbidden", { status: 403 });
  let html = await readFile(join(sourceDir(), "index.html"), "utf8");
  html = html
    .replace('src="firebase-config.js"', 'src="/legacy/guarantee/firebase-config.js"')
    .replace('src="firebase-client.js"', 'src="/legacy/guarantee/firebase-client.js"')
    .replace("</head>", `${embeddedHead}</head>`)
    .replace("</body>", `${embeddedBridge}</body>`);
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": "frame-ancestors 'self'",
    },
  });
}
