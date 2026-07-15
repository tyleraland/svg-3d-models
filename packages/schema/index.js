// @paper-rig/schema — paper-rig/1 constants, vector/plate/joint primitives.
// Extracted verbatim from paper-rig-workbench.html (see scripts/extract-packages.mjs).

export const V=(x,y,z)=>[x,y,z], C={schema:'paper-rig/1',schemaVersion:'1.1.0',generatorVersion:'0.10.0',generator:'paper-rig-workbench/0.10.0',axes:{origin:'ground center between contacts',forward:'+x',lateral:'+y/left',up:'+z',units:'meters',transforms:'joint-local'},spaces:['model','joint-local','posed-world','camera','token'],materials:{paperMain:'#d7c39c',paperShade:'#b99d73',paperLight:'#eadbb9',ink:'#39362e',shadow:'#9d927d',equipmentMetal:'#727b7a',equipmentLeather:'#735545'}};
export const joint=(id,parent,bind,extra={})=>({id,parent,bind,...extra});
export const plate=(id,bone,shape,size,role,zBias=0)=>({id,bone,shape,size,role,attachment:'rigid',material:role==='shadow'?'shadow':role==='accent'?'paperShade':'paperMain',zBias});
export const spanPlate=(id,from,to,width,role,zBias=0)=>({...plate(id,to,'bone',[width],role,zBias),span:[from,to],jointOverlap:1.18});
export const taperedSpanPlate=(id,from,to,width,role,zBias=0)=>({...spanPlate(id,from,to,width,role,zBias),shape:'taperedBone'});
export const polygonPlate=(id,bone,points,role,zBias=0)=>({...plate(id,bone,'polygon',[.1],role,zBias),points:[...points]});
export const pathPlate=(id,bone,path,size,role,zBias=0)=>({...plate(id,bone,'customPath',size,role,zBias),localPath:path,planeAxes:['+y','-x']});
export const axisVector=v=>Array.isArray(v)?[...v]:v==='+x'?[1,0,0]:v==='-x'?[-1,0,0]:v==='+y'?[0,1,0]:v==='-y'?[0,-1,0]:v==='-z'?[0,0,-1]:[0,0,1];
export const cloneData=x=>JSON.parse(JSON.stringify(x));

// Object.groupBy polyfill for runtimes below Node 20.10 (used by the compiler).
if(!Object.groupBy)Object.groupBy=(items,key)=>items.reduce((out,item)=>{const k=key(item);(out[k]??=[]).push(item);return out},{});
