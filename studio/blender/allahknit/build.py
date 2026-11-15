"""ALLAH-KNIT 3D plate: the private knitted "Allah, Allah" heart reel for the owner's wife (@heal.ingthroughquran; never posted
from the business accounts). Reference Dfw7YNesQ1h (@madee.studio.pk), 10.0 s: a pink anatomical heart, its left half caked in
black dust, under a glowing «الله»; a drop of light falls on it, the black crumbles off in waves on the soundtrack's swells,
white doves and gold rings circle it, light rays fan out of the Name and the clean heart flashes. Rebuilt here as real 3D
knitwork, rendered headless with EEVEE on the reference clock (30 fps, 300 frames):

    studio/heavy.sh /Applications/Blender.app/Contents/MacOS/Blender -b -P studio/blender/allahknit/build.py -- <out> stills 0,90,180,240
    studio/heavy.sh /Applications/Blender.app/Contents/MacOS/Blender -b -P studio/blender/allahknit/build.py -- <out> anim [first] [last]

Options after the mode: --samples N (EEVEE TAA samples, default 16), --pct P (resolution percent, default 100), --nohair.

Scene (units ~ 10 cm; the camera looks along +y; z up; the heart sits at the origin):
  - a crocheted pink heart (metaball chambers + yarn-tube aorta, pulmonary trunk and vena cava, stockinette relief, pink fuzz)
    with couched red and violet yarn vessels that glow when the light lands (1.50 s) and at the flash (7.00 s);
  - its left side under a charcoal felt crust (a shader mask whose front recedes leftwards on the swells at 2.5, 3.7 and
    6.15 s) and ~380 tangled black wool clumps (random-walk yarn balls) that let go exactly when the front passes them, fall
    with gravity, tumble, land on the floor and shrink away; clean by 6.5 s;
  - 12 knitted white doves (felt beaks, flapping wings) on tilted orbits, four at the start and the rest spiralling in;
  - two twisted gold-yarn rings and gold beads circling the heart, gold yarn ripples spreading on the floor at each swell;
  - a dark teal knitted sweep (floor + backdrop) with soft pompom bokeh, a warm light from above (the Name) that grows from
    6.2 s, and a pink-gold flash of the heart at 7.0 s.
No Arabic is drawn in Blender: «ٱللَّهُ», the drop of light, the rays and her handle are Remotion's, over this plate; geom.json
gives their screen anchors (the heart's top and centre in 1080x1920 pixels).
"""
import bpy
import bmesh
import json
import math
import sys
from pathlib import Path

import numpy as np
from mathutils import Euler, Matrix, Vector
from mathutils.bvhtree import BVHTree
from bpy_extras.object_utils import world_to_camera_view

argv = sys.argv[sys.argv.index('--') + 1:]
OUT = Path(argv[0]).resolve()
MODE = argv[1] if len(argv) > 1 else 'stills'
POS = [a for a in argv[2:] if not a.startswith('--')]
opt = lambda k, d=None: argv[argv.index(k) + 1] if k in argv else d
POS = [a for a in POS if a not in (opt('--samples'), opt('--pct'), opt('--exposure'))]
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'tex').mkdir(exist_ok=True)
SAMPLES, PCT = int(opt('--samples', 16)), int(opt('--pct', 100))
NOHAIR = '--nohair' in argv
FPS, NF = 30, 300
SEC = lambda s: int(round(s * FPS))
BEATS = [1.25, 2.50, 3.70, 6.15, 8.60]          # the soundtrack's swells (RMS onsets of the reference audio)
T_DROP, T_RAYS, T_FLASH = 1.50, 6.20, 7.00       # the drop of light lands, the rays open, the clean heart flashes
rng = np.random.default_rng(1447)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.name = 'ALLAH_KNIT'
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
try:
    sc.render.motion_blur_shutter = 0.5
except Exception:
    pass
ee = sc.eevee


def tryset(o, **kw):
    for k, v in kw.items():
        try:
            setattr(o, k, v)
        except Exception as e:  # noqa: BLE001 (API names move between Blender versions)
            print('  (skip', k, type(e).__name__, ')')


tryset(ee, taa_render_samples=SAMPLES, use_raytracing=True, ray_tracing_method='SCREEN', use_shadows=True, shadow_ray_count=2,
       shadow_step_count=8, use_fast_gi=True, fast_gi_method='GLOBAL_ILLUMINATION', bokeh_max_size=300, motion_blur_steps=1,
       use_volumetric_shadows=False, volumetric_tile_size='16', volumetric_samples=32, volumetric_start=0.5, volumetric_end=160.0,
       use_bloom=False)
try:
    ee.ray_tracing_options.resolution_scale = '2'
    ee.fast_gi_resolution = '2'
except Exception:
    pass
tryset(sc.render, hair_type='STRAND', hair_subdiv=0)
tryset(ee, shadow_pool_size='512')
tryset(sc.view_settings, view_transform='AgX')
tryset(sc.view_settings, look='AgX - Punchy')
sc.view_settings.exposure = float(opt('--exposure', 0.0))
print('VIEW', sc.view_settings.view_transform, sc.view_settings.look)

world = bpy.data.worlds.new('World')
sc.world = world
world.use_nodes = True
WBG = world.node_tree.nodes['Background']


def srgb(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


def rgba(h):
    return (*srgb(h), 1.0)


def hexrgb(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], np.float32)


# ------------------------------------------------------------------------------------------------ animation helpers
def key_series(idb, path, index, frames, values, interp='LINEAR'):
    """Write one fcurve on data-block idb in one go (Blender 4.4+ slotted actions, with a fallback)."""
    ad = idb.animation_data or idb.animation_data_create()
    if ad.action is None:
        ad.action = bpy.data.actions.new(f'{idb.name}_act')
    act = ad.action
    try:
        fc = act.fcurve_ensure_for_datablock(idb, path, index=index)
    except AttributeError:
        fc = act.fcurves.find(path, index=index) or act.fcurves.new(path, index=index)
    kp = fc.keyframe_points
    n0 = len(kp)
    kp.add(len(frames))
    co = np.empty(2 * len(frames), np.float32)
    co[0::2], co[1::2] = frames, values
    if n0 == 0:
        kp.foreach_set('co', co)
        kp.foreach_set('interpolation', [{'CONSTANT': 0, 'LINEAR': 1, 'BEZIER': 2}[interp]] * len(frames))
    else:
        for i, (f, v) in enumerate(zip(frames, values)):
            kp[n0 + i].co = (f, v)
            kp[n0 + i].interpolation = interp
    fc.update()
    return fc


def key_fn(idb, path, n, fn, frames=None, interp='LINEAR'):
    """Key path[0..n-1] (or the scalar path when n == 0) with fn(frame) on the given frames, dropping redundant holds."""
    frames = list(range(NF)) if frames is None else list(frames)
    vals = np.array([fn(f) for f in frames], np.float64).reshape(len(frames), -1)
    keep = [0] + [i for i in range(1, len(frames) - 1)
                  if not (np.allclose(vals[i], vals[i - 1], atol=1e-6) and np.allclose(vals[i], vals[i + 1], atol=1e-6))] + [len(frames) - 1]
    keep = sorted(set(keep))
    fr = [frames[i] for i in keep]
    if n == 0:
        key_series(idb, path, 0, fr, vals[keep, 0], interp)
        return
    for j in range(vals.shape[1]):
        key_series(idb, path, j, fr, vals[keep, j], interp)


def key_node(node, inp, fn, frames=None):
    key_fn(node.id_data, f'nodes["{node.name}"].inputs[{inp}].default_value', 0, fn, frames)


def visible_keys(ob, sp):
    """hide_render / hide_viewport keyed CONSTANT: shown only inside the frame spans [a, b)."""
    fr, val = [0], [1.0]
    for a_, b_ in sorted(sp):
        fr += [max(0, a_), b_]
        val += [0.0, 1.0]
    pairs = {}
    for f_, v_ in zip(fr, val):
        pairs[f_] = v_                      # a later key on the same frame wins (a span starting at 0)
    fr, val = zip(*sorted(pairs.items()))
    for path in ('hide_render', 'hide_viewport'):
        key_series(ob, path, 0, list(fr), list(val), interp='CONSTANT')


def c01(x):
    return min(1.0, max(0.0, x))


def ease_out(x):
    return 1 - (1 - c01(x)) ** 3


def ease_in(x):
    return c01(x) ** 3


def ease_io(x):
    u = c01(x)
    return 4 * u ** 3 if u < 0.5 else 1 - (-2 * u + 2) ** 3 / 2


def smooth(x):
    u = c01(x)
    return u * u * (3 - 2 * u)


def back_out(x, s=1.9):
    u = c01(x) - 1
    return 1 + (s + 1) * u ** 3 + s * u ** 2


def pulse(x, w):
    return 0.0 if x < 0 or x > w else math.sin(math.pi * x / w) ** 2


def lerp(a, b, u):
    return a + (b - a) * u


def vlerp(a, b, u):
    return Vector(a).lerp(Vector(b), u)


def sk(sockets, ident):
    for x in sockets:
        if x.identifier == ident:
            return x
    raise KeyError(ident)


# ------------------------------------------------------------------------------------------------ procedural stitch height maps
def knit_tile(n=4, px=160, seed=3, legw=0.25):
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


def purl_bumps(n=4, px=160, seed=5):
    """purl side: horizontal rounded bars, two per stitch row, offset like reverse stockinette"""
    S = n * px
    v, u = np.mgrid[0:S, 0:S].astype(np.float32) / px
    r = np.random.default_rng(seed)
    H = np.zeros((S, S), np.float32)
    for off in (0.0, 0.5):
        y = (v + off) % 1.0
        x = (u + 0.5 * (np.floor(v + off) % 2) + off) % 1.0
        e = ((y - 0.5) / 0.28) ** 2 + ((x - 0.5) / 0.55) ** 2
        H = np.maximum(H, np.sqrt(np.clip(1 - e, 0, 1)) * 0.85)
    H += 0.04 * r.normal(0, 1, (S, S)).astype(np.float32)
    return np.clip(H, 0, 1)


def save_png(arr, path, color=False):
    a = np.asarray(arr, np.float32)
    if a.ndim == 2:
        a = np.repeat(a[..., None], 3, 2)
    h, w = a.shape[:2]
    img = bpy.data.images.new(Path(path).stem, w, h, alpha=False, float_buffer=False)
    if color:
        img.colorspace_settings.name = 'sRGB'
    px = np.ones((h, w, 4), np.float32)
    px[..., :3] = a[::-1]
    img.pixels.foreach_set(px.ravel())
    img.filepath_raw = str(path)
    img.file_format = 'PNG'
    img.save()
    bpy.data.images.remove(img)


KT = knit_tile()
save_png(KT, OUT / 'tex' / 'knit_tile.png')
PB = purl_bumps()
cols4 = (np.arange(KT.shape[1]) // 160) % 4
RIB = np.where(np.isin(cols4, (0, 1))[None, :], KT, 0.30 + 0.35 * PB)      # k2 p2 ribbing: knit columns stand, purl columns sink
RIB = RIB[:, :640]
save_png(RIB, OUT / 'tex' / 'rib_tile.png')
SEED = np.where(((np.arange(640)[:, None] // 160) + (np.arange(640)[None, :] // 160)) % 2 == 0, KT, 0.25 + 0.55 * PB)   # seed stitch
save_png(SEED, OUT / 'tex' / 'seed_tile.png')
TILES = {k: bpy.data.images.load(str(OUT / 'tex' / f'{k}_tile.png')) for k in ('knit', 'rib', 'seed')}
for im in TILES.values():
    im.colorspace_settings.name = 'Non-Color'


def color_png(name, C):
    """C: (rows, cols, 3) sRGB 0..1, row 0 = top = the highest V; 1 px = 1 stitch"""
    p = OUT / 'tex' / f'{name}.png'
    save_png(C, p, color=True)
    im = bpy.data.images.load(str(p), check_existing=True)
    im.colorspace_settings.name = 'sRGB'
    return im


# ------------------------------------------------------------------------------------------------ materials
def principled(name, color=(0.8, 0.8, 0.8, 1), rough=0.85, sheen=0.8, sss=0.0, coat=0.0, metal=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = color if len(color) == 4 else (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    for k, v in (('Sheen Weight', sheen), ('Sheen Roughness', 0.4), ('Subsurface Weight', sss), ('Coat Weight', coat)):
        if k in b.inputs:
            b.inputs[k].default_value = v
    if 'Subsurface Radius' in b.inputs:
        b.inputs['Subsurface Radius'].default_value = (0.08, 0.05, 0.04)
    if 'Sheen Tint' in b.inputs:
        try:
            b.inputs['Sheen Tint'].default_value = (1, 1, 1, 1)
        except Exception:
            pass
    return m, nt, b


def stitch_coords(nt, coords, spm):
    """a vector in stitch units: x = stitch column, y = stitch row"""
    N, L = nt.nodes, nt.links
    tc = N.new('ShaderNodeTexCoord')
    if coords == 'UV':
        src = tc.outputs['UV']
    else:
        sx = N.new('ShaderNodeSeparateXYZ')
        L.new(tc.outputs['Object'], sx.inputs['Vector'])
        cx = N.new('ShaderNodeCombineXYZ')
        a, b = {'XY': ('X', 'Y'), 'XZ': ('X', 'Z'), 'YZ': ('Y', 'Z'), 'ZX': ('Z', 'X')}[coords]
        L.new(sx.outputs[a], cx.inputs['X'])
        L.new(sx.outputs[b], cx.inputs['Y'])
        src = cx.outputs['Vector']
    mp = N.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (spm[0], spm[1], 1)
    L.new(src, mp.inputs['Vector'])
    return mp.outputs['Vector']


def knit_mat(name, color='#FFFFFF', img=None, coords='UV', spm=(32, 32), tile='knit', bump=1.0, dist=None, rough=0.86, sheen=0.85,
             sss=0.04, emis=0.0, emis_col=None, dark=0.40, heather=0.07, foam=None, gloss=None):
    """Knitted cloth: the stitch tile as bump and as a crevice shade, one yarn colour per stitch from img (1 px = 1 stitch) or one
    colour; heathered. foam=(z0, z1, hex): above world z0..z1 the yarn turns to white boucle (sea crests)."""
    m, nt, b = principled(name, rgba(color), rough=rough, sheen=sheen, sss=sss)
    N, L = nt.nodes, nt.links
    st = stitch_coords(nt, coords, spm)
    tq = N.new('ShaderNodeVectorMath')
    tq.operation = 'SCALE'
    tq.inputs['Scale'].default_value = 0.25
    L.new(st, tq.inputs[0])
    ht = N.new('ShaderNodeTexImage')
    ht.image = TILES[tile]
    ht.interpolation = 'Cubic'
    L.new(tq.outputs[0], ht.inputs['Vector'])
    sh = N.new('ShaderNodeMapRange')
    sh.inputs['To Min'].default_value, sh.inputs['To Max'].default_value = dark, 1.05
    L.new(ht.outputs['Color'], sh.inputs['Value'])
    if img is not None:
        sc_ = N.new('ShaderNodeVectorMath')
        sc_.operation = 'DIVIDE'
        sc_.inputs[1].default_value = (img.size[0], img.size[1], 1)
        L.new(st, sc_.inputs[0])
        ct = N.new('ShaderNodeTexImage')
        ct.image = img
        ct.interpolation = 'Closest'
        L.new(sc_.outputs[0], ct.inputs['Vector'])
        col_out = ct.outputs['Color']
    else:
        rgbn = N.new('ShaderNodeRGB')
        rgbn.outputs[0].default_value = rgba(color)
        col_out = rgbn.outputs[0]
    if foam is not None:
        geo = N.new('ShaderNodeNewGeometry')
        sz = N.new('ShaderNodeSeparateXYZ')
        L.new(geo.outputs['Position'], sz.inputs['Vector'])
        fr = N.new('ShaderNodeMapRange')
        fr.inputs['From Min'].default_value, fr.inputs['From Max'].default_value = foam[0], foam[1]
        L.new(sz.outputs['Z'], fr.inputs['Value'])
        fm = N.new('ShaderNodeMix')
        fm.data_type = 'RGBA'
        L.new(fr.outputs['Result'], sk(fm.inputs, 'Factor_Float'))
        L.new(col_out, sk(fm.inputs, 'A_Color'))
        sk(fm.inputs, 'B_Color').default_value = rgba(foam[2])
        col_out = sk(fm.outputs, 'Result_Color')
    if heather:
        nz = N.new('ShaderNodeTexNoise')
        nz.inputs['Scale'].default_value = 3.0
        nz.inputs['Detail'].default_value = 4
        L.new(st, nz.inputs['Vector'])
        hm = N.new('ShaderNodeMapRange')
        hm.inputs['To Min'].default_value, hm.inputs['To Max'].default_value = 1 - heather, 1 + heather
        L.new(nz.outputs['Fac'], hm.inputs['Value'])
        mh = N.new('ShaderNodeMix')
        mh.data_type = 'RGBA'
        mh.blend_type = 'MULTIPLY'
        sk(mh.inputs, 'Factor_Float').default_value = 1.0
        L.new(col_out, sk(mh.inputs, 'A_Color'))
        L.new(hm.outputs['Result'], sk(mh.inputs, 'B_Color'))
        col_out = sk(mh.outputs, 'Result_Color')
    mul = N.new('ShaderNodeMix')
    mul.data_type = 'RGBA'
    mul.blend_type = 'MULTIPLY'
    sk(mul.inputs, 'Factor_Float').default_value = 1.0
    L.new(col_out, sk(mul.inputs, 'A_Color'))
    L.new(sh.outputs['Result'], sk(mul.inputs, 'B_Color'))
    L.new(sk(mul.outputs, 'Result_Color'), b.inputs['Base Color'])
    fz = N.new('ShaderNodeTexNoise')                        # fibre fuzz on top of the stitch relief
    fz.inputs['Scale'].default_value = 40.0
    fz.inputs['Detail'].default_value = 8
    L.new(st, fz.inputs['Vector'])
    hsum = N.new('ShaderNodeMath')
    hsum.operation = 'MULTIPLY_ADD'
    hsum.inputs[1].default_value = 0.08
    L.new(fz.outputs['Fac'], hsum.inputs[0])
    L.new(ht.outputs['Color'], hsum.inputs[2])
    bp = N.new('ShaderNodeBump')
    bp.inputs['Strength'].default_value = bump
    bp.inputs['Distance'].default_value = dist if dist is not None else 0.04
    L.new(hsum.outputs[0], bp.inputs['Height'])
    L.new(bp.outputs['Normal'], b.inputs['Normal'])
    if emis:
        b.inputs['Emission Strength'].default_value = emis
        if emis_col is not None:
            b.inputs['Emission Color'].default_value = rgba(emis_col)
        else:
            L.new(sk(mul.outputs, 'Result_Color'), b.inputs['Emission Color'])
    if gloss is not None:
        b.inputs['Roughness'].default_value = gloss
    return m


def felt(name, hexcol, scale=60.0, rough=0.9, sheen=1.0, emis=0.0):
    m, nt, b = principled(name, rgba(hexcol), rough=rough, sheen=sheen, sss=0.06)
    N, L = nt.nodes, nt.links
    tc = N.new('ShaderNodeTexCoord')
    nz = N.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = scale
    nz.inputs['Detail'].default_value = 10
    nz.inputs['Roughness'].default_value = 0.7
    bump = N.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.4
    bump.inputs['Distance'].default_value = 0.01
    L.new(tc.outputs['Object'], nz.inputs['Vector'])
    L.new(nz.outputs['Fac'], bump.inputs['Height'])
    L.new(bump.outputs['Normal'], b.inputs['Normal'])
    if emis:
        b.inputs['Emission Color'].default_value = rgba(hexcol)
        b.inputs['Emission Strength'].default_value = emis
    return m


def glossy(name, hexcol, rough=0.12):
    m, nt, b = principled(name, rgba(hexcol), rough=rough, sheen=0.0, coat=0.6)
    return m


def emissive(name, hexcol, strength):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = rgba(hexcol)
    em.inputs['Strength'].default_value = strength
    nt.links.new(em.outputs[0], nt.nodes['Material Output'].inputs['Surface'])
    return m, em


# ------------------------------------------------------------------------------------------------ geometry helpers
COLL = {}


def coll(name):
    if name not in COLL:
        c = bpy.data.collections.new(name)
        sc.collection.children.link(c)
        COLL[name] = c
    return COLL[name]


CUR = ['Misc']


def link(ob):
    coll(CUR[0]).objects.link(ob)
    return ob


def mesh_obj(name, bm, mats=None, smooth=True):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    ob = link(bpy.data.objects.new(name, me))
    for m in (mats or []):
        ob.data.materials.append(m)
    return ob


def sphere(name, r, mat, seg=32, rings=16, uv=True):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r, calc_uvs=uv)
    return mesh_obj(name, bm, [mat] if mat else None)


def cylinder(name, r1, r2, depth, mat, seg=24, caps=True):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=caps, segments=seg, radius1=r1, radius2=r2, depth=depth, calc_uvs=True)
    return mesh_obj(name, bm, [mat] if mat else None)


def curve_obj(name, splines, depth, mat, res=3, closed=False, caps=True, bevel_res=3):
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = depth
    cu.bevel_resolution = bevel_res
    cu.use_fill_caps = caps
    cu.resolution_u = res
    for pts in splines:
        if np.iscomplexobj(np.asarray(pts)):
            print('COMPLEX spline in', name)
            pts = np.real(np.asarray(pts))
        sp = cu.splines.new('POLY')
        sp.points.add(len(pts) - 1)
        flat = np.ones((len(pts), 4), np.float32)
        flat[:, :3] = pts
        sp.points.foreach_set('co', flat.ravel())
        sp.use_cyclic_u = closed
    ob = link(bpy.data.objects.new(name, cu))
    if mat:
        cu.materials.append(mat)
    return ob


def empty(name, loc=(0, 0, 0)):
    ob = link(bpy.data.objects.new(name, None))
    ob.location = loc
    return ob


def grid(name, sx, sy, nx, ny, mat=None):
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=nx, y_segments=ny, size=0.5, calc_uvs=True)
    for v in bm.verts:
        v.co.x *= sx
        v.co.y *= sy
    return mesh_obj(name, bm, [mat] if mat else None)


def loft(name, rings, mats=None, cap0=True, cap1=True, mat_of_face=None, smooth=True):
    """rings: list of (N, 3) arrays (closed loops, same N). UVs: u along the rings (0..1), v around (0..1) with a wrap seam.
    mat_of_face(i, j, centre) -> material index, optional."""
    M, N = len(rings), len(rings[0])
    if any(np.iscomplexobj(np.asarray(r)) for r in rings):
        print('COMPLEX rings in', name)
        rings = [np.real(np.asarray(r)) for r in rings]
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new('UVMap')
    V = [[bm.verts.new(tuple(p)) for p in r] for r in rings]
    for i in range(M - 1):
        for j in range(N):
            j2 = (j + 1) % N
            f = bm.faces.new((V[i][j], V[i + 1][j], V[i + 1][j2], V[i][j2]))
            uvs = ((i / (M - 1), j / N), ((i + 1) / (M - 1), j / N), ((i + 1) / (M - 1), (j + 1) / N), (i / (M - 1), (j + 1) / N))
            for lp, uv in zip(f.loops, uvs):
                lp[uvl].uv = uv
            if mat_of_face:
                f.material_index = mat_of_face(i, j, f.calc_center_median())
    for cap, idx in ((cap0, 0), (cap1, M - 1)):
        if cap:
            ring = V[idx] if idx == M - 1 else V[idx][::-1]
            c = bm.verts.new(tuple(np.mean([v.co for v in ring], axis=0)))
            for j in range(N):
                f = bm.faces.new((ring[j], ring[(j + 1) % N], c))
                for lp in f.loops:
                    lp[uvl].uv = (idx / (M - 1), 0.5)
                if mat_of_face:
                    f.material_index = mat_of_face(idx, j, f.calc_center_median())
    bm.normal_update()
    ob = mesh_obj(name, bm, mats, smooth)
    return ob


def lathe(name, prof, mat, seg=32):
    """prof: list of (r, z) from bottom to top; a surface of revolution about Z with UVs (u = profile, v = around)"""
    rings = []
    for r, z in prof:
        a = np.linspace(0, 2 * np.pi, seg, endpoint=False)
        rings.append(np.c_[r * np.cos(a), r * np.sin(a), np.full(seg, z)])
    return loft(name, rings, [mat], cap0=prof[0][0] > 1e-4, cap1=prof[-1][0] > 1e-4)


def add_fuzz(ob, count, length, mat_index=0, children=6, rough=0.6, radius=0.003, seed=0):
    if NOHAIR:
        return None
    ob.modifiers.new('fuzz', 'PARTICLE_SYSTEM')
    ps = ob.particle_systems[-1]
    ps.seed = seed
    st = ps.settings
    st.type = 'HAIR'
    st.count = count
    st.hair_length = length
    st.use_advanced_hair = False
    st.emit_from = 'FACE'
    st.use_emit_random = True
    st.factor_random = 0.55 * length
    st.render_type = 'PATH'
    st.display_step = 2
    st.render_step = 3
    st.material = mat_index + 1
    st.child_type = 'INTERPOLATED'
    st.rendered_child_count = children
    st.roughness_1 = rough * length * 3
    st.roughness_1_size = 1.0
    st.roughness_2 = rough * length * 2
    st.roughness_endpoint = rough * length
    st.kink = 'CURL'
    st.kink_amplitude = 0.4 * length
    st.kink_frequency = 3.0
    tryset(st, root_radius=1.0, tip_radius=0.15, radius_scale=radius, shape=-0.2)
    return ps


def area(name, loc, target, size, power, hexcol, shape='DISK'):
    li = bpy.data.lights.new(name, 'AREA')
    li.shape = shape
    li.size = size
    li.energy = power
    li.color = srgb(hexcol)
    ob = link(bpy.data.objects.new(name, li))
    ob.location = loc
    d = Vector(target) - Vector(loc)
    ob.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    return ob


def sun(name, direction_to, strength, hexcol, angle=0.02):
    li = bpy.data.lights.new(name, 'SUN')
    li.energy = strength
    li.color = srgb(hexcol)
    li.angle = angle
    ob = link(bpy.data.objects.new(name, li))
    ob.rotation_euler = (-Vector(direction_to)).to_track_quat('Z', 'Y').to_euler()
    return ob


def point(name, loc, power, hexcol, radius=0.1):
    li = bpy.data.lights.new(name, 'POINT')
    li.energy = power
    li.color = srgb(hexcol)
    li.shadow_soft_size = radius
    ob = link(bpy.data.objects.new(name, li))
    ob.location = loc
    return ob



# ================================================================================================ the clock
def thr_at(t):
    """the crust's front (heart-local x): dark where x + noise < thr; recedes leftwards on the swells, gone by 6.5 s"""
    K = [(0.0, 0.34), (1.55, 0.34), (2.05, 0.22), (2.45, 0.16), (2.85, -0.12), (3.65, -0.30), (4.15, -0.70), (5.10, -0.88),
         (6.10, -1.05), (6.55, -1.95), (99, -1.95)]
    for (t0, a), (t1, b) in zip(K, K[1:]):
        if t0 <= t < t1:
            return lerp(a, b, smooth((t - t0) / (t1 - t0)))
    return K[-1][1]


def thr_inv(x):
    """first time the front passes heart-local x"""
    for f in range(NF):
        if thr_at(f / FPS) < x:
            return f / FPS
    return 6.5


def heart_scale(t):
    """a soft lub-dub at 66 bpm, a swell on each beat of the soundtrack, a big pulse at the flash"""
    ph = (t % (60 / 66))
    s = 1 + 0.018 * pulse(ph, 0.16) + 0.010 * pulse(ph - 0.20, 0.14)
    s += sum(0.022 * pulse(t - b, 0.35) for b in BEATS) + 0.035 * pulse(t - T_DROP, 0.3) + 0.07 * pulse(t - T_FLASH, 0.45)
    return s


# ================================================================================================ materials
def key_input(node, name, fn):
    key_node(node, [i for i, x in enumerate(node.inputs) if x.name == name][0], fn)


PINK, PINK_V = '#EBA7AE', '#F3BDC1'
m_heart = knit_mat('heart_knit', PINK, coords='XZ', spm=(10, 10), tile='knit', bump=0.9, dist=0.025, sheen=0.9, sss=0.12, heather=0.06)
m_vessel = knit_mat('vessel_knit', PINK_V, coords='XZ', spm=(12, 12), tile='rib', bump=0.8, dist=0.02, sheen=0.9, sss=0.10, heather=0.05)
m_cuff = knit_mat('cuff_rib', '#E58F9A', coords='UV', spm=(28, 3), tile='rib', bump=1.0, dist=0.02, sheen=0.9, sss=0.1, heather=0.05)
m_fuzz_pink, _, _ = principled('fuzz_pink', rgba('#F6C7CC'), rough=0.9, sheen=1.0)
m_heart.node_tree.nodes['Principled BSDF'].inputs['Emission Color'].default_value = rgba('#FFB59A')
FLASH_NODES = []


def add_crust(m):
    """mix a charcoal felt over the knit where heart-local x + noise < thr (keyed)"""
    nt = m.node_tree
    N, L = nt.nodes, nt.links
    b = N['Principled BSDF']
    src = b.inputs['Base Color'].links[0].from_socket
    tc = N.new('ShaderNodeTexCoord')
    sx = N.new('ShaderNodeSeparateXYZ')
    L.new(tc.outputs['Object'], sx.inputs['Vector'])
    nz = N.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = 2.2
    nz.inputs['Detail'].default_value = 6
    nz.inputs['Roughness'].default_value = 0.65
    L.new(tc.outputs['Object'], nz.inputs['Vector'])
    ad = N.new('ShaderNodeMath')
    ad.operation = 'MULTIPLY_ADD'
    ad.inputs[1].default_value = 0.55
    L.new(nz.outputs['Fac'], ad.inputs[0])
    L.new(sx.outputs['X'], ad.inputs[2])
    mr = N.new('ShaderNodeMapRange')
    mr.name = 'crust'
    mr.inputs['To Min'].default_value, mr.inputs['To Max'].default_value = 1.0, 0.0
    L.new(ad.outputs[0], mr.inputs['Value'])
    fz = N.new('ShaderNodeTexNoise')                      # felted soot: mottled charcoal
    fz.inputs['Scale'].default_value = 60
    fz.inputs['Detail'].default_value = 8
    L.new(tc.outputs['Object'], fz.inputs['Vector'])
    cr = N.new('ShaderNodeMapRange')
    L.new(fz.outputs['Fac'], cr.inputs['Value'])
    cmix = N.new('ShaderNodeMix')
    cmix.data_type = 'RGBA'
    sk(cmix.inputs, 'A_Color').default_value = rgba('#0C0B0D')
    sk(cmix.inputs, 'B_Color').default_value = rgba('#2A2628')
    L.new(cr.outputs['Result'], sk(cmix.inputs, 'Factor_Float'))
    mx = N.new('ShaderNodeMix')
    mx.data_type = 'RGBA'
    L.new(mr.outputs['Result'], sk(mx.inputs, 'Factor_Float'))
    L.new(src, sk(mx.inputs, 'A_Color'))
    L.new(sk(cmix.outputs, 'Result_Color'), sk(mx.inputs, 'B_Color'))
    L.new(sk(mx.outputs, 'Result_Color'), b.inputs['Base Color'])
    key_node(mr, 1, lambda f: thr_at(f / FPS) - 0.05)    # From Min
    key_node(mr, 2, lambda f: thr_at(f / FPS) + 0.05)    # From Max
    return m


add_crust(m_heart)
add_crust(m_vessel)
for m in (m_heart, m_vessel):
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Emission Color'].default_value = rgba('#FFB59A')
    key_input(b, 'Emission Strength',
           lambda f: 0.55 * pulse(f / FPS - T_DROP + 0.05, 0.7) + 1.1 * pulse(f / FPS - T_FLASH + 0.08, 0.9) + 0.18 * c01((f / FPS - 7.4) / 0.8))
    m.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 0.0

m_tangle = felt('tangle', '#141215', scale=90, rough=0.95, sheen=0.6)
m_tangle2 = felt('tangle2', '#2B2729', scale=90, rough=0.95, sheen=0.7)
m_dove = knit_mat('dove_knit', '#F4F1EC', coords='UV', spm=(18, 10), tile='seed', bump=0.7, dist=0.012, sheen=0.9, sss=0.10, heather=0.04)
m_wing = knit_mat('wing_knit', '#FBF9F5', coords='UV', spm=(12, 8), tile='rib', bump=0.7, dist=0.012, sheen=0.9, sss=0.10, heather=0.04)
m_beak = felt('beak', '#E7A04F', scale=80)
m_eye = glossy('eye', '#141014', 0.2)
m_fuzz_white, _, _ = principled('fuzz_white', rgba('#FFFFFF'), rough=0.9, sheen=1.0)
m_gold, _, b_gold = principled('gold_yarn', rgba('#E6B04A'), rough=0.35, sheen=0.5, metal=0.6)
b_gold.inputs['Emission Color'].default_value = rgba('#FFC75A')
key_input(b_gold, 'Emission Strength',
       lambda f: 1.2 + 0.6 * c01((f / FPS - T_RAYS) / 1.0) + sum(1.2 * pulse(f / FPS - b, 0.5) for b in BEATS) + 2.0 * pulse(f / FPS - T_FLASH, 0.7))
m_vein_r, _, b_vr = principled('vein_red', rgba('#C8263E'), rough=0.6, sheen=0.8)
m_vein_b, _, b_vb = principled('vein_violet', rgba('#6F57D8'), rough=0.6, sheen=0.8)
for bb, col in ((b_vr, '#FF3A55'), (b_vb, '#8C7BFF')):
    bb.inputs['Emission Color'].default_value = rgba(col)
    key_input(bb, 'Emission Strength',
           lambda f: 0.15 + 6.0 * pulse(f / FPS - T_DROP + 0.02, 0.9) + 8.0 * pulse(f / FPS - T_FLASH + 0.05, 1.0) + 0.6 * c01((f / FPS - 7.6) / 1.0))

# ================================================================================================ the heart
CUR[0] = 'Heart'
pivot = empty('HeartPivot', (0, 0, 0.0))
PIV_LOC = Vector((0, 0, 0.0))
piv_rot = lambda f: (0.04 * math.sin(f / FPS * 0.9), 0.0, 0.10 * math.sin(f / FPS * 0.55 + 0.6) - 0.05)


def pivot_mat(f):
    return Matrix.Translation(PIV_LOC) @ Euler(piv_rot(f)).to_matrix().to_4x4() @ Matrix.Scale(heart_scale(f / FPS), 4)


key_fn(pivot, 'scale', 3, lambda f: (heart_scale(f / FPS),) * 3)
key_fn(pivot, 'rotation_euler', 3, piv_rot)

mb = bpy.data.metaballs.new('HeartMB')
mb.resolution = 0.035
mb.render_resolution = 0.035
mb.threshold = 0.6
CHAMBERS = [  # (centre, size xyz, rotation y deg, radius)
    ((0.00, 0.00, -0.25), (1.18, 0.86, 1.22), -18, 1.0),   # the ventricular mass
    ((-0.36, 0.06, -0.55), (0.92, 0.78, 1.10), -26, 1.0),  # left ventricle (the viewer's left)
    ((0.42, -0.14, -0.15), (0.90, 0.72, 0.98), 24, 1.0),   # right ventricle
    ((-0.40, 0.02, -1.22), (0.60, 0.56, 0.66), -28, 1.0),  # apex
    ((-0.50, 0.24, 0.52), (0.58, 0.54, 0.48), 0, 1.0),     # left atrium
    ((0.84, 0.04, 0.42), (0.62, 0.56, 0.58), 0, 1.0),      # right atrium
    ((-0.84, -0.26, 0.40), (0.34, 0.24, 0.24), -30, 1.0),  # left auricle
]
for c, s, ry, r in CHAMBERS:
    el = mb.elements.new()
    el.type = 'ELLIPSOID'
    el.co = c
    el.radius = r
    el.size_x, el.size_y, el.size_z = s
    el.rotation = Matrix.Rotation(math.radians(ry), 4, 'Y').to_quaternion()
mbo = link(bpy.data.objects.new('HeartMB', mb))
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
hme = bpy.data.meshes.new_from_object(mbo.evaluated_get(dg))
bpy.data.objects.remove(mbo)
heart = link(bpy.data.objects.new('Heart', hme))
for p in hme.polygons:
    p.use_smooth = True
heart.data.materials.append(m_heart)
heart.data.materials.append(m_fuzz_pink)
heart.parent = pivot
print('HEART verts', len(hme.vertices), 'bbox', [tuple(round(v, 2) for v in heart.bound_box[i]) for i in (0, 6)])


def tube_pts(ctrl, n=40):
    """Catmull-Rom through the control points"""
    P = np.array(ctrl, np.float64)
    P = np.vstack([P[0] * 2 - P[1], P, P[-1] * 2 - P[-2]])
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1:i + 3]
        for u in np.linspace(0, 1, n // (len(P) - 3), endpoint=False):
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u ** 2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u ** 3))
    out.append(P[-2])
    return np.array(out)


VESSELS = [  # (control points, radius)
    ([(-0.04, 0.05, 0.50), (0.00, 0.02, 1.08), (-0.20, 0.12, 1.46), (-0.58, 0.30, 1.48), (-0.84, 0.44, 1.10), (-0.90, 0.50, 0.70)], 0.25),  # aorta
    ([(-0.16, 0.16, 1.44), (-0.20, 0.14, 1.80)], 0.085),    # brachiocephalic
    ([(-0.40, 0.24, 1.52), (-0.44, 0.22, 1.86)], 0.072),    # left common carotid
    ([(-0.62, 0.32, 1.44), (-0.70, 0.30, 1.76)], 0.072),    # left subclavian
    ([(0.34, -0.36, 0.55), (0.40, -0.34, 0.98), (0.56, -0.20, 1.20), (0.98, 0.02, 1.24)], 0.21),   # pulmonary trunk + right branch
    ([(0.42, -0.30, 1.04), (0.10, 0.30, 1.24), (-0.36, 0.56, 1.20)], 0.15),                     # left pulmonary branch (behind)
    ([(0.92, 0.10, 0.70), (0.94, 0.10, 1.25), (0.96, 0.10, 1.56)], 0.17),                         # superior vena cava
]
for k, (ctrl, r) in enumerate(VESSELS):
    pts = tube_pts(ctrl, 36)
    v = curve_obj(f'Vessel{k}', [pts], r, m_vessel, res=2, caps=False, bevel_res=4)
    v.data.materials.append(m_fuzz_pink)
    v.parent = pivot
    if k != 5:                                            # a ribbed cuff on each open end, like a sock top
        d = Vector(pts[-1]) - Vector(pts[-3])
        cuff = cylinder(f'Cuff{k}', r * 1.10, r * 1.10, 0.10, m_cuff, 32, caps=False)
        cuff.location = Vector(pts[-1]) - d.normalized() * 0.04
        cuff.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
        cuff.parent = pivot

# couched coronary yarn on the front: polylines in x/z, raycast onto the surface from the camera side
bpy.context.view_layer.update()
bvh = BVHTree.FromObject(heart, bpy.context.evaluated_depsgraph_get())


def couch(name, xz, r, mat):
    pts = []
    for x, z in tube_pts([(x, 0, z) for x, z in xz], 60)[:, [0, 2]]:
        hit = bvh.ray_cast(Vector((x, -5, z)), Vector((0, 1, 0)))
        if hit[0] is not None:
            pts.append(hit[0] + hit[1] * (r * 0.6))
    if len(pts) > 2:
        c = curve_obj(name, [np.array([tuple(p) for p in pts])], r, mat, res=2, bevel_res=2)
        c.parent = pivot


couch('CoronaryR', [(0.62, 0.28), (0.42, -0.25), (0.22, -0.80), (0.02, -1.20)], 0.036, m_vein_r)
couch('CoronaryR2', [(0.42, -0.25), (0.62, -0.55), (0.70, -0.85)], 0.026, m_vein_r)
couch('CoronaryL', [(-0.10, 0.36), (0.06, -0.10), (0.10, -0.60), (-0.10, -1.10)], 0.034, m_vein_b)
couch('CoronaryL2', [(0.06, -0.10), (-0.24, -0.40), (-0.36, -0.80)], 0.025, m_vein_b)
couch('Groove', [(-0.70, 0.30), (-0.30, 0.42), (0.20, 0.36), (0.70, 0.20)], 0.030, m_vein_r)
add_fuzz(heart, 4500, 0.016, mat_index=1, children=3, radius=0.002, seed=3)

# ================================================================================================ the black wool
CUR[0] = 'Tangles'


def tangle_mesh(name, seed, loops=13, r=1.0):
    """a ball of tangled yarn: a random walk on a sphere, as a yarn tube"""
    g = np.random.default_rng(seed)
    pts, p = [], g.normal(size=3)
    p /= np.linalg.norm(p)
    d = np.cross(p, g.normal(size=3))
    d /= np.linalg.norm(d)
    for i in range(loops * 26):
        d = d + g.normal(size=3) * 0.55
        d -= p * np.dot(d, p)
        d /= np.linalg.norm(d)
        p = p + d * 0.17
        p /= np.linalg.norm(p)
        pts.append(p * r * (0.80 + 0.25 * g.random()))
    c = curve_obj(name + '_c', [np.array(pts)], 0.13 * r, None, res=2, bevel_res=2)
    bpy.context.view_layer.update()
    me = bpy.data.meshes.new_from_object(c.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    bpy.data.objects.remove(c)
    for pg in me.polygons:
        pg.use_smooth = True
    return me


TMESH = [tangle_mesh(f'tangle{k}', 40 + k) for k in range(6)]
for me in TMESH:
    me.materials.append(m_tangle)
    me.materials.append(m_tangle2)
    for k, pg in enumerate(me.polygons):
        pg.material_index = 1 if (k // 23) % 3 == 0 else 0

# sample the heart surface the camera sees, on the crusted side
cand = []
mw = heart.matrix_world.copy()
for _ in range(30000):
    x, z = rng.uniform(-1.5, 0.6), rng.uniform(-2.0, 1.0)
    hit = bvh.ray_cast(Vector((x, -5, z)), Vector((0, 1, 0)))
    if hit[0] is None:
        continue
    cand.append((hit[0], hit[1]))
# keep points left of the starting front (with the same noise feel), thin them to a blanket
noise_off = lambda p: 0.55 * (0.5 + 0.5 * math.sin(2.1 * p.x + 1.3 * p.z) * math.cos(1.7 * p.z - 0.4)) - 0.27
TANG = []
for p, n in cand:
    xe = p.x + noise_off(p)
    if xe > 0.34:
        continue
    if all((p - q).length > 0.085 for q, _, _ in TANG):
        TANG.append((p, n, xe))
print('TANGLES', len(TANG))
G = 5.5
FLOOR_Z = -2.95
for i, (p, n, xe) in enumerate(TANG):
    r = float(rng.uniform(0.08, 0.14))
    ob = link(bpy.data.objects.new(f'T{i}', TMESH[i % len(TMESH)]))
    ob.parent = pivot
    ob.location = p + n * r * 0.55
    ob.scale = (r,) * 3
    ob.rotation_euler = tuple(rng.uniform(0, 6.28, 3))
    t0 = thr_inv(xe) + float(rng.uniform(-0.06, 0.12))
    f0 = max(1, SEC(t0))
    # release: the world position at f0, then ballistic with spin, then rest on the floor and shrink away
    w0 = pivot_mat(f0) @ ob.location
    out = Vector((w0.x - 0.0, -0.6, 0.0))
    out.normalize()
    v0 = out * float(rng.uniform(0.6, 1.5)) + Vector((float(rng.uniform(-0.3, 0.2)), float(rng.uniform(-0.6, 0.1)), float(rng.uniform(0.1, 0.9))))
    spin = Vector(rng.uniform(-7, 7, 3).tolist())
    rot0 = Vector(ob.rotation_euler)
    fr, L_, R_, S_ = [], [], [], []
    land = None
    for f in range(f0, NF):
        dt = (f - f0) / FPS
        w = w0 + v0 * dt + Vector((0, 0, -0.5 * G * dt * dt))
        sc_ = r
        if land is None and w.z < FLOOR_Z + r * 0.6:
            land = (f, Vector((w.x, w.y, FLOOR_Z + r * 0.6)))
        if land is not None:
            w = land[1]
            sc_ = r * (1 - smooth((f - land[0]) / (0.7 * FPS)))
        fr.append(f)
        L_.append(w)
        R_.append(rot0 + spin * dt if land is None else rot0 + spin * ((land[0] - f0) / FPS))
        S_.append(max(sc_, 0.0))
    # into the pivot's space, frame by frame (the pivot breathes and sways)
    LL = [pivot_mat(f).inverted() @ w for f, w in zip(fr, L_)]
    for j in range(3):
        key_series(ob, 'location', j, [f0 - 1] + fr, [ob.location[j]] + [v[j] for v in LL])
        key_series(ob, 'rotation_euler', j, [f0 - 1] + fr, [rot0[j]] + [v[j] for v in R_])
        key_series(ob, 'scale', j, [f0 - 1] + fr, [r] + [s / heart_scale(f / FPS) for f, s in zip(fr, S_)])

# ================================================================================================ doves
CUR[0] = 'Doves'


def ellip_loft(name, L, rx, rz, mats, n=28, m=22, prof=None):
    rings = []
    for i in range(m):
        u = i / (m - 1)
        x = (u - 0.5) * L
        k = prof(u) if prof else math.sqrt(max(0.0, 1 - (2 * u - 1) ** 2))
        k = max(k, 0.02)
        a = np.linspace(0, 2 * np.pi, n, endpoint=False)
        rings.append(np.c_[np.full(n, x), rx * k * np.cos(a), rz * k * np.sin(a)])
    return loft(name, rings, mats)


def wing_mesh(name, span, chord, side):
    """a flat knitted wing: a cambered sheet with a feathered trailing edge, root at the origin, spanning +side*y"""
    rings = []
    nu, nv = 18, 14
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new('UVMap')
    V = []
    for i in range(nu):
        u = i / (nu - 1)
        row = []
        c = chord * (1 - 0.55 * u) * (1 + 0.12 * math.sin(u * 3.0))
        for j in range(nv):
            v = j / (nv - 1)
            feather = 0.10 * chord * (0.5 + 0.5 * math.cos(v * 0 + u * 34)) * (v > 0.85)
            x = -(v - 0.25) * c - feather - 0.3 * chord * u * u
            y = side * span * u
            z = 0.06 * span * math.sin(math.pi * v) * (1 - u) + 0.10 * span * u * u
            row.append(bm.verts.new((x, y, z)))
        V.append(row)
    for i in range(nu - 1):
        for j in range(nv - 1):
            q = (V[i][j], V[i + 1][j], V[i + 1][j + 1], V[i][j + 1]) if side > 0 else (V[i][j], V[i][j + 1], V[i + 1][j + 1], V[i + 1][j])
            f = bm.faces.new(q)
            for lp in f.loops:
                lp[uvl].uv = (lp.vert.co.y * side / span, -lp.vert.co.x / chord)
    bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=0.02)
    return mesh_obj(name, bm, [m_wing, m_fuzz_white])


def dove(k):
    root = empty(f'Dove{k}')
    body = ellip_loft(f'DoveBody{k}', 0.62, 0.15, 0.16, [m_dove, m_fuzz_white],
                      prof=lambda u: math.sqrt(max(0.0, 1 - (2 * u - 1) ** 2)) * (0.55 + 0.45 * u))
    body.parent = root
    head = sphere(f'DoveHead{k}', 0.10, m_dove, 24, 12)
    head.location = (0.30, 0, 0.09)
    head.parent = root
    beak = cylinder(f'DoveBeak{k}', 0.028, 0.0, 0.08, m_beak, 12)
    beak.rotation_euler = (0, math.pi / 2, 0)
    beak.location = (0.41, 0, 0.08)
    beak.parent = root
    for s in (-1, 1):
        e = sphere(f'DoveEye{k}{s}', 0.016, m_eye, 12, 8)
        e.location = (0.355, s * 0.07, 0.12)
        e.parent = root
    tail = ellip_loft(f'DoveTail{k}', 0.26, 0.10, 0.025, [m_wing], prof=lambda u: 0.4 + 0.6 * (1 - u))
    tail.location = (-0.38, 0, 0.02)
    tail.rotation_euler = (0, -0.25, 0)
    tail.parent = root
    wings = []
    for s in (-1, 1):
        hinge = empty(f'DoveHinge{k}{s}', (0.04, s * 0.10, 0.07))
        hinge.parent = root
        w = wing_mesh(f'DoveWing{k}{s}', 0.52, 0.30, s)
        w.parent = hinge
        add_fuzz(w, 150, 0.012, mat_index=1, children=2, radius=0.0015, seed=k * 2 + (s > 0))
        wings.append((hinge, s))
    add_fuzz(body, 300, 0.012, mat_index=1, children=2, radius=0.0015, seed=k)
    return root, wings


DOVES = []
for k in range(12):
    R = float(rng.uniform(1.95, 2.6))
    DOVES.append(dict(R=R, tilt=float(rng.uniform(-0.45, 0.45)), roll=float(rng.uniform(-0.25, 0.25)), zc=float(rng.uniform(-0.5, 0.9)),
                      w=float(rng.choice([-1, 1]) * rng.uniform(0.55, 0.85)), ph=float(rng.uniform(0, 6.283)),
                      t_in=0.0 if k < 4 else float(0.6 + (k - 4) * 0.62 + rng.uniform(-0.15, 0.15)), flap=float(rng.uniform(2.6, 3.4)),
                      size=float(rng.uniform(0.80, 1.05))))


def dove_state(d, t):
    """position on its tilted orbit, spiralling in from far out when it arrives; heading along the path"""
    a = d['ph'] + d['w'] * t
    arrive = ease_out((t - d['t_in']) / 1.6) if d['t_in'] > 0 else 1.0
    R = d['R'] + (1 - arrive) * 4.5
    p = Vector((R * math.cos(a), R * math.sin(a) * 0.55, 0.0))
    p = Matrix.Rotation(d['tilt'], 3, 'X') @ Matrix.Rotation(d['roll'], 3, 'Y') @ p
    p.z += d['zc'] + (1 - arrive) * 2.2
    return p


for k, d in enumerate(DOVES):
    root, wings = dove(k)
    root.scale = (0.85 * d['size'],) * 3

    def loc(f, d=d):
        return tuple(dove_state(d, f / FPS))

    def rot(f, d=d):
        t = f / FPS
        p0, p1 = dove_state(d, t - 0.03), dove_state(d, t + 0.03)
        fwd = (p1 - p0).normalized()
        q = fwd.to_track_quat('X', 'Z')
        e = q.to_euler()
        e.x += 0.30 * math.copysign(1, d['w'])            # bank into the turn
        return tuple(e)
    key_fn(root, 'location', 3, loc)
    key_fn(root, 'rotation_euler', 3, rot)
    for hinge, s in wings:
        key_fn(hinge, 'rotation_euler', 3, lambda f, s=s, d=d: (s * (0.15 + 0.85 * math.sin(2 * math.pi * d['flap'] * f / FPS + d['ph'])), 0.0, 0.0))

# ================================================================================================ gold rings, beads, ripples
CUR[0] = 'Gold'
RINGS = []
for k, (R, tx, ty, w) in enumerate(((1.75, 0.30, 0.20, 0.35), (2.05, 0.22, -0.26, -0.25))):
    a = np.linspace(0, 2 * np.pi, 720, endpoint=False)
    strands = []
    for s in (0, np.pi):                                  # two plies twisted around the ring
        tw = 26 * a + s
        rr = 0.022
        strands.append(np.c_[(R + rr * np.cos(tw)) * np.cos(a), (R + rr * np.cos(tw)) * np.sin(a), rr * np.sin(tw)])
    ring = curve_obj(f'GoldRing{k}', strands, 0.016, m_gold, res=1, closed=True, bevel_res=2)
    ring.location = (0, 0, -0.55 + 0.75 * k)
    key_fn(ring, 'rotation_euler', 3, lambda f, tx=tx, ty=ty, w=w: (tx + 0.05 * math.sin(f / FPS * 0.7), ty, w * f / FPS))
    key_fn(ring, 'scale', 3, lambda f: (0.6 + 0.4 * ease_out(f / FPS / 0.9) + 0.04 * sum(pulse(f / FPS - b, 0.5) for b in BEATS),) * 3)
    RINGS.append(ring)
    for j in range(16):                                   # gold beads riding on it
        bd = sphere(f'GoldBead{k}_{j}', 0.035, m_gold, 12, 8)
        aj = 2 * np.pi * j / 16 + 0.3 * k
        bd.location = (R * math.cos(aj), R * math.sin(aj), 0.0)
        bd.parent = ring

# the floor: a dark teal knitted sweep (floor -> backdrop), soft pompom bokeh behind
CUR[0] = 'Set'
m_floor = knit_mat('floor_knit', '#0F3439', coords='UV', spm=(90, 70), tile='knit', bump=0.8, dist=0.03, sheen=0.5, heather=0.10, rough=0.5)
bm = bmesh.new()
uvl = bm.loops.layers.uv.new('UVMap')
prof = []
for i in range(60):
    u = i / 59
    s = u * 22.0                                           # arc length: 0..9 flat floor (y -5..4), a bend of radius 4, then up
    if s < 9:
        prof.append((-5 + s, FLOOR_Z - 0.0))
    elif s < 9 + 2 * math.pi:
        ang = (s - 9) / 4
        prof.append((4 + 4 * math.sin(ang), FLOOR_Z + 4 - 4 * math.cos(ang)))
    else:
        prof.append((8, FLOOR_Z + 4 + (s - 9 - 2 * math.pi)))
xs = np.linspace(-9, 9, 40)
V = [[bm.verts.new((x, y, z)) for x in xs] for y, z in prof]
for i in range(len(prof) - 1):
    for j in range(len(xs) - 1):
        f = bm.faces.new((V[i][j], V[i][j + 1], V[i + 1][j + 1], V[i + 1][j]))
        for lp in f.loops:
            ii = next(r for r in range(len(prof)) if lp.vert in V[r])
            lp[uvl].uv = ((lp.vert.co.x + 9) / 18, ii / (len(prof) - 1))
sweep = mesh_obj('Sweep', bm, [m_floor])
m_bok = []
for k, col in enumerate(('#FFD27A', '#7FE0D2', '#FFE7B0')):
    m, em = emissive(f'bokeh{k}', col, 3.0)
    N_, L_k = m.node_tree.nodes, m.node_tree.links
    lw = N_.new('ShaderNodeLayerWeight')
    lw.inputs['Blend'].default_value = 0.55
    pw = N_.new('ShaderNodeMath')
    pw.operation = 'POWER'
    pw.inputs[1].default_value = 0.6
    L_k.new(lw.outputs['Facing'], pw.inputs[0])
    tr_ = N_.new('ShaderNodeBsdfTransparent')
    ms_ = N_.new('ShaderNodeMixShader')
    L_k.new(pw.outputs[0], ms_.inputs[0])
    L_k.new(em.outputs[0], ms_.inputs[1])
    L_k.new(tr_.outputs[0], ms_.inputs[2])
    L_k.new(ms_.outputs[0], N_['Material Output'].inputs['Surface'])
    tryset(m, blend_method='BLEND', surface_render_method='BLENDED')
    m_bok.append(m)
for k in range(46):
    x, z = rng.uniform(-6, 6), rng.uniform(-1.5, 9)
    yb = 8.0 if z > FLOOR_Z + 4 else 4 + math.sqrt(max(0.0, 16 - (FLOOR_Z + 4 - z) ** 2))
    p = sphere(f'Pompom{k}', float(rng.uniform(0.10, 0.28)), m_bok[k % 3], 16, 10)
    p.location = (x, yb - 0.4, z)
    key_fn(p, 'scale', 3, lambda f, ph=float(rng.uniform(0, 6.28)): (0.8 + 0.25 * math.sin(f / FPS * 1.3 + ph),) * 3, frames=range(0, NF, 3))

# gold ripples on the floor at each swell
RIPPLE_T = [1.50, 2.50, 3.70, 6.15, 7.00, 8.60]
for k, t0 in enumerate(RIPPLE_T):
    m, em = emissive(f'ripple{k}', '#FFC75A', 0.0)
    a = np.linspace(0, 2 * np.pi, 180, endpoint=False)
    rp = curve_obj(f'Ripple{k}', [np.c_[np.cos(a), np.sin(a), np.zeros_like(a)]], 0.012, m, res=1, closed=True, bevel_res=1)
    rp.location = (0, 0.2, FLOOR_Z + 0.02)
    key_fn(rp, 'scale', 3, lambda f, t0=t0: ((0.6 + 3.6 * ease_out((f / FPS - t0) / 2.4)) if 0 <= f / FPS - t0 < 2.2 else 0.0,) * 3)
    life = lambda f, t0=t0: 0.0 if f / FPS < t0 else 1 - smooth((f / FPS - t0) / 2.2)
    em.inputs[1].default_value = 9.0                       # fades by opacity, never to a dark ring
    N_, L_k = m.node_tree.nodes, m.node_tree.links
    tr_, ms_ = N_.new('ShaderNodeBsdfTransparent'), N_.new('ShaderNodeMixShader')
    L_k.new(tr_.outputs[0], ms_.inputs[1])
    L_k.new(em.outputs[0], ms_.inputs[2])
    L_k.new(ms_.outputs[0], N_['Material Output'].inputs['Surface'])
    key_node(ms_, 0, life)
    tryset(m, blend_method='BLEND', surface_render_method='BLENDED')

# ================================================================================================ light, world, camera
CUR[0] = 'Light'
world = bpy.data.worlds.new('World')
sc.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = rgba('#0A1E22')
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.35
key = area('Key', (0.6, -4.5, 6.5), (0, 0, -0.2), 4.0, 700, '#FFE2BE')
back = area('Back', (0, 3.0, 0.5), (0, 8, 1.5), 6.0, 900, '#5FC8C0')
fill = area('Fill', (-4.5, -5.5, -0.5), (0, 0, 0), 5.0, 260, '#BFD8FF')
rimL = area('RimL', (-4.0, 3.5, 1.5), (0, 0, 0), 3.0, 700, '#7FE8D8')
rimR = area('RimR', (4.0, 3.0, 2.2), (0, 0, 0), 3.0, 650, '#FFD1A6')
name_light = point('NameLight', (0, -1.0, 3.1), 0, '#FFCF7A', radius=0.6)
key_fn(name_light.data, 'energy', 0, lambda f: 250 + 400 * pulse(f / FPS - T_DROP, 0.6) + 600 * c01((f / FPS - T_RAYS) / 1.0)
       + 900 * pulse(f / FPS - T_FLASH, 0.8))
core = point('HeartCore', (0, -1.6, 0.0), 0, '#FF9A8A', radius=0.8)
key_fn(core.data, 'energy', 0, lambda f: 60 + 900 * pulse(f / FPS - T_FLASH, 0.9) + 250 * pulse(f / FPS - T_DROP, 0.7))

cam_d = bpy.data.cameras.new('Cam')
cam_d.lens = 50
cam_d.sensor_fit = 'VERTICAL'
cam_d.sensor_height = 36
cam_d.dof.use_dof = True
cam_d.dof.aperture_fstop = 0.75
tryset(ee, use_dof=True)
cam = link(bpy.data.objects.new('Cam', cam_d))
sc.camera = cam
key_fn(cam, 'location', 3, lambda f: (0.0, -11.6 + 0.9 * smooth(f / (NF - 1)), 0.12 + 0.10 * smooth(f / (NF - 1))))
cam.rotation_euler = (math.radians(90.6), 0, 0)
key_fn(cam_d, 'dof.focus_distance', 0, lambda f: 11.6 - 0.9 * smooth(f / (NF - 1)) - 0.5)

# ================================================================================================ geom.json (Remotion anchors)
geom = {'fps': FPS, 'frames': NF, 'top': [], 'centre': []}
for f in range(NF):
    sc.frame_set(f)
    for k, p in (('top', Vector((-0.05, -0.55, 1.05))), ('centre', Vector((0, -0.6, -0.15)))):
        w = pivot_mat(f) @ p
        c = world_to_camera_view(sc, cam, w)
        geom[k].append([round(c.x * 1080, 1), round((1 - c.y) * 1920, 1)])
(OUT / 'geom.json').write_text(json.dumps(geom))
sc.frame_set(0)

# ================================================================================================ render
if MODE == 'stills':
    (OUT / 'stills').mkdir(exist_ok=True)
    for s in (POS[0].split(',') if POS else ['0', '120', '240']):
        sc.frame_set(int(s))
        sc.render.filepath = str(OUT / 'stills' / f'f{int(s):04d}.jpg')
        bpy.ops.render.render(write_still=True)
        print('STILL', s)
elif MODE == 'anim':
    a = int(POS[0]) if POS else 0
    b = int(POS[1]) if len(POS) > 1 else NF - 1
    (OUT / 'frames').mkdir(exist_ok=True)
    for f in range(a, b + 1):
        p = OUT / 'frames' / f'f{f:04d}.jpg'
        if p.exists():
            continue
        sc.frame_set(f)
        sc.render.filepath = str(p)
        bpy.ops.render.render(write_still=True)
        print('FRAME', f, flush=True)
    print('DONE', a, b)
elif MODE == 'save':
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'allahknit.blend'))
