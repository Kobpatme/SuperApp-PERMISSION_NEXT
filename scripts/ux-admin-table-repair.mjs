import fs from 'node:fs';
const file='src/components/admin-workspace.tsx';let s=fs.readFileSync(file,'utf8');
s=s.replace('className="admin-table-wrap" role="region" aria-label={copy.feedback.auditTable} tabIndex={0} role="region" aria-label={copy.feedback.usersTable} tabIndex={0}','className="admin-table-wrap" role="region" aria-label={copy.feedback.usersTable} tabIndex={0}');
s=s.replace('<div className="admin-table-wrap">','<div className="admin-table-wrap" role="region" aria-label={copy.feedback.auditTable} tabIndex={0}>');fs.writeFileSync(file,s);
