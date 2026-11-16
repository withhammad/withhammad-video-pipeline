"""SEA-KNIT 3D plate: the private knitted "The sea split in two" reel for the owner's wife (@heal.ingthroughquran).
Reference Dc5FJDboAsg (@m_theaicreator, 13.83 s, one AI shot): a calm sea, a strike at the shore, a jet races to the horizon, the
sea opens into two walls that rise "like a great towering mountain" (Quran ash-Shu'ara 26:63) over a dry path, a glint at the end
of the path and a white-out. Rebuilt as a real 3D knitted sea, rendered headless with EEVEE:

    studio/heavy.sh /Applications/Blender.app/Contents/MacOS/Blender -b -P studio/blender/seaknit/build.py -- <out> stills 0,30,120,300
    studio/heavy.sh /Applications/Blender.app/Contents/MacOS/Blender -b -P studio/blender/seaknit/build.py -- <out> anim <first> <last>
    ... -- <out> geom      (only writes <out>/geom.json: per-frame screen anchors for the Remotion layer)

Options after the mode: --samples N (EEVEE TAA samples, default 16), --pct P (resolution percent), --exposure E.

NO PROPHET IS SHOWN, in any form: no figure, back, silhouette, hand or shadow. The only sign of the strike is the staff itself,
a yarn-wrapped wooden staff that comes down into frame from above the lens (its upper end always outside the frame, so no hand
can be seen or implied in shot), hits the water and is lifted away. No people at all are in the scene.

Scene (1 unit ~ 1 m; the camera looks along +y; still water z = 0; frames 0..415 = 13.87 s at 30 fps):
  - the sea is ONE knitted blanket (two halves meeting at a seam on x = 0), a 300k-vertex grid whose rest coordinates are fabric
    coordinates (s = distance from the seam, y = distance from the shore), so the stitches stay on the cloth as it moves:
    rolling yarn swells with white-yarn crests; at the strike the seam unzips from the shore to the horizon and each half is
    folded up along a profile (face, overhanging crest, back slope) into a wall 24 units tall, "like a great towering mountain";
    the fabric folded into a wall shows knitted strata (indigo at the base through cobalt, teal and mint to a cream crest) and
    its stitch columns turn into vertical streaks of lighter yarn, like water streaming down;
  - a dry knitted path (honey and sand garter stitch) with felt pebbles, crochet shells and starfish, revealed as the walls part;
  - pompom spray (instanced felt balls): a splash at the strike, a jet racing along the seam, bobble foam along both crests;
  - a knitted beach and felt boulders in the foreground, a knitted sunrise sky (peach to lilac to blue) with felt clouds, and a
    crocheted sun that rises at the far end of the path (the glint and the light bloom are added in Remotion);
  - camera: low at the shore for the strike (1.00 s, on the reference's boom), a crane up and back as the walls rise to full
    height on the reference's second hit (7.00 s), then a push down the path between the walls towards the sun.
The sea mesh is rewritten with numpy before every rendered frame (no handlers), so the render is deterministic per frame.
No text is drawn in Blender. Outputs: <out>/frames/f0000.jpg ..., <out>/stills/, <out>/geom.json, <out>/tex/.
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
POS, _i = [], 2
while _i < len(argv):                       # positional arguments after the mode; --flags take one value each
    if argv[_i].startswith('--'):
        _i += 2
        continue
    POS.append(argv[_i])
    _i += 1
opt = lambda k, d=None: argv[argv.index(k) + 1] if k in argv else d
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'tex').mkdir(exist_ok=True)

FPS, NF = 30, 416                      # 13.867 s (the reference's track is 13.861 s)
T_STRIKE = 1.00                        # the reference's boom
T_TOWER = 7.00                         # the reference's second hit: the walls reach full height
T_GLINT = 13.0
SAMPLES, PCT = int(opt('--samples', 16)), int(opt('--pct', 100))
rng = np.random.default_rng(2663)

G = 3.4            # half-width of the dry path when fully open
D = 0.45           # depth of the sea bed below still water
HMAX = 24.0        # wall height (crest above still water)
KX = 0.55          # horizontal scale of the wall profile (per unit of height)
Y0 = 1.0           # where the staff strikes (on the seam)
YMAX = 640.0       # the far end of the sea
DF = 1.7           # the split races from the strike point to the horizon in 1.7 s

# ------------------------------------------------------------------------------------------------ scene and render settings
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.name = 'SEA_KNIT'
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


tryset(sc.render, motion_blur_shutter=0.4, use_lock_interface=True)
tryset(ee, taa_render_samples=SAMPLES, use_raytracing=True, ray_tracing_method='SCREEN', use_shadows=True, shadow_ray_count=2,
       shadow_step_count=8, use_fast_gi=True, fast_gi_method='GLOBAL_ILLUMINATION', bokeh_max_size=40, motion_blur_steps=1,
       clamp_surface_indirect=4.0, shadow_pool_size='1024')
try:
    ee.ray_tracing_options.resolution_scale = '2'
except Exception:
    pass
sc.view_settings.view_transform = 'Standard'          # the yarn colours as dyed (AgX greyed the pastels)
for look in ('None',):
    try:
        sc.view_settings.look = look
        break
    except TypeError:
        pass
sc.view_settings.exposure = float(opt('--exposure', -0.35))
print('VIEW', sc.view_settings.view_transform, sc.view_settings.look, flush=True)


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


def c01(x):
    return np.clip(x, 0.0, 1.0)


def smooth(e0, e1, x):
    u = c01((np.asarray(x, dtype=np.float64) - e0) / (e1 - e0))
    return u * u * (3 - 2 * u)


def ease_out(x, p=2.0):
    return 1 - (1 - c01(x)) ** p


def ease_io(x):
    u = c01(x)
    return u * u * (3 - 2 * u)


def ease_io5(x):
    u = c01(x)
    return u * u * u * (u * (6 * u - 15) + 10)


# ------------------------------------------------------------------------------------------------ world (sky light)
HAZE = '#F1C3B4'            # the far haze (matches the sky at the horizon)
world = bpy.data.worlds.new('Sky')
sc.world = world
world.use_nodes = True
wn, wl = world.node_tree.nodes, world.node_tree.links
wbg = wn['Background']
wbg.inputs[1].default_value = 0.55
_tc = wn.new('ShaderNodeTexCoord')
_sep = wn.new('ShaderNodeSeparateXYZ')
_ramp = wn.new('ShaderNodeValToRGB')
_el = _ramp.color_ramp.elements
_el[0].position, _el[0].color = 0.40, rgba('#C9A27E')
_el[1].position, _el[1].color = 1.0, rgba('#7E9BE8')
for _p, _h in ((0.5, HAZE), (0.56, '#E9A9C4'), (0.7, '#A9A2E6')):
    _e = _el.new(_p)
    _e.color = rgba(_h)
_mr = wn.new('ShaderNodeMapRange')
_mr.inputs['From Min'].default_value, _mr.inputs['From Max'].default_value = -1.0, 1.0
wl.new(_tc.outputs['Generated'], _sep.inputs[0])
wl.new(_sep.outputs['Z'], _mr.inputs['Value'])
wl.new(_mr.outputs['Result'], _ramp.inputs['Fac'])
wl.new(_ramp.outputs['Color'], wbg.inputs[0])


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


def garter_tile(n=4, px=128, seed=5):
    """Tileable garter-stitch height map: rows of purl bumps (horizontal ridges of little loops), offset every other row."""
    S = n * px
    v, u = np.mgrid[0:S, 0:S].astype(np.float32) / px
    r = np.random.default_rng(seed)
    row = np.floor(v)
    off = (row % 2) * 0.5
    lu = (u + off) % 1.0 - 0.5
    lv = v - row - 0.5
    bump = np.sqrt(np.clip(1 - (lu / 0.52) ** 2 - (lv / 0.38) ** 2, 0, 1))
    ridge = 0.35 * np.sqrt(np.clip(1 - (lv / 0.48) ** 2, 0, 1))
    H = np.maximum(bump, ridge)
    fuzz = r.normal(0, 1, (S, S)).astype(np.float32)
    return np.clip(H * 0.95 + 0.04 * fuzz, 0, 1)


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
GARTER_PNG = OUT / 'tex' / 'garter_tile.png'
if not KNIT_PNG.exists():
    save_png(knit_tile(), KNIT_PNG)
if not GARTER_PNG.exists():
    save_png(garter_tile(), GARTER_PNG)


# ------------------------------------------------------------------------------------------------ material helpers
def principled(name, color, rough=0.85, sheen=0.4, sss=0.0):
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


def add_haze(nt, b, start, end, amount=0.9, hexcol=HAZE):
    """mix the surface towards an emissive haze colour with view distance (aerial perspective without a volume)"""
    N, L = nt.nodes, nt.links
    out = N['Material Output']
    cam = N.new('ShaderNodeCameraData')
    mr = N.new('ShaderNodeMapRange')
    mr.interpolation_type = 'SMOOTHSTEP'
    mr.inputs['From Min'].default_value, mr.inputs['From Max'].default_value = start, end
    mr.inputs['To Min'].default_value, mr.inputs['To Max'].default_value = 0.0, amount
    L.new(cam.outputs['View Distance'], mr.inputs['Value'])
    em = N.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = rgba(hexcol)
    em.inputs['Strength'].default_value = 1.0
    mx = N.new('ShaderNodeMixShader')
    L.new(mr.outputs['Result'], mx.inputs['Fac'])
    L.new(b.outputs['BSDF'], mx.inputs[1])
    L.new(em.outputs['Emission'], mx.inputs[2])
    L.new(mx.outputs['Shader'], out.inputs['Surface'])
    return cam


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


def felt(name, hexcol, scale=70.0, haze=None):
    m, nt, b = principled(name, rgba(hexcol), rough=0.92, sheen=0.6, sss=0.06)
    add_fiber_bump(nt, b, scale, 0.45, 0.012)
    if haze:
        add_haze(nt, b, *haze)
    return m


def ramp_node(N, stops, interp='CONSTANT'):
    rp = N.new('ShaderNodeValToRGB')
    rp.color_ramp.interpolation = interp
    el = rp.color_ramp.elements
    for _ in range(len(stops) - len(el)):
        el.new(0.5)
    for i, (p, h) in enumerate(stops):
        el[i].position = p
        el[i].color = rgba(h)
    return rp


def mixrgb(N, L, a, b_, fac, blend='MIX'):
    m = N.new('ShaderNodeMix')
    m.data_type = 'RGBA'
    m.blend_type = blend
    if isinstance(fac, (int, float)):
        sk(m.inputs, 'Factor_Float').default_value = fac
    else:
        L.new(fac, sk(m.inputs, 'Factor_Float'))
    for sock, v in (('A_Color', a), ('B_Color', b_)):
        if isinstance(v, tuple):
            sk(m.inputs, sock).default_value = v
        else:
            L.new(v, sk(m.inputs, sock))
    return sk(m.outputs, 'Result_Color')


def math_node(N, L, op, a, b_=None, clamp=False):
    m = N.new('ShaderNodeMath')
    m.operation = op
    m.use_clamp = clamp
    for i, v in enumerate((a, b_)):
        if v is None:
            continue
        if isinstance(v, (int, float)):
            m.inputs[i].default_value = v
        else:
            L.new(v, m.inputs[i])
    return m.outputs[0]


def knit_mat(name, palette, stitch=0.06, bump=0.9, heather=0.1, haze=None, tile=KNIT_PNG):
    """box-projected stockinette (object coordinates) for the props: colour per object from a palette, heathered"""
    m, nt, b = principled(name, rgba(palette[0]), rough=0.9, sheen=0.5, sss=0.05)
    N, L = nt.nodes, nt.links
    tc = N.new('ShaderNodeTexCoord')
    mp = N.new('ShaderNodeMapping')
    s = 1 / (stitch * 4)
    mp.inputs['Scale'].default_value = (s, s, s)
    L.new(tc.outputs['Object'], mp.inputs['Vector'])
    ht = N.new('ShaderNodeTexImage')
    ht.image = bpy.data.images.load(str(tile), check_existing=True)
    ht.image.colorspace_settings.name = 'Non-Color'
    ht.projection = 'BOX'
    ht.projection_blend = 0.25
    ht.interpolation = 'Linear'
    L.new(mp.outputs['Vector'], ht.inputs['Vector'])
    rp = ramp_node(N, [(i / len(palette), h) for i, h in enumerate(palette)])
    oi = N.new('ShaderNodeObjectInfo')
    L.new(oi.outputs['Random'], rp.inputs['Fac'])
    col = rp.outputs['Color']
    if heather:
        hn = N.new('ShaderNodeTexNoise')
        hn.inputs['Scale'].default_value = 1.0 / stitch * 2.2
        L.new(tc.outputs['Object'], hn.inputs['Vector'])
        hr = N.new('ShaderNodeMapRange')
        hr.inputs['To Min'].default_value, hr.inputs['To Max'].default_value = 1 - heather, 1 + heather
        L.new(hn.outputs['Fac'], hr.inputs['Value'])
        col = mixrgb(N, L, col, hr.outputs['Result'], 1.0, 'MULTIPLY')
    sh = N.new('ShaderNodeMapRange')
    sh.inputs['To Min'].default_value, sh.inputs['To Max'].default_value = 0.4, 1.06
    L.new(ht.outputs['Color'], sh.inputs['Value'])
    L.new(mixrgb(N, L, col, sh.outputs['Result'], 1.0, 'MULTIPLY'), b.inputs['Base Color'])
    bp = N.new('ShaderNodeBump')
    bp.inputs['Strength'].default_value = bump
    bp.inputs['Distance'].default_value = stitch * 0.5
    L.new(ht.outputs['Color'], bp.inputs['Height'])
    L.new(bp.outputs['Normal'], b.inputs['Normal'])
    if haze:
        add_haze(nt, b, *haze)
    return m


# ------------------------------------------------------------------------------------------------ geometry helpers
def link(ob):
    sc.collection.objects.link(ob)
    return ob


def mesh_obj(name, bm, mats=(), smooth_=True):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = smooth_
    ob = link(bpy.data.objects.new(name, me))
    for m in mats:
        ob.data.materials.append(m)
    return ob


def curve_obj(name, pts, depth, mat, res=4, cyclic=False):
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
    sp.use_cyclic_u = cyclic
    ob = link(bpy.data.objects.new(name, cu))
    cu.materials.append(mat)
    return ob


def grid_mesh(name, xs, ys, uv_fn):
    """a quad grid (len(ys) rows x len(xs) columns) built with foreach_set (fast for 100k+ vertices)"""
    nx, ny = len(xs), len(ys)
    X, Y = np.meshgrid(xs, ys)
    co = np.zeros((nx * ny, 3), np.float32)
    co[:, 0], co[:, 1] = X.ravel(), Y.ravel()
    me = bpy.data.meshes.new(name)
    me.vertices.add(nx * ny)
    me.vertices.foreach_set('co', co.ravel())
    ii, jj = np.meshgrid(np.arange(nx - 1), np.arange(ny - 1))
    a = (jj * nx + ii).ravel()
    quads = np.stack([a, a + 1, a + 1 + nx, a + nx], 1)
    nq = len(quads)
    me.loops.add(nq * 4)
    me.loops.foreach_set('vertex_index', quads.ravel().astype(np.int32))
    me.polygons.add(nq)
    me.polygons.foreach_set('loop_start', (np.arange(nq) * 4).astype(np.int32))
    me.update(calc_edges=True)
    me.polygons.foreach_set('use_smooth', np.ones(nq, bool))
    uv = me.uv_layers.new(name='UVMap')
    lv = quads.ravel()
    uv.data.foreach_set('uv', uv_fn(X.ravel()[lv], Y.ravel()[lv]).astype(np.float32).ravel())
    me.validate()
    ob = link(bpy.data.objects.new(name, me))
    return ob, me


# ================================================================================================ the knitted sea (one blanket)
def s_columns():
    """column positions from the seam outwards: dense over the wall face and crest, coarse far out"""
    a = np.arange(0.0, 34.0, 0.12)
    b = np.arange(34.0, 72.0, 0.3)
    c = 72.0 + np.cumsum(np.geomspace(0.4, 14.0, 70))
    return np.concatenate([a, b, c[c < 460]])


def y_rows():
    ys = [-2.5]
    while ys[-1] < YMAX:
        y = ys[-1]
        ys.append(y + 0.2 + 0.0115 * max(0.0, y))
    return np.array(ys)


SH = s_columns()
SC = np.concatenate([-SH[::-1], SH])          # signed fabric coordinate per column (left half reversed: the seam is in the middle)
YR = y_rows()
NH, NC, NR = len(SH), len(SC), len(YR)
STITCH_V, STITCH_S = 0.16, 0.13               # stitch width along y and height along s, in fabric units
print('SEA grid', NR, 'rows x', NC, 'columns =', NR * NC, 'vertices', flush=True)
sea, sea_me = grid_mesh('Knitted sea', SC, YR, lambda x, y: np.stack([y / (4 * STITCH_V), np.abs(x) / (4 * STITCH_S)], 1))
# the two halves must not be stitched together at the seam: remove the faces of the column pair that straddles s = 0
bm = bmesh.new()
bm.from_mesh(sea_me)
bm.verts.ensure_lookup_table()
kill = [f for f in bm.faces if {v.index % NC for v in f.verts} == {NH - 1, NH}]
bmesh.ops.delete(bm, geom=kill, context='FACES_ONLY')
bm.to_mesh(sea_me)
bm.free()
assert len(sea_me.vertices) == NR * NC, 'the vertex order must stay the grid order'
for nm in ('lift', 'strata', 'foam', 'streamm'):
    sea_me.attributes.new(nm, 'FLOAT', 'POINT')

# the sea material: stockinette in fabric (UV) coordinates; colour = distance ombre for the open sea, knitted strata on the walls
SEA_BANDS = [(0.00, '#3FD0C8'), (0.05, '#24BCC4'), (0.11, '#16A2BC'), (0.18, '#1689B5'), (0.27, '#1C72AE'), (0.38, '#255EA8'),
             (0.50, '#3352A0'), (0.62, '#45499C'), (0.76, '#5A4A9C'), (0.90, '#6E55A4')]
STRATA = [(0.00, '#29358F'), (0.08, '#2F4FBB'), (0.17, '#2E6ED6'), (0.27, '#8A63DA'), (0.295, '#2486DD'), (0.37, '#1BA0DC'),
          (0.46, '#14B0D0'), (0.55, '#17C2BE'), (0.63, '#3CD4B0'), (0.705, '#FF9FB8'), (0.72, '#74E0C0'), (0.80, '#A9EDD3'),
          (0.87, '#D5F6E6'), (0.93, '#FFFAF0')]
sea_m, nt, b = principled('Knitted sea', rgba('#1C72AE'), rough=0.88, sheen=0.22, sss=0.04)
N, L = nt.nodes, nt.links
uvn = N.new('ShaderNodeUVMap')
uvn.uv_map = 'UVMap'
ht = N.new('ShaderNodeTexImage')
ht.image = bpy.data.images.load(str(KNIT_PNG), check_existing=True)
ht.image.colorspace_settings.name = 'Non-Color'
ht.interpolation = 'Linear'
L.new(uvn.outputs['UV'], ht.inputs['Vector'])
# per-stitch cell id (4 stitches per UV unit) -> white noise for heathered, slightly uneven yarn
cellv = N.new('ShaderNodeVectorMath')
cellv.operation = 'SCALE'
L.new(uvn.outputs['UV'], cellv.inputs[0])
cellv.inputs['Scale'].default_value = 4.0
cellf = N.new('ShaderNodeVectorMath')
cellf.operation = 'FLOOR'
L.new(cellv.outputs['Vector'], cellf.inputs[0])
wn_ = N.new('ShaderNodeTexWhiteNoise')
wn_.noise_dimensions = '3D'
L.new(cellf.outputs['Vector'], wn_.inputs['Vector'])
sepc = N.new('ShaderNodeSeparateXYZ')
L.new(cellf.outputs['Vector'], sepc.inputs[0])
# stitch-column streaks: some columns (constant y) are knitted in a lighter yarn -> wave rows on the sea, streams on the walls
colnoise = N.new('ShaderNodeTexWhiteNoise')
colnoise.noise_dimensions = '1D'
L.new(math_node(N, L, 'FLOOR', math_node(N, L, 'DIVIDE', sepc.outputs['X'], 2.0)), colnoise.inputs['W'])
streak = math_node(N, L, 'GREATER_THAN', colnoise.outputs['Value'], 0.92)
# distance ombre (rest y, banded on stitch rows) with per-stitch jitter
dist = N.new('ShaderNodeMapRange')
dist.inputs['From Min'].default_value, dist.inputs['From Max'].default_value = 0.0, 260.0 / (4 * STITCH_V) * 4
L.new(sepc.outputs['X'], dist.inputs['Value'])
jit = N.new('ShaderNodeMapRange')
jit.inputs['To Min'].default_value, jit.inputs['To Max'].default_value = -0.025, 0.025
L.new(wn_.outputs['Value'], jit.inputs['Value'])
sea_rp = ramp_node(N, SEA_BANDS)
L.new(math_node(N, L, 'ADD', dist.outputs['Result'], jit.outputs['Result']), sea_rp.inputs['Fac'])
# strata on the walls (attribute 'strata' 0 at the base .. 1 at the crest), banded with the same jitter
at_strata = N.new('ShaderNodeAttribute')
at_strata.attribute_name = 'strata'
st_rp = ramp_node(N, STRATA)
L.new(math_node(N, L, 'ADD', at_strata.outputs['Fac'], jit.outputs['Result']), st_rp.inputs['Fac'])
at_lift = N.new('ShaderNodeAttribute')
at_lift.attribute_name = 'lift'
at_foam = N.new('ShaderNodeAttribute')
at_foam.attribute_name = 'foam'
at_stream = N.new('ShaderNodeAttribute')
at_stream.attribute_name = 'streamm'
col = mixrgb(N, L, sea_rp.outputs['Color'], st_rp.outputs['Color'], at_lift.outputs['Fac'])
# streak columns: a lighter aqua yarn (stronger on the walls)
streak_f = math_node(N, L, 'MULTIPLY', streak, math_node(N, L, 'ADD', 0.30, math_node(N, L, 'MULTIPLY', at_stream.outputs['Fac'], 0.12)))
col = mixrgb(N, L, col, rgba('#D8F6EE'), streak_f)
# foam: cream white yarn, blended per stitch (a stitch is foam when its noise is under the foam level)
foam_st = math_node(N, L, 'GREATER_THAN', at_foam.outputs['Fac'], math_node(N, L, 'ADD', 0.42, math_node(N, L, 'MULTIPLY', wn_.outputs['Value'], 0.3)))
col = mixrgb(N, L, col, rgba('#FFF8EE'), foam_st)
# heather
hn = N.new('ShaderNodeMapRange')
hn.inputs['To Min'].default_value, hn.inputs['To Max'].default_value = 0.88, 1.10
L.new(wn_.outputs['Value'], hn.inputs['Value'])
col = mixrgb(N, L, col, hn.outputs['Result'], 1.0, 'MULTIPLY')
# stitch relief shading, faded out with view distance (no moire on the far sea)
cam = N.new('ShaderNodeCameraData')
far = N.new('ShaderNodeMapRange')
far.interpolation_type = 'SMOOTHSTEP'
far.inputs['From Min'].default_value, far.inputs['From Max'].default_value = 45.0, 220.0
far.inputs['To Min'].default_value, far.inputs['To Max'].default_value = 1.0, 0.0
L.new(cam.outputs['View Distance'], far.inputs['Value'])
sh = N.new('ShaderNodeMapRange')
sh.inputs['To Min'].default_value, sh.inputs['To Max'].default_value = 0.38, 1.07
L.new(ht.outputs['Color'], sh.inputs['Value'])
shade = mixrgb(N, L, rgba('#E2E2E2'), sh.outputs['Result'], far.outputs['Result'])
col = mixrgb(N, L, col, shade, 1.0, 'MULTIPLY')
L.new(col, b.inputs['Base Color'])
bp = N.new('ShaderNodeBump')
bp.inputs['Distance'].default_value = 0.035
L.new(far.outputs['Result'], bp.inputs['Strength'])
L.new(ht.outputs['Color'], bp.inputs['Height'])
L.new(bp.outputs['Normal'], b.inputs['Normal'])
add_haze(nt, b, 110.0, 640.0, 0.92)
sea.data.materials.append(sea_m)

# ---- the wall profile: a normalized cross-section (x outward from the face, z 0 = base .. 1 = crest), Catmull-Rom sampled
SHAPE = np.array([(0.00, 0.00), (0.035, 0.10), (0.045, 0.28), (0.025, 0.48), (-0.015, 0.66), (-0.045, 0.80), (-0.035, 0.90),
                  (0.02, 0.965), (0.12, 0.997), (0.28, 0.99), (0.48, 0.94), (0.70, 0.84), (0.94, 0.67), (1.20, 0.46), (1.50, 0.26),
                  (1.84, 0.10), (2.22, 0.02), (2.7, 0.0)])


def catmull(P, n=24):
    P = np.vstack([2 * P[0] - P[1], P, 2 * P[-1] - P[-2]])
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for t in np.linspace(0, 1, n, endpoint=False):
            out.append(0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(P[-2])
    return np.array(out)


PROF = catmull(SHAPE)
PX, PZ = PROF[:, 0], PROF[:, 1]
CREST_I = int(np.argmax(PZ))


def front_time(y):
    """when the split front passes row y: it races out from the strike point (y grows with the square of time, which on screen
    reads as a race that slows towards the horizon), and back to the shore in 0.25 s"""
    y = np.asarray(y, np.float64)
    v = c01((y - Y0) / (YMAX - Y0))
    tf = T_STRIKE + 0.05 + DF * v ** 0.5
    back = T_STRIKE + 0.05 + 0.25 * c01((Y0 - y) / (Y0 + 2.5))
    return np.where(y >= Y0, tf, back)


def rise(t):
    """global height factor: the walls keep climbing until the reference's second hit (7.00 s), a small settle after it"""
    r = 0.34 + 0.66 * ease_io5((t - (T_STRIKE + 0.5)) / (T_TOWER - T_STRIKE - 0.5))
    after = t - T_TOWER
    if after > 0:
        r += 0.035 * math.exp(-after / 0.45) * math.sin(after * 9.0)
    return r + 0.02 * c01((t - T_TOWER) / 6.0)


def bed_depth(y):
    return D * smooth(-2.5, 3.0, y)


def taper(y):
    return smooth(-2.0, 9.0, y) ** 0.7


def sea_state(t):
    """positions (NR*NC x 3) and the shader attributes of the knitted sea at time t (seconds)"""
    y = YR
    a = ease_out((t - front_time(y)) / 0.95, 2.4) * (t > front_time(y))          # per row: 0 closed .. 1 open
    H = HMAX * taper(y) * (a ** 0.75) * rise(t)
    g = G * ease_out(a / 0.75, 2.0)
    zb = -bed_depth(y) * c01(a * 3)
    # per-row profile polylines (rows x M)
    X = g[:, None] + PX[None, :] * (H * KX)[:, None]
    Z = zb[:, None] + PZ[None, :] * (H - zb)[:, None]
    seg = np.sqrt(np.diff(X, axis=1) ** 2 + np.diff(Z, axis=1) ** 2)
    Lc = np.concatenate([np.zeros((NR, 1)), np.cumsum(seg, 1)], 1) + np.linspace(0, 1e-5, len(PX))[None, :]
    P = Lc[:, -1]
    s = SH                                                   # |s| per half column
    xa = np.empty((NR, NH))
    za = np.empty((NR, NH))
    zs = np.empty((NR, NH))
    for r in range(NR):
        on = s <= P[r]
        xa[r] = np.interp(s, Lc[r], X[r])
        za[r] = np.interp(s, Lc[r], Z[r])
        zs[r] = np.interp(s, Lc[r], np.broadcast_to(PZ, PX.shape))
        off = X[r, -1] - P[r]
        far = ~on
        xa[r, far] = s[far] + off * np.exp(-(s[far] - P[r]) / 70.0)
        za[r, far] = 0.0
        zs[r, far] = 0.0
    S2, Y2 = np.meshgrid(s, y)
    onwall = S2 <= P[:, None]
    lift = c01(H[:, None] / 2.5) * onwall * (1 - smooth(0.82, 1.0, S2 / np.maximum(P[:, None], 1e-3)))
    # rolling yarn swells (towards the shore) on the open sea; they flatten where the fabric is lifted into a wall
    ph1 = 0.45 * Y2 + 0.06 * S2 + 1.7 * t
    w = 0.6 * np.sin(ph1) + 0.4 * np.sin(0.37 * Y2 - 0.19 * S2 + 1.3 * t) + 0.18 * np.sin(1.7 * Y2 + 0.9 * S2 + 2.7 * t)
    amp = 0.26 * (0.45 + 0.55 * smooth(-2.5, 6.0, Y2))
    calm = 1 - c01(lift * 1.5)
    za = za + amp * w * calm
    # white yarn surf lines rolling in to the shore (thin rows of cream stitches), broken into patches along the row
    surf = smooth(0.90, 0.985, np.sin(0.9 * Y2 + 0.04 * S2 + 2.4 * t)) * smooth(34.0, 4.0, Y2)
    patch = smooth(-0.2, 0.5, np.sin(0.35 * S2 + 1.3 * np.floor((0.9 * Y2 + 2.4 * t) / (2 * np.pi))))
    foam = c01(surf * patch + 0.6 * smooth(0.95, 1.12, w)) * calm
    # the strike: a dip and rings racing out from the strike point
    dt = t - T_STRIKE
    if dt > 0:
        R = np.sqrt(S2 ** 2 + (Y2 - Y0) ** 2)
        ring = 0.30 * math.exp(-dt / 0.9) * np.exp(-((R - 5.0 * dt) / 0.55) ** 2) * np.sin(3.2 * (R - 5.0 * dt) + 1.2)
        dip = -0.35 * math.exp(-dt / 0.22) * np.exp(-R ** 2 / 0.5)
        za = za + (ring + dip) * calm
        foam = np.maximum(foam, 0.75 * math.exp(-dt / 0.6) * np.exp(-((R - 5.0 * dt) / 0.3) ** 2) * calm)
    # water streaming down the faces: a gentle travelling undulation across the face, and white churn at the opening front
    face = onwall & (zs < 0.97)
    und = 0.05 * np.sin(0.9 * Y2 + 0.45 * S2 - 2.2 * t) + 0.04 * np.sin(0.31 * Y2 - 0.7 * S2 + 1.4 * t)
    xa = xa + und * lift * face
    opening = (a > 0) & (a < 0.55)
    churn = (opening[:, None] * (1 - a[:, None] / 0.55)) * np.exp(-S2 / 2.0)
    foam = np.maximum(foam, c01(churn * 1.6))
    xs = np.concatenate([-xa[:, ::-1], xa], 1)
    zz = np.concatenate([za[:, ::-1], za], 1)
    Yf = np.concatenate([Y2[:, ::-1], Y2], 1)
    co = np.stack([xs, Yf, zz], 2).reshape(-1, 3).astype(np.float32)
    att = {'lift': lift, 'strata': zs * (lift > 0.01), 'foam': foam, 'streamm': lift * face}
    att = {k: np.concatenate([v[:, ::-1], v], 1).ravel().astype(np.float32) for k, v in att.items()}
    rows = {'a': a, 'H': H, 'g': g, 'zb': zb, 'Lc': Lc, 'X': X, 'Z': Z}
    return co, att, rows


def sea_update(t):
    co, att, rows = sea_state(t)
    sea_me.vertices.foreach_set('co', co.ravel())
    for k, v in att.items():
        sea_me.attributes[k].data.foreach_set('value', v)
    sea_me.update()
    return rows


# ================================================================================================ the dry path (sea bed)
# bands of honey, sand and apricot garter stitch across the path (one object per band, six yarns)
band_cols = ['#E8C48A', '#D6A266', '#F2D7A6', '#CC9358', '#E6B97E', '#DDB07A']
band_m = [knit_mat(f'Path band {i}', [h], stitch=0.10, bump=0.9, heather=0.12, haze=(110.0, 640.0, 0.92), tile=GARTER_PNG)
          for i, h in enumerate(band_cols)]
yb = -2.5
k = 0
while yb < YMAX:
    hgt = 1.6 + 0.02 * max(0.0, yb)
    m = band_m[k % len(band_m)]
    bm = bmesh.new()
    ny = max(2, int(hgt / 0.5))
    vs = []
    for j in range(ny + 1):
        yy = yb + hgt * j / ny
        row = []
        for i in range(9):
            xx = -6.0 + 12.0 * i / 8
            zz = -float(bed_depth(yy)) + 0.015 * math.sin(xx * 3.1 + yy * 1.7)
            row.append(bm.verts.new((xx, yy, zz)))
        vs.append(row)
    for j in range(ny):
        for i in range(8):
            bm.faces.new([vs[j][i], vs[j][i + 1], vs[j + 1][i + 1], vs[j + 1][i]])
    mesh_obj(f'Path band {k}', bm, [m])
    yb += hgt
    k += 1

BOULDERS = [(-4.2, -4.6, 1.15), (-5.4, -3.0, 0.8), (-6.5, -2.4, 0.5), (4.4, -4.4, 1.05), (5.6, -2.8, 0.75), (6.6, -2.3, 0.45),
            (-8.0, -1.0, 1.4), (8.5, -0.8, 1.3), (-12, 2.5, 1.6), (12.5, 3.0, 1.7), (-17, -6, 2.2), (17, -7, 2.4)]
# felt pebbles, crochet shells and starfish on the path (all below still water: hidden until the sea parts)
peb_cols = ['#8A7F9E', '#B07A6A', '#7E9A8C', '#C9B49A', '#9C6F8E', '#6F8FB0']
peb_m = [felt(f'Pebble {i}', h, 60.0, haze=(110.0, 640.0, 0.92)) for i, h in enumerate(peb_cols)]
star_m = [felt('Starfish coral', '#F2775B', 90.0), felt('Starfish orange', '#F5A04A', 90.0), felt('Starfish pink', '#E86C9A', 90.0)]
shell_m = [knit_mat('Shell', ['#F8E3D0', '#F6CDB8', '#FBEFE2'], stitch=0.012, bump=0.8)]
for i in range(160):
    if i < 120:                                                # on the sea bed (deep enough to stay hidden under the water)
        yy = float(rng.uniform(3.5, 90.0)) if rng.random() < 0.5 else float(rng.uniform(3.5, 25.0))
        xx = float(rng.uniform(-(G - 0.5), G - 0.5))
        z0 = -float(bed_depth(yy))
    else:                                                      # on the beach
        yy = float(rng.uniform(-15.0, -2.6))
        xx = float(rng.uniform(-11.0, 11.0))
        if any((xx - bx) ** 2 + (yy - by) ** 2 < (br + 0.4) ** 2 for bx, by, br in BOULDERS):
            continue
        z0 = 0.05 + 0.025 * (-2.0 - yy)
    kind = rng.random()
    bm = bmesh.new()
    if kind < 0.55:                                            # a felt pebble
        bmesh.ops.create_uvsphere(bm, u_segments=14, v_segments=8, radius=1.0)
        r0 = float(rng.uniform(0.05, 0.13)) * (1 + yy / 60)
        for v in bm.verts:
            v.co = Vector((v.co.x * r0 * rng.uniform(1.0, 1.5), v.co.y * r0, max(v.co.z, -0.2) * r0 * 0.55))
        ob = mesh_obj(f'Pebble {i}', bm, [peb_m[i % len(peb_m)]])
    elif kind < 0.8:                                           # a crochet starfish: five flat tapered arms
        r0 = float(rng.uniform(0.12, 0.2)) * (1 + yy / 60)
        for a in range(5):
            ang = 2 * math.pi * a / 5
            res = bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=r0 * 0.22, radius2=r0 * 0.05, depth=r0)
            for v in res['verts']:
                p = Vector((v.co.x, v.co.y, v.co.z + r0 / 2))       # along +z
                p = Vector((p.z * math.cos(ang) - p.x * math.sin(ang), p.z * math.sin(ang) + p.x * math.cos(ang), p.y * 0.35))
                v.co = p
        ob = mesh_obj(f'Starfish {i}', bm, [star_m[i % 3]])
    else:                                                      # a ribbed shell (a squashed half sphere)
        r0 = float(rng.uniform(0.08, 0.14)) * (1 + yy / 60)
        bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=8, radius=1.0)
        for v in bm.verts:
            ang = math.atan2(v.co.y, v.co.x)
            rib = 1 + 0.08 * math.cos(ang * 9)
            v.co = Vector((v.co.x * r0 * rib, v.co.y * r0 * 0.9 * rib, max(v.co.z, 0) * r0 * 0.5))
        ob = mesh_obj(f'Shell {i}', bm, shell_m)
    ob.location = (xx, yy, z0 + 0.01)
    ob.rotation_euler = (0, 0, float(rng.uniform(0, 6.28)))

# ================================================================================================ beach and foreground boulders
beach_cols = ['#F1D3A2', '#E7BE86', '#F6E0BA', '#E3B27C', '#F0CB96', '#EAC08E']
beach_m = [knit_mat(f'Knitted beach {i}', [h], stitch=0.07, bump=1.0, heather=0.14, tile=GARTER_PNG) for i, h in enumerate(beach_cols)]
y_edges = [-40.0, -14.0, -8.0, -5.5, -4.0, -2.9, -2.0]
for k in range(len(y_edges) - 1):
    bm = bmesh.new()
    vs = []
    for j in range(5):
        yy = y_edges[k] + (y_edges[k + 1] - y_edges[k]) * j / 4
        row = []
        for i in range(21):
            xx = -60.0 + 120.0 * i / 20
            row.append(bm.verts.new((xx, yy, 0.05 + 0.025 * (-2.0 - yy))))
        vs.append(row)
    for j in range(4):
        for i in range(20):
            bm.faces.new([vs[j][i], vs[j][i + 1], vs[j + 1][i + 1], vs[j + 1][i]])
    mesh_obj(f'Beach {k}', bm, [beach_m[k % len(beach_m)]])
edge_m = felt('Beach edge yarn', '#F6E7CC', 120.0)
curve_obj('Beach cast-on edge', [(-60, -2.0, 0.06), (60, -2.0, 0.06)], 0.035, edge_m)

rock_m = [knit_mat(f'Boulder {i}', [h], stitch=0.05, bump=1.0, heather=0.12) for i, h in
          enumerate(['#6E6A8E', '#8A5A6E', '#4F7A7A', '#A0704E', '#5B6A9A', '#7D5A8F'])]
for i, (bx, by, br) in enumerate(BOULDERS):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=3, radius=1.0)
    for v in bm.verts:
        n = v.co.normalized()
        d = 1 + 0.12 * math.sin(n.x * 4.1 + i) * math.cos(n.y * 3.3 - i) + 0.06 * math.sin(n.z * 7 + 2 * i)
        v.co = Vector((n.x * d * br * 1.15, n.y * d * br, max(n.z * d, -0.3) * br * 0.8))
    ob = mesh_obj(f'Boulder {i}', bm, [rock_m[i % len(rock_m)]])
    ob.location = (bx, by, 0.0)
    ob.rotation_euler = (0, 0, float(rng.uniform(0, 6.28)))

# ================================================================================================ sky, clouds and the crocheted sun
SKY_R = 950.0
sky_m, nt, b = principled('Knitted sky', rgba('#F2C6B0'))
N, L = nt.nodes, nt.links
for n_ in list(N):
    if n_.type != 'OUTPUT_MATERIAL':
        N.remove(n_)
uvn = N.new('ShaderNodeUVMap')
uvn.uv_map = 'UVMap'
sep = N.new('ShaderNodeSeparateXYZ')
L.new(uvn.outputs['UV'], sep.inputs[0])
SKY_ROWS, SKY_COLS = 130.0, 300.0
rowf = math_node(N, L, 'FLOOR', math_node(N, L, 'MULTIPLY', sep.outputs['Y'], SKY_ROWS))
wnz = N.new('ShaderNodeTexWhiteNoise')
wnz.noise_dimensions = '2D'
cellx = math_node(N, L, 'FLOOR', math_node(N, L, 'MULTIPLY', sep.outputs['X'], SKY_COLS))
cxy = N.new('ShaderNodeCombineXYZ')
L.new(cellx, cxy.inputs['X'])
L.new(rowf, cxy.inputs['Y'])
L.new(cxy.outputs['Vector'], wnz.inputs['Vector'])
sky_rp = ramp_node(N, [(0.00, '#EBB9A6'), (0.018, '#F7C99A'), (0.04, '#FBD9A2'), (0.07, '#F7B79F'), (0.105, '#EFA2B6'),
                       (0.145, '#D99FCB'), (0.195, '#B8A0DE'), (0.25, '#9DA7EA'), (0.32, '#86A6EE'), (0.42, '#749CEA')], 'LINEAR')
vband = math_node(N, L, 'ADD', math_node(N, L, 'DIVIDE', rowf, SKY_ROWS), math_node(N, L, 'MULTIPLY', wnz.outputs['Value'], 0.012))
L.new(vband, sky_rp.inputs['Fac'])
ht = N.new('ShaderNodeTexImage')
ht.image = bpy.data.images.load(str(KNIT_PNG), check_existing=True)
ht.image.colorspace_settings.name = 'Non-Color'
ht.interpolation = 'Linear'
mp = N.new('ShaderNodeMapping')
mp.inputs['Scale'].default_value = (SKY_COLS / 4, SKY_ROWS / 4, 1)
L.new(uvn.outputs['UV'], mp.inputs['Vector'])
L.new(mp.outputs['Vector'], ht.inputs['Vector'])
shr = N.new('ShaderNodeMapRange')
shr.inputs['To Min'].default_value, shr.inputs['To Max'].default_value = 0.72, 1.04
L.new(ht.outputs['Color'], shr.inputs['Value'])
skycol = mixrgb(N, L, sky_rp.outputs['Color'], shr.outputs['Result'], 1.0, 'MULTIPLY')
em = N.new('ShaderNodeEmission')
em.inputs['Strength'].default_value = 1.0
L.new(skycol, em.inputs['Color'])
L.new(em.outputs['Emission'], N['Material Output'].inputs['Surface'])
bm = bmesh.new()
uvl = bm.loops.layers.uv.new('UVMap')
SEG, ZLO, ZHI = 48, -80.0, 2600.0
vs = []
for j in range(2):
    row = []
    for i in range(SEG + 1):
        a = -0.95 + 1.9 * i / SEG
        row.append(bm.verts.new((SKY_R * math.sin(a), SKY_R * math.cos(a), ZLO if j == 0 else ZHI)))
    vs.append(row)
for i in range(SEG):
    f = bm.faces.new([vs[0][i], vs[0][i + 1], vs[1][i + 1], vs[1][i]])
    for lp, (uu, zz) in zip(f.loops, ((i / SEG, ZLO), ((i + 1) / SEG, ZLO), ((i + 1) / SEG, ZHI), (i / SEG, ZHI))):
        lp[uvl].uv = (uu, zz / ZHI)                              # v = 0 on the horizon, 1 at the top of the dome
sky = mesh_obj('Knitted sky', bm, [sky_m])

cloud_cols = ['#FFF1E4', '#F9D9E2', '#E9DAF3', '#FFE6C9', '#F4CFD6']
cloud_m = [knit_mat(f'Cloud {i}', [h], stitch=0.9, bump=0.7, heather=0.06, haze=(300.0, 950.0, 0.45)) for i, h in enumerate(cloud_cols)]
for c in range(14):
    side = -1 if c % 2 == 0 else 1
    cy = float(rng.uniform(380, 820))
    cx = side * float(rng.uniform(25, 220)) * (cy / 600)
    cz = float(rng.uniform(26, 120)) * (cy / 600)
    sz = float(rng.uniform(14, 30)) * (cy / 600)
    bm = bmesh.new()
    for p in range(int(rng.integers(7, 12))):
        res = bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=12, radius=1.0)
        r0 = sz * float(rng.uniform(0.45, 0.9))
        ox, oz = float(rng.uniform(-1.6, 1.6)) * sz, float(rng.uniform(-0.2, 0.5)) * sz
        for v in res['verts']:
            v.co = Vector((v.co.x * r0 + ox, v.co.y * r0 * 0.85, max(v.co.z, -0.45) * r0 * 0.85 + oz))
    ob = mesh_obj(f'Felt cloud {c}', bm, [cloud_m[c % len(cloud_m)]])
    ob.location = (cx, cy, cz)

SUN_Y, SUN_R = 780.0, 30.0
sun_cols = ['#FFF4C2', '#FFE07A', '#FFC24A', '#FF9F3A', '#FF8A4C', '#F7716A']
sun = bpy.data.objects.new('Crochet sun', None)
link(sun)
for i, h in enumerate(sun_cols):
    m = bpy.data.materials.new(f'Sun ring {i}')
    m.use_nodes = True
    nt = m.node_tree
    for n_ in list(nt.nodes):
        if n_.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n_)
    e = nt.nodes.new('ShaderNodeEmission')
    e.inputs['Color'].default_value = rgba(h)
    e.inputs['Strength'].default_value = 2.4 - 0.25 * i
    nz = nt.nodes.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = 1.4
    mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['To Min'].default_value, mr.inputs['To Max'].default_value = 0.8, 1.15
    nt.links.new(nz.outputs['Fac'], mr.inputs['Value'])
    mm = nt.nodes.new('ShaderNodeMath')
    mm.operation = 'MULTIPLY'
    mm.inputs[1].default_value = 2.4 - 0.25 * i
    nt.links.new(mr.outputs['Result'], mm.inputs[0])
    nt.links.new(mm.outputs[0], e.inputs['Strength'])
    nt.links.new(e.outputs['Emission'], nt.nodes['Material Output'].inputs['Surface'])
    r_in = SUN_R * i / len(sun_cols)
    r_out = SUN_R * (i + 1) / len(sun_cols)
    pts = []
    turns = 1.0
    for k in range(97):
        ang = 2 * math.pi * k / 96
        rr = (r_in + r_out) / 2 + 0.12 * (r_out - r_in) * math.sin(ang * 36)      # crochet ring: little bumps of stitches
        pts.append((rr * math.cos(ang), 0.0, rr * math.sin(ang)))
    ring = curve_obj(f'Sun ring {i}', pts, (r_out - r_in) * 0.55, m, res=3, cyclic=True)
    ring.parent = sun


def sun_z(t):
    return -46.0 + 52.0 * ease_out((t - 8.6) / 5.2, 1.6)


# ================================================================================================ the staff (no hand, ever)
wood = knit_mat('Knitted staff', ['#8A5B34', '#7A4E2C', '#966640'], stitch=0.02, bump=1.0, heather=0.08)
wrap_cols = ['#F2B33D', '#E8505B', '#2FB7B0', '#F2B33D']
STAFF_L, STAFF_R = 12.0, 0.075
bm = bmesh.new()
res = bmesh.ops.create_cone(bm, cap_ends=True, segments=20, radius1=STAFF_R, radius2=STAFF_R * 1.18, depth=STAFF_L)
for v in res['verts']:
    v.co.z += STAFF_L / 2                                       # tip at the origin, the staff along +z
res = bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=8, radius=STAFF_R * 1.02)
staff = mesh_obj('Staff', bm, [wood])
for w_, (z0, z1) in enumerate(((0.55, 0.95), (1.25, 1.42), (1.6, 2.1), (2.35, 2.5))):
    pts = []
    turns = (z1 - z0) / 0.028
    for k in range(int(turns * 18) + 1):
        u = k / (turns * 18)
        ang = 2 * math.pi * turns * u
        pts.append((STAFF_R * 1.06 * math.cos(ang), STAFF_R * 1.06 * math.sin(ang), z0 + (z1 - z0) * u))
    wr = curve_obj(f'Staff wrap {w_}', pts, 0.016, felt(f'Wrap yarn {w_}', wrap_cols[w_], 160.0), res=2)
    wr.parent = staff
    wr.visible_shadow = False
staff.visible_shadow = False
TIP = Vector((0.0, Y0, 0.0))
SDIR = Vector((-0.12, -0.62, 1.0)).normalized()                 # up and back, over the lens: the top end is never in frame
staff.rotation_mode = 'QUATERNION'
staff.rotation_quaternion = SDIR.to_track_quat('Z', 'Y')


def staff_d(t):
    """distance of the tip from the strike point along the staff axis"""
    if t < 0.30:
        return 16.0
    if t < 0.78:
        return 16.0 - 12.6 * ease_out((t - 0.30) / 0.48, 2.2)        # comes down into frame
    if t < 0.86:
        return 3.4 + 0.5 * ease_io((t - 0.78) / 0.08)                 # a short lift before the strike
    if t < T_STRIKE:
        u = (t - 0.86) / (T_STRIKE - 0.86)
        return 3.9 * (1 - u * u)                                      # the strike, accelerating
    if t < 1.30:
        return -0.08 * math.sin(math.pi * (t - T_STRIKE) / 0.30)
    return 16.0 * ease_io((t - 1.30) / 0.95) ** 1.6                  # lifted away, out of frame


for f in range(NF):
    t = f / FPS
    staff.location = TIP + SDIR * staff_d(t)
    staff.keyframe_insert('location', frame=f)
    hide = bool(staff_d(t) > 15.5)
    staff.hide_render = hide
    staff.keyframe_insert('hide_render', frame=f)
    for ch in staff.children:
        ch.hide_render = hide
        ch.keyframe_insert('hide_render', frame=f)

# ================================================================================================ pompom spray (instanced felt balls)
ng = bpy.data.node_groups.new('Pompoms', 'GeometryNodeTree')
ng.interface.new_socket('Geometry', in_out='INPUT', socket_type='NodeSocketGeometry')
ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
gi = ng.nodes.new('NodeGroupInput')
go = ng.nodes.new('NodeGroupOutput')
iop = ng.nodes.new('GeometryNodeInstanceOnPoints')
ico = ng.nodes.new('GeometryNodeMeshIcoSphere')
ico.inputs['Radius'].default_value = 1.0
ico.inputs['Subdivisions'].default_value = 2
na = ng.nodes.new('GeometryNodeInputNamedAttribute')
na.data_type = 'FLOAT'
na.inputs['Name'].default_value = 'radius'
real = ng.nodes.new('GeometryNodeRealizeInstances')
smo = ng.nodes.new('GeometryNodeSetShadeSmooth')
smat = ng.nodes.new('GeometryNodeSetMaterial')
ng.links.new(gi.outputs[0], iop.inputs['Points'])
ng.links.new(ico.outputs['Mesh'], iop.inputs['Instance'])
ng.links.new(na.outputs['Attribute'], iop.inputs['Scale'])
ng.links.new(iop.outputs['Instances'], real.inputs['Geometry'])
ng.links.new(real.outputs['Geometry'], smo.inputs['Geometry'])
ng.links.new(smo.outputs['Geometry'], smat.inputs['Geometry'])
ng.links.new(smat.outputs['Geometry'], go.inputs[0])
pom_m, nt, b = principled('Pompom yarn', rgba('#FFFFFF'), rough=0.95, sheen=1.0, sss=0.08)
N, L = nt.nodes, nt.links
atc = N.new('ShaderNodeAttribute')
atc.attribute_name = 'col'
prp = ramp_node(N, [(0.0, '#FFFFFF'), (0.35, '#FFF6E8'), (0.55, '#D9F5EF'), (0.72, '#A8E6DE'), (0.86, '#7FD6D8'), (0.95, '#F3C6DA')])
L.new(atc.outputs['Fac'], prp.inputs['Fac'])
L.new(prp.outputs['Color'], b.inputs['Base Color'])
add_fiber_bump(nt, b, 40.0, 0.9, 0.05)
add_haze(nt, b, 110.0, 640.0, 0.85)
smat.inputs['Material'].default_value = pom_m

# particles: (origin xyz, velocity xyz, birth t, radius, colour, gravity scale)
P_O, P_V, P_T, P_R, P_C, P_G = [], [], [], [], [], []


def emit(o, v, tb, r, c, gs=1.0):
    P_O.append(o); P_V.append(v); P_T.append(tb); P_R.append(r); P_C.append(c); P_G.append(gs)


for i in range(170):                                           # the splash at the strike
    ang = rng.uniform(0, 2 * math.pi)
    sp = rng.uniform(0.8, 3.4)
    emit((0.0, Y0, 0.0), (sp * math.cos(ang), sp * math.sin(ang) * 0.8, rng.uniform(2.5, 7.0)), T_STRIKE + rng.uniform(0, 0.06),
         rng.uniform(0.03, 0.075), rng.uniform(0, 0.9))
for i in range(700):                                           # the jet racing along the seam
    yy = float(Y0 + 4.0 + (YMAX * 0.7 - Y0) * rng.random() ** 1.5)
    sc_ = 1 + yy / 45
    tb = float(front_time(yy)) + rng.uniform(-0.02, 0.05)
    emit((rng.uniform(-0.15, 0.15) * sc_, yy, 0.0), (rng.normal(0, 0.9) * sc_, rng.normal(0, 0.4) * sc_, rng.uniform(3.0, 8.5) * sc_ ** 0.8),
         tb, rng.uniform(0.04, 0.09) * sc_ ** 0.9, rng.uniform(0, 0.75), sc_ ** 0.6)
for i in range(60):                                            # back towards the shore
    yy = float(rng.uniform(-2.0, Y0))
    emit((rng.uniform(-0.1, 0.1), yy, 0.0), (rng.normal(0, 0.8), rng.normal(0, 0.3), rng.uniform(2.5, 6.0)), float(front_time(yy)),
         rng.uniform(0.035, 0.07), rng.uniform(0, 0.8))
P_O, P_V, P_T, P_R, P_C, P_G = (np.array(x, np.float64) for x in (P_O, P_V, P_T, P_R, P_C, P_G))
NSPRAY = len(P_T)
# crest bobbles: along both crests, every ~0.7 units near, sparser far
crest_rows = [r for r in range(NR) if YR[r] > -1.0 and (YR[r] < 40 or r % 2 == 0)]
CR = np.array(crest_rows)
NCREST = len(CR) * 2 * 3
crest_jit = rng.uniform(-1, 1, (NCREST, 4))
NRING = 90
ring_jit = rng.uniform(-1, 1, (NRING, 3))
NP = NSPRAY + NCREST + NRING
pts_me = bpy.data.meshes.new('Pompom points')
pts_me.vertices.add(NP)
pts_me.attributes.new('radius', 'FLOAT', 'POINT')
pts_me.attributes.new('col', 'FLOAT', 'POINT')
pts = link(bpy.data.objects.new('Pompom spray', pts_me))
mod = pts.modifiers.new('Pompoms', 'NODES')
mod.node_group = ng


def spray_update(t, rows):
    co = np.zeros((NP, 3))
    rad = np.zeros(NP)
    col = np.zeros(NP)
    dt = t - P_T
    alive = dt > 0
    d = np.maximum(dt, 0)[:, None]
    p = P_O + P_V * d + 0.5 * np.array([0, 0, -9.8])[None, :] * P_G[:, None] * d ** 2
    grow = c01(dt / 0.08) * (1 - smooth(0.0, -0.4, p[:, 2]) * (p[:, 2] < 0))
    rad[:NSPRAY] = np.where(alive & (p[:, 2] > -0.3), P_R * grow, 0.0)
    co[:NSPRAY] = np.where(alive[:, None], p, np.array([0, 0, -50.0]))
    col[:NSPRAY] = P_C
    # crest bobbles (three per row and side, around the crest point of the profile)
    H = rows['H'][CR]
    xc = rows['X'][CR, CREST_I]
    zc = rows['Z'][CR, CREST_I]
    k = 0
    for side in (-1, 1):
        for j in range(3):
            n = len(CR)
            sl = slice(NSPRAY + k * n, NSPRAY + (k + 1) * n)
            jj = crest_jit[k * n:(k + 1) * n]
            sc_ = (1 + YR[CR] / 70)
            r0 = (0.10 + 0.05 * jj[:, 0]) * sc_ * c01(H / 4.0) * (0.6 + 0.4 * H / HMAX)
            co[sl, 0] = side * (xc + (j - 1) * 0.35 * sc_ + 0.12 * jj[:, 1] * sc_ + 0.1 * math.sin(t * 2 + j))
            co[sl, 1] = YR[CR] + 0.25 * jj[:, 2] * sc_
            co[sl, 2] = zc + r0 * (0.3 + 0.3 * j) + 0.05 * np.sin(t * 3.1 + YR[CR] * 0.7 + j)
            rad[sl] = r0 * (H > 1.0)
            col[sl] = 0.05 + 0.3 * c01(jj[:, 3])
            k += 1
    # a ring of white pompoms riding the strike ripple (outwards at 5 units/s, sinking as it fades)
    dt = t - T_STRIKE
    sl = slice(NSPRAY + NCREST, NP)
    if dt > 0.02:
        ang = np.linspace(0, 2 * np.pi, NRING, endpoint=False) + 0.05 * ring_jit[:, 0]
        rr = 5.0 * dt + 0.12 * ring_jit[:, 1]
        fade = math.exp(-dt / 0.75)
        co[sl, 0] = rr * np.cos(ang)
        co[sl, 1] = Y0 + rr * np.sin(ang)
        co[sl, 2] = 0.05 + 0.05 * fade
        keep = (np.abs(co[sl, 0]) > G * float(c01((t - T_STRIKE - 0.05) / 0.4)) + 0.2) | (dt < 0.1)
        rad[sl] = (0.055 + 0.02 * ring_jit[:, 2]) * fade * keep * (dt < 2.5)
        col[sl] = 0.1 + 0.2 * c01(ring_jit[:, 2])
    pts_me.vertices.foreach_set('co', co.astype(np.float32).ravel())
    pts_me.attributes['radius'].data.foreach_set('value', rad.astype(np.float32))
    pts_me.attributes['col'].data.foreach_set('value', col.astype(np.float32))
    pts_me.update()


# ================================================================================================ felt fish on the wall faces
# appliqued felt fish stitched onto the knitted sea: they sit at fixed fabric coordinates, so they rise with the walls
FISH_COLS = [('#FF7A59', '#FFC23D'), ('#FFC23D', '#FF6FA5'), ('#FF6FA5', '#9B6BE0'), ('#9B6BE0', '#FFE08A'), ('#FF9A3C', '#2FB7B0'),
             ('#9BD84A', '#FF7A59'), ('#F5F1E6', '#FF9A3C'), ('#4FC3F7', '#FFC23D')]
eye_w, eye_b = felt('Fish eye white', '#FFFDF6', 120.0), felt('Fish eye black', '#1A1420', 120.0)
FISH = []
for i in range(42):
    side = -1 if i % 2 == 0 else 1
    yf = float(rng.uniform(4.0, 75.0) if i < 22 else rng.uniform(75.0, 170.0))
    sf = float(rng.uniform(3.0, 15.0))
    size = float(rng.uniform(2.3, 3.4)) * (1 + yf / 120)
    swim = 1 if rng.random() < 0.5 else -1
    bc, tc = FISH_COLS[i % len(FISH_COLS)]
    bm = bmesh.new()
    res = bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=12, radius=1.0)
    for v in res['verts']:
        v.co = Vector((v.co.x * 0.30, v.co.y * 0.075, v.co.z * 0.17))
        v.co.x += 0.04 * (v.co.z / 0.17) ** 2 * 0                     # (keep the body an ellipsoid)
    for f_ in bm.faces:
        f_.material_index = 0
    tail = [bm.verts.new(p) for p in ((-0.26, 0.0, 0.0), (-0.47, 0.0, 0.16), (-0.42, 0.0, 0.0), (-0.47, 0.0, -0.16))]
    for dy in (-0.012, 0.012):
        tv = [bm.verts.new((p.co.x, dy, p.co.z)) for p in tail]
        ff = bm.faces.new(tv)
        ff.material_index = 1
    fin = [bm.verts.new(p) for p in ((-0.05, 0.0, 0.15), (0.08, 0.0, 0.16), (-0.12, 0.0, 0.25))]
    ff = bm.faces.new(fin)
    ff.material_index = 1
    for ey in (-0.072, 0.072):
        res = bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=6, radius=0.045)
        for v in res['verts']:
            v.co = Vector((v.co.x + 0.17, v.co.y * 0.5 + ey, v.co.z + 0.04))
        for f_ in {f_ for v in res['verts'] for f_ in v.link_faces}:
            f_.material_index = 2
        res = bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=5, radius=0.024)
        for v in res['verts']:
            v.co = Vector((v.co.x + 0.185, v.co.y * 0.5 + ey * 1.25, v.co.z + 0.04))
        for f_ in {f_ for v in res['verts'] for f_ in v.link_faces}:
            f_.material_index = 3
    ob = mesh_obj(f'Felt fish {i}', bm, [felt(f'Fish body {i}', bc, 90.0, haze=(110.0, 640.0, 0.9)),
                                        felt(f'Fish tail {i}', tc, 90.0, haze=(110.0, 640.0, 0.9)), eye_w, eye_b])
    ob.hide_render = True
    FISH.append((ob, side, yf, sf, size, swim, float(rng.uniform(0, 6.28))))


def fish_update(t, rows):
    for ob, side, yf, sf, size, swim, ph in FISH:
        y = yf + swim * 0.35 * t
        r = int(np.clip(np.searchsorted(YR, y), 1, NR - 1))
        Hr = rows['H'][r]
        Lc, X, Z = rows['Lc'][r], rows['X'][r], rows['Z'][r]
        face_end = Lc[CREST_I] * 0.86
        vis = float(c01((Hr - 5.0) / 4.0)) * (sf < face_end)
        if vis <= 0.01:
            ob.hide_render = True
            continue
        ob.hide_render = False
        x0, z0 = np.interp(sf, Lc, X), np.interp(sf, Lc, Z)
        x1, z1 = np.interp(sf + 0.1, Lc, X), np.interp(sf + 0.1, Lc, Z)
        up = Vector((side * (x1 - x0), 0.0, z1 - z0)).normalized()
        nrm = Vector((-side * (z1 - z0), 0.0, x1 - x0)).normalized() * -1     # points out of the face, into the path
        if nrm.x * side > 0:
            nrm = -nrm
        d = Vector((0.0, float(swim), 0.0))
        yl = up.cross(d)
        M = Matrix((d, yl, up)).transposed().to_4x4()
        sc_ = size * vis * (1 + 0.04 * math.sin(t * 5 + ph))
        M = M @ Matrix.Diagonal((sc_, sc_, sc_, 1.0))
        M.translation = Vector((side * x0, y, z0)) + nrm * 0.13 * size + up * 0.08 * math.sin(t * 2.2 + ph)
        ob.matrix_world = M


# ================================================================================================ lights
def light(name, kind, loc, target, power, hexcol, size=1.0, angle=3.0):
    li = bpy.data.lights.new(name, kind)
    li.energy = power
    li.color = srgb(hexcol)
    if kind == 'SUN':
        li.angle = math.radians(angle)
    else:
        li.size = size
    ob = link(bpy.data.objects.new(name, li))
    ob.location = loc
    ob.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    return ob


light('Sun key', 'SUN', (-260, -150, 230), (0, 0, 0), 3.4, '#FFF0DC', angle=4)   # warm-white key from behind the lens, left
fill_r = light('Sky fill', 'SUN', (260, -150, 120), (0, 0, 0), 1.7, '#E2EAFF', angle=14)  # soft cool fill from behind, right
fill_l = light('Sky fill L', 'SUN', (-260, -150, 80), (0, 0, 0), 0.9, '#F0E6FF', angle=14)  # and left
for fl in (fill_r, fill_l):
    fl.data.use_shadow = False                  # sky light reaches into the canyon between the walls
light('Dawn rim', 'SUN', (0, 900, 70), (0, 0, 0), 1.3, '#FFC08A', angle=6)      # the sunrise at the far end: warm rims
light('Bounce', 'SUN', (0, 200, -60), (0, 0, 0), 0.3, '#FFC9A8', angle=30)      # warm bounce from the sand path

# ================================================================================================ camera
cd = bpy.data.cameras.new('Cam')
cd.lens = 28
cd.sensor_fit = 'HORIZONTAL'
cd.sensor_width = 36
cd.clip_start, cd.clip_end = 0.05, 3000
cd.dof.use_dof = True
camob = link(bpy.data.objects.new('Cam', cd))
sc.camera = camob

A0, A1 = Vector((0.0, -3.5, 2.25)), Vector((0.0, -3.2, 2.15))          # just behind the waterline (strike)
TA0, TA1 = Vector((0.0, 8.0, -1.1)), Vector((0.0, 8.0, -1.0))
B1 = Vector((0.0, -16.0, 6.6))                                           # craned up and back: full height at 7.00 s
TB1 = Vector((0.0, 70.0, 5.0))
C1 = Vector((0.0, 30.0, 4.6))                                            # pushed down the path towards the sun
TC1 = Vector((0.0, SUN_Y, 9.0))


def cam_state(t):
    if t < T_STRIKE:
        u = ease_io(t / T_STRIKE)
        loc, tgt = A0.lerp(A1, u), TA0.lerp(TA1, u)
    elif t < T_TOWER:
        u = ease_io5((t - T_STRIKE - 0.35) / (T_TOWER - T_STRIKE - 0.35))
        loc, tgt = A1.lerp(B1, u), TA1.lerp(TB1, ease_io((t - T_STRIKE - 0.2) / (T_TOWER - T_STRIKE - 1.2)))
    else:
        u = (t - T_TOWER) / (NF / FPS - T_TOWER)
        u = 0.75 * ease_io(u) + 0.25 * u * u                                 # starts from rest, still moving at the end
        loc, tgt = B1.lerp(C1, u), TB1.lerp(TC1, ease_io(u * 1.3))
    for t0, amp, tau in ((T_STRIKE, 0.07, 0.35), (T_TOWER, 0.035, 0.4)):    # a jolt on the strike and on the second hit
        if t > t0:
            e = amp * math.exp(-(t - t0) / tau)
            loc = loc + Vector((e * math.sin(t * 61), 0, e * math.sin(t * 47 + 1)))
    return loc, tgt


def look(loc, tgt):
    return (tgt - loc).to_track_quat('-Z', 'Y').to_euler()


for f in range(NF):
    t = f / FPS
    loc, tgt = cam_state(t)
    camob.location = loc
    camob.rotation_euler = look(loc, tgt)
    camob.keyframe_insert('location', frame=f)
    camob.keyframe_insert('rotation_euler', frame=f)
    near = 1 - ease_io((t - 1.2) / 1.0)
    cd.dof.focus_distance = (loc - TIP).length * near + 60.0 * (1 - near)
    cd.dof.aperture_fstop = 2.8 * near + 11.0 * (1 - near)
    cd.dof.keyframe_insert('focus_distance', frame=f)
    cd.dof.keyframe_insert('aperture_fstop', frame=f)
    sun.location = (0.0, SUN_Y, sun_z(t))
    sun.keyframe_insert('location', frame=f)


# ================================================================================================ screen anchors for Remotion
def project(p):
    m = camob.matrix_world.inverted()
    q = m @ Vector(p)
    kk = 1080 * cd.lens / cd.sensor_width
    return 540 + kk * q.x / -q.z, 960 - kk * q.y / -q.z, kk / -q.z


def write_geom():
    geom = {'fps': FPS, 'frames': NF, 'strike': T_STRIKE, 'tower': T_TOWER, 'glint': T_GLINT, 'tip': [], 'sun': [], 'vp': []}
    for f in range(NF):
        sc.frame_set(f)
        x, y, s_ = project(TIP)
        geom['tip'].append([round(x, 1), round(y, 1)])
        sx, sy, ss = project(Vector((0.0, SUN_Y, sun_z(f / FPS))))
        geom['sun'].append([round(sx, 1), round(sy, 1), round(ss * SUN_R, 1)])
        vx, vy, _ = project(Vector((0.0, YMAX, 0.0)))
        geom['vp'].append([round(vx, 1), round(vy, 1)])
    (OUT / 'geom.json').write_text(json.dumps(geom, separators=(',', ':')))
    print('GEOM tip f0', geom['tip'][0], 'f30', geom['tip'][30], 'sun f390', geom['sun'][390], 'vp f210', geom['vp'][210], flush=True)


if MODE == 'geom':
    write_geom()
    sys.exit(0)
if MODE == 'probe':
    for tt in (1.0, 1.5, 2.0, 3.0, 4.0, 5.5, 7.0, 10.0, 13.8):
        rows = sea_state(tt)[2]
        i20 = int(np.searchsorted(YR, 20.0))
        print(f't {tt:5.2f} front row-y {YR[np.argmax(rows["a"] <= 0)] if (rows["a"] <= 0).any() else YMAX:7.1f} '
              f'H@20 {rows["H"][i20]:5.2f} g@20 {rows["g"][i20]:4.2f} rise {rise(tt):.3f}', flush=True)
    sys.exit(0)
if MODE == 'blend':
    sea_update(5.0)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'seaknit.blend'))
    sys.exit(0)

# ================================================================================================ render
if MODE == 'stills':
    frames = [int(x) for x in (POS[0] if POS else '0,30,120,300').split(',')]
    dst_dir = OUT / 'stills'
else:
    first = int(POS[0]) if POS else 0
    last = int(POS[1]) if len(POS) > 1 else NF - 1
    frames = list(range(first, last + 1))
    dst_dir = OUT / 'frames'
    write_geom() if not (OUT / 'geom.json').exists() else None
dst_dir.mkdir(exist_ok=True)
t_all, n = time.time(), 0
for f in frames:
    dst = dst_dir / f'f{f:04d}.jpg'
    if MODE == 'anim' and dst.exists() and dst.stat().st_size > 1000:
        continue
    t = f / FPS
    sc.frame_set(f)
    t0 = time.time()
    rows = sea_update(t)
    spray_update(t, rows)
    fish_update(t, rows)
    t1 = time.time()
    sc.render.filepath = str(dst)
    bpy.ops.render.render(write_still=True)
    n += 1
    print(f'FRAME {f} update {t1 - t0:.2f} s render {time.time() - t1:.1f} s', flush=True)
print(f'DONE {n} frames in {time.time() - t_all:.0f} s', flush=True)
