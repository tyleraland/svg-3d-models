# Blender --background --disable-autoexec --python scripts/study-quaternius.py
# Pass -- frog (default) or -- wasp to choose a detailed study.
# Read-only source studies; native files are never saved. Renders go to /tmp.
import bpy,json,os,sys
from mathutils import Vector
root=os.path.expanduser('~/models/quaternius')
entries=[('frog','Easy Animated Enemy Pack - Jan 2019','Frog'),('wasp','Easy Animated Enemy Pack - Jan 2019','Wasp')]+[(name.lower(),'Dinosaur Animated Pack - Dec 2018',name)for name in ['Apatosaurus','Parasaurolophus','Stegosaurus','Trex','Triceratops','Velociraptor']]
inventory=[]
for id,pack,name in entries:
 path=os.path.join(root,pack,'Blends',name+'.blend');bpy.ops.wm.open_mainfile(filepath=path,load_ui=False,use_scripts=False);s=bpy.context.scene
 inventory.append({'id':id,'path':path,'fps':s.render.fps/s.render.fps_base,'objects':[{'name':o.name,'type':o.type,'dimensions':list(o.dimensions)}for o in s.objects if o.type in ['MESH','ARMATURE']],'actions':[{'name':a.name,'frames':list(a.frame_range)}for a in bpy.data.actions]})
open('reference-studies/quaternius-inventory.json','w').write(json.dumps(inventory,indent=2)+'\n')
selected=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'frog'
reference=next(x for x in inventory if x['id']==selected)
if selected not in ['frog','wasp','apatosaurus','parasaurolophus','stegosaurus','trex','triceratops','velociraptor']: raise ValueError('Unknown reference')
path=reference['path'];bpy.ops.wm.open_mainfile(filepath=path,load_ui=False,use_scripts=False);s=bpy.context.scene;arm=next(o for o in s.objects if o.type=='ARMATURE');meshes=[o for o in s.objects if o.type=='MESH']
arm.animation_data_create()
for t in arm.animation_data.nla_tracks:t.mute=True
out={'path':path,'fps':s.render.fps/s.render.fps_base,'bones':[{'name':b.name,'parent':b.parent.name if b.parent else None,'head':list(arm.matrix_world@b.head_local),'tail':list(arm.matrix_world@b.tail_local)}for b in arm.data.bones],'actions':{}}
s.render.engine='BLENDER_WORKBENCH';s.render.resolution_x=720;s.render.resolution_y=540;s.render.resolution_percentage=100;s.display.shading.light='STUDIO';s.display.shading.color_type='MATERIAL';s.display.shading.show_cavity=True
cd=bpy.data.cameras.new('PaperStudyCamera');cam=bpy.data.objects.new('PaperStudyCamera',cd);s.collection.objects.link(cam);s.camera=cam;cd.type='ORTHO'
rest_action=next((a.name for a in bpy.data.actions if 'Idle' in a.name or 'Flying' in a.name),bpy.data.actions[0].name)
for a in bpy.data.actions:
 arm.animation_data.action=a
 if hasattr(a,'slots')and len(a.slots):arm.animation_data.action_slot=a.slots[0]
 frames=[]
 for i in range(41):
  t=i/40;f=a.frame_range[0]+t*(a.frame_range[1]-a.frame_range[0]);s.frame_set(int(f),subframe=f-int(f));bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get();pts=[]
  for m in meshes:
   ev=m.evaluated_get(dg);pts.extend(ev.matrix_world@Vector(c)for c in ev.bound_box)
  lo=Vector([min(p[k]for p in pts)for k in range(3)]);hi=Vector([max(p[k]for p in pts)for k in range(3)]);center=(lo+hi)/2
  frames.append({'t':t,'bounds':[list(lo),list(hi)],'bones':{b.name:{'head':list(arm.matrix_world@b.head),'tail':list(arm.matrix_world@b.tail),'rotation':[list(row) for row in (arm.matrix_world@b.matrix).to_3x3()]}for b in arm.pose.bones}})
  if i not in [0,10,20,30,40]:continue
  views=[('side',(0,-6,.2)),('front',(6,0,.2)),('top',(0,0,6))] if selected=='wasp' else [('side',(6,0,.2)),('front',(0,-6,.2)),('top',(0,0,6))]
  for view,offset in views:
   if view!='side'and not(a.name==rest_action and i==0):continue
   cd.ortho_scale=max(hi-lo)*4/3*1.25;cam.location=center+Vector(offset);cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath='/tmp/quaternius-'+a.name+'-'+str(i)+'-'+view+'.png';bpy.ops.render.render(write_still=True)
 out['actions'][a.name]={'frames':list(a.frame_range),'samples':frames}
open('reference-studies/'+selected+'-reference.json','w').write(json.dumps(out,indent=2)+'\n')
