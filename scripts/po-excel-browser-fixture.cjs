// Full-stack local QA fixture: synthetic login and workbook on a disposable DB.
const fs = require('node:fs');
const ts = require('typescript');
const { spawn } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const postgres = require('postgres');
const { hash } = require('@node-rs/argon2');
const env = require('dotenv').parse(fs.readFileSync('.env.local'));
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop:true } }).outputText, file);
const { createPoTestClone } = require('../tests/fixtures/po-test-clone.ts');
const { makePoWorkbook, excelTestRow } = require('../tests/fixtures/po-excel.ts');
const name = `po_browser_test_${Date.now()}`;
async function main() {
  const elevated = new URL(env.DATABASE_URL_MIGRATE), runtime = new URL(env.DATABASE_URL);
  elevated.pathname = '/postgres';
  await createPoTestClone(name, elevated, runtime);
  const cloneOperator = new URL(elevated); cloneOperator.pathname = `/${name}`;
  const db = postgres(cloneOperator.href, { max:1 });
  try {
    await db.unsafe(fs.readFileSync('supabase/migrations/0066_po_unknown_price.sql','utf8'));
    const id = randomUUID(), passwordHash = await hash('PoBrowserFixture123!');
    await db`insert into profiles(id,email,display_name,status) values(${id},'po-browser@example.test','PO browser fixture','active')`;
    await db`insert into local_credentials(user_id,password_hash,must_change_password) values(${id},${passwordHash},false)`;
    const [role] = await db`select id from roles where code='platform_admin'`;
    const [assignment] = await db`insert into user_role_assignments(user_id,role_id) values(${id},${role.id}) returning id`;
    await db`insert into data_scope_grants(assignment_id,scope_type) values(${assignment.id},'ALL')`;
    const po = `WEBPO-${Date.now()}`;
    const row = { ...excelTestRow(po), 'Unit Price':'', 'PO Amount':'', Note:'ทดสอบอัปโหลดจริง' };
    const headers = [...Object.keys(row)].reverse();
    fs.mkdirSync('.data',{recursive:true});
    fs.writeFileSync('.data/po-browser-upload.xlsx',makePoWorkbook([row],headers));
    fs.writeFileSync('.data/po-browser-update.xlsx',makePoWorkbook([{...row,ETA:'รอส่งรอบใหม่',Note:'อัปเดตจากหน้าเว็บ'}],headers));
    fs.writeFileSync('.data/po-browser-fixture.json',JSON.stringify({database:name,po}));
    runtime.pathname = `/${name}`;
    const child = spawn(process.execPath, ['node_modules/next/dist/bin/next','start','-p','3106','-H','127.0.0.1'], { stdio:'inherit', windowsHide:true, env:{...process.env,...env,DATABASE_URL:runtime.href,NODE_ENV:'production'} });
    console.log('Synthetic PO browser fixture at http://127.0.0.1:3106');
    const stop = () => child.kill();
    process.on('SIGINT',stop);
    process.stdin.on('data',data=>{if(data.includes(3))stop();});
    await new Promise(resolve=>child.on('exit',resolve));
  } finally {
    await db.end();
    const admin = postgres(elevated.href,{max:1});
    try { await admin.unsafe(`drop database if exists ${name} with (force)`); } finally { await admin.end(); }
  }
}
main().catch(error=>{console.error('PO fixture failed:',error.code||error.name);process.exitCode=1;});
