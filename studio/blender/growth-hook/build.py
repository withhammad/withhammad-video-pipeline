"""Original free-asset 3D boxing hook. Blender -b -P build.py -- OUT [preview|render]."""
import bpy, math, sys, random
from pathlib import Path
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:]
out = Path(args[0]).resolve()
out.mkdir(parents=True, exist_ok=True)
mode = args[1] if len(args) > 1 else 'preview'
# This script runs in its own background process, never in the owner's open scene.
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.name = 'WITHHAMMAD_GROWTH_3D'
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.cycles.device = 'GPU'
try:
    prefs=bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type='METAL'
    prefs.get_devices()
    for d in prefs.devices: d.use = d.type == 'METAL'
except Exception:
    scene.cycles.device='CPU'
scene.render.resolution_x = 1080
scene.render.resolution_y = 1920
scene.render.resolution_percentage = 100
scene.render.fps = 30
scene.frame_start, scene.frame_end = 1, 90
scene.render.image_settings.file_format = 'PNG'
scene.render.film_transparent = False
scene.world = bpy.data.worlds.new('Arena')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.014,.020,.045,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.3
scene.view_settings.view_transform='AgX'

def mat(name, color, metal=0., rough=.3, emission=0.):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=(*color,1)
    bs.inputs['Metallic'].default_value=metal; bs.inputs['Roughness'].default_value=rough
    bs.inputs['Emission Color'].default_value=(*color,1)
    bs.inputs['Emission Strength'].default_value=emission
    return m

steel=mat('Brushed titanium',(.39,.46,.57),.85,.26)
dark=mat('Graphite joints',(.018,.025,.042),.7,.3)
orange=mat('Claude orange',(.94,.20,.045),.35,.24)
pink=mat('Instagram magenta',(.66,.018,.29),.45,.23)
purple=mat('Purple gloves',(.20,.018,.48),.35,.23)
white=mat('White luminous marks',(.9,.95,1),.1,.24,2)
cyan=mat('Cyan rim',(.01,.45,1),.2,.25,3)
warm=mat('Warm rim',(1,.21,.035),.2,.25,3)
floor=mat('Ring canvas',(.018,.036,.065),.3,.5)
sparkmat=mat('Impact sparks',(1,.55,.09),0,.2,8)

def finish(obj,name,material,parent=None):
    obj.name=name; obj.data.materials.append(material)
    if parent: obj.parent=parent
    if obj.type=='MESH':
        for p in obj.data.polygons: p.use_smooth=True
    return obj

def box(name,loc,scale,material,bevel=.12,parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    o=bpy.context.object; o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    mod=o.modifiers.new('Machined edges','BEVEL');mod.width=bevel;mod.segments=4
    o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return finish(o,name,material,parent)

def sphere(name,loc,scale,material,parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=loc)
    o=bpy.context.object;o.scale=scale
    return finish(o,name,material,parent)

def rod(name,a,b,r,material,parent=None):
    a,b=Vector(a),Vector(b)
    bpy.ops.mesh.primitive_cylinder_add(vertices=20,radius=r,depth=(b-a).length,location=(a+b)/2)
    o=bpy.context.object;o.rotation_mode='QUATERNION';o.rotation_quaternion=(b-a).to_track_quat('Z','Y')
    mod=o.modifiers.new('Soft edges','BEVEL');mod.width=.04;mod.segments=3
    return finish(o,name,material,parent)

def line(name,points,r,material,parent=None,closed=False):
    cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.bevel_depth=r;cu.bevel_resolution=3
    sp=cu.splines.new('POLY');sp.points.add(len(points)-1)
    for p,v in zip(sp.points,points):p.co=(*v,1)
    sp.use_cyclic_u=closed
    o=bpy.data.objects.new(name,cu);scene.collection.objects.link(o)
    return finish(o,name,material,parent)

box('Raised boxing platform',(0,0,-.23),(8,7,.45),floor,.2)
box('Canvas',(0,0,.025),(7.7,6.7,.05),floor,.02)
for x in (-3.65,3.65):
    for y in (-3.1,3.1):
        rod('Corner post',(x,y,0),(x,y,2.25),.13,steel)
        box('Corner cushion',(x,y,1.4),(.36,.36,1.5),orange if x<0 else purple,.12)
for z in (.65,1.2,1.75):
    for a,b in [((-3.65,3.1,z),(3.65,3.1,z)),((-3.65,-3.1,z),(-3.65,3.1,z)),((3.65,-3.1,z),(3.65,3.1,z))]:
        rod('Ring rope',a,b,.035,white)
# Arena light bars, with a dark crowd made from original procedural shapes.
random.seed(31)
for row in range(3):
    z=1.1+row*1.25
    line('Arena balcony',[(-11,6,z),(11,6,z)],.035,cyan if row%2 else warm)
    for i in range(34):
        x=-10.5+i*.64
        sphere('Audience silhouette',(x,6.3,z+.42),(.19,.17,.29),dark)
for x in (-3,0,3):
    box('Overhead light',(x,2.5,6.2),(.15,3,.10),white,.04)

def robot(name,x,color,glove):
    rig=bpy.data.objects.new(name,None);scene.collection.objects.link(rig);rig.location=(x,0,0)
    box(name+' pelvis',(0,0,1.22),(.66,.48,.43),dark,.14,rig)
    box(name+' breastplate',(0,0,2.03),(.86,.50,1.05),steel,.23,rig)
    box(name+' chest inset',(0,-.27,2.05),(.43,.05,.49),dark,.09,rig)
    for dx in (-.12,0,.12): rod('Status light',(dx,-.31,1.95),(dx,-.31,2.18),.016,color,rig)
    rod('Neck',(0,0,2.55),(0,0,2.82),.14,dark,rig)
    head=box(name+' head',(0,0,3.16),(.84,.76,.85),color,.15,rig)
    for side in (-1,1):
        hip=(side*.25,0,1.25);knee=(side*.35,-.03,.65);ankle=(side*.43,.04,.18)
        sphere('Hip',hip,(.20,.20,.20),dark,rig)
        rod('Thigh',hip,knee,.21,steel,rig)
        sphere('Knee',knee,(.18,.19,.18),dark,rig)
        rod('Shin',knee,ankle,.17,steel,rig)
        box('Foot',(side*.43,-.15,.12),(.36,.65,.24),dark,.10,rig)
    # Head marks share the animated head's local coordinates.
    if name=='Claude':
        for i in range(12):
            a=i*math.tau/12
            line('Claude star',[(math.cos(a)*.08,-.392,math.sin(a)*.08),
                (math.cos(a)*.29,-.392,math.sin(a)*.29)],.026,white,head)
    else:
        pts=[]
        for cx,cz,a0 in [(.17,.17,0),(-.17,.17,90),(-.17,-.17,180),(.17,-.17,270)]:
            for j in range(9):
                a=math.radians(a0+j*90/8)
                pts.append((cx+.09*math.cos(a),-.392,cz+.09*math.sin(a)))
        line('Instagram camera',pts,.027,white,head,True)
        line('Instagram lens',[(.13*math.cos(i*math.tau/40),-.40,.13*math.sin(i*math.tau/40)) for i in range(40)],.025,white,head,True)
        sphere('Camera glint',(.17,-.40,.17),(.038,.025,.038),white,head)
    arms=[]
    for side in (-1,1):
        shoulder=(side*.50,0,2.37);elbow=(side*.69,-.10,1.85);hand=(side*.72,-.48,2.10)
        sphere('Shoulder',shoulder,(.25,.25,.25),steel,rig)
        upper=rod('Upper arm',shoulder,elbow,.16,steel,rig)
        joint=sphere('Elbow',elbow,(.17,.17,.17),dark,rig)
        fore=rod('Forearm',elbow,hand,.16,steel,rig)
        fist=sphere('Boxing glove',hand,(.27,.31,.26),glove,rig)
        arms.append((shoulder,upper,joint,fore,fist))
    return rig,head,arms

left,lh,la=robot('Claude',-.94,orange,orange)
right,rh,ra=robot('Instagram',.94,pink,purple)
left.rotation_euler.z=-.23;right.rotation_euler.z=.23

def pose_arm(arm,elbow,hand,frame):
    shoulder,upper,joint,fore,fist=arm
    for obj,a,b in [(upper,shoulder,elbow),(fore,elbow,hand)]:
        a,b=Vector(a),Vector(b);obj.location=(a+b)/2
        obj.rotation_quaternion=(b-a).to_track_quat('Z','Y')
        # Mesh length from the rest pose; preserve segment thickness.
        if '_rest_length' not in obj:obj['_rest_length']=max(v.co.z for v in obj.data.vertices)-min(v.co.z for v in obj.data.vertices)
        obj.scale.z=(b-a).length/obj['_rest_length']
        for prop in ('location','rotation_quaternion','scale'):obj.keyframe_insert(data_path=prop,frame=frame)
    joint.location=elbow;fist.location=hand
    joint.keyframe_insert(data_path='location',frame=frame);fist.keyframe_insert(data_path='location',frame=frame)

for f,ext in [(1,.15),(12,0),(23,1),(29,.78),(45,0),(66,.12),(90,.15)]:
    pose_arm(la[1],(.67+.25*ext,-.13,2.18+.43*ext),(.75+1.10*ext,-.29,2.38+.55*ext),f)
    pose_arm(la[0],(-.64,-.24,2.09),(-.37,-.57,2.53),f)
    pose_arm(ra[0],(-.64,-.24,2.01),(-.51,-.55,2.51),f)
    pose_arm(ra[1],(.67,-.15,2.08),(.45,-.50,2.53),f)
    recoil=max(0,ext-.65)/.35
    rh.rotation_euler.y=recoil*.30;rh.rotation_euler.z=-recoil*.13
    rh.location.x=recoil*.12
    for prop in ('rotation_euler','location'):rh.keyframe_insert(data_path=prop,frame=f)
    left.location.z=.025*math.sin(f*.2);left.keyframe_insert(data_path='location',frame=f)

random.seed(9)
for i in range(22):
    o=sphere('Impact spark',(.66,-.14,3.06),(.016,.016,.016),sparkmat)
    v=Vector((random.uniform(-1.1,1.1),random.uniform(-.8,.6),random.uniform(-.3,1.3)))
    for f,s in [(1,0),(21,0),(24,1),(38,0),(90,0)]:
        o.scale=(s*.020,s*.020,s*.055)
        o.location=Vector((.66,-.14,3.06))+v*max(0,f-22)*.065
        o.keyframe_insert(data_path='scale',frame=f);o.keyframe_insert(data_path='location',frame=f)

def area(name,loc,power,color,size,target=(0,0,2)):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.color=color;data.shape='DISK';data.size=size
    o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);o.location=loc
    o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
area('Softbox key',(-3,-4,6),1800,(.70,.82,1),5)
area('Orange rim',(-3,2,4),1600,(1,.25,.06),3)
area('Magenta rim',(3,2,5),1900,(.53,.08,1),3)
area('Front eye light',(1,-4,3),450,(1,.86,.66),2)
bpy.ops.object.camera_add(location=(4.3,-10.8,4.7))
camera=bpy.context.object;camera.name='Vertical hero camera';scene.camera=camera
camera.data.type='PERSP';camera.data.lens=43
for f,loc in [(1,(4.3,-10.8,4.7)),(45,(3.7,-10.3,4.55)),(90,(4.3,-10.8,4.7))]:
    camera.location=loc;camera.rotation_euler=(Vector((0,0,2.0))-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.keyframe_insert(data_path='location',frame=f);camera.keyframe_insert(data_path='rotation_euler',frame=f)
scene.render.filepath=str(out/'frames'/'frame_')
(out/'frames').mkdir(exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'growth-hook.blend'))
if mode=='render':
    bpy.ops.render.render(animation=True)
else:
    scene.frame_set(23);scene.render.filepath=str(out/'preview.png')
    bpy.ops.render.render(write_still=True)
print('WITHHAMMAD_3D_COMPLETE',out)
