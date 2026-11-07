"""Glass business-icon orbit matching Chamber's reference insert. Free procedural assets."""
import bpy, math, random, sys
from mathutils import Vector
from pathlib import Path

out=Path(sys.argv[sys.argv.index('--')+1]).resolve();out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
s=bpy.context.scene;s.name='Chamber business orbit';s.render.engine='CYCLES'
p=bpy.context.preferences.addons['cycles'].preferences;p.compute_device_type='METAL';p.get_devices()
for d in p.devices:d.use=d.type=='METAL'
s.cycles.device='GPU';s.cycles.samples=16;s.cycles.use_denoising=True
s.render.resolution_x=1080;s.render.resolution_y=1920;s.render.resolution_percentage=100
s.render.fps=30;s.frame_start=1;s.frame_end=72;s.render.image_settings.file_format='PNG'
s.world=bpy.data.worlds.new('Deep blue studio');s.world.use_nodes=True
s.world.node_tree.nodes['Background'].inputs[0].default_value=(.007,.018,.034,1)
s.world.node_tree.nodes['Background'].inputs[1].default_value=.4

def material(name,color,metal=.0,glow=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    b=m.node_tree.nodes['Principled BSDF'];b.inputs['Base Color'].default_value=(*color,1)
    b.inputs['Metallic'].default_value=metal;b.inputs['Roughness'].default_value=.22
    b.inputs['Emission Color'].default_value=(*color,1);b.inputs['Emission Strength'].default_value=glow
    return m
gold=material('Warm gold icons',(.83,.54,.20),.6,.3)
glow=material('Golden core',(1,.72,.26),.0,12)
dot=material('Orbit particles',(.16,.42,.62),.0,2)
glass=material('Thin glass shell',(.70,.78,.84),.4)
n=glass.node_tree.nodes;links=glass.node_tree.links;bs=n.get('Principled BSDF')
bs.inputs['Roughness'].default_value=.08
transparent=n.new('ShaderNodeBsdfTransparent');fresnel=n.new('ShaderNodeFresnel');fresnel.inputs['IOR'].default_value=1.16
mix=n.new('ShaderNodeMixShader');links.new(fresnel.outputs[0],mix.inputs[0]);links.new(transparent.outputs[0],mix.inputs[1])
links.new(bs.outputs[0],mix.inputs[2]);links.new(mix.outputs[0],n.get('Material Output').inputs['Surface'])

def sphere(name,loc,r,mat,parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40,ring_count=24,radius=r,location=loc)
    o=bpy.context.object;o.name=name;o.data.materials.append(mat)
    for f in o.data.polygons:f.use_smooth=True
    if parent:o.parent=parent
    return o
def line(points,parent,r=.025,closed=False):
    c=bpy.data.curves.new('Gold icon stroke','CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=3
    q=c.splines.new('POLY');q.points.add(len(points)-1)
    for a,(x,z) in zip(q.points,points):a.co=(x,-.18,z,1)
    q.use_cyclic_u=closed;o=bpy.data.objects.new('Business icon',c);s.collection.objects.link(o)
    o.data.materials.append(gold);o.parent=parent;return o
def circle(cx,cz,r,parent):return line([(cx+r*math.cos(j*math.tau/40),cz+r*math.sin(j*math.tau/40)) for j in range(40)],parent,.025,True)

for i,name in enumerate(['procurement','operations','people','logistics','finance','compliance']):
    rig=bpy.data.objects.new(name,None);s.collection.objects.link(rig)
    sphere('Glass '+name,(0,0,0),.58,glass,rig)
    if name=='procurement':
        line([(-.32,.23),(-.23,.23),(-.13,-.17),(.23,-.17)],rig)
        line([(-.20,.14),(.30,.14),(.23,-.08),(-.15,-.08)],rig,closed=True)
        for x in (-.07,.06,.18):line([(x,.12),(x-.03,-.07)],rig,.015)
        circle(-.09,-.27,.04,rig);circle(.20,-.27,.04,rig)
    elif name=='operations':
        pts=[]
        for k in range(48):
            a=k*math.tau/48;r=.29 if k%6 in (1,2,3,4) else .22
            pts.append((r*math.cos(a),r*math.sin(a)))
        line(pts,rig,.035,True);circle(0,0,.12,rig)
    elif name=='people':
        circle(0,.17,.12,rig)
        line([(-.23,-.27),(-.21,-.06),(-.12,.01),(0,-.03),(.12,.01),(.21,-.06),(.23,-.27)],rig,.035,True)
        line([(0,-.03),(0,-.26)],rig,.015)
    elif name=='logistics':
        line([(-.31,-.15),(-.31,.17),(.07,.17),(.07,-.15)],rig,closed=True)
        line([(.07,-.15),(.07,.09),(.23,.09),(.32,-.02),(.32,-.15)],rig,closed=True)
        circle(-.18,-.21,.065,rig);circle(.22,-.21,.065,rig)
    elif name=='finance':
        circle(0,0,.28,rig)
        line([(.12,.15),(.03,.21),(-.11,.16),(-.12,.06),(.11,-.04),(.12,-.15),(-.02,-.21),(-.12,-.15)],rig,.03)
        line([(0,.28),(0,-.28)],rig,.025)
    else:
        line([(-.26,.20),(0,.30),(.26,.20),(.23,-.07),(0,-.30),(-.23,-.07)],rig,.035,True)
        line([(-.18,.14),(0,.21),(.18,.14),(.16,-.05),(0,-.21),(-.16,-.05)],rig,.015,True)
        line([(0,.21),(0,-.21)],rig,.015)
    for f in (1,36,72):
        a=math.pi*2/3-i*math.tau/6+(f-1)*.0019
        rig.location=(2.03*math.cos(a),.03*math.sin(a),1.62*math.sin(a))
        rig.keyframe_insert(data_path='location',frame=f)

sphere('Core',(0,.05,0),.075,glow)
random.seed(3)
for i in range(160):
    a=random.random()*math.tau;r=2.05+random.uniform(-.07,.07)
    sphere('Dust',(r*math.cos(a),.10,1.65*math.sin(a)+random.uniform(-.05,.05)),random.uniform(.002,.007),dot)
for name,loc,energy,color,size in [('Key',(-3,-4,4),350,(1,.83,.61),3),('Rim',(3,0,2),250,(.6,.78,1),2),('Top',(-1,1,4),200,(1,.9,.7),2)]:
    l=bpy.data.lights.new(name,'AREA');l.energy=energy;l.color=color;l.size=size
    o=bpy.data.objects.new(name,l);s.collection.objects.link(o);o.location=loc
    o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(0,-10,0));s.camera=bpy.context.object
s.camera.rotation_euler=Vector((0,1,0)).to_track_quat('-Z','Y').to_euler();s.camera.data.type='ORTHO';s.camera.data.ortho_scale=12.2
s.view_settings.view_transform='AgX'
(out/'frames').mkdir(exist_ok=True);s.render.filepath=str(out/'frames'/'frame_')
bpy.ops.wm.save_as_mainfile(filepath=str(out/'chamber-orbit.blend'))
bpy.ops.render.render(animation=True)
