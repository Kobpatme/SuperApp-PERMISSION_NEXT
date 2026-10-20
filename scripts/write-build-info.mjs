import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
if(process.argv.includes('--ensure')&&existsSync('src/generated/build-info.json'))process.exit(0);
function git(...args) { try { return execFileSync('git',args,{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','ignore']}).trim(); } catch { return null; } }
const commit=process.env.APP_COMMIT_SHA||process.env.VERCEL_GIT_COMMIT_SHA||process.env.CF_PAGES_COMMIT_SHA||process.env.GITHUB_SHA||git('rev-parse','HEAD');
const branch=process.env.APP_BRANCH||process.env.VERCEL_GIT_COMMIT_REF||process.env.CF_PAGES_BRANCH||process.env.GITHUB_HEAD_REF||process.env.GITHUB_REF_NAME||git('branch','--show-current');
const date=process.env.APP_BUILT_AT ? new Date(process.env.APP_BUILT_AT) : new Date();
const info={shortCommit:commit&&/^[a-f0-9]{7,64}$/i.test(commit)?commit.slice(0,12).toLowerCase():null,branch:branch&&branch.length<=160&&/^[\w./-]+$/.test(branch)?branch:null,builtAt:Number.isFinite(date.getTime())?date.toISOString():null};
mkdirSync('src/generated',{recursive:true});writeFileSync('src/generated/build-info.json',JSON.stringify(info)+'\n');
console.log('Public build metadata generated');
