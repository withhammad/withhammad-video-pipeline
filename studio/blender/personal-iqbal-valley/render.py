"""Render the short motion preview; safe to resume after completed PNGs."""
import bpy
from mathutils import Vector
from pathlib import Path
R=Path(__file__).resolve().parents[3];W=R/'work/personal-iqbal-3d'
bpy.ops.wm.open_mainfile(filepath=str(W/'Hammad-valley-preview.blend'))
s=bpy.context.scene
s.camera.rotation_euler=(Vector((0,0,.4))-s.camera.location).to_track_quat('-Z','Y').to_euler()
s.render.resolution_percentage=75;s.cycles.samples=8;s.cycles.use_denoising=True
try:
    pref=bpy.context.preferences.addons['cycles'].preferences;pref.compute_device_type='METAL';pref.get_devices()
    for d in pref.devices:d.use=d.type=='METAL'
    s.cycles.device='GPU'
except Exception as e:print('GPU fallback',str(e))
out=R/'studio/remotion/public/personal-iqbal-valley/frames';out.mkdir(parents=True,exist_ok=True)
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(W/'Hammad-valley-sample.blend'))
for frame in range(144):
    p=out/f'frame-{frame:04d}.png'
    if p.exists() and p.stat().st_size>10000:continue
    s.frame_set(frame);s.render.filepath=str(p);bpy.ops.render.render(write_still=True)
    print('SAMPLE_FRAME',frame,flush=True)
