import {test} from 'node:test';
import assert from 'node:assert/strict';
import {verifyDeploy} from './verify-deploy.mjs';
const response=(status,commit,http=200)=>async()=>Response.json({status,build:{shortCommit:commit}},{status:http});
test('accepts matching short/full SHA and ready status',async()=>{assert.deepEqual(await verifyDeploy('http://localhost:3110','abcdef0123456789',response('ready','abcdef012345')),{status:'ready',shortCommit:'abcdef012345'});});
test('rejects wrong commit, degraded status, absent build and HTTP errors',async()=>{for(const mock of [response('ready','000000012345'),response('degraded','abcdef012345'),response('ready',null),response('ready','abcdef012345',503)])await assert.rejects(verifyDeploy('http://localhost:3110','abcdef012345',mock));});
test('rejects credentials and too-short expected SHA without requesting',async()=>{await assert.rejects(verifyDeploy('https://user:password@example.test','abcdef012345',()=>{throw Error('must not fetch');}));await assert.rejects(verifyDeploy('http://localhost:3110','abc',()=>{throw Error('must not fetch');}));});
