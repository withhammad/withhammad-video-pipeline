"""Pass B: the whole reel as one Blender timeline, cut on the dialogue (standin/timeline.json).
Usage: blender -b --python main.py -- <outdir> [start end] [--save]
Swap-in for the real voice: re-run standin/assemble.py, then this script; every cut, mouth and beat re-times."""
import bpy, sys, os, math, json, random
sys.path.insert(0, os.path.dirname(__file__))
import assets as A, sets as S
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
argv = sys.argv[sys.argv.index('--') + 1:]
OUT = os.path.abspath(argv[0])
PART = argv[argv.index('--part') + 1] if '--part' in argv else 'all'
PARTS = {'city': ['floor_high', 'city_grow', 'city_cars', 'close_cant', 'claude_never'], 'street': ['street']}
TL = json.load(open(os.path.join(HERE, '..', 'standin', 'timeline.json')))
FPS = 30
def F(t): return int(round(t * FPS)) + 1
LN = TL['lines']; WD = TL['words']
N = F(TL['total'])

sc = A.reset(720, 1280, 16)
sc.frame_start, sc.frame_end = 1, N

# ------------------------------------------------------------------ keyframe helpers
def key(o, path, frame, value, interp='BEZIER', index=-1):
    if index >= 0:
        getattr(o, path)[index] = value
    else:
        setattr(o, path, value)
    o.keyframe_insert(path, frame=frame, index=index)
    ad = o.animation_data
    if ad and ad.action:
        for fc in _fcurves(ad.action):
            if fc.data_path == path and (index < 0 or fc.array_index == index):
                for kp in fc.keyframe_points:
                    if int(kp.co[0]) == frame:
                        kp.interpolation = interp

def _fcurves(action):
    try:
        return list(action.fcurves)
    except Exception:
        out = []
        for layer in action.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    out += list(bag.fcurves)
        return out

def show(o, ranges, base=(1, 1, 1)):
    """Visible (scale=base) only inside [f0, f1) ranges; constant steps."""
    key(o, 'scale', 1, (0.0001,) * 3, 'CONSTANT')
    for f0, f1 in ranges:
        key(o, 'scale', f0, base, 'CONSTANT'); key(o, 'scale', f1, (0.0001,) * 3, 'CONSTANT')

# ------------------------------------------------------------------ world
A.build_floor(); A.build_stars()
G = A.build_guy((-0.8, 0, 0)); C = A.build_claude((0.9, -0.4, 0))
GUY_YAW = math.radians(15); CL_YAW = math.radians(-25)
G['root'].rotation_euler.z = GUY_YAW; C['root'].rotation_euler.z = CL_YAW

city_root = A.empty('city_root'); roads_root = A.empty('roads_root')
before = set(bpy.data.objects.keys())
blds, cars = A.build_city(center=(0, 1.5, 0), radius=15, clear=3.0, seed=11, clear_box=(-3.5, 3.5, -12, 4.0)) if PART in ('all', 'city') else ([], [])
for name in set(bpy.data.objects.keys()) - before:
    o = bpy.data.objects[name]
    if o.parent is None and o not in (city_root, roads_root):
        o.parent = roads_root if name.startswith('dash') else city_root
# exactly 352 cars, as the line says: fill up to 352 with extra cars on the outer roads
carm = [bpy.data.materials[n] for n in ('caryel', 'carwht', 'carred') if n in bpy.data.materials]
rnd = random.Random(99)
while PART in ('all', 'city') and len(cars) < 352:
    k = rnd.randint(-5, 4); along = rnd.uniform(-15, 15)
    if rnd.random() < 0.5:
        loc = (along, 1.5 + k * 3 + 1.5 + rnd.choice([-0.35, 0.35]), 0.13); sz = (0.55, 0.28, 0.2)
    else:
        loc = (k * 3 + 1.5 + rnd.choice([-0.35, 0.35]), 1.5 + along, 0.13); sz = (0.28, 0.55, 0.2)
    if abs(loc[0]) < 3 and abs(loc[1] - 1.5) < 3:
        continue
    if abs(loc[0]) < 2.2 and -2.2 < loc[1] < 1.8:
        continue
    c = A.box(f'xcar{len(cars)}', loc, sz, rnd.choice(carm), bevel=0.03); c.parent = city_root; cars.append(c)
cars = cars[:352]

# big in-world screen (the "what if" short, then the 56-video wall)
stills = os.path.join(HERE, 'stills')
bez = A.mat('bezel', A.srgb('#05060c'), 0.3)
panel_root = A.empty('panel_root', (0.1, 3.4, 0))
A.box('pbezel', (0, 0.06, 3.75), (4.05, 0.1, 7.1), bez, panel_root, bevel=0.06)
pb = A.box('pbeach', (0, 0, 3.75), (3.8, 0.02, 6.75), A.emissive_image('m_beach', os.path.join(stills, 'panel_beach.jpg'), 1.1), panel_root, bevel=0)
pg = A.box('pgrid', (0, -0.01, 3.75), (3.8, 0.02, 6.75), A.emissive_image('m_grid', os.path.join(stills, 'grid.jpg'), 1.1), panel_root, bevel=0)
for o in (pb, pg):  # UVs: project the face straight on
    me = o.data
    uv = me.uv_layers.new()
    for poly in me.polygons:
        for li in poly.loop_indices:
            v = me.vertices[me.loops[li].vertex_index].co
            uv.data[li].uv = (v.x / 3.8 + 0.5, v.z / 6.75 + 0.5)

# laptop (parented to the guy)
lap = A.empty('laptop', (0, -0.62, 1.25), G['root'])
A.box('lapbase', (0, 0, 0), (0.72, 0.48, 0.035), A.mat('lap', A.srgb('#2a2f3a'), 0.3, metal=0.6), lap, bevel=0.01)
A.box('lapscreen', (0, 0.25, 0.22), (0.72, 0.03, 0.46), A.mat('lap', A.srgb('#2a2f3a'), 0.3), lap, bevel=0.01,
      rot=(math.radians(-12), 0, 0))
A.box('lapglow', (0, 0.23, 0.22), (0.66, 0.01, 0.4), A.mat('lapglow', (0, 0, 0), emit=A.srgb('#7fa6ff'), strength=2.5), lap, bevel=0,
      rot=(math.radians(-12), 0, 0))
lap.rotation_euler.x = math.radians(0)

# lights
bpy.ops.object.light_add(type='AREA', location=(-3.5, -6, 6.5)); key_l = bpy.context.object
key_l.data.energy = 1400; key_l.data.size = 6; key_l.data.color = A.srgb('#fff1dc')
key_l.rotation_euler = Vector((0.3, 6, -5)).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.object.light_add(type='AREA', location=(4.5, 3.5, 4.5)); rim = bpy.context.object
rim.data.energy = 900; rim.data.size = 3; rim.data.color = A.srgb('#7d8cff')
rim.rotation_euler = Vector((-4.5, -3.5, -3.5)).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.object.light_add(type='AREA', location=(1.5, -5, 1.2)); fill = bpy.context.object
fill.data.energy = 250; fill.data.size = 5; fill.data.color = A.srgb('#b9c4ff')
fill.rotation_euler = Vector((-1.5, 5, 0.5)).to_track_quat('-Z', 'Y').to_euler()

if PART in ('all', 'street'):
    street_cars = S.build_street()
    street_sun = bpy.data.objects['streetsun']
else:
    street_cars = []

# ------------------------------------------------------------------ timing
def ls(i): return LN[i]['start']
def le(i): return LN[i]['end']
def word_t(line, idx): return [w for w in WD if w['line'] == line][idx]['s']
def word_find(line, text):
    for w in WD:
        if w['line'] == line and w['w'].lower().strip('.,?!') == text: return w['s']
    raise KeyError(text)
P0, P1 = TL['payoff']['start'], TL['payoff']['end']

GHEAD = Vector((-0.8, 0, 2.05)); CBOX = Vector((0.9, -0.4, 0.95))
def gface(d=2.3, h=-0.12, side=0.0):
    fwd = Vector((math.sin(GUY_YAW), -math.cos(GUY_YAW), 0)); rt = Vector((math.cos(GUY_YAW), math.sin(GUY_YAW), 0))
    return GHEAD + fwd * d + rt * side + Vector((0, 0, h))
def cface(d=2.6, h=0.15, side=0.0):
    fwd = Vector((math.sin(CL_YAW), -math.cos(CL_YAW), 0)); rt = Vector((math.cos(CL_YAW), math.sin(CL_YAW), 0))
    return CBOX + fwd * d + rt * side + Vector((0, 0, h))

CLOSE_G = dict(l0=gface(3.6, -0.25, 0.15), l1=gface(3.25, -0.2, 0.1), t0=GHEAD + Vector((0, 0, -0.12)), lens=45, f=1.8)
CLOSE_C = dict(l0=cface(2.9, 0.05, 0.1), l1=cface(2.5, 0.05, 0.05), t0=CBOX + Vector((0, 0, 0.25)), lens=45, f=1.8)
CLOSE_C_HI = dict(l0=cface(3.2, 0.05, 0.0), l1=cface(2.9, 0.05, 0.0), t0=CBOX + Vector((0, 0, 0.75)), lens=40, f=2.0)
SHOTS = [
 ('close_sad', 0, dict(CLOSE_G, l0=gface(3.4, -0.2, 0.1), l1=gface(2.9, -0.15, 0.08), lens=45)),
 ('close_punch', word_find(0, 'six') - 0.04, dict(CLOSE_G, l0=gface(2.35, -0.1, 0.05), l1=gface(2.25, -0.1, 0.05), t0=GHEAD + Vector((0, 0, 0.0)), lens=45)),
 ('wide_panel', ls(1) - 0.12, dict(l0=(0.6, -7.6, 2.0), l1=(0.5, -6.6, 2.1), t0=(0.1, 0, 2.9), lens=32, f=4)),
 ('close_shock', ls(3) - 0.1, dict(CLOSE_G, l0=gface(2.8, -0.1, 0.0), l1=gface(2.4, -0.1, 0.0))),
 ('back_panel', ls(4) - 0.12, dict(l0=(-2.0, -4.6, 3.0), l1=(-1.8, -3.9, 3.0), t0=(0.0, 3.4, 3.0), lens=28, f=4)),
 ('wall', word_find(4, 'every') - 0.05, dict(l0=(0.4, -3.6, 1.1), l1=(0.4, -4.4, 1.25), t0=(0.1, 3.4, 3.5), lens=22, f=5)),
 ('close_how', ls(5) - 0.1, CLOSE_G),
 ('claude_s1', ls(6) - 0.1, CLOSE_C_HI),
 ('laptop_ots', ls(7) - 0.1, dict(l0=(0.55, -1.9, 2.5), l1=(0.45, -1.6, 2.45), t0=(-0.8, -0.4, 1.7), lens=32, f=2.0)),
 ('two_mid', ls(8) - 0.12, dict(l0=(0.15, -5.4, 1.5), l1=(0.1, -4.9, 1.5), t0=(0.05, 0, 2.35), lens=32, f=4)),
 ('close_gen', ls(10) - 0.1, CLOSE_G),
 ('floor_high', ls(11) - 0.12, dict(l0=(4.2, -8.5, 6.8), l1=(3.6, -7.8, 6.2), t0=(0.0, 0.3, 0.9), lens=30, f=6)),
 ('city_grow', word_find(11, 'i') - 0.05, dict(l0=(5.5, -9.0, 8.0), l1=(-3.5, -8.5, 9.5), t0=(0, 1.0, 0.6), lens=26, f=8)),
 ('city_cars', ls(12) - 0.1, dict(l0=(6.0, -9.0, 10.5), l1=(4.8, -8.0, 9.4), t0=(0, 1.0, 0.3), lens=28, f=8)),
 ('close_cant', ls(13) - 0.1, CLOSE_G),
 ('claude_never', ls(14) - 0.1, CLOSE_C),
 ('claude_s4', ls(15) - 0.12, CLOSE_C_HI),
 ('laptop_s5', ls(16) - 0.12, dict(l0=(0.25, -5.4, 1.6), l1=(0.2, -4.9, 1.6), t0=(0.05, 0, 2.3), lens=32, f=4)),
 ('close_cost', ls(17) - 0.1, CLOSE_G),
 ('claude_cost', ls(18) - 0.1, CLOSE_C_HI),
 ('close_thatsit', ls(19) - 0.1, dict(CLOSE_G, l0=gface(2.7, -0.1, 0.0), l1=gface(2.45, -0.1, 0.0))),
 ('claude_steps', ls(20) - 0.1, CLOSE_C_HI),
 ('street', P0, dict(l0=(300.3, -7.5, 1.7), l1=(300.2, -5.2, 1.55), t0=(300.0, 40, 3.6), lens=24, f=16)),
 ('close_cta', ls(21) - 0.1, CLOSE_G),
 ('wide_end', word_find(21, 'and') - 0.05, dict(l0=(0.35, -6.4, 1.8), l1=(0.3, -5.8, 1.85), t0=(0.05, 0, 2.15), lens=32, f=4)),
]
CUT = [(n, F(t), spec) for n, t, spec in SHOTS]
CUT[0] = (CUT[0][0], 1, CUT[0][2])
RANGE = {n: (f0, (CUT[i + 1][1] if i + 1 < len(CUT) else N + 1)) for i, (n, f0, _) in enumerate(CUT)}

for i, (n, f0, spec) in enumerate(CUT):
    f1 = RANGE[n][1]
    bpy.ops.object.camera_add(location=spec['l0']); cam = bpy.context.object; cam.name = 'cam_' + n
    cam.data.lens = spec['lens']; cam.data.sensor_fit = 'AUTO'; cam.data.clip_end = 400
    t0 = Vector(spec['t0'])
    for fr, loc in ((f0, Vector(spec['l0'])), (f1 - 1, Vector(spec['l1']))):
        cam.location = loc; cam.rotation_euler = (t0 - loc).to_track_quat('-Z', 'Y').to_euler()
        cam.keyframe_insert('location', frame=fr); cam.keyframe_insert('rotation_euler', frame=fr)
    for fc in _fcurves(cam.animation_data.action):
        for kp in fc.keyframe_points:
            kp.interpolation = 'SINE'
    cam.data.dof.use_dof = True; cam.data.dof.aperture_fstop = spec['f']
    cam.data.dof.focus_distance = (t0 - Vector(spec['l1'])).length if n not in ('back_panel', 'wall') else 3.0
    if n.startswith('close') or n.startswith('claude'):
        cam.data.dof.focus_distance = (Vector(spec['l1']) - (GHEAD if n.startswith('close') else CBOX)).length
    m = sc.timeline_markers.new(n, frame=f0); m.camera = cam
sc.camera = bpy.data.objects['cam_' + CUT[0][0]]

def R(*names): return [RANGE[n] for n in names]
def span(a, b): return (RANGE[a][0], RANGE[b][1])

# ------------------------------------------------------------------ visibility per shot
show(panel_root, [span('wide_panel', 'wall')])
show(pb, [span('wide_panel', 'back_panel')], base=(1, 1, 1))
show(pg, R('wall'))
show(roads_root, [span('floor_high', 'claude_never')])
show(city_root, [span('city_grow', 'claude_never')])
show(lap, R('laptop_ots', 'laptop_s5'))
for i in (range(3) if street_cars else []):
    fl = bpy.data.objects[f'streetfill{i}'].data
    key(fl, 'energy', 1, 0.0, 'CONSTANT'); key(fl, 'energy', RANGE['street'][0], 9000.0, 'CONSTANT'); key(fl, 'energy', RANGE['street'][1], 0.0, 'CONSTANT')
BG = sc.world.node_tree.nodes['Background']
def bgkey(fr, col, st):
    BG.inputs['Color'].default_value = (*col, 1); BG.inputs['Strength'].default_value = st
    BG.inputs['Color'].keyframe_insert('default_value', frame=fr); BG.inputs['Strength'].keyframe_insert('default_value', frame=fr)
bgkey(1, A.NAVY_BG, 0.6); bgkey(RANGE['street'][0], A.srgb('#a9c8ea'), 1.0); bgkey(RANGE['street'][1], A.NAVY_BG, 0.6)
if street_cars:
    key(street_sun.data, 'energy', 1, 0.0, 'CONSTANT'); key(street_sun.data, 'energy', RANGE['street'][0], 3.2, 'CONSTANT')
    key(street_sun.data, 'energy', RANGE['street'][1], 0.0, 'CONSTANT')
for fc in _fcurves(sc.world.node_tree.animation_data.action):
    for kp in fc.keyframe_points: kp.interpolation = 'CONSTANT'

# buildings rise in order of distance during 'city_grow'
g0 = RANGE['city_grow'][0]; g1 = min(RANGE['city_grow'][1], g0 + 75)
maxd = max([math.hypot(b.location.x, b.location.y - 1.5) for _, b, _ in blds] or [1])
for d, b, h in blds:
    fs = int(g0 + (g1 - g0 - 10) * (math.hypot(b.location.x, b.location.y - 1.5) / maxd))
    z = b.location.z
    key(b, 'scale', 1, (1, 1, 0.001), 'CONSTANT'); key(b, 'location', 1, (b.location.x, b.location.y, 0), 'CONSTANT')
    key(b, 'scale', fs, (1, 1, 0.001), 'BACK'); key(b, 'location', fs, (b.location.x, b.location.y, 0), 'BACK')
    key(b, 'scale', fs + 9, (1, 1, 1)); key(b, 'location', fs + 9, (b.location.x, b.location.y, z))
# cars pop in one by one while the counter runs 0 -> 352 (shot 'city_cars')
c0 = RANGE['city_cars'][0] + 3; c1 = RANGE['city_cars'][1] - 8
order = sorted(cars, key=lambda c: math.hypot(c.location.x, c.location.y))
for i, c in enumerate(order):
    fi = int(c0 + (c1 - c0) * i / len(order))
    key(c, 'scale', 1, (0.0001,) * 3, 'CONSTANT'); key(c, 'scale', fi, (0.0001,) * 3); key(c, 'scale', fi + 4, (1, 1, 1))

# the guy turns to the screen for the over-shoulder and wall shots
key(G['root'], 'rotation_euler', 1, (0, 0, GUY_YAW), 'CONSTANT', )
key(G['root'], 'rotation_euler', RANGE['back_panel'][0], (0, 0, math.radians(180 + 8)), 'CONSTANT')
key(G['root'], 'rotation_euler', RANGE['close_how'][0], (0, 0, GUY_YAW), 'CONSTANT')
key(C['root'], 'rotation_euler', 1, (0, 0, CL_YAW), 'CONSTANT')
key(C['root'], 'rotation_euler', RANGE['back_panel'][0], (0, 0, math.radians(180 - 20)), 'CONSTANT')
key(C['root'], 'rotation_euler', RANGE['close_how'][0], (0, 0, CL_YAW), 'CONSTANT')

# arms: laptop shots hold the laptop; final wide shot waves
for s in (-1, 1):
    sh = G['arms'][s]
    key(sh, 'rotation_euler', 1, (0, 0, 0), 'CONSTANT')
    for n in ('laptop_ots', 'laptop_s5'):
        a, b = RANGE[n]
        key(sh, 'rotation_euler', a, (math.radians(-62), 0, math.radians(-12 * s)), 'CONSTANT')
        key(sh, 'rotation_euler', b, (0, 0, 0), 'CONSTANT')
a, b = RANGE['wide_end']
sh = G['arms'][1]
key(sh, 'rotation_euler', a, (0, 0, 0))
k = a + 6; up = True
while k < b:
    key(sh, 'rotation_euler', k, (0, math.radians(-150 if up else -125), 0)); up = not up; k += 7

# ------------------------------------------------------------------ faces: talking, blinking, expressions
gwords = [w for w in WD if w['who'] == 'G']; cwords = [w for w in WD if w['who'] == 'C']
mo = G['mouth']
key(mo, 'scale', 1, (1, 1, 1))
for w in gwords:
    a, b = F(w['s']), max(F(w['e']), F(w['s']) + 3)
    key(mo, 'scale', a, (1, 1, 1)); key(mo, 'scale', (a + b) // 2, (0.85, 1, 3.6 if len(w['w']) > 3 else 2.6)); key(mo, 'scale', b, (1, 1, 1.15))
cb = C['body']
key(cb, 'scale', 1, (1, 1, 1))
for w in cwords:
    a, b = F(w['s']), max(F(w['e']), F(w['s']) + 3)
    key(cb, 'scale', a, (1, 1, 1)); key(cb, 'scale', (a + b) // 2, (1.035, 1.035, 0.95)); key(cb, 'scale', b, (1, 1, 1))
# Claude's eyes squint-smile on its own lines; a little hop on "Nope" and "That's it"
for t in (word_find(11, 'nope'), word_find(20, "that's")):
    f = F(t); r = C['root']
    key(r, 'location', f - 2, (0.9, -0.4, 0)); key(r, 'location', f + 4, (0.9, -0.4, 0.22)); key(r, 'location', f + 10, (0.9, -0.4, 0))
# guy blinks + breathing + head nods on his lines
rnd = random.Random(5); f = 20
for s in (-1, 1):
    key(G['eyes'][s], 'scale', 1, (1, 1, 1)); key(G['pupils'][s], 'scale', 1, (1, 1, 1))
while f < N - 6:
    for s in (-1, 1):
        for o in (G['eyes'][s], G['pupils'][s]):
            key(o, 'scale', f, (1, 1, 1)); key(o, 'scale', f + 2, (1, 1, 0.08)); key(o, 'scale', f + 5, (1, 1, 1))
    f += rnd.randint(70, 115)
bd = G['body']; f = 1
while f < N:
    key(bd, 'location', f, (0, 0, 0.75)); key(bd, 'location', f + 45, (0, 0, 0.765)); f += 90
nk = G['neck']; key(nk, 'rotation_euler', 1, (0, 0, 0))
for L in LN:
    if L['who'] != 'G': continue
    a = F(L['start']); b = F(L['end'])
    key(nk, 'rotation_euler', a, (0, 0, 0)); key(nk, 'rotation_euler', (a + b) // 2, (math.radians(rnd.uniform(4, 8)), 0, math.radians(rnd.uniform(-6, 6))))
    key(nk, 'rotation_euler', b + 4, (0, 0, 0))
# expressions (brows: z offset + tilt; pupils scale) keyed at shot starts
EXPR = {'sad': (0.0, 0.32, 1.0), 'shock': (0.07, 0.0, 0.7), 'neutral': (0.0, 0.0, 1.0), 'curious': (0.05, -0.15, 1.0),
        'worried': (0.02, 0.25, 0.9), 'happy': (0.05, -0.05, 1.0)}
SHOT_EXPR = [('close_sad', 'sad'), ('wide_panel', 'neutral'), ('close_shock', 'shock'), ('close_how', 'curious'),
             ('laptop_ots', 'curious'), ('two_mid', 'neutral'), ('close_gen', 'curious'), ('close_cant', 'worried'),
             ('claude_never', 'neutral'), ('close_cost', 'curious'), ('close_thatsit', 'shock'), ('street', 'neutral'),
             ('close_cta', 'happy')]
for n, e in SHOT_EXPR:
    up, tilt, ps = EXPR[e]; fr = 1 if n == 'close_sad' else RANGE[n][0]
    for s in (-1, 1):
        bp = G['brows'][s]
        key(bp, 'location', fr, (0.17 * s, -0.38, 0.66 + up), 'CONSTANT')
        key(bp, 'rotation_euler', fr, (0, tilt * s, 0), 'CONSTANT')

# confetti on the last shot
a, b = RANGE['wide_end']
conf = [A.mat(f'conf{i}', A.srgb(c), 0.4, emit=A.srgb(c), strength=0.6) for i, c in
        enumerate(['#f4c21a', '#ff4f8b', '#3fd0ff', '#2ee59d', '#c96a50', '#ffffff'])]
rc = random.Random(8)
for i in range(110):
    x = rc.uniform(-2.6, 2.6); y = rc.uniform(-1.8, 1.0)
    o = A.box(f'cf{i}', (x, y, 6), (0.09, 0.02, 0.06), rc.choice(conf), bevel=0)
    st = a + rc.randint(0, 25); en = min(b + 30, st + rc.randint(50, 80))
    key(o, 'location', 1, (x, y, 30), 'CONSTANT'); key(o, 'location', st, (x, y, rc.uniform(4.2, 5.5)), 'LINEAR')
    key(o, 'location', en, (x + rc.uniform(-0.6, 0.6), y, rc.uniform(-0.1, 1.0)), 'LINEAR')
    key(o, 'rotation_euler', st, (0, 0, 0), 'LINEAR'); key(o, 'rotation_euler', en, (rc.uniform(-12, 12), rc.uniform(-12, 12), rc.uniform(-6, 6)), 'LINEAR')

# payoff: every tire vanishes, every car body drops onto the road
tv = F(P0 + 0.85)
for root, body, tires in street_cars:
    for t in tires:
        key(t, 'scale', 1, (1, 1, 1), 'CONSTANT'); key(t, 'scale', tv + rnd.randint(0, 2), (0.0001,) * 3, 'CONSTANT')
    d = tv + rnd.randint(0, 3)
    key(body, 'location', 1, (0, 0, 0), 'CONSTANT'); key(body, 'location', d, (0, 0, 0), 'QUAD')
    key(body, 'location', d + 5, (0, 0, -0.3), 'QUAD'); key(body, 'location', d + 8, (0, 0, -0.24), 'QUAD')
    key(body, 'location', d + 11, (0, 0, -0.3), 'QUAD')

json.dump({n: [a, b] for n, (a, b) in RANGE.items()}, open(os.path.join(HERE, 'shots.json'), 'w'), indent=1)
if '--save' in argv:
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'reel.blend'))
os.makedirs(OUT, exist_ok=True)
sc.render.filepath = OUT + '/'
nums = [a for a in argv[1:] if a.isdigit()]
if '--frames' in argv:  # render a list of single frames for checking
    for fr in [int(x) for x in argv[argv.index('--frames') + 1].split(',')]:
        sc.frame_set(fr); sc.render.filepath = f'{OUT}/chk_{fr:04d}.jpg'; bpy.ops.render.render(write_still=True)
elif PART != 'all':
    mine = PARTS.get(PART) or [n for n in RANGE if not any(n in v for v in PARTS.values())]
    import time; t0 = time.time(); cnt = 0
    for n in mine:
        a, b = RANGE[n]
        sc.frame_start, sc.frame_end = a, b - 1
        bpy.ops.render.render(animation=True); cnt += b - a
    json.dump({'part': PART, 'frames': cnt, 'seconds': round(time.time() - t0)}, open(os.path.join(HERE, f'stats_{PART}.json'), 'w'))
elif len(nums) == 2:
    sc.frame_start, sc.frame_end = int(nums[0]), int(nums[1])
    bpy.ops.render.render(animation=True)
