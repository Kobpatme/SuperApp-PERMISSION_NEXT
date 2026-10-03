import fs from 'node:fs';
import postcss from 'postcss';
const file='src/app/globals.css';const ast=postcss.parse(fs.readFileSync(file,'utf8'));
ast.walkRules(rule=>{if(!rule.selector.includes('module-directory'))return;rule.walkDecls(d=>{if(d.prop==='color'&&d.value==='#979fad')d.value='var(--color-text-muted)';if(d.prop==='font-size'&&parseFloat(d.value)<12)d.value='12px';});});
fs.writeFileSync(file,ast.toString());
