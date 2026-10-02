import fs from 'node:fs';
import sharp from 'sharp';
const pages={
  'page.tsx':'ภาพรวม', 'admin/page.tsx':'ผู้ดูแลระบบ', 'work/page.tsx':'ภาพรวมงาน', 'work/mine/page.tsx':'งานของฉัน', 'work/team/page.tsx':'ภาพรวมทีม', 'work/people/page.tsx':'บุคลากร', 'work/tracker/page.tsx':'ติดตามงาน', 'work/assign/page.tsx':'มอบหมายงาน', 'work/new/page.tsx':'เพิ่มงาน', 'work/kpi/page.tsx':'ผลการทำงานของฉัน', 'work/reports/page.tsx':'รายงานงาน',
  'buildings/page.tsx':'อาคารและค่าใช้จ่าย', 'buildings/map/page.tsx':'แผนที่อาคาร', 'buildings/new/page.tsx':'เพิ่มอาคาร', 'buildings/[id]/page.tsx':'รายละเอียดอาคาร', 'guarantees/page.tsx':'เงินประกันอาคาร', 'guarantees/new/page.tsx':'เพิ่มรายการเงินประกัน', 'guarantees/[id]/page.tsx':'รายละเอียดเงินประกัน',
};
for (const [file,title] of Object.entries(pages)) {
  const path=`src/app/(platform)/${file}`; let text=fs.readFileSync(path,'utf8');
  if (/export (const metadata|async function generateMetadata)/.test(text)) continue;
  text=`import type { Metadata } from "next";\nexport const metadata: Metadata = { title: ${JSON.stringify(title)} };\n`+text; fs.writeFileSync(path,text);
}
const tokens=fs.readFileSync('src/styles/tokens.css','utf8');
const brand=tokens.match(/--color-brand:\s*(#[\da-f]+)/i)[1]; const ink=tokens.match(/--color-on-brand:\s*(#[\da-f]+)/i)[1];
for (const [name,size] of [['icon',192],['apple-icon',180]]) {
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 192 192"><rect width="192" height="192" rx="40" fill="${brand}"/><text x="96" y="119" text-anchor="middle" font-family="Arial,sans-serif" font-size="72" font-weight="700" fill="${ink}">PN</text></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`src/app/${name}.png`);
}
console.log('Thai page titles and local PN icons generated from tokens');
