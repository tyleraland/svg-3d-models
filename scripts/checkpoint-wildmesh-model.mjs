// Explicit per-creature fixture/build checkpoint; never refreshes another model's oracle.
import fs from 'node:fs';
import {loadFamily,loadModelSource,loadModel} from '@paper-rig/rigs';
import {compilePackage} from '@paper-rig/compiler';
import {validateSourcePair} from '@paper-rig/validator/source';
const id=process.argv[2],label=process.argv[3]||id;
if(!id)throw Error('Provide one model ID');
const source=loadModelSource(id),report=validateSourcePair(source,loadFamily(source.family));if(report.status!=='passed')throw Error(JSON.stringify(report.issues));
const r=loadModel(id),pkg=compilePackage(r);
if(pkg.validation.status!=='passed')throw Error(JSON.stringify(pkg.validation));
for(const [dir,value]of [['rigs',r],['packages',pkg]])fs.writeFileSync(`fixtures/${dir}/${id}.json`,JSON.stringify(value,null,2)+'\n');
const path='apps/workbench/template.html';let t=fs.readFileSync(path,'utf8');const before=id==='crocodile'?'lizard':id==='duck'?'goose':'badger';if(!t.includes(`value="${id}"`))t=t.replace(`<option value="${before}">`,`<option value="${id}">${label}</option><option value="${before}">`);fs.writeFileSync(path,t);
