import{test}from'node:test';
import assert from'node:assert/strict';
import{loadModel}from'@paper-rig/rigs';
import{solve,core,projectScene,compilePackage}from'@paper-rig/compiler';
import{inspectOcclusion}from'@paper-rig/validator/occlusion';
const r=loadModel('horse'),rear=['nearRearHoof','farRearHoof'],front=['nearFrontHoof','farFrontHoof'];
test('horse stomp starts and ends on all fours with alternating raised forelegs',()=>{
 const c=r.clips.stomp;assert.equal(c.loop,false);assert.equal(c.duration,2600);assert.equal(compilePackage(r).validation.status,'passed');
 const bind=solve(r,{clip:'bind'}),start=solve(r,{clip:'stomp',time:0}),end=solve(r,{clip:'stomp',time:1});for(const id of Object.keys(bind))for(let i=0;i<3;i++){assert.ok(Math.abs(start[id][i]-bind[id][i])<1e-8);assert.ok(Math.abs(end[id][i]-bind[id][i])<1e-8);}
 const a=solve(r,{clip:'stomp',time:.42}),b=solve(r,{clip:'stomp',time:.58});assert.ok(a.chest[2]>start.chest[2]+.65);assert.ok(a.nearFrontHoof[2]>a.farFrontHoof[2]+.2);assert.ok(b.farFrontHoof[2]>b.nearFrontHoof[2]+.2);assert.ok(b.nearFrontHoof[2]<a.nearFrontHoof[2]-.2);
 assert.deepEqual(new Set(core.contactIds(r,'stomp',.5)),new Set(rear));assert.deepEqual(new Set(core.contactIds(r,'stomp',.96)),new Set([...rear,...front]));
});
test('horse stomp preserves bones and planted hind hooves throughout interpolated motion',()=>{
 assert.ok(core.preservedClipLengthsPass(r,'stomp'));const initial=solve(r,{clip:'bind'});
 for(let i=0;i<=1200;i++){
 const t=i/1200,p=solve(r,{clip:'stomp',time:t});for(const id of rear)for(let axis=0;axis<3;axis++)assert.ok(Math.abs(p[id][axis]-initial[id][axis])<.00002,`${t}/${id}/${axis}`);
 for(const id of front)assert.ok(p[id][2]>-.00002,`${t}/${id} clearance`);
 for(const id of core.contactIds(r,'stomp',t))assert.ok(Math.abs(p[id][2])<.00002,`${t}/${id} contact`);
 }
 for(const f of r.clips.stomp.frames)assert.deepEqual(Object.keys(f.poses),['root']);
});
test('horse stomp remains framed and consistently stacked throughout the directional matrix',()=>{
 for(const time of [0,.08,.12,.24,.34,.42,.5,.58,.72,.8,.92,1])for(const elevation of [0,30,45,60,75,90])for(let heading=0;heading<360;heading+=22.5){const s=projectScene(r,{clip:'stomp',time,elevation,heading});assert.deepEqual(inspectOcclusion(r,s).violations,[],`${time}/${elevation}/${heading}`);for(const j of s.joints)assert.ok(j.screenPosition.every(v=>v>=0&&v<=100),`${time}/${elevation}/${heading}/${j.id}`);}
});
