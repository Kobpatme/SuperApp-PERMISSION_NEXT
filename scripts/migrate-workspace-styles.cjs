/* One-time, reviewable migration: move active styles, remove duplicate token owners. */
const fs = require('node:fs');
const postcss = require('postcss');
const source = 'src/app/coral-stay-theme.css';
if (!fs.existsSync(source)) throw new Error('Migration already applied');
const mapping = {
  'stay-coral-hover': 'color-brand-hover', 'stay-coral-soft': 'color-brand-soft', 'stay-coral': 'color-brand',
  'stay-teal-soft': 'color-success-soft', 'stay-teal': 'color-success', 'stay-error': 'color-danger',
  'stay-success': 'color-success', 'stay-warning': 'color-warning', 'stay-shadow-1': 'shadow-xs',
  'stay-shadow-2': 'shadow-sm', 'stay-shadow-3': 'shadow-md', 'font-stay-body': 'font-ui',
  'font-stay-display': 'font-ui', 'font-stay-code': 'font-mono',
};
let active = postcss.parse(fs.readFileSync(source, 'utf8'));
active.walkRules(rule => {
  if (rule.selector === ':root' || rule.selector === 'html[data-theme="dark"]') rule.remove();
});
active.walkComments(comment => comment.remove());
let css = active.toString();
for (const [oldName, name] of Object.entries(mapping)) css = css.replaceAll('--' + oldName, '--' + name);
css = css.replaceAll('min-height: 80px', 'min-height: 64px').replaceAll('inset-block-start: 80px', 'inset-block-start: 64px')
  .replaceAll('min-height: 72px', 'min-height: 64px').replaceAll('inset-block-start: 72px', 'inset-block-start: 64px')
  .replaceAll('min-height: 48px', 'min-height: 40px').replaceAll('height: 68px', 'height: 52px')
  .replaceAll('clamp(30px, 3vw, 40px)', 'clamp(24px, 2vw, 30px)').replaceAll('font-size: 30px', 'font-size: 24px')
  .replaceAll('translateY(-2px)', 'none').replaceAll('border-radius: 9999px', 'border-radius: var(--radius-md)')
  .replaceAll('rgba(255, 90, 95, .24)', 'transparent').replaceAll('background: #742f33', 'background: var(--color-brand-soft)');
// Primary actions retain contrast in both color schemes.
css = css.replaceAll('color: #ffffff;', 'color: var(--color-on-brand);');
fs.writeFileSync('src/styles/components.css', '/* Shared presentation migrated from the former theme; domain layouts remain intact. */\n' + css.trim() + '\n');
let globals = postcss.parse(fs.readFileSync('src/app/globals.css', 'utf8'));
globals.walkRules(rule => {
  if (rule.selector === ':root' || rule.selector === 'html[data-theme="dark"]') {
    rule.walkDecls(decl => { if (decl.prop.startsWith('--')) decl.remove(); });
    if (!rule.nodes.length) rule.remove();
  }
});
fs.writeFileSync('src/app/globals.css', globals.toString());
let shell = fs.readFileSync('src/app/sidebar.css', 'utf8').replaceAll('256px', '240px').replaceAll('76px', '68px').replaceAll('80px', '64px');
fs.writeFileSync('src/styles/shell.css', shell);
let layout = fs.readFileSync('src/app/layout.tsx', 'utf8').replace('import "@/app/globals.css";', 'import "@/styles/tokens.css";\nimport "@/app/globals.css";').replace('@/app/sidebar.css', '@/styles/shell.css').replace('@/app/coral-stay-theme.css', '@/styles/components.css');
fs.writeFileSync('src/app/layout.tsx', layout);
fs.unlinkSync(source);
fs.unlinkSync('src/app/sidebar.css');
fs.unlinkSync('src/app/bouncebox-theme.css');
