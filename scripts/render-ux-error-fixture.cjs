const fs=require('node:fs');
const path=require('node:path');
const Module=require('node:module');
const ts=require('typescript');
// This hook is confined to this test-render process; no application runtime change.
const resolve=Module._resolveFilename;
Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.resolve('src',request.slice(2)):request,...args);};
for(const extension of ['.ts','.tsx'])require.extensions[extension]=(module,file)=>{
  const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  module._compile(output,file);
};
const React=require('react');const {renderToStaticMarkup}=require('react-dom/server');
const {AuthShell}=require('../src/components/auth/auth-shell.tsx');const {ErrorState}=require('../src/components/ui/error-state.tsx');const {copy}=require('../src/lib/copy.ts');
const html=renderToStaticMarkup(React.createElement(AuthShell,{title:copy.feedback.errorTitle,description:copy.feedback.errorDescription},React.createElement(ErrorState,{embedded:true,digest:'synthetic-reference',reset:()=>{}})));
fs.writeFileSync('docs/quality/ux-login-evidence/error-render-fixture.html',html);
console.log('Actual AuthShell/ErrorState components rendered into isolated browser fixture.');
