// One-time, bounded presentation migration. Original CSS remains archived.
import fs from 'node:fs';
const file = 'src/app/globals.css';
const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
const old = lines.filter(line => line.includes('.auth-') || line.startsWith('@media(max-width:820px)') || line.startsWith('@media(max-width:480px)'));
fs.mkdirSync('docs/archive/ux-login-v1', { recursive: true });
fs.writeFileSync('docs/archive/ux-login-v1/auth-before.css', old.join('\n'));
const auth = `
/* Shared authentication presentation. */
.auth-page { min-height:100dvh; display:grid; place-items:center; padding:32px; background:var(--color-bg); }
.auth-shell { width:min(1040px,100%); min-height:640px; display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); border:1px solid var(--color-border); border-radius:16px; overflow:hidden; background:var(--color-surface); box-shadow:var(--shadow-md); }
.auth-intro { display:flex; flex-direction:column; padding:40px; color:var(--color-on-brand-deep); background:var(--color-brand-deep); }
.auth-brand { display:flex; align-items:center; gap:12px; font-size:18px; }
.auth-brand-mark { display:grid; place-items:center; width:40px; height:40px; flex:0 0 40px; border:2px solid currentColor; border-radius:10px; font-size:15px; font-weight:700; }
.auth-intro-copy { margin:auto 0; padding-block:64px; }
.auth-intro .auth-headline { margin:0 0 20px; font-size:clamp(32px,3.5vw,44px); font-weight:700; line-height:1.5; }
.auth-intro-copy p { margin:0; font-size:16px; line-height:1.8; }
.auth-panel { display:grid; place-items:center; padding:40px; min-width:0; }
.auth-panel-inner { width:min(400px,100%); min-width:0; }
.auth-panel h1 { margin:0 0 12px; color:var(--color-text); font-size:28px; line-height:1.5; letter-spacing:normal; }
.auth-description { margin:0; color:var(--color-text-muted); font-size:14px; line-height:1.8; }
.auth-mobile-brand { display:none; }
.auth-form { display:grid; gap:16px; margin-top:28px; }
.auth-field { min-width:0; display:grid; gap:8px; }
.auth-field label { font-size:14px; font-weight:600; color:var(--color-text); }
.auth-form input:not([type=hidden]) { width:100%; min-width:0; height:48px; border:1px solid var(--color-border-strong); border-radius:10px; padding:0 12px; background:var(--color-surface); color:var(--color-text); font-size:16px; }
.auth-form input::placeholder { color:var(--color-text-muted); }
.auth-form input:focus-visible,.auth-visibility:focus-visible { outline:3px solid var(--color-focus-ring); outline-offset:3px; }
.auth-password { position:relative; min-width:0; }
.auth-password input { padding-inline-end:56px !important; }
.auth-visibility { position:absolute; inset-inline-end:4px; top:2px; width:44px; height:44px; display:grid; place-items:center; border:0; border-radius:8px; background:transparent; color:var(--color-text-muted); cursor:pointer; }
.auth-field-hint { color:var(--color-danger); font-size:12px; line-height:1.6; overflow-wrap:anywhere; }
.auth-field-hint:empty { display:none; }
.button { display:inline-flex; align-items:center; justify-content:center; gap:12px; border:0; border-radius:10px; padding:12px 16px; background:var(--color-brand); color:var(--color-on-brand); font-weight:600; }
.auth-submit-button { width:100%; min-height:48px; cursor:pointer; font-size:16px; }
.auth-submit-button:hover { background:var(--color-brand-hover); }
.auth-submit-button:disabled { cursor:wait; opacity:.75; }
.auth-error { border:1px solid var(--color-danger); border-radius:10px; padding:12px; color:var(--color-danger); background:var(--color-danger-soft); font-size:14px; line-height:1.7; overflow-wrap:anywhere; }
.auth-notice,.auth-hint { border:1px solid var(--color-border); border-radius:10px; padding:12px; background:var(--color-surface-subtle); color:var(--color-text); font-size:14px; line-height:1.7; }
.auth-hint ul { list-style:none; margin:8px 0 0; padding:0; }
.auth-hint li { color:var(--color-text-muted); }
.auth-hint .is-met { color:var(--color-success); }
.auth-help { margin:28px 0 0; padding-top:20px; border-top:1px solid var(--color-border); color:var(--color-text-muted); font-size:13px; line-height:1.8; overflow-wrap:anywhere; }
.auth-spinner { width:18px; height:18px; border:2px solid currentColor; border-inline-end-color:transparent; border-radius:50%; }
@media(max-width:899px) { .auth-page { padding:24px; } .auth-shell { width:min(480px,100%); grid-template-columns:1fr; min-height:0; } .auth-intro { display:none; } .auth-panel { padding:32px; } .auth-mobile-brand { display:block; margin-bottom:32px; color:var(--color-brand); } }
@media(max-width:480px) { .auth-page { padding:16px; } .auth-panel { padding:24px 18px; } .auth-panel h1 { font-size:24px; } }
`;
fs.writeFileSync(file, lines.filter(line => !old.includes(line)).join('\n') + auth);
