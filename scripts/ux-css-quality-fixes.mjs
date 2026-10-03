import fs from 'node:fs';import path from 'node:path';import postcss from 'postcss';
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory()){if(!file.includes(`${path.sep}legacy`))walk(file);continue;}if(!file.endsWith('.css')||file.endsWith('tokens.css'))continue;
 const ast=postcss.parse(fs.readFileSync(file,'utf8'));ast.walkDecls(d=>{const selector=d.parent.selector||'';
  d.value=d.value.replaceAll('var(--bounce-teal','var(--color-success').replaceAll('var(--app-info','var(--color-info');
  if(d.prop==='outline'||d.prop==='outline-color')d.value=d.value.replace(/color-mix\(in srgb,\s*var\(--(?:color-brand|app-brand)\)\s*[\d.]+%,\s*transparent\)/g,'var(--color-focus-ring)');
  if(d.prop==='border-color'&&selector.includes(':focus'))d.value='var(--color-focus-ring)';
  if(d.prop.startsWith('border')&&/(?:^|[\s>,+~])(?:input|select|textarea)(?=[:.\[#\s,>+~]|$)/.test(selector))d.value=d.value.replace(/var\(--color-border\)/g,'var(--color-border-strong)');
  if(d.prop==='font-size'){d.value=d.value.replace(/([\d.]+)px/g,(m,n)=>+n<12?'12px':m).replace(/([\d.]+)rem/g,(m,n)=>+n<.75?'.75rem':m);if(/^([\d.]+)em$/.test(d.value)&&parseFloat(d.value)<1)d.value=`max(12px,${d.value})`;}
 });fs.writeFileSync(file,ast.toString());
}}
walk('src');console.log('Focus indicators, form boundaries and minimum font sizes normalized in existing selectors');
