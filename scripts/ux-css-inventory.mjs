import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory()){if(!f.includes(`${path.sep}legacy`))walk(f);}else if(/\.(css|tsx)$/.test(f))files.push(f);}}walk('src');
const source=files.filter(f=>f.endsWith('.tsx')).map(f=>fs.readFileSync(f,'utf8')).join('\n');
const selectors=[],colors={};
for(const file of files.filter(f=>f.endsWith('.css'))){const css=fs.readFileSync(file,'utf8');postcss.parse(css).walkRules(rule=>{const classes=[...rule.selector.matchAll(/\.([a-zA-Z_][\w-]*)/g)].map(m=>m[1]);selectors.push({file,selector:rule.selector,classes,status:classes.length&&classes.every(c=>source.includes(c))?'used':classes.some(c=>source.includes(c))?'uncertain_dynamic_or_composed':classes.length?'no_literal_consumer_uncertain':'element_or_media'});});if(!file.endsWith('tokens.css'))for(const m of css.matchAll(/#[\da-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\([^)]*\)/gi)) colors[m[0]]=(colors[m[0]]||0)+1;}
fs.writeFileSync('docs/quality/ux-login-evidence/cp3-css-inventory.json',JSON.stringify({globalBytes:fs.statSync('src/app/globals.css').size,policy:'No uncertain selectors removed. Literal consumer search is not proof of dynamic absence.',selectors,colors},null,2));
console.log(`${selectors.length} selectors; ${Object.keys(colors).length} distinct literals`);
console.log(Object.entries(colors).sort((a,b)=>b[1]-a[1]).slice(0,65));
