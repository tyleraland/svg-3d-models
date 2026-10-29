# Blender --background --python scripts/study-wildmesh-birds.py -- /absolute/reference.blend eagle
# Tags: eagle, bald-eagle (FBX), crow. Diagnostic renders/measurements go to /tmp/r4-*.
# Reference scenes are opened read-only and never saved.
import bpy,json,os,sys
path=sys.argv[sys.argv.index('--')+1]; tag=sys.argv[-1]
if path.endswith('.blend'):bpy.ops.wm.open_mainfile(filepath=path)
else:
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.fbx(filepath=path)
s=bpy.context.scene
r={'path':path,'fps':s.render.fps/s.render.fps_base,'objects':[(o.name,o.type,list(o.dimensions))for o in s.objects if o.type in ['MESH','ARMATURE']],'actions':[(a.name,list(a.frame_range))for a in bpy.data.actions],'bones':[(o.name,[(b.name,b.parent.name if b.parent else None,list(b.head_local),list(b.tail_local))for b in o.data.bones])for o in s.objects if o.type=='ARMATURE']}
open('/tmp/r4-'+tag+'-inventory.json','w').write(json.dumps(r,indent=2))
from mathutils import Vector
arm=next(o for o in s.objects if o.type=='ARMATURE'); meshes=[o for o in s.objects if o.type=='MESH'];arm.animation_data_create()
for tr in arm.animation_data.nla_tracks:tr.mute=True
s.render.engine='BLENDER_WORKBENCH';s.render.resolution_x=850;s.render.resolution_y=650;s.render.resolution_percentage=100;s.display.shading.light='STUDIO';s.display.shading.color_type='SINGLE';s.display.shading.single_color=(.55,.45,.3);s.display.shading.show_cavity=True
camdata=bpy.data.cameras.new('BirdStudyCamera');cam=bpy.data.objects.new('BirdStudyCamera',camdata);s.collection.objects.link(cam);s.camera=cam;camdata.type='ORTHO'
selected={'eagle':['Idle','FlyLoop','GlideLoop','Strike1','Strike2'],'crow':['Look','Fly','Walk','WalkSpeed','Jump'],'bald-eagle':[]}[tag]
if tag=='bald-eagle':selected=[a.name for a in bpy.data.actions if any(k in a.name for k in ['Fly_Heavy','Fly_Light','Fly_Glide','Loco_Walk','Loco_Run','Eating_01','Diving_PickUp','Stand_Ground_00']) and '-IP' not in a.name and a.name.startswith('RigRoot|')]
result={}
for name in selected:
 a=bpy.data.actions[name];arm.animation_data.action=a
 if hasattr(a,'slots') and len(a.slots):arm.animation_data.action_slot=a.slots[0]
 result[name]=[]
 for i in range(17):
  t=i/16;frame=a.frame_range[0]+t*(a.frame_range[1]-a.frame_range[0]);s.frame_set(int(frame),subframe=frame-int(frame));bpy.context.view_layer.update()
  deps=bpy.context.evaluated_depsgraph_get();pts=[]
  for m in meshes:
   ev=m.evaluated_get(deps);pts.extend(ev.matrix_world@Vector(c)for c in ev.bound_box)
  lo=Vector([min(p[k]for p in pts)for k in range(3)]);hi=Vector([max(p[k]for p in pts)for k in range(3)]);center=(lo+hi)/2
  result[name].append({'t':t,'bounds':[list(lo),list(hi)],'bones':{b.name:list(arm.matrix_world@b.head)for b in arm.pose.bones}})
  if i not in [0,4,8,12]:continue
  for view,offset in [('side',(5,0,.4)),('front',(0,-5,.4)),('top',(0,0,6))]:
   if i!=4 and view!='side':continue
   camdata.ortho_scale=max(hi-lo)*1.2;cam.location=center+Vector(offset);cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=f'/tmp/r4-{tag}-{name.replace("/","_")}-{i}-{view}.png';bpy.ops.render.render(write_still=True)
open('/tmp/r4-'+tag+'-motion.json','w').write(json.dumps(result))
