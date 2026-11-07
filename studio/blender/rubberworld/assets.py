"""Voxel world assets shared by every Blender pass of job 8bcf01ad1b0f (rebuild of @morrow.studio3d DfDF_diPhmi).

Look target (reference): night-navy void with bokeh stars, a glowing grid floor with yellow dashes, a blocky guy in a
yellow hoodie, Claude as a terracotta box with ^ ^ eyes, a voxel city with lit windows. Eevee, AgX, soft AO.
Our guy has a short dark beard (Hammad's face in voxel form); one skin tone throughout (the reference drifts).
"""
import bpy, math, random
from mathutils import Vector

def srgb(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)

NAVY_BG = srgb('#0c1238')
YELLOW = srgb('#f4c21a')
NAVY = srgb('#1b2350')
SKIN = srgb('#a86f4c')
HAIR = srgb('#2a1a12')
CLAUDE = srgb('#c96a50')
DARK = srgb('#14100e')

def reset(w=720, h=1280, samples=16):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_EEVEE'
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.render.fps = 30
    try:
        sc.eevee.use_raytracing = False
        sc.eevee.use_gtao = True; sc.eevee.gtao_distance = 0.6
    except Exception:
        pass
    for k, v in (('shadow_resolution_scale', 0.5), ('shadow_ray_count', 1), ('shadow_step_count', 4),
                 ('use_volumetric_shadows', False), ('fast_gi_resolution', '4')):
        try: setattr(sc.eevee, k, v)
        except Exception as e: print('eevee setting skipped', k, e)
    sc.render.use_compositing = True
    sc.use_nodes = True
    try:
        tree = sc.node_tree; tree.nodes.clear()
        rl = tree.nodes.new('CompositorNodeRLayers'); gl = tree.nodes.new('CompositorNodeGlare')
        gl.glare_type = 'FOG_GLOW'
        try: gl.quality = 'MEDIUM'; gl.threshold = 1.0; gl.size = 7
        except Exception: pass
        co = tree.nodes.new('CompositorNodeComposite')
        tree.links.new(rl.outputs['Image'], gl.inputs['Image']); tree.links.new(gl.outputs['Image'], co.inputs['Image'])
    except Exception as e:
        print('compositor skipped', e)
    try:
        sc.eevee.use_shadows = True
    except Exception:
        pass
    sc.eevee.taa_render_samples = samples
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = 'AgX - Medium High Contrast'
    sc.render.image_settings.file_format = 'JPEG'
    sc.render.image_settings.quality = 93
    world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True
    bg = world.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = (*NAVY_BG, 1); bg.inputs['Strength'].default_value = 0.6
    return sc

_MATS = {}
def mat(name, color, rough=0.55, emit=None, strength=0.0, metal=0.0):
    key = name
    if key in _MATS: return _MATS[key]
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit is not None:
        b.inputs['Emission Color'].default_value = (*emit, 1)
        b.inputs['Emission Strength'].default_value = strength
    _MATS[key] = m
    return m

def emissive_image(name, path, strength=1.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); em = nt.nodes.new('ShaderNodeEmission')
    tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = bpy.data.images.load(path)
    em.inputs['Strength'].default_value = strength
    nt.links.new(tex.outputs['Color'], em.inputs['Color']); nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
    return m

import bmesh
_MESH = {}
def _cube_mesh(bevel):
    key = ('cube', bevel)
    if key not in _MESH:
        me = bpy.data.meshes.new('cube'); bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
        bm.to_mesh(me); bm.free(); _MESH[key] = me
    return _MESH[key]

def _link(o):
    bpy.context.scene.collection.objects.link(o); return o

def box(name, loc, size, m, parent=None, bevel=0.025, rot=(0, 0, 0)):
    me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts); bm.to_mesh(me); bm.free()
    me.materials.append(m)
    o = _link(bpy.data.objects.new(name, me))
    if bevel:
        bv = o.modifiers.new('bv', 'BEVEL'); bv.width = min(bevel, min(size) * 0.45); bv.segments = 3
    o.location = loc; o.rotation_euler = rot
    if parent: o.parent = parent
    return o

def inst(name, src, loc, rot=(0, 0, 0)):
    """Linked duplicate of src (shares mesh + modifiers cost)."""
    o = _link(bpy.data.objects.new(name, src.data))
    for md in src.modifiers:
        n = o.modifiers.new(md.name, md.type)
        if md.type == 'BEVEL': n.width = md.width; n.segments = md.segments
    o.location = loc; o.rotation_euler = rot
    return o

def cyl(name, loc, r, h, m, parent=None, rot=(0, 0, 0), verts=24):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=verts, radius1=r, radius2=r, depth=h)
    bm.to_mesh(me); bm.free(); me.materials.append(m)
    o = _link(bpy.data.objects.new(name, me))
    o.location = loc; o.rotation_euler = rot
    if parent: o.parent = parent
    return o

def sphere(name, loc, r, m):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=6, radius=r)
    bm.to_mesh(me); bm.free(); me.materials.append(m)
    o = _link(bpy.data.objects.new(name, me)); o.location = loc
    return o

def empty(name, loc=(0, 0, 0), parent=None):
    o = bpy.data.objects.new(name, None); bpy.context.scene.collection.objects.link(o)
    o.location = loc
    if parent: o.parent = parent
    return o

# ------------------------------------------------------------------ the guy
def build_guy(loc=(0, 0, 0)):
    """Returns dict of animatable parts. Faces -Y (towards a camera placed at -Y)."""
    R = empty('guy', loc)
    yel = mat('hoodie', YELLOW, 0.6); nav = mat('pants', NAVY, 0.7); sk = mat('skin', SKIN, 0.55)
    wht = mat('white', srgb('#f2f2f2'), 0.5); blk = mat('black', DARK, 0.4); hair = mat('hair', HAIR, 0.8)
    dot = mat('shoulderdot', srgb('#1d2a78'), 0.5)
    # legs + shoes
    for s in (-1, 1):
        box(f'leg{s}', (0.16 * s, 0, 0.42), (0.26, 0.28, 0.62), nav, R)
        box(f'shoe{s}', (0.16 * s, -0.05, 0.08), (0.3, 0.42, 0.16), wht, R)
    body = empty('body', (0, 0, 0.75), R)
    box('torso', (0, 0, 0.42), (0.86, 0.5, 0.86), yel, body)
    for s in (-1, 1):
        cyl(f'sdot{s}', (0.3 * s, -0.24, 0.74), 0.11, 0.06, dot, body, rot=(math.pi / 2, 0, 0))
        box(f'string{s}', (0.07 * s, -0.255, 0.5), (0.035, 0.02, 0.3), wht, body, bevel=0.008)
    arms = {}
    for s in (-1, 1):
        sh = empty(f'shoulder{s}', (0.53 * s, 0, 0.78), body)
        box(f'arm{s}', (0, 0, -0.33), (0.22, 0.26, 0.7), yel, sh)
        box(f'hand{s}', (0, 0, -0.74), (0.2, 0.22, 0.16), sk, sh)
        arms[s] = sh
    neck = empty('neck', (0, 0, 0.86), body)
    head = empty('head', (0, 0, 0.0), neck)
    box('skull', (0, 0, 0.42), (0.8, 0.74, 0.8), sk, head, bevel=0.04)
    # beard (Hammad): jaw band + chin
    box('beard_l', (-0.33, -0.3, 0.2), (0.16, 0.2, 0.34), hair, head, bevel=0.015)
    box('beard_r', (0.33, -0.3, 0.2), (0.16, 0.2, 0.34), hair, head, bevel=0.015)
    box('beard_c', (0, -0.33, 0.1), (0.66, 0.12, 0.16), hair, head, bevel=0.015)
    box('stache', (0, -0.385, 0.25), (0.36, 0.05, 0.06), hair, head, bevel=0.01)
    # hair blocks
    rnd = random.Random(3)
    box('hair_cap', (0, 0.02, 0.86), (0.84, 0.8, 0.16), hair, head, bevel=0.03)
    box('hair_back', (0, 0.32, 0.6), (0.84, 0.16, 0.5), hair, head, bevel=0.03)
    for i in range(14):
        x = rnd.uniform(-0.34, 0.34); y = rnd.uniform(-0.3, 0.3)
        box(f'curl{i}', (x, y, 0.95 + rnd.uniform(0, 0.08)), (0.18, 0.18, 0.16), hair, head, bevel=0.03,
            rot=(rnd.uniform(-.3, .3), rnd.uniform(-.3, .3), rnd.uniform(-.5, .5)))
    for s in (-1, 1):
        box(f'side{s}', (0.41 * s, 0.05, 0.62), (0.06, 0.5, 0.34), hair, head, bevel=0.01)
    # face: eyes, pupils, brows, nose, mouth
    eyes = {}; pup = {}; brow = {}
    for s in (-1, 1):
        e = box(f'eye{s}', (0.17 * s, -0.372, 0.5), (0.2, 0.02, 0.2), wht, head, bevel=0.01)
        p = box(f'pupil{s}', (0.17 * s + 0.03 * s, -0.385, 0.48), (0.08, 0.02, 0.11), blk, head, bevel=0.005)
        bp = empty(f'browpiv{s}', (0.17 * s, -0.38, 0.66), head)
        box(f'brow{s}', (0, 0, 0), (0.24, 0.04, 0.06), hair, bp, bevel=0.01)
        eyes[s] = e; pup[s] = p; brow[s] = bp
    box('nose', (0, -0.4, 0.38), (0.08, 0.06, 0.1), mat('nose', srgb('#966043'), 0.6), head, bevel=0.01)
    mouth = empty('mouthpiv', (0, -0.38, 0.27), head)
    box('mouth', (0, 0, 0), (0.2, 0.03, 0.05), mat('mouthin', srgb('#2a0f0c'), 0.5), mouth, bevel=0.008)
    return dict(root=R, body=body, head=head, neck=neck, arms=arms, eyes=eyes, pupils=pup, brows=brow, mouth=mouth)

# ------------------------------------------------------------------ Claude box
def build_claude(loc=(0, 0, 0)):
    R = empty('claude', loc)
    cm = mat('claudebody', CLAUDE, 0.65); dk = mat('claudeeye', srgb('#2b1510'), 0.4)
    legm = mat('claudeleg', srgb('#a9523d'), 0.7)
    body = empty('cbody', (0, 0, 0.32), R)
    box('cbox', (0, 0, 0.5), (1.15, 0.95, 1.0), cm, body, bevel=0.06)
    for i, (x, y) in enumerate([(-0.4, -0.3), (0.4, -0.3), (-0.4, 0.3), (0.4, 0.3)]):
        box(f'cleg{i}', (x, y, 0.16), (0.14, 0.14, 0.34), legm, R, bevel=0.02)
    arms = {}
    for s in (-1, 1):
        pv = empty(f'carm{s}', (0.62 * s, 0, 0.62), body)
        box(f'carmb{s}', (0.06 * s, 0, -0.12), (0.12, 0.14, 0.3), cm, pv, bevel=0.02)
        arms[s] = pv
    eyes = {}
    for s in (-1, 1):
        pv = empty(f'ceye{s}', (0.24 * s, -0.48, 0.62), body)
        box(f'ceyeL{s}', (-0.045, 0, 0), (0.13, 0.02, 0.04), dk, pv, bevel=0.006, rot=(0, math.radians(-40), 0))
        box(f'ceyeR{s}', (0.045, 0, 0), (0.13, 0.02, 0.04), dk, pv, bevel=0.006, rot=(0, math.radians(40), 0))
        eyes[s] = pv
    return dict(root=R, body=body, arms=arms, eyes=eyes)

# ------------------------------------------------------------------ floor, stars, city
def build_floor(size=400):
    m = bpy.data.materials.new('gridfloor'); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*srgb('#151c4a'), 1); b.inputs['Roughness'].default_value = 0.35
    tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(tc.outputs['Object'], sep.inputs['Vector'])
    def line(axis):
        f = nt.nodes.new('ShaderNodeMath'); f.operation = 'PINGPONG'; f.inputs[1].default_value = 1.0
        nt.links.new(sep.outputs[axis], f.inputs[0])
        st = nt.nodes.new('ShaderNodeMath'); st.operation = 'LESS_THAN'; st.inputs[1].default_value = 0.018
        nt.links.new(f.outputs[0], st.inputs[0]); return st
    a = line('X'); c = line('Y'); mx = nt.nodes.new('ShaderNodeMath'); mx.operation = 'MAXIMUM'
    nt.links.new(a.outputs[0], mx.inputs[0]); nt.links.new(c.outputs[0], mx.inputs[1])
    mul = nt.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = 0.7
    nt.links.new(mx.outputs[0], mul.inputs[0])
    b.inputs['Emission Color'].default_value = (*srgb('#3f56c8'), 1)
    nt.links.new(mul.outputs[0], b.inputs['Emission Strength'])
    o = box('floor', (0, 0, -0.05), (size, size, 0.1), m, bevel=0)
    return o

def build_stars(n=160, seed=5, center=(0, 40, 0)):
    rnd = random.Random(seed)
    cols = [srgb('#ffd27a'), srgb('#8fa8ff'), srgb('#ffffff'), srgb('#ff9f6b')]
    for i in range(n):
        c = rnd.choice(cols)
        m = mat(f'star{cols.index(c)}', (0, 0, 0), emit=c, strength=rnd.choice([6, 9, 14]))
        sphere(f'star{i}', (center[0] + rnd.uniform(-60, 60), center[1] + rnd.uniform(10, 60), rnd.uniform(-2, 45)),
               rnd.uniform(0.12, 0.35), m)

def window_mat(name, seed):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*srgb('#1a2160'), 1); b.inputs['Roughness'].default_value = 0.6
    tc = nt.nodes.new('ShaderNodeTexCoord')
    br = nt.nodes.new('ShaderNodeTexBrick')
    br.inputs['Scale'].default_value = 5.0; br.inputs['Mortar Size'].default_value = 0.06
    br.inputs['Brick Width'].default_value = 0.35; br.inputs['Row Height'].default_value = 0.22
    br.offset = 0.0
    br.inputs['Color1'].default_value = (1, 1, 1, 1); br.inputs['Color2'].default_value = (0.0, 0.0, 0.0, 1)
    br.inputs['Mortar'].default_value = (0, 0, 0, 1)
    nt.links.new(tc.outputs['Object'], br.inputs['Vector'])
    noise = nt.nodes.new('ShaderNodeTexWhiteNoise'); noise.noise_dimensions = '3D'
    snap = nt.nodes.new('ShaderNodeVectorMath'); snap.operation = 'SNAP'; snap.inputs[1].default_value = (0.14, 0.14, 0.09)
    nt.links.new(tc.outputs['Object'], snap.inputs[0]); nt.links.new(snap.outputs[0], noise.inputs['Vector'])
    gt = nt.nodes.new('ShaderNodeMath'); gt.operation = 'GREATER_THAN'; gt.inputs[1].default_value = 0.74
    nt.links.new(noise.outputs['Value'], gt.inputs[0])
    mortar = nt.nodes.new('ShaderNodeMath'); mortar.operation = 'MULTIPLY'
    nt.links.new(br.outputs['Fac'], mortar.inputs[0])
    inv = nt.nodes.new('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1.0
    nt.links.new(br.outputs['Fac'], inv.inputs[1])
    win = nt.nodes.new('ShaderNodeMath'); win.operation = 'MULTIPLY'
    nt.links.new(inv.outputs[0], win.inputs[0]); nt.links.new(gt.outputs[0], win.inputs[1])
    geo = nt.nodes.new('ShaderNodeNewGeometry'); sepn = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(geo.outputs['Normal'], sepn.inputs[0])
    wall = nt.nodes.new('ShaderNodeMath'); wall.operation = 'LESS_THAN'; wall.inputs[1].default_value = 0.5
    nt.links.new(sepn.outputs['Z'], wall.inputs[0])
    win2 = nt.nodes.new('ShaderNodeMath'); win2.operation = 'MULTIPLY'
    nt.links.new(win.outputs[0], win2.inputs[0]); nt.links.new(wall.outputs[0], win2.inputs[1])
    s = nt.nodes.new('ShaderNodeMath'); s.operation = 'MULTIPLY'; s.inputs[1].default_value = 1.8
    nt.links.new(win2.outputs[0], s.inputs[0])
    b.inputs['Emission Color'].default_value = (*srgb('#ffe2a0'), 1)
    nt.links.new(s.outputs[0], b.inputs['Emission Strength'])
    return m

def build_city(center=(0, 0, 0), radius=16, clear=3.2, seed=11, grow_frames=None, clear_box=None):
    """Voxel blocks on a street grid around center, leaving a plaza of half-size `clear`.
    grow_frames=(f0, f1): buildings rise from the floor in order of distance between those frames.
    Returns (buildings, cars)."""
    rnd = random.Random(seed)
    wm = [window_mat(f'win{i}', i) for i in range(3)]
    road = mat('road', srgb('#10163a'), 0.4)
    dash = mat('dash', srgb('#f4c21a'), 0.4, emit=srgb('#f4c21a'), strength=1.4)
    bill = [mat(f'bill{i}', (0, 0, 0), emit=srgb(c), strength=4.0) for i, c in
            enumerate(['#ff4f8b', '#3fd0ff', '#ffb02e', '#8a5cff', '#2ee59d'])]
    carm = [mat('caryel', YELLOW, 0.35), mat('carwht', srgb('#e8e8f0'), 0.35), mat('carred', srgb('#d8443a'), 0.35)]
    cx, cy, _ = center
    blds = []; cars = []
    step = 3.0
    for ix in range(-int(radius / step), int(radius / step) + 1):
        for iy in range(-int(radius / step), int(radius / step) + 1):
            x = cx + ix * step; y = cy + iy * step
            if abs(ix * step) < clear and abs(iy * step) < clear:
                continue
            if clear_box and clear_box[0] - 1.1 < x < clear_box[1] + 1.1 and clear_box[2] - 1.1 < y < clear_box[3] + 1.1:
                continue
            h = rnd.choice([0.6, 0.9, 1.2, 1.5, 2.0, 2.6]) * (1.3 if iy > 2 else 1)
            w = rnd.uniform(1.7, 2.3)
            b = box(f'bld{ix}_{iy}', (x, y, h / 2), (w, w, h), rnd.choice(wm), bevel=0.04)
            blds.append((math.hypot(ix, iy), b, h))
            if rnd.random() < 0.35:
                side = rnd.choice([-1, 1])
                box(f'bb{ix}_{iy}', (x + side * (w / 2 + 0.03), y, h * rnd.uniform(0.4, 0.75)), (0.04, w * 0.7, 0.6),
                    rnd.choice(bill), bevel=0.0).parent = None
    # road dashes along the street lines between blocks
    dsrc = box('dashsrc', (0, 0, -5), (0.55, 0.08, 0.02), dash, bevel=0)
    n = int(radius / 1.3)
    for k in range(-int(radius / step), int(radius / step)):
        for j in range(-n, n + 1):
            inst(f'dashx{k}_{j}', dsrc, (cx + j * 1.3, cy + k * step + step / 2, 0.012))
            inst(f'dashy{k}_{j}', dsrc, (cx + k * step + step / 2, cy + j * 1.3, 0.012), rot=(0, 0, math.pi / 2))
    # cars along roads
    for i in range(70):
        along = rnd.uniform(-radius, radius); k = rnd.randint(-int(radius / step), int(radius / step) - 1)
        if rnd.random() < 0.5:
            loc = (cx + along, cy + k * step + step / 2 + rnd.choice([-0.35, 0.35]), 0.13); sz = (0.55, 0.28, 0.2)
        else:
            loc = (cx + k * step + step / 2 + rnd.choice([-0.35, 0.35]), cy + along, 0.13); sz = (0.28, 0.55, 0.2)
        if abs(loc[0] - cx) < clear and abs(loc[1] - cy) < clear:
            continue
        if clear_box and abs(loc[0]) < 2.2 and -2.2 < loc[1] < 1.8:
            continue
        cars.append(box(f'car{i}', loc, sz, rnd.choice(carm), bevel=0.03))
    if grow_frames:
        f0, f1 = grow_frames
        maxd = max(d for d, _, _ in blds)
        for d, b, h in blds:
            fs = int(f0 + (f1 - f0) * (d / maxd) * 0.85)
            b.scale = (1, 1, 0.001); b.location.z = 0
            b.keyframe_insert('scale', frame=f0 - 1); b.keyframe_insert('location', frame=f0 - 1)
            b.keyframe_insert('scale', frame=fs)
            b.keyframe_insert('location', frame=fs)
            b.scale = (1, 1, 1.0); b.location.z = h / 2
            b.keyframe_insert('scale', frame=fs + 8); b.keyframe_insert('location', frame=fs + 8)
    return blds, cars
