"""Reference-only batch study. Opens source read-only; no save or imported assets."""
import bpy,sys,json,os
from mathutils import Vector
id=sys.argv[sys.argv.index('--')+1]
root='/Users/tal/models/wildmesh-3d-paid-standard-license/100 MODELS - WildMesh3D/'
entries={'mink':('Realistic Animals/AmericanMink/SK_AmericanMink.blend',['idle','startwalk_fwd_01','startrun_fwd_01','idle_alerted_shared_bark_01']), 'crocodile':('Stylized Animals/Crocodile_Stylized/SK_Crocodile_Stylized.blend',['Idle','Running_Running','Bite_Bite','TailWhip_TailWhip']), 'beaver':('Realistic Animals/Beaver/SK_Beaver.blend',['Idle','Walk_F_IP','Run_F_IP','Attack']), 'bighornRam':('Stylized Animals/Bighorn_Stylized/SK_Bighorn_Stylized.blend',['Idle','Walk','Run','HeadButt']), 'lion':('Stylized Animals/Lion_Stylized/SK_Lion_Stylized.blend',['Idle','Walk','Run','Swatting']), 'mammoth':('Realistic Animals/Mammoth/SK_Mammoth.blend',['Mammoth|A - Mammoth-Idle','Mammoth|Mammoth-Move-Fwd','Mammoth|Mammoth-Charge-Fwd','Mammoth|Mammoth-Attack-Tusk-Jab']), 'cat':('Realistic Animals/Cat/SK_Cat.blend',['Idle','Walk','Run','Dash']), 'hyena':('Realistic Animals/Hyena/SK_Hyena.blend',['Idle_Breathing','WalkSlow_F','RunFast_F','Laughing_A']), 'duck':('Realistic Animals/Duck/SK_Duck.blend',['Idle','WalkMedium','RunFast','FlyFlapping'])}
rel,selected=entries[id];path=root+rel;bpy.ops.wm.open_mainfile(filepath=path)
s=bpy.context.scene;arms=[o for o in s.objects if o.type=='ARMATURE'];arm=max(arms,key=lambda o:len(o.data.bones));meshes=[o for o in s.objects if o.type=='MESH'];arm.animation_data_create()
for track in arm.animation_data.nla_tracks:track.mute=True
out={'source':path,'fps':s.render.fps/s.render.fps_base,'actions':{a.name:list(a.frame_range)for a in bpy.data.actions},'bones':{b.name:list(arm.matrix_world@b.head_local)for b in arm.data.bones},'samples':{}}
s.render.engine='BLENDER_WORKBENCH';s.render.resolution_x=900;s.render.resolution_y=600;s.render.resolution_percentage=100;s.display.shading.light='STUDIO';s.display.shading.color_type='SINGLE';s.display.shading.single_color=(.58,.47,.32);s.display.shading.show_cavity=True
cd=bpy.data.cameras.new('ReferenceCamera');cam=bpy.data.objects.new('ReferenceCamera',cd);s.collection.objects.link(cam);s.camera=cam;cd.type='ORTHO'
for index,name in enumerate(selected):
 a=bpy.data.actions.get(name)
 if a is None:continue
 arm.animation_data.action=a
 if hasattr(a,'slots')and len(a.slots):arm.animation_data.action_slot=a.slots[0]
 out['samples'][name]=[]
 for i in range(9):
  frame=a.frame_range[0]+i/8*(a.frame_range[1]-a.frame_range[0]);s.frame_set(int(frame),subframe=frame-int(frame));bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get();points=[]
  for m in meshes:
   ev=m.evaluated_get(dg);points.extend(ev.matrix_world@Vector(c)for c in ev.bound_box)
  lo=Vector([min(p[k]for p in points)for k in range(3)]);hi=Vector([max(p[k]for p in points)for k in range(3)]);center=(lo+hi)/2
  out['samples'][name].append({'t':i/8,'bounds':[list(lo),list(hi)],'bones':{b.name:list(arm.matrix_world@b.head)for b in arm.pose.bones}})
  if (index==0 and i==0)or(index>0 and i==4):
   for view,offset in [('side',(3,0,.05)),('front',(0,-3,.05)),('top',(0,0,3))]:
    if index>0 and view!='side':continue
    cd.ortho_scale=max(hi-lo)*1.7;cam.location=center+Vector(offset)*max(hi-lo);cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=f'/tmp/{id}-reference-{index}-{view}.png';bpy.ops.render.render(write_still=True)
open(f'/tmp/{id}-wildmesh-study.json','w').write(json.dumps(out,indent=2))
print('REFERENCE_STUDY',id,'actions',len(out['actions']),'bones',len(out['bones']),'sampled',list(out['samples']))
