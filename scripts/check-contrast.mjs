import fs from 'node:fs';
const source = fs.readFileSync('src/styles/tokens.css', 'utf8');
const values = block => Object.fromEntries([...block.matchAll(/(--[\w-]+)\s*:\s*(#[\da-f]{3,8})\s*;/gi)].map(m => [m[1], m[2]]));
const light = values(source.slice(source.indexOf(':root'), source.indexOf('html[data-theme="dark"]')));
const dark = { ...light, ...values(source.slice(source.indexOf('html[data-theme="dark"]'))) };
const luminance = hex => {
  let raw = hex.slice(1); if (raw.length === 3) raw = [...raw].map(x => x + x).join('');
  const channels = [0,2,4].map(i => parseInt(raw.slice(i,i+2),16)/255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
  return channels[0]*.2126 + channels[1]*.7152 + channels[2]*.0722;
};
const pairs = [];
for (const fg of ['text','text-muted','text-subtle']) for (const bg of ['bg','surface','surface-subtle']) pairs.push([`color-${fg}`,`color-${bg}`,4.5]);
for (const kind of ['brand','success','warning','danger','info']) {
  pairs.push([`color-${kind}`,`color-${kind}-soft`,4.5]);
  pairs.push([`color-${kind}`,'color-surface',4.5]);
}
for (const bg of ['brand','brand-hover','brand-strong']) pairs.push(['color-on-brand',`color-${bg}`,4.5]);
pairs.push(['color-on-brand-deep','color-brand-deep',4.5],['color-focus-ring','color-surface',3],['color-border-strong','color-surface',3]);
for(const bg of ['bg','surface-subtle']) pairs.push(['color-focus-ring',`color-${bg}`,3],['color-border-strong',`color-${bg}`,3]);
let failures = 0;
for (const [theme, tokens] of Object.entries({ light, dark })) for (const [fg,bg,min] of pairs) {
  const a = tokens[`--${fg}`], b = tokens[`--${bg}`];
  if (!a || !b) throw new Error(`Missing pair token ${fg}/${bg}`);
  const l = [luminance(a),luminance(b)].sort((a,b)=>b-a); const ratio = (l[0]+.05)/(l[1]+.05);
  if (ratio < min) { console.error(`${theme}: ${fg}/${bg} ${ratio.toFixed(2)} < ${min}`); failures++; }
}
console.log(`${pairs.length*2} contrast pairs checked; ${failures} failures`);
process.exitCode = failures ? 1 : 0;
