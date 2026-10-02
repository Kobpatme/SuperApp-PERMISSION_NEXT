import fs from 'node:fs';
const file='src/app/globals.css'; let text=fs.readFileSync(file,'utf8');
for (const selector of ['.dashboard-action-copy strong','.dashboard-action-copy small','.workspace-search-result-copy small']) {
  const escaped=selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  text=text.replace(new RegExp(`${escaped}\\{([^}]+)\\}`,'g'),(rule,body)=>`${selector}{${body.replace(/white-space:nowrap/g,'white-space:normal;overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;line-clamp:3')}}`);
}
text=text.replace('.record-subtitle{display:flex;gap:7px;overflow:hidden', '.record-subtitle{display:flex;flex-wrap:wrap;gap:7px;min-width:0');
text=text.replace('font-size:10px;white-space:nowrap}.record-subtitle>span{overflow:hidden;text-overflow:ellipsis}', 'font-size:12px;white-space:normal;overflow-wrap:anywhere}.record-subtitle>span{min-width:0;max-width:100%}');
fs.writeFileSync(file,text);
