import{test}from'node:test';
import assert from'node:assert/strict';
import{loadModel,loadFamily,loadModelSource}from'@paper-rig/rigs';
import{projectScene,compilePackage,renderSvg}from'@paper-rig/compiler';
import{validateFamilySource,validateModelSource}from'@paper-rig/validator/source';
import{inspectOcclusion}from'@paper-rig/validator/occlusion';
const group=(s,id)=>s.compositingGroups.find(g=>g.elements.some(e=>e.sourceId===id&&!e.generated));
test('over-core is an explicit validated family/model authoring option, with unknown modes rejected',()=>{
 const family=structuredClone(loadFamily(loadModelSource('rabbit').family));family.plates.find(p=>p.role!=='shadow').occlusionMode='over-core';assert.equal(validateFamilySource(family).status,'passed');
 const model=structuredClone(loadModelSource('rabbit'));model.plateOverrides=[{id:'headPlate',set:{occlusionMode:'over-core'}}];assert.equal(validateModelSource(model).status,'passed');model.plateOverrides[0].set.occlusionMode='foreground-ish';assert.equal(validateModelSource(model).status,'failed');
});
test('over-core plates and inherited seams export a fixed foreground contract and retain their semantic region',()=>{
 const r=loadModel('kangaroo'),pkg=compilePackage(r),records=[...pkg.plates,...pkg.gaskets].filter(p=>p.occlusionMode==='over-core');assert.equal(records.length,14);assert.equal(pkg.validation.status,'passed');assert.ok(pkg.validation.checks.find(c=>c.id==='over-core-compositor-contract').pass);
 for(const p of records){assert.equal(p.bodyRegion,'limb');assert.equal(p.compositingGroup,'camera-near appendages');assert.deepEqual(p.eligibleCompositingGroups,['camera-near appendages']);assert.equal(p.headingSwapsNearFar,false);assert.ok(!pkg.coreOccluder.memberPlateIds.includes(p.id)&&!pkg.coreOccluder.memberGasketIds.includes(p.id));}
 for(const heading of [0,45,90,135,180,225,270,315]){const s=projectScene(r,{clip:'attack',time:.42,elevation:45,heading});for(const p of records)assert.equal(group(s,p.id)?.id,'cameraNearAppendagesGroup',p.id);assert.deepEqual(inspectOcclusion(r,s).violations,[]);const svg=renderSvg(r,{clip:'attack',time:.42,elevation:45,heading});assert.ok(svg.indexOf('id="nearUpperArmPlate"')>svg.indexOf('id="coreOccluder"'));}
});
test('the independent oracle rejects a foreground plate or inherited seam demoted behind the body',()=>{
 const r=loadModel('kangaroo');for(const id of ['nearUpperArmPlate','nearShoulderGasket']){const s=projectScene(r,{clip:'idle',time:0,elevation:0,heading:22.5}),g=group(s,id),i=g.elements.findIndex(e=>e.sourceId===id&&!e.generated),[e]=g.elements.splice(i,1);s.compositingGroups.find(g=>g.id==='cameraFarAppendagesGroup').elements.push(e);assert.ok(inspectOcclusion(r,s).violations.some(v=>v.kind==='over-core-order'&&v.elementId===id));}
});
