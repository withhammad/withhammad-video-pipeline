"""Retarget the CC0 Quaternius walk to the fitted 3D character, then render checks."""
import bpy, math, json, sys
from pathlib import Path
from mathutils import Vector, Matrix, Quaternion
ROOT=Path(__file__).resolve().parents[3]
WORK=ROOT/'work/personal-iqbal-3d'
MODE=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'preview'
bpy.ops.wm.open_mainfile(filepath=str(WORK/'Hammad-valley-base.blend'))
scene=bpy.context.scene
dst=bpy.data.objects['Hammad_walk_rig']
for p in dst.pose.bones:p.matrix_basis=Matrix.Identity(4)
bpy.context.view_layer.update()
before=set(bpy.data.objects)
scene.render.fps=30
bpy.ops.import_scene.gltf(filepath=str(WORK/'vendor/quaternius-walk/glTF/AnimationLibrary_Godot_Standard.gltf'))
new=set(bpy.data.objects)-before
src=next(o for o in new if o.type=='ARMATURE')
print('SOURCE',src.name,'WORLD',list(src.matrix_world),flush=True)
walk=next(a for a in bpy.data.actions if a.name=='Walk_Loop')
if not src.animation_data:src.animation_data_create()
for track in src.animation_data.nla_tracks:track.mute=True
src.animation_data.action=walk
if len(walk.slots):src.animation_data.action_slot=walk.slots[0]
for o in new:o.hide_render=True
print('ACTION',walk.name,list(walk.frame_range),flush=True)

mapping={'Hips':'hips','Spine':'spine.001','Spine1':'spine.002','Spine2':'spine.003','Neck':'neck','Head':'head'}
for long,short in [('Left','L'),('Right','R')]:
    for dn,sn in [('Shoulder','shoulder'),('Arm','upper_arm'),('ForeArm','forearm'),('Hand','hand'),('UpLeg','thigh'),('Leg','shin'),('Foot','foot'),('ToeBase','toe')]:
        mapping[long+dn]=sn+'.'+short
mapping={'mixamorig:'+a:'DEF-'+b for a,b in mapping.items()}
mapping={a:b for a,b in mapping.items() if a in dst.pose.bones and b in src.pose.bones}
# Compare rolls after rotating the target bone's long axis to the source rest axis.
offsets={}
for dn,sn in mapping.items():
    dq=dst.data.bones[dn].matrix_local.to_quaternion()
    sr=(src.matrix_world@src.data.bones[sn].matrix_local).to_quaternion()
    align=(dq@Vector((0,1,0))).rotation_difference(sr@Vector((0,1,0)))
    offsets[dn]=sr.inverted()@align@dq
    if any(n in dn for n in ['Hips','Spine','Neck','Head','Shoulder']):
        offsets[dn]=sr.inverted()@dq

samples=[]
for f in range(41):
    scene.frame_set(f)
    deps=bpy.context.evaluated_depsgraph_get();ev=src.evaluated_get(deps)
    matrices={dn:(ev.matrix_world@ev.pose.bones[sn].matrix).copy() for dn,sn in mapping.items()}
    samples.append(matrices)
source_rest_hip=src.matrix_world@src.data.bones['DEF-hips'].head_local
dest_hip=dst.data.bones['mixamorig:Hips'].head_local.copy()
scale=dest_hip.z/source_rest_hip.z
print('SCALE',scale,'REST_HIP',list(source_rest_hip),flush=True)
diag=[]
for f in [0,5,10,15,20,25,30,35,40]:
    diag.append({'f':f,'hips':list(samples[f]['mixamorig:Hips'].translation),'footL':list(samples[f]['mixamorig:LeftFoot'].translation),'footR':list(samples[f]['mixamorig:RightFoot'].translation)})
(WORK/'source-motion.json').write_text(json.dumps(diag,indent=2))

# Render destination at source timing for initial inspection. All motion is in 3D.
order=[p.name for p in dst.pose.bones if p.name in mapping]
order.sort(key=lambda n:len(dst.pose.bones[n].parent_recursive))
rest={p.name:p.bone.matrix_local.copy() for p in dst.pose.bones}
dst.animation_data_clear()
for f in range(41):
    scene.frame_set(f)
    data=samples[f]
    for dn in order:
        p=dst.pose.bones[dn]
        q=data[dn].to_quaternion()@offsets[dn]
        if dn=='mixamorig:Hips':
            pos=dest_hip+(data[dn].translation-source_rest_hip)*scale
        elif p.parent:
            pos=p.parent.matrix@(p.parent.bone.matrix_local.inverted()@p.bone.head_local)
        else:pos=p.bone.head_local.copy()
        mat=q.to_matrix().to_4x4();mat.translation=pos;p.matrix=mat
        bpy.context.view_layer.update()
        p.rotation_mode='QUATERNION'
        p.keyframe_insert(data_path='rotation_quaternion',frame=f)
        if dn=='mixamorig:Hips':p.keyframe_insert(data_path='location',frame=f)
    bpy.context.view_layer.update()

for o in list(new):bpy.data.objects.remove(o,do_unlink=True)
scene.frame_start=0;scene.frame_end=40;scene.render.fps=30
scene.render.resolution_x=1280;scene.render.resolution_y=720
scene.frame_set(8)
bpy.ops.wm.save_as_mainfile(filepath=str(WORK/'Hammad-walk-cycle.blend'))
for f in ([0,10] if MODE!='build' else []):
    scene.frame_set(f);scene.render.filepath=str(WORK/f'walk-pose-{f:02d}.png')
    bpy.ops.render.render(write_still=True)
if MODE!='build':
    scene.frame_set(0)
    cam=scene.camera;cam.location=(.4,-1.6,1.72)
    cam.rotation_euler=(Vector((0,0,1.54))-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.lens=70;scene.render.resolution_x=700;scene.render.resolution_y=700
    scene.render.filepath=str(WORK/'head-check.png');bpy.ops.render.render(write_still=True)
print('WALK_POSES_READY',flush=True)
