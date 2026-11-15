"""DOLPHIN-KNIT 3D plate: the private knitted golden-dolphin salawat reel for the owner's wife (@heal.ingthroughquran).
Reference DfwI-C2tUw9 (Ikram Azad, "Magical Islamic Wonder"): one 10 s slow-motion shot of a golden dolphin engraved with
arabesques, the word «الله» and a small Kaaba, leaping out of an evening sea, arcing over and diving back in a splash that
turns into a golden ring. The reference is an AI video (Gemini sparkle watermark in its corner), not a real event; this is
an artwork, and nothing claims otherwise. Rebuilt here as real 3D knitwork, rendered headless with EEVEE on the reference clock:

    studio/heavy.sh /Applications/Blender.app/Contents/MacOS/Blender -b -P studio/blender/dolphinknit/build.py -- <out> stills 0,60,120
    studio/heavy.sh /Applications/Blender.app/Contents/MacOS/Blender -b -P studio/blender/dolphinknit/build.py -- <out> anim [first] [last]

Options after the mode: --samples N (EEVEE TAA samples, default 16), --pct P (resolution percent), --nohair,
--patch <dir> (allah.png and kaaba.png, transparent PNGs rendered by remotion/src/dolphinknit, default <out>/../public/patch).

Beats (s, on the reference clock; its 24 fps video is 10.0 s, its audio 10.05 s, this plate 302 frames at 30 fps):
  0.00-0.45  a calm knitted evening sea under a knitted sky with cream cloud puffs
  0.45-0.90  the sea bulges and bursts in white yarn spray; the knitted golden dolphin comes out nose first
  0.90-2.00  it rises straight up, trailing yarn droplets and gold sequins
  2.00-3.60  it arcs over to level at the top
  3.60-6.90  it tips over and dives, nose down, toward the sea
  6.90-7.70  the nose and then the flukes go in: two splashes and a boucle foam ring
  7.70-10.07 gold yarn rings spread out over the water and a fountain of gold sequins rises from where it went in
The dolphin is gold yarn with a Fair Isle arabesque band, a glowing embroidered «الله» on each flank and a small knitted
Kaaba patch behind it (the reference's own marks). No person, and no prophet, is shown in any form.
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
POS = [a for a in argv[2:] if not a.startswith('--') and not argv[argv.index(a) - 1].startswith('--')]
opt = lambda k, d=None: argv[argv.index(k) + 1] if k in argv else d
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'tex').mkdir(exist_ok=True)
SAMPLES, PCT = int(opt('--samples', 16)), int(opt('--pct', 100))
NOHAIR = '--nohair' in argv
PATCH = Path(opt('--patch', str(OUT.parent / 'public' / 'patch')))
FPS = 30
NF = 302
SEC = lambda s: int(round(s * FPS))
CUT_FRAMES = []
rng = np.random.default_rng(56)


def spans(*names):
    return [(0, NF)]


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


def show_in(ob, names, children=True):
    sp = spans(*names)
    visible_keys(ob, sp)
    if children:
        for ch in ob.children_recursive:
            visible_keys(ch, sp)



STAR5 = ['..a..', '.aba.', 'abbba', '.aba.', '..a..']
DIAMOND = ['..a..', '.aba.', 'ab.ba', '.aba.', '..a..']
WAVE = ['....aa......', '...a..a.....', '..a....a...a', 'aa......aaa.']
R = np.random.default_rng(11)


def bands(rows, cols, cols_hex, heights, r=None):
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


# ================================================================================================ timing (s)
T_BULGE, T_OUT, T_TOP, T_NOSE_IN, T_TAIL_IN = 0.42, 0.55, 3.6, 6.9, 7.65
sc.name = 'DOLPHIN_KNIT'
sc.frame_start, sc.frame_end = 0, NF - 1

# ================================================================================================ the evening sky
CUR[0] = 'Sky'
SKY_R = 260.0
SKY_COLS, SKY_ROWS = 1440, 300


def sky_map(stops, cols, rows, seed=3):
    """vertical ombre, two yarns stranded in a dither between neighbouring stops; row 0 = top (zenith)"""
    r = np.random.default_rng(seed)
    C = np.zeros((rows, cols, 3), np.float32)
    S = [hexrgb(h) for h in stops]
    bayer = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16 + 1 / 32
    for j in range(rows):
        g = (1 - j / (rows - 1)) * (len(S) - 1)
        i0 = min(int(g), len(S) - 2)
        fr = g - i0
        for i in range(cols):
            C[j, i] = S[i0 + 1] if bayer[j % 4, i % 4] < fr else S[i0]
    C *= (1 + r.normal(0, 0.025, (rows, cols, 1))).astype(np.float32)
    return np.clip(C, 0, 1)


def sky_dome(name, cmap_img, emis):
    rings = []
    for k in range(25):
        el = min(math.radians(-12 + 100 * k / 24), math.radians(89.5))
        a = np.linspace(0, 2 * np.pi, 160, endpoint=False)
        rr = SKY_R * math.cos(el)
        rings.append(np.c_[rr * np.cos(a), rr * np.sin(a), np.full(160, SKY_R * math.sin(el))])
    m = knit_mat(name + ' knit', img=cmap_img, coords='UV', spm=(SKY_COLS, SKY_ROWS), bump=0.6, dist=1.2, emis=emis, rough=1.0,
                 sheen=0.0, sss=0.0, dark=0.45, heather=0.04)
    ob = loft(name, rings, [m], cap0=False, cap1=True)
    for p in ob.data.polygons:
        p.flip()
    for lp in ob.data.uv_layers[0].data:
        u, v = lp.uv
        lp.uv = (v, u)
    return ob


# horizon (bottom stops, below the horizon too) to zenith: warm sea haze, peach, pale blue, sky blue, deep blue
sky_img = color_png('evening_sky', sky_map(['#4F7FA8', '#F6DDB8', '#D9E6F0', '#A8CDEB', '#86B8E6', '#679FDC', '#5089CF', '#4176C2',
                                            '#3766B2', '#2F5AA6', '#2A50A0', '#264A98'], SKY_COLS, SKY_ROWS))
sky = sky_dome('Sky', sky_img, 1.15)


def cloud(name, at, size, hexcol, seed, glow=1.1):
    r = np.random.default_rng(seed)
    root = empty(name, at)
    mat = knit_mat(name + ' knit', hexcol, coords='XZ', spm=(0.35 / size * 10, 0.5 / size * 10), bump=0.8, dist=0.4, sheen=1.0,
                   dark=0.55, emis=glow)
    for k in range(9):
        rr = size * r.uniform(0.28, 0.5)
        ob = sphere(f'{name} puff {k}', 1.0, mat, 24, 12)
        ob.scale = (rr * r.uniform(1.1, 1.5), rr * 0.8, rr * r.uniform(0.7, 0.9))
        ob.location = (r.uniform(-1, 1) * size * 0.9, r.uniform(-0.2, 0.2) * size, r.uniform(-0.15, 0.35) * size)
        ob.parent = root
    return root


CLOUDS = [cloud('Cloud A', (-70, 190, 22), 26, '#FFF1DE', 1), cloud('Cloud B', (40, 210, 30), 30, '#FBE8D2', 2),
          cloud('Cloud C', (120, 170, 18), 24, '#FFF4E6', 3), cloud('Cloud D', (-140, 150, 34), 28, '#F6E2CF', 4),
          cloud('Cloud E', (0, 230, 62), 34, '#FFFFFF', 5), cloud('Cloud F', (-30, 160, 12), 18, '#FFE9CF', 6),
          cloud('Cloud G', (75, 140, 48), 22, '#FFFFFF', 7)]
for k, c in enumerate(CLOUDS):
    p0 = c.location.copy()
    key_fn(c, 'location', 3, lambda f, p0=p0, k=k: tuple(p0 + Vector((0.5 * f / FPS * (1 if k % 2 else -1), 0, 0))), list(range(0, NF, 15)))
    tryset(c, visible_shadow=False)
    for ch in c.children:
        tryset(ch, visible_shadow=False)
tryset(sky, visible_shadow=False)

# ================================================================================================ the knitted sea
CUR[0] = 'Sea'
SEA_PAL = ['#163E78', '#1D5294', '#156684', '#1E7898', '#1A4C86', '#124E78']


def sea_map(pal, motif_cols, n=60, rows=72):
    C = bands(rows, n, pal, [3, 2, 4, 2, 3, 2], R)
    for top in range(4, rows, 18):
        for left in range(0, n, 12):
            stamp(C, WAVE, {'a': motif_cols[0]}, top, left)
        for left in range(6, n, 12):
            stamp(C, ['b'], {'b': motif_cols[1]}, top + 7, left)
    return C


sea_img = color_png('evening_sea', sea_map(SEA_PAL, ['#86D4DC', '#F4E7C8']))
sea_mat = knit_mat('Sea knit', img=sea_img, coords='XY', spm=(7.0, 9.5), bump=1.0, dist=0.03, rough=0.45, sheen=0.3,
                   foam=(0.30, 0.75, '#EEF6F8'), dark=0.36, heather=0.06)
bpy.ops.mesh.primitive_plane_add(size=2)
sea = bpy.context.active_object
for c_ in sea.users_collection:
    c_.objects.unlink(sea)
coll(CUR[0]).objects.link(sea)
sea.name = 'Sea'
ocean = sea.modifiers.new('Ocean', 'OCEAN')
ocean.geometry_mode = 'GENERATE'
ocean.spatial_size = 24
ocean.repeat_x = ocean.repeat_y = 10
tryset(ocean, resolution=12, viewport_resolution=3, random_seed=5, wave_scale=0.55, choppiness=0.9, wind_velocity=11.0,
       wave_alignment=0.3, wave_direction=math.radians(70), use_normals=True, spectrum='PHILLIPS', depth=200.0)
sea.data.materials.append(sea_mat)
sea.location = (-120, -60, 0)
key_fn(sea, 'modifiers["Ocean"].time', 0, lambda f: 2.0 + f / FPS * 0.45)          # slow motion, like the reference

# ================================================================================================ the knitted golden dolphin
CUR[0] = 'Dolphin'
DL = 3.0
_sp = [0.00, 0.05, 0.12, 0.22, 0.34, 0.46, 0.58, 0.68, 0.76, 0.82, 0.86, 0.89, 0.92, 0.96, 1.00]
_rp = [0.045, 0.07, 0.11, 0.19, 0.29, 0.36, 0.39, 0.38, 0.34, 0.29, 0.24, 0.17, 0.115, 0.09, 0.05]


def d_r(s):
    return float(np.interp(s, _sp, _rp))


def d_zc(s):
    """the centre line: the melon bulges up, the beak sits low"""
    return 0.06 * math.exp(-((s - 0.84) / 0.05) ** 2) - 0.07 * c01((s - 0.87) / 0.1)


def d_wy(s):
    """width / height: the tail stock is flat sideways, the body round"""
    return float(np.interp(s, [0.0, 0.12, 0.3, 0.6, 0.85, 1.0], [0.45, 0.5, 0.82, 0.88, 0.85, 0.8]))


ND = 48
DROWS = 120


def dolphin_ring(s):
    r = d_r(s)
    th = np.linspace(0, 2 * np.pi, ND, endpoint=False)
    y = d_wy(s) * r * np.cos(th)
    z = r * np.sin(th) + d_zc(s)
    x = np.full(ND, (s - 0.5) * DL)
    return np.c_[x, y, z]


# colour map: columns around (sin > 0 = the back), rows along (row 0 = the beak end)
Cd = np.zeros((DROWS, ND, 3), np.float32)
rd = np.random.default_rng(21)
for j in range(DROWS):
    s = 1 - j / (DROWS - 1)
    for i in range(ND):
        sn = math.sin(2 * math.pi * i / ND)
        if sn > 0.55:
            c = '#9A6206'
        elif sn > 0.1:
            c = '#C98A0C'
        elif sn > -0.45:
            c = '#E4A91E'
        else:
            c = '#F2CF6A'
        if s > 0.9 and sn < 0.2:
            c = '#EFC860'
        Cd[j, i] = hexrgb(c) * (1 + rd.normal(0, 0.03))
# the engraved arabesque of the reference as Fair Isle: bronze diamonds along each flank and down the back
for i0 in (int(ND * 12 / 360), int(ND * 168 / 360)):
    for top in range(26, 104, 7):
        stamp(Cd, DIAMOND, {'a': '#7A4E10', 'b': '#FFE9A6'}, top, i0 - 2, wrap=True)
for top in range(30, 100, 9):
    stamp(Cd, STAR5, {'a': '#7A4E10', 'b': '#FFE3A0'}, top, ND // 4 - 2)
dolphin_img = color_png('dolphin', np.clip(Cd, 0, 1))
dolphin_mat = knit_mat('Dolphin knit', img=dolphin_img, coords='UV', spm=(ND, DROWS), bump=1.1, dist=0.012, sheen=0.25, dark=0.5,
                       rough=0.55, heather=0.05)
_b = dolphin_mat.node_tree.nodes['Principled BSDF']
_b.inputs['Metallic'].default_value = 0.3                   # gold metallic yarn (a lurex ply)


# the embroidered patches: «الله» and the Kaaba, projected sideways in object space onto both flanks (read the right way
# round on each side), mixed over the knit colour, the letters glowing
def add_patch(mat, img, x0, x1, z0, z1, glow):
    nt = mat.node_tree
    N, L = nt.nodes, nt.links
    b = N['Principled BSDF']
    base_link = b.inputs['Base Color'].links[0]
    base_out = base_link.from_socket
    tc = N.new('ShaderNodeTexCoord')
    sx = N.new('ShaderNodeSeparateXYZ')
    L.new(tc.outputs['Object'], sx.inputs['Vector'])
    outs = []
    for side in (-1, 1):
        u = N.new('ShaderNodeMapRange')
        u.inputs['From Min'].default_value, u.inputs['From Max'].default_value = (x0, x1) if side < 0 else (x1, x0)
        u.clamp = False
        L.new(sx.outputs['X'], u.inputs['Value'])
        v = N.new('ShaderNodeMapRange')
        v.inputs['From Min'].default_value, v.inputs['From Max'].default_value = z0, z1
        v.clamp = False
        L.new(sx.outputs['Z'], v.inputs['Value'])
        cx = N.new('ShaderNodeCombineXYZ')
        L.new(u.outputs['Result'], cx.inputs['X'])
        L.new(v.outputs['Result'], cx.inputs['Y'])
        tx = N.new('ShaderNodeTexImage')
        tx.image = img
        tx.extension = 'CLIP'
        tx.interpolation = 'Cubic'
        L.new(cx.outputs['Vector'], tx.inputs['Vector'])
        sd = N.new('ShaderNodeMath')                         # this side only: y < 0 for side -1
        sd.operation = 'LESS_THAN' if side < 0 else 'GREATER_THAN'
        sd.inputs[1].default_value = 0.0
        L.new(sx.outputs['Y'], sd.inputs[0])
        am = N.new('ShaderNodeMath')
        am.operation = 'MULTIPLY'
        L.new(tx.outputs['Alpha'], am.inputs[0])
        L.new(sd.outputs[0], am.inputs[1])
        outs.append((tx.outputs['Color'], am.outputs[0]))
    col, a = base_out, None
    for c_, a_ in outs:
        mx = N.new('ShaderNodeMix')
        mx.data_type = 'RGBA'
        L.new(a_, sk(mx.inputs, 'Factor_Float'))
        L.new(col, sk(mx.inputs, 'A_Color'))
        L.new(c_, sk(mx.inputs, 'B_Color'))
        col = sk(mx.outputs, 'Result_Color')
        if a is None:
            a = a_
        else:
            ad = N.new('ShaderNodeMath')
            ad.operation = 'ADD'
            L.new(a, ad.inputs[0])
            L.new(a_, ad.inputs[1])
            a = ad.outputs[0]
    L.new(col, b.inputs['Base Color'])
    if glow:
        prev = b.inputs['Emission Strength'].links[0].from_socket if b.inputs['Emission Strength'].links else None
        gm = N.new('ShaderNodeMath')
        gm.operation = 'MULTIPLY'
        gm.inputs[1].default_value = glow
        L.new(a, gm.inputs[0])
        if prev is not None:
            ad = N.new('ShaderNodeMath')
            ad.operation = 'ADD'
            L.new(prev, ad.inputs[0])
            L.new(gm.outputs[0], ad.inputs[1])
            L.new(ad.outputs[0], b.inputs['Emission Strength'])
        else:
            L.new(gm.outputs[0], b.inputs['Emission Strength'])
        L.new(outs[0][0], b.inputs['Emission Color'])
        mt = N.new('ShaderNodeMath')                         # metal off under the letters, so the glow reads
        mt.operation = 'MULTIPLY_ADD'
        mt.inputs[1].default_value = -0.35
        mt.inputs[2].default_value = 0.35
        L.new(a, mt.inputs[0])
        L.new(mt.outputs[0], b.inputs['Metallic'])


def load_patch(name):
    p = PATCH / f'{name}.png'
    if not p.exists():
        print('PATCH MISSING', p)
        return None
    im = bpy.data.images.load(str(p))
    im.colorspace_settings.name = 'sRGB'
    im.alpha_mode = 'STRAIGHT'
    return im


ALLAH_BOX = (-0.38, 0.86, -0.36, 0.29)       # x0, x1, z0, z1 (object space; the image is 1080 x 570)
KAABA_BOX = (-0.98, -0.50, -0.12, 0.23)       # (the image is 760 x 560)
_ia, _ik = load_patch('allah'), load_patch('kaaba')
if _ik is not None:
    add_patch(dolphin_mat, _ik, *KAABA_BOX, glow=0.0)
if _ia is not None:
    add_patch(dolphin_mat, _ia, *ALLAH_BOX, glow=float(opt('--glow', 2.2)))

dolphin = empty('Dolphin')
rings = [dolphin_ring(s) for s in np.linspace(0, 1, 140)]
body = loft('Dolphin body', rings, [dolphin_mat], cap0=True, cap1=True)
for lp in body.data.uv_layers[0].data:
    u, v = lp.uv
    lp.uv = (v, u)
body.parent = dolphin
add_fuzz(body, 6000, 0.010, 0, children=3, radius=0.001, seed=3)

eye_mat = glossy('Eye gloss', '#0B0B14', 0.08)
for side in (-1, 1):
    s_e = 0.865
    pe = Vector(((s_e - 0.5) * DL, side * d_wy(s_e) * d_r(s_e) * 0.93, d_zc(s_e) + 0.02))
    e_ = sphere(f'Eye {side}', 0.028, eye_mat, 16, 8)
    e_.location = pe
    e_.parent = body
    hl = sphere(f'Eye light {side}', 0.007, emissive('Eye light', '#FFFFFF', 3)[0], 8, 4)
    hl.location = pe + Vector((0.01, side * 0.024, 0.012))
    hl.parent = body
    # the smile: a bronze yarn line from the beak tip back along the jaw
    ss = np.linspace(0.875, 0.995, 14)
    pts = np.array([((s - 0.5) * DL, side * d_wy(s) * d_r(s) * 0.97, d_zc(s) - 0.35 * d_r(s) + 0.03 * (s - 0.875) / 0.12) for s in ss])
    curve_obj(f'Smile {side}', [pts], 0.006, felt('Smile yarn', '#7A4E10', 80), res=2).parent = body
# a blowhole ring
bh = curve_obj('Blowhole', [np.c_[0.03 * np.cos(np.linspace(0, 2 * np.pi, 17)), 0.02 * np.sin(np.linspace(0, 2 * np.pi, 17)), np.zeros(17)]],
               0.006, felt('Blowhole yarn', '#7A4E10', 80), closed=True)
bh.location = ((0.78 - 0.5) * DL, 0, d_zc(0.78) + d_r(0.78) * 0.99)
bh.parent = body


def fin_loft(name, chord, thick, spine, nl=22, nc=18, cols=('#B98319', '#E3B444', '#F8E7BC')):
    rings_ = []
    for k in range(nl):
        l = k / (nl - 1)
        c = Vector(spine(l))
        ch = chord(l)
        th_ = thick(l)
        a = np.linspace(0, 2 * np.pi, nc, endpoint=False)
        rings_.append(np.c_[c.x + 0.5 * ch * np.cos(a), c.y + 0.5 * th_ * np.sin(a), np.full(nc, c.z)])
    return rings_


def fin_obj(name, rings_, axis_swap, nc=18, cols=('#B98319', '#E3B444', '#F8E7BC')):
    if axis_swap:
        rings_ = [np.c_[r[:, 0], r[:, 2], r[:, 1]] for r in rings_]
    Cf = np.zeros((30, nc, 3), np.float32)
    for i in range(nc):
        sn = math.sin(2 * math.pi * i / nc)
        Cf[:, i] = hexrgb(cols[0] if sn > 0.3 else (cols[1] if sn > -0.3 else cols[2]))
    for j in range(0, 30, 6):
        Cf[j, :] = hexrgb('#7A4E10')
    img = color_png(name, np.clip(Cf * (1 + rd.normal(0, 0.03, Cf.shape)), 0, 1))
    m = knit_mat(name + ' knit', img=img, coords='UV', spm=(nc, 30), bump=1.0, dist=0.008, sheen=1.0, rough=0.55)
    m.node_tree.nodes['Principled BSDF'].inputs['Metallic'].default_value = 0.35
    ob = loft(name, rings_, [m])
    for lp in ob.data.uv_layers[0].data:
        u, v = lp.uv
        lp.uv = (v, u)
    return ob


# dorsal fin: up from the back at s 0.52, swept back
s_d = 0.50
zd = d_zc(s_d) + d_r(s_d) * 0.86
dorsal = fin_obj('Dorsal fin', fin_loft('Dorsal', lambda l: 0.42 * (1 - l) ** 0.8 + 0.04, lambda l: 0.07 * (1 - l) + 0.012,
                                        lambda l: ((s_d - 0.5) * DL - 0.42 * l ** 1.6, 0.0, zd + 0.36 * l)), False)
dorsal.parent = body
# pectoral fins: down and out at s 0.70
for side in (-1, 1):
    s_p = 0.70
    root = Vector(((s_p - 0.5) * DL, side * d_wy(s_p) * d_r(s_p) * 0.75, d_zc(s_p) - d_r(s_p) * 0.55))
    piv = empty(f'Pec pivot {side}', root)
    piv.parent = body
    pec = fin_obj(f'Pec fin {side}', fin_loft('Pec', lambda l: 0.24 * (1 - l) ** 0.7 + 0.04, lambda l: 0.045 * (1 - l) + 0.01,
                                              lambda l, side=side: (-0.22 * l ** 1.3, side * 0.36 * l, -0.16 * l)), False)
    pec.parent = piv
# the flukes: flat and wide at the tail end
fl_piv = empty('Fluke pivot', (-0.5 * DL + 0.03, 0, d_zc(0.0)))
fl_piv.parent = dolphin
for side in (-1, 1):
    fl = fin_obj(f'Fluke {side}', fin_loft('Fluke', lambda l: 0.34 * (1 - l) ** 0.7 + 0.05, lambda l: 0.05 * (1 - l) + 0.012,
                                           lambda l, side=side: (-0.20 * l ** 1.5 - 0.06, side * 0.46 * l, 0.0)), False)
    fl.parent = fl_piv

# ================================================================================================ the leap
# the body centre as a spline in (time, x, z); the body points along the path (nose first), with a little roll and yaw
KP = [(0.00, -0.95, -3.4), (0.42, -0.95, -1.7), (0.95, -0.92, 0.05), (1.55, -0.85, 1.25), (2.15, -0.62, 2.15), (2.85, -0.18, 2.7),
      (3.60, 0.38, 2.86), (4.35, 0.88, 2.62), (5.10, 1.18, 2.0), (5.85, 1.30, 1.15), (6.55, 1.28, 0.25), (7.25, 1.20, -0.75),
      (7.95, 1.10, -1.85), (8.80, 1.00, -3.2), (10.2, 0.95, -4.8)]
KT_, KX_, KZ_ = (np.array(a) for a in zip(*KP))


def cat(t, xs):
    """Catmull-Rom through the key times (non-uniform keys: tangents from neighbours)"""
    i = int(np.clip(np.searchsorted(KT_, t) - 1, 0, len(KT_) - 2))
    t0, t1 = KT_[i], KT_[i + 1]
    u = (t - t0) / (t1 - t0)
    p0, p1 = xs[i], xs[i + 1]
    m0 = (xs[min(i + 1, len(xs) - 1)] - xs[max(i - 1, 0)]) / (KT_[min(i + 1, len(xs) - 1)] - KT_[max(i - 1, 0)]) * (t1 - t0)
    m1 = (xs[min(i + 2, len(xs) - 1)] - xs[i]) / (KT_[min(i + 2, len(xs) - 1)] - KT_[i]) * (t1 - t0)
    h00, h10, h01, h11 = 2 * u ** 3 - 3 * u ** 2 + 1, u ** 3 - 2 * u ** 2 + u, -2 * u ** 3 + 3 * u ** 2, u ** 3 - u ** 2
    return h00 * p0 + h10 * m0 + h01 * p1 + h11 * m1


def d_center(t):
    return Vector((cat(t, KX_), 0.0, cat(t, KZ_)))


def d_state(f):
    t = f / FPS
    c = d_center(t)
    d = d_center(t + 0.05) - d_center(t - 0.05)
    pitch = math.atan2(d.z, d.x)                       # +90 deg = nose up
    roll = math.radians(-14 * math.sin(math.pi * c01((t - 1.0) / 6.0)))     # shows a little of the back to the camera
    yaw = math.radians(-12 + 10 * c01((t - 2) / 4))
    rot = Euler((roll, -pitch, yaw), 'XYZ')
    fluke = 0.18 * math.sin(t * 5.2) * (1 - 0.6 * c01((t - 1.0) / 1.0)) + 0.06 * math.sin(t * 2.1)
    pec = 0.15 * math.sin(t * 1.8)
    return c, rot, fluke, pec


DS = [d_state(f) for f in range(NF)]
fr_all = list(range(NF))
rot_unwrap = [list(s[1]) for s in DS]
for j in range(1, NF):
    for k in range(3):
        while rot_unwrap[j][k] - rot_unwrap[j - 1][k] > math.pi:
            rot_unwrap[j][k] -= 2 * math.pi
        while rot_unwrap[j][k] - rot_unwrap[j - 1][k] < -math.pi:
            rot_unwrap[j][k] += 2 * math.pi
for j in range(3):
    key_series(dolphin, 'location', j, fr_all, [s[0][j] for s in DS])
    key_series(dolphin, 'rotation_euler', j, fr_all, [r[j] for r in rot_unwrap])
key_series(fl_piv, 'rotation_euler', 1, fr_all, [s[2] for s in DS])
for side in (-1, 1):
    piv = bpy.data.objects[f'Pec pivot {side}']
    key_series(piv, 'rotation_euler', 0, fr_all, [side * s[3] for s in DS])


def d_matrix(f):
    c, rot, _, _ = DS[f]
    return Matrix.Translation(c) @ Euler(rot_unwrap[f], 'XYZ').to_matrix().to_4x4()


# ================================================================================================ yarn spray, droplets, sequins
CUR[0] = 'Spray'
SPRAY_COLS = ['#FFFFFF', '#EAF7FB', '#C4EAF0', '#9FE0E6', '#FFFFFF', '#DDF2F7']
pom_mesh = []
for k, c in enumerate(SPRAY_COLS):
    o_ = sphere(f'Pom proto {k}', 1.0, felt(f'Pom {k}', c, 70, sheen=1.0), 14, 7)
    pom_mesh.append(o_.data)
    bpy.data.objects.remove(o_)
GOLD = ['#FFD66E', '#FFE7A3', '#FFC24A']
gold_mesh = []
for k, c in enumerate(GOLD):
    mat, em = emissive(f'Sequin {k}', c, 9.0)
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0)
    me = bpy.data.meshes.new(f'Sequin proto {k}')
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    gold_mesh.append(me)
G_SLOW = 2.2                                   # gravity in this slow-motion world (m/s^2)
N_DROPS = [0]


def drop(name, mesh, t0, p, v, size, life, g=G_SLOW, grow=0.08, buoy=False):
    f0 = SEC(t0)
    f1 = min(NF - 1, f0 + int(life * FPS) + 1)
    if f0 >= NF - 1:
        return None
    ob = link(bpy.data.objects.new(f'{name} {N_DROPS[0]}', mesh))
    N_DROPS[0] += 1
    frames = list(range(max(0, f0 - 1), f1 + 1))
    P, S = [], []
    for f in frames:
        u = max(0.0, (f - f0) / FPS)
        q = Vector(p) + Vector(v) * u + Vector((0, 0, (0.5 if buoy else -0.5) * g * u * u))
        s_ = size * c01(u / grow) * (1 - c01((u - life * 0.7) / (life * 0.3)))
        if q.z < 0.0 and u > 0.1 and not buoy:
            s_ *= max(0.0, 1 + q.z / 0.25)
        P.append(q)
        S.append(s_)
    for j in range(3):
        key_series(ob, 'location', j, frames, [q[j] for q in P])
        key_series(ob, 'scale', j, frames, S)
    visible_keys(ob, [(f0, f1)])
    tryset(ob, visible_shadow=False)
    return ob


def burst(name, t0, center, n, speed, up, life=2.2, size=(0.04, 0.12), seed=0, along=None, gold=0.0):
    r = np.random.default_rng(seed)
    for k in range(n):
        c = Vector(center)
        if along is not None:
            c = c + Vector(along[0]).normalized() * along[1] * r.uniform(-1, 1)
        a = r.uniform(0, 2 * math.pi)
        hv = speed * r.uniform(0.25, 1.0)
        v = Vector((math.cos(a) * hv, math.sin(a) * hv * 0.7, up * r.uniform(0.45, 1.2)))
        isg = r.random() < gold
        drop(name, gold_mesh[k % 3] if isg else pom_mesh[k % len(pom_mesh)], t0 + r.uniform(0, 0.12), c, v,
             r.uniform(*size) * (0.45 if isg else 1.0), life * r.uniform(0.75, 1.1))


foam_mat = knit_mat('Foam boucle', '#F4FBFF', coords='XY', spm=(5, 7), tile='seed', bump=1.6, dist=0.05, sheen=1.0, dark=0.6)


def ring(name, t0, center, r0, r1, life, minor, mat, wob=0.04):
    f0 = SEC(t0)
    f1 = min(NF - 1, f0 + int(life * FPS))
    a = np.linspace(0, 2 * np.pi, 97)
    ob = curve_obj(name, [np.c_[np.cos(a), np.sin(a), wob * np.sin(a * 9)]], minor, mat, closed=True)
    frames = list(range(f0, f1 + 1))
    key_fn(ob, 'location', 3, lambda f: tuple(Vector(center)), frames)
    key_fn(ob, 'scale', 3, lambda f: (lerp(r0, r1, ease_out((f - f0) / FPS / life)),) * 2 + (1.0,), frames)
    visible_keys(ob, [(f0, f1)])
    tryset(ob, visible_shadow=False)
    return ob


# the way out: the sea bulges (a foam dome), then bursts
ENTRY_OUT = Vector((-0.95, 0, 0.05))
dome = sphere('Bulge', 1.0, foam_mat, 32, 16)
key_fn(dome, 'scale', 3, lambda f: (0.5 * smooth((f / FPS - 0.25) / 0.3) + 0.01, 0.5 * smooth((f / FPS - 0.25) / 0.3) + 0.01,
                                    0.3 * smooth((f / FPS - 0.25) / 0.3) * (1 - smooth((f / FPS - 0.7) / 0.5)) + 0.01), list(range(0, 50)))
dome.location = ENTRY_OUT + Vector((0, 0, -0.15))
visible_keys(dome, [(SEC(0.2), SEC(1.25))])
burst('Spray out', T_OUT, ENTRY_OUT + Vector((0, 0, 0.1)), 110, 1.8, 3.2, life=2.2, size=(0.02, 0.06), seed=1, gold=0.2)
ring('Foam out', T_OUT + 0.05, ENTRY_OUT, 0.4, 1.8, 2.6, 0.06, foam_mat)

# droplets and sequins shed along the body while it is in the air (the reference's falling water ribbons and sparkles)
rt = np.random.default_rng(7)
for f in range(SEC(0.7), SEC(T_TAIL_IN)):
    M = d_matrix(f)
    t = f / FPS
    vel = (d_center(t + 0.02) - d_center(t - 0.02)) / 0.04
    for k in range(3):
        sl = rt.uniform(-1.45, 0.2)                              # mostly the rear half and the flukes
        lp = Vector((sl, rt.uniform(-0.12, 0.12), rt.uniform(-0.25, 0.05)))
        p = M @ lp
        if p.z < 0.05:
            continue
        isg = rt.random() < 0.42
        v = vel * 0.18 + Vector((rt.normal(0, 0.12), rt.normal(0, 0.12), rt.uniform(-0.6, 0.0)))
        drop('Drip', gold_mesh[k % 3] if isg else pom_mesh[(f + k) % len(pom_mesh)], t, p, v,
             rt.uniform(0.010, 0.022) if isg else rt.uniform(0.018, 0.04), rt.uniform(1.4, 2.4))

# the way in: nose splash, the big splash as the flukes go in, the foam ring, gold yarn rings and the fountain of sequins
p_nose = d_center(T_NOSE_IN)
P_IN = Vector((p_nose.x, 0, 0.05))
burst('Spray nose', T_NOSE_IN - 0.05, P_IN, 80, 1.4, 2.4, life=2.0, size=(0.02, 0.06), seed=2, gold=0.2)
burst('Spray tail', T_TAIL_IN - 0.05, P_IN + Vector((-0.1, 0, 0)), 140, 2.0, 3.2, life=2.4, size=(0.025, 0.07), seed=3, gold=0.3)
ring('Foam in', T_NOSE_IN, P_IN, 0.3, 1.25, 3.0, 0.04, foam_mat)
ring('Foam in 2', T_TAIL_IN + 0.1, P_IN, 0.4, 1.7, 2.4, 0.05, foam_mat, wob=0.06)
gring_mats = []
for k, (t0, r1) in enumerate([(7.75, 1.0), (8.15, 1.4), (8.6, 1.8), (9.05, 2.2)]):
    m, em = emissive(f'Gold ring {k}', '#FFD677', 0.0)
    f0 = SEC(t0)
    key_node(em, 1, lambda f, f0=f0: 7.0 * c01((f - f0) / 6) * (1 - 0.75 * c01((f - f0) / FPS / 2.4)), list(range(max(0, f0 - 1), NF)))
    ring(f'Gold ring {k}', t0, P_IN + Vector((0, 0, 0.04)), 0.2, r1, NF / FPS - t0 + 0.1, 0.014, m, wob=0.02)
glow_mat, glow_em = emissive('Water glow', '#FFC95A', 0.0)
gd = cylinder('Water glow', 1.0, 1.0, 0.02, glow_mat, seg=48)
gd.location = P_IN + Vector((0, 0, 0.02))
key_fn(gd, 'scale', 3, lambda f: (0.1 + 0.35 * ease_out((f / FPS - 7.7) / 1.6),) * 2 + (1,), list(range(SEC(7.6), NF)))
key_node(glow_em, 1, lambda f: 2.5 * smooth((f / FPS - 7.7) / 0.6), list(range(SEC(7.5), NF)))
visible_keys(gd, [(NF + 5, NF + 6)])                       # (kept off: it read as a flat disc)
tryset(gd, visible_shadow=False)
rf = np.random.default_rng(9)
for k in range(150):                                        # the sequins rise out of the water and float up
    t0 = rf.uniform(7.8, 9.7)
    a = rf.uniform(0, 2 * math.pi)
    rr = rf.uniform(0, 0.5)
    p = P_IN + Vector((rr * math.cos(a), rr * math.sin(a), 0.0))
    v = Vector((math.cos(a) * rf.uniform(0.05, 0.35), math.sin(a) * rf.uniform(0.05, 0.3), rf.uniform(0.9, 2.4)))
    drop('Rise', gold_mesh[k % 3], t0, p, v, rf.uniform(0.012, 0.03), rf.uniform(1.6, 2.6), g=0.35, grow=0.15, buoy=False)
print('drops', N_DROPS[0])

# ================================================================================================ lights and world
CUR[0] = 'Lights'
WBG.inputs[0].default_value = rgba('#BFD3EA')
WBG.inputs[1].default_value = 0.55
L_sun = sun('Evening sun', Vector((-0.55, 0.75, -0.35)), 3.6, '#FFDDB0', angle=0.04)      # low, from behind the lens, a little left
L_rim = sun('Sky rim', Vector((0.3, -0.8, -0.5)), 1.2, '#CFE2FF', angle=0.3)
L_fill = area('Fill', (-2.0, -6.0, 3.0), (0.0, 0.0, 1.5), 6.0, 900, '#FFE9CF')
L_glow = point('Water gold', P_IN + Vector((0, -0.4, 0.5)), 0.0, '#FFC95A', 0.6)
key_fn(L_glow.data, 'energy', 0, lambda f: 260 * smooth((f / FPS - 7.7) / 0.8), list(range(SEC(7.5), NF)))
L_key = area('Dolphin key', (0, -4, 2), (0, 0, 1), 3.0, 0.0, '#FFF1D6')
wk = L_key.constraints.new('TRACK_TO')
wk.target = dolphin
wk.track_axis = 'TRACK_NEGATIVE_Z'
wk.up_axis = 'UP_Y'
key_fn(L_key, 'location', 3, lambda f: tuple(DS[f][0] + Vector((1.6, -3.2, 1.4))), list(range(0, NF, 2)))
key_fn(L_key.data, 'energy', 0, lambda f: 260 * smooth((f / FPS - 0.5) / 0.6), list(range(0, NF, 2)))

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


def cam_state(f):
    t = f / FPS
    c = DS[f][0]
    up = smooth((t - 6.4) / 2.4)                                       # rises at the end to look down on the rings
    loc = Vector((-0.1 + 0.4 * smooth(t / 10), -4.1 + 0.3 * smooth(t / 10) - 0.9 * up, 0.45 + 1.1 * up + 0.04 * math.sin(t * 1.3)))
    follow = smooth((t - 0.6) / 1.0) * (1 - smooth((t - 6.6) / 1.4))
    tz = lerp(0.75, min(c.z, 2.75) - 0.05, follow)
    tz = lerp(tz, 0.35, smooth((t - 7.0) / 1.6))
    tx = lerp(-0.6, c.x * 0.8, smooth((t - 0.6) / 1.4))
    tx = lerp(tx, P_IN.x * 0.9, smooth((t - 7.0) / 1.6))
    tgt = Vector((tx, 0.0, tz))
    lens = lerp(34, 36, smooth((t - 1.0) / 3)) + 4 * smooth((t - 6.8) / 2.0)
    return loc, tgt, lens


CS = [cam_state(f) for f in range(NF)]
rot_list = []
for loc, tgt, lens in CS:
    rot_list.append((Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler())
for j in range(3):
    key_series(cam, 'location', j, fr_all, [c[0][j] for c in CS])
    key_series(cam, 'rotation_euler', j, fr_all, [r[j] for r in rot_list])
key_series(cam_d, 'lens', 0, fr_all, [c[2] for c in CS])
key_series(cam_d, 'dof.aperture_fstop', 0, fr_all, [5.6] * NF)
key_series(cam_d, 'dof.focus_distance', 0, fr_all, [(DS[f][0] - CS[f][0]).length if f < SEC(7.2) else (P_IN - CS[f][0]).length for f in range(NF)])
sc.view_settings.exposure = float(opt('--exposure', 0.0))

# ================================================================================================ glow (compositor glare, if available)
try:
    sc.render.use_compositing = True
    ng = bpy.data.node_groups.new('DolphinComp', 'CompositorNodeTree')
    sc.compositing_node_group = ng
    gi = ng.interface.new_socket('Image', in_out='OUTPUT', socket_type='NodeSocketColor')
    rl = ng.nodes.new('CompositorNodeRLayers')
    gl = ng.nodes.new('CompositorNodeGlare')
    for k, v in (('glare_type', 'FOG_GLOW'), ('quality', 'HIGH'), ('threshold', 3.0), ('size', 7), ('mix', -0.6)):
        try:
            setattr(gl, k, v)
        except Exception:
            pass
    for nm, v in (('Type', 'Fog Glow'), ('Threshold', 3.0), ('Strength', 0.45), ('Size', 0.5)):
        if nm in gl.inputs:
            try:
                gl.inputs[nm].default_value = v
            except Exception as e:  # noqa: BLE001
                print('  glare input', nm, e)
    out = ng.nodes.new('NodeGroupOutput')
    ng.links.new(rl.outputs['Image'], gl.inputs['Image'])
    ng.links.new(gl.outputs['Image'], out.inputs[0])
    print('GLARE on')
except Exception as e:  # noqa: BLE001
    print('GLARE skipped', type(e).__name__, e)


# ================================================================================================ geometry for the text layer
def project(p, f):
    loc = Vector(CS[f][0])
    m = (Matrix.Translation(loc) @ rot_list[f].to_matrix().to_4x4()).inverted()
    q = m @ Vector(p)
    k = 1080 * CS[f][2] / cam_d.sensor_width
    if q.z >= -0.01:
        return None
    return [round(540 + k * q.x / -q.z, 1), round(960 - k * q.y / -q.z, 1)]


geom = {'fps': FPS, 'frames': NF, 'allah': [], 'entry': []}
for f in range(NF):
    geom['allah'].append(project(d_matrix(f) @ Vector((0.26, -0.3, 0.0)), f))
    geom['entry'].append(project(P_IN, f))
(OUT / 'geom.json').write_text(json.dumps(geom, separators=(',', ':')))

# ================================================================================================ render
if MODE == 'geom':
    sys.exit(0)
if MODE == 'blend':
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'dolphinknit.blend'))
    sys.exit(0)


def render_frame(f, dst):
    sc.frame_set(f)
    sc.render.filepath = str(dst)
    t0 = time.time()
    bpy.ops.render.render(write_still=True)
    return time.time() - t0


CAMO = opt('--camo')
if CAMO:
    v_ = [float(x) for x in CAMO.split(',')]
    cam.animation_data_clear()
    cam_d.animation_data_clear()
    cam.location = v_[:3]
    cam.rotation_euler = (Vector(v_[3:6]) - Vector(v_[:3])).to_track_quat('-Z', 'Y').to_euler()
    cam_d.lens = v_[6]
    cam_d.dof.use_dof = False
if MODE == 'stills':
    frames = [int(x) for x in (POS[0] if POS else '0,60,120').split(',')]
    (OUT / 'stills').mkdir(exist_ok=True)
    times = []
    for f in frames:
        times.append(render_frame(f, OUT / 'stills' / (f's{f:04d}.jpg' if not CAMO else f'dbg{f:04d}.jpg')))
        print(f'STILL {f} {times[-1]:.1f} s', flush=True)
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
        print(f'FRAME {f} {dt:.1f} s', flush=True)
    print(f'DONE {n} frames in {time.time() - t_all:.0f} s', flush=True)
