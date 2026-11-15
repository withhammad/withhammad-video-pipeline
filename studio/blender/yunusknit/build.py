"""YUNUS-KNIT 3D plates: the private knitted "three darknesses" Quran reel for the owner's wife (@heal.ingthroughquran).
Reference DfsOaK8h_rq (@rofydaesam): as-Saffat 37:139-146 recited over a cinematic retelling of the story of Yunus (AS).
Rebuilt here as real 3D knitwork, rendered headless with EEVEE, on the reference clock:

    studio/heavy.sh /Applications/Blender.app/Contents/MacOS/Blender -b -P studio/blender/yunusknit/build.py -- <out> stills 0,60,300
    studio/heavy.sh /Applications/Blender.app/Contents/MacOS/Blender -b -P studio/blender/yunusknit/build.py -- <out> anim [first] [last]

Options after the mode: --timing <json> (default <out>/timing.json, written by remotion/src/yunusknit/text.py from the word
clock), --samples N (EEVEE TAA samples, default 16), --pct P (resolution percent, default 100), --nohair.

NO PROPHET IS SHOWN, IN ANY FORM: no figure, back, silhouette, hand or shadow, not even a shape inside the whale. The story is
told only with the knitted night, the sea, the ship and its cargo, the lots, the whale, the three darknesses and the light of
the dawn. The ship carries cargo and no people. No Arabic is drawn in Blender (the text is Remotion's, over this plate).

Shots (one scene, one camera; each set sits in its own place and is shown only in its own frames):
  OPEN   the yarn sea at night in a storm: a striped knitted sea (Ocean modifier, stockinette relief, white boucle crests), a
         knitted night sky with Fair Isle stars and a crochet moon, the knitted ship with its lantern; the knitted whale breaches
         out of the sea mouth first, arcs over and crashes back in a burst of yarn spray (the reference's whale call and splash)
  A139   the ship sails on the night sea under the moon
  A140   the laden ship: along the deck, its cargo of knitted sacks, barrels, jars and crates, the sail full
  A141a  «فساهم»: the lots: a crochet cup tips over on the wet deck, the lot sticks spill, one red-tipped stick rolls to the lens
  A141b  the storm rises: big knitted waves, lightning yarn, the ship pitching
  A142   the whale rises beside the ship, its jaws wide, and closes them, and dives
  A143   under the sea: the whale glides down past glowing crochet jellyfish into the deep
  A144   the three darknesses, counted outward: the knitted belly (ribbed tunnel, its ribs lit by running gold stitches), the deep
         sea under the whale, the night over the sea
  A145   the three darknesses part as knitted curtains (belly, sea, night) onto a knitted dawn: the whale comes to the shore,
         opens its mouth to the sand, closes it and turns back to the sea
  A146   on the knitted sand a crochet sprout grows into a gourd vine: tendrils, broad knitted leaves, yellow flowers, a gourd
"""
import bpy
import bmesh
import json
import math
import sys
import time
from pathlib import Path

import numpy as np
from mathutils import Euler, Matrix, Vector

argv = sys.argv[sys.argv.index('--') + 1:]
OUT = Path(argv[0]).resolve()
MODE = argv[1] if len(argv) > 1 else 'stills'
POS = [a for a in argv[2:] if not a.startswith('--')]
opt = lambda k, d=None: argv[argv.index(k) + 1] if k in argv else d
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'tex').mkdir(exist_ok=True)
SAMPLES, PCT = int(opt('--samples', 16)), int(opt('--pct', 100))
NOHAIR = '--nohair' in argv
FPS = 30
TIMING = json.loads(Path(opt('--timing', str(OUT / 'timing.json'))).read_text())
NF = TIMING['frames']
SEC = lambda s: int(round(s * FPS))
CUT = {k: SEC(v) for k, v in TIMING['cuts'].items()}       # shot start frames, by shot name
EV = TIMING['events']                                        # event times in seconds
SHOTS = ['OPEN', 'A139', 'A140', 'A141a', 'A141b', 'A142', 'A143', 'A144a', 'A144b', 'A144c', 'A145', 'A146']
SPAN = {}
for i, s in enumerate(SHOTS):
    SPAN[s] = (CUT[s], CUT[SHOTS[i + 1]] if i + 1 < len(SHOTS) else NF)
CUT_FRAMES = sorted({CUT[s] for s in SHOTS[1:]})
rng = np.random.default_rng(87)


def shot_at(f):
    for s in SHOTS:
        a, b = SPAN[s]
        if a <= f < b:
            return s
    return SHOTS[-1]


def spans(*names):
    return [SPAN[n] for n in names]


# ------------------------------------------------------------------------------------------------ scene and render settings
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.name = 'YUNUS_KNIT'
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
       shadow_step_count=8, use_fast_gi=True, fast_gi_method='GLOBAL_ILLUMINATION', bokeh_max_size=80, motion_blur_steps=1,
       use_volumetric_shadows=False, volumetric_tile_size='8', volumetric_samples=48, volumetric_start=0.5, volumetric_end=160.0,
       use_bloom=False)
try:
    ee.ray_tracing_options.resolution_scale = '2'
    ee.fast_gi_resolution = '2'
except Exception:
    pass
tryset(sc.render, hair_type='STRAND', hair_subdiv=0)
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


def show_in(ob, names, children=True):
    sp = spans(*names)
    visible_keys(ob, sp)
    if children:
        for ch in ob.children_recursive:
            visible_keys(ch, sp)


# ================================================================================================ colour maps (1 px = 1 stitch)
def bands(rows, cols, cols_hex, heights, r=None):
    """horizontal stripes: cols_hex[k] for heights[k] rows, repeated; row 0 = top"""
    C = np.zeros((rows, cols, 3), np.float32)
    seq = []
    while len(seq) < rows:
        for h_, c_ in zip(heights, cols_hex):
            seq += [c_] * h_
    for j in range(rows):
        C[j] = hexrgb(seq[j])
    if r is not None:
        C *= (1 + r.normal(0, 0.03, (rows, cols, 1))).astype(np.float32)
    return np.clip(C, 0, 1)


def stamp(C, pat, cmap, top, left, wrap=True):
    rows, cols = C.shape[:2]
    for y, row in enumerate(pat):
        for x, ch in enumerate(row):
            if ch in cmap and 0 <= top + y < rows:
                xx = (left + x) % cols if wrap else left + x
                if 0 <= xx < cols:
                    C[top + y, xx] = hexrgb(cmap[ch])


STAR5 = ['..a..', '.aba.', 'abbba', '.aba.', '..a..']
STAR7 = ['...a...', '..aba..', '.abbba.', 'abbcbba', '.abbba.', '..aba..', '...a...']
WAVE = ['....aa......', '...a..a.....', '..a....a...a', 'aa......aaa.']
DIAMOND = ['..a..', '.aba.', 'ab.ba', '.aba.', '..a..']
HEART = ['.aa.aa.', 'abbabba', 'abbbbba', '.abbba.', '..aba..', '...a...']
R = np.random.default_rng(11)


def sea_map(pal, motif_cols, n=60, rows=72):
    """a knitted sea blanket: dark stripes of varied heights, a Fair Isle wave band every ~18 rows"""
    C = bands(rows, n, pal, [3, 2, 4, 2, 3, 2], R)
    for top in range(4, rows, 18):
        for left in range(0, n, 12):
            stamp(C, WAVE, {'a': motif_cols[0]}, top, left)
        for left in range(6, n, 12):
            stamp(C, ['b'], {'b': motif_cols[1]}, top + 7, left)
    return C


def sky_map(stops, cols, rows, stars=True, seed=3, moon=None, halo='#5B5BA8'):
    """vertical ombre (two yarns stranded in a dither between neighbouring stops), Fair Isle stars and knot stars"""
    r = np.random.default_rng(seed)
    C = np.zeros((rows, cols, 3), np.float32)
    S = [hexrgb(h) for h in stops]
    bayer = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16 + 1 / 32
    for j in range(rows):                              # j = 0 top
        g = (1 - j / (rows - 1)) * (len(S) - 1)        # the first stop at the horizon (bottom row), the last at the zenith (row 0)
        i0 = min(int(g), len(S) - 2)
        fr = g - i0
        for i in range(cols):
            C[j, i] = S[i0 + 1] if bayer[j % 4, i % 4] < fr else S[i0]
    C *= (1 + r.normal(0, 0.03, (rows, cols, 1))).astype(np.float32)
    if moon is not None:
        mu, mv, rad = moon
        jj, ii = np.mgrid[0:rows, 0:cols]
        d = np.hypot((ii - mu) / 1.0, (jj - mv) / 0.75)
        w = np.clip(1 - d / rad, 0, 1) ** 1.5
        C = C * (1 - 0.6 * w[..., None]) + hexrgb(halo) * 0.6 * w[..., None]
    if stars:
        for k in range(int(cols * rows / 140)):
            jj, ii = int(r.integers(0, int(rows * 0.82))), int(r.integers(0, cols))
            C[jj, ii] = hexrgb(['#FFF6DA', '#F6C552', '#BFE6FF', '#FFFFFF'][k % 4])
        for k in range(int(cols * rows / 1500)):
            jj, ii = int(r.integers(2, int(rows * 0.7))), int(r.integers(0, cols))
            stamp(C, STAR5 if k % 3 else STAR7, {'a': '#F6C552', 'b': '#FFF2D0', 'c': '#FFFFFF'}, jj, ii)
    return np.clip(C, 0, 1)


# ================================================================================================ the night: sky, moon, clouds, sea
CUR[0] = 'Night'
NIGHT_SHOTS = ['OPEN', 'A139', 'A140', 'A141b', 'A142', 'A144c']
SKY_R, SKY_H, SKY_Z0 = 260.0, 260.0, -30.0
SKY_COLS, SKY_ROWS = 360, 80


def sky_dome(name, cmap_img, emis, center=(0, 0, 0)):
    rings = []
    for k in range(25):
        el = math.radians(-12 + 100 * k / 24)
        el = min(el, math.radians(89.5))
        a = np.linspace(0, 2 * np.pi, 160, endpoint=False)
        rr = SKY_R * math.cos(el)
        rings.append(np.c_[rr * np.cos(a) + center[0], rr * np.sin(a) + center[1], np.full(160, SKY_R * math.sin(el)) + center[2]])
    m = knit_mat(name + ' knit', img=cmap_img, coords='UV', spm=(SKY_COLS, SKY_ROWS), bump=0.6, dist=1.2, emis=emis, rough=1.0,
                 sheen=0.0, sss=0.0, dark=0.30, heather=0.05)
    # the loft's u runs along the rings (up the dome) and v around it: rows of stitches stack upward
    ob = loft(name, rings, [m], cap0=False, cap1=True)
    for p in ob.data.polygons:
        p.flip()
    # remap: image x = around (v), image y = up (u)
    uvl = ob.data.uv_layers[0].data
    for lp in uvl:
        u, v = lp.uv
        lp.uv = (v, u)
    return ob, m


MOON_AZ, MOON_EL = math.radians(78), math.radians(20)        # azimuth from +X towards +Y, elevation
moon_u = SKY_COLS * (MOON_AZ / (2 * math.pi))
moon_v = SKY_ROWS * (1 - (math.degrees(MOON_EL) + 12) / 100)
night_img = color_png('night_sky', sky_map(['#5A3A8E', '#43358A', '#2E2C78', '#1F2462', '#151A4A', '#0E1236'], SKY_COLS, SKY_ROWS,
                                          moon=(moon_u, moon_v, 26), halo='#4F57A8'))
night_sky, night_sky_mat = sky_dome('Night sky', night_img, 1.2)
mdir = Vector((math.cos(MOON_AZ) * math.cos(MOON_EL), math.sin(MOON_AZ) * math.cos(MOON_EL), math.sin(MOON_EL)))
moon = cylinder('Moon', 15, 15, 1.0, knit_mat('Moon knit', '#FFF1CC', coords='XY', spm=(0.9, 1.3), bump=0.8, dist=0.6,
                                               emis=4.0, emis_col='#FFF1CC', dark=0.55), seg=48)
moon.location = mdir * 236
moon.rotation_euler = mdir.to_track_quat('Z', 'Y').to_euler()
moon_ring = curve_obj('Moon ring', [np.c_[16.2 * np.cos(np.linspace(0, 2 * np.pi, 97)), 16.2 * np.sin(np.linspace(0, 2 * np.pi, 97)),
                                           np.zeros(97)]], 0.9, emissive('Moon ring glow', '#FFE2A0', 3.0)[0], closed=True)
moon_ring.parent = moon


def cloud(name, at, size, hexcol, seed, glow=0.0):
    r = np.random.default_rng(seed)
    root = empty(name, at)
    mat = knit_mat(name + ' knit', hexcol, coords='XZ', spm=(0.35 / size * 10, 0.5 / size * 10), bump=0.8, dist=0.4, sheen=1.0,
                   dark=0.5, emis=glow)
    for k in range(9):
        rr = size * r.uniform(0.28, 0.5)
        ob = sphere(f'{name} puff {k}', 1.0, mat, 24, 12)
        ob.scale = (rr * r.uniform(1.1, 1.5), rr * 0.8, rr * r.uniform(0.75, 0.95))
        ob.location = (r.uniform(-1, 1) * size * 0.9, r.uniform(-0.2, 0.2) * size, r.uniform(-0.15, 0.35) * size)
        ob.parent = root
    return root


CLOUDS = [cloud('Cloud A', mdir * 200 + Vector((-34, 0, -8)), 30, '#4C4F86', 1), cloud('Cloud B', mdir * 205 + Vector((40, -10, 22)), 26, '#5B5791', 2),
          cloud('Cloud C', Vector((-120, 150, 38)), 34, '#43467A', 3), cloud('Cloud D', Vector((150, 120, 52)), 30, '#535088', 4),
          cloud('Cloud E', Vector((-30, 210, 80)), 40, '#3E4174', 5)]
for k, c in enumerate(CLOUDS):
    p0 = c.location.copy()
    key_fn(c, 'location', 3, lambda f, p0=p0, k=k: tuple(p0 + Vector((0.6 * f / FPS * (1 if k % 2 else -1), 0, 0))), list(range(0, NF, 15)))

# the sea: Ocean modifier on a generated surface, knitted with object XY stitches; white boucle on the crests
SEA_PAL = ['#1F3A8A', '#2A4FB0', '#1E7F9C', '#2E9DB0', '#3B3F9E', '#185E8A']
sea_img = color_png('night_sea', sea_map(SEA_PAL, ['#7FD6DA', '#E8F4F2']))


def make_ocean(name, mat, size=4, spatial=60, res=10, seed=7):
    bpy.ops.mesh.primitive_plane_add(size=2)
    ob = bpy.context.active_object
    for c_ in ob.users_collection:
        c_.objects.unlink(ob)
    coll(CUR[0]).objects.link(ob)
    ob.name = name
    md = ob.modifiers.new('Ocean', 'OCEAN')
    md.geometry_mode = 'GENERATE'
    md.spatial_size = spatial
    md.repeat_x = md.repeat_y = size
    tryset(md, resolution=res, viewport_resolution=3, random_seed=seed, wave_scale=1.0, choppiness=1.1, wind_velocity=18.0,
           wave_alignment=0.35, wave_direction=math.radians(30), use_normals=True, spectrum='PHILLIPS', depth=200.0)
    ob.data.materials.append(mat)
    return ob, md


night_sea_mat = knit_mat('Night sea knit', img=sea_img, coords='XY', spm=(2.0, 2.8), bump=1.1, dist=0.12, rough=0.5, sheen=0.25,
                         foam=(0.45, 1.5, '#E6F3F8'), dark=0.35, heather=0.06)
night_sea, night_ocean = make_ocean('Night sea', night_sea_mat, size=8, spatial=30, res=10)
night_sea.location = (-120, -120, 0)


def sea_level(f):
    """wave height multiplier by shot: calm for A139, rising through A141b, calm again for the night of A144c"""
    s = shot_at(f)
    t = f / FPS
    if s == 'OPEN':
        return 1.5
    if s == 'A139':
        return 1.1
    if s == 'A140':
        return 1.3
    if s == 'A141b':
        a, b = SPAN['A141b']
        return 1.6 + 1.9 * smooth((f - a) / (b - a))
    if s == 'A142':
        return 2.2
    if s == 'A144c':
        return 0.9
    return 1.2


key_fn(night_sea, 'modifiers["Ocean"].time', 0, lambda f: f / FPS * 0.9 + 3.0)
key_fn(night_sea, 'modifiers["Ocean"].wave_scale', 0, sea_level, list(range(0, NF, 3)))
key_fn(night_sea, 'modifiers["Ocean"].choppiness', 0, lambda f: 1.0 + 0.25 * (sea_level(f) - 1), list(range(0, NF, 3)))
night_world_bits = [night_sky, moon, night_sea] + CLOUDS


# ================================================================================================ the knitted ship (no people aboard)
CUR[0] = 'Ship'
SHIP_SHOTS = ['OPEN', 'A139', 'A140', 'A141b', 'A142']
ship = empty('Ship', (-12, 8, 0))
HULL_L, HULL_B = 11.0, 2.3
hull_rows, hull_cols = 70, 40
Chull = bands(hull_cols, hull_rows, ['#F3E3C3', '#B5452B', '#E3A33B', '#6B3E26', '#2C8C83', '#B5452B', '#6B3E26'], [2, 4, 3, 5, 2, 3, 6], R)
for left in range(3, hull_rows, 9):
    stamp(Chull, DIAMOND, {'a': '#F3E3C3', 'b': '#2C8C83'}, 13, left)
hull_img = color_png('hull', Chull)
deck_img = color_png('deck', bands(16, 70, ['#8A5A3B', '#A06A42', '#7A4E33', '#94603E'], [4, 4, 4, 4], R))
hull_mat = knit_mat('Hull knit', img=hull_img, coords='UV', spm=(hull_rows, hull_cols * 35 / 26), bump=1.0, dist=0.05)
deck_mat = knit_mat('Deck knit', img=deck_img, coords='XY', spm=(6.2, 6.2), bump=1.0, dist=0.035, tile='rib')


def hull_ring(s):
    b = HULL_B * max(0.02, math.sin(math.pi * s)) ** 0.62
    zd = 1.25 + 1.6 * abs(2 * s - 1) ** 3.2                    # the deck sweeps up at bow and stern
    zk = -1.15 * max(0.05, math.sin(math.pi * s)) ** 0.45
    pts = []
    n_u = 26
    for i in range(n_u + 1):                                   # the U from port gunwale round the keel to starboard
        ph = math.pi * i / n_u
        y = -b * math.cos(ph)
        z = zd - (zd - zk) * max(0.0, math.sin(ph)) ** 0.75
        pts.append((0, y, z))
    for i in range(1, 9):                                      # back across the deck, a little below the gunwale
        y = b - 2 * b * i / 9
        pts.append((0, y, zd - 0.28))
    x = (s - 0.5) * HULL_L
    return np.array([(x, p[1], p[2]) for p in pts])


hull = loft('Hull', [hull_ring(0.015 + 0.97 * k / 47) for k in range(48)], [hull_mat, deck_mat],
            mat_of_face=lambda i, j, c: 1 if j >= 26 else 0)
hull.parent = ship
# gunwale cords, stem and stern posts
gun = []
for side in (-1, 1):
    pts = []
    for k in range(48):
        r_ = hull_ring(0.015 + 0.97 * k / 47)
        pts.append(r_[0] if side < 0 else r_[26])
    gun.append(np.array(pts) + np.array([0, 0, 0.06]))
cord_mat = knit_mat('Cord', '#F3E3C3', coords='UV', spm=(400, 6), bump=1.2, dist=0.02)
for k, g in enumerate(gun):
    curve_obj(f'Gunwale {k}', [g], 0.09, cord_mat).parent = ship
for sgn in (-1, 1):
    t = np.linspace(0, 1, 20)
    x0 = sgn * HULL_L * 0.485
    pts = np.c_[x0 + sgn * 0.9 * np.sin(t * 1.4), np.zeros(20), 2.6 + 1.6 * t - 0.5 * t ** 2]
    curve_obj(f'Post {sgn}', [pts], 0.16, knit_mat(f'Post knit {sgn}', '#6B3E26', coords='UV', spm=(60, 8), bump=1, dist=0.02)).parent = ship
# mast, yard, sail, rigging
wood = felt('Wood felt', '#8C5A34', 30)
mast = cylinder('Mast', 0.16, 0.11, 8.2, wood)
mast.location = (0.6, 0, 1.1 + 4.1)
mast.parent = ship
yard = cylinder('Yard', 0.09, 0.09, 6.2, wood)
yard.rotation_euler = (math.radians(90), 0, 0)
yard.location = (0.75, 0, 8.4)
yard.parent = ship
Csail = bands(40, 46, ['#F6E9D2', '#F2A93B', '#F6E9D2', '#C2512E', '#F6E9D2', '#2C8C83'], [6, 3, 6, 3, 6, 2], R).transpose(1, 0, 2).copy()
stamp(Csail, STAR7, {'a': '#F2A93B', 'b': '#C2512E', 'c': '#FFF6E0'}, 16, 19)
sail_img = color_png('sail', Csail)
sail_mat = knit_mat('Sail knit', img=sail_img, coords='UV', spm=(40, 46), bump=0.9, dist=0.04, sss=0.25)
sail = grid('Sail', 5.8, 4.0, 28, 24, sail_mat)
for v in sail.data.vertices:                                   # hang in the YZ plane under the yard, billowed forward
    y, z = v.co.x, v.co.y
    u = (z + 2.0) / 4.0
    v.co = Vector((0.9 * math.sin(math.pi * u) * (1 - (y / 2.9) ** 2) + 0.15, y, z))
sail.location = (0.75, 0, 8.3 - 2.1)
sail.parent = ship
sail.data.update()
sail_sk = sail.shape_key_add(name='Basis')
sail_sk2 = sail.shape_key_add(name='Gust')
for i, v in enumerate(sail.data.vertices):
    co = sail_sk.data[i].co
    u = (co.z + 2.0) / 4.0
    sail_sk2.data[i].co = co + Vector((0.45 * math.sin(math.pi * u) * (1 - (co.y / 2.9) ** 2), 0, 0))
key_fn(sail.data.shape_keys, 'key_blocks["Gust"].value', 0, lambda f: 0.5 + 0.5 * math.sin(f / 11.0) * math.sin(f / 23.0 + 1), list(range(0, NF, 3)))
rig = knit_mat('Rigging', '#E9D9B8', coords='UV', spm=(300, 4), bump=1, dist=0.01)
for a_, b_ in (((0.6, 0, 9.2), (5.3, 0, 2.7)), ((0.6, 0, 9.2), (-5.2, 0, 2.9)), ((0.6, 0, 9.0), (0.4, 2.1, 1.4)), ((0.6, 0, 9.0), (0.4, -2.1, 1.4))):
    pts = np.array([np.array(a_) + (np.array(b_) - np.array(a_)) * t for t in np.linspace(0, 1, 16)])
    pts[:, 2] -= 0.25 * np.sin(np.linspace(0, np.pi, 16))
    curve_obj('Rope', [pts], 0.03, rig).parent = ship
# the lantern at the bow post: brass felt cage, amber glow, a warm point light that flickers
lan = empty('Lantern', (4.9, 0, 3.6))
lan.parent = ship
lan_glass, lan_em = emissive('Lantern glow', '#FFB54A', 9.0)
g_ = cylinder('Lantern glass', 0.2, 0.2, 0.45, lan_glass)
g_.parent = lan
for z_ in (-0.27, 0.27):
    cap = cylinder('Lantern cap', 0.26, 0.14 if z_ > 0 else 0.26, 0.1, felt('Brass felt', '#B8862E', 40))
    cap.location = (0, 0, z_)
    cap.parent = lan
lan_light = point('Lantern light', (0, 0, 0), 260, '#FFB04A', 0.25)
lan_light.parent = lan
key_fn(lan_light.data, 'energy', 0, lambda f: 260 * (0.85 + 0.15 * math.sin(f * 0.9) * math.sin(f * 0.37 + 2)), list(range(0, NF, 2)))

# cargo: knitted sacks, barrels, jars, crates and a coil of rope (A140)
CUR[0] = 'Cargo'
cargo = []
def barrel(name, r, h, col, band):
    prof = [(0.0, -h / 2), (r * 0.86, -h / 2), (r, 0), (r * 0.86, h / 2), (0.0, h / 2)]
    prof = [(r * 0.86, -h / 2)] + [(r * (0.86 + 0.14 * math.sin(math.pi * k / 10)), -h / 2 + h * k / 10) for k in range(1, 10)] + [(r * 0.86, h / 2)]
    img = color_png(name, bands(12, 28, [col, col, band, col], [4, 2, 1, 5], R))
    ob = lathe(name, prof, knit_mat(name + ' knit', img=img, coords='UV', spm=(28, 12), bump=1, dist=0.03), seg=28)
    return ob


def sack(name, size, col):
    ob = sphere(name, 1.0, knit_mat(name + ' knit', col, coords='XZ', spm=(9, 12), bump=1.1, dist=0.03, tile='seed'), 28, 14)
    ob.scale = (size * 0.9, size * 0.75, size * 0.62)
    tie = cylinder(name + ' tie', 0.09 * size, 0.18 * size, 0.42 * size, felt(name + ' tie felt', '#C9A24E', 40))
    tie.location = (0, 0, 0.62)
    tie.scale = (1 / 0.9 / size * size, 1 / 0.75, 1 / 0.62)
    tie.parent = ob
    return ob


def jar(name, h, col, stripe):
    prof = [(0.12 * h, 0), (0.30 * h, 0.12 * h), (0.36 * h, 0.4 * h), (0.27 * h, 0.72 * h), (0.12 * h, 0.86 * h), (0.11 * h, 0.95 * h),
            (0.15 * h, 1.0 * h)]
    img = color_png(name, bands(16, 26, [col, col, stripe, col, '#F3E3C3'], [3, 3, 2, 4, 1], R))
    return lathe(name, prof, knit_mat(name + ' knit', img=img, coords='UV', spm=(26, 16), bump=1, dist=0.02), seg=26)


def crate(name, s, col):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0, calc_uvs=True)
    bmesh.ops.bevel(bm, geom=list(bm.edges), offset=0.08, segments=3, affect='EDGES')
    ob = mesh_obj(name, bm, [knit_mat(name + ' knit', col, coords='XZ', spm=(8, 11), bump=1.1, dist=0.03, tile='rib')])
    ob.scale = (s, s * 0.9, s * 0.8)
    return ob


DECK_Z = 1.0
items = [(barrel('Barrel 1', 0.5, 1.2, '#A2703C', '#3B2A20'), (-3.6, 1.1, DECK_Z + 0.6), 0),
         (barrel('Barrel 2', 0.5, 1.2, '#7E4E8C', '#F2B33D'), (-2.6, -1.15, DECK_Z + 0.6), 0.4),
         (barrel('Barrel 3', 0.45, 1.05, '#2C8C83', '#F3E3C3'), (2.4, 1.15, DECK_Z + 0.52), 0.2),
         (sack('Sack 1', 0.75, '#D9C29A'), (-1.6, 1.25, DECK_Z + 0.4), 0.3), (sack('Sack 2', 0.7, '#E2A66B'), (-1.3, -1.3, DECK_Z + 0.38), 1.2),
         (sack('Sack 3', 0.62, '#C8A878'), (1.5, -1.25, DECK_Z + 0.36), 2.0), (sack('Sack 4', 0.55, '#E86A8A'), (3.2, 0.95, DECK_Z + 0.32), 0.7),
         (jar('Jar 1', 1.3, '#C8643C', '#F2B33D'), (-4.3, -0.9, DECK_Z), 0), (jar('Jar 2', 1.1, '#E08A4E', '#2C8C83'), (-0.4, 1.35, DECK_Z), 0),
         (jar('Jar 3', 1.2, '#B5452B', '#F3E3C3'), (3.6, -0.9, DECK_Z), 0),
         (crate('Crate 1', 0.95, '#6E9A44'), (-2.9, 0.1, DECK_Z + 0.42), 0.15), (crate('Crate 2', 0.8, '#3E6FB0'), (2.0, 0.1, DECK_Z + 0.36), -0.2)]
for ob, loc, rz in items:
    ob.location = loc
    ob.rotation_euler = (0, 0, rz)
    ob.parent = ship
    cargo.append(ob)
t = np.linspace(0, 1, 400)
coil = np.c_[(0.25 + 0.35 * t) * np.cos(t * 2 * np.pi * 6), (0.25 + 0.35 * t) * np.sin(t * 2 * np.pi * 6), 0.06 + 0.02 * np.sin(t * 40)]
rc = curve_obj('Rope coil', [coil], 0.06, cord_mat)
rc.location = (0.9, -1.1, DECK_Z + 0.02)
rc.parent = ship
CUR[0] = 'Ship'


def ship_state(f):
    """the ship's own sway on the sea: (location, rotation); stronger in the storm"""
    t = f / FPS
    lv = sea_level(f)
    k = 0.6 + 0.55 * (lv - 1)
    pitch = math.radians(3.5 * k) * math.sin(t * 1.3) + math.radians(1.5 * k) * math.sin(t * 2.9 + 1)
    roll = math.radians(4.5 * k) * math.sin(t * 1.05 + 0.5) + math.radians(1.2 * k) * math.sin(t * 2.3)
    heave = 0.35 * k * math.sin(t * 1.3 + 0.8)
    x = -12 + 0.9 * t
    return Vector((x, 8, -0.15 + heave)), Euler((roll, pitch, math.radians(4)))


key_fn(ship, 'location', 3, lambda f: tuple(ship_state(f)[0]))
key_fn(ship, 'rotation_euler', 3, lambda f: tuple(ship_state(f)[1]))
for ob in [ship] + list(ship.children_recursive):
    visible_keys(ob, spans(*SHIP_SHOTS))


# ================================================================================================ the knitted whale
CUR[0] = 'Whale'
WL = 14.0
S_H = 0.70                                                    # the jaw hinge (just behind the eye)
_sp = [0.00, 0.05, 0.15, 0.30, 0.45, 0.60, 0.72, 0.82, 0.90, 0.96, 1.00]
_rp = [0.16, 0.22, 0.42, 0.82, 1.18, 1.38, 1.42, 1.32, 1.08, 0.72, 0.22]


def w_r(s):
    return float(np.interp(s, _sp, _rp))


def w_zm(s):
    return -0.18 * w_r(s)                                     # the mouth line


NW = 48
WROWS = 110


def whale_ring(s, part):
    r = w_r(s)
    th = np.linspace(0, 2 * np.pi, NW, endpoint=False)
    y = 0.92 * r * np.cos(th)
    z = r * np.sin(th)
    if s > 0.80:                                              # a flatter, knobbly head top
        z = np.where(z > 0, z * (1 - 0.3 * (s - 0.8) / 0.2), z)
    x = np.full(NW, (s - 0.5) * WL)
    if part == 'body' and s > S_H:
        z = np.maximum(z, w_zm(s))
    if part == 'jaw':
        z = np.minimum(z, w_zm(s))
    return np.c_[x, y, z]


# colour map: columns around (v = 0 on the left flank, a quarter round = the back), rows along (row 0 = the snout end)
Cw = np.zeros((WROWS, NW, 3), np.float32)
rw = np.random.default_rng(21)
for j in range(WROWS):
    s = 1 - j / (WROWS - 1)
    for i in range(NW):
        th = 360 * i / NW
        sn = math.sin(math.radians(th))
        if sn > 0.55:
            c = '#3346B0'
            if rw.random() < 0.035:
                c = ['#3FC1C9', '#FFFFFF', '#F2B33D'][int(rw.integers(0, 3))]
        elif sn > 0.18:
            c = '#4A64CC'
        elif sn > -0.30:
            c = '#7A92EA'
        else:
            c = ('#FFF3DE' if (i // 2) % 2 == 0 else '#CDEFF0') if s > 0.52 else '#FFF3DE'
        Cw[j, i] = hexrgb(c) * (1 + rw.normal(0, 0.03))
# a Fair Isle band along each flank and gold stars down the back
for i0 in (int(NW * 22 / 360), int(NW * 140 / 360)):
    for top in range(18, 96, 6):
        stamp(Cw, DIAMOND, {'a': '#F2B33D', 'b': '#E86A8A'}, top, i0 - 2, wrap=True)
for top in range(14, 90, 11):
    stamp(Cw, STAR5, {'a': '#F2B33D', 'b': '#FFF2D0'}, top, NW // 4 - 2)
whale_img = color_png('whale', np.clip(Cw, 0, 1))
whale_mat = knit_mat('Whale knit', img=whale_img, coords='UV', spm=(NW, WROWS), bump=1.15, dist=0.035, sheen=1.0, dark=0.36)
mouth_mat = knit_mat('Mouth knit', '#B8364F', coords='UV', spm=(NW, WROWS), tile='rib', bump=1.0, dist=0.03, dark=0.45)
tongue_mat = knit_mat('Tongue knit', '#EE7F95', coords='UV', spm=(NW, WROWS), tile='seed', bump=1.0, dist=0.03)


def whale_loft(name, part, s0, s1, nrows, mats, mouth_index):
    ss = np.linspace(s0, s1, nrows)
    rings = [whale_ring(s, part) for s in ss]

    def mof(i, j, c):
        s = ss[min(i, len(ss) - 1)]
        if s > S_H + 1e-3 and abs(c.z - w_zm(s)) < 0.02 + 0.02 * w_r(s) and part == 'body':
            return mouth_index
        if part == 'jaw' and c.z > w_zm(s) - 0.02 - 0.02 * w_r(s):
            return mouth_index
        return 0
    ob = loft(name, rings, mats, cap0=True, cap1=True, mat_of_face=mof)
    uvl = ob.data.uv_layers[0].data
    for lp in uvl:                                             # u along -> stitch rows (scaled to the body's span), v around -> columns
        u, v = lp.uv
        lp.uv = (v, s0 + (s1 - s0) * u)
    return ob


whale = empty('Whale')
body = whale_loft('Whale body', 'body', 0.0, 1.0, 120, [whale_mat, mouth_mat], 1)
body.parent = whale
jaw_pivot = empty('Whale jaw pivot', ((S_H - 0.5) * WL, 0, w_zm(S_H)))
jaw_pivot.parent = whale
jaw = whale_loft('Whale jaw', 'jaw', S_H, 1.0, 40, [whale_mat, tongue_mat], 1)
jaw.parent = jaw_pivot
jaw.location = (-(S_H - 0.5) * WL, 0, -w_zm(S_H))
add_fuzz(body, 26000, 0.045, 0, children=5, radius=0.0025, seed=3)
# button eyes with a felt ring, bobble tubercles, a fringe of baleen yarn under the palate
eye_mat = glossy('Eye gloss', '#0B0B14', 0.08)
ring_mat = felt('Eye ring', '#FFF3DE', 40)
for side in (-1, 1):
    s_e = 0.80
    pe = Vector(((s_e - 0.5) * WL, side * 0.92 * w_r(s_e) * 0.97, w_zm(s_e) + 0.28))
    e_ = sphere(f'Eye {side}', 0.16, eye_mat, 24, 12)
    e_.location = pe + Vector((0, side * 0.02, 0))
    e_.parent = body
    ring = curve_obj(f'Eye ring {side}', [np.c_[0.21 * np.cos(np.linspace(0, 2 * np.pi, 33)), np.zeros(33), 0.21 * np.sin(np.linspace(0, 2 * np.pi, 33))]],
                     0.045, ring_mat, closed=True)
    ring.location = pe
    ring.parent = body
    hl = sphere(f'Eye light {side}', 0.04, emissive('Eye light', '#FFFFFF', 3)[0], 12, 6)
    hl.location = pe + Vector((0.06, side * 0.14, 0.07))
    hl.parent = body
bob_mats = [felt('Bobble teal', '#3FC1C9', 50), felt('Bobble gold', '#F2B33D', 50), felt('Bobble cream', '#FFF3DE', 50)]
for k in range(22):
    s_b = 0.84 + 0.15 * rw.random()
    th = math.radians(55 + 70 * rw.random())
    r_ = w_r(s_b)
    zz = r_ * math.sin(th) * (1 - 0.3 * (s_b - 0.8) / 0.2)
    b_ = sphere(f'Bobble {k}', 0.07 + 0.04 * rw.random(), bob_mats[k % 3], 14, 8)
    b_.location = ((s_b - 0.5) * WL, 0.92 * r_ * math.cos(th), zz)
    b_.parent = body
fr = []
for side in (-1, 1):
    for s_f in np.linspace(S_H + 0.04, 0.97, 26):
        y0 = side * 0.92 * w_r(s_f) * 0.86
        x0 = (s_f - 0.5) * WL
        z0 = w_zm(s_f)
        n_ = 7
        fr.append(np.c_[np.full(n_, x0) + 0.02 * np.sin(np.arange(n_)), np.linspace(y0, y0 * 0.93, n_), np.linspace(z0, z0 - 0.42, n_)])
baleen = curve_obj('Baleen', fr, 0.022, knit_mat('Baleen yarn', '#F1E6CF', coords='UV', spm=(60, 4), bump=1, dist=0.01), res=2, bevel_res=1)
baleen.parent = body


def fin_loft(name, length, chord, thick, spine, nl=24, nc=20):
    rings = []
    for k in range(nl):
        l = k / (nl - 1)
        c = Vector(spine(l))
        ch = chord(l)
        th_ = thick(l)
        a = np.linspace(0, 2 * np.pi, nc, endpoint=False)
        pts = np.c_[c.x + 0.5 * ch * np.cos(a), np.full(nc, c.y), c.z + 0.5 * th_ * np.sin(a)]
        rings.append(pts)
    Cf = np.zeros((40, nc, 3), np.float32)
    for i in range(nc):
        sn = math.sin(2 * math.pi * i / nc)
        Cf[:, i] = hexrgb('#26307A' if sn > 0.15 else ('#5E74D8' if sn > -0.15 else '#FFF3DE'))
    for j in range(0, 40, 5):
        Cf[j, :] = np.where(Cf[j, :].sum(1, keepdims=True) > 2.0, hexrgb('#CDEFF0'), Cf[j, :])
    img = color_png(name, np.clip(Cf * (1 + rw.normal(0, 0.03, Cf.shape)), 0, 1))
    m = knit_mat(name + ' knit', img=img, coords='UV', spm=(nc, 40), bump=1.1, dist=0.03, sheen=1.0)
    ob = loft(name, rings, [m])
    uvl = ob.data.uv_layers[0].data
    for lp in uvl:
        u, v = lp.uv
        lp.uv = (v, u)
    return ob


fins = []
for side in (-1, 1):
    s_root = 0.64
    root = Vector(((s_root - 0.5) * WL, side * 0.92 * w_r(s_root) * 0.80, -0.45 * w_r(s_root)))
    piv = empty(f'Fin pivot {side}', root)
    piv.parent = whale
    fn = fin_loft(f'Fin {side}', 4.4, lambda l: 1.05 * (1 - l) ** 0.6 + 0.16, lambda l: 0.22 * (1 - l) + 0.05,
                  lambda l, side=side: (-1.4 * l ** 1.3, side * 4.2 * l, -0.5 * l))
    fn.parent = piv
    for k in range(7):                                         # the scalloped leading edge: bobbles
        l = 0.12 + 0.12 * k
        kb = sphere(f'Fin knob {side} {k}', 0.09 * (1 - 0.5 * l), bob_mats[2], 12, 6)
        kb.location = (-1.4 * l ** 1.3 + 0.5 * (1.05 * (1 - l) ** 0.6 + 0.16), side * 4.2 * l, -0.5 * l)
        kb.parent = fn
    fins.append(piv)
fl_piv = empty('Fluke pivot', (-0.5 * WL + 0.05, 0, 0))
fl_piv.parent = whale
for side in (-1, 1):
    fl = fin_loft(f'Fluke {side}', 2.6, lambda l: 1.25 * (1 - l) ** 0.75 + 0.14, lambda l: 0.2 * (1 - l) + 0.04,
                  lambda l, side=side: (-1.2 * l ** 1.6 - 0.1, side * 2.6 * l, 0.0), nl=20)
    fl.parent = fl_piv


def whale_pose(f, loc, rot, jaw_a, fin_a=0.0, fluke_a=None):
    t = f / FPS
    fluke = fluke_a if fluke_a is not None else 0.32 * math.sin(t * 2.4)
    return {'loc': tuple(loc), 'rot': tuple(rot), 'jaw': jaw_a, 'fin': fin_a + 0.12 * math.sin(t * 1.7), 'fluke': fluke}


# ================================================================================================ yarn spray (pompoms, curls, a boucle foam ring)
CUR[0] = 'Spray'
SPRAY_COLS = ['#FFFFFF', '#EAF7FB', '#C4EAF0', '#9FE0E6', '#FFFFFF', '#DDF2F7']
pom_mats = [felt(f'Pom {k}', c, 70, sheen=1.0) for k, c in enumerate(SPRAY_COLS)]
pom_mesh = []
for k in range(len(SPRAY_COLS)):
    o_ = sphere(f'Pom proto {k}', 1.0, pom_mats[k], 16, 8)
    pom_mesh.append(o_.data)
    bpy.data.objects.remove(o_)
BURSTS = []


def burst(name, t0, center, n, speed, up, spread_axis=None, life=1.6, size=(0.10, 0.28), g=9.0, seed=0, along=None):
    """n pompoms thrown from center at t0 (world). along=(dir vector, half length): emitters spread along a line (a body)."""
    r = np.random.default_rng(seed)
    f0 = SEC(t0)
    f1 = min(NF - 1, f0 + int(life * FPS) + 2)
    obs = []
    for k in range(n):
        ob = link(bpy.data.objects.new(f'{name} {k}', pom_mesh[k % len(pom_mesh)]))
        c = Vector(center)
        if along is not None:
            c = c + Vector(along[0]).normalized() * along[1] * r.uniform(-1, 1)
        a = r.uniform(0, 2 * math.pi)
        hv = speed * r.uniform(0.3, 1.0)
        v = Vector((math.cos(a) * hv, math.sin(a) * hv, up * r.uniform(0.5, 1.25)))
        sz = r.uniform(*size)
        dl = r.uniform(0, 0.15)
        frames = list(range(max(0, f0 - 1), f1 + 1))

        def st(f, c=c, v=v, sz=sz, dl=dl):
            u = max(0.0, (f - f0) / FPS - dl)
            p = c + v * u + Vector((0, 0, -0.5 * g * u * u))
            s_ = sz * (c01(u / 0.12)) * (1 - 0.5 * c01((u - life * 0.6) / (life * 0.4)))
            if p.z < -0.6 and u > 0.2:
                s_ *= max(0.0, 1 - (-0.6 - p.z) / 0.8)
            return tuple(p), s_
        sts = [st(f) for f in frames]
        for j in range(3):
            key_series(ob, 'location', j, frames, [x[0][j] for x in sts])
            key_series(ob, 'scale', j, frames, [x[1] for x in sts])
        visible_keys(ob, [(f0, f1)])
        obs.append(ob)
    BURSTS.append((name, f0, f1))
    return obs


foam_mat = knit_mat('Foam boucle', '#F4FBFF', coords='XY', spm=(5, 7), tile='seed', bump=1.6, dist=0.05, sheen=1.0, dark=0.6)


def foam_ring(name, t0, center, r0, r1, life=2.2, minor=0.35):
    f0 = SEC(t0)
    f1 = min(NF - 1, f0 + int(life * FPS))
    bm = bmesh.new()
    bmesh.ops.create_circle(bm, cap_ends=False, segments=64, radius=1.0)
    ring = curve_obj(name, [np.c_[np.cos(np.linspace(0, 2 * np.pi, 65)), np.sin(np.linspace(0, 2 * np.pi, 65)),
                                  0.04 * np.sin(np.linspace(0, 2 * np.pi * 9, 65))]], minor / r1, foam_mat, closed=True)
    bm.free()
    frames = list(range(f0, f1 + 1))
    key_fn(ring, 'location', 3, lambda f: tuple(Vector(center) + Vector((0, 0, -0.25 * c01((f - f0) / FPS / life)))), frames)
    key_fn(ring, 'scale', 3, lambda f: (lerp(r0, r1, ease_out((f - f0) / FPS / life)),) * 2 + (1 - 0.6 * c01((f - f0) / FPS / life),), frames)
    visible_keys(ring, [(f0, f1)])
    return ring


# ================================================================================================ the breach (OPEN) and the swallow (A142)
EVT = EV
T_UP, T_PEAK, T_CRASH = 0.78, 2.15, EVT['splash'] + 0.05


def breach_state(f):
    t = f / FPS
    if t < T_UP:
        u = ease_in(t / T_UP)
        p = vlerp((4.5, 12, -16), (5.2, 11, -5.6), 0.35 + 0.65 * u)
        pitch, roll, jaw_a = math.radians(74), 0.0, 0.0
    elif t < T_PEAK:
        u = ease_out((t - T_UP) / (T_PEAK - T_UP))
        p = vlerp((5.2, 11, -5.6), (6.8, 10.2, 6.3), u)
        pitch, roll = math.radians(lerp(74, 63, u)), math.radians(lerp(0, 55, u))
        jaw_a = 0.42 * smooth((t - T_UP) / 0.35) * (1 - smooth((t - (T_PEAK - 0.35)) / 0.45))
    elif t < T_CRASH:
        u = (t - T_PEAK) / (T_CRASH - T_PEAK)
        p = vlerp((6.8, 10.2, 6.3), (10.5, 9.5, -0.2), u)
        p = p + Vector((0, 0, 1.6 * math.sin(math.pi * u) * (1 - u)))
        p.z = lerp(6.3, -0.2, ease_in(u))
        pitch, roll, jaw_a = math.radians(lerp(63, -6, smooth(u))), math.radians(lerp(55, 118, smooth(u))), 0.0
    else:
        u = c01((t - T_CRASH) / 1.9)
        p = vlerp((10.5, 9.5, -0.2), (13.0, 9.0, -6.0), ease_out(u))
        pitch, roll, jaw_a = math.radians(lerp(-6, -20, u)), math.radians(lerp(118, 150, u)), 0.0
    fin_a = 0.35 * smooth((t - T_UP) / 0.6) * (1 - smooth((t - T_CRASH + 0.4) / 0.5))
    return whale_pose(f, p, (roll, -pitch, math.radians(8)), jaw_a, fin_a)


T_RISE = SPAN['A142'][0] / FPS + 0.15
T_SWALLOW = EVT['swallow']
T_DIVE = EVT['blame'] - 0.2
SW_BASE = Vector((ship_state(SEC(T_RISE))[0].x - 6.5, 12.0, 0))


def swallow_state(f):
    """beside the ship: up out of the sea jaws wide, the jaws close on «الحوت», it slides back under"""
    t = f / FPS
    base = SW_BASE
    if t < T_SWALLOW + 0.1:
        u = ease_out((t - T_RISE) / (T_SWALLOW - T_RISE + 0.1))
        p = base + Vector((0, 0, lerp(-9.5, 1.2, u)))
        pitch = math.radians(78)
        jaw_a = 0.62 * smooth((t - T_RISE) / 0.6) * (1 - smooth((t - T_SWALLOW + 0.05) / 0.22))
    elif t < T_DIVE:
        u = (t - T_SWALLOW - 0.1) / max(0.1, T_DIVE - T_SWALLOW - 0.1)
        p = base + Vector((0.3 * u, 0, 1.2 + 0.25 * math.sin(math.pi * u)))
        pitch, jaw_a = math.radians(78 - 4 * u), 0.0
    else:
        u = ease_in((t - T_DIVE) / 1.6)
        p = base + Vector((0.3 + 2.0 * u, 0, 1.2 - 12 * u))
        pitch, jaw_a = math.radians(74 - 10 * u), 0.0
    return whale_pose(f, p, (math.radians(-8), -pitch, math.radians(162)), jaw_a, -0.35)


# bursts: where the whale breaks out, where it lands, and beside the ship
burst('Spray up', T_UP - 0.05, (5.4, 11.2, 0.2), 90, 5.5, 9.5, seed=1, life=1.8, size=(0.18, 0.45))
burst('Spray crash', T_CRASH - 0.05, (9.5, 9.6, 0.3), 140, 7.5, 11.0, seed=2, life=2.0, along=((1, -0.1, 0), 6.0), size=(0.2, 0.55))
foam_ring('Foam up', T_UP, (5.4, 11.2, 0.15), 1.5, 7.0)
foam_ring('Foam crash', T_CRASH, (9.5, 9.6, 0.15), 3.0, 12.0, life=2.0, minor=0.5)
burst('Spray rise', T_RISE + 0.25, tuple(SW_BASE + Vector((0, 0, 0.2))), 80, 4.5, 8.0, seed=3, life=1.6, size=(0.15, 0.4))
foam_ring('Foam rise', T_RISE + 0.3, tuple(SW_BASE + Vector((0, 0, 0.15))), 1.4, 5.5)
burst('Spray dive', T_DIVE + 0.55, tuple(SW_BASE + Vector((0.8, 0, 0.2))), 50, 4.0, 6.0, seed=4, life=1.6)

# lightning: a zig-zag of glowing yarn in the sky and a flash (OPEN on the whale's call and the crash, A141b twice, A142 once)
CUR[0] = 'Night'
bolt_mat, bolt_em = emissive('Bolt yarn', '#EDE4FF', 0.0)
FLASHES = [(0.30, 0.22, (-40, 170, 60)), (EVT['splash'] - 0.02, 0.18, (70, 190, 70)),
           (SPAN['A141b'][0] / FPS + 0.35, 0.25, (-30, 160, 55)), (EVT['blame'] - 2.4, 0.2, (50, 180, 65)),
           (SPAN['A141b'][0] / FPS + 2.3, 0.2, (40, 175, 60))]
bolts = []
for k, (tf, dur, top) in enumerate(FLASHES):
    r_ = np.random.default_rng(40 + k)
    pts = [np.array(top, float)]
    for j in range(12):
        pts.append(pts[-1] + np.array([r_.uniform(-6, 6), r_.uniform(-2, 2), -6.0]))
    b = curve_obj(f'Bolt {k}', [np.array(pts)], 0.5, bolt_mat, res=1)
    visible_keys(b, [(SEC(tf), SEC(tf + dur) + 1)])
    bolts.append(b)


def flash(f):
    t = f / FPS
    v = 0.0
    for tf, dur, _ in FLASHES:
        if tf <= t <= tf + dur:
            u = (t - tf) / dur
            v = max(v, (1 - u) * (0.6 + 0.4 * math.sin(u * 30)))
    return v


key_node(bolt_em, 1, lambda f: 60 * flash(f))


# ================================================================================================ under the sea (A143, A144b)
CUR[0] = 'Under'
UW = Vector((-400, 0, 0))
UNDER_SHOTS = ['A143', 'A144b']
vol = bpy.data.materials.new('Sea volume')
vol.use_nodes = True
vnt = vol.node_tree
for n in list(vnt.nodes):
    if n.type != 'OUTPUT_MATERIAL':
        vnt.nodes.remove(n)
pv = vnt.nodes.new('ShaderNodeVolumePrincipled')
pv.inputs['Color'].default_value = rgba('#4FA8C8')
pv.inputs['Density'].default_value = 0.05
pv.inputs['Absorption Color'].default_value = rgba('#2A6A8A')
pv.inputs['Emission Color'].default_value = rgba('#1E5C80')
pv.inputs['Emission Strength'].default_value = 0.012
vnt.links.new(pv.outputs[0], vnt.nodes['Material Output'].inputs['Volume'])
bm = bmesh.new()
bmesh.ops.create_cube(bm, size=1.0)
vbox = mesh_obj('Sea volume box', bm, [vol], smooth=False)
vbox.scale = (220, 220, 110)
vbox.location = UW + Vector((0, 0, -55.3))
key_node(pv, pv.inputs.find('Density'), lambda f: 0.05 if shot_at(f) == 'A143' else 0.07, list(range(0, NF, 5)))
key_node(pv, pv.inputs.find('Emission Strength'), lambda f: 0.012 if shot_at(f) == 'A143' else 0.004, list(range(0, NF, 5)))
under_img = color_png('under_surface', sea_map(['#2BA6B0', '#3FBFC6', '#1E7F8C', '#4FC3C9', '#239AA6', '#5ED0D4'], ['#E8F4F2', '#FFFFFF'], n=48, rows=48))
surf = grid('Surface from below', 240, 240, 60, 60, knit_mat('Under surface knit', img=under_img, coords='XY', spm=(1.6, 2.2), bump=1.0,
                                                               dist=0.15, emis=1.4, rough=0.6))
surf.location = UW + Vector((0, 0, 0))
surf.rotation_euler = (math.pi, 0, 0)
JELLY = [('#FF7EB6', '#FFD1E6'), ('#7FE3F0', '#E2FBFF'), ('#B79BFF', '#EDE3FF'), ('#FFD27A', '#FFF2CF'), ('#FF9A7A', '#FFE0D4'),
         ('#7FE3F0', '#E2FBFF'), ('#FF7EB6', '#FFD1E6'), ('#B79BFF', '#EDE3FF')]
jellies = []
rj = np.random.default_rng(31)
for k, (c1, c2) in enumerate(JELLY):
    root = empty(f'Jelly {k}', UW + Vector((rj.uniform(-16, 14), rj.uniform(-2, 16), rj.uniform(-26, -6))))
    img = color_png(f'jelly{k}', bands(12, 24, [c1, c2, c1, '#FFFFFF'], [3, 2, 3, 1], rj))
    bell = lathe(f'Jelly bell {k}', [(0.02, 0.9), (0.45, 0.82), (0.8, 0.55), (0.95, 0.2), (0.98, 0.0), (0.8, 0.02)],
                 knit_mat(f'Jelly knit {k}', img=img, coords='UV', spm=(24, 12), bump=1.0, dist=0.02, emis=2.6, sss=0.5), seg=24)
    bell.parent = root
    ten = []
    for j in range(7):
        a = 2 * math.pi * j / 7
        tt = np.linspace(0, 1, 24)
        ln = rj.uniform(1.6, 3.2)
        ten.append(np.c_[0.6 * math.cos(a) + 0.18 * np.sin(tt * 9 + j), 0.6 * math.sin(a) + 0.18 * np.cos(tt * 9 + j), -ln * tt])
    tc_ = curve_obj(f'Jelly tentacles {k}', ten, 0.035, emissive(f'Jelly yarn {k}', c2, 2.2)[0], res=2, bevel_res=1)
    tc_.parent = root
    sc_ = rj.uniform(0.6, 1.2)
    p0 = root.location.copy()
    ph = rj.uniform(0, 6)
    key_fn(root, 'location', 3, lambda f, p0=p0, ph=ph: tuple(p0 + Vector((0.2 * math.sin(f / 40 + ph), 0, 0.5 * math.sin(f / 25 + ph)))),
           list(range(0, NF, 4)))
    key_fn(root, 'scale', 3, lambda f, sc_=sc_, ph=ph: (sc_ * (1 + 0.1 * math.sin(f / 7 + ph)), sc_ * (1 + 0.1 * math.sin(f / 7 + ph)),
                                                      sc_ * (1 - 0.12 * math.sin(f / 7 + ph))), list(range(0, NF, 2)))
    jellies.append(root)
bub_mat, _, _ = principled('Bubble', rgba('#DFF6FF'), rough=0.05, sheen=0.0)
bub_mat.node_tree.nodes['Principled BSDF'].inputs['Transmission Weight'].default_value = 0.9
bub_mat.node_tree.nodes['Principled BSDF'].inputs['Emission Color'].default_value = rgba('#CFF3FF')
bub_mat.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 0.4
bub_me = sphere('Bubble proto', 1.0, bub_mat, 12, 6)
bub_data = bub_me.data
bpy.data.objects.remove(bub_me)
for k in range(45):
    ob = link(bpy.data.objects.new(f'Bubble {k}', bub_data))
    x0, y0, z0 = rj.uniform(-12, 12), rj.uniform(-4, 12), rj.uniform(-30, -4)
    sp_ = rj.uniform(0.8, 2.2)
    rr = rj.uniform(0.04, 0.14)
    ob.scale = (rr, rr, rr)
    key_fn(ob, 'location', 3, lambda f, x0=x0, y0=y0, z0=z0, sp_=sp_: tuple(UW + Vector((x0 + 0.15 * math.sin(f / 9 + x0), y0,
                                                                                      -30 + ((z0 + 30 + sp_ * f / FPS) % 28)))), list(range(0, NF, 2)))
glide_a, glide_b = SPAN['A143']


def glide_state(f):
    """A143: the whale glides down past the jellyfish; in its last half second its dark flank sweeps across the lens"""
    u = (f - glide_a) / (glide_b - glide_a)
    p = UW + vlerp((19, 7, -9), (-8, 3.0, -18), ease_io(u))
    yaw = math.radians(180 - 10 * u)
    return whale_pose(f, p, (math.radians(6 * math.sin(u * 3)), -math.radians(-12), yaw), 0.06 * math.sin(u * 7) ** 2, 0.2)


def deep_state(f):
    """A144b: far below the surface the whale is a dark shape crossing above the lens"""
    a, b = SPAN['A144b']
    u = (f - a) / (b - a)
    p = UW + vlerp((14, 4, -24), (-12, 4, -27), u)
    return whale_pose(f, p, (0, math.radians(4), math.radians(180)), 0.0, 0.15)


# ================================================================================================ the belly (A144a): a ribbed knitted tunnel, its ribs lit by running gold
CUR[0] = 'Belly'
BL = Vector((0, 400, 0))
Cb = bands(64, 48, ['#5A1446', '#7A1F5E', '#8E2A6E', '#4A0F3A', '#6A1A52', '#A0377A'], [3, 2, 4, 2, 3, 2], R)
belly_img = color_png('belly', Cb)
belly_mat = knit_mat('Belly ribbing', img=belly_img, coords='UV', spm=(48, 160), tile='rib', bump=1.4, dist=0.06, dark=0.25, sheen=0.9)
rings = []
for k in range(80):
    u = k / 79
    c = BL + Vector((1.6 * math.sin(u * math.pi * 1.3), 46 * u, 1.0 * math.sin(u * math.pi * 2.1)))
    rr = 3.4 * (1 + 0.08 * math.sin(u * 40))
    a = np.linspace(0, 2 * np.pi, 48, endpoint=False)
    rings.append(np.c_[c.x + rr * np.cos(a), np.full(48, c.y), c.z + rr * 0.85 * np.sin(a)])
tunnel = loft('Belly tunnel', rings, [belly_mat], cap0=False, cap1=True)
for p in tunnel.data.polygons:
    p.flip()
uvl = tunnel.data.uv_layers[0].data
for lp in uvl:
    u, v = lp.uv
    lp.uv = (v, u)
RIBS = []
for k in range(14):
    u = 0.06 + k * 0.065
    c = BL + Vector((1.6 * math.sin(u * math.pi * 1.3), 46 * u, 1.0 * math.sin(u * math.pi * 2.1)))
    rr = 3.1
    a = np.linspace(0, 2 * np.pi, 97)
    m_rib = knit_mat(f'Rib knit {k}', '#7A2350', coords='UV', spm=(300, 6), bump=1.2, dist=0.03)
    rib = curve_obj(f'Belly rib {k}', [np.c_[c.x + rr * np.cos(a), np.full(97, c.y), c.z + rr * 0.85 * np.sin(a)]], 0.32, m_rib, closed=True)
    gm, gem = emissive(f'Rib gold {k}', '#FFC75A', 0.0)
    th = np.linspace(0, 2 * np.pi * 9, 600)
    sp_ = np.c_[c.x + (rr + 0.33 * np.cos(th * 1.0)) * np.cos(th / 9), c.y + 0.33 * np.sin(th), c.z + (rr + 0.33 * np.cos(th)) * 0.85 * np.sin(th / 9)]
    gold = curve_obj(f'Rib stitch {k}', [sp_], 0.028, gm, res=1, bevel_res=1)
    RIBS.append((u, gem))
ba, bb = SPAN['A144a']


def rib_glow(k, f):
    """the tasbih light: waves of gold run along the ribs, deepest first, and grow"""
    t = (f - ba) / FPS
    u = RIBS[k][0]
    wave = pulse(((t * 1.2 - (1 - u) * 1.4) % 1.6), 0.9)
    return (0.4 + 3.6 * wave) * c01(t / 0.5)


for k, (u, gem) in enumerate(RIBS):
    key_node(gem, 1, lambda f, k=k: rib_glow(k, f), list(range(ba - 1, bb + 1)))
bl_light = [point(f'Belly glow {k}', BL + Vector((0, 8 + 9 * k, 0)), 0.0, '#FF9AB8', 1.5) for k in range(4)]
for k, li in enumerate(bl_light):
    key_fn(li.data, 'energy', 0, lambda f, k=k: 500 * (0.3 + 0.7 * pulse((((f - ba) / FPS) * 1.2 - (1 - k / 4) * 1.4) % 1.6, 0.9)) * c01((f - ba) / 15),
           list(range(ba - 1, bb + 1)))


# ================================================================================================ the dawn: sky, sun, sea, sand (A145, A146)
CUR[0] = 'Dawn'
D = Vector((0, -400, 0))
DAWN_SHOTS = ['A145', 'A146']
dawn_img = color_png('dawn_sky', sky_map(['#FFD27A', '#FFBE7A', '#FFA48E', '#F99BB4', '#D8A2E2', '#A7A9EC'], SKY_COLS, SKY_ROWS, stars=False,
                                        seed=5, moon=(SKY_COLS * 0.25, SKY_ROWS * 0.86, 40), halo='#FFE3A0'))
dawn_sky, _ = sky_dome('Dawn sky', dawn_img, 1.25, center=D)
SUN_DIR = Vector((0.0, 1.0, 0.06)).normalized()
sun_disc = cylinder('Sun', 19, 19, 1.0, knit_mat('Sun knit', '#FFB347', coords='XY', spm=(0.7, 1.0), bump=0.8, dist=0.6, emis=1.7,
                                                  emis_col='#FFB347', dark=0.6), seg=48)
sun_disc.location = D + SUN_DIR * 236 + Vector((0, 0, 4))
sun_disc.rotation_euler = SUN_DIR.to_track_quat('Z', 'Y').to_euler()
DAWN_CLOUDS = [cloud('Dawn cloud A', D + Vector((-60, 200, 40)), 34, '#F7A6B8', 7, 0.5), cloud('Dawn cloud B', D + Vector((70, 210, 55)), 30, '#FFC9A0', 8, 0.5),
               cloud('Dawn cloud C', D + Vector((-130, 140, 30)), 30, '#E2A6E0', 9, 0.5), cloud('Dawn cloud D', D + Vector((140, 150, 34)), 32, '#FFB59A', 10, 0.5)]
dsea_img = color_png('dawn_sea', sea_map(['#1E8CA0', '#2AA7B5', '#4FC3C9', '#17788E', '#3BB4BE', '#239AA6'], ['#FFE3B0', '#FFFFFF']))
dawn_sea_mat = knit_mat('Dawn sea knit', img=dsea_img, coords='XY', spm=(2.0, 2.8), bump=1.0, dist=0.1, rough=0.7, sheen=0.5,
                        foam=(0.55, 1.2, '#FFF6E8'), dark=0.45)
dawn_sea, dawn_ocean = make_ocean('Dawn sea', dawn_sea_mat, size=4, spatial=50, res=10, seed=12)
dawn_sea.location = D + Vector((-100, -2, 0))
key_fn(dawn_sea, 'modifiers["Ocean"].time', 0, lambda f: f / FPS * 0.6)
key_fn(dawn_sea, 'modifiers["Ocean"].wave_scale', 0, lambda f: 0.55)
# the sand: a sloping beach into the water, gentle dunes; seed stitch in sand yarns, crochet shells and a starfish
Csand = bands(40, 40, ['#E8C38A', '#DDB077', '#F0D3A0', '#C99A63', '#E8C38A', '#F4DDB0'], [2, 3, 2, 1, 3, 2], R)
sand_img = color_png('sand', Csand)
sand_mat = knit_mat('Sand knit', img=sand_img, coords='XY', spm=(3.4, 4.6), tile='seed', bump=1.3, dist=0.06, dark=0.5, sheen=0.8)
sand = grid('Sand', 120, 80, 240, 160, sand_mat)
sand.location = D + Vector((0, -36, 0))
rs = np.random.default_rng(5)
ph = rs.uniform(0, 6, 6)


def sand_z(x, y):
    """height of the sand at dawn-set coords (x, y relative to D): the beach dips into the sea past y = -2"""
    if y > -2:
        base = 0.45 - 0.13 * (y + 2)
    else:
        base = 0.45 + 0.018 * (-y - 2)
    dunes = 0.28 * math.sin(x * 0.17 + ph[0]) * math.sin(y * 0.21 + ph[1]) + 0.12 * math.sin(x * 0.41 + y * 0.13 + ph[2])
    return max(-2.5, base + dunes * c01((-y - 4) / 12))


for v in sand.data.vertices:
    v.co.z = sand_z(v.co.x, v.co.y - 36)
sand.data.update()


shore = []
for k in range(3):
    xs = np.linspace(-60, 60, 140)
    ys = 2.2 + 0.5 * k + 0.35 * np.sin(xs * 0.25 + k)
    pts = np.c_[xs, ys, [0.12 + 0.04 * k] * len(xs)]
    sh = curve_obj(f'Shore foam {k}', [pts], 0.22 - 0.05 * k, foam_mat, res=2)
    sh.location = D
    key_fn(sh, 'location', 3, lambda f, k=k: tuple(D + Vector((0, 0.7 * math.sin(f / 30 + k * 1.3), 0))), list(range(0, NF, 3)))
    shore.append(sh)
star_mat = knit_mat('Starfish knit', '#F07A3E', coords='XY', spm=(14, 18), tile='seed', bump=1.2, dist=0.02)
props = []
for k, (x, y, s_, kind) in enumerate([(-3.2, -6.5, 0.5, 'star'), (4.5, -8.8, 0.35, 'shell'), (-6.5, -11, 0.4, 'shell'), (2.2, -4.6, 0.3, 'star'),
                                       (11.2, -26.5, 0.55, 'star'), (17.5, -28.5, 0.4, 'shell'), (12.2, -31.0, 0.3, 'shell')]):
    if kind == 'star':
        a = np.linspace(0, 2 * np.pi, 11)[:-1]
        rr_ = np.where(np.arange(10) % 2 == 0, 1.0, 0.42)
        cu = bpy.data.curves.new(f'Starfish {k}', 'CURVE')
        cu.dimensions = '2D'
        cu.fill_mode = 'BOTH'
        cu.extrude = 0.08
        cu.bevel_depth = 0.12
        cu.bevel_resolution = 4
        sp = cu.splines.new('POLY')
        sp.points.add(9)
        sp.points.foreach_set('co', np.c_[rr_ * np.cos(a + np.pi / 2), rr_ * np.sin(a + np.pi / 2), np.zeros(10), np.ones(10)].astype(np.float32).ravel())
        sp.use_cyclic_u = True
        cu.materials.append(star_mat)
        ob = link(bpy.data.objects.new(f'Starfish {k}', cu))
    else:
        ob = lathe(f'Shell {k}', [(0.01, 0.0), (0.7, 0.05), (0.9, 0.3), (0.6, 0.6), (0.02, 0.75)],
                   knit_mat(f'Shell knit {k}', '#F6B7C4', coords='UV', spm=(18, 8), tile='rib', bump=1.2, dist=0.02), seg=18)
    ob.location = D + Vector((x, y, sand_z(x, y) + 0.05))
    ob.scale = (s_, s_, s_)
    ob.rotation_euler = (0, 0, rs.uniform(0, 6))
    props.append(ob)

# the three darknesses as knitted curtains in front of the dawn (A145): belly (nearest), sea, night; they part in that order
CUR[0] = 'Curtains'
CUR_CAM = D + Vector((0, -17.0, 2.35))
cb_img = color_png('curtain_belly', bands(60, 40, ['#3A0E2A', '#5A1A45', '#4A1236', '#F2C04E', '#3A0E2A'], [5, 3, 4, 1, 3], R))
Ccs = sea_map(['#121C40', '#1B2C66', '#14566A', '#1C7C8A', '#123F63', '#2A2F80'], ['#7FD6DA', '#E8F4F2'], n=48, rows=60)
cs_img = color_png('curtain_sea', Ccs)
cn_img = color_png('curtain_night', sky_map(['#2C2766', '#1E2058', '#151A46', '#0C1132'], 48, 60, seed=9))
CURTAINS = [('belly', cb_img, 'rib', 1.9, EVT['part'] + 0.02), ('sea', cs_img, 'knit', 2.35, EVT['part'] + 0.55),
            ('night', cn_img, 'knit', 2.8, EVT['part'] + 1.1)]
curtain_obs = []
for k, (nm, img, tl, dist_, t0) in enumerate(CURTAINS):
    m = knit_mat(f'Curtain {nm}', img=img, coords='UV', spm=(40, 60), tile=tl, bump=1.3, dist=0.03, sss=0.35, dark=0.35, sheen=1.0)
    w_half = 0.55 * dist_ * 1.15 + 0.15
    hgt = 2.2 * dist_ * 1.15
    for side in (-1, 1):
        cg = grid(f'Curtain {nm} {side}', w_half, hgt, 30, 50, m)
        piv = empty(f'Curtain pivot {nm} {side}', CUR_CAM + Vector((0, dist_, 0)))
        cg.parent = piv
        cg.location = (side * w_half / 2, 0, 0)
        cg.rotation_euler = (math.radians(90), 0, 0)
        sk0 = cg.shape_key_add(name='Basis')
        sk1 = cg.shape_key_add(name='Folds')
        for i, v in enumerate(cg.data.vertices):
            x, y = v.co.x, v.co.y
            sk1.data[i].co = Vector((x * 0.45 + side * w_half * 0.275, y, 0.10 * math.sin((x + 3 * k) * 9.0) + 0.05 * math.sin(y * 3 + k)))
        sk0_def = [Vector((v.co.x, v.co.y, 0.03 * math.sin((v.co.x + 3 * k) * 9.0))) for v in cg.data.vertices]
        for i, co in enumerate(sk0_def):
            sk0.data[i].co = co
        f0 = SEC(t0)
        f1 = f0 + 26
        key_fn(cg.data.shape_keys, 'key_blocks["Folds"].value', 0, lambda f, f0=f0: ease_io((f - f0) / 26), list(range(SPAN['A145'][0], f1 + 2)))
        key_fn(piv, 'location', 3, lambda f, f0=f0, side=side, piv0=piv.location.copy(), w=w_half:
               tuple(piv0 + Vector((side * (w * 1.15 + 0.4) * ease_in(c01((f - f0) / 26) ** 0.8), 0, 0.15 * pulse((f - f0) / 26, 1)))),
               list(range(SPAN['A145'][0], f1 + 2)))
        visible_keys(piv, [(SPAN['A145'][0], f1 + 1)])
        visible_keys(cg, [(SPAN['A145'][0], f1 + 1)])
        curtain_obs.append(cg)
    seam_m, seam_em = emissive(f'Seam light {nm}', '#FFE3A0', 0.0)
    seam = curve_obj(f'Seam {nm}', [np.c_[np.zeros(20), np.zeros(20), np.linspace(-hgt / 2, hgt / 2, 20)]], 0.012 * dist_, seam_m)
    seam.location = CUR_CAM + Vector((0, dist_ - 0.02, 0))
    f0 = SEC(t0)
    key_node(seam_em, 1, lambda f, f0=f0: 40 * pulse((f - f0 + 8) / 14, 1.0), list(range(max(0, f0 - 10), f0 + 12)))
    visible_keys(seam, [(max(SPAN['A145'][0], f0 - 9), f0 + 8)])


SHORE_T = (SPAN['A145'][0] / FPS + 0.2, EVT['shore'] + 1.8, EVT['ill'] - 0.25, EVT['end145'])


def shore_state(f):
    """A145: the whale swims in to the shore, opens its mouth to the open shore, closes it, turns back to the sea"""
    t = f / FPS
    a0, t_open, t_close, t_end = SHORE_T
    land = D + Vector((1.5, 5.0, 0.85))
    far = D + Vector((14, 60, -1.6))
    if t < t_open + 0.4:
        u = ease_out((t - a0) / (t_open + 0.4 - a0))
        p = far.lerp(land, u)
        yaw = math.radians(-58 - 25 * (1 - u))
        pitch = math.radians(4 * math.sin(u * 6))
        jaw_a = 0.0
    elif t < t_close + 0.5:
        lift = smooth((t - t_open + 0.3) / 0.5) * (1 - smooth((t - t_close - 0.2) / 0.6))
        p = land + Vector((0, 0, 0.12 * math.sin((t - t_open) * 1.8) + 0.5 * lift))
        yaw, pitch = math.radians(-58), math.radians(-4 + 16 * lift)
        jaw_a = 0.55 * smooth((t - t_open - 0.2) / 0.55) * (1 - smooth((t - t_close) / 0.5))
    else:
        u = ease_io((t - t_close - 0.5) / max(0.5, (SPAN['A145'][1] / FPS) - t_close - 0.5))
        p = land.lerp(D + Vector((-14, 40, -2.5)), u)
        yaw = math.radians(-58 + 140 * smooth(u * 1.3))
        pitch, jaw_a = math.radians(-6 + 8 * u), 0.0
    return whale_pose(f, p, (0, -pitch, yaw), jaw_a, 0.2)


# ================================================================================================ the gourd vine (A146)
CUR[0] = 'Vine'
VR = Vector((13.0, -30.0, 0))                                 # the root, dawn-set coords
vr = np.random.default_rng(146)
VR.z = sand_z(VR.x, VR.y)
VG0, VG1 = EVT['grow'] + 0.35, EVT['gourd'] + 1.2
STEMS = []
for i in range(5):                                            # five runners arch out of the root towards the sea, a gourd bush
    a_ = math.radians(78 + (i - 2) * 36 + vr.normal(0, 5))
    L_ = vr.uniform(1.7, 2.4)
    H_ = vr.uniform(0.65, 1.05)
    uu = np.linspace(0, 1, 70)
    xs = VR.x + L_ * uu * math.cos(a_) + 0.12 * np.sin(uu * 7 + i)
    ys = VR.y + L_ * uu * math.sin(a_) + 0.12 * np.cos(uu * 6 + i)
    zs = np.array([sand_z(x, y) for x, y in zip(xs, ys)]) + 0.04 + H_ * np.sin(np.pi * np.minimum(1, uu * 1.05)) ** 0.8 * (1 - 0.25 * uu)
    STEMS.append((np.c_[xs, ys, zs], a_, VG0 + 0.3 * i))
stem_mat = knit_mat('Stem knit', '#3F8F2A', coords='XY', spm=(30, 40), tile='rib', bump=1.0, dist=0.01)
stem_obs = []
for i, (pts_, a_, t0) in enumerate(STEMS):
    so = curve_obj(f'Vine stem {i}', [pts_ + np.array([D.x, D.y, 0])], 0.05, stem_mat, res=4, bevel_res=3)
    so.data.bevel_factor_mapping_end = 'SPLINE'
    stem_obs.append((so, t0))


def grow_s(i, f):
    t0 = STEMS[i][2]
    return ease_io(((f / FPS) - t0) / (VG1 - 0.6 - t0))


leaf_img = color_png('leaf', bands(30, 30, ['#1F8A2A', '#2FA035', '#166B22', '#2FA035', '#4DBA3A'], [3, 3, 1, 3, 1], vr))


def leaf_obj(name, size, seed):
    """a broad gourd leaf: a five-lobed heart, filled and bevelled (stuffed knit), with a pale vein cord"""
    th = np.linspace(0, 2 * np.pi, 120, endpoint=False)
    r_ = 1 + 0.18 * np.cos(5 * th) - 0.35 * np.exp(-((th - 3 * np.pi / 2) / 0.25) ** 2)
    x, y = r_ * np.cos(th), r_ * np.sin(th) + 0.95
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '2D'
    cu.fill_mode = 'BOTH'
    cu.extrude = 0.01
    cu.bevel_depth = 0.022
    cu.bevel_resolution = 2
    sp = cu.splines.new('POLY')
    sp.points.add(len(th) - 1)
    sp.points.foreach_set('co', np.c_[x * size, y * size, np.zeros_like(x), np.ones_like(x)].astype(np.float32).ravel())
    sp.use_cyclic_u = True
    cu.materials.append(knit_mat(name + ' knit', img=leaf_img, coords='XY', spm=(11 / size, 15 / size), bump=1.2, dist=0.015, sss=0.1, dark=0.45,
                                 sheen=0.4))
    ob = link(bpy.data.objects.new(name, cu))
    veins = []
    for a in (90, 40, 140, 0, 180):
        aa = math.radians(a)
        veins.append(np.c_[np.linspace(0, 0.9 * math.cos(aa), 10) * size, (np.linspace(0, 0.9 * math.sin(aa), 10)) * size + 0.95 * size * np.linspace(0, 0.3, 10),
                           np.full(10, 0.07 * size)])
    vn = curve_obj(name + ' veins', veins, 0.016 * size, felt('Vein', '#B9E07A', 40))
    vn.parent = ob
    return ob


LEAVES = []
for i, (pts_, a_, t0) in enumerate(STEMS):
    for j, u in enumerate((0.25, 0.55, 0.85)):
        k_ = min(len(pts_) - 1, int(u * (len(pts_) - 1)))
        base = Vector(pts_[k_]) + Vector((D.x, D.y, 0.02))
        side = 1 if (i + j) % 2 else -1
        lf = leaf_obj(f'Leaf {i} {j}', vr.uniform(0.42, 0.62), i * 10 + j)
        lf.location = base
        lf.rotation_euler = Euler((math.radians(vr.uniform(18, 38)), math.radians(side * vr.uniform(5, 20)),
                                   a_ + side * math.radians(vr.uniform(55, 95)) - math.pi / 2), 'XYZ')
        LEAVES.append((lf, i, u))
for j in range(3):                                            # three big leaves at the crown
    lf = leaf_obj(f'Crown leaf {j}', 0.55, 90 + j)
    lf.location = Vector((D.x + VR.x, D.y + VR.y, VR.z + 0.12))
    lf.rotation_euler = Euler((math.radians(28), 0, math.radians(-40 + 120 * j) - math.pi / 2), 'XYZ')
    LEAVES.append((lf, -1, 0.1 + 0.1 * j))
pet_mat = knit_mat('Petal knit', '#F7C531', coords='XY', spm=(40, 50), tile='seed', bump=1.0, dist=0.01, sss=0.3, emis=0.25)
ctr_mat = felt('Flower centre', '#E8781E', 60)
FLOWERS = []
for k, (i, u) in enumerate([(1, 0.55), (3, 0.5), (0, 0.9), (4, 0.75), (2, 0.35)]):
    pts_ = STEMS[i][0]
    k_ = min(len(pts_) - 1, int(u * (len(pts_) - 1)))
    root_ = empty(f'Flower {k}', Vector(pts_[k_]) + Vector((D.x, D.y, 0.12)))
    for j in range(5):
        pt = sphere(f'Petal {k} {j}', 1.0, pet_mat, 16, 8)
        a = 2 * math.pi * j / 5
        pt.scale = (0.2, 0.13, 0.04)
        pt.location = (0.18 * math.cos(a), 0.18 * math.sin(a), 0)
        pt.rotation_euler = (0, math.radians(-18), a)
        pt.parent = root_
    cc = sphere(f'Flower centre {k}', 0.08, ctr_mat, 12, 6)
    cc.parent = root_
    root_.rotation_euler = (math.radians(vr.uniform(10, 35)), 0, vr.uniform(0, 6))
    root_.location.z += 0.12
    FLOWERS.append((root_, i, u))
TENDRILS = []
for k, (i, u) in enumerate([(0, 0.35), (1, 0.75), (2, 0.6), (3, 0.3), (4, 0.5), (1, 0.25), (3, 0.85)]):
    pts_ = STEMS[i][0]
    k_ = min(len(pts_) - 1, int(u * (len(pts_) - 1)))
    base = Vector(pts_[k_])
    tt = np.linspace(0, 1, 60)
    a0 = vr.uniform(0, 6)
    rad = 0.07 * (1 - 0.7 * tt)
    spiral = np.c_[base.x + 0.18 * tt * math.cos(a0) + rad * np.cos(tt * 20 + a0), base.y + 0.18 * tt * math.sin(a0) + rad * np.sin(tt * 20 + a0),
                   base.z + 0.03 + 0.28 * tt]
    td = curve_obj(f'Tendril {k}', [spiral + np.array([D.x, D.y, 0])], 0.011, felt('Tendril', '#7CC24A', 50), res=3, bevel_res=2)
    td.data.bevel_factor_mapping_end = 'SPLINE'
    TENDRILS.append((td, i, u))
Cg = bands(20, 24, ['#5E9E33', '#7DB343', '#E4EFC0', '#7DB343', '#4E8A2A'], [2, 2, 1, 2, 2], vr).transpose(1, 0, 2).copy()
gourd = lathe('Gourd', [(0.01, 0.0), (0.22, 0.05), (0.30, 0.22), (0.27, 0.42), (0.17, 0.58), (0.13, 0.72), (0.16, 0.86), (0.10, 0.98), (0.02, 1.0)],
              knit_mat('Gourd knit', img=color_png('gourd', Cg), coords='UV', spm=(20, 24), bump=1.1, dist=0.02, gloss=0.6), seg=28)
gx, gy = VR.x + 0.55, VR.y + 0.35
gourd.location = D + Vector((gx, gy, sand_z(gx, gy) + 0.26))
gourd.rotation_euler = (math.radians(84), 0, math.radians(-25))
stalk = curve_obj('Gourd stalk', [np.array([[0, 0, 1.0], [0.02, 0.0, 1.08], [0.05, 0.02, 1.14]])], 0.03, stem_mat)
stalk.parent = gourd


def appear(i, u, f, lag=0.05, dur=0.45):
    """0..1 back-out pop once runner i has grown past u (i = -1: the crown, on a clock of its own)"""
    if i < 0:
        return back_out(((f / FPS) - (EVT['over'] + u * 2.0)) / dur, 1.7)
    if grow_s(i, f) < u:
        return 0.0
    lo, hi = SPAN['A146'][0], f
    while hi - lo > 1:
        mid = (lo + hi) // 2
        if grow_s(i, mid) >= u:
            hi = mid
        else:
            lo = mid
    return back_out(((f - hi) / FPS - lag) / dur, 1.7)


VF = list(range(SPAN['A146'][0], NF))
for i, (so, t0) in enumerate(stem_obs):
    key_fn(so.data, 'bevel_factor_end', 0, lambda f, i=i: max(0.001, grow_s(i, f)), VF)
for lf, i, u in LEAVES:
    key_fn(lf, 'scale', 3, lambda f, i=i, u=u: (max(0.001, appear(i, u, f)),) * 3, VF)
for fl, i, u in FLOWERS:
    key_fn(fl, 'scale', 3, lambda f, i=i, u=u: (max(0.001, appear(i, u, f, lag=0.35, dur=0.6)) * (1 + 0.05 * math.sin(f / 7)),) * 3, VF)
for td, i, u in TENDRILS:
    key_fn(td.data, 'bevel_factor_end', 0, lambda f, i=i, u=u: max(0.001, c01((grow_s(i, f) - u) / 0.25)), VF)
key_fn(gourd, 'scale', 3, lambda f: (max(0.001, back_out(((f / FPS) - EVT['gourd'] - 0.1) / 1.1, 1.3)) * 1.25,) * 3, VF)
COTY = []
for side in (-1, 1):                                          # two seed leaves first, the moment the reciter says «وأنبتنا»
    c_ = leaf_obj(f'Seed leaf {side}', 0.13, 50 + side)
    c_.location = D + VR + Vector((0, 0, 0.1))
    c_.rotation_euler = Euler((math.radians(40), 0, math.radians(90 + 90 * side) - math.pi / 2), 'XYZ')
    key_fn(c_, 'scale', 3, lambda f: (max(0.001, back_out(((f / FPS) - EVT['grow'] - 0.05) / 0.5, 2.0)),) * 3, VF)
    COTY.append(c_)
sprout = curve_obj('Sprout', [np.array([[0, 0, -0.05], [0.0, 0.01, 0.05], [0.0, 0.0, 0.11]]) + np.array(D + VR)], 0.035, stem_mat)
key_fn(sprout, 'scale', 3, lambda f: (1, 1, max(0.001, c01(((f / FPS) - EVT['grow'] + 0.1) / 0.4))), VF)
VINE_OBS = [gourd, sprout] + [x[0] for x in stem_obs] + [x[0] for x in LEAVES] + [x[0] for x in FLOWERS] + [x[0] for x in TENDRILS] + COTY


# ================================================================================================ the lots (A141a)
CUR[0] = 'Lots'
LOTS = Vector((400, 0, 0))
lots_deck = grid('Lots deck', 8, 8, 2, 2, knit_mat('Lots deck knit', img=deck_img, coords='XY', spm=(14, 14), tile='rib', bump=1.2, dist=0.012,
                                                    rough=0.38, dark=0.35))
lots_deck.location = LOTS
cup = lathe('Lot cup', [(0.16, 0.0), (0.17, 0.02), (0.18, 0.30), (0.17, 0.32), (0.155, 0.32), (0.155, 0.03), (0.01, 0.03)],
            knit_mat('Lot cup knit', img=color_png('cup', bands(16, 30, ['#C2512E', '#F2A93B', '#C2512E', '#2C8C83'], [3, 1, 3, 1], R)),
                     coords='UV', spm=(30, 16), tile='rib', bump=1.2, dist=0.006), seg=30)
la, lb = SPAN['A141a']
TIP = 0.30


def cup_state(f):
    t = (f - la) / FPS
    u = ease_in(c01(t / TIP))
    rx = math.radians(90) * u + math.radians(4) * pulse(t - TIP, 0.25)
    return (LOTS + Vector((0.25, 0.55, 0.0)) + Vector((0, 0, 0.17 * u)), (rx, 0, math.radians(-25)))


key_fn(cup, 'location', 3, lambda f: tuple(cup_state(f)[0]), list(range(la - 1, lb + 1)))
key_fn(cup, 'rotation_euler', 3, lambda f: cup_state(f)[1], list(range(la - 1, lb + 1)))
stick_mat = felt('Lot stick', '#D8B47A', 80)
red_mat = felt('Lot red', '#D92E3A', 60)
STICKS = []
rl = np.random.default_rng(141)
for k in range(8):
    st_ = cylinder(f'Lot stick {k}', 0.012, 0.012, 0.36, stick_mat, seg=12)
    if k == 0:
        tip = cylinder('Lot red tip', 0.0125, 0.0125, 0.06, red_mat, seg=12)
        tip.location = (0, 0, 0.155)
        tip.parent = st_
    end = LOTS + Vector((0.25 + rl.uniform(-0.35, 0.25), 0.55 + rl.uniform(-0.65, -0.1), 0.012))
    if k == 0:
        end = LOTS + Vector((0.02, -0.55, 0.012))
    yaw_end = rl.uniform(-0.6, 0.6) + (math.radians(-80) if k == 0 else 0)
    d0 = rl.uniform(0.0, 0.12)
    STICKS.append((st_, end, yaw_end, d0))


def stick_state(k, f):
    st_, end, yaw_end, d0 = STICKS[k]
    t = (f - la) / FPS
    mouth = LOTS + Vector((0.25, 0.25, 0.17))
    u = ease_out(c01((t - TIP * 0.7 - d0) / (0.65 if k else 1.25)))
    p = mouth.lerp(end, u)
    p.z = lerp(0.17, 0.012, c01(u * 1.6)) + 0.04 * pulse(u, 0.5)
    roll = (u * 7.0 if k == 0 else u * 2.0)
    return tuple(p), (math.radians(90), roll, math.radians(-25) * (1 - u) + yaw_end * u)


for k, (st_, *_rest) in enumerate(STICKS):
    key_fn(st_, 'location', 3, lambda f, k=k: stick_state(k, f)[0], list(range(la - 1, lb + 1)))
    key_fn(st_, 'rotation_euler', 3, lambda f, k=k: stick_state(k, f)[1], list(range(la - 1, lb + 1)))
lots_rope = curve_obj('Lots rope', [np.c_[np.linspace(-0.6, 1.2, 40), 0.9 + 0.1 * np.sin(np.linspace(0, 6, 40)), np.full(40, 0.03)]], 0.03, cord_mat)
lots_rope.location = LOTS
lots_bg = grid('Lots backdrop', 14, 9, 2, 2, knit_mat('Lots backdrop knit', img=night_img, coords='UV', spm=(90, 40), emis=1.6, bump=0.5,
                                                      dist=0.3, sheen=0.0))
lots_bg.location = LOTS + Vector((0, 6, 2.5))
lots_bg.rotation_euler = (math.radians(90), 0, 0)
bokeh = []
for k, (x, z, c) in enumerate([(-1.6, 0.9, '#FFB54A'), (2.2, 1.4, '#FFD27A'), (0.6, 2.2, '#FFB54A'), (-2.8, 1.8, '#BFD3FF')]):
    bo = sphere(f'Lots bokeh {k}', 0.09, emissive(f'Bokeh {k}', c, 12)[0], 12, 6)
    bo.location = LOTS + Vector((x, 4.0, z))
    bokeh.append(bo)
LOTS_OBS = [lots_deck, cup, lots_rope, lots_bg] + [x[0] for x in STICKS] + bokeh


# ================================================================================================ the whale through the reel
def whale_state(f):
    s = shot_at(f)
    if s == 'OPEN':
        return breach_state(f), True
    if s == 'A142':
        return swallow_state(f), True
    if s == 'A143':
        return glide_state(f), True
    if s == 'A144b':
        return deep_state(f), True
    if s == 'A145':
        return shore_state(f), True
    return whale_pose(f, (0, 0, -500), (0, 0, 0), 0.0), False


WS = [whale_state(f) for f in range(NF)]
key_series(whale, 'location', 0, list(range(NF)), [w[0]['loc'][0] for w in WS])
key_series(whale, 'location', 1, list(range(NF)), [w[0]['loc'][1] for w in WS])
key_series(whale, 'location', 2, list(range(NF)), [w[0]['loc'][2] for w in WS])
for j in range(3):
    key_series(whale, 'rotation_euler', j, list(range(NF)), [w[0]['rot'][j] for w in WS])
key_series(jaw_pivot, 'rotation_euler', 1, list(range(NF)), [w[0]['jaw'] for w in WS])
key_series(fl_piv, 'rotation_euler', 1, list(range(NF)), [w[0]['fluke'] for w in WS])
for piv, side in zip(fins, (-1, 1)):
    key_series(piv, 'rotation_euler', 0, list(range(NF)), [side * w[0]['fin'] for w in WS])
    key_series(piv, 'rotation_euler', 2, list(range(NF)), [side * 0.25 * w[0]['fin'] for w in WS])
wsp = [s for s in ('OPEN', 'A142', 'A143', 'A144b', 'A145')]
for ob in [whale] + list(whale.children_recursive):
    visible_keys(ob, spans(*wsp))


# ================================================================================================ set visibility
def set_vis(obs, names):
    for ob in obs:
        visible_keys(ob, spans(*names))
        for ch in ob.children_recursive:
            visible_keys(ch, spans(*names))


set_vis([night_sky, moon, night_sea] + CLOUDS, NIGHT_SHOTS)
set_vis([o for o in COLL['Under'].objects if o.parent is None], UNDER_SHOTS)
set_vis([o for o in COLL['Belly'].objects if o.parent is None and o.type != 'LIGHT'], ['A144a'])
set_vis([o for o in COLL['Dawn'].objects if o.parent is None], DAWN_SHOTS)
set_vis(VINE_OBS, ['A146'])
set_vis(LOTS_OBS, ['A141a'])
for ob in COLL['Cargo'].objects:
    pass


# ================================================================================================ lights and world per shot
CUR[0] = 'Lights'
L_moon = sun('Moon key', -mdir, 1.25, '#C9D8FF', angle=0.15)
L_front = sun('Night front fill', Vector((0.35, 1.0, -0.55)), 0.7, '#9C98F0', angle=0.4)
L_flash = sun('Lightning', Vector((0.2, -0.9, -0.4)), 0.0, '#E8E2FF', angle=0.2)
key_fn(L_flash.data, 'energy', 0, lambda f: 7.0 * flash(f))
set_vis([L_moon, L_flash], NIGHT_SHOTS)
set_vis([L_front], NIGHT_SHOTS)
L_lots_key = area('Lots lantern', LOTS + Vector((-1.2, -0.4, 0.8)), LOTS + Vector((0.1, 0.0, 0.05)), 0.6, 120, '#FFB04A')
L_lots_rim = area('Lots moon rim', LOTS + Vector((0.6, 2.2, 1.2)), LOTS + Vector((0.1, 0.0, 0.0)), 2.0, 160, '#9FB8FF')
set_vis([L_lots_key, L_lots_rim], ['A141a'])
L_uw = sun('Under sun', Vector((0.15, 0.1, -1)), 3.2, '#9FE6F0', angle=0.1)
key_fn(L_uw.data, 'energy', 0, lambda f: 3.2 if shot_at(f) == 'A143' else 1.1, list(range(0, NF, 5)))
L_uw_fill = area('Under fill', UW + Vector((0, -30, -10)), UW + Vector((0, 4, -14)), 30, 3500, '#3D6FB0')
set_vis([L_uw, L_uw_fill], UNDER_SHOTS)
for li in bl_light:
    visible_keys(li, spans('A144a'))
L_belly_fill = point('Belly fill', BL + Vector((0, 1.5, 0.4)), 40, '#C25A7A', 2.0)
visible_keys(L_belly_fill, spans('A144a'))
L_sun = sun('Dawn sun', -SUN_DIR + Vector((0, 0, -0.18)), 4.2, '#FFC88A', angle=0.05)
L_dawn_fill = area('Dawn fill', D + Vector((0, -30, 8)), D + Vector((0, 0, 0)), 30, 5000, '#FFD2B8')
set_vis([L_sun, L_dawn_fill], DAWN_SHOTS)
L_whale = area('Whale key', (0, 0, 0), (0, 0, 1), 6.0, 0.0, '#D8D4FF')
tryset(L_whale.data, spread=math.radians(40))
wk = L_whale.constraints.new('TRACK_TO')
wk.target = whale
wk.track_axis = 'TRACK_NEGATIVE_Z'
wk.up_axis = 'UP_Y'


def CS_PRE(f):
    return cam_state(f)


def whale_key(f):
    s_ = shot_at(f)
    w = Vector(WS[f][0]['loc'])
    c = Vector(CS_PRE(f)[0])
    d = (c - w)
    d.z = 0
    d = d.normalized() if d.length > 1e-3 else Vector((0, -1, 0))
    side = Vector((-d.y, d.x, 0))
    p = w + d * 14 + side * 7 + Vector((0, 0, 8))
    pw = {'OPEN': 1800, 'A142': 1300, 'A145': 600}.get(s_, 0.0)
    return p, pw


L_vine = area('Vine fill', D + VR + Vector((-2.5, -4.5, 2.5)), D + VR + Vector((0.3, 0.8, 0.3)), 4.0, 900, '#FFE2C8')
visible_keys(L_vine, spans('A146'))
L_curtain = area('Curtain front', CUR_CAM + Vector((0.6, -0.8, 0.8)), CUR_CAM + Vector((0, 2.5, 0)), 2.0, 80, '#C9B8FF')
visible_keys(L_curtain, [(SPAN['A145'][0], SEC(EVT['part'] + 2.5))])
for ob_ in (night_sky, moon, moon_ring, dawn_sky, sun_disc, vbox, surf, lots_bg) + tuple(COLL['Spray'].objects):
    tryset(ob_, visible_shadow=False)
for ob_ in list(COLL['Night'].objects) + list(COLL['Dawn'].objects):
    if ob_.name.startswith(('Cloud', 'Dawn cloud', 'Bolt')):
        tryset(ob_, visible_shadow=False)
WORLD = {'OPEN': ('#3A4488', 1.0), 'A139': ('#3A4488', 1.0), 'A140': ('#3A4488', 1.1), 'A141a': ('#2A2F5A', 0.6), 'A141b': ('#343C7A', 0.9),
         'A142': ('#3A4488', 1.0), 'A143': ('#1E5C80', 0.9), 'A144a': ('#2A0E22', 0.3), 'A144b': ('#0E2A40', 0.5), 'A144c': ('#2A3270', 0.7),
         'A145': ('#F2C2A8', 0.6), 'A146': ('#F2C8B0', 0.5)}
for j in range(3):
    key_series(world.node_tree, 'nodes["Background"].inputs[0].default_value', j, [SPAN[s][0] for s in SHOTS],
               [srgb(WORLD[s][0])[j] for s in SHOTS], interp='CONSTANT')
EXPO = {'OPEN': 0.35, 'A139': 0.35, 'A140': 0.5, 'A141a': 0.3, 'A141b': 0.35, 'A142': 0.35, 'A143': 0.3, 'A144a': 0.0, 'A144b': 0.0, 'A144c': 0.1,
        'A145': -0.15, 'A146': -0.2}
key_series(sc, 'view_settings.exposure', 0, [SPAN[s][0] for s in SHOTS], [EXPO[s] for s in SHOTS], interp='CONSTANT')
key_series(world.node_tree, 'nodes["Background"].inputs[1].default_value', 0, [SPAN[s][0] for s in SHOTS], [WORLD[s][1] for s in SHOTS],
           interp='CONSTANT')


# ================================================================================================ camera
cam_d = bpy.data.cameras.new('Cam')
cam_d.sensor_fit = 'HORIZONTAL'
cam_d.sensor_width = 36
cam_d.clip_start = 0.05
cam_d.clip_end = 900
cam_d.dof.use_dof = True
cam_d.dof.aperture_blades = 0
cam = link(bpy.data.objects.new('Cam', cam_d))
sc.camera = cam


def shake(f, amp, t0, w=0.6):
    t = f / FPS
    e = pulse(t - t0, w)
    return Vector((amp * e * math.sin(f * 2.3), amp * e * math.sin(f * 1.7 + 1), amp * e * math.sin(f * 2.9 + 2)))


def cam_state(f):
    """location, target, lens, f-stop, focus distance (None: the target), roll (deg)"""
    s = shot_at(f)
    a, b = SPAN[s]
    u = (f - a) / max(1, b - a)
    t = f / FPS
    roll = 0.0
    fst, focus = 16.0, None
    if s == 'OPEN':
        loc = vlerp((-1.6, -12.0, 1.7), (-0.8, -9.5, 2.1), ease_io(u)) + shake(f, 0.35, T_CRASH - 0.05, 0.9) + shake(f, 0.12, T_UP, 0.5)
        tz = 5.0 + 4.0 * smooth((t - 0.6) / 1.4) - 4.0 * smooth((t - T_PEAK) / 1.8)
        tgt = Vector((2.5 + 2.5 * smooth((t - 0.6) / 3), 10, tz))
        lens = 28
        roll = -2.0 * math.sin(t * 0.8)
    elif s == 'A139':
        sx = ship_state(f)[0].x
        loc = Vector((sx - 5.0 + 2.4 * u, -15.5, 3.0 + 0.3 * math.sin(t * 0.9)))
        tgt = Vector((sx + 0.8, 8, 4.8))
        lens = 32
        roll = 1.2 * math.sin(t * 0.7)
    elif s == 'A140':
        sl, sr = ship_state(f)
        M = Matrix.Translation(sl) @ sr.to_matrix().to_4x4()
        loc = M @ vlerp((-4.9, 0.25, 3.05), (-2.4, 0.05, 2.85), ease_io(u))
        tgt = M @ Vector((5.0, 0.0, 3.4))
        lens = 22
    elif s == 'A141a':
        loc = LOTS + vlerp((-0.35, -1.55, 0.30), (-0.25, -1.25, 0.24), ease_out(u)) + shake(f, 0.02, a / FPS, 0.3)
        tgt = LOTS + vlerp((0.25, 0.45, 0.12), (0.05, -0.45, 0.03), smooth((u - 0.25) / 0.6))
        lens = 55
        fst = 2.0
        focus = None
    elif s == 'A141b':
        sx = ship_state(f)[0].x
        loc = Vector((sx - 11.0 + 2.0 * u, -7.0, 1.7 + 0.6 * math.sin(t * 1.3))) + shake(f, 0.25, FLASHES[2][0], 0.5) + shake(f, 0.2, FLASHES[4][0], 0.5)
        tgt = Vector((sx + 0.5, 8, 3.6))
        lens = 26
        roll = 6.0 * math.sin(t * 1.1)
    elif s == 'A142':
        loc = Vector((SW_BASE.x - 2.0 + 0.8 * u, 0.0 + 0.8 * u, 1.5)) + shake(f, 0.25, T_SWALLOW, 0.5)
        tz = 3.0 + 5.5 * smooth((t - T_RISE) / 1.2) - 5.0 * smooth((t - T_DIVE) / 1.6)
        tgt = Vector((SW_BASE.x + 1.5, 12, tz))
        lens = 24
    elif s == 'A143':
        loc = UW + vlerp((4, -15, -11), (0.5, -9.0, -15.0), ease_io(u))
        if u > 0.82:
            w = ease_in((u - 0.82) / 0.18)
            wp = Vector(WS[f][0]['loc'])
            loc = loc.lerp(wp + Vector((0, -2.4, 0.4)), w * 0.92)
        tgt = (UW + vlerp((6, 4, -12), (-2, 3.5, -16.5), ease_io(u))).lerp(Vector(WS[f][0]['loc']), 0.55)
        if u > 0.82:
            tgt = tgt.lerp(Vector(WS[f][0]['loc']), ease_in((u - 0.82) / 0.18))
        lens = 26
    elif s == 'A144a':
        loc = BL + Vector((0.4 + 0.3 * math.sin(t), 1.5 + 6.0 * ease_out(u), 0.2))
        tgt = BL + Vector((1.2, 30, 0.6))
        lens = 20
        roll = 4 * math.sin(t * 0.6)
    elif s == 'A144b':
        loc = UW + vlerp((0, 2, -50), (0, 2.5, -47), u)
        tgt = UW + Vector((0.5, 5, -20))
        lens = 26
    elif s == 'A144c':
        loc = vlerp((0, -62, 36), (2, -58, 33), ease_io(u))
        tgt = Vector((14, 140, 6))
        lens = 28
    elif s == 'A145':
        t_open = EVT['part'] + 1.7
        w = 0.8 * ease_io(c01((t - t_open) / 2.4)) + 0.2 * smooth(c01((t - t_open - 2.4) / ((b / FPS) - t_open - 2.4)))
        loc = CUR_CAM.lerp(D + Vector((-2.2, -6.2, 1.25)), w)
        tgt = (D + Vector((2.6, 14, 2.4))).lerp(D + Vector((3.2, 0.8, 0.9)), w)
        lens = 35
        rack = smooth((t - EVT['part'] - 0.9) / 1.0)
        focus = lerp(2.3, (D + Vector((3.5, 0.0, 1.0)) - loc).length, rack)
        fst = lerp(4.0, 11.0, rack)
    else:   # A146
        g = ease_io(u)
        R0 = VR
        loc = D + Vector((R0.x - 0.35 - 1.6 * g, R0.y - 1.3 - 3.0 * g, R0.z + 0.32 + 1.15 * g))
        tgt = D + Vector((R0.x + 0.1 + 0.4 * g, R0.y + 0.3 + 1.0 * g, R0.z + 0.18 + 0.25 * g))
        lens = lerp(40, 30, g)
        fst = lerp(2.8, 9.0, g)
    return loc, tgt, lens, fst, focus, roll


CS = [cam_state(f) for f in range(NF)]
WK = [whale_key(f) for f in range(NF)]
for j in range(3):
    key_series(L_whale, 'location', j, list(range(NF)), [w_[0][j] for w_ in WK])
key_series(L_whale.data, 'energy', 0, list(range(NF)), [w_[1] for w_ in WK])
visible_keys(L_whale, spans('OPEN', 'A142', 'A145'))
rot_list, foc_list = [], []
for f, (loc, tgt, lens, fst, focus, roll) in enumerate(CS):
    d = (Vector(tgt) - Vector(loc))
    q = d.to_track_quat('-Z', 'Y')
    e = (q @ Matrix.Rotation(math.radians(roll), 4, 'Z').to_quaternion()).to_euler()
    rot_list.append(e)
    foc_list.append(focus if focus is not None else d.length)
if rot_list:
    for j in range(1, NF):                                   # unwrap Euler angles so subframes never spin
        for k in range(3):
            prev, cur = rot_list[j - 1][k], rot_list[j][k]
            while cur - prev > math.pi:
                cur -= 2 * math.pi
            while cur - prev < -math.pi:
                cur += 2 * math.pi
            rot_list[j][k] = cur
for j in range(3):
    key_series(cam, 'location', j, list(range(NF)), [c[0][j] for c in CS])
    key_series(cam, 'rotation_euler', j, list(range(NF)), [r[j] for r in rot_list])
key_series(cam_d, 'lens', 0, list(range(NF)), [c[2] for c in CS])
key_series(cam_d, 'dof.aperture_fstop', 0, list(range(NF)), [c[3] for c in CS])
key_series(cam_d, 'dof.focus_distance', 0, list(range(NF)), foc_list)


# ================================================================================================ geometry for the text layer
def project(p, f):
    loc = Vector(CS[f][0])
    m = (Matrix.Translation(loc) @ rot_list[f].to_matrix().to_4x4()).inverted()
    q = m @ Vector(p)
    k = 1080 * CS[f][2] / cam_d.sensor_width
    if q.z >= -0.01:
        return None
    return [round(540 + k * q.x / -q.z, 1), round(960 - k * q.y / -q.z, 1)]


geom = {'fps': FPS, 'frames': NF, 'shots': {s: list(SPAN[s]) for s in SHOTS}, 'whale_head': [], 'lantern': [], 'moon': [], 'sun': []}
for f in range(NF):
    w = WS[f][0]
    M = Matrix.Translation(Vector(w['loc'])) @ Euler(w['rot']).to_matrix().to_4x4()
    geom['whale_head'].append(project(M @ Vector((6.5, 0, 0.2)), f) if WS[f][1] else None)
    sl, sr = ship_state(f)
    geom['lantern'].append(project((Matrix.Translation(sl) @ sr.to_matrix().to_4x4()) @ Vector((4.9, 0, 3.6)), f) if shot_at(f) in SHIP_SHOTS else None)
    geom['moon'].append(project(moon.location, f) if shot_at(f) in NIGHT_SHOTS else None)
    geom['sun'].append(project(sun_disc.location, f) if shot_at(f) in DAWN_SHOTS else None)
(OUT / 'geom.json').write_text(json.dumps(geom, separators=(',', ':')))
print('geom.json written; shots', {s: SPAN[s] for s in SHOTS})

# ================================================================================================ render
if MODE == 'geom':
    sys.exit(0)
if MODE == 'info':
    for f in [int(x) for x in (POS[0] if POS else '60,1330').split(',')]:
        sc.frame_set(f)
        bpy.context.view_layer.update()
        for nm in ('Whale', 'Whale body', 'Whale jaw', 'Ship', 'Night sea', 'Dawn sea'):
            ob = bpy.data.objects[nm]
            dg = bpy.context.evaluated_depsgraph_get()
            ev = ob.evaluated_get(dg)
            bb = [ev.matrix_world @ Vector(c) for c in ev.bound_box] if ob.type == 'MESH' else []
            zr = (min(v.z for v in bb), max(v.z for v in bb)) if bb else None
            print('INFO', f, nm, 'loc', tuple(round(x, 2) for x in ob.matrix_world.translation), 'dims', tuple(round(x, 2) for x in ob.dimensions),
                  'hide', ob.hide_render, 'zrange', zr)
    sys.exit(0)
if MODE == 'blend':
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'yunusknit.blend'))
    sys.exit(0)


def render_frame(f, dst):
    sc.frame_set(f)
    sc.render.use_motion_blur = not (f in CUT_FRAMES or (f + 1) in CUT_FRAMES)
    sc.render.filepath = str(dst)
    t0 = time.time()
    bpy.ops.render.render(write_still=True)
    return time.time() - t0


CAMO = opt('--camo')
if CAMO:                                                     # debug: look at the frame from another place (x,y,z,tx,ty,tz,lens)
    v_ = [float(x) for x in CAMO.split(',')]
    cam.animation_data_clear()
    cam_d.animation_data_clear()
    cam.location = v_[:3]
    cam.rotation_euler = (Vector(v_[3:6]) - Vector(v_[:3])).to_track_quat('-Z', 'Y').to_euler()
    cam_d.lens = v_[6]
    cam_d.dof.use_dof = False
if MODE == 'stills':
    frames = [int(x) for x in (POS[0] if POS else '0,60,300').split(',')]
    (OUT / 'stills').mkdir(exist_ok=True)
    times = []
    for f in frames:
        times.append(render_frame(f, OUT / 'stills' / (f's{f:04d}.jpg' if not CAMO else f'dbg{f:04d}_{abs(hash(CAMO)) % 1000}.jpg')))
        print(f'STILL {f} {shot_at(f)} {times[-1]:.1f} s', flush=True)
    print('SECONDS_PER_FRAME', ' '.join(f'{t:.1f}' for t in times), flush=True)
elif MODE == 'anim':
    first = int(POS[0]) if POS else 0
    last = int(POS[1]) if len(POS) > 1 else NF - 1
    (OUT / 'frames').mkdir(exist_ok=True)
    t_all = time.time()
    n = 0
    for f in range(first, min(last, NF - 1) + 1):
        dst = OUT / 'frames' / f'f{f:04d}.jpg'
        if dst.exists() and dst.stat().st_size > 1000:
            continue
        dt = render_frame(f, dst)
        n += 1
        print(f'FRAME {f} {shot_at(f)} {dt:.1f} s', flush=True)
    print(f'DONE {n} frames in {time.time() - t_all:.0f} s', flush=True)
