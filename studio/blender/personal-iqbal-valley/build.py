"""Build a fully three-dimensional, clothed walking character for a personal preview.

Free MPFB geometry is fitted to Hammad's saved reference. Quaternius CC0 walking
motion is retargeted to the fitted skeleton. The old illustrated puppet is not used.
Run in a separate headless Blender; never changes an open interactive scene.
"""
import sys, math, json
from pathlib import Path
import bpy, addon_utils, bmesh
from mathutils import Vector, Matrix, Quaternion

ROOT = Path(__file__).resolve().parents[3]
WORK = ROOT / 'work/personal-iqbal-3d'
ASSETS = WORK / 'assets'
FPS = 25
MODE = sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'still'
WORK.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
sys.path.insert(0, str(WORK / 'vendor/mpfb2/src'))
original_path_user = bpy.utils.extension_path_user
bpy.utils.extension_path_user = lambda package, path='', create=False: str(WORK / 'mpfb-state' / path)
addon_utils.enable('mpfb', default_set=True, persistent=False)
bpy.utils.extension_path_user = original_path_user
from mpfb.services.humanservice import HumanService
from mpfb.services.targetservice import TargetService
from mpfb.services.objectservice import ObjectService

def material(name, color, roughness=.75):
    m=bpy.data.materials.new(name);m.use_nodes=True
    bs=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    bs.inputs['Base Color'].default_value=(*color,1)
    bs.inputs['Roughness'].default_value=roughness
    return m

def add_asset(kind, name, **kw):
    path=next((ASSETS/kind/name).glob('*.mhclo'))
    typ={'hair':'Hair','eyes':'Eyes','eyebrows':'Eyebrows','clothes':'Clothes'}.get(kind,kind)
    return HumanService.add_mhclo_asset(str(path),human,asset_type=typ,subdiv_levels=1,**kw)

macro=TargetService.get_default_macro_info_dict()
macro.update(gender=1., age=.5, muscle=.48, weight=.48, proportions=.5, height=.5)
human=HumanService.create_human(macro_detail_dict=macro)
human.name='Hammad_3D_body'
target_dir=WORK/'vendor/mpfb2/src/mpfb/data/targets'
for name,weight in [('chin/chin-width-incr',.30),('head/head-scale-horiz-incr',.12),('nose/nose-width1-incr',.12)]:
    p=target_dir/(name+'.target.gz')
    if p.exists(): TargetService.load_target(human,str(p),weight=weight)

rig=HumanService.add_builtin_rig(human,'mixamo')
rig.name='Hammad_walk_rig'
HumanService.set_character_skin(str(ASSETS/'skins/young_caucasian_male2/young_caucasian_male2.mhmat'),human,skin_type='MAKESKIN',material_instances=False)
eyes=add_asset('eyes','high-poly',material_type='PROCEDURAL_EYES')
for mat in eyes.data.materials:
    for node in mat.node_tree.nodes:
        if node.type=='GROUP':
            for key,col in [('IrisMajorColor',(.032,.016,.009,1)),('IrisMinorColor',(.09,.045,.018,1)),('IrisSection4Color',(.013,.009,.007,1))]:
                if key in node.inputs:node.inputs[key].default_value=col
hair=add_asset('hair','short04')
# Keep an adult silhouette: compress the stock quiff and sweep the crown back.
for v in hair.data.vertices:
    if v.co.z>1.665:
        v.co.y+=(v.co.z-1.665)*.18
        v.co.z=1.665+(v.co.z-1.665)*.62
brows=add_asset('eyebrows','eyebrow001')
clothes=add_asset('clothes','male_casualsuit06')
shoes=add_asset('clothes','shoes05')
shirt=add_asset('clothes','elvs_male_shirt_untucked_bd1')

# Preserve the white undershirt and charcoal trousers. Keep the tailoring geometry.
tee=material('Warm cotton tee',(.77,.76,.70),.88)
pants=material('Charcoal woven trousers',(.065,.075,.078),.86)
clothes.data.materials.clear();clothes.data.materials.append(tee);clothes.data.materials.append(pants)
for poly in clothes.data.polygons:
    z=sum(clothes.data.vertices[i].co.z for i in poly.vertices)/len(poly.vertices)
    poly.material_index=1 if z<.96 else 0
# Clearance between two independently fitted garments avoids intersecting cloth.
clothes.data.update()
for v in clothes.data.vertices:
    if v.co.z>.96:v.co-=v.normal*.007
bm=bmesh.new();bm.from_mesh(clothes.data)
bmesh.ops.delete(bm,geom=[f for f in bm.faces if .96<f.calc_center_median().z<1.46],context='FACES')
bm.to_mesh(clothes.data);bm.free()
olive=material('Olive cotton overshirt',(.16,.19,.11),.9)
nt=olive.node_tree;noise=nt.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=180
bump=nt.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.13;bump.inputs['Distance'].default_value=.001
nt.links.new(noise.outputs['Fac'],bump.inputs['Height']);nt.links.new(bump.outputs['Normal'],next(n for n in nt.nodes if n.type=='BSDF_PRINCIPLED').inputs['Normal'])
shirt.data.materials.clear();shirt.data.materials.append(olive)
shirt.data.update()
for v in shirt.data.vertices:v.co+=v.normal*.012
# Keep the supplied clean tailoring. The earlier arbitrary face deletion made a
# jagged opening; a natural buttoned olive shirt is preferable to damaged cloth.
# Reinstate covered torso where the open shirt's original delete mask hid it.
for mod in list(human.modifiers):
    if mod.type=='MASK':
        mod.show_render=True;mod.show_viewport=True
for mod in list(clothes.modifiers):
    if mod.type=='MASK': mod.show_render=False;mod.show_viewport=False

for obj in [human,eyes,hair,brows,clothes,shoes,shirt]:
    for p in obj.data.polygons:p.use_smooth=True
    if obj==human:
        sub=obj.modifiers.new('Smooth skin','SUBSURF');sub.levels=1;sub.render_levels=1

# Colour the source hair black while retaining its strand alpha and detailed normals.
for obj in [hair,brows]:
    for mat in obj.data.materials:
        if not mat or not mat.use_nodes:continue
        bs=next((n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
        if bs:
            for link in list(bs.inputs['Base Color'].links): mat.node_tree.links.remove(link)
            bs.inputs['Base Color'].default_value=(.006,.005,.004,1)
            bs.inputs['Roughness'].default_value=.48

# Report rest-space anatomy and available facial groups before texture fitting.
bpy.context.view_layer.update()
coords=[v.co.copy() for v in human.data.vertices]
for gname in [g.name for g in human.vertex_groups if 'eye' in g.name or 'mouth' in g.name or 'nose' in g.name or 'chin' in g.name]:
    ids=ObjectService.get_vertex_indexes_for_vertex_group(human,gname)
    if ids:
        c=sum((coords[i] for i in ids),Vector())/len(ids)
        print('LANDMARK',gname,list(c),flush=True)

skin=human.data.materials[0]
bs=next(n for n in skin.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
bs.inputs['Roughness'].default_value=.78

# Dedicated identity UV layer, based on the undeformed facial surface. A colour
# mask blends the frontal photo into the side/neck texture; it deforms with skin.
deps=bpy.context.evaluated_depsgraph_get()
eval_h=human.evaluated_get(deps)
# Shape-key mixed coordinates (before the mask modifier changes vertex indices).
mixed=human.shape_key_add(name='Identity rest',from_mix=True)
rest=[p.co.copy() for p in mixed.data];human.shape_key_remove(mixed)
uv=human.data.uv_layers.new(name='HammadIdentity')
mask=human.data.color_attributes.new(name='IdentityBlend',type='FLOAT_COLOR',domain='CORNER')
def smooth(a,b,x):
    t=max(0.,min(1.,(x-a)/(b-a)));return t*t*(3-2*t)
def photo_y(z):
    knots=[(1.48,850),(1.501,790),(1.532,710),(1.555,640),(1.562,625),(1.5684,605),(1.5845,555),(1.6204,443),(1.660,295),(1.72,100),(1.8,0)]
    for (a,va),(b,vb) in zip(knots,knots[1:]):
        if z<=b:return va+(vb-va)*max(0.,(z-a)/(b-a))
    return 0
for loop in human.data.loops:
    c=rest[loop.vertex_index]
    # Frontal source image: eyes y=450 px, chin y=805 px; fit refined in preview.
    u=(485/1080+c.x*2.9)
    v=1.-photo_y(c.z)/1920.
    uv.data[loop.index].uv=(u,v)
    blend=smooth(1.485,1.51,c.z)*(1.-smooth(1.71,1.75,c.z))*(1.-smooth(-.075,-.015,c.y))*(1.-smooth(.060,.082,abs(c.x)))
    mask.data[loop.index].color=(blend,blend,blend,1.)
nt=skin.node_tree
uvn=nt.nodes.new('ShaderNodeUVMap');uvn.uv_map=uv.name
tex=nt.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(ROOT/'studio/.local/jobs/6eea2483df7b/look/hammad-ref.jpg'))
nt.links.new(uvn.outputs['UV'],tex.inputs['Vector'])
attr=nt.nodes.new('ShaderNodeVertexColor');attr.layer_name=mask.name
mix=nt.nodes.new('ShaderNodeMixRGB');mix.blend_type='MIX'
nt.links.new(attr.outputs['Color'],mix.inputs[0])
old=list(bs.inputs['Base Color'].links)
if old: nt.links.new(old[0].from_socket,mix.inputs[1])
else:mix.inputs[1].default_value=(.32,.20,.13,1)
nt.links.new(tex.outputs['Color'],mix.inputs[2]);nt.links.new(mix.outputs[0],bs.inputs['Base Color'])

# Stage: transparent character plate with natural sun/sky light. The approved
# valley artwork is preserved as the final compositing plate.
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
try:
    pref=bpy.context.preferences.addons['cycles'].preferences
    pref.compute_device_type='METAL';pref.get_devices()
    for device in pref.devices:device.use=device.type=='METAL'
    scene.cycles.device='GPU'
except Exception as exc:print('GPU fallback:',str(exc))
scene.render.resolution_x=1280;scene.render.resolution_y=720;scene.render.resolution_percentage=100
scene.render.fps=FPS;scene.frame_start=1;scene.frame_end=150
scene.render.film_transparent=True
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.view_settings.view_transform='Standard'
scene.world=bpy.data.worlds.new('Valley sky')
scene.world.use_nodes=True
worldbg=next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND')
worldbg.inputs['Color'].default_value=(.63,.77,1.,1);worldbg.inputs['Strength'].default_value=.6
def light(name,typ,loc,power,color,size=4):
    data=bpy.data.lights.new(name,typ);data.energy=power;data.color=color
    if typ=='AREA':data.shape='DISK';data.size=size
    obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=loc
    obj.rotation_euler=(Vector((0,0,1))-obj.location).to_track_quat('-Z','Y').to_euler()
    return obj
sun=light('Golden valley sunlight','AREA',(-3,-4,7),550,(1.,.87,.66),4)
light('Soft sky fill','AREA',(3,-1,4),180,(.72,.85,1.),5)
ground=material('Stone ground',(.55,.44,.28),.9)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.002))
plane=bpy.context.object;plane.name='Valley contact shadow';plane.data.materials.append(ground);plane.is_shadow_catcher=True
camd=bpy.data.cameras.new('Valley camera');cam=bpy.data.objects.new('Valley camera',camd);scene.collection.objects.link(cam)
cam.location=(2.7,-6.5,2.25);target=Vector((0,0,.9));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();camd.type='PERSP';camd.lens=48
scene.camera=cam

# Temporary standing pose for evaluating the actual 3D identity, before animation.
for side in ['Left','Right']:
    for name in ['Arm','ForeArm']:
        bone=rig.pose.bones['mixamorig:'+side+name]
        # Bring the rest-pose arms naturally alongside the torso.
        restq=bone.bone.matrix_local.to_quaternion()
        direction=Vector((.05 if side=='Left' else -.05,0,-1))
        q=(bone.bone.tail_local-bone.bone.head_local).normalized().rotation_difference(direction.normalized())@restq
        m=q.to_matrix().to_4x4();m.translation=bone.head;bone.matrix=m
        bpy.context.view_layer.update()

scene.render.filepath=str(WORK/'identity-test.png')
for gname in ['joint-l-eye','joint-r-eye','joint-mouth']:
    ids=ObjectService.get_vertex_indexes_for_vertex_group(human,gname)
    print('MIXED_LANDMARK',gname,list(sum((rest[i] for i in ids),Vector())/len(ids)),flush=True)
bpy.ops.wm.save_as_mainfile(filepath=str(WORK/'Hammad-valley-base.blend'))
if MODE!='build':bpy.ops.render.render(write_still=True)
print('IDENTITY_PREVIEW',scene.render.filepath,flush=True)
