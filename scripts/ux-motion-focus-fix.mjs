import fs from 'node:fs';
const file='src/components/workspace-queue.tsx';let s=fs.readFileSync(file,'utf8');
s=s.replace('function DetailPanel({ item, preview, onClose }: { item: DashboardItem; preview: boolean; onClose: () => void })','function DetailPanel({ item, preview, onClose, opener }: { item: DashboardItem; preview: boolean; onClose: () => void; opener: HTMLElement | null })');
s=s.replace('const focused = document.activeElement as HTMLElement | null;','const focused = opener ?? (document.activeElement as HTMLElement | null);');
s=s.replace('  }, []);\n  const moduleInfo', '  }, [opener]);\n  const moduleInfo');
s=s.replace('  const params = useSearchParams();','  const openerRef = useRef<HTMLElement | null>(null);\n  const params = useSearchParams();');
s=s.replace('onClick={() => update({ record: item.id, module: item.moduleId }, true)}','onClick={event => { openerRef.current=event.currentTarget; update({ record: item.id, module: item.moduleId }, true); }}');
s=s.replace('item={activeRecord} preview={preview} onClose=', 'item={activeRecord} preview={preview} opener={openerRef.current} onClose=');
fs.writeFileSync(file,s);
