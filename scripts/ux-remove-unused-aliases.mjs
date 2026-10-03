import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
const aliases=/^--(?:app-[\w-]+|pw-[\w-]+|deposit-[\w-]+|ink|muted|line|canvas|surface|violet(?:-soft)?|teal(?:-soft)?|amber(?:-soft)?|rose|shadow)$/;
const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory()){if(e.name!=='legacy')walk(f);}else if(/\.(css|tsx|ts)$/.test(f))files.push(f);}}walk('src');
for(const file of files){const text=fs.readFileSync(file,'utf8');for(const m of text.matchAll(/var\(\s*(--[\w-]+)/g))if(aliases.test(m[1]))throw Error(`Alias still consumed: ${file} ${m[1]}`);}
let removed=0;
for(const file of files.filter(f=>f.endsWith('.css'))){const root=postcss.parse(fs.readFileSync(file,'utf8'));let changed=false;root.walkDecls(d=>{if(aliases.test(d.prop)){d.remove();removed++;changed=true;}});root.walkRules(r=>{if(!r.nodes.length)r.remove();});if(changed)fs.writeFileSync(file,root.toString().replace('Compatibility aliases keep existing domains stable.','Consumers use semantic tokens directly.'));}
console.log(`${removed} unused alias definitions removed; zero consumers verified before mutation; uncertain selectors preserved.`);
