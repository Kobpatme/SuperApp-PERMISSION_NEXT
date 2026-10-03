import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory()){if(e.name!=='legacy')walk(f);}else if(f.endsWith('.css'))files.push(f);}}walk('src');
fs.copyFileSync('src/styles/ui.css','docs/archive/ux-login-v1/cp4-ui-before.css');
fs.copyFileSync('src/components/ui/animated-number.tsx','docs/archive/ux-login-v1/cp4-animated-number-before.tsx.txt');
for(const file of files.filter(f=>!f.endsWith('motion.css'))){const root=postcss.parse(fs.readFileSync(file,'utf8'));root.walkAtRules(a=>{if(/keyframes$/i.test(a.name))a.remove();});root.walkDecls(d=>{
 if(/^animation(?:-|$)/.test(d.prop)||/^transition(?:-|$)/.test(d.prop))d.remove();
 if(d.prop==='--motion-slow'||d.prop==='--ease-spring')d.remove();
});root.walkRules(r=>{if(!r.nodes.length)r.remove();});fs.writeFileSync(file,root.toString());}
// Remove the obsolete motion block, keeping subsequent skeleton layout rules.
let ui=fs.readFileSync('src/styles/ui.css','utf8');const start=ui.indexOf('/* Phase C:');const end=ui.indexOf('.skeleton-summary',start);if(start<0||end<0)throw Error('Motion archive boundaries missing');ui=ui.slice(0,start)+ui.slice(end);fs.writeFileSync('src/styles/ui.css',ui);
console.log('Archived obsolete motion; removed layout/color transitions and decorative loops; new motion lives in motion.css.');
