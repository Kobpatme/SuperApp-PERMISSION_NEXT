import fs from 'node:fs';
const entries=fs.readFileSync('.jev/logs/decisions.jsonl','utf8').trim().split(/\r?\n/).map(JSON.parse).filter(e=>Date.parse(e.ts)>=Date.parse('2026-10-02T19:52:00Z')).map(e=>({timestamp:e.ts,kind:e.kind,answers:e.answers}));
fs.writeFileSync('docs/quality/ux-login-evidence/jev-advisory-metadata.json',JSON.stringify({scope:'Advisory outputs only. No source/input bodies, identities, secrets or production data. UTC timestamps.',entries},null,2));
console.log(`${entries.length} sanitized advisory records exported.`);
