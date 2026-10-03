import fs from 'node:fs';
const file='src/components/admin-workspace.tsx';let s=fs.readFileSync(file,'utf8');
if(!s.includes('import { copy }'))s=s.replace('"use client";','"use client";\nimport { copy } from "@/lib/copy";');
s=s.replace('<div className="admin-table-wrap">','<div className="admin-table-wrap" role="region" aria-label={copy.feedback.usersTable} tabIndex={0}>');
s=s.replace('<div className="admin-table-wrap">','<div className="admin-table-wrap" role="region" aria-label={copy.feedback.auditTable} tabIndex={0}>');fs.writeFileSync(file,s);
