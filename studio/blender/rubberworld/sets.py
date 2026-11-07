"""Extra sets: the frozen beach (the "what if" short shown on the big screen) and the Times Square street
(the payoff: all rubber disappears). Built far from the main stage so one .blend holds everything."""
import bpy, math, random
import assets as A
from assets import srgb, mat, box, cyl, empty

def sky(name, loc, size, top, bottom, rot=(math.pi / 2, 0, 0)):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); em = nt.nodes.new('ShaderNodeEmission')
    tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (*bottom, 1); ramp.color_ramp.elements[1].color = (*top, 1)
    nt.links.new(tc.outputs['Generated'], sep.inputs[0]); nt.links.new(sep.outputs['Y'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], em.inputs['Color']); em.inputs['Strength'].default_value = 1.0
    nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
    import bmesh
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=size / 2)
    bm.to_mesh(me); bm.free(); me.materials.append(m)
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    o.location = loc; o.rotation_euler = rot
    return o

def person(name, loc, rnd, parent=None, frozen=False):
    shirt = rnd.choice(['#e63946', '#2a9d8f', '#f4a261', '#457b9d', '#ffffff', '#8338ec', '#06d6a0'])
    if frozen: shirt = '#dfe9f3'
    R = empty(name, loc, parent)
    box(name + 'l', (0, 0, 0.22), (0.16, 0.12, 0.44), mat('legs_' + ('f' if frozen else 'n'), srgb('#cfdcea' if frozen else '#263046'), 0.6), R, bevel=0.01)
    box(name + 't', (0, 0, 0.62), (0.24, 0.14, 0.36), mat('sh' + shirt, srgb(shirt), 0.6), R, bevel=0.01)
    box(name + 'h', (0, 0, 0.9), (0.16, 0.16, 0.18), mat('skin_' + ('f' if frozen else 'n'), srgb('#e8f1f8' if frozen else '#b07a55'), 0.5), R, bevel=0.01)
    return R

def build_beach(origin=(-300, 0, 0)):
    """Frozen beach at absolute zero: pale sand, iced sea, frosted palms, frozen people, frost-white sky."""
    ox, oy, oz = origin; rnd = random.Random(21)
    box('sand', (ox, oy + 10, -0.05), (60, 40, 0.1), mat('sand', srgb('#d9cdb6'), 0.9), bevel=0)
    box('icesea', (ox, oy + 40, -0.04), (120, 30, 0.1), mat('icesea', srgb('#bcd6e4'), 0.15), bevel=0)
    sky('beachsky', (ox, oy + 60, 10), 140, srgb('#8fb4d3'), srgb('#e4eef5'))
    frond = mat('frond', srgb('#9fb8a6'), 0.6); trunk = mat('trunk', srgb('#b7a99a'), 0.8)
    for i in range(16):
        x = ox + rnd.uniform(-14, 14); y = oy + rnd.uniform(2, 26)
        T = empty(f'palm{i}', (x, y, 0))
        for k in range(6):
            box(f'pt{i}_{k}', (0.06 * k, 0, 0.45 + k * 0.8), (0.32, 0.32, 0.82), trunk, T, bevel=0.03)
        for a in range(6):
            ang = a * math.pi / 3
            box(f'pf{i}_{a}', (0.3 + 1.0 * math.cos(ang), 1.0 * math.sin(ang), 5.0), (2.2, 0.5, 0.12), frond, T,
                bevel=0.02, rot=(0.0, math.radians(18), ang))
    for i in range(40):
        person(f'bp{i}', (ox + rnd.uniform(-12, 12), oy + rnd.uniform(-2, 18), 0), rnd, frozen=True)
    # a frozen car
    box('bcar', (ox + 3, oy - 1, 0.45), (2.2, 1.1, 0.7), mat('frostcar', srgb('#d7e2ec'), 0.3), bevel=0.08)
    bpy.ops.object.light_add(type='SUN', location=(ox, oy, 20)); s = bpy.context.object
    s.data.energy = 1.6; s.rotation_euler = (math.radians(50), 0, math.radians(30)); s.data.color = srgb('#eef4ff')
    s.name = 'beachsun'
    return s

def build_street(origin=(300, 0, 0), seed=31):
    """Times Square at dusk: a long avenue, cars on tires both sides, lit billboards, crowds.
    Returns list of (car_root, [tires], drop) for the rubber gag."""
    ox, oy, oz = origin; rnd = random.Random(seed)
    asphalt = mat('asphalt', srgb('#55585e'), 0.85); walk = mat('walk', srgb('#8d8f94'), 0.8)
    yl = mat('curb', srgb('#f4c21a'), 0.5, emit=srgb('#f4c21a'), strength=0.6)
    box('avenue', (ox, oy + 60, -0.05), (9, 140, 0.1), asphalt, bevel=0)
    for s in (-1, 1):
        box(f'walk{s}', (ox + s * 7.5, oy + 60, 0.05), (6, 140, 0.3), walk, bevel=0)
        box(f'curbline{s}', (ox + s * 4.45, oy + 60, 0.01), (0.12, 140, 0.04), yl, bevel=0)
    sky('streetsky', (ox, oy + 135, 20), 140, srgb('#7fb0e6'), srgb('#f3d9b8'))
    blds = [mat(f'sb{i}', srgb(c), 0.7) for i, c in enumerate(['#b9b2a8', '#8c96a8', '#c7c1b5', '#6f7a8c'])]
    bill = [mat(f'sbill{i}', (0, 0, 0), emit=srgb(c), strength=2.6) for i, c in
            enumerate(['#ff1f6b', '#00a8ff', '#ff9a00', '#7a2cff', '#00c97a', '#ff3b1f'])]
    for s in (-1, 1):
        y = oy + 4
        while y < oy + 130:
            w = rnd.uniform(5, 9); h = rnd.uniform(14, 34)
            box(f'sbld{s}_{int(y)}', (ox + s * (13 + rnd.uniform(0, 1.5)), y + w / 2, h / 2), (10, w, h), rnd.choice(blds), bevel=0.05)
            for k in range(rnd.randint(1, 3)):
                bh = rnd.uniform(2.5, 6); bz = rnd.uniform(3, h - 3)
                box(f'sbb{s}_{int(y)}_{k}', (ox + s * 7.95, y + w / 2, bz), (0.1, w * 0.85, bh), rnd.choice(bill), bevel=0)
            y += w + 0.3
    # crowds on the sidewalks
    for i in range(140):
        s = rnd.choice((-1, 1))
        person(f'sp{i}', (ox + s * rnd.uniform(5.2, 9.5), oy + rnd.uniform(3, 70), 0.2), rnd)
    # cars with rubber tires, parked/queued along both curbs
    cars = []
    tire = mat('tire', srgb('#141414'), 0.9); rim = mat('rim', srgb('#bfc3c9'), 0.3, metal=0.8)
    cols = [A.YELLOW, A.YELLOW, A.YELLOW, srgb('#e8e8ee'), srgb('#2b2f38'), srgb('#c0392b'), srgb('#d0d4da')]
    for s in (-1, 1):
        y = oy + 3.5
        while y < oy + 90:
            c = rnd.choice(cols); x = ox + s * 3.2
            R = empty(f'scar{s}_{int(y*10)}', (x, y, 0))
            body = empty(f'scarb{s}_{int(y*10)}', (0, 0, 0), R)
            box(f'scb{s}_{int(y*10)}', (0, 0, 0.62), (1.9, 4.2, 0.62), mat('scol' + str(cols.index(c)), c, 0.3), body, bevel=0.1)
            box(f'scc{s}_{int(y*10)}', (0, -0.2, 1.15), (1.6, 2.1, 0.5), mat('glass', srgb('#1d2633'), 0.1), body, bevel=0.08)
            tires = []
            for tx in (-0.95, 0.95):
                for ty in (-1.35, 1.35):
                    t = cyl(f'st{s}_{int(y*10)}_{tx}_{ty}', (tx, ty, 0.34), 0.34, 0.26, tire, R, rot=(0, math.pi / 2, 0))
                    tires.append(t)
            cars.append((R, body, tires))
            y += 4.9 + rnd.uniform(0, 0.8)
    bpy.ops.object.light_add(type='SUN', location=(ox, oy, 30)); sun = bpy.context.object
    sun.data.energy = 3.2; sun.rotation_euler = (math.radians(58), 0, math.radians(-35)); sun.data.color = srgb('#ffe2c0')
    sun.name = 'streetsun'
    for i, yy in enumerate((10, 35, 65)):
        bpy.ops.object.light_add(type='AREA', location=(ox, oy + yy, 16)); a = bpy.context.object
        a.data.energy = 9000; a.data.size = 14; a.data.color = srgb('#ffe9d2'); a.name = f'streetfill{i}'
        a.parent = sun
    return cars
