"""Rig the owner's illustrated character in Blender for the personal walking film.

Layered 2D character, actual skeletal walk cycles, no paid service or HeyGen.
The source cel is mapped to a dense skinned mesh; arms, knees, feet, spine and
head are separately keyed. Output is an RGBA sequence for Remotion composition.
"""
import bpy
import math
import sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[3]
ASSETS = ROOT/'studio/remotion/public/personal-iqbal-anime'
OUT = ROOT/'work/reference-DfgtetEsqUB/anime'
FRAMES = ASSETS/'walk'
OUT.mkdir(parents=True, exist_ok=True)
FRAMES.mkdir(parents=True, exist_ok=True)
mode = sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'preview'
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.name = 'PERSONAL_IQBAL_ANIME_WALK'
try:
    scene.render.engine = 'BLENDER_EEVEE'
except TypeError:
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 8
scene.render.resolution_x = 720
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100
scene.render.fps = 25
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.color_depth = '8'
scene.render.film_transparent = True
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'None'
scene.view_settings.exposure = 0
scene.view_settings.gamma = 1
scene.frame_start, scene.frame_end = 1, 150
scene.render.filepath = str(FRAMES/'walk-')

# Pixel-space rig, y up in Blender; the camera faces the drawing along -Z.
S = 6.0/1536
def pos(p):
    return Vector(((p[0]-512)*S, (1536-p[1])*S, 0))

img = bpy.data.images.load(str(ASSETS/'fullbody.png'), check_existing=True)
img.pack()
mat = bpy.data.materials.new('Hammad anime cel — transparent')
mat.use_nodes = True
n = mat.node_tree.nodes
n.clear()
texture = n.new('ShaderNodeTexImage'); texture.image = img
texture.interpolation = 'Linear'
emission = n.new('ShaderNodeEmission')
transparent = n.new('ShaderNodeBsdfTransparent')
mix = n.new('ShaderNodeMixShader')
output = n.new('ShaderNodeOutputMaterial')
links = mat.node_tree.links
links.new(texture.outputs['Color'],emission.inputs['Color'])
links.new(texture.outputs['Alpha'],mix.inputs[0])
links.new(transparent.outputs[0],mix.inputs[1])
links.new(emission.outputs[0],mix.inputs[2])
links.new(mix.outputs[0],output.inputs['Surface'])
if hasattr(mat,'surface_render_method'): mat.surface_render_method = 'BLENDED'

nx, ny = 300, 450
verts, faces, pixels = [], [], []
for j in range(ny+1):
    for i in range(nx+1):
        p=(1024*i/nx,1536*j/ny)
        verts.append(tuple(pos(p))); pixels.append(p)
alpha_pixels=list(img.pixels)
def visible(px,py):
    ix=max(0,min(img.size[0]-1,round(px)))
    iy=max(0,min(img.size[1]-1,round(1536-py)))
    return alpha_pixels[(iy*img.size[0]+ix)*4+3] > .08
for j in range(ny):
    for i in range(nx):
        a=j*(nx+1)+i
        samples=[pixels[q] for q in (a,a+1,a+nx+2,a+nx+1)]
        samples.append((1024*(i+.5)/nx,1536*(j+.5)/ny))
        if any(visible(*p) for p in samples):
            faces.append((a,a+1,a+nx+2,a+nx+1))
mesh=bpy.data.meshes.new('Dense cel skin'); mesh.from_pydata(verts,[],faces); mesh.update()
cel=bpy.data.objects.new('HAMMAD — skinned anime character',mesh)
scene.collection.objects.link(cel); cel.data.materials.append(mat)
uv=mesh.uv_layers.new(name='Fullbody cel UV')
for poly in mesh.polygons:
    for li in poly.loop_indices:
        px,py=pixels[mesh.loops[li].vertex_index]
        uv.data[li].uv=(px/1024,1-py/1536)

rigdata=bpy.data.armatures.new('Hammad walking skeleton')
rig=bpy.data.objects.new('Hammad anime walk rig',rigdata)
scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig; rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
spec={
 'pelvis':((507,840),(507,705),None),
 'spine':((507,705),(505,510),'pelvis'),
 'chest':((505,510),(492,300),'spine'),
 'neck':((492,300),(490,242),'chest'),
 'head':((490,242),(486,55),'neck'),
 'upper_arm.L':((320,333),(230,606),'chest'),
 'forearm.L':((230,606),(167,775),'upper_arm.L'),
 'hand.L':((167,775),(155,900),'forearm.L'),
 'upper_arm.R':((663,333),(775,608),'chest'),
 'forearm.R':((775,608),(846,775),'upper_arm.R'),
 'hand.R':((846,775),(862,900),'forearm.R'),
 'thigh.L':((418,838),(410,1115),'pelvis'),
 'shin.L':((410,1115),(374,1421),'thigh.L'),
 'foot.L':((374,1421),(349,1496),'shin.L'),
 'thigh.R':((591,838),(597,1115),'pelvis'),
 'shin.R':((597,1115),(621,1421),'thigh.R'),
 'foot.R':((621,1421),(650,1496),'shin.R'),
}
for name,(start,end,parent) in spec.items():
    b=rigdata.edit_bones.new(name); b.head=pos(start); b.tail=pos(end)
    if parent: b.parent=rigdata.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT')

groups={name:cel.vertex_groups.new(name=name) for name in spec}
def blend(a,b,v):
    u=max(0,min(1,v)); u=u*u*(3-2*u)
    return {a:1-u,b:u}
for idx,(x,y) in enumerate(pixels):
    if y >= 820:
        # Hands are outboard of the pants in the original rest pose.
        if x<290: w={'hand.L':1}
        elif x>730: w={'hand.R':1}
        else:
            side='L' if x<510 else 'R'
            if y<1070: w={f'thigh.{side}':1}
            elif y<1160: w=blend(f'thigh.{side}',f'shin.{side}',(y-1070)/90)
            elif y<1390: w={f'shin.{side}':1}
            else: w=blend(f'shin.{side}',f'foot.{side}',(y-1390)/65)
    elif y>320 and (x<320 or x>700):
        side='L' if x<512 else 'R'
        if y<560: w={f'upper_arm.{side}':1}
        elif y<655: w=blend(f'upper_arm.{side}',f'forearm.{side}',(y-560)/95)
        else: w=blend(f'forearm.{side}',f'hand.{side}',(y-730)/80)
    elif y<240: w={'head':1}
    elif y<300: w=blend('head','neck',(y-240)/60)
    elif y<450: w={'chest':1}
    elif y<570: w=blend('chest','spine',(y-450)/120)
    else: w=blend('spine','pelvis',(y-650)/150)
    for name,weight in w.items():
        if weight>0: groups[name].add([idx],weight,'REPLACE')
mod=cel.modifiers.new('Deform with walking skeleton','ARMATURE');mod.object=rig

# Eye closure and wind are shape-key animation on the illustrated geometry.
cel.shape_key_add(name='Basis')
blink=cel.shape_key_add(name='Blink')
hair=cel.shape_key_add(name='Hair in breeze')
for i,(x,y) in enumerate(pixels):
    delta=0
    for ex,ey in [(448,135),(503,128)]:
        wx=math.exp(-((x-ex)/19)**4)
        wy=math.exp(-((y-ey)/11)**4)
        delta+=(ey-y)*wx*wy*.98
    blink.data[i].co.y-=delta*S
    weight=max(0,min(1,(95-y)/70))
    hair.data[i].co.x+=S*4.2*weight*math.sin(x*.055)

for pb in rig.pose.bones: pb.rotation_mode='XYZ'
def keyz(name,degrees,frame):
    p=rig.pose.bones[name];p.rotation_euler.z=math.radians(degrees)
    p.keyframe_insert('rotation_euler',frame=frame)

def angle(v): return math.atan2(v.y,v.x)
def leg_ik(side,target,frame):
    upper,lower=f'thigh.{side}',f'shin.{side}'
    a,b=pos(spec[upper][0]),pos(spec[upper][1]);c=pos(spec[lower][1])
    l1,l2=(b-a).length,(c-b).length
    direction=target-a;d=max(.01,min(direction.length,l1+l2-.006))
    base=angle(direction)
    opening=math.acos(max(-1,min(1,(l1*l1+d*d-l2*l2)/(2*l1*d))))
    theta=base+opening
    knee=a+Vector((math.cos(theta)*l1,math.sin(theta)*l1,0))
    lower_angle=angle(target-knee)
    upper_delta=theta-angle(b-a)
    lower_delta=lower_angle-angle(c-b)-upper_delta
    for name,z in [(upper,upper_delta),(lower,lower_delta)]:
        pb=rig.pose.bones[name];pb.rotation_euler.z=z;pb.keyframe_insert('rotation_euler',frame=frame)
    foot=rig.pose.bones[f'foot.{side}']
    foot.rotation_euler.z=-upper_delta-lower_delta
    foot.keyframe_insert('rotation_euler',frame=frame)

for f in range(1,152):
    t=(f-1)/25
    phase=2*math.pi*t/1.2
    keyz('spine',1.1*math.sin(phase),f)
    keyz('chest',-.7*math.sin(phase),f)
    keyz('neck',.6*math.sin(phase/5),f)
    keyz('head',1.7*math.sin(phase/5),f)
    pelvis=rig.pose.bones['pelvis']
    pelvis.location.y=-.023+.020*math.cos(phase*2)
    pelvis.location.x=.018*math.sin(phase)
    pelvis.keyframe_insert('location',frame=f)
    for side,offset in [('L',0),('R',math.pi)]:
        p=phase+offset
        base=pos(spec[f'shin.{side}'][1])
        q=(p/(2*math.pi))%1
        if q<.5:
            base.x+=.145*(1-4*q)  # planted foot moves back as the body travels
        else:
            swing=(q-.5)*2
            eased=swing*swing*(3-2*swing)
            base.x+=-.145+.290*eased
            base.y+=.125*math.sin(math.pi*swing)
        leg_ik(side,base,f)
        inward=10 if side=='L' else -10
        keyz(f'upper_arm.{side}',inward+6*math.cos(phase),f)
        keyz(f'forearm.{side}',(-4 if side=='L' else 4)+4*math.sin(p),f)
        keyz(f'hand.{side}',2*math.sin(p),f)
    blink.value=max(math.exp(-((t-1.48)/.085)**4),math.exp(-((t-4.48)/.085)**4))
    blink.keyframe_insert('value',frame=f)
    hair.value=.5+.5*math.sin(2*math.pi*t/3)
    hair.keyframe_insert('value',frame=f)

# Camera is stationary: visible motion must come from the rig, not camera zoom.
camera_data=bpy.data.cameras.new('Character camera')
camera=bpy.data.objects.new('Character camera',camera_data)
scene.collection.objects.link(camera)
camera.location=(0,3.0,10)
camera_data.type='ORTHO';camera_data.ortho_scale=6.3
scene.camera=camera
scene.render.film_transparent=True
scene.frame_set(1)
scene['personal_only']=True
scene['animation']='Full-body skinned anime cel; 17-bone rig; two-bone knee/foot walking, counter-swing arms, spine, head, blinks and hair. Composited travelling paths in Remotion.'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Hammad-anime-walk.blend'))
print('BLENDER_RIG_READY',len(rig.pose.bones),'bones',len(mesh.vertices),'vertices',scene.render.engine)
if mode=='render':
    bpy.ops.render.render(animation=True)
elif mode=='preview':
    for f in [1,8,16,38]:
        scene.frame_set(f);scene.render.filepath=str(OUT/f'pose-{f:03}.png')
        bpy.ops.render.render(write_still=True)
print('DONE',mode)
