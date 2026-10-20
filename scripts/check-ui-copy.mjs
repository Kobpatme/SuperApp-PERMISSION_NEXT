import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
const forbidden=/Argon2|RBAC|PostgreSQL|ฐานข้อมูล|DATABASE|\bNAS\b|\bsession\b|\bserver\b|Developer|readiness|foundation|read model|outbox|Effective Access|Data Scope|เซิร์ฟเวอร์/i;
const findings=[];
function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){
 const file=path.join(dir,e.name); if(e.isDirectory()){if(!file.includes(`${path.sep}legacy`))scan(file);continue;}
 if(!file.endsWith('.tsx')||file.includes('.test.'))continue;
 const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 function visit(node){
   if(ts.isJsxText(node)&&forbidden.test(node.text)) findings.push({file,line:source.getLineAndCharacterOfPosition(node.pos).line+1,category:file.includes('delete-building')?'B_admin_delete_confirmation':'A_user_copy',text:node.text.trim()});
   if(ts.isJsxAttribute(node)&&['title','description','placeholder','aria-label','label'].includes(node.name.getText(source))&&node.initializer&&ts.isStringLiteral(node.initializer)&&forbidden.test(node.initializer.text))findings.push({file,line:source.getLineAndCharacterOfPosition(node.pos).line+1,category:'A_user_copy',text:node.initializer.text});
   ts.forEachChild(node,visit);
 }visit(source);
}}
scan('src');
fs.writeFileSync('docs/quality/ux-login-evidence/ui-copy-findings.json',JSON.stringify({scope:'JSX text and display attributes; dynamic state additionally checked through e2e; admin technical codes allowed; development-only legacy excluded',findings},null,2));
console.log(`${findings.filter(x=>x.category==='A_user_copy').length} category-A static findings; ${findings.length} total`);
process.exitCode=findings.some(x=>x.category==='A_user_copy')?1:0;
