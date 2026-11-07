"""Pass A: stills for the in-world screens: the frozen-beach short, and 8 varied frames for the 56-video wall."""
import bpy, sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
import assets as A, sets as S
from mathutils import Vector
out = sys.argv[sys.argv.index('--') + 1]; os.makedirs(out, exist_ok=True)
sc = A.reset(720, 1280, 24)
A.build_floor(); A.build_stars()
A.build_city(center=(0, 3, 0), radius=15, clear=0.1, seed=4)
beach_sun = S.build_beach(); cars = S.build_street()
bpy.ops.object.light_add(type='AREA', location=(-3, -5, 9)); k = bpy.context.object; k.data.energy = 2500; k.data.size = 8
k.rotation_euler = (math.radians(40), 0, math.radians(-30))
def cam(loc, target, lens):
    bpy.ops.object.camera_add(location=loc); o = bpy.context.object; o.data.lens = lens
    d = Vector(target) - Vector(loc); o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler(); return o
street_sun = bpy.data.objects['streetsun']
shots = [
 ('beach', (-300, -8, 2.2), (-300, 10, 2.6), 26, 'beach'),
 ('beach2', (-306, -4, 6), (-299, 12, 1), 30, 'beach'),
 ('street', (300, -6, 1.6), (300, 40, 4), 24, 'street'),
 ('street2', (296, -2, 7), (301, 30, 1), 28, 'street'),
 ('city', (8, -12, 9), (0, 3, 0), 30, 'night'),
 ('city2', (-10, -6, 4), (2, 6, 2), 24, 'night'),
 ('beach3', (-292, 0, 1.2), (-302, 14, 3), 30, 'beach'),
 ('street3', (303, 8, 2.5), (298, 30, 3), 30, 'street'),
]
only = sys.argv[sys.argv.index('--') + 2:] 
for name, loc, tgt, lens, kind in shots:
    if only and name not in only: continue
    bg = bpy.context.scene.world.node_tree.nodes['Background']
    if kind == 'night': bg.inputs['Color'].default_value = (*A.NAVY_BG, 1); bg.inputs['Strength'].default_value = 0.6
    else: bg.inputs['Color'].default_value = (*A.srgb('#a9c8ea'), 1); bg.inputs['Strength'].default_value = 1.0
    beach_sun.data.energy = 1.6 if kind == 'beach' else 0
    street_sun.data.energy = 3.2 if kind == 'street' else 0
    for i in range(3): bpy.data.objects[f'streetfill{i}'].data.energy = 9000 if kind == 'street' else 0
    sc.camera = cam(loc, tgt, lens); sc.render.filepath = f'{out}/{name}.jpg'; bpy.ops.render.render(write_still=True)
