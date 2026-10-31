// Explicit per-creature fixture/build checkpoint; never refreshes another model's oracle.
import fs from 'node:fs';
import {loadModel} from '@paper-rig/rigs';
import {compilePackage} from '@paper-rig/compiler';
const id=process.argv[2],label=process.argv[3]||id;
if(!id)throw Error('Provide one model ID');
const r=loadModel(id),pkg=compilePackage(r);
if(pkg.validation.status!=='passed')throw Error(JSON.stringify(pkg.validation));
for(const [dir,value]of [['rigs',r],['packages',pkg]])fs.writeFileSync(`fixtures/${dir}/${id}.json`,JSON.stringify(value,null,2)+'\n');
const path='apps/workbench/template.html';let t=fs.readFileSync(path,'utf8');if(!t.includes(`value="${id}"`))t=t.replace('<option value="badger">',`<option value="${id}">${label}</option><option value="badger">`);fs.writeFileSync(path,t);
