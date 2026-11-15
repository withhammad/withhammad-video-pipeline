"""TAHLIL-KNIT 3D plates: the private knitted "La ilaha illallah wahdahu x10" dhikr reel for the owner's wife (@heal.ingthroughquran).
Reference DfOTKmjIIU2 (@sabbih.ar): a bead string slides one bead per count, the counted bead turns gold, a ring counter fills to
10, "taqabbal Allah" and an end card. Rebuilt here as real 3D knitwork, rendered headless with EEVEE:

    studio/heavy.sh /Applications/Blender.app/Contents/MacOS/Blender -b -P studio/blender/tahlilknit/build.py -- <out> stills 0,30,200
    studio/heavy.sh /Applications/Blender.app/Contents/MacOS/Blender -b -P studio/blender/tahlilknit/build.py -- <out> anim [first] [last]
    ... -- <out> geom            (only writes <out>/geom.json: per-frame screen anchors for the Remotion text layer)
    ... -- <out> fgpass          (the burst pompoms and snippets alone, RGBA, S10-2 .. S10+112, laid over the text in Remotion)

Production run (2026-11-15, Apple M1 Pro, EEVEE, 12 TAA samples, motion blur, depth of field, 1080x1920): 150-frame chunks, each
through heavy.sh with a 25 s pause between chunks so other sessions can take the lock, `anim <a> <b> --samples 12 --exposure -0.7`.
Measured: 2.9-3.1 s/frame while counting, ~6-8 s in the opening (22 hair pompoms + beads in flight), ~4 s from the burst on;
1537 frames in about 80 minutes. Stills at the same settings took 4.5-6.8 s each (first frame includes shader compilation).

Options after the mode: --timing <json> ({"steps": [10 frames where the counter steps], "end": end-card frame}; default the
reference clock 58 + 150 k), --samples N (EEVEE TAA samples, default 32), --pct P (resolution percent, default 100).

Scene (1 unit = 100 px on the subject plane y = 0; camera 50 mm at y = -15; frames 0..1536 = the reference's 1537 frames):
  - a knitted wall (y = +2.5): stockinette relief from a numpy-built tileable height map (twisted plies, per-stitch tension),
    one yarn colour per stitch (lavender to apricot ombre, heathered, eight-pointed star motifs and Fair Isle bands); it knits
    itself in row by row in the opening, a gold glow running along the live row;
  - a felted plaque with a running-stitch border for the Arabic text (text itself is composited in Remotion: HarfBuzz shaping);
  - a three-ply twisted cord on a catenary, felted wool beads with hair fuzz sliding one bead per count; the bead reaching the
    centre swells and is dyed its own colour (ten colours), the others stay undyed cream;
  - the counter: a wooden embroidery hoop stretched with knitted cloth; each count winds a new colour of yarn around the rim,
    so the hoop ends wrapped in ten colours; at 10 the beads ripple and 18 pompoms and yarn snippets burst out of the hoop;
  - pompoms at the cord ends, wound yarn balls with needles out of focus in the foreground, soft studio light, depth of field,
    a slow camera move; a felted heart pops into the hoop for the end card.
No Arabic is drawn in Blender. Outputs: <out>/frames/f0000.jpg ..., <out>/stills/, <out>/geom.json, <out>/tex/.
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

FPS, NF = 30, 1537
timing_path = opt('--timing', str(OUT / 'timing.json'))
if Path(timing_path).exists():
    TIMING = json.loads(Path(timing_path).read_text())
else:
    TIMING = {'steps': [58 + 150 * k for k in range(10)], 'end': 1464}
STEPS, END = TIMING['steps'], TIMING['end']
S10 = STEPS[-1]
SAMPLES, PCT = int(opt('--samples', 32)), int(opt('--pct', 100))
NOHAIR, RT = '--nohair' in argv, opt('--rt', '1') == '1'
rng = np.random.default_rng(1203)

# ------------------------------------------------------------------------------------------------ scene and render settings
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.name = 'TAHLIL_KNIT'
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
    sc.render.motion_blur_shutter = 0.45
except Exception:
    pass
ee = sc.eevee


def tryset(o, **kw):
    for k, v in kw.items():
        try:
            setattr(o, k, v)
        except Exception as e:  # noqa: BLE001 (API names move between Blender versions)
            print('  (skip', k, type(e).__name__, ')')


tryset(ee, taa_render_samples=SAMPLES, use_raytracing=RT, ray_tracing_method='SCREEN', use_shadows=True, shadow_ray_count=2,
       shadow_step_count=8, use_fast_gi=True, fast_gi_method='GLOBAL_ILLUMINATION', bokeh_max_size=60, motion_blur_steps=1,
       use_volumetric_shadows=False, use_bloom=False)
try:
    ee.ray_tracing_options.resolution_scale = '2'
    ee.fast_gi_resolution = '2'
except Exception:
    pass
tryset(sc.render, hair_type='STRAND', hair_subdiv=0)
sc.view_settings.view_transform = 'Standard'
for look in ('None',):
    try:
        sc.view_settings.look = look
        break
    except TypeError:
        pass
sc.view_settings.exposure = float(opt('--exposure', -1.0))
print('VIEW', sc.view_settings.view_transform, sc.view_settings.look)

world = bpy.data.worlds.new('Studio')
sc.world = world
world.use_nodes = True
bgn = world.node_tree.nodes['Background']
bgn.inputs[0].default_value = (0.62, 0.55, 0.72, 1)
bgn.inputs[1].default_value = 0.35


def srgb(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


def rgba(h):
    return (*srgb(h), 1.0)


# ------------------------------------------------------------------------------------------------ animation helper (fast fcurves)
def key_series(idb, path, index, frames, values, interp='LINEAR'):
    """Write one fcurve on data-block idb in one go (Blender 4.4+ slotted actions, with a keyframe_insert fallback)."""
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


def key_fn(idb, path, n, fn, frames=None):
    """Key path[0..n-1] (or the scalar path when n == 0) with fn(frame) on the given frames, dropping redundant holds."""
    frames = list(range(NF)) if frames is None else frames
    vals = np.array([fn(f) for f in frames], np.float64).reshape(len(frames), -1)
    keep = [0] + [i for i in range(1, len(frames) - 1)
                  if not (np.allclose(vals[i], vals[i - 1], atol=1e-6) and np.allclose(vals[i], vals[i + 1], atol=1e-6))] + [len(frames) - 1]
    fr = [frames[i] for i in keep]
    for j in range(vals.shape[1]):
        key_series(idb, path, j, fr, vals[keep, j])


def c01(x):
    return min(1.0, max(0.0, x))


def sk(sockets, ident):
    """socket by identifier (ShaderNodeMix has one A/B/Result per data type under the same display name)"""
    for x in sockets:
        if x.identifier == ident:
            return x
    raise KeyError(ident)


def ease_out(x):
    return 1 - (1 - c01(x)) ** 3


def ease_io(x):
    u = c01(x)
    return 4 * u ** 3 if u < 0.5 else 1 - (-2 * u + 2) ** 3 / 2


def back_out(x, s=1.9):
    u = c01(x) - 1
    return 1 + (s + 1) * u ** 3 + s * u ** 2


def pulse(x, w):
    return 0.0 if x < 0 or x > w else math.sin(math.pi * x / w) ** 2


# ------------------------------------------------------------------------------------------------ procedural knit textures (numpy)
def knit_tile(n=4, px=160, seed=3, legw=0.25):
    """Tileable stockinette height map, n x n stitches: two plied legs per stitch (a V), each a rounded tube with ply twist."""
    S = n * px
    v, u = np.mgrid[0:S, 0:S].astype(np.float32) / px      # v grows downward in the image; flipped on save so v is up
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
                # the leg dips where it passes under the loop of the row above (top) and the row below (base)
                h = h * (1 - 0.35 * np.exp(-((along - 0.97) / 0.10) ** 2)) * (1 - 0.25 * np.exp(-((along - 0.04) / 0.08) ** 2))
                H = np.maximum(H, h)
    fuzz = r.normal(0, 1, (S, S)).astype(np.float32)
    k = np.ones(3, np.float32) / 3
    fuzz = np.apply_along_axis(lambda x: np.convolve(x, k, 'same'), 1, fuzz)
    H = np.clip(H + 0.035 * fuzz, 0, 1)
    return H


def save_png(arr, path, color=False):
    """arr float 0..1, (H, W) or (H, W, 3), row 0 = top; written through a Blender image (no PIL inside Blender)."""
    a = np.asarray(arr, np.float32)
    if a.ndim == 2:
        a = np.repeat(a[..., None], 3, 2)
    h, w = a.shape[:2]
    img = bpy.data.images.new(Path(path).stem, w, h, alpha=False, float_buffer=False)
    if color:
        img.colorspace_settings.name = 'sRGB'
    px = np.ones((h, w, 4), np.float32)
    px[..., :3] = a[::-1]                                   # Blender pixel rows start at the bottom
    img.pixels.foreach_set(px.ravel())
    img.filepath_raw = str(path)
    img.file_format = 'PNG'
    img.save()
    bpy.data.images.remove(img)


def hexrgb(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], np.float32)




def _star8(h=5, sq=3):
    """eight-pointed star (khatam: a square and a diamond), (2h+1)^2 stitches: 1 cream outline, 2 saffron, 3 ruby heart"""
    n = 2 * h + 1
    inside = [[max(abs(x), abs(y)) <= sq or abs(x) + abs(y) <= h for x in range(-h, h + 1)] for y in range(-h, h + 1)]
    rows = []
    for y in range(n):
        row = ''
        for x in range(n):
            if not inside[y][x]:
                row += '0'
            elif any(not (0 <= y + dy < n and 0 <= x + dx < n and inside[y + dy][x + dx]) for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                row += '1'
            elif abs(x - h) + abs(y - h) <= 1:
                row += '3'
            else:
                row += '2'
        rows.append(row)
    return rows


STAR8 = _star8()
FAIR = ["0000000000", "0010000100", "0121001210", "1232112321", "0121001210", "0010000100", "0000000000"]


def wall_maps(cols, rows):
    """One yarn colour per stitch (sRGB 0..1, row 0 = top of image = top of wall) and the knit-in order (0..1, bottom row first)."""
    stops = [hexrgb(h) for h in ('#7F6CC9', '#9C74C6', '#BF79B6', '#DE7F98', '#EC9277', '#F0A95A')]
    C = np.zeros((rows, cols, 3), np.float32)
    r = np.random.default_rng(7)
    bayer = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16 + 1 / 32
    for j in range(rows):                                    # j = image row, 0 = top
        g = j / (rows - 1) * (len(stops) - 1)
        i0 = min(int(g), len(stops) - 2)
        fr = g - i0
        for i in range(cols):
            pick = stops[i0 + 1] if bayer[j % 4, i % 4] < fr else stops[i0]   # two yarns stranded in an ordered pattern
            C[j, i] = np.clip(pick * (1 + r.normal(0, 0.025)), 0, 1)     # heathered
    star_cols = {1: hexrgb('#FFF4E2'), 2: hexrgb('#E9A93B'), 3: hexrgb('#C4475F')}
    band_cols = {0: hexrgb('#4E3477'), 1: hexrgb('#FFF1DC'), 2: hexrgb('#2BA39B'), 3: hexrgb('#F07A5E')}

    def stamp(pat, cmap, top, left):
        for y, row in enumerate(pat):
            for x, ch in enumerate(row):
                k = int(ch)
                if (k or pat is FAIR) and 0 <= top + y < rows and 0 <= left + x < cols:
                    C[top + y, (left + x) % cols] = cmap[k] * (1 + r.normal(0, 0.03))
    return C, stamp, star_cols, band_cols


# ------------------------------------------------------------------------------------------------ materials
def principled(name, color, rough=0.85, sheen=0.7, sss=0.0, coat=0.0, metal=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = color if len(color) == 4 else (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    for k, v in (('Sheen Weight', sheen), ('Sheen Roughness', 0.45), ('Subsurface Weight', sss), ('Coat Weight', coat)):
        if k in b.inputs:
            b.inputs[k].default_value = v
    if 'Subsurface Radius' in b.inputs:
        b.inputs['Subsurface Radius'].default_value = (0.08, 0.05, 0.04)
    return m, nt, b


def add_fiber_bump(nt, b, scale=90.0, strength=0.35, dist=0.02, coords='Object'):
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nz = nt.nodes.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = scale
    nz.inputs['Detail'].default_value = 10
    nz.inputs['Roughness'].default_value = 0.7
    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = strength
    bump.inputs['Distance'].default_value = dist
    nt.links.new(tc.outputs[coords], nz.inputs['Vector'])
    nt.links.new(nz.outputs['Fac'], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], b.inputs['Normal'])
    return nz


def felt(name, hexcol, scale=70.0, sheen=1.0):
    m, nt, b = principled(name, rgba(hexcol), rough=0.92, sheen=sheen, sss=0.08)
    add_fiber_bump(nt, b, scale, 0.45, 0.012)
    return m


def yarn_mat(name, hexcol, stripes=0.0):
    m, nt, b = principled(name, rgba(hexcol), rough=0.8, sheen=0.9, sss=0.05)
    nz = add_fiber_bump(nt, b, 160.0, 0.5, 0.008)
    return m


# ------------------------------------------------------------------------------------------------ geometry helpers
def link(ob):
    sc.collection.objects.link(ob)
    return ob


def mesh_obj(name, bm, mat=None, smooth=True):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    ob = link(bpy.data.objects.new(name, me))
    if mat:
        ob.data.materials.append(mat)
    return ob


def sphere(name, r, mat, seg=40, rings=20):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    return mesh_obj(name, bm, mat)


def curve_obj(name, splines, depth, mat, res=3, closed=False, caps=True):
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = depth
    cu.bevel_resolution = res
    cu.use_fill_caps = caps
    for pts in splines:
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


def add_fuzz(ob, mat_index, count, length, children=8, rand=0.55, rough=0.6, radius=0.0035, seed=0):
    if NOHAIR:
        return None
    md = ob.modifiers.new('fuzz', 'PARTICLE_SYSTEM')
    ps = ob.particle_systems[-1]
    ps.seed = seed
    st = ps.settings
    st.type = 'HAIR'
    st.count = count
    st.hair_length = length
    st.use_advanced_hair = False
    st.emit_from = 'FACE'
    st.use_emit_random = True
    st.factor_random = rand * length          # (hair_length IS normal_factor x 4 in RNA: never set normal_factor after it)
    st.brownian_factor = 0.0
    st.render_type = 'PATH'
    st.display_step = 3
    st.render_step = 3
    st.material = mat_index
    st.child_type = 'INTERPOLATED'
    st.child_percent = 10
    st.rendered_child_count = children
    st.child_length = 1.0
    st.roughness_1 = rough * length * 3
    st.roughness_1_size = 1.0
    st.roughness_2 = rough * length * 2
    st.roughness_endpoint = rough * length
    st.kink = 'CURL'
    st.kink_amplitude = 0.4 * length
    st.kink_frequency = 3.0
    tryset(st, root_radius=1.0, tip_radius=0.15, radius_scale=radius, shape=-0.2)
    return md


def px2w(x, y, depth=0.0):
    """screen px (final framing) -> world point on the plane y = depth"""
    s = (15.0 + depth) / 15.0
    return Vector(((x - 540) / 100 * s, depth, (960 - y) / 100 * s))


# ================================================================================================ the knitted wall
WALL_Y, WALL_W, WALL_H = 2.5, 15.0, 26.0
COLS, ROWS = 47, 96
tile = knit_tile()
save_png(tile, OUT / 'tex' / 'knit_tile.png')
C, stamp, star_cols, band_cols = wall_maps(COLS, ROWS)


def row_of(py):          # image row (0 = top) of the wall stitch behind screen y (final framing)
    z = (960 - py) / 100 * (15 + WALL_Y) / 15
    return int(round((WALL_H / 2 - z) / (WALL_H / ROWS)))


def col_of(px):
    x = (px - 540) / 100 * (15 + WALL_Y) / 15
    return int(round((x + WALL_W / 2) / (WALL_W / COLS)))


for left, top in ((col_of(128) - 5, row_of(1338) - 5), (col_of(952) - 5, row_of(1338) - 5)):
    stamp(STAR8, star_cols, top, left)
for top in (row_of(1735) - 3, row_of(105) - 3):
    for left in range(0, COLS + 10, 10):
        stamp(FAIR, band_cols, top, left)
save_png(C, OUT / 'tex' / 'wall_color.png', color=True)
order = np.zeros((ROWS, COLS), np.float32)
for j in range(ROWS):
    k = ROWS - 1 - j                                      # knitted from the bottom row up, boustrophedon like flat knitting
    for i in range(COLS):
        ii = i if k % 2 == 0 else COLS - 1 - i
        order[j, i] = (k + ii / COLS) / ROWS
save_png(order, OUT / 'tex' / 'wall_order.png')


def knit_material(name, color_img, order_img, cols, rows, base_hex='#3A2552', bump_strength=1.0, reveal=True):
    m, nt, b = principled(name, rgba('#FFFFFF'), rough=0.88, sheen=0.85, sss=0.04)
    N, L = nt.nodes, nt.links
    tc = N.new('ShaderNodeTexCoord')
    mp = N.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (cols / 4, rows / 4, 1)
    L.new(tc.outputs['UV'], mp.inputs['Vector'])
    ht = N.new('ShaderNodeTexImage')
    ht.image = bpy.data.images.load(str(OUT / 'tex' / 'knit_tile.png'), check_existing=True)
    ht.image.colorspace_settings.name = 'Non-Color'
    ht.interpolation = 'Cubic'
    L.new(mp.outputs['Vector'], ht.inputs['Vector'])
    col = N.new('ShaderNodeTexImage')
    col.image = bpy.data.images.load(str(color_img))
    col.interpolation = 'Closest'
    L.new(tc.outputs['UV'], col.inputs['Vector'])
    # shade the crevices between legs (yarn colour darker where the height is low)
    sh = N.new('ShaderNodeMapRange')
    sh.inputs['From Min'].default_value, sh.inputs['From Max'].default_value = 0.0, 1.0
    sh.inputs['To Min'].default_value, sh.inputs['To Max'].default_value = 0.38, 1.05
    L.new(ht.outputs['Color'], sh.inputs['Value'])
    mul = N.new('ShaderNodeMix')
    mul.data_type = 'RGBA'
    mul.blend_type = 'MULTIPLY'
    sk(mul.inputs, 'Factor_Float').default_value = 1.0
    L.new(col.outputs['Color'], sk(mul.inputs, 'A_Color'))
    L.new(sh.outputs['Result'], sk(mul.inputs, 'B_Color'))
    bump = N.new('ShaderNodeBump')
    bump.inputs['Distance'].default_value = 0.05
    L.new(ht.outputs['Color'], bump.inputs['Height'])
    L.new(bump.outputs['Normal'], b.inputs['Normal'])
    if not reveal:
        bump.inputs['Strength'].default_value = bump_strength
        L.new(sk(mul.outputs, 'Result_Color'), b.inputs['Base Color'])
        return m, None
    # knit-in: stitches whose order is under the animated front are knitted; the rest is bare plum cloth; the live row glows gold
    od = N.new('ShaderNodeTexImage')
    od.image = bpy.data.images.load(str(order_img))
    od.image.colorspace_settings.name = 'Non-Color'
    od.interpolation = 'Closest'
    L.new(tc.outputs['UV'], od.inputs['Vector'])
    front = N.new('ShaderNodeValue')
    front.name = 'Front'
    sub = N.new('ShaderNodeMath')
    sub.operation = 'SUBTRACT'
    L.new(front.outputs[0], sub.inputs[0])
    L.new(od.outputs['Color'], sub.inputs[1])
    knit = N.new('ShaderNodeMapRange')                       # 0 -> 1 over one row behind the front
    knit.inputs['From Min'].default_value, knit.inputs['From Max'].default_value = 0.0, 1.0 / rows
    L.new(sub.outputs[0], knit.inputs['Value'])
    glow = N.new('ShaderNodeMapRange')                       # a bright band 3 rows long at the front
    glow.inputs['From Min'].default_value, glow.inputs['From Max'].default_value = 3.0 / rows, 0.0
    L.new(sub.outputs[0], glow.inputs['Value'])
    gate = N.new('ShaderNodeMath')
    gate.operation = 'MULTIPLY'
    L.new(glow.outputs['Result'], gate.inputs[0])
    L.new(knit.outputs['Result'], gate.inputs[1])
    mixc = N.new('ShaderNodeMix')
    mixc.data_type = 'RGBA'
    L.new(knit.outputs['Result'], sk(mixc.inputs, 'Factor_Float'))
    sk(mixc.inputs, 'A_Color').default_value = rgba(base_hex)
    L.new(sk(mul.outputs, 'Result_Color'), sk(mixc.inputs, 'B_Color'))
    L.new(sk(mixc.outputs, 'Result_Color'), b.inputs['Base Color'])
    bs = N.new('ShaderNodeMath')
    bs.operation = 'MULTIPLY'
    bs.inputs[1].default_value = bump_strength
    L.new(knit.outputs['Result'], bs.inputs[0])
    L.new(bs.outputs[0], bump.inputs['Strength'])
    b.inputs['Emission Color'].default_value = rgba('#FFC861')
    em = N.new('ShaderNodeMath')
    em.operation = 'MULTIPLY'
    em.inputs[1].default_value = 2.2
    L.new(gate.outputs[0], em.inputs[0])
    L.new(em.outputs[0], b.inputs['Emission Strength'])
    return m, front


wall_mat, front = knit_material('Knitted wall', OUT / 'tex' / 'wall_color.png', OUT / 'tex' / 'wall_order.png', COLS, ROWS)
bm = bmesh.new()
bm.faces.new([bm.verts.new(c) for c in ((-0.5, -0.5, 0), (0.5, -0.5, 0), (0.5, 0.5, 0), (-0.5, 0.5, 0))])
uv = bm.loops.layers.uv.new('UVMap')
for f in bm.faces:
    for lp in f.loops:
        lp[uv].uv = (lp.vert.co.x + 0.5, lp.vert.co.y + 0.5)
wall = mesh_obj('Knitted wall', bm, wall_mat, smooth=False)
wall.scale = (WALL_W, WALL_H, 1)
wall.rotation_euler = (math.radians(90), 0, 0)
wall.location = (0, WALL_Y, 0)
# the knit-in front: 0.30 at frame 0 (the bottom third already knitted), the whole wall by frame 34
key_fn(wall_mat.node_tree, 'nodes["Front"].outputs[0].default_value', 0,
       lambda f: 0.45 + 0.65 * ease_out(f / 30), list(range(0, 36)))

# ================================================================================================ the felted plaque (text lives here)
PLQ_Y = 1.0
PLQ_C = px2w(540, 492, PLQ_Y)
PLQ_W, PLQ_H, PLQ_R = 9.4 * (15 + PLQ_Y) / 15, 5.95 * (15 + PLQ_Y) / 15, 0.55


def rrect(w, h, r, n=10):
    pts = []
    for cx, cy, a0 in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180), (w / 2 - r, -h / 2 + r, 270)):
        for k in range(n + 1):
            a = math.radians(a0 + 90 * k / n)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


bm = bmesh.new()
vs = [bm.verts.new((x, 0, z)) for x, z in rrect(PLQ_W, PLQ_H, PLQ_R)]
face = bm.faces.new(vs)
ext = bmesh.ops.extrude_face_region(bm, geom=[face])
for v in [e for e in ext['geom'] if isinstance(e, bmesh.types.BMVert)]:
    v.co.y += 0.16
bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
plq_mat = felt('Plaque felt', '#E8D9C0', 55.0, sheen=0.25)
plaque = mesh_obj('Plaque', bm, plq_mat, smooth=False)
bev = plaque.modifiers.new('puff', 'BEVEL')
bev.width, bev.segments, bev.limit_method = 0.07, 4, 'ANGLE'
plaque.location = (PLQ_C.x, PLQ_Y - 0.08, PLQ_C.z)
# running-stitch border in plum yarn, and a second in teal just inside it
for inset, hexcol, dash, gap in ((0.24, '#6B3A86', 0.20, 0.12), (0.40, '#2BA39B', 0.11, 0.11)):
    path = rrect(PLQ_W - 2 * inset, PLQ_H - 2 * inset, max(0.1, PLQ_R - inset), 24)
    path.append(path[0])
    seg = np.array(path)
    d = np.r_[0, np.cumsum(np.hypot(*np.diff(seg, axis=0).T))]
    splines, s = [], 0.0
    while s + dash < d[-1]:
        a, b2 = np.interp(s, d, seg[:, 0]), np.interp(s, d, seg[:, 1])
        c, e = np.interp(s + dash, d, seg[:, 0]), np.interp(s + dash, d, seg[:, 1])
        m = ((a + c) / 2, (b2 + e) / 2)
        splines.append([(a, -0.01, b2), (m[0], -0.045, m[1]), (c, -0.01, e)])
        s += dash + gap
    st_ob = curve_obj(f'Plaque stitch {hexcol}', splines, 0.026, yarn_mat(f'Stitch {hexcol}', hexcol))
    st_ob.location = (PLQ_C.x, PLQ_Y - 0.08 - 0.0, PLQ_C.z)

# ================================================================================================ the cord (three twisted plies)
CORD_X0, CORD_X1 = -6.6, 6.6
Z_END, Z_MID = px2w(0, 868).z, px2w(0, 1040).z
SAG = Z_END - Z_MID
lo, hi = 0.5, 200.0
for _ in range(80):                                  # a (cosh(x/a) - 1) = SAG at x = 6.2
    a = (lo + hi) / 2
    if a * (math.cosh(6.2 / a) - 1) > SAG:
        lo = a
    else:
        hi = a
CAT_A = a
XS = np.linspace(-16, 16, 6401)
ZS = Z_MID + CAT_A * (np.cosh(XS / CAT_A) - 1)
ARC = np.r_[0, np.cumsum(np.hypot(np.diff(XS), np.diff(ZS)))]
ARC -= np.interp(0, XS, ARC)


def cord_at(s):
    """point and unit tangent on the catenary at arc length s from the centre (s > 0 to the right)"""
    x = float(np.interp(s, ARC, XS))
    z = Z_MID + CAT_A * (math.cosh(x / CAT_A) - 1)
    t = Vector((1, 0, math.sinh(x / CAT_A))).normalized()
    return Vector((x, 0, z)), t


PLY = [('#E0507A', 'Ply rose'), ('#F2B53A', 'Ply saffron'), ('#FBF1DE', 'Ply cream')]
ply_obs = []
ss = np.linspace(float(np.interp(CORD_X0, XS, ARC)), float(np.interp(CORD_X1, XS, ARC)), 1500)
for k, (hexcol, nm) in enumerate(PLY):
    pts = []
    for s in ss:
        p, t = cord_at(s)
        n = Vector((0, 1, 0)).cross(t).normalized()
        bnorm = t.cross(n)
        ang = 2 * math.pi * (s / 0.30) + k * 2 * math.pi / 3
        pts.append(tuple(p + 0.042 * (math.cos(ang) * n + math.sin(ang) * Vector((0, 1, 0)))))
    ob = curve_obj(nm, [pts], 0.044, yarn_mat(nm, hexcol), res=4)
    ob.data.bevel_factor_mapping_end = 'SPLINE'
    ply_obs.append(ob)
    # the cord whips across from the left in the opening
    key_fn(ob.data, 'bevel_factor_end', 0, lambda f: 0.22 + 0.78 * ease_out(f / 16), list(range(0, 20)))

# ================================================================================================ beads
BEAD_COLS = ['#D92E4A', '#F2A516', '#1FA36E', '#22B7B2', '#3263C9', '#9341A0', '#F26B4E', '#C9A51C', '#EC6E9A', '#5546B8']
SP = 0.58
R_N, R_C = 0.19, 0.235
cream = felt('Bead cream', '#DCC6A6', 80.0)
beads = []
for i in range(-12, 23):
    counted = 1 <= i <= 10
    if counted:
        m, nt, b = principled(f'Bead {i}', rgba('#FFFFFF'), rough=0.92, sheen=1.0, sss=0.08)
        add_fiber_bump(nt, b, 80.0, 0.45, 0.012)
        dye = nt.nodes.new('ShaderNodeValue')
        dye.name = 'Dye'
        mx = nt.nodes.new('ShaderNodeMix')
        mx.data_type = 'RGBA'
        sk(mx.inputs, 'A_Color').default_value = rgba('#DCC6A6')
        sk(mx.inputs, 'B_Color').default_value = rgba(BEAD_COLS[i - 1])
        nt.links.new(dye.outputs[0], sk(mx.inputs, 'Factor_Float'))
        nt.links.new(sk(mx.outputs, 'Result_Color'), b.inputs['Base Color'])
        b.inputs['Emission Color'].default_value = rgba(BEAD_COLS[i - 1])
        gl = nt.nodes.new('ShaderNodeValue')
        gl.name = 'Glow'
        nt.links.new(gl.outputs[0], b.inputs['Emission Strength'])
        mat = m
    else:
        mat = cream
    ob = sphere(f'Bead {i:+03d}', R_C if counted else R_N, mat, 36, 18)
    add_fuzz(ob, 1, 140, 0.026, children=6, rand=0.8, rough=0.6, radius=0.0025, seed=i + 40)
    beads.append((i, ob, counted))


def shift_at(f):
    """beads slid so far: one per count, eased with a small overshoot over the 12 frames before each step"""
    s = 0.0
    for F in STEPS:
        s += back_out((f - (F - 12)) / 12, 1.4)
    return s


def count_at(f):
    return sum(1 for F in STEPS if f >= F)


# opening flight: every visible bead flies in from a scatter near the lens, centre-out, landing frames 10..36
fly = {}
for i, ob, counted in beads:
    p_end, _ = cord_at(i * SP)
    if abs(p_end.x) > 6.0:
        continue
    rank = abs(i)
    t_land = 12 + 2.0 * rank + rng.uniform(-1, 1)
    start = Vector((rng.uniform(-3.8, 3.8), rng.uniform(-9.5, -4.0), rng.uniform(-6.5, 6.5)))
    fly[i] = (start, t_land, Vector(rng.normal(0, 1, 3)).normalized(), rng.uniform(4, 9))


def bead_state(i, f, counted):
    s = (i - shift_at(f)) * SP
    p, t = cord_at(s)
    mag = 1 + 0.42 * math.exp(-(s / 0.42) ** 2)                 # the bead at the centre swells
    if counted and f >= STEPS[i - 1] - 2:
        mag *= 1 + 0.16 * pulse((f - STEPS[i - 1] + 2) / FPS, 0.30)  # landing pop
    # the ripple at 10: each bead hops in turn, left to right
    if f > S10:
        hop = pulse((f - S10 - 6 - (p.x + 6) * 2.2) / FPS, 0.42)
        p = p + Vector((0, -0.25 * hop, 0.32 * hop))
    rot = Euler((0.0, -2.2 * s, 0.3 * math.sin(0.8 * s)))
    if i in fly:
        start, tl, axis, spin = fly[i]
        u = c01((f - (tl - 18)) / 18)
        if u < 1:
            e = ease_out(u)
            arc = Vector((0, 0, 1.4 * math.sin(math.pi * e)))
            p = start.lerp(p, e) + arc * (1 - e)
            rot = Euler(tuple(a + spin * (1 - e) * k for a, k in zip(rot, axis)))
            mag *= 1 + 0.25 * pulse(u - 0.85, 0.15)
    return p, mag, rot


for i, ob, counted in beads:
    st = [bead_state(i, f, counted) for f in range(NF)]
    for j in range(3):
        key_series(ob, 'location', j, list(range(NF)), [s[0][j] for s in st])
        key_series(ob, 'scale', j, list(range(NF)), [s[1] for s in st])
        key_series(ob, 'rotation_euler', j, list(range(NF)), [s[2][j] for s in st])
    if counted:
        F = STEPS[i - 1]
        nt = ob.data.materials[0].node_tree
        key_fn(nt, 'nodes["Dye"].outputs[0].default_value', 0, lambda f, F=F: ease_io((f - (F - 7)) / 10), list(range(F - 10, F + 6)))
        key_fn(nt, 'nodes["Glow"].outputs[0].default_value', 0,
               lambda f, F=F: 1.6 * pulse((f - F + 3) / FPS, 0.6) + (0.9 * pulse((f - S10 - 4) / FPS, 0.9) if F != S10 else 0),
               list(range(F - 5, min(NF, S10 + 40))))

# pompoms tied at both ends of the cord (they fly in with the beads)
POM_COLS = ['#D92E4A', '#F2A516', '#22B7B2', '#9341A0', '#F26B4E', '#3263C9', '#1FA36E', '#EC6E9A', '#FBF1DE']


def pompom(name, r, hexcol, seed):
    core = felt(f'{name} core', hexcol, 40.0)
    hair = yarn_mat(f'{name} hair', hexcol)
    ob = sphere(name, r * 0.55, core, 24, 12)
    ob.data.materials.append(hair)
    add_fuzz(ob, 2, 900, r * 0.62, children=10, rand=0.25, rough=0.35, radius=0.006, seed=seed)
    return ob


for k, (px_, side) in enumerate(((22, -1), (1058, 1))):
    for j in range(2):
        ob = pompom(f'End pompom {k}{j}', 0.40 - 0.08 * j, POM_COLS[(2 * k + j) * 2 % len(POM_COLS)], 300 + 10 * k + j)
        end = px2w(px_ - side * 26 * j, 905 + 92 * j, 0.0)
        start = Vector((side * 4.5, -6.0, 6.0 - 3 * j))
        key_fn(ob, 'location', 3, lambda f, s=start, e=end, d=8 + 5 * j: tuple(s.lerp(e, back_out((f - d) / 22, 1.2))) if f < d + 22 else
               tuple(e + Vector((0, 0, 0.04 * math.sin(f / 23 + d)))), list(range(NF)))
        key_fn(ob, 'rotation_euler', 3, lambda f, d=j: (0.2 * math.sin(f / 31 + d), 0.0, f / 90 + d), list(range(0, NF, 3)))

# ================================================================================================ the counter: an embroidery hoop
HOOP_C = px2w(540, 1338, 0.0)
HR, Hr = 1.74, 0.13
wood, nt, b = principled('Hoop birch', rgba('#C98A4B'), rough=0.42, sheen=0.0, coat=0.35)
wv = nt.nodes.new('ShaderNodeTexWave')
wv.inputs['Scale'].default_value = 2.5
wv.inputs['Distortion'].default_value = 1.5
ramp = nt.nodes.new('ShaderNodeValToRGB')
ramp.color_ramp.elements[0].color = rgba('#B87A42')
ramp.color_ramp.elements[1].color = rgba('#D39A5E')
nt.links.new(wv.outputs['Fac'], ramp.inputs['Fac'])
nt.links.new(ramp.outputs['Color'], b.inputs['Base Color'])
hoop = bpy.data.objects.new('Hoop', None)
link(hoop)
hoop.location = HOOP_C
# torus by hand (no operator needed in background)
bm = bmesh.new()
NU, NV = 160, 20
vv = []
for iu in range(NU):
    th = 2 * math.pi * iu / NU
    row = []
    for iv in range(NV):
        ph = 2 * math.pi * iv / NV
        rr = HR + Hr * math.cos(ph)
        row.append(bm.verts.new((rr * math.sin(th), Hr * math.sin(ph), rr * math.cos(th))))
    vv.append(row)
for iu in range(NU):
    for iv in range(NV):
        bm.faces.new((vv[iu][iv], vv[(iu + 1) % NU][iv], vv[(iu + 1) % NU][(iv + 1) % NV], vv[iu][(iv + 1) % NV]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
rim = mesh_obj('Hoop rim', bm, wood)
rim.parent = hoop
# the knitted cloth stretched in the hoop (fine stockinette, oatmeal) with the clasp at the top
cl_C = np.zeros((40, 40, 3), np.float32) + hexrgb('#F4E9D6')
cl_C *= (1 + np.random.default_rng(5).normal(0, 0.03, (40, 40, 1))).astype(np.float32)
save_png(np.clip(cl_C, 0, 1), OUT / 'tex' / 'cloth_color.png', color=True)
cloth_mat, _ = knit_material('Hoop cloth', OUT / 'tex' / 'cloth_color.png', None, 40, 40, bump_strength=0.8, reveal=False)
bm = bmesh.new()
bmesh.ops.create_circle(bm, cap_ends=True, segments=96, radius=HR - 0.02)
uv = bm.loops.layers.uv.new('UVMap')
for f in bm.faces:
    for lp in f.loops:
        lp[uv].uv = (lp.vert.co.x / (2 * HR) + 0.5, lp.vert.co.y / (2 * HR) + 0.5)
cloth = mesh_obj('Hoop cloth', bm, cloth_mat, smooth=False)
cloth.rotation_euler = (math.radians(90), 0, 0)
cloth.location = (0, 0.03, 0)
cloth.parent = hoop
brass, _, _ = principled('Brass', rgba('#D9A441'), rough=0.28, sheen=0.0, metal=1.0)
bm = bmesh.new()
bmesh.ops.create_cube(bm, size=1.0)
clasp = mesh_obj('Hoop clasp', bm, brass, smooth=False)
clasp.scale = (0.42, 0.26, 0.30)
clasp.location = (0, 0, HR + Hr + 0.12)
clasp.parent = hoop
cbev = clasp.modifiers.new('b', 'BEVEL')
cbev.width, cbev.segments = 0.25, 3
bm = bmesh.new()
bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=0.075, radius2=0.075, depth=0.75)
screw = mesh_obj('Hoop screw', bm, brass)
screw.rotation_euler = (0, math.radians(90), 0)
screw.location = (0, -0.0, HR + Hr + 0.12)
screw.parent = hoop
# ten yarn wraps around the rim, one colour per count, clockwise from the clasp
YR = 0.052
RHO = Hr + YR * 0.92
TURNS = 2 * math.pi * HR / (2 * YR * 1.04)
wraps = []
for k in range(10):
    th0, th1 = 2 * math.pi * (k + 0.03) / 10, 2 * math.pi * (k + 0.985) / 10
    n_t = TURNS / 10 * (th1 - th0) / (2 * math.pi / 10)
    npts = int(n_t * 120) + 2
    q = np.linspace(0, 1, npts)
    th = th0 + (th1 - th0) * q
    ph = 2 * math.pi * n_t * q + math.pi / 2
    rr = HR + RHO * np.cos(ph)
    P = np.c_[rr * np.sin(th), RHO * np.sin(ph), rr * np.cos(th)]
    Cn = np.c_[HR * np.sin(th), np.zeros_like(th), HR * np.cos(th)]          # tube centre under each point
    T = np.gradient(P, axis=0)
    T /= np.linalg.norm(T, axis=1)[:, None]
    N1 = P - Cn
    N1 -= (N1 * T).sum(1)[:, None] * T
    N1 /= np.linalg.norm(N1, axis=1)[:, None]
    N2 = np.cross(T, N1)
    arc = np.r_[0, np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))]
    plies = []
    for pl in range(2):
        a = 2 * np.pi * arc / (YR * 3.2) + pl * np.pi
        plies.append(P + YR * 0.48 * (np.cos(a)[:, None] * N1 + np.sin(a)[:, None] * N2))
    ob = curve_obj(f'Hoop wrap {k + 1}', plies, YR * 0.56, yarn_mat(f'Wrap {k + 1}', BEAD_COLS[k]), res=2)
    ob.data.bevel_factor_mapping_end = 'SPLINE'
    ob.parent = hoop
    F = STEPS[k]
    key_fn(ob.data, 'bevel_factor_end', 0, lambda f, F=F: ease_io((f - F + 2) / 20), list(range(max(0, F - 4), F + 22)))
    wraps.append(ob)
# the hoop swings in on its clasp in the opening; a small kick on every count; a bigger one at 10


def hoop_state(f):
    u = (f - 4) / 30
    rz = math.radians(-100) * (1 - back_out(u, 1.6)) if u < 1 else 0.0
    sc_ = 0.35 + 0.65 * back_out((f - 2) / 26, 1.4) if f < 28 else 1.0
    kick = sum(pulse((f - F) / FPS, 0.35) for F in STEPS[:-1]) * 0.035 + pulse((f - S10) / FPS, 0.5) * 0.12
    sway = math.radians(1.2) * math.sin(f / 40)
    return (HOOP_C.x, HOOP_C.y, HOOP_C.z), (sway * 0.3, sway, rz), sc_ * (1 + kick)


hs = [hoop_state(f) for f in range(NF)]
for j in range(3):
    key_series(hoop, 'location', j, list(range(NF)), [h[0][j] for h in hs])
    key_series(hoop, 'rotation_euler', j, list(range(NF)), [h[1][j] for h in hs])
    key_series(hoop, 'scale', j, list(range(NF)), [h[2] for h in hs])

# ================================================================================================ the burst at 10
burst = []
NB = 22
for k in range(NB):
    r = rng.uniform(0.20, 0.36)
    ob = pompom(f'Burst pompom {k}', r, POM_COLS[k % len(POM_COLS)], 500 + k)
    ang = 2 * math.pi * k / NB + rng.uniform(-0.15, 0.15)
    sp_ = rng.uniform(0.15, 0.27)
    v = Vector((math.cos(ang) * sp_, rng.uniform(-0.30, -0.08), math.sin(ang) * sp_ + 0.13))
    # the opening: the same pompoms hang in a cloud in front of the lens at frame 0 and are pulled into the hoop
    start = Vector((rng.uniform(-4.6, 4.6), rng.uniform(-8.5, -2.5), rng.uniform(-7.0, 7.5)))
    burst.append((ob, v, rng.uniform(0, 5), start, 6 + 1.1 * k + rng.uniform(0, 3)))
G = 0.0042
HOOP_IN = HOOP_C + Vector((0, 0.25, 0))


def burst_state(v, delay, f):
    t = f - S10 - 2 - delay
    if t <= 0:
        return tuple(HOOP_IN), 0.0
    p = HOOP_C + Vector((0, -0.15, 0)) + v * t + Vector((0, 0, -0.5 * G * t * t))
    return tuple(p), min(1.0, t / 4) * (1 + 0.3 * pulse(t / FPS, 0.25))


def intro_state(start, t_in, f):
    u = c01(f / t_in)
    e = u ** 2.2                                                  # drawn in, accelerating
    p = start.lerp(HOOP_IN, e) + Vector((0, 0, 0.6 * math.sin(math.pi * e)))
    return tuple(p), (1 - e ** 3) * (1 + 0.06 * math.sin(f / 3))


def visible_keys(ob, spans):
    """hide_render / hide_viewport keyed CONSTANT: shown only inside the spans [a, b) (saves the hair while hidden)"""
    fr, val = [0], [1.0]
    for a_, b_ in spans:
        fr += [max(0, a_), b_]
        val += [0.0, 1.0]
    if fr[1] == 0:
        fr, val = fr[1:], val[1:]
    for path in ('hide_render', 'hide_viewport'):
        key_series(ob, path, 0, fr, val, interp='CONSTANT')


for ob, v, d, start, t_in in burst:
    fr0 = list(range(0, int(t_in) + 2))
    fr1 = list(range(S10 - 2, min(NF, S10 + 110)))
    st = [intro_state(start, t_in, f) for f in fr0] + [burst_state(v, d, f) for f in fr1]
    fr = fr0 + fr1
    for j in range(3):
        key_series(ob, 'location', j, fr, [x[0][j] for x in st])
        key_series(ob, 'scale', j, fr, [x[1] for x in st])
    key_fn(ob, 'rotation_euler', 3, lambda f, d=d: (f / 9 + d, f / 13, f / 11 + 2 * d), fr[::2])
    visible_keys(ob, [(0, int(t_in) + 1), (S10 - 1, min(NF, S10 + 110))])
# yarn snippets (short curls) flying with them
for k in range(30):
    t = np.linspace(0, 1, 30)
    rad, turns, ln = rng.uniform(0.05, 0.09), rng.uniform(1.5, 3.0), rng.uniform(0.35, 0.6)
    pts = np.c_[rad * np.cos(2 * np.pi * turns * t), ln * (t - 0.5), rad * np.sin(2 * np.pi * turns * t)]
    ob = curve_obj(f'Snippet {k}', [pts], 0.024, yarn_mat(f'Snip {k}', BEAD_COLS[k % 10]), res=2)
    ang = rng.uniform(0, 2 * math.pi)
    sp_ = rng.uniform(0.12, 0.30)
    v = Vector((math.cos(ang) * sp_, rng.uniform(-0.25, -0.03), math.sin(ang) * sp_ + 0.13))
    d = rng.uniform(0, 8)
    fr = list(range(S10 - 2, min(NF, S10 + 110)))
    st = [burst_state(v, d, f) for f in fr]
    for j in range(3):
        key_series(ob, 'location', j, fr, [x[0][j] for x in st])
        key_series(ob, 'scale', j, fr, [x[1] for x in st])
    key_fn(ob, 'rotation_euler', 3, lambda f, d=d: (f / 5 + d, f / 7, f / 6 + 2 * d), fr[::2])
    visible_keys(ob, [(S10 - 1, min(NF, S10 + 110))])

# ================================================================================================ end card: a felted heart in the hoop
# a puffy knitted heart cushion: the classic heart curve, filled, extruded and bevelled round, knit stitches in rose yarn
heart_mat, nt, hb = principled('Heart knit', rgba('#E0335F'), rough=0.85, sheen=0.9, sss=0.03)
N_, L_ = nt.nodes, nt.links
tc_ = N_.new('ShaderNodeTexCoord')
sx_ = N_.new('ShaderNodeSeparateXYZ')
cx_ = N_.new('ShaderNodeCombineXYZ')
L_.new(tc_.outputs['Object'], sx_.inputs['Vector'])
L_.new(sx_.outputs['X'], cx_.inputs['X'])
L_.new(sx_.outputs['Y'], cx_.inputs['Y'])
mp_ = N_.new('ShaderNodeMapping')
mp_.inputs['Scale'].default_value = (1.5, 1.8, 1)
L_.new(cx_.outputs['Vector'], mp_.inputs['Vector'])
ht_ = N_.new('ShaderNodeTexImage')
ht_.image = bpy.data.images.load(str(OUT / 'tex' / 'knit_tile.png'), check_existing=True)
ht_.image.colorspace_settings.name = 'Non-Color'
L_.new(mp_.outputs['Vector'], ht_.inputs['Vector'])
bp_ = N_.new('ShaderNodeBump')
bp_.inputs['Strength'].default_value = 0.9
bp_.inputs['Distance'].default_value = 0.04
L_.new(ht_.outputs['Color'], bp_.inputs['Height'])
L_.new(bp_.outputs['Normal'], hb.inputs['Normal'])
rm_ = N_.new('ShaderNodeMapRange')
rm_.inputs['To Min'].default_value, rm_.inputs['To Max'].default_value = 0.45, 1.05
L_.new(ht_.outputs['Color'], rm_.inputs['Value'])
mu_ = N_.new('ShaderNodeMix')
mu_.data_type = 'RGBA'
mu_.blend_type = 'MULTIPLY'
sk(mu_.inputs, 'Factor_Float').default_value = 1.0
sk(mu_.inputs, 'A_Color').default_value = rgba('#E0335F')
L_.new(rm_.outputs['Result'], sk(mu_.inputs, 'B_Color'))
L_.new(sk(mu_.outputs, 'Result_Color'), hb.inputs['Base Color'])
tt = np.linspace(0, 2 * np.pi, 160, endpoint=False)
hx, hz = 16 * np.sin(tt) ** 3, 13 * np.cos(tt) - 5 * np.cos(2 * tt) - 2 * np.cos(3 * tt) - np.cos(4 * tt)
gk = np.exp(-0.5 * (np.arange(-15, 16) / 5.0) ** 2)
gk /= gk.sum()
# round the cusp and the tip (cyclic smoothing): a bevel on a sharp corner shoots a spike out of the outline
hx, hz = [np.convolve(np.r_[a_[-15:], a_, a_[:15]], gk, 'same')[15:-15] for a_ in (hx, hz)]
hcu = bpy.data.curves.new('Heart', 'CURVE')
hcu.dimensions = '2D'
hcu.fill_mode = 'BOTH'
hcu.extrude = 0.10
hcu.bevel_depth = 0.13
hcu.bevel_resolution = 6
hsp = hcu.splines.new('POLY')
hsp.points.add(len(tt) - 1)
hsp.points.foreach_set('co', np.c_[hx / 16 * 0.95, hz / 16 * 0.95 + 0.12, np.zeros_like(tt), np.ones_like(tt)].astype(np.float32).ravel())
hsp.use_cyclic_u = True
hcu.materials.append(heart_mat)
heart = link(bpy.data.objects.new('Heart', hcu))
heart.rotation_euler = (math.radians(90), 0, 0)
key_fn(heart, 'location', 3, lambda f: tuple(HOOP_C + Vector((0, -0.45, 0.05 + 0.04 * math.sin(f / 9)))), list(range(END - 2, NF)))
key_fn(heart, 'scale', 3, lambda f: (back_out((f - END - 4) / 16, 2.2) * (1 + 0.04 * math.sin(f / 6)),) * 3 if f >= END + 4 else
       (0.0, 0.0, 0.0), list(range(END - 2, NF)))
key_fn(heart, 'rotation_euler', 3, lambda f: (math.radians(90) + 0.10 * math.sin(f / 17), 0.06 * math.sin(f / 14), 0.0), list(range(END - 2, NF)))
visible_keys(heart, [(END + 2, NF)])

# ================================================================================================ foreground yarn balls with needles


def yarn_ball(name, r, hexcol, seed, bands=11, turns=13):
    rr = np.random.default_rng(seed)
    splines = []
    for bnd in range(bands):
        n = rr.normal(0, 1, 3)
        n /= np.linalg.norm(n)
        e1 = np.cross(n, rr.normal(0, 1, 3))
        e1 /= np.linalg.norm(e1)
        e2 = np.cross(n, e1)
        rad = r * (0.86 + 0.14 * bnd / bands)
        t = np.linspace(0, 2 * np.pi * turns, turns * 56)
        prec = t * rr.uniform(0.010, 0.020)
        c1 = np.cos(prec)[:, None] * e1 + np.sin(prec)[:, None] * n * 0.35
        c1 /= np.linalg.norm(c1, axis=1)[:, None]
        c2 = np.cross(n, c1)
        pts = np.cos(t)[:, None] * c1 + np.sin(t)[:, None] * c2
        pts = rad * pts / np.linalg.norm(pts, axis=1)[:, None]
        splines.append(pts)
    return curve_obj(name, splines, r * 0.06, yarn_mat(name, hexcol), res=2)


FG_Y = -5.0
balls = [('Yarn ball mustard', 1.05, '#E8A92A', (40, 1795)), ('Yarn ball teal', 0.95, '#1E9C95', (1040, 1820)),
         ('Yarn ball plum', 0.62, '#8C3C8E', (250, 1905))]
for k, (nm, r, hexcol, (px_, py_)) in enumerate(balls):
    ob = yarn_ball(nm, r, hexcol, 20 + k)
    core = sphere(nm + ' core', r * 0.86, felt(nm + ' core', hexcol, 30.0), 24, 12)
    core.parent = ob
    p = px2w(px_, py_, FG_Y)
    key_fn(ob, 'location', 3, lambda f, p=p, k=k: tuple(p + Vector((0, 0, -2.2 * (1 - ease_out((f - 2 * k) / 26)) + 0.03 * math.sin(f / 35 + k)))),
           list(range(0, NF, 2)))
    key_fn(ob, 'rotation_euler', 3, lambda f, k=k: (0.3 + 0.002 * f, 0.5 * k, 0.2 * k + 0.0015 * f), list(range(0, NF, 6)))
    if k == 1:          # two bamboo needles pushed into the teal ball
        bamboo = felt('Bamboo', '#D8B47A', 20.0)
        for sgn in (-1, 1):
            bm = bmesh.new()
            bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=0.055, radius2=0.055, depth=3.2)
            nd = mesh_obj(f'Needle {sgn}', bm, bamboo)
            nd.parent = ob
            nd.rotation_euler = (math.radians(70), math.radians(28 * sgn), math.radians(20))
            nd.location = (0.15 * sgn, -0.1, 0.9)
            knob = sphere(f'Needle knob {sgn}', 0.11, felt(f'Knob {sgn}', '#E0507A', 30.0), 16, 8)
            knob.parent = nd
            knob.location = (0, 0, 1.6)

# ================================================================================================ lights and camera
def area(name, loc, target, size, power, hexcol):
    li = bpy.data.lights.new(name, 'AREA')
    li.shape = 'DISK'
    li.size = size
    li.energy = power
    li.color = srgb(hexcol)
    ob = link(bpy.data.objects.new(name, li))
    ob.location = loc
    d = Vector(target) - Vector(loc)
    ob.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    return ob


area('Key', (-7.5, -10.0, 9.0), (0, 0, -0.5), 9.0, 5200, '#FFE9D2')
area('Fill', (9.0, -9.0, -3.0), (0, 0, 0), 10.0, 3500, '#D9CFFF')
area('Rim', (0.0, 1.6, 9.5), (0, 0, -1.5), 6.0, 2600, '#FFF2DE')
area('Floor bounce', (0.0, -6.0, -13.0), (0, 0, -3), 8.0, 1600, '#FFC99E')

cam_d = bpy.data.cameras.new('Cam')
cam_d.lens = 50
cam_d.sensor_fit = 'HORIZONTAL'
cam_d.sensor_width = 36
cam_d.dof.use_dof = True
cam_d.dof.aperture_fstop = 0.2
cam_d.dof.aperture_blades = 0
cam = link(bpy.data.objects.new('Cam', cam_d))
sc.camera = cam
BASE_ROT = Euler((math.radians(90), 0, 0))


def cam_state(f):
    """returns location, rotation (euler), focus distance, f-stop"""
    u = ease_out(f / 50)
    loc = Vector((0.25, -13.4, -0.45)).lerp(Vector((0, -15, 0)), u)
    roll = math.radians(-3.0) * (1 - u)
    pitch = math.radians(1.5) * (1 - u)
    if f >= 50:
        w = ease_io((f - 50) / max(1, S10 - 50))
        loc = Vector((0, -15, 0)).lerp(Vector((-0.10, -14.35, -0.12)), w)
    if f >= S10:
        sh = pulse((f - S10) / FPS, 0.3)
        loc = loc + Vector((0.03 * math.sin(f * 2.1) * sh, 0, 0.03 * math.cos(f * 2.7) * sh))
    fstop = 0.2
    if f >= END:
        w = ease_io((f - END) / 30)
        loc = loc.lerp(Vector((0.0, -14.0, -0.55)), w)        # a gentle push: the plaque stays readable for the end card
        fstop = 0.2 - 0.04 * w
    rot = Euler((BASE_ROT.x + pitch, roll, 0.0))
    focus = loc.y * -1 + 0.0                # the subject plane y = 0
    return loc, rot, focus, fstop


cs = [cam_state(f) for f in range(NF)]
for j in range(3):
    key_series(cam, 'location', j, list(range(NF)), [c[0][j] for c in cs])
    key_series(cam, 'rotation_euler', j, list(range(NF)), [c[1][j] for c in cs])
key_series(cam_d, 'dof.focus_distance', 0, list(range(NF)), [c[2] for c in cs])
key_series(cam_d, 'dof.aperture_fstop', 0, list(range(NF)), [c[3] for c in cs])


# ================================================================================================ screen anchors for Remotion
def project(p, f):
    loc, rot, _, _ = cs[f]
    m = (Matrix.Translation(loc) @ rot.to_matrix().to_4x4()).inverted()
    q = m @ Vector(p)
    k = 1080 * cam_d.lens / cam_d.sensor_width
    return 540 + k * q.x / -q.z, 960 - k * q.y / -q.z, k / -q.z


geom = {'fps': FPS, 'frames': NF, 'steps': STEPS, 'end': END, 'plaque': [], 'hoop': [], 'cam_roll': []}
for f in range(NF):
    x, y, s = project(PLQ_C + Vector((0, -0.08, 0)), f)
    geom['plaque'].append([round(x, 2), round(y, 2), round(s, 4)])          # centre px and px per world unit on the plaque
    hx, hy, hsc = project(Vector(hs[f][0]) + Vector((0, -0.03, 0)), f)
    geom['hoop'].append([round(hx, 2), round(hy, 2), round(hsc * hs[f][2], 4)])  # centre px and px per unit x hoop scale
    geom['cam_roll'].append(round(math.degrees(cs[f][1].y), 3))
(OUT / 'geom.json').write_text(json.dumps(geom, separators=(',', ':')))
print('geom.json written; plaque at frame 0 / 60:', geom['plaque'][0], geom['plaque'][60], 'hoop', geom['hoop'][60])

# ================================================================================================ render
if MODE == 'geom':
    sys.exit(0)
if MODE == 'fgpass':
    # the burst pompoms and yarn snippets alone on a transparent film (same camera, light, blur): Remotion lays this over the text
    # from S10 - 2 to S10 + 112, because they fly towards the lens, in front of the plaque
    keep = {o.name for o in sc.objects if o.name.startswith(('Burst pompom', 'Snippet'))}
    for o in list(sc.objects):
        if o.type in ('MESH', 'CURVE', 'META', 'EMPTY') and o.name not in keep:
            sc.collection.objects.unlink(o)
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    (OUT / 'fg').mkdir(exist_ok=True)
    for f in range(S10 - 2, min(NF, S10 + 113)):
        dst = OUT / 'fg' / f'f{f:04d}.png'
        if dst.exists():
            continue
        sc.frame_set(f)
        sc.render.filepath = str(dst)
        t0 = time.time()
        bpy.ops.render.render(write_still=True)
        print(f'FG {f} {time.time() - t0:.1f} s', flush=True)
    sys.exit(0)
if MODE == 'blend':
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'tahlilknit.blend'))
    sys.exit(0)
if MODE == 'stills':
    frames = [int(x) for x in (POS[0] if POS else '0,30,60,300').split(',')]
    (OUT / 'stills').mkdir(exist_ok=True)
    times = []
    for f in frames:
        sc.frame_set(f)
        sc.render.filepath = str(OUT / 'stills' / f's{f:04d}.jpg')
        t0 = time.time()
        bpy.ops.render.render(write_still=True)
        times.append(time.time() - t0)
        print(f'STILL {f} {times[-1]:.1f} s', flush=True)
    print('SECONDS_PER_FRAME', ' '.join(f'{t:.1f}' for t in times), flush=True)
elif MODE == 'anim':
    first = int(POS[0]) if POS else 0
    last = int(POS[1]) if len(POS) > 1 else NF - 1
    (OUT / 'frames').mkdir(exist_ok=True)
    t_all = time.time()
    n = 0
    for f in range(first, last + 1):
        dst = OUT / 'frames' / f'f{f:04d}.jpg'
        if dst.exists() and dst.stat().st_size > 1000:
            continue
        sc.frame_set(f)
        sc.render.filepath = str(dst)
        t0 = time.time()
        bpy.ops.render.render(write_still=True)
        n += 1
        print(f'FRAME {f} {time.time() - t0:.1f} s', flush=True)
    print(f'DONE {n} frames in {time.time() - t_all:.0f} s', flush=True)
