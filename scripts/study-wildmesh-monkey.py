# Native reference diagnostics only. No reference data is embedded in the SVG rig.
# Blender --background --python scripts/study-wildmesh-monkey.py -- /absolute/SK_Monkey_Stylized.blend
import bpy,json,sys
from mathutils import Vector
if '--' in sys.argv:
 path=sys.argv[sys.argv.index('--')+1];bpy.ops.wm.open_mainfile(filepath=path)
else:path='/Users/tal/models/wildmesh-3d-paid-standard-license/100 MODELS - WildMesh3D/Stylized Animals/Monkey_Stylized/SK_Monkey_Stylized.blend'
with bpy.data.libraries.load(path,link=False)as(src,dst):dst.actions=[n for n in src.actions if n not in bpy.data.actions]
s=bpy.context.scene;arm=next(o for o in s.objects if o.type=='ARMATURE');meshes=[o for o in s.objects if o.type=='MESH'];arm.animation_data_create()
for track in arm.animation_data.nla_tracks:track.mute=True
inventory={'source':path,'fps':s.render.fps/s.render.fps_base,'actions':[(a.name,list(a.frame_range))for a in bpy.data.actions],'boneCount':len(arm.data.bones),'bind':{b.name:list(arm.matrix_world@b.head_local)for b in arm.data.bones}}
open('/tmp/monkey-inventory.json','w').write(json.dumps(inventory,indent=2))
s.render.engine='BLENDER_WORKBENCH';s.render.resolution_x=750;s.render.resolution_y=650;s.render.resolution_percentage=100;s.display.shading.light='STUDIO';s.display.shading.color_type='SINGLE';s.display.shading.single_color=(.55,.43,.29);s.display.shading.show_cavity=True
cd=bpy.data.cameras.new('MonkeyStudyCamera');cam=bpy.data.objects.new('MonkeyStudyCamera',cd);s.collection.objects.link(cam);s.camera=cam;cd.type='ORTHO'
out={}
for name in ['Idle','Idle1','Walk','Run','Attack1','Attack2','Attack3','Attack4','B2Attack']:
 a=bpy.data.actions[name];arm.animation_data.action=a
 if hasattr(a,'slots')and len(a.slots):arm.animation_data.action_slot=a.slots[0]
 out[name]=[]
 for i in range(41):
  t=i/40;f=a.frame_range[0]+t*(a.frame_range[1]-a.frame_range[0]);s.frame_set(int(f),subframe=f-int(f));bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get();points=[]
  for m in meshes:
   ev=m.evaluated_get(dg);points.extend(ev.matrix_world@Vector(c)for c in ev.bound_box)
  lo=Vector([min(p[k]for p in points)for k in range(3)]);hi=Vector([max(p[k]for p in points)for k in range(3)]);center=(hi+lo)/2
  out[name].append({'t':t,'bounds':[list(lo),list(hi)],'bones':{b.name:list(arm.matrix_world@b.head)for b in arm.pose.bones}})
  if i not in ([0]if name=='Idle'else[10,20,30]):continue
  for view,offset in [('side',(3,0,.15)),('front',(0,-3,.15)),('top',(0,0,3))]:
   if view!='side'and name!='Idle':continue
   cd.ortho_scale=max(hi-lo)*max(1,s.render.resolution_x/s.render.resolution_y)*1.2;cam.location=center+Vector(offset);cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=f'/tmp/monkey-{name}-{i}-{view}.png';bpy.ops.render.render(write_still=True)
open('/tmp/monkey-motion.json','w').write(json.dumps(out))
# Leave the native reference in a quiet idle pose and the viewport framed.
arm.animation_data.action=bpy.data.actions['Idle']
if hasattr(arm.animation_data.action,'slots'):arm.animation_data.action_slot=arm.animation_data.action.slots[0]
s.frame_set(1)
for area in bpy.context.screen.areas:
 if area.type=='VIEW_3D':
  area.spaces.active.region_3d.view_location=Vector((0,0,.35));area.spaces.active.region_3d.view_distance=1.5
