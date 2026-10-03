import fs from 'node:fs';
import path from 'node:path';
const titles=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory()){if(e.name!=='legacy')walk(file);}else if(e.name==='page.tsx'){
 let s=fs.readFileSync(file,'utf8');const match=s.match(/export const metadata: Metadata = \{ title: "([^"]+)" \};/);if(!match)continue;
 const key=path.relative('src/app',dir).replaceAll('(platform)','').split(/[\\/]+/).filter(Boolean).map(v=>v.replaceAll('[','').replaceAll(']','').replaceAll('-','_')).join('_')||'home';
 titles.push([key,match[1]]);s=s.replace(match[0],`export const metadata: Metadata = { title: copy.pages.${key} };`);
 if(!/import \{[^}]*\bcopy\b[^}]*\} from "@\/lib\/copy"/.test(s))s='import { copy } from "@/lib/copy";\n'+s;fs.writeFileSync(file,s);
}}}walk('src/app');
const bank='src/lib/copy.ts';let s=fs.readFileSync(bank,'utf8');s=s.replace('export const copy = {','export const copy = {\n  pages: {\n'+titles.map(([k,v])=>`    ${k}: ${JSON.stringify(v)},`).join('\n')+'\n  },');fs.writeFileSync(bank,s);console.log(`${titles.length} page titles moved to the Thai copy bank.`);
