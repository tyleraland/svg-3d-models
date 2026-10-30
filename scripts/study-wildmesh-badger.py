# Reference-only Blender diagnostics; never saves the native file.
# Blender --background --python scripts/study-wildmesh-badger.py -- /absolute/SK_HoneyBadger.blend
import bpy,json,sys
from mathutils import Vector
if '--' in sys.argv:
 path=sys.argv[sys.argv.index('--')+1];bpy.ops.wm.open_mainfile(filepath=path)
else:path='/Users/tal/models/wildmesh-3d-paid-standard-license/100 MODELS - WildMesh3D/Realistic Animals/HoneyBadger/SK_HoneyBadger.blend'
with bpy.data.libraries.load(path,link=False)as(src,dst):names=list(src.actions)
# Tags distinguish Rat actions from identically named actions in preserved scenes.
actions={name:next((a for a in bpy.data.actions if a.get('wildmeshBadgerName')==name),None)or bpy.data.actions.get(name)for name in names}
s=bpy.context.scene;arm=next(o for o in s.objects if o.type=='ARMATURE');meshes=[o for o in s.objects if o.type=='MESH'];arm.animation_data_create()
for t in arm.animation_data.nla_tracks:t.mute=True
inventory={'source':path,'fps':s.render.fps/s.render.fps_base,'actions':[(n,list(a.frame_range))for n,a in actions.items()],'boneCount':len(arm.data.bones),'bind':{b.name:list(arm.matrix_world@b.head_local)for b in arm.data.bones}}
open('/tmp/badger-inventory.json','w').write(json.dumps(inventory,indent=2))
s.render.engine='BLENDER_WORKBENCH';s.render.resolution_x=850;s.render.resolution_y=550;s.render.resolution_percentage=100;s.display.shading.light='STUDIO';s.display.shading.color_type='SINGLE';s.display.shading.single_color=(.55,.43,.29);s.display.shading.show_cavity=True
cd=bpy.data.cameras.new('BadgerStudyCamera');cam=bpy.data.objects.new('BadgerStudyCamera',cd);s.collection.objects.link(cam);s.camera=cam;cd.type='ORTHO';out={}
for name in ['Idle','WalkMedium_F','TrotSlow_F_2','RunSlow_F_2','RunFast_F_2','GrazingOnSpotA_1','GrazingOnspotB2IdleThreat','A_GrazingOnSpot2Frighten_F']:
 a=actions[name];arm.animation_data.action=a
 if hasattr(a,'slots')and len(a.slots):arm.animation_data.action_slot=a.slots[0]
 out[name]=[]
 for i in range(41):
  t=i/40;f=a.frame_range[0]+t*(a.frame_range[1]-a.frame_range[0]);s.frame_set(int(f),subframe=f-int(f));bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get();points=[]
  for m in meshes:
   ev=m.evaluated_get(dg);points.extend(ev.matrix_world@Vector(c)for c in ev.bound_box)
  lo=Vector([min(p[k]for p in points)for k in range(3)]);hi=Vector([max(p[k]for p in points)for k in range(3)]);center=(hi+lo)/2
  out[name].append({'t':t,'bounds':[list(lo),list(hi)],'bones':{b.name:list(arm.matrix_world@b.head)for b in arm.pose.bones}})
  if i not in ([0]if name=='Idle'else[10,20,30]):continue
  for view,offset in [('side',(3,0,.12)),('front',(0,-3,.12)),('top',(0,0,3))]:
   if view!='side'and name!='Idle':continue
   cd.ortho_scale=max(hi-lo)*max(1,s.render.resolution_x/s.render.resolution_y)*1.12;cam.location=center+Vector(offset);cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=f'/tmp/badger-{name}-{i}-{view}.png';bpy.ops.render.render(write_still=True)
open('/tmp/badger-motion.json','w').write(json.dumps(out))
arm.animation_data.action=actions['Idle']
if hasattr(actions['Idle'],'slots')and len(actions['Idle'].slots):arm.animation_data.action_slot=actions['Idle'].slots[0]
s.frame_set(1)
for area in bpy.context.screen.areas:
 if area.type=='VIEW_3D':area.spaces.active.region_3d.view_location=Vector((0,0,.25));area.spaces.active.region_3d.view_distance=1.8
