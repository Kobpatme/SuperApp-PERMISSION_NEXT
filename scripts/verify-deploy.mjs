import { parseArgs } from 'node:util';
export async function verifyDeploy(url, expected, fetcher=fetch) {
  const base=new URL(url);if(!['http:','https:'].includes(base.protocol)||base.username||base.password)throw Error('Use an HTTP(S) base URL without credentials');
  if(!/^[a-f0-9]{7,64}$/i.test(expected))throw Error('Expected commit must be a SHA (at least 7 characters)');
  const response=await fetcher(new URL('/api/health',base),{signal:AbortSignal.timeout(15000),redirect:'error',headers:{accept:'application/json'}});
  const body=await response.json();const actual=body.build?.shortCommit;
  const length=typeof actual==='string'?Math.min(actual.length,expected.length):0;
  if(!response.ok||body.status!=='ready'||length<7||! /^[a-f0-9]{7,64}$/i.test(actual)||actual.slice(0,length).toLowerCase()!==expected.slice(0,length).toLowerCase())throw Error('Health status or deployed commit does not match');
  return {status:body.status,shortCommit:actual};
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/verify-deploy.mjs')){
 try {const {values}=parseArgs({options:{url:{type:'string'},'expect-commit':{type:'string'}}});if(!values.url||!values['expect-commit'])throw Error('Usage: --url <base> --expect-commit <sha>');const result=await verifyDeploy(values.url,values['expect-commit']);console.log(`Verified ready build ${result.shortCommit}`);}
 catch(error){console.error(error.message);process.exitCode=1;}
}
