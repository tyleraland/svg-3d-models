# Blender --background --python scripts/study-wildmesh-kangaroo.py -- /absolute/reference.blend Kangaroo
# Diagnostics/renders only, written to /tmp/kangaroo-*. Native scenes are never saved.
import bpy,json,sys
path,tag=sys.argv[sys.argv.index('--')+1:];bpy.ops.wm.open_mainfile(filepath=path);s=bpy.context.scene
r={'path':path,'fps':s.render.fps/s.render.fps_base,'objects':[(o.name,o.type,list(o.dimensions))for o in s.objects if o.type in ['MESH','ARMATURE']],'actions':[(a.name,list(a.frame_range))for a in bpy.data.actions],'bones':[(o.name,[(b.name,b.parent.name if b.parent else None,list(b.head_local),list(b.tail_local))for b in o.data.bones])for o in s.objects if o.type=='ARMATURE']}
open('/tmp/kangaroo-'+tag+'-inventory.json','w').write(json.dumps(r,indent=2))
from mathutils import Vector
arm=next(o for o in s.objects if o.type=='ARMATURE');meshes=[o for o in s.objects if o.type=='MESH'];arm.animation_data_create()
for track in arm.animation_data.nla_tracks:track.mute=True
s.render.engine='BLENDER_WORKBENCH';s.render.resolution_x=850;s.render.resolution_y=650;s.render.resolution_percentage=100;s.display.shading.light='STUDIO';s.display.shading.color_type='SINGLE';s.display.shading.single_color=(.55,.43,.29);s.display.shading.show_cavity=True
cd=bpy.data.cameras.new('KangarooStudyCamera');cam=bpy.data.objects.new('KangarooStudyCamera',cd);s.collection.objects.link(cam);s.camera=cam;cd.type='ORTHO'
actions=['Idle','walk_fwd_01','trot_fwd_01','sprint_fwd_01','aggressive kick fwd','aggressive_attack_stomping_01','agressive_idle_01']
out={}
for name in actions:
 a=bpy.data.actions[name];arm.animation_data.action=a
 if hasattr(a,'slots') and len(a.slots):arm.animation_data.action_slot=a.slots[0]
 out[name]=[]
 for i in range(41):
  t=i/40;frame=a.frame_range[0]+t*(a.frame_range[1]-a.frame_range[0]);s.frame_set(int(frame),subframe=frame-int(frame));bpy.context.view_layer.update()
  dg=bpy.context.evaluated_depsgraph_get();pts=[]
  for m in meshes:
   ev=m.evaluated_get(dg);pts.extend(ev.matrix_world@Vector(c)for c in ev.bound_box)
  lo=Vector([min(p[k]for p in pts)for k in range(3)]);hi=Vector([max(p[k]for p in pts)for k in range(3)]);center=(hi+lo)/2
  out[name].append({'t':t,'bounds':[list(lo),list(hi)],'bones':{b.name:list(arm.matrix_world@b.head)for b in arm.pose.bones}})
  if i not in ([0]if name==actions[0]else[10,20,30,40]):continue
  for view,offset in [('side',(5,0,.3)),('front',(0,-5,.3)),('top',(0,0,6))]:
   if view!='side'and name!=actions[0]:continue
   cd.ortho_scale=max(hi-lo)*max(1,s.render.resolution_x/s.render.resolution_y)*1.25;cam.location=center+Vector(offset);cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=f'/tmp/kangaroo-{tag}-{name}-{i}-{view}.png';bpy.ops.render.render(write_still=True)
open('/tmp/kangaroo-'+tag+'-motion.json','w').write(json.dumps(out))
