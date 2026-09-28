import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getAccessContext } from "@/lib/access";

export const runtime = "nodejs";

const embeddedTheme = String.raw`
<style>
  .super-app-embedded[data-theme="light"] {
    --bg:#f6f7fb; --bg-grad:linear-gradient(180deg,#f8f9fc 0%,#f2f4f8 100%);
    --surface:#fff; --surface2:#f8f9fc; --surface3:#f0f2f7;
    --glass:rgba(255,255,255,.88); --border:rgba(24,34,53,.09); --border2:rgba(24,34,53,.14);
    --accent:#6d5ce7; --accent2:#344158; --accent-soft:rgba(109,92,231,.10);
    --accent-glow:rgba(109,92,231,.22); --grad-accent:linear-gradient(135deg,#7c6bed,#6250da);
    --grad-accent-soft:linear-gradient(135deg,rgba(109,92,231,.14),rgba(109,92,231,.055));
    --text:#182235; --text2:#667289; --muted:#8b94a5;
    --shadow-sm:0 1px 2px rgba(24,34,53,.04),0 4px 12px rgba(24,34,53,.04);
    --shadow-md:0 9px 26px rgba(24,34,53,.07); --shadow-lg:0 18px 44px rgba(24,34,53,.10);
    --topbar-border:rgba(24,34,53,.09);
  }
  .super-app-embedded[data-theme="dark"] {
    --bg:#101521; --bg-grad:linear-gradient(180deg,#101521 0%,#0d121d 100%);
    --surface:#171e2c; --surface2:#1c2433; --surface3:#242d3e; --glass:rgba(23,30,44,.88);
    --border:rgba(183,195,214,.12); --border2:rgba(183,195,214,.20);
    --accent:#9b8cf4; --accent2:#d9deea; --accent-soft:rgba(155,140,244,.14);
    --accent-glow:rgba(155,140,244,.25); --grad-accent:linear-gradient(135deg,#9b8cf4,#7564dd);
    --grad-accent-soft:linear-gradient(135deg,rgba(155,140,244,.18),rgba(155,140,244,.07));
    --text:#edf1f7; --text2:#a9b4c4; --muted:#7f8b9e;
  }
  .super-app-embedded body { font-family:'Inter','Noto Sans Thai','Segoe UI',sans-serif; }
  .super-app-embedded #topbar { height:60px; padding:0 20px; gap:13px; background:rgba(255,255,255,.9); box-shadow:0 1px 0 rgba(255,255,255,.8); }
  .super-app-embedded[data-theme="dark"] #topbar { background:rgba(23,30,44,.92); box-shadow:0 1px 0 rgba(255,255,255,.025); }
  .super-app-embedded #topbar .logo-icon { display:none !important; }
  .super-app-embedded #auth-screen,.super-app-embedded #logout-btn { display:none !important; }
  .super-app-embedded body.auth-locked #topbar,.super-app-embedded body.auth-locked #filterbar,
  .super-app-embedded body.auth-locked #main { visibility:visible !important; pointer-events:auto !important; }
  .super-app-embedded #theme-btn { display:none !important; }
  .super-app-embedded #topbar::after { display:none; }
  .super-app-embedded #filterbar { padding:9px 20px; background:rgba(248,249,252,.9); }
  .super-app-embedded[data-theme="dark"] #filterbar { background:rgba(16,21,33,.9); }
  .super-app-embedded #theme-btn,.super-app-embedded #building-toggle,.super-app-embedded #add-building-btn,
  .super-app-embedded #export-csv-btn,.super-app-embedded #sync-boq-db-btn { min-height:36px; border-radius:10px; }
  .super-app-embedded .stat-card,.super-app-embedded .map-error-box,.super-app-embedded #map-tooltip,
  .super-app-embedded #autocomplete,.super-app-embedded .user-admin-btn { border-radius:13px; }
  .super-app-embedded .stat-card { box-shadow:var(--shadow-md); }
  .super-app-embedded #sidebar { top:109px; width:356px; box-shadow:-14px 0 40px rgba(24,34,53,.10); }
  .super-app-embedded .list-item { border-radius:10px; }
  .super-app-embedded body { color:var(--text); font-family:'DM Sans','Noto Sans Thai','Inter','Segoe UI',sans-serif; }
  .super-app-embedded #topbar { border-bottom:1px solid var(--border); box-shadow:0 1px 0 rgba(255,255,255,.75),0 5px 18px rgba(24,34,53,.04); backdrop-filter:blur(18px) saturate(150%); }
  .super-app-embedded[data-theme="dark"] #topbar { box-shadow:0 1px 0 rgba(255,255,255,.03),0 8px 24px rgba(0,0,0,.16); }
  .super-app-embedded #filterbar { border-bottom:1px solid var(--border); box-shadow:0 4px 18px rgba(24,34,53,.04); }
  .super-app-embedded #filterbar input,.super-app-embedded #filterbar select,.super-app-embedded #filterbar button { min-height:38px; border-radius:10px; border-color:var(--border2); }
  .super-app-embedded #filterbar input:focus,.super-app-embedded #filterbar select:focus { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-soft); }
  .super-app-embedded .stat-card { background:var(--surface); border:1px solid var(--border); box-shadow:var(--shadow-sm); transition:transform .18s,box-shadow .18s,border-color .18s; }
  .super-app-embedded .stat-card:hover { transform:translateY(-2px); box-shadow:var(--shadow-md); border-color:var(--border2); }
  .super-app-embedded #main { background:var(--bg-grad); }
  .super-app-embedded #map-container { border-top:1px solid var(--border); }
  .super-app-embedded #sidebar { background:color-mix(in srgb,var(--surface) 94%,transparent); border:1px solid var(--border); border-radius:14px; }
  .super-app-embedded .list-item { border:1px solid transparent; transition:background .16s,border-color .16s,transform .16s; }
  .super-app-embedded .list-item:hover { background:var(--table-hover); border-color:var(--border); transform:translateX(2px); }
  .super-app-embedded .layer-toggle,.super-app-embedded .map-control,.super-app-embedded .map-tab { border-radius:10px; }
  .super-app-embedded .layer-toggle:focus-visible,.super-app-embedded button:focus-visible,.super-app-embedded input:focus-visible,.super-app-embedded select:focus-visible { outline:3px solid var(--accent-soft); outline-offset:2px; }
  .super-app-embedded .toast,.super-app-embedded .modal-card,.super-app-embedded .drawer-card { border:1px solid var(--border2); border-radius:14px; box-shadow:var(--shadow-lg); }
  .super-app-embedded .tag-confirmed,.super-app-embedded .tag-mou,.super-app-embedded .tag-check { border-radius:999px; }
  /* Embedded MOD2 topbar: keep only module context and module actions. */
  .super-app-embedded #topbar {
    display:flex; align-items:center; min-height:72px; height:72px; padding:0 26px; gap:16px;
    background:color-mix(in srgb,var(--surface) 96%,transparent); border-bottom:1px solid var(--border);
  }
  .super-app-embedded #topbar .logo { display:flex; align-items:center; min-width:max-content; gap:10px; }
  .super-app-embedded #topbar .logo h1 { margin:0; color:var(--text); font-size:18px; font-weight:750; letter-spacing:-.04em; }
  .super-app-embedded #topbar .logo h1 span { color:var(--accent); }
  .super-app-embedded #topbar::after {
    display:inline-flex; order:1; align-items:center; min-height:26px; padding:0 10px; margin-left:2px;
    content:"BUILDING PERMISSION  ·  LIVE"; border:1px solid color-mix(in srgb,var(--accent) 25%,var(--border));
    border-radius:999px; background:var(--accent-soft); color:var(--accent); font-size:9px; font-weight:800; letter-spacing:.11em;
  }
  .super-app-embedded #topbar-actions { order:2; display:flex; align-items:center; gap:8px; margin-left:auto; }
  .super-app-embedded .topbar-primary-actions,.super-app-embedded .topbar-user-actions { display:flex; align-items:center; gap:8px; }
  .super-app-embedded #topbar button { min-height:38px; border-radius:10px; border:1px solid var(--border2); transition:transform .16s,box-shadow .16s,background .16s; }
  .super-app-embedded #topbar button:hover { transform:translateY(-1px); box-shadow:var(--shadow-sm); }
  .super-app-embedded #add-building-btn { padding:0 14px; border-color:transparent; background:var(--accent); color:#fff; box-shadow:0 7px 16px var(--accent-glow); font-weight:800; }
  .super-app-embedded #export-csv-btn { display:inline-flex !important; padding:0 12px; background:var(--surface); color:var(--text); }
  .super-app-embedded #building-toggle,.super-app-embedded #user-manage-btn,.super-app-embedded #current-user-pill,
  .super-app-embedded #theme-btn,.super-app-embedded #logout-btn,.super-app-embedded #mobile-actions-toggle { display:none !important; }
  .super-app-embedded #filterbar {
    display:flex; align-items:center; min-height:68px; height:68px; padding:10px 26px; gap:10px;
    background:color-mix(in srgb,var(--surface) 92%,transparent); border-bottom:1px solid var(--border); box-shadow:0 4px 18px rgba(24,34,53,.04);
  }
  .super-app-embedded #filter-toggle { display:inline-flex; align-items:center; flex:0 0 auto; min-height:38px; padding:0 11px; gap:6px; border:1px solid var(--border2); border-radius:10px; background:var(--surface); color:var(--text); font-weight:750; }
  .super-app-embedded #filter-toggle .filter-toggle-text { font-size:11px; }
  .super-app-embedded .filter-controls { display:flex; align-items:center; flex:0 1 auto; min-width:0; gap:8px; }
  .super-app-embedded .filter-label { display:none; }
  .super-app-embedded .filter-controls .flt { width:112px; min-height:38px; padding:0 28px 0 11px; border:1px solid var(--border2); border-radius:10px; background:var(--surface); color:var(--text); font-size:11px; }
  .super-app-embedded .filter-controls #f-status { width:136px; }
  .super-app-embedded .filter-controls #f-area { width:104px; }
  .super-app-embedded #btn-reset { min-height:38px; padding:0 10px; border:1px dashed var(--border2); border-radius:999px; background:transparent; color:var(--text2); font-size:10px; font-weight:750; }
  .super-app-embedded .search-wrap { display:flex; align-items:center; flex:1 1 280px; min-width:190px; height:38px; margin-left:auto; border:1px solid var(--border2); border-radius:999px; background:var(--surface); box-shadow:none; }
  .super-app-embedded .search-wrap input { height:36px; background:transparent; color:var(--text); }
  .super-app-embedded .search-wrap input::placeholder { color:var(--muted); }
  .super-app-embedded #result-count { flex:0 0 auto; min-height:30px; padding:6px 10px; border:1px solid color-mix(in srgb,var(--accent) 26%,var(--border)); border-radius:999px; background:var(--accent-soft); color:var(--accent); font-size:10px; font-weight:800; white-space:nowrap; }
  @media(max-width:1180px) {
    .super-app-embedded #topbar { padding-inline:18px; }
    .super-app-embedded #filterbar { padding-inline:18px; overflow-x:auto; }
    .super-app-embedded .filter-controls { flex:0 0 auto; }
    .super-app-embedded .search-wrap { min-width:230px; }
  }
  @media(max-width:760px) {
    .super-app-embedded #topbar { min-height:64px; height:64px; padding-inline:14px; }
    .super-app-embedded #topbar::after { display:none; }
    .super-app-embedded #topbar .logo h1 { font-size:16px; }
    .super-app-embedded #export-csv-btn { display:none !important; }
    .super-app-embedded #filterbar { min-height:60px; height:60px; padding:9px 14px; }
    .super-app-embedded .filter-controls .flt:nth-of-type(n+4) { display:none; }
    .super-app-embedded .search-wrap { min-width:190px; }
  }
  /* MOD2 topbar v2 — compact context, focused actions, progressive filters. */
  .super-app-embedded #topbar {
    display:flex !important; height:64px !important; min-height:64px !important; padding:0 24px !important;
    background:color-mix(in srgb,var(--surface) 97%,transparent) !important; box-shadow:0 1px 0 rgba(255,255,255,.72),0 7px 22px rgba(24,34,53,.045) !important;
  }
  .super-app-embedded #topbar::before,.super-app-embedded #topbar::after,.super-app-embedded #topbar .logo::after { display:none !important; }
  .super-app-embedded .module-context { display:flex; align-items:center; gap:10px; min-width:max-content; }
  .super-app-embedded .module-context-mark { display:grid; place-items:center; width:34px; height:34px; border:1px solid var(--border); border-radius:10px; background:var(--accent-soft); color:var(--accent); }
  .super-app-embedded .module-context-mark .svg-icon { width:18px; height:18px; }
  .super-app-embedded .module-context-copy { display:grid; gap:1px; line-height:1.08; }
  .super-app-embedded .module-context-copy small { color:var(--muted); font-size:8px; font-weight:800; letter-spacing:.12em; }
  .super-app-embedded #topbar .module-context-copy h1 { margin:0; color:var(--text) !important; font-size:15px !important; font-weight:750 !important; letter-spacing:-.025em !important; }
  .super-app-embedded .module-live { display:inline-flex; align-items:center; gap:6px; min-height:24px; padding:0 8px; border:1px solid color-mix(in srgb,#22a47d 20%,var(--border)); border-radius:999px; background:color-mix(in srgb,#22a47d 9%,var(--surface)); color:#16846d; font-size:8px; font-weight:850; letter-spacing:.08em; }
  .super-app-embedded .module-live i { width:5px; height:5px; border-radius:50%; background:#22a47d; box-shadow:0 0 0 3px rgba(34,164,125,.12); }
  .super-app-embedded #topbar-actions { display:flex !important; align-items:center; gap:8px; margin-left:auto; }
  .super-app-embedded .topbar-primary-actions,.super-app-embedded .topbar-user-actions { display:flex; align-items:center; gap:8px; padding:0 !important; border:0 !important; }
  .super-app-embedded #building-toggle,.super-app-embedded #export-csv-btn { display:inline-flex !important; background:var(--surface) !important; color:var(--text2) !important; border:1px solid var(--border2) !important; box-shadow:var(--shadow-sm) !important; }
  .super-app-embedded #export-csv-btn.auth-only-admin { display:none !important; }
  .super-app-embedded body.role-admin #export-csv-btn.auth-only-admin { display:inline-flex !important; }
  .super-app-embedded #building-toggle:hover,.super-app-embedded #export-csv-btn:hover { color:var(--accent) !important; border-color:color-mix(in srgb,var(--accent) 38%,var(--border)) !important; background:var(--accent-soft) !important; }
  .super-app-embedded #add-building-btn { min-height:38px !important; padding:0 15px !important; border-radius:10px !important; background:var(--accent) !important; box-shadow:0 8px 18px var(--accent-glow) !important; }
  .super-app-embedded #user-manage-btn,.super-app-embedded #current-user-pill,.super-app-embedded #theme-btn,.super-app-embedded #logout-btn,.super-app-embedded #mobile-actions-toggle { display:none !important; }
  .super-app-embedded #filterbar {
    display:grid !important; grid-template-columns:minmax(280px,1fr) auto minmax(450px,auto) auto; align-items:center;
    min-height:62px !important; height:auto !important; padding:10px 24px !important; gap:10px !important;
    background:color-mix(in srgb,var(--surface2) 88%,transparent) !important;
  }
  .super-app-embedded #filterbar .search-wrap { grid-column:1; grid-row:1; display:flex; width:100%; min-width:0; max-width:none !important; height:40px; margin:0 !important; border:1px solid var(--border2); border-radius:11px; background:var(--surface); box-shadow:var(--shadow-sm); }
  .super-app-embedded #filterbar #search-input { height:38px; padding:0 38px 0 40px !important; border:0 !important; border-radius:11px !important; background:transparent !important; box-shadow:none !important; }
  .super-app-embedded #filter-toggle { grid-column:2; grid-row:1; min-height:40px; padding:0 12px; border-radius:10px; }
  .super-app-embedded .filter-controls { grid-column:3; grid-row:1; display:flex; flex:0 0 auto; flex-wrap:nowrap; align-items:center; min-width:0; gap:7px; }
  .super-app-embedded .filter-controls .flt { width:126px; min-height:40px; padding:0 30px 0 11px; border-radius:10px; background:var(--surface); font-size:11px; box-shadow:var(--shadow-sm); }
  .super-app-embedded .filter-controls #f-status { width:150px; }
  .super-app-embedded .filter-controls #f-group { width:128px; }
  .super-app-embedded .filter-controls #f-area { width:118px; }
  .super-app-embedded .advanced-filters { position:relative; flex:0 0 auto; }
  .super-app-embedded .advanced-filters summary { display:flex; align-items:center; justify-content:center; gap:6px; min-height:40px; padding:0 11px; border:1px solid var(--border2); border-radius:10px; background:var(--surface); color:var(--text2); box-shadow:var(--shadow-sm); cursor:pointer; font-size:10px; font-weight:750; list-style:none; white-space:nowrap; }
  .super-app-embedded .advanced-filters summary::-webkit-details-marker { display:none; }
  .super-app-embedded .advanced-filters[open] summary,.super-app-embedded .advanced-filters:has(.flt.active) summary { border-color:color-mix(in srgb,var(--accent) 35%,var(--border)); background:var(--accent-soft); color:var(--accent); }
  .super-app-embedded .advanced-filters-popover { position:absolute; top:calc(100% + 9px); right:0; z-index:100000; display:grid; width:250px; gap:11px; padding:14px; border:1px solid var(--border2); border-radius:13px; background:var(--surface); box-shadow:var(--shadow-lg); }
  .super-app-embedded .advanced-filters-popover label { display:grid; gap:6px; color:var(--muted); font-size:9px; font-weight:800; letter-spacing:.05em; }
  .super-app-embedded .advanced-filters-popover .flt { width:100% !important; box-shadow:none; }
  .super-app-embedded #btn-reset { min-height:40px; padding:0 10px; border:0 !important; background:transparent !important; color:var(--muted); font-size:10px; box-shadow:none !important; }
  .super-app-embedded #btn-reset:hover { color:var(--accent); background:var(--accent-soft) !important; }
  .super-app-embedded #result-count { grid-column:4; grid-row:1; justify-self:end; min-height:28px; padding:5px 9px; border:0; background:transparent; color:var(--text2); font-size:10px; }
  .super-app-embedded #filterbar.filters-collapsed { grid-template-columns:minmax(280px,1fr) auto auto; min-height:58px !important; }
  .super-app-embedded #filterbar.filters-collapsed .filter-controls { display:none !important; }
  .super-app-embedded #filterbar.filters-collapsed #result-count { grid-column:3; }
  .super-app-embedded #sidebar { top:126px !important; }
  @media(max-width:1320px) {
    .super-app-embedded #filterbar { grid-template-columns:minmax(240px,1fr) auto minmax(410px,auto) auto; padding-inline:18px !important; }
    .super-app-embedded .filter-controls .flt { width:112px; }
    .super-app-embedded .filter-controls #f-status { width:138px; }
    .super-app-embedded .filter-controls #f-area { width:104px; }
  }
  @media(max-width:1050px) {
    .super-app-embedded #topbar { padding-inline:16px !important; }
    .super-app-embedded #filterbar { grid-template-columns:auto minmax(0,1fr) auto; }
    .super-app-embedded #filterbar .search-wrap { grid-column:1/3; grid-row:1; }
    .super-app-embedded #result-count { grid-column:3; grid-row:1; }
    .super-app-embedded #filter-toggle { grid-column:1; grid-row:2; }
    .super-app-embedded .filter-controls { grid-column:2/4; grid-row:2; justify-content:flex-end; }
    .super-app-embedded #filterbar.filters-collapsed { grid-template-columns:minmax(0,1fr) auto; }
    .super-app-embedded #filterbar.filters-collapsed .search-wrap { grid-column:1; }
    .super-app-embedded #filterbar.filters-collapsed #filter-toggle { grid-column:2; grid-row:1; }
    .super-app-embedded #filterbar.filters-collapsed #result-count { display:none; }
  }
  @media(max-width:680px) {
    .super-app-embedded #topbar { padding-inline:12px !important; gap:8px; }
    .super-app-embedded .module-context-mark,.super-app-embedded .module-live { display:none; }
    .super-app-embedded #topbar .module-context-copy h1 { font-size:13px !important; }
    .super-app-embedded #export-csv-btn { display:none !important; }
    .super-app-embedded #building-toggle,.super-app-embedded #add-building-btn { min-height:36px !important; padding-inline:10px !important; font-size:10px !important; }
    .super-app-embedded #filterbar { grid-template-columns:minmax(0,1fr) auto; padding:9px 12px !important; }
    .super-app-embedded #filterbar .search-wrap { grid-column:1; }
    .super-app-embedded #result-count { grid-column:2; }
    .super-app-embedded #filter-toggle { grid-column:1; grid-row:2; width:max-content; }
    .super-app-embedded .filter-controls { grid-column:1/3; grid-row:3; display:grid; grid-template-columns:1fr 1fr; width:100%; }
    .super-app-embedded .filter-controls .flt,.super-app-embedded .filter-controls #f-status,.super-app-embedded .filter-controls #f-group,.super-app-embedded .filter-controls #f-area { display:block; width:100%; }
    .super-app-embedded .advanced-filters-popover { position:fixed; top:136px; right:12px; left:12px; width:auto; }
    .super-app-embedded #btn-reset { justify-self:start; }
  }
  @media(max-width:860px){.super-app-embedded #sidebar{top:170px !important;width:100vw}}
  @media(max-width:680px){.super-app-embedded #sidebar{top:268px !important}}
  /* MOD2 single-row header v3. */
  .super-app-embedded #building-toggle,.super-app-embedded #filter-toggle { display:none !important; }
  .super-app-embedded #topbar { position:relative; height:64px !important; min-height:64px !important; padding:0 24px !important; }
  .super-app-embedded #topbar-actions { position:relative; z-index:9200; }
  .super-app-embedded #filterbar {
    position:absolute !important; inset:0 278px auto 284px; z-index:9100;
    display:grid !important; grid-template-columns:minmax(240px,1fr) minmax(470px,auto) auto !important;
    min-height:64px !important; height:64px !important; padding:10px 0 !important; gap:9px !important;
    border:0 !important; background:transparent !important; box-shadow:none !important; backdrop-filter:none !important;
  }
  .super-app-embedded #filterbar .search-wrap { grid-column:1 !important; grid-row:1 !important; }
  .super-app-embedded #filterbar .filter-controls { grid-column:2 !important; grid-row:1 !important; }
  .super-app-embedded #filterbar #result-count { grid-column:3 !important; grid-row:1 !important; }
  .super-app-embedded #filterbar.filters-collapsed { grid-template-columns:minmax(240px,1fr) minmax(470px,auto) auto !important; }
  .super-app-embedded #filterbar.filters-collapsed .filter-controls { display:flex !important; }
  .super-app-embedded #filterbar.filters-collapsed #result-count { display:inline-flex !important; grid-column:3 !important; }
  .super-app-embedded #sidebar { top:64px !important; }
  @media(max-width:1450px) {
    .super-app-embedded #filterbar { right:252px !important; left:242px !important; grid-template-columns:minmax(210px,1fr) minmax(430px,auto) auto !important; }
    .super-app-embedded .filter-controls .flt { width:104px; }
    .super-app-embedded .filter-controls #f-status { width:128px; }
    .super-app-embedded .filter-controls #f-group { width:108px; }
    .super-app-embedded .filter-controls #f-area { width:96px; }
  }
  @media(max-width:1120px) {
    .super-app-embedded .module-context-mark,.super-app-embedded .module-live { display:none; }
    .super-app-embedded #export-csv-btn { display:none !important; }
    .super-app-embedded #filterbar { right:132px !important; left:190px !important; grid-template-columns:minmax(190px,1fr) minmax(390px,auto) auto !important; overflow-x:auto !important; }
    .super-app-embedded #btn-reset { display:none; }
  }
  @media(max-width:760px) {
    .super-app-embedded #topbar { padding-inline:10px !important; }
    .super-app-embedded .module-context-copy small { display:none; }
    .super-app-embedded #topbar .module-context-copy h1 { max-width:92px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .super-app-embedded #filterbar { right:114px !important; left:112px !important; min-width:680px; overflow-x:auto !important; }
    .super-app-embedded #filterbar .search-wrap { min-width:180px; }
    .super-app-embedded #add-building-btn { min-height:36px !important; padding-inline:10px !important; }
    .super-app-embedded #sidebar { top:64px !important; }
  }
</style>`;

const embeddedThemeBridge = String.raw`
<script>
  (function () {
    function unlockWorkspaceModule() {
      document.body?.classList.remove('auth-locked');
      document.getElementById('auth-screen')?.style.setProperty('display', 'none', 'important');
      document.getElementById('logout-btn')?.style.setProperty('display', 'none', 'important');
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', unlockWorkspaceModule);
    else unlockWorkspaceModule();
    function applyWorkspaceTheme(theme) {
      if (theme !== 'light' && theme !== 'dark') return;
      document.documentElement.setAttribute('data-theme', theme);
      try {
        isDark = theme === 'dark';
        if (typeof applyTheme === 'function') applyTheme();
      } catch (_) {}
    }
    window.addEventListener('message', function (event) {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      if (event.data?.type === 'WORKSPACE_THEME') applyWorkspaceTheme(event.data.theme);
    });
    window.parent.postMessage({ type: 'WORKSPACE_THEME_REQUEST' }, window.location.origin);
    setTimeout(function () { window.parent.postMessage({ type: 'WORKSPACE_THEME_REQUEST' }, window.location.origin); }, 120);
  })();
</script>`;

export async function GET() {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  const access = await getAccessContext("buildings");
  if (!access.allowed) return new Response("Forbidden", { status: 403 });
  let html = await readFile(join(process.cwd(), "mods", "permission-next", "Permission_Next.html"), "utf8");
  html = html.replace("</head>", `${embeddedTheme}</head>`).replace("</body>", `${embeddedThemeBridge}</body>`);
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Content-Security-Policy": "frame-ancestors 'self'" } });
}
