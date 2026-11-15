"""LUTF-KNIT 3D plate: the opening hay-bale shot of the private knitted "Grace of Allah" (لطف الله) reel for the owner's wife
(@heal.ingthroughquran). Reference DfsTrK5or6t (@taddbeer_fx), shot 1 0.00-3.57 s and shot 2 3.57-5.33 s: a farmer naps against
a wall of hay bales, his radio drops off the fence post, he gets up to fetch it and walks off, and the wall collapses where he sat.
Rebuilt as a real 3D knitted diorama with a rigid-body collapse, rendered headless with EEVEE:

    studio/heavy.sh /Applications/Blender.app/Contents/MacOS/Blender -b -P studio/blender/lutfknit/build.py -- <out> stills 0,60,140
    studio/heavy.sh /Applications/Blender.app/Contents/MacOS/Blender -b -P studio/blender/lutfknit/build.py -- <out> anim [first] [last]
    ... -- <out> sim      (steps the physics only: prints when the bales land, writes <out>/geom.json)

Options after the mode: --backdrop <png> (the GPT Image 2 knitted countryside), --push <frame> (when the wall is pushed),
--samples N (EEVEE samples, default 24), --pct P (resolution percent).

Scene (units ~ 10 cm; camera looks along +y; ground z = 0):
  - a wall of 38 knitted hay bales in ten rows (straw yarn in six shades, stockinette relief from a numpy height map, two
    red twine loops each); asleep rigid bodies under 2x gravity (a miniature falls fast) that wake when an invisible
    kinematic board pushes the upper rows at --push (frame 112), so the wall bulges, topples forward and comes down on the
    farmer's empty spot with real physics (first bales on the ground at frames 144-147, the reference's 4.90 s thump);
  - a knitted meadow (sage/olive heathered stockinette), a felt dirt strip at the wall foot, felt flowers and yarn tufts;
  - a fence of knitted posts and two silver-grey yarn wires, a red knitted retro radio on the near post that is tugged off at
    frame 21, lands by the farmer's feet at frame 41 (the reference's 1.37 s thump) and disappears at frame 78 when the doll
    (a GPT Image 2 sprite composited in Remotion) is holding it;
  - the GPT Image 2 knitted countryside on a curved backdrop (its knitted sky mirrored above the image, fading into a
    peach-to-blue sky gradient), a warm low sun, sky fill;
  - camera 1 (frames 0-106): medium shot on the wall foot with a slow push; camera 2 (107-159): wide and low, for the collapse.
The farmer, the gold thread and all text are composited in Remotion; geom.json gives their screen anchors per frame.
Outputs: <out>/frames/f0000.jpg ..., <out>/stills/, <out>/geom.json, <out>/tex/.
"""
import bpy
import bmesh
import json
import math
import sys
import time
from pathlib import Path

import numpy as np
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index('--') + 1:]
OUT = Path(argv[0]).resolve()
MODE = argv[1] if len(argv) > 1 else 'stills'
POS = [a for a in argv[2:] if not a.startswith('--') and (argv.index(a) == 0 or not argv[argv.index(a) - 1].startswith('--'))]
opt = lambda k, d=None: argv[argv.index(k) + 1] if k in argv else d
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'tex').mkdir(exist_ok=True)

FPS, NF = 30, 160
CUT = 107                                  # first frame of shot 2 (3.567 s)
PUSH = int(opt('--push', 112))            # the board starts pushing the upper rows
GRAV = float(opt('--grav', 2.0))
BOARD_H = float(opt('--board', 3.6))
SAMPLES, PCT = int(opt('--samples', 24)), int(opt('--pct', 100))
BACKDROP = opt('--backdrop')
TALL = 1.36                                # the backdrop plane is 1.36 image-heights tall: above the image (v > 1) its sky is mirrored, never the hills
rng = np.random.default_rng(42)

# ------------------------------------------------------------------------------------------------ scene and render settings
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.name = 'LUTF_KNIT'
for eng in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
    try:
        sc.render.engine = eng
        break
    except TypeError:
        pass
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1080, 1920, PCT
sc.render.fps = FPS
sc.frame_start, sc.frame_end = 0, NF - 1
sc.render.image_settings.file_format = 'JPEG'
sc.render.image_settings.quality = 94
sc.render.film_transparent = False
sc.render.use_motion_blur = True
ee = sc.eevee


def tryset(o, **kw):
    for k, v in kw.items():
        try:
            setattr(o, k, v)
        except Exception as e:  # noqa: BLE001 (API names move between Blender versions)
            print('  (skip', k, type(e).__name__, ')')


tryset(sc.render, motion_blur_shutter=0.5)
tryset(ee, taa_render_samples=SAMPLES, use_raytracing=True, ray_tracing_method='SCREEN', use_shadows=True, shadow_ray_count=2,
       shadow_step_count=8, use_fast_gi=True, fast_gi_method='GLOBAL_ILLUMINATION', bokeh_max_size=50, motion_blur_steps=1)
try:
    ee.ray_tracing_options.resolution_scale = '2'
except Exception:
    pass
sc.view_settings.view_transform = 'AgX'
for look in ('AgX - Punchy', 'Punchy', 'AgX - Medium High Contrast', 'None'):
    try:
        sc.view_settings.look = look
        break
    except TypeError:
        pass
sc.view_settings.exposure = float(opt('--exposure', -0.1))
print('VIEW', sc.view_settings.view_transform, sc.view_settings.look)


def srgb(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


def rgba(h):
    return (*srgb(h), 1.0)


def sk(sockets, ident):
    for s in sockets:
        if s.identifier == ident:
            return s
    raise KeyError(ident)


world = bpy.data.worlds.new('Sky')
sc.world = world
world.use_nodes = True
wn = world.node_tree.nodes
wbg = wn['Background']
wbg.inputs[1].default_value = 0.6
# a sky gradient behind the backdrop (the view direction's z: horizon peach, zenith blue), so no grey void shows above it
_tc = wn.new('ShaderNodeTexCoord')
_sep = wn.new('ShaderNodeSeparateXYZ')
_mr = wn.new('ShaderNodeMapRange')
_mr.inputs['From Min'].default_value, _mr.inputs['From Max'].default_value = -1.0, 1.0
_ramp = wn.new('ShaderNodeValToRGB')
_el = _ramp.color_ramp.elements
_el[0].position, _el[0].color = 0.0, rgba('#7DA35A')
_el[1].position, _el[1].color = 1.0, rgba('#5F7FB6')
for _pos, _hex in ((0.5, '#F4C8A2'), (0.6, '#8FA7D2')):
    _e = _el.new(_pos)
    _e.color = rgba(_hex)
world.node_tree.links.new(_tc.outputs['Generated'], _sep.inputs[0])
world.node_tree.links.new(_sep.outputs['Z'], _mr.inputs['Value'])
world.node_tree.links.new(_mr.outputs['Result'], _ramp.inputs['Fac'])
world.node_tree.links.new(_ramp.outputs['Color'], wbg.inputs[0])


# ------------------------------------------------------------------------------------------------ procedural knit textures (numpy)
def knit_tile(n=4, px=128, seed=3, legw=0.25):
    """Tileable stockinette height map, n x n stitches: two plied legs per stitch (a V), each a rounded tube with ply twist."""
    S = n * px
    v, u = np.mgrid[0:S, 0:S].astype(np.float32) / px
    v = n - v
    H = np.zeros((S, S), np.float32)
    r = np.random.default_rng(seed)
    jit = r.uniform(-1, 1, (n, n, 4)).astype(np.float32)
    for dj in (-1, 0, 1):
        for di in (-1, 0, 1):
            ci, cj = np.floor(u) + di, np.floor(v) + dj
            lu, lv = u - ci, v - cj
            ji = jit[(ci.astype(int) % n), (cj.astype(int) % n)]
            for side in (-1, 1):
                bx, by = 0.5 + 0.03 * ji[..., 0], -0.18
                tx, ty = 0.5 + side * (0.40 + 0.03 * ji[..., 1]), 1.12
                ax, ay = tx - bx, ty - by
                L = np.sqrt(ax * ax + ay * ay)
                ax, ay = ax / L, ay / L
                du, dv = lu - bx, lv - by
                along = (du * ax + dv * ay) / L
                across = (du * -ay + dv * ax) / (legw * (1 + 0.06 * ji[..., 2]))
                e = ((along - 0.5) / 0.5) ** 2 + across ** 2
                h = np.sqrt(np.clip(1 - e, 0, 1))
                ply = 0.5 + 0.5 * np.sin(2 * np.pi * (along * L * 5.5 + across * 0.9 * side) + ji[..., 3] * 3)
                h = h * (0.80 + 0.20 * ply) * (0.93 + 0.07 * ji[..., 0])
                h = h * (1 - 0.35 * np.exp(-((along - 0.97) / 0.10) ** 2)) * (1 - 0.25 * np.exp(-((along - 0.04) / 0.08) ** 2))
                H = np.maximum(H, h)
    fuzz = r.normal(0, 1, (S, S)).astype(np.float32)
    k = np.ones(3, np.float32) / 3
    fuzz = np.apply_along_axis(lambda x: np.convolve(x, k, 'same'), 1, fuzz)
    return np.clip(H + 0.035 * fuzz, 0, 1)


def save_png(arr, path):
    a = np.asarray(arr, np.float32)
    if a.ndim == 2:
        a = np.repeat(a[..., None], 3, 2)
    h, w = a.shape[:2]
    img = bpy.data.images.new(Path(path).stem, w, h, alpha=False)
    px = np.ones((h, w, 4), np.float32)
    px[..., :3] = a[::-1]
    img.pixels.foreach_set(px.ravel())
    img.filepath_raw = str(path)
    img.file_format = 'PNG'
    img.save()
    bpy.data.images.remove(img)


KNIT_PNG = OUT / 'tex' / 'knit_tile.png'
if not KNIT_PNG.exists():
    save_png(knit_tile(), KNIT_PNG)


# ------------------------------------------------------------------------------------------------ materials
def principled(name, color, rough=0.85, sheen=0.25, sss=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = color if len(color) == 4 else (*color, 1)
    b.inputs['Roughness'].default_value = rough
    for k, v in (('Sheen Weight', sheen), ('Sheen Roughness', 0.45), ('Subsurface Weight', sss)):
        if k in b.inputs:
            b.inputs[k].default_value = v
    if 'Sheen Tint' in b.inputs:
        try:
            b.inputs['Sheen Tint'].default_value = (1, 0.97, 0.9, 1)
        except Exception:
            pass
    return m, nt, b


def add_fiber_bump(nt, b, scale=90.0, strength=0.35, dist=0.02):
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nz = nt.nodes.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = scale
    nz.inputs['Detail'].default_value = 10
    nz.inputs['Roughness'].default_value = 0.7
    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = strength
    bump.inputs['Distance'].default_value = dist
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    nt.links.new(nz.outputs['Fac'], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], b.inputs['Normal'])
    return bump


def felt(name, hexcol, scale=70.0):
    m, nt, b = principled(name, rgba(hexcol), rough=0.92, sheen=0.3, sss=0.06)
    add_fiber_bump(nt, b, scale, 0.45, 0.012)
    return m


def knit_mat(name, palette, stitch=0.06, bump=0.9, random_by_object=True, heather=0.0):
    """box-projected stockinette: the height map shades the grooves and drives the bump; colour from a palette ramp, picked
    per object (Object Info random) or per stitch area (noise) for heathered yarn"""
    m, nt, b = principled(name, rgba(palette[0]), rough=0.9, sheen=0.25, sss=0.05)
    N, L = nt.nodes, nt.links
    tc = N.new('ShaderNodeTexCoord')
    mp = N.new('ShaderNodeMapping')
    s = 4 / (stitch * 4)                                     # tile = 4 stitches
    mp.inputs['Scale'].default_value = (s / 4, s / 4, s / 4)
    L.new(tc.outputs['Object'], mp.inputs['Vector'])
    ht = N.new('ShaderNodeTexImage')
    ht.image = bpy.data.images.load(str(KNIT_PNG), check_existing=True)
    ht.image.colorspace_settings.name = 'Non-Color'
    ht.projection = 'BOX'
    ht.projection_blend = 0.25
    ht.interpolation = 'Cubic'
    L.new(mp.outputs['Vector'], ht.inputs['Vector'])
    ramp = N.new('ShaderNodeValToRGB')
    el = ramp.color_ramp.elements
    ramp.color_ramp.interpolation = 'CONSTANT'
    for i in range(len(palette) - len(el)):
        el.new(0.5)
    for i, h in enumerate(palette):
        el[i].position = i / len(palette)
        el[i].color = rgba(h)
    if random_by_object:
        oi = N.new('ShaderNodeObjectInfo')
        L.new(oi.outputs['Random'], ramp.inputs['Fac'])
    else:
        nz = N.new('ShaderNodeTexNoise')
        nz.inputs['Scale'].default_value = 1.6
        L.new(tc.outputs['Object'], nz.inputs['Vector'])
        L.new(nz.outputs['Fac'], ramp.inputs['Fac'])
        ramp.color_ramp.interpolation = 'LINEAR'
    col = ramp.outputs['Color']
    if heather:
        hn = N.new('ShaderNodeTexNoise')
        hn.inputs['Scale'].default_value = 260
        L.new(tc.outputs['Object'], hn.inputs['Vector'])
        hr = N.new('ShaderNodeMapRange')
        hr.inputs['To Min'].default_value, hr.inputs['To Max'].default_value = 1 - heather, 1 + heather
        L.new(hn.outputs['Fac'], hr.inputs['Value'])
        hm = N.new('ShaderNodeMix')
        hm.data_type = 'RGBA'
        hm.blend_type = 'MULTIPLY'
        sk(hm.inputs, 'Factor_Float').default_value = 1.0
        L.new(col, sk(hm.inputs, 'A_Color'))
        L.new(hr.outputs['Result'], sk(hm.inputs, 'B_Color'))
        col = sk(hm.outputs, 'Result_Color')
    sh = N.new('ShaderNodeMapRange')
    sh.inputs['To Min'].default_value, sh.inputs['To Max'].default_value = 0.35, 1.06
    L.new(ht.outputs['Color'], sh.inputs['Value'])
    mul = N.new('ShaderNodeMix')
    mul.data_type = 'RGBA'
    mul.blend_type = 'MULTIPLY'
    sk(mul.inputs, 'Factor_Float').default_value = 1.0
    L.new(col, sk(mul.inputs, 'A_Color'))
    L.new(sh.outputs['Result'], sk(mul.inputs, 'B_Color'))
    L.new(sk(mul.outputs, 'Result_Color'), b.inputs['Base Color'])
    bp = N.new('ShaderNodeBump')
    bp.inputs['Strength'].default_value = bump
    bp.inputs['Distance'].default_value = stitch * 0.5
    L.new(ht.outputs['Color'], bp.inputs['Height'])
    L.new(bp.outputs['Normal'], b.inputs['Normal'])
    return m


# ------------------------------------------------------------------------------------------------ geometry helpers
def link(ob):
    sc.collection.objects.link(ob)
    return ob


def mesh_obj(name, bm, mats=(), smooth=True):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = smooth
    ob = link(bpy.data.objects.new(name, me))
    for m in mats:
        ob.data.materials.append(m)
    return ob


def rbox(bm, cx, cy, cz, sx, sy, sz, bevel=0.0, seg=2, mat=0):
    res = bmesh.ops.create_cube(bm, size=1.0)
    vs = res['verts']
    for v in vs:
        v.co = Vector((cx + v.co.x * sx, cy + v.co.y * sy, cz + v.co.z * sz))
    faces = {f for v in vs for f in v.link_faces}
    for f in faces:
        f.material_index = mat
    if bevel:
        edges = list({e for v in vs for e in v.link_edges})
        res = bmesh.ops.bevel(bm, geom=edges, offset=bevel, segments=seg, profile=0.5, affect='EDGES')
        for f in res.get('faces', []):
            f.material_index = mat


def cyl(bm, cx, cy, cz, r, h, seg=20, mat=0, axis='z'):
    res = bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=h)
    for v in res['verts']:
        if axis == 'y':                                   # a disc facing the camera (-y)
            v.co = Vector((v.co.x, v.co.z, v.co.y))
        v.co += Vector((cx, cy, cz))
        for f in v.link_faces:
            f.material_index = mat


def curve_obj(name, pts, depth, mat, res=4):
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = depth
    cu.bevel_resolution = res
    cu.use_fill_caps = True
    sp = cu.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    flat = np.ones((len(pts), 4), np.float32)
    flat[:, :3] = pts
    sp.points.foreach_set('co', flat.ravel())
    ob = link(bpy.data.objects.new(name, cu))
    cu.materials.append(mat)
    return ob


# ================================================================================================ ground
grass = knit_mat('Knitted meadow', ['#6E9F3D', '#86B24A', '#5C8C3A', '#9DBF5A', '#7AA845'], stitch=0.07, bump=0.8,
                 random_by_object=False, heather=0.12)
bm = bmesh.new()
bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=30)
ground = mesh_obj('Meadow', bm, [grass], smooth=False)
ground.location = (0, 8, 0)
dirt = felt('Felt dirt', '#9A6B43', 40.0)
bm = bmesh.new()
rbox(bm, -1.4, -0.9, 0.006, 6.6, 2.2, 0.012, 0.0)
mesh_obj('Dirt strip', bm, [dirt], smooth=False)

# ================================================================================================ the hay-bale wall
BW, BD, BH = 1.0, 0.62, 0.5                     # bale width (x), depth (y), height (z)
PITCH = 0.512                                  # row pitch: the bounding box (twine included) plus 2 mm, so nothing starts interpenetrating
straw = knit_mat('Knitted straw', ['#E9C25A', '#D9A743', '#F2D47E', '#CB9136', '#E4B44E', '#F0C866'], stitch=0.045, bump=1.0,
                 heather=0.10)
twine = felt('Twine', '#B5322E', 120.0)
bales = []
ROWS = 10
for r in range(ROWS):
    xs = [-3.0, -2.0, -1.0, 0.0]                      # straight columns (a staggered row would overhang the right end)
    if r >= 8:
        xs = xs[1:]
    for c, x0 in enumerate(xs):
        jx, jy = rng.uniform(-0.03, 0.03), rng.uniform(-0.03, 0.03)
        bm = bmesh.new()
        rbox(bm, 0, 0, 0, BW * 0.985, BD, BH * 0.985, bevel=0.07, seg=3, mat=0)
        hz, hy = BH * 0.985 / 2, BD / 2
        for tx in (-0.26, 0.26):                         # two twine loops around the short axis, standing 7 mm proud
            for (cy, cz, sy, sz) in ((0, hz - 0.004, 2 * hy + 0.014, 0.022), (0, -hz + 0.004, 2 * hy + 0.014, 0.022),
                                     (hy - 0.004, 0, 0.022, 2 * hz + 0.014), (-hy + 0.004, 0, 0.022, 2 * hz + 0.014)):
                rbox(bm, tx, cy, cz, 0.03, sy, sz, mat=1)
        ob = mesh_obj(f'Bale {r}-{c}', bm, [straw, twine])
        ob.location = (x0 + jx, 0.0 + jy, PITCH / 2 + r * PITCH)
        ob.rotation_euler = (0, 0, rng.uniform(-0.03, 0.03))
        bales.append(ob)

# ================================================================================================ fence and radio
post_m = knit_mat('Knitted post', ['#7A5132', '#8B5E3A', '#6B4429'], stitch=0.04, bump=0.9)
wire_m = felt('Yarn wire', '#C9CCD2', 200.0)
POSTS = [(1.05, -0.95), (3.1, 0.4), (5.1, 1.8), (7.1, 3.2)]
for i, (px, py) in enumerate(POSTS):
    bm = bmesh.new()
    cyl(bm, 0, 0, 0.62, 0.085, 1.24, seg=18)
    po = mesh_obj(f'Post {i}', bm, [post_m])
    po.location = (px, py, 0)
    po.rotation_euler = (rng.uniform(-0.03, 0.03), rng.uniform(-0.04, 0.04), 0)
for zz in (0.62, 1.02):
    pts = []
    for (ax, ay), (bx, by) in zip(POSTS[:-1], POSTS[1:]):
        for k in range(12):
            u = k / 12
            pts.append((ax + (bx - ax) * u, ay + (by - ay) * u - 0.09, zz - 0.06 * math.sin(math.pi * u)))
    pts.append((POSTS[-1][0], POSTS[-1][1] - 0.09, zz))
    curve_obj(f'Wire {zz}', pts, 0.012, wire_m)

radio_body = knit_mat('Knitted radio', ['#D23A33'], stitch=0.025, bump=0.8)
grille = felt('Radio grille', '#F3E3C4', 160.0)
knob_m = felt('Radio knob', '#2E2A2B', 80.0)
ant_m = felt('Antenna', '#D9DCE2', 200.0)
bm = bmesh.new()
rbox(bm, 0, 0, 0, 0.36, 0.14, 0.24, bevel=0.035, seg=3, mat=0)
cyl(bm, -0.06, -0.072, 0.0, 0.075, 0.012, seg=24, mat=1, axis='y')
for kx in (0.09, 0.135):
    cyl(bm, kx, -0.078, 0.03, 0.022, 0.02, seg=12, mat=2, axis='y')
cyl(bm, 0.0, 0.0, 0.135, 0.12, 0.03, seg=4, mat=2)                # carry handle block on top
radio = mesh_obj('Radio', bm, [radio_body, grille, knob_m, ant_m])
ant = curve_obj('Antenna', [(0.1, 0, 0.12), (0.2, 0.01, 0.42)], 0.007, ant_m)
ant.parent = radio
radio.location = (POSTS[0][0], POSTS[0][1], 1.24 + 0.12)

# ================================================================================================ foreground felt flowers and tufts
petal_cols = ['#F5F1E6', '#F7C548', '#E86A92', '#B58BE0', '#F29E4C']
fl_m = [felt(f'Petal {i}', h, 90.0) for i, h in enumerate(petal_cols)]
ctr = felt('Flower centre', '#F2B33D', 90.0)
tuft_m = knit_mat('Tuft', ['#5E8E35', '#7FB044', '#4E7C2C'], stitch=0.02, bump=0.5)
for i in range(70):
    x = rng.uniform(-3.8, 5.0)
    y = rng.uniform(-6.0, 2.5)
    if -3.6 < x < 1.2 and -1.4 < y < 0.6:
        continue
    bm = bmesh.new()
    for k in range(5):
        a = 2 * math.pi * k / 5
        rbox(bm, 0.05 * math.cos(a), 0.05 * math.sin(a), 0, 0.07, 0.04, 0.012, bevel=0.01, seg=1, mat=0)
    cyl(bm, 0, 0, 0.008, 0.025, 0.02, seg=10, mat=1)
    f = mesh_obj(f'Flower {i}', bm, [fl_m[i % len(fl_m)], ctr])
    f.location = (x, y, rng.uniform(0.08, 0.2))
    f.rotation_euler = (rng.uniform(-0.6, -0.2), rng.uniform(-0.3, 0.3), rng.uniform(0, 6.28))
    stem = curve_obj(f'Stem {i}', [(x, y, 0), (x + 0.01, y - 0.02, f.location.z)], 0.006, tuft_m)
for i in range(90):
    x = rng.uniform(-4.5, 6.0)
    y = rng.uniform(-6.5, 3.0)
    if -3.6 < x < 1.2 and -1.4 < y < 0.6:
        continue
    for k in range(5):
        a = rng.uniform(0, 6.28)
        hgt = rng.uniform(0.12, 0.3)
        curve_obj(f'Tuft {i}-{k}', [(x, y, 0), (x + 0.04 * math.cos(a), y + 0.04 * math.sin(a), hgt * 0.6),
                                    (x + 0.09 * math.cos(a), y + 0.09 * math.sin(a), hgt)], 0.012, tuft_m, res=2)

# ================================================================================================ backdrop
if BACKDROP and Path(BACKDROP).exists():
    bd_m = bpy.data.materials.new('Backdrop')
    bd_m.use_nodes = True
    nt = bd_m.node_tree
    N, L = nt.nodes, nt.links
    for n in list(N):
        if n.type != 'OUTPUT_MATERIAL':
            N.remove(n)
    tx = N.new('ShaderNodeTexImage')
    tx.image = bpy.data.images.load(BACKDROP)
    tx.extension = 'MIRROR'                                 # above the image its knitted sky continues, mirrored
    em = N.new('ShaderNodeEmission')
    em.inputs['Strength'].default_value = 0.9
    L.new(tx.outputs['Color'], em.inputs['Color'])
    tr = N.new('ShaderNodeBsdfTransparent')
    uvn = N.new('ShaderNodeTexCoord')
    sepv = N.new('ShaderNodeSeparateXYZ')
    L.new(uvn.outputs['UV'], sepv.inputs[0])
    fade = N.new('ShaderNodeMapRange')                      # opaque up to 80 % of the height, gone at the top edge
    fade.inputs['From Min'].default_value, fade.inputs['From Max'].default_value = TALL - 0.3, TALL
    fade.inputs['To Min'].default_value, fade.inputs['To Max'].default_value = 0.0, 1.0
    L.new(sepv.outputs['Y'], fade.inputs['Value'])
    mx = N.new('ShaderNodeMixShader')
    L.new(fade.outputs['Result'], mx.inputs['Fac'])
    L.new(em.outputs['Emission'], mx.inputs[1])
    L.new(tr.outputs['BSDF'], mx.inputs[2])
    L.new(mx.outputs['Shader'], N['Material Output'].inputs['Surface'])
    tryset(bd_m, surface_render_method='BLENDED', blend_method='BLEND')
    iw, ih = tx.image.size
    BW_, BH_ = 64.0, 64.0 * ih / iw
    bm = bmesh.new()
    seg = 24
    uvl = bm.loops.layers.uv.new('UVMap')
    R = 32.0
    vs = []
    for j in range(2):
        row = []
        for i in range(seg + 1):
            a = -1.15 + 2.3 * i / seg
            row.append(bm.verts.new((R * math.sin(a), R * math.cos(a) - 8.0, -9.5 + j * BH_ * TALL)))
        vs.append(row)
    for i in range(seg):
        f = bm.faces.new([vs[0][i], vs[0][i + 1], vs[1][i + 1], vs[1][i]])
        for lp, (uu, vv) in zip(f.loops, ((i / seg, 0), ((i + 1) / seg, 0), ((i + 1) / seg, TALL), (i / seg, TALL))):
            lp[uvl].uv = (uu, vv)
    mesh_obj('Backdrop', bm, [bd_m], smooth=True)

# ================================================================================================ lights
def light(name, kind, loc, target, power, hexcol, size=1.0):
    li = bpy.data.lights.new(name, kind)
    li.energy = power
    li.color = srgb(hexcol)
    if kind == 'SUN':
        li.angle = math.radians(4)
    else:
        li.size = size
    ob = link(bpy.data.objects.new(name, li))
    ob.location = loc
    ob.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    return ob


light('Sun', 'SUN', (14, -6, 9), (0, 0, 0), 3.4, '#FFD49C')
light('Sky fill', 'AREA', (-6, -12, 7), (0, 0, 1), 1500, '#CFE0FF', size=10)
light('Bounce', 'AREA', (2, -8, 0.4), (0, 0, 1.2), 300, '#FFE2B8', size=6)

# ================================================================================================ physics
bpy.ops.rigidbody.world_add()
rw = sc.rigidbody_world
tryset(rw, substeps_per_frame=12, solver_iterations=30)
rw.point_cache.frame_start, rw.point_cache.frame_end = 0, NF


def rb(ob, kind='ACTIVE', mass=1.0, shape='BOX', fric=0.85, bounce=0.05):
    for o in sc.objects:
        o.select_set(False)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.rigidbody.object_add(type=kind)
    r = ob.rigid_body
    r.collision_shape = shape
    r.mass = mass
    r.friction = fric
    r.restitution = bounce
    r.linear_damping, r.angular_damping = 0.08, 0.12
    return r


rb(ground, 'PASSIVE', shape='BOX', fric=0.9)
for b in bales:
    r = rb(b, 'ACTIVE', mass=2.0)
    r.use_deactivation = True
    r.use_start_deactivated = True
    r.collision_margin = 0.002
# the invisible board behind the wall: pushes rows 4-9 forward (-y) and a little to the right (+x)
sc.gravity = (0, 0, -9.81 * GRAV)        # a miniature falls faster than a life-size wall: the reference's snap
bm = bmesh.new()
rbox(bm, 0, 0, 0, 3.4, 0.2, BOARD_H)
board = mesh_obj('Push board', bm)
board.hide_render = True
r = rb(board, 'PASSIVE', shape='BOX', fric=0.6)
r.kinematic = True
bz = 5.2 - BOARD_H / 2
board.location = (-1.3, BD / 2 + 0.2, bz)                      # front face 0.11 behind the deepest bale back
board.keyframe_insert('location', frame=0)
board.keyframe_insert('location', frame=PUSH)
board.location = (-0.7, -0.6, bz)
board.keyframe_insert('location', frame=PUSH + 12)
board.location = (0.0, -1.8, bz - 0.3)
board.keyframe_insert('location', frame=PUSH + 24)
for fc in board.animation_data.action.fcurves if hasattr(board.animation_data.action, 'fcurves') else []:
    for kp in fc.keyframe_points:
        kp.interpolation = 'BEZIER'

# radio: tugged off the post (frames 18-26), falls and lands by the farmer's feet at frame 41, a small bounce; gone at 78
R0 = Vector(radio.location)
R1 = Vector((0.72, -1.3, 0.12))


def radio_at(f):
    if f <= 18:
        return R0, (0, 0, 0)
    if f <= 26:
        u = (f - 18) / 8
        return R0 + Vector((0.06 * u, -0.02 * u, 0.02 * math.sin(math.pi * u))), (0, -0.25 * u, 0)
    if f <= 41:
        u = (f - 26) / 15
        p = R0.lerp(R1, u)
        p.z = R0.z + (R1.z - R0.z) * u * u + 0.18 * math.sin(math.pi * u) * (1 - u)
        return p, (0.4 * u, -0.25 - 1.3 * u, 0.5 * u)
    if f <= 47:
        u = (f - 41) / 6
        return R1 + Vector((-0.04 * u, 0, 0.05 * math.sin(math.pi * u))), (0.4, -1.55 + 0.1 * u, 0.5)
    return R1 + Vector((-0.04, 0, 0)), (0.4, -1.45, 0.5)


for f in range(0, 80):
    p, rot = radio_at(f)
    radio.location = p
    radio.rotation_euler = (rot[0] * 0.2, rot[1] * 0.35, rot[2] * 0.3)
    radio.keyframe_insert('location', frame=f)
    radio.keyframe_insert('rotation_euler', frame=f)
for f, hide in ((77, False), (78, True)):
    radio.hide_render = hide
    radio.keyframe_insert('hide_render', frame=f)
    ant.hide_render = hide
    ant.keyframe_insert('hide_render', frame=f)

# ================================================================================================ cameras
def make_cam(name, lens):
    cd = bpy.data.cameras.new(name)
    cd.lens = lens
    cd.sensor_fit = 'HORIZONTAL'
    cd.sensor_width = 36
    cd.dof.use_dof = True
    cd.dof.aperture_fstop = 2.0
    return link(bpy.data.objects.new(name, cd)), cd


def ease_io(x):
    x = min(1, max(0, x))
    return 3 * x * x - 2 * x * x * x


C1 = [float(x) for x in opt('--cam1', '1.25,-3.1,0.95,0.42,0.0,1.5,30').split(',')]
C2 = [float(x) for x in opt('--cam2', '2.7,-5.4,0.5,-0.9,0.0,2.3,28').split(',')]
cam1, cd1 = make_cam('Cam close', C1[6])
cam2, cd2 = make_cam('Cam wide', C2[6])
SEAT = Vector((0.0, -0.6, 0.0))              # where the farmer sits (front of the wall foot, under its right end)


def cam1_state(f):
    u = ease_io(f / (CUT - 1))
    loc = Vector((C1[0], C1[1], C1[2])).lerp(Vector((C1[0] - 0.05, C1[1] + 0.3, C1[2] - 0.03)), u)
    tgt = Vector((C1[3], C1[4], C1[5]))
    return loc, tgt


def cam2_state(f):
    u = ease_io((f - CUT) / (NF - 1 - CUT))
    loc = Vector((C2[0], C2[1], C2[2])).lerp(Vector((C2[0] + 0.1, C2[1] - 0.25, C2[2] + 0.02)), u)
    tgt = Vector((C2[3], C2[4], C2[5]))
    return loc, tgt


def look(loc, tgt):
    return (tgt - loc).to_track_quat('-Z', 'Y').to_euler()


for f in range(NF):
    for cam, cd, st in ((cam1, cd1, cam1_state), (cam2, cd2, cam2_state)):
        loc, tgt = st(f)
        cam.location = loc
        cam.rotation_euler = look(loc, tgt)
        cam.keyframe_insert('location', frame=f)
        cam.keyframe_insert('rotation_euler', frame=f)
    cd1.dof.focus_distance = (cam1_state(f)[0] - (SEAT + Vector((0, 0, 0.6)))).length
    cd1.dof.keyframe_insert('focus_distance', frame=f)
cd2.dof.focus_distance = (cam2_state(CUT)[0] - Vector((-0.6, -0.3, 1.5))).length
cd1.dof.aperture_fstop = 2.4
cd2.dof.aperture_fstop = 3.2
m1 = sc.timeline_markers.new('shot1', frame=0)
m1.camera = cam1
m2 = sc.timeline_markers.new('shot2', frame=CUT)
m2.camera = cam2
sc.camera = cam1


# ================================================================================================ screen anchors for Remotion
def project(cam, cd, p):
    m = cam.matrix_world.inverted()
    q = m @ Vector(p)
    k = 1080 * cd.lens / cd.sensor_width
    return 540 + k * q.x / -q.z, 960 - k * q.y / -q.z, k / -q.z


geom = {'fps': FPS, 'frames': NF, 'cut': CUT, 'push': PUSH, 'seat': [], 'radio': [], 'post': [], 'exit': [], 'landing': None}
landing = None
top_names = [b.name for b in bales if b.location.z > 2.5]
for f in range(NF):
    sc.frame_set(f)
    cam, cd = (cam1, cd1) if f < CUT else (cam2, cd2)
    x, y, s = project(cam, cd, SEAT)
    geom['seat'].append([round(x, 1), round(y, 1), round(s, 2)])        # px, px, px per unit at the seat
    rx, ry, rs = project(cam, cd, radio.matrix_world.translation)
    geom['radio'].append([round(rx, 1), round(ry, 1), round(rs, 2)])
    px_, py_, ps_ = project(cam, cd, Vector((POSTS[0][0], POSTS[0][1], 1.24)))
    geom['post'].append([round(px_, 1), round(py_, 1)])
    ex, ey, es = project(cam, cd, Vector((1.0, -1.6, 0.0)))
    geom['exit'].append([round(ex, 1), round(ey, 1), round(es, 2)])
    dg = bpy.context.evaluated_depsgraph_get()
    zs = [sc.objects[n].evaluated_get(dg).matrix_world.translation.z for n in top_names]
    if f % 10 == 0 or f in (CUT, PUSH) or PUSH < f < PUSH + 45 and f % 3 == 0:
        print(f'  f{f} top bales min z {min(zs):.2f} mean z {sum(zs) / len(zs):.2f} max z {max(zs):.2f} board y {board.matrix_world.translation.y:.2f}', flush=True)
    if f >= PUSH and landing is None and sum(zs) / len(zs) < 1.2:
        landing = f
geom['landing'] = landing
(OUT / 'geom.json').write_text(json.dumps(geom, separators=(',', ':')))
print('LANDING frame', landing, f'({landing / FPS if landing else 0:.2f} s)', 'seat f0', geom['seat'][0], 'f106', geom['seat'][106],
      'radio f0', geom['radio'][0], 'f41', geom['radio'][41], flush=True)
if MODE == 'sim':
    sys.exit(0)
if MODE == 'blend':
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'lutfknit.blend'))
    sys.exit(0)

# ================================================================================================ render (frames stepped in order, so the physics is continuous)
first = int(POS[0]) if MODE == 'anim' and POS else 0
last = int(POS[1]) if MODE == 'anim' and len(POS) > 1 else NF - 1
want = sorted(int(x) for x in POS[0].split(',')) if MODE == 'stills' and POS else ([0, 60, 140] if MODE == 'stills' else list(range(first, last + 1)))
dst_dir = OUT / ('stills' if MODE == 'stills' else 'frames')
dst_dir.mkdir(exist_ok=True)
t_all = time.time()
for f in range(0, max(want) + 1):
    sc.frame_set(f)
    if f not in want:
        continue
    sc.camera = cam1 if f < CUT else cam2
    dst = dst_dir / f'f{f:04d}.jpg'
    sc.render.filepath = str(dst)
    t0 = time.time()
    bpy.ops.render.render(write_still=True)
    print(f'FRAME {f} {time.time() - t0:.1f} s', flush=True)
print(f'DONE in {time.time() - t_all:.0f} s', flush=True)
