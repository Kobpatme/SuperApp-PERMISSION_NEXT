import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
const group=process.argv[2];
if(!['auth','shell','dashboard','tables','details','modules'].includes(group))throw Error('Specify migration group');
const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory()){if(!f.includes(`${path.sep}legacy`))walk(f);}else if(f.endsWith('.css')&&!f.endsWith('tokens.css'))files.push(f);}}walk('src');
const tokens=fs.readFileSync('src/styles/tokens.css','utf8');
const aliases=Object.fromEntries([...tokens.matchAll(/(--(?:app-[\w-]+|ink|muted|line|canvas|surface|violet(?:-soft)?|teal(?:-soft)?|amber(?:-soft)?|rose|shadow)):\s*var\((--[\w-]+)\)/g)].map(m=>[m[1],m[2]]));
Object.assign(aliases,{'--pw-surface':'--color-surface','--pw-soft':'--color-surface-subtle','--pw-line':'--color-border','--pw-text':'--color-text','--pw-muted':'--color-text-muted','--deposit-blue':'--color-brand','--deposit-orange':'--color-warning','--deposit-green':'--color-success','--deposit-violet':'--color-info','--deposit-red':'--color-danger'});
function category(selector,file){
 if(/\.auth-|\.button\b/.test(selector)||file.endsWith('auth.css'))return 'auth';
 if(/topbar|top-brand|sidebar|shell|account|workspace-search|skip-link|round-btn|avatar|module-tab|environment-banner/.test(selector)||file.endsWith('shell.css'))return 'shell';
 if(/dashboard|attention|metric|operations-|source-readiness|workspace-health|heading-actions|page-heading|module-directory/.test(selector))return 'dashboard';
 if(/detail-|dialog|drawer|modal|popover|tooltip|toast/.test(selector))return 'details';
 if(/table|queue-|record-|owner-|status|filter|search-field|row/.test(selector))return 'tables';
 return 'modules';
}
function rgb(color){if(color.startsWith('#')){let h=color.slice(1);if(h.length<=4)h=[...h].map(x=>x+x).join('');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16),h.length===8?parseInt(h.slice(6,8),16)/255:1];}return color.match(/[\d.]+/g).map(Number);}
function semantic(color,prop,selector){const [r,g,b,a=1]=rgb(color);const max=Math.max(r,g,b),min=Math.min(r,g,b),light=(max+min)/510,saturation=max===min?0:(max-min)/(255-Math.abs(max+min-255));const background=/background/.test(prop),border=/border|outline/.test(prop),dark=selector.includes('data-theme="dark"');
 if(/shadow/.test(prop))return 'var(--color-shadow-ink)';
 if(prop==='color'&&min>235)return dark?'var(--color-text)':'var(--color-on-brand)';
 if(a<.85){if(saturation<.22&&light<.4)return 'var(--color-overlay)';if(light>.85)return 'var(--color-highlight)';}
 if(saturation<.22){if(background)return `var(--color-${dark?'surface':light>.95?'surface':light>.84?'surface-subtle':'bg'})`;if(border)return `var(--color-${light<.5?'border-strong':'border'})`;return `var(--color-${dark?light>.85?'text':'text-muted':light<.28?'text':'text-muted'})`;}
 let hue=max===min?0:max===r?60*((g-b)/(max-min)%6):max===g?60*((b-r)/(max-min)+2):60*((r-g)/(max-min)+4);if(hue<0)hue+=360;
 const role=hue<20||hue>335?'danger':hue<80?'warning':hue<180?'success':hue<240?'info':'brand';
 const soft=light>.88||a<.35||(background&&/badge|status|pill|banner|alert|notice|hint|health|state|tag/.test(selector));
 return `var(--color-${role}${soft?'-soft':''})`;
}
let count=0;
for(const file of files){const ast=postcss.parse(fs.readFileSync(file,'utf8'));ast.walkDecls(d=>{const selector=d.parent.selector||'';if(category(selector,file)!==group)return;
 let value=d.value;
 value=value.replace(/var\((--[\w-]+)/g,(m,name)=>aliases[name]?`var(${aliases[name]}`:m);
 if(/(?:linear|radial)-gradient/.test(value))value='var(--color-surface-subtle)';
 value=value.replace(/#[\da-f]{3,8}\b|\b(?:rgb|rgba)\([^)]*\)/gi,c=>semantic(c,d.prop,selector));
 if(d.prop==='font-size') {
   value=value.replace(/([\d.]+)px/g,(m,n)=>+n<12?'12px':m).replace(/([\d.]+)rem/g,(m,n)=>+n<.75?'.75rem':m);
   if(/^([\d.]+)em$/.test(value)&&parseFloat(value)<1)value=`max(12px,${value})`;
 }
 if(d.prop==='letter-spacing'&&value.startsWith('-'))value='normal';
 if(d.prop==='line-height'&&/^[\d.]+$/.test(value)){const floor=/h[1-6]|heading|title|headline/.test(selector)?1.35:1.6;if(parseFloat(value)<floor)value=String(floor);}
 if(d.prop==='font-family'&&!value.includes('var('))value=/mono|Consolas|Courier/i.test(value)?'var(--font-mono)':'var(--font-ui)';
 if(d.prop==='backdrop-filter')value='none';
 if(value!==d.value){count++;d.value=value;}
 });fs.writeFileSync(file,ast.toString());}
console.log(`${group}: ${count} declarations migrated; cascade order preserved; no selectors removed`);
