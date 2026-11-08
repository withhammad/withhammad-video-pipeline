"""Procedural free cartoon plates for Edge0. Run only in a background Blender process.

Blender -b -P build.py -- OUTPUT preview|render
"""
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:]
out = Path(args[0]).resolve()
mode = args[1] if len(args) > 1 else 'preview'
out.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
s = bpy.context.scene
s.name = 'WITHHAMMAD Edge0 cartoon'
s.render.engine = 'BLENDER_EEVEE'
s.render.resolution_x = 1080
s.render.resolution_y = 1920
s.render.resolution_percentage = 100
s.render.fps = 30
s.render.image_settings.file_format = 'PNG'
s.render.image_settings.color_mode = 'RGBA'
s.render.film_transparent = True
s.view_settings.view_transform = 'Standard'
s.world = bpy.data.worlds.new('Soft studio')
s.world.use_nodes = True
s.world.node_tree.nodes['Background'].inputs[0].default_value = (.12, .15, .24, 1)
s.world.node_tree.nodes['Background'].inputs[1].default_value = .45


def material(name, rgb, metal=0, rough=.38):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*rgb, 1)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Roughness'].default_value = rough
    return m


navy = material('WithHammad midnight', (.025, .035, .105))
violet = material('Indigo feather', (.08, .065, .23))
teal = material('Cyan wing', (.025, .60, .69), .15)
cream = material('Warm cream', (.88, .86, .72))
gold = material('Golden iris and feet', (1, .55, .025), .15)
black = material('Pupils', (.004, .006, .014), .05, .18)
white = material('Catchlight', (1, 1, 1), 0, .1)
steel = material('GPU frame', (.22, .28, .36), .75, .25)


def empty(name, loc=(0, 0, 0), parent=None):
    o = bpy.data.objects.new(name, None)
    s.collection.objects.link(o)
    o.location = loc
    o.parent = parent
    return o


def finish(o, name, mat, parent=None):
    o.name = name
    o.data.materials.append(mat)
    o.parent = parent
    if o.type == 'MESH':
        for p in o.data.polygons:
            p.use_smooth = True
    return o


def sphere(name, loc, scale, mat, parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, location=loc)
    o = bpy.context.object
    o.scale = scale
    return finish(o, name, mat, parent)


def box(name, loc, scale, mat, parent=None, bevel=.06):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    b = o.modifiers.new('Soft corners', 'BEVEL')
    b.width, b.segments = bevel, 3
    return finish(o, name, mat, parent)


def triangle(name, coords, mat, parent=None, depth=.16):
    verts = [(x, -depth, z) for x, z in coords] + [(x, depth, z) for x, z in coords]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], [(0, 1, 2), (5, 4, 3), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)])
    mesh.update()
    o = bpy.data.objects.new(name, mesh)
    s.collection.objects.link(o)
    b = o.modifiers.new('Soft silhouette', 'BEVEL')
    b.width, b.segments = .045, 3
    return finish(o, name, mat, parent)


def text(name, value, loc, size, mat, parent=None):
    cu = bpy.data.curves.new(name, 'FONT')
    cu.body, cu.align_x, cu.size = value, 'CENTER', size
    cu.extrude = .002
    o = bpy.data.objects.new(name, cu)
    s.collection.objects.link(o)
    o.location, o.rotation_euler = loc, (math.pi / 2, 0, 0)
    return finish(o, name, mat, parent)


root = empty('Animated owl')
sphere('Body', (0, 0, 1.1), (.70, .39, .87), navy, root)
sphere('Cream bib', (0, -.35, 1.05), (.43, .13, .60), cream, root)
head = empty('Expressive head', (0, -.01, 2.15), root)
sphere('Wide friendly head', (0, 0, 0), (.86, .38, .67), violet, head)
for side in (-1, 1):
    triangle('Ear tuft', [(side*.43, .45), (side*.87, .99), (side*.86, .22)], navy, head)
    triangle('Ear highlight', [(side*.57, .46), (side*.79, .75), (side*.77, .39)], teal, head, .17)
    eye = empty('Blinking eye', (side*.39, -.36, .02), head)
    sphere('Eye cream ring', (0, 0, 0), (.40, .10, .43), cream, eye)
    sphere('Amber iris', (0, -.09, 0), (.26, .08, .30), gold, eye)
    sphere('Dark pupil', (side*.016, -.16, 0), (.14, .05, .21), black, eye)
    sphere('Eye catchlight', (-.05, -.205, .09), (.055, .024, .062), white, eye)
    eye['side'] = side
    for j in range(3):
        sphere('Three soft toes', (side*.28+(j-1)*.10, -.11-.045*(j==1), .14), (.085, .21, .08), gold, root)
beak = triangle('Small beak', [(-.10, -.15), (.10, -.15), (0, -.39)], gold, head, .08)
beak.location.y = -.54
wings = []
for side in (-1, 1):
    w = empty('Gesture wing', (side*.60, .03, 1.55), root)
    sphere('Wing', (side*.16, 0, -.31), (.28, .17, .56), violet, w)
    for i in range(3):
        feather = sphere('Teal feather', (side*(.22+i*.065), -.13, -.34+i*.10), (.095, .07, .36), teal, w)
        feather.rotation_euler.y = side * -.15
    wings.append(w)

eyes = [o for o in bpy.data.objects if o.name.startswith('Blinking eye')]
for f in range(1, 241):
    t = (f-1)/30
    phase = (f-1)//60
    p = ((f-1)%60)/60
    root.location.z = .04*math.sin(t*math.pi*2)
    head.rotation_euler = (.025*math.sin(t*3), .07*math.sin(t*2), .03*math.sin(t*2.4))
    for i, w in enumerate(wings):
        side = -1 if i == 0 else 1
        angle = -side*(.12+.06*math.sin(t*4))
        if phase == 1 and side == 1:
            angle = -1.55 * math.sin(math.pi*p)**.5
        if phase == 2:
            angle = -side*(.9*math.sin(math.pi*p)**.5+.15)
            head.rotation_euler.y = .18*math.sin(math.pi*p)
        if phase == 3 and side == 1:
            angle = -1.9-.35*math.sin(p*math.pi*6)
        w.rotation_euler.y = angle
        w.keyframe_insert('rotation_euler', frame=f)
    for eye in eyes:
        blink = math.exp(-((p-.62)/.035)**2)
        eye.scale.z = 1-.92*blink
        eye.keyframe_insert('scale', frame=f)
    head.keyframe_insert('rotation_euler', frame=f)
    root.keyframe_insert('location', frame=f)

bpy.ops.object.camera_add(location=(0, -10, 2.1))
cam = bpy.context.object
cam.rotation_euler = (Vector((0, 0, 1.65))-cam.location).to_track_quat('-Z', 'Y').to_euler()
cam.data.type, cam.data.ortho_scale = 'ORTHO', 5.4
s.camera = cam
for name, loc, power, color, size in [('Key',(-3,-5,6),700,(1,.88,.70),5),('Fill',(3,-3,3),420,(.50,.82,1),4),('Rim',(2,2,5),850,(.35,.70,1),3)]:
    bpy.ops.object.light_add(type='AREA', location=loc)
    o = bpy.context.object
    o.name = name
    o.data.energy, o.data.color, o.data.shape, o.data.size = power, color, 'DISK', size
    o.rotation_euler = (Vector((0,0,1.5))-o.location).to_track_quat('-Z','Y').to_euler()
s.frame_start, s.frame_end = 1, 240
s.frame_set(20)
s.render.filepath = str(out/'owl-preview.png')
bpy.ops.wm.save_as_mainfile(filepath=str(out/'edge0-owl.blend'))
if mode == 'preview':
    bpy.ops.render.render(write_still=True)
else:
    (out/'owl').mkdir(exist_ok=True)
    s.render.filepath = str(out/'owl/frame-')
    bpy.ops.render.render(animation=True)
