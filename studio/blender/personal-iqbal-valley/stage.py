"""Place the 3D walk on the preserved valley plate, with stance-foot anchoring."""
import bpy,sys,math,json
from mathutils import Vector,Matrix
from bpy_extras.object_utils import world_to_camera_view
from pathlib import Path
R=Path(__file__).resolve().parents[3];W=R/'work/personal-iqbal-3d'
MODE=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'preview'
bpy.ops.wm.open_mainfile(filepath=str(W/'Hammad-walk-cycle.blend'))
s=bpy.context.scene;rig=bpy.data.objects['Hammad_walk_rig'];FPS=25;COUNT=144
shoes=next(o for o in bpy.data.objects if o.type=='MESH' and 'shoes05' in o.name)
pose_samples=[];feet=[];soles=[];phases=[]
for f in range(COUNT):
    phase=(f*30/FPS*.80)%40
    s.frame_set(int(phase),subframe=phase%1)
    bpy.context.view_layer.update()
    pose_samples.append({p.name:p.matrix_basis.copy() for p in rig.pose.bones})
    feet.append({side:rig.pose.bones['mixamorig:'+side+'Foot'].head.copy() for side in ['Left','Right']})
    ev=shoes.evaluated_get(bpy.context.evaluated_depsgraph_get());me=ev.to_mesh()
    soles.append(min((ev.matrix_world@v.co).z for v in me.vertices));ev.to_mesh_clear()
    phases.append(phase)
rig.animation_data_clear()
root=bpy.data.objects.new('Grounded walking path',None);s.collection.objects.link(root);rig.parent=root
travel=Vector((1.15,1.0,0));report=[]
for f in range(COUNT):
    s.frame_set(f)
    support='Left' if phases[f]<20 else 'Right'
    if f:
        difference=feet[f-1][support]-feet[f][support]
        travel.x+=difference.x;travel.y+=difference.y
    root.location=(travel.x,travel.y,-soles[f]+.002)
    root.keyframe_insert(data_path='location',frame=f)
    for p in rig.pose.bones:
        p.matrix_basis=pose_samples[f][p.name];p.rotation_mode='QUATERNION'
        p.keyframe_insert(data_path='rotation_quaternion',frame=f)
        if p.name=='mixamorig:Hips':p.keyframe_insert(data_path='location',frame=f)
    report.append({'frame':f,'phase':phases[f],'support':support,'root':list(root.location),'contact_z':.002})
    bpy.context.view_layer.update()

s.render.fps=FPS;s.frame_start=0;s.frame_end=COUNT-1
s.render.resolution_x=1920;s.render.resolution_y=850;s.render.resolution_percentage=100
s.camera.location=(4,-10,3.2)
s.camera.rotation_euler=(Vector((0,0,.6))-s.camera.location).to_track_quat('-Z','Y').to_euler()
s.camera.data.lens=42
s.cycles.samples=12;s.cycles.use_denoising=True
try:
    pref=bpy.context.preferences.addons['cycles'].preferences;pref.compute_device_type='METAL';pref.get_devices()
    for d in pref.devices:d.use=d.type=='METAL'
    s.cycles.device='GPU'
except Exception as e:print('GPU',str(e))
# The complete scene, skeleton, skin and path stay editable in this .blend.
(W/'foot-contact-report.json').write_text(json.dumps({'fps':FPS,'frames':COUNT,'method':'Support ankle is fixed in world XY through each stance. The evaluated shoe sole stays 2 mm above the shadow catcher. Source body motion retained.','samples':report},indent=2))
for f in [0,36,72,108,143]:
    s.frame_set(f)
    pos=rig.matrix_world@rig.pose.bones['mixamorig:Hips'].head
    point=world_to_camera_view(s,s.camera,pos)
    print('FRAME_LOCATION',f,list(root.location),'hip-screen',list(point),flush=True)
bpy.ops.wm.save_as_mainfile(filepath=str(W/'Hammad-valley-preview.blend'))
if MODE=='render':
    (W/'frames').mkdir(exist_ok=True)
    s.render.filepath=str(W/'frames/frame-')
    bpy.ops.render.render(animation=True)
else:
    for f in [0,72,143]:
        s.frame_set(f);s.render.filepath=str(W/f'valley-character-{f:03d}.png')
        bpy.ops.render.render(write_still=True)
print('STAGE_READY',flush=True)
