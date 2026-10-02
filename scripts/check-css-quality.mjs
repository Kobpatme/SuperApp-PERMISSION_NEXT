import fs from 'node:fs';
import path from 'node:path';
const files = [];
function walk(dir) { for (const entry of fs.readdirSync(dir,{withFileTypes:true})) { const file=path.join(dir,entry.name); if (entry.isDirectory()) { if (file !== path.join('src','app','legacy')) walk(file); } else if (/\.(css|tsx|ts)$/.test(file) && !/\.test\.ts$/.test(file)) files.push(file); } }
walk('src');
const definitions = new Set(files.flatMap(file => [...fs.readFileSync(file,'utf8').matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1])));
// next/font/local defines these generated variables in the root layout in CP3.
for (const file of files.filter(file=>/\.tsx?$/.test(file))) for (const m of fs.readFileSync(file,'utf8').matchAll(/variable:\s*["'](--[\w-]+)["']/g)) definitions.add(m[1]);
const errors=[];
for (const file of files) {
  const text=fs.readFileSync(file,'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
  if (!file.endsWith('tokens.css')) for (const m of text.matchAll(/#[\da-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\([^)]*\)/gi)) errors.push(`${file}: literal ${m[0]}`);
  if (file.endsWith('.css')) {
    for (const m of text.matchAll(/font-size\s*:\s*([\d.]+)px/g)) if (+m[1]<12) errors.push(`${file}: font-size ${m[1]}px (no exceptions)`);
    for (const m of text.matchAll(/letter-spacing\s*:\s*-[\d.]+(?:px|em|rem)/g)) errors.push(`${file}: negative tracking ${m[0]}`);
  }
  for (const m of text.matchAll(/var\(\s*(--[\w-]+)/g)) if (!definitions.has(m[1])) errors.push(`${file}: undefined ${m[1]}`);
}
if (errors.length) console.error(errors.join('\n'));
console.log(`${files.length} files checked; ${errors.length} CSS quality violations; development-only legacy routes excluded (production 404)`);
process.exitCode=errors.length?1:0;
