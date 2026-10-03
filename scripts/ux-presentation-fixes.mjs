import fs from 'node:fs';
import postcss from 'postcss';
const file='src/app/globals.css';const ast=postcss.parse(fs.readFileSync(file,'utf8'));
ast.walkRules(rule=>{
 if(rule.selector.includes('data-theme="dark"')&&rule.selector.includes('.top-brand-mark'))rule.walkDecls('background-color',d=>d.value='var(--color-brand)');
 if(rule.selector==='.top-brand-mark')rule.walkDecls('color',d=>d.value='var(--color-on-brand)');
});fs.writeFileSync(file,ast.toString());
