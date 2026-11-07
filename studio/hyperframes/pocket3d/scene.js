/* Pocket-3D dialogue reel (job df71c9d45658): a low-poly rooftop at night, Hammad and Claude (the orange TV-head
   robot) talking, shot like the @pocketworld.studio reference. Everything is derived from the time t alone
   (HyperFrames seek protocol); window.TL (timeline.js, written by the job's build.py) holds the shots, the two
   mouth envelopes and the line times. */
(function () {
  const W = 1080, H = 1920, FPS = 30;
  const TL = window.TL;
  const canvas = document.getElementById('gl');
  THREE.ColorManagement.legacyMode = false;
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, preserveDrawingBuffer: true});
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.autoClear = false;

  // ---------- deterministic helpers ----------
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const lerp = (a, b, k) => a + (b - a) * k;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const ease = k => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const easeOut = k => 1 - Math.pow(1 - k, 3);
  const hash = n => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
  const noise1 = x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; };
  const M = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({color: c, roughness: 0.75, metalness: 0.0, flatShading: true}, o));
  const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true; if (parent) parent.add(m); return m;
  };

  // ---------- textures ----------
  function windowsTexture(cols, rows, lit, warm) {
    const c = document.createElement('canvas'); c.width = cols * 16; c.height = rows * 16;
    const g = c.getContext('2d'); g.fillStyle = '#030309'; g.fillRect(0, 0, c.width, c.height);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (rnd() < lit) { const b = 0.75 + rnd() * 0.25; g.fillStyle = warm ? `rgba(255,${226 + rnd() * 25 | 0},${170 + rnd() * 40 | 0},${b})` : `rgba(235,240,255,${b})`; g.fillRect(x * 16 + 4, y * 16 + 3, 7, 8); }
    }
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.magFilter = THREE.LinearFilter; t.anisotropy = 4; return t;
  }
  function discTexture(soft) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    if (soft) { r.addColorStop(0, 'rgba(255,255,255,0.85)'); r.addColorStop(0.55, 'rgba(255,255,255,0.55)'); r.addColorStop(0.8, 'rgba(255,255,255,0.18)'); r.addColorStop(1, 'rgba(255,255,255,0)'); }
    else { r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.42, 'rgba(255,255,255,1)'); r.addColorStop(0.5, 'rgba(255,255,255,0.35)'); r.addColorStop(1, 'rgba(255,255,255,0)'); }
    g.fillStyle = r; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); return t;
  }
  const DISC_SOFT = discTexture(true), DISC_HARD = discTexture(false);

  // ---------- characters ----------
  function makeHuman(o = {}) {
    const P = Object.assign({skin: 0xc98c62, hair: 0x1b130f, stubble: 0x2a1d17, top: 0x9db2e2, pants: 0x1d1b22, shoe: 0xd8dbe2,
                             hairStyle: 'quiff', beard: 'stubble', glasses: false, hood: true}, o);
    const root = new THREE.Group(), mats = {skin: M(P.skin), hair: M(P.hair, {roughness: 0.9}), stub: M(P.stubble, {roughness: 0.95}), top: M(P.top),
      pants: M(P.pants), shoe: M(P.shoe), white: M(0xf4f1ea, {roughness: 0.4}), dark: M(0x15100d), lip: M(0x6a2e26), teeth: M(0xf6f1e6, {roughness: 0.3})};
    const R = {root};
    // legs + shoes
    R.legL = new THREE.Group(); R.legL.position.set(-0.115, 0.9, 0); root.add(R.legL);
    R.legR = new THREE.Group(); R.legR.position.set(0.115, 0.9, 0); root.add(R.legR);
    for (const L of [R.legL, R.legR]) { box(0.17, 0.82, 0.19, mats.pants, 0, -0.41, 0, L); box(0.17, 0.09, 0.29, mats.shoe, 0, -0.86, 0.04, L); }
    // torso
    R.chest = new THREE.Group(); R.chest.position.set(0, 0.9, 0); root.add(R.chest);
    box(0.6, 0.66, 0.33, mats.top, 0, 0.33, 0, R.chest);
    box(0.62, 0.1, 0.35, mats.top, 0, 0.04, 0, R.chest);                              // hem
    if (P.hood) {
      box(0.34, 0.15, 0.06, mats.top, 0, 0.12, 0.18, R.chest);                       // kangaroo pocket
      box(0.46, 0.13, 0.38, mats.top, 0, 0.66, -0.01, R.chest);                       // hood collar
      box(0.3, 0.26, 0.12, mats.top, 0, 0.6, -0.2, R.chest);                          // hood back
      box(0.016, 0.2, 0.016, mats.white, -0.06, 0.5, 0.175, R.chest); box(0.016, 0.18, 0.016, mats.white, 0.06, 0.51, 0.175, R.chest);
    } else box(0.4, 0.06, 0.35, mats.top, 0, 0.66, 0, R.chest);
    // arms (shoulder pivots)
    const arm = side => {
      const sh = new THREE.Group(); sh.position.set(side * 0.37, 0.58, 0); R.chest.add(sh);
      box(0.16, 0.36, 0.17, mats.top, 0, -0.17, 0, sh);
      const el = new THREE.Group(); el.position.set(0, -0.34, 0); sh.add(el);
      box(0.15, 0.3, 0.16, mats.top, 0, -0.14, 0, el); box(0.1, 0.13, 0.07, mats.skin, 0, -0.34, 0, el);
      return [sh, el];
    };
    [R.shL, R.elL] = arm(-1); [R.shR, R.elR] = arm(1);
    // neck + head
    box(0.13, 0.14, 0.13, mats.skin, 0, 0.72, 0, R.chest);
    R.head = new THREE.Group(); R.head.position.set(0, 0.76, 0.0); R.chest.add(R.head);
    const hd = R.head;
    box(0.4, 0.46, 0.4, mats.skin, 0, 0.25, 0, hd);
    box(0.05, 0.1, 0.07, mats.skin, -0.215, 0.25, -0.01, hd); box(0.05, 0.1, 0.07, mats.skin, 0.215, 0.25, -0.01, hd);   // ears
    box(0.065, 0.1, 0.07, mats.skin, 0, 0.215, 0.215, hd);                                                              // nose
    // eyes
    R.eyes = [];
    for (const s of [-1, 1]) {
      const eg = new THREE.Group(); eg.position.set(s * 0.088, 0.28, 0.201); hd.add(eg);
      box(0.082, 0.055, 0.01, mats.white, 0, 0, 0, eg); const p = box(0.036, 0.04, 0.012, mats.dark, 0, -0.002, 0.004, eg);
      R.eyes.push({g: eg, p});
      const br = box(0.11, 0.032, 0.03, mats.hair, s * 0.093, 0.345, 0.205, hd); br.rotation.z = -s * 0.08; R['brow' + (s < 0 ? 'L' : 'R')] = br;
    }
    if (P.glasses) {
      const gm = M(0x2a1d16); for (const s of [-1, 1]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.009, 6, 16), gm); ring.position.set(s * 0.088, 0.28, 0.215); hd.add(ring); }
      box(0.06, 0.01, 0.01, gm, 0, 0.29, 0.216, hd);
    }
    // mouth: dark slot that opens, teeth strip, lower lip
    R.mouth = box(0.13, 0.02, 0.012, mats.dark, 0, 0.115, 0.213, hd);
    R.teeth = box(0.11, 0.02, 0.014, mats.teeth, 0, 0.123, 0.215, hd);
    R.lipLow = box(0.12, 0.018, 0.012, mats.lip, 0, 0.1, 0.214, hd);
    // stubble beard + moustache (Hammad: short dark stubble, full moustache)
    const st = mats.stub;
    if (P.beard !== 'none') {
      box(0.17, 0.035, 0.016, mats.hair, 0, 0.152, 0.214, hd);                                  // moustache
      box(0.41, 0.085, 0.03, st, 0, 0.045, 0.195, hd);                                             // jaw front band (chin)
      box(0.03, 0.21, 0.36, st, -0.2, 0.105, 0.0, hd); box(0.03, 0.21, 0.36, st, 0.2, 0.105, 0.0, hd); // jaw sides
      box(0.41, 0.05, 0.38, st, 0, 0.0, 0.0, hd);                                                  // under chin
      box(0.09, 0.09, 0.02, st, -0.14, 0.11, 0.203, hd); box(0.09, 0.09, 0.02, st, 0.14, 0.11, 0.203, hd);
      if (P.beard === 'full') { box(0.42, 0.18, 0.06, mats.hair, 0, 0.05, 0.2, hd); }
    }
    // hair
    const hm = mats.hair;
    if (P.hairStyle === 'quiff') {
      box(0.43, 0.12, 0.43, hm, 0, 0.5, -0.01, hd);                     // cap
      const q = box(0.4, 0.16, 0.18, hm, 0, 0.58, 0.12, hd); q.rotation.x = -0.4;   // swept-up front
      const q2 = box(0.34, 0.12, 0.2, hm, 0.03, 0.62, 0.0, hd); q2.rotation.x = -0.2; const q3 = box(0.2, 0.08, 0.14, hm, -0.06, 0.66, 0.08, hd); q3.rotation.set(-0.3, 0, 0.15);
      box(0.04, 0.2, 0.36, hm, -0.215, 0.39, -0.03, hd); box(0.04, 0.2, 0.36, hm, 0.215, 0.39, -0.03, hd);  // sides
      box(0.43, 0.3, 0.05, hm, 0, 0.36, -0.205, hd);                     // back
    } else if (P.hairStyle === 'long') {
      box(0.45, 0.13, 0.45, hm, 0, 0.5, -0.01, hd); box(0.46, 0.5, 0.1, hm, 0, 0.2, -0.2, hd);
      box(0.06, 0.5, 0.4, hm, -0.225, 0.2, -0.01, hd); box(0.06, 0.5, 0.4, hm, 0.225, 0.2, -0.01, hd);
      const f = box(0.44, 0.09, 0.08, hm, 0, 0.44, 0.2, hd); f.rotation.x = 0.2;
    } else {
      box(0.43, 0.13, 0.43, hm, 0, 0.5, -0.01, hd); box(0.43, 0.25, 0.05, hm, 0, 0.38, -0.205, hd);
    }
    R.P = P; return R;
  }

  function makeRobot() {
    const root = new THREE.Group(), R = {root};
    const or = M(0xf06a24, {roughness: 0.55}), orD = M(0xc9521a, {roughness: 0.6}), blk = M(0x09090c, {roughness: 0.35}),
          scr = M(0x050507, {roughness: 0.95, metalness: 0.0}), wht = new THREE.MeshStandardMaterial({color: 0xffffff, emissive: 0xfff6e8, emissiveIntensity: 1.2, roughness: 0.3});
    R.legL = new THREE.Group(); R.legL.position.set(-0.17, 0.44, 0); root.add(R.legL);
    R.legR = new THREE.Group(); R.legR.position.set(0.17, 0.44, 0); root.add(R.legR);
    for (const L of [R.legL, R.legR]) { box(0.15, 0.36, 0.15, or, 0, -0.2, 0, L); box(0.22, 0.09, 0.3, or, 0, -0.395, 0.04, L); }
    R.body = new THREE.Group(); R.body.position.set(0, 0.44, 0); root.add(R.body);
    box(0.4, 0.13, 0.28, blk, 0, 0.04, 0, R.body);
    R.head = new THREE.Group(); R.head.position.set(0, 0.1, 0); R.body.add(R.head);
    const hd = R.head;
    box(0.86, 0.66, 0.52, or, 0, 0.36, 0, hd);
    box(0.74, 0.52, 0.03, orD, 0, 0.37, 0.25, hd);                       // bezel step
    box(0.68, 0.46, 0.03, scr, 0, 0.37, 0.262, hd);                       // black screen
    box(0.07, 0.34, 0.32, orD, -0.46, 0.36, -0.02, hd); box(0.07, 0.34, 0.32, orD, 0.46, 0.36, -0.02, hd);  // side knobs
    box(0.5, 0.06, 0.4, orD, 0, 0.71, -0.02, hd);                         // top lip
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 6), blk); ant.position.set(0.24, 0.86, -0.08); hd.add(ant);
    R.bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), new THREE.MeshStandardMaterial({color: 0xffffff, emissive: 0xfff3dd, emissiveIntensity: 2.2}));
    R.bulb.position.set(0.24, 1.06, -0.08); hd.add(R.bulb);
    R.bulbLight = new THREE.PointLight(0xfff0d0, 0.6, 2.5); R.bulbLight.position.copy(R.bulb.position); hd.add(R.bulbLight);
    R.eyes = [];
    for (const s of [-1, 1]) { const e = box(0.13, 0.13, 0.02, wht, s * 0.145, 0.43, 0.282, hd); e.castShadow = false; R.eyes.push(e); }
    R.mouth = box(0.18, 0.045, 0.02, wht, 0, 0.255, 0.282, hd); R.mouth.castShadow = false;
    R.screenLight = new THREE.PointLight(0xffffff, 0.0, 1.4); R.screenLight.position.set(0, 0.37, 0.6); hd.add(R.screenLight);
    return R;
  }

  // ---------- world ----------
  function makeWorld(theme) {
    const T = Object.assign({sky: 0x03040c, fog: 0x070818, floor: 0x0d0e22, tile: 0x15173a, rim: 0x5566ff, key: 0xffd9b0, amb: 0x2a2f6e,
                             cityWarm: true, bokeh: 0xffe7b0, frame: true}, theme);
    const sc = new THREE.Scene(); sc.background = new THREE.Color(T.sky); sc.fog = new THREE.Fog(T.fog, 14, 70);
    sc.add(new THREE.HemisphereLight(T.amb, 0x05050c, 0.55));
    const key = new THREE.DirectionalLight(T.key, 1.6); key.position.set(-3, 5, 6); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -5; key.shadow.camera.right = 5; key.shadow.camera.top = 5; key.shadow.camera.bottom = -3; key.shadow.bias = -0.0008;
    sc.add(key);
    const rim = new THREE.DirectionalLight(T.rim, 1.6); rim.position.set(4, 3, -6); sc.add(rim);
    const rim2 = new THREE.DirectionalLight(T.rim, 0.7); rim2.position.set(-5, 2, -4); sc.add(rim2);
    const fill = new THREE.PointLight(0x7f6bff, 0.35, 8); fill.position.set(0, 0.6, 2.5); sc.add(fill);
    // floor: dark slab with raised tiles
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), M(T.floor, {roughness: 0.55, metalness: 0.1})); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; sc.add(fl);
    const tm = M(T.tile, {roughness: 0.5, metalness: 0.15});
    for (let z = -5; z < 6; z++) for (let x = -7; x < 8; x++) {
      const w = 0.9 + (hash(x * 7 + z) < 0.3 ? 0.9 : 0), t = box(w, 0.04, 0.9, tm, x * 1.0 + (w > 1 ? 0.45 : 0), 0.02, z * 1.0); t.castShadow = false;
      if (w > 1) x++;
    }
    // roof edge + parapet
    box(16, 0.25, 0.3, M(0x14162e), 0, 0.12, -5.6).castShadow = false;
    // window frame cross (the reference's big glass wall mullions, with a blue glow edge)
    if (T.frame) {
      const fm = M(0x05060f, {roughness: 0.5}), gm = new THREE.MeshBasicMaterial({color: 0x2f3fd0});
      box(0.32, 16, 0.3, fm, 0.1, 8, -7); box(16, 0.3, 0.3, fm, 0, 6.2, -7);
      box(0.04, 16, 0.05, gm, 0.27, 8, -6.84); box(16, 0.04, 0.05, gm, 0, 6.36, -6.84);
    }
    // skyline
    const city = new THREE.Group(); sc.add(city);
    for (let i = 0; i < 46; i++) {
      const w = 2 + rnd() * 3.5, h = 6 + rnd() * 26, d = 2 + rnd() * 3, x = (rnd() - 0.5) * 60, z = -12 - rnd() * 34;
      const tex = windowsTexture(Math.max(3, w * 2.2 | 0), Math.max(6, h * 1.6 | 0), 0.35 + rnd() * 0.25, T.cityWarm);
      const mt = new THREE.MeshBasicMaterial({map: tex, fog: true});
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mt); b.position.set(x, h / 2 - 3, z); city.add(b);
    }
    // bokeh discs: background haze + big foreground circles + the 3 bright "moons" at the top
    const bokeh = [];
    for (let i = 0; i < 90; i++) {
      const near = i < 22;
      const m = new THREE.SpriteMaterial({map: DISC_SOFT, color: T.bokeh, transparent: true, opacity: near ? 0.22 + rnd() * 0.2 : 0.3 + rnd() * 0.35, depthWrite: false, fog: false});
      const s = new THREE.Sprite(m); const sz = near ? 0.5 + rnd() * 0.9 : 0.4 + rnd() * 1.1;
      s.scale.set(sz, sz, 1); s.position.set((rnd() - 0.5) * (near ? 9 : 26), near ? 0.8 + rnd() * 4.5 : 1 + rnd() * 12, near ? -2.5 - rnd() * 3 : -9 - rnd() * 6);
      s.userData = {ph: rnd() * 6.28, sp: 0.15 + rnd() * 0.25, y0: s.position.y}; sc.add(s); bokeh.push(s);
    }
    for (let i = 0; i < 3; i++) {
      const m = new THREE.SpriteMaterial({map: DISC_HARD, color: 0xfff8e8, transparent: true, depthWrite: false, fog: false});
      const s = new THREE.Sprite(m); s.scale.set(0.9, 0.9, 1); s.position.set(-2.6 + i * 2.4 + (i === 1 ? 0.3 : 0), 5.4 + (i === 1 ? 0.3 : 0), -6); sc.add(s);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({map: DISC_SOFT, color: 0xfff1d0, transparent: true, opacity: 0.35, depthWrite: false, fog: false}));
      halo.scale.set(2.2, 2.2, 1); halo.position.copy(s.position); sc.add(halo);
    }
    return {sc, bokeh, T};
  }

  // ---------- main scene ----------
  const MAIN = makeWorld({});
  const HAM = makeHuman({}); HAM.root.position.set(-1.05, 0.04, 0); MAIN.sc.add(HAM.root);
  const BOT = makeRobot(); BOT.root.position.set(1.15, 0.04, 0.15); MAIN.sc.add(BOT.root);
  const cam = new THREE.PerspectiveCamera(30, W / H, 0.05, 200);

  // ---------- montage (2x2 grid of other 3D dialogue reels: our own mini scenes) ----------
  const MON = [];
  {
    // A: purple window, man + robot walking
    const a = makeWorld({sky: 0x15103a, fog: 0x2a1f6a, floor: 0x2a2060, tile: 0x382c78, rim: 0x9a7bff, amb: 0x4a3aa0, bokeh: 0xffffff});
    const ah = makeHuman({top: 0x3b3f9e, hairStyle: 'short', beard: 'none', skin: 0xd9a27c}); ah.root.position.set(-0.6, 0.04, 0); a.sc.add(ah.root);
    const ab = makeRobot(); ab.root.position.set(0.7, 0.04, 0); ab.root.scale.setScalar(0.9); a.sc.add(ab.root);
    MON.push({w: a, chars: [ah, ab], cam: new THREE.PerspectiveCamera(32, 1, 0.05, 200), shot: t => [[0.1 + t * 0.05, 1.3, 5.6], [0.1, 0.9, 0]], walk: true});
    // B: sunset, girl with round glasses and a yellow jacket looking at her phone
    const b = makeWorld({sky: 0x3a1a3c, fog: 0x8a4a6a, floor: 0x3a2234, tile: 0x4a2c44, rim: 0xff9a6a, key: 0xffc890, amb: 0x8a4a7a, cityWarm: true, bokeh: 0xffd0a0, frame: false});
    const bh = makeHuman({top: 0xf2c218, hairStyle: 'long', beard: 'none', glasses: true, skin: 0xf0c9a8, hair: 0x3a2318, hood: false}); b.sc.add(bh.root);
    const phone = box(0.09, 0.17, 0.015, M(0x111111), 0.02, 1.48, 0.3, b.sc); phone.rotation.x = -0.5;
    MON.push({w: b, chars: [bh], cam: new THREE.PerspectiveCamera(30, 1, 0.05, 200), shot: t => [[0.05, 1.82, 1.95 - t * 0.05], [0, 1.7, 0]], phone: true});
    // C: indigo studio, a man at a desk, robot behind
    const c = makeWorld({sky: 0x0d0b30, fog: 0x1a1660, floor: 0x241f66, tile: 0x2c2680, rim: 0x6a5cff, amb: 0x3a32a0, bokeh: 0x9a8cff, frame: false});
    const ch = makeHuman({top: 0x5a3ec8, skin: 0xb07a52, beard: 'full'}); ch.root.position.set(-0.8, 0.04, 0.4); ch.root.rotation.y = 0.6; c.sc.add(ch.root);
    const desk = box(1.4, 0.06, 0.6, M(0x1a1830), 0.2, 0.78, -0.2, c.sc); box(0.7, 0.42, 0.04, M(0x0a0a10), 0.2, 1.06, -0.4, c.sc);
    box(0.6, 0.34, 0.01, new THREE.MeshBasicMaterial({color: 0xe8e8f0}), 0.2, 1.06, -0.375, c.sc);
    const cb = makeRobot(); cb.root.position.set(1.1, 0.04, -0.6); cb.root.scale.setScalar(0.75); c.sc.add(cb.root);
    MON.push({w: c, chars: [ch, cb], cam: new THREE.PerspectiveCamera(34, 1, 0.05, 200), shot: t => [[0.2, 1.5, 4.2], [0.15, 0.95, 0]]});
    // D: pink dusk office, a bearded man close with a monitor and a mug
    const d = makeWorld({sky: 0x4a1f4a, fog: 0x7a3a6a, floor: 0x2a1c30, tile: 0x34223c, rim: 0xff8ad0, amb: 0x6a3a7a, bokeh: 0xffc0e0, frame: true});
    const dh = makeHuman({top: 0x8fb4f0, beard: 'full', glasses: true, skin: 0xc48a5c}); d.sc.add(dh.root);
    box(0.8, 0.06, 0.5, M(0x3a2a24), 0, 1.0, 0.45, d.sc);
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 12), M(0xf0f0f0)); mug.position.set(0.25, 1.08, 0.55); d.sc.add(mug);
    box(0.5, 0.36, 0.03, M(0x0a0a10), 0.55, 1.75, -0.4, d.sc);
    MON.push({w: d, chars: [dh], cam: new THREE.PerspectiveCamera(32, 1, 0.05, 200), shot: t => [[-0.1, 1.8, 2.7 - t * 0.05], [0.1, 1.55, 0]]});
  }
  // panel rects in 1080x1920 px (reference: 2x2 grid, white glowing borders)
  const PANELS = [[86, 86, 450, 800], [574, 86, 450, 800], [86, 970, 450, 800], [574, 970, 450, 800]];

  // ---------- animation ----------
  const mouthAt = (who, t) => { const a = TL.mouth[who], f = t * FPS, i = Math.floor(f); if (i < 0 || i + 1 >= a.length) return 0; return lerp(a[i], a[i + 1], f - i); };
  const speaking = (who, t) => TL.lines.some(l => l.who === who && t >= l.s - 0.05 && t <= l.e + 0.1);
  const lineAt = (who, t) => TL.lines.filter(l => l.who === who && t >= l.s - 0.3).pop();
  function blink(t, off) { const p = (t + off) % 3.7; return p < 0.12 ? 1 - Math.sin(p / 0.12 * Math.PI) * 0.92 : 1; }

  function animHuman(R, t, mouth, talk, look, opt = {}) {
    const br = Math.sin(t * 1.6) * 0.008;
    R.chest.position.y = 0.9 + br; R.chest.rotation.z = noise1(t * 0.4 + 3) * 0.015;
    // head: nods while talking, looks at look-yaw
    R.head.rotation.x = -0.04 + (talk ? noise1(t * 2.3) * 0.07 + mouth * 0.04 : noise1(t * 0.6) * 0.02);
    R.head.rotation.y = look + noise1(t * 0.5 + 9) * 0.06; R.head.rotation.z = noise1(t * 0.7 + 4) * 0.04;
    // mouth
    const o = clamp(mouth) * 0.07;
    R.mouth.scale.y = 1 + o / 0.02 * 1.4; R.mouth.position.y = 0.118 - o * 0.45;
    R.teeth.position.y = 0.128 - o * 0.1; R.lipLow.position.y = 0.1 - o * 1.0;
    const bl = blink(t, R.P.top % 7);
    for (const e of R.eyes) e.g.scale.y = bl;
    const lift = talk ? clamp(mouth) * 0.02 : 0; R.browL.position.y = 0.345 + lift; R.browR.position.y = 0.345 + lift;
    // arms: rest at the sides; while talking the right forearm comes up palm-out (the reference's gesture)
    const g = opt.gesture != null ? opt.gesture : 0;
    R.shL.rotation.z = -0.12 + noise1(t * 0.5) * 0.02; R.shL.rotation.x = 0.05;
    R.elL.rotation.x = -0.15 - g * 0.15;
    R.shR.rotation.z = 0.12 + g * 0.35; R.shR.rotation.x = -g * 0.35 + noise1(t * 0.9) * 0.05 * g;
    R.elR.rotation.x = -0.2 - g * 1.0 + noise1(t * 1.7) * 0.12 * g; R.elR.rotation.z = g * 0.2;
    R.legL.rotation.x = 0; R.legR.rotation.x = 0;
  }
  function animRobot(R, t, mouth, talk, look) {
    const hop = talk ? Math.abs(Math.sin(t * 5.5)) * 0.015 * clamp(mouth * 1.5) : 0;
    R.body.position.y = 0.44 + Math.sin(t * 2.1) * 0.006 + hop;
    R.head.rotation.z = noise1(t * 0.8 + 1) * 0.05 + (talk ? noise1(t * 2.6) * 0.04 : 0);
    R.head.rotation.x = noise1(t * 0.6 + 5) * 0.03 + (talk ? mouth * 0.03 : 0);
    R.head.rotation.y = look + noise1(t * 0.45 + 2) * 0.05;
    R.mouth.scale.y = 1 + clamp(mouth) * 1.4; R.mouth.scale.x = 1 - clamp(mouth) * 0.15;
    const bl = blink(t, 1.3); for (const e of R.eyes) e.scale.y = bl;
    R.bulb.material.emissiveIntensity = 2.0 + Math.sin(t * 3) * 0.3;
  }
  function animBokeh(w, t) { for (const s of w.bokeh) { s.position.y = s.userData.y0 + Math.sin(t * s.userData.sp + s.userData.ph) * 0.15; } }

  // camera shots (positions are relative to the subject; every shot drifts a little like the reference)
  const hp = () => HAM.root.position, bp = () => BOT.root.position;
  function shotCam(kind, k, t) {
    const H = hp(), B = bp();
    let p, q, fov = 30;
    switch (kind) {
      case 'wide': p = [lerp(0.3, 0.1, k), 1.7, lerp(11.5, 10.6, k)]; q = [0.1, 1.15, 0]; break;
      case 'wide_end': p = [lerp(0.1, 0.2, k), lerp(1.6, 1.9, k), lerp(10.2, 12.0, ease(k))]; q = [0.1, 1.05, 0]; break;
      case 'robot_med': p = [B.x - 0.15 + k * 0.1, 0.95, B.z + lerp(3.7, 3.4, k)]; q = [B.x, 0.8, B.z]; break;
      case 'robot_med2': p = [B.x + lerp(0.6, 0.3, k), 0.55, B.z + lerp(3.4, 3.1, k)]; q = [B.x, 0.85, B.z]; break;
      case 'robot_push': { const e = easeOut(k); p = [B.x - 0.05, lerp(0.95, 0.88, e), B.z + lerp(3.3, 2.25, e)]; q = [B.x, lerp(0.8, 0.86, e), B.z]; break; }
      case 'robot_close': p = [B.x + 0.05, 0.95, B.z + lerp(3.0, 2.8, k)]; q = [B.x, 0.84, B.z]; break;
      case 'human_close': p = [H.x + 0.12, 1.95, H.z + lerp(3.45, 3.2, k)]; q = [H.x, 1.66, H.z]; break;
      case 'human_close34': p = [H.x + lerp(1.2, 1.0, k), 1.95, H.z + lerp(3.2, 3.0, k)]; q = [H.x + 0.05, 1.66, H.z]; break;
      case 'human_full': p = [H.x + 0.3, 1.3, H.z + lerp(5.0, 4.7, k)]; q = [H.x, 1.15, H.z]; break;
    }
    cam.fov = fov; cam.position.set(p[0] + noise1(t * 0.35) * 0.01, p[1] + noise1(t * 0.3 + 7) * 0.008, p[2]);
    cam.lookAt(q[0], q[1], q[2]); cam.updateProjectionMatrix();
  }
  // who looks where in each shot: close-ups face the lens, two-shots face each other
  function looks(kind) {
    if (kind === 'wide' || kind === 'wide_end') return {h: 0.55, b: -0.45};
    if (kind.startsWith('human')) return {h: kind === 'human_close34' ? 0.2 : 0.05, b: -0.5};
    return {h: 0.6, b: kind === 'robot_med2' ? 0.1 : -0.05};
  }

  function renderAt(t) {
    const shot = TL.shots.find(s => t >= s.s && t < s.e) || TL.shots[TL.shots.length - 1];
    const k = clamp((t - shot.s) / Math.max(0.01, shot.e - shot.s));
    const mH = mouthAt('H', t), mC = mouthAt('C', t), tH = speaking('H', t), tC = speaking('C', t);
    const lk = looks(shot.kind);
    const lh = lineAt('H', t); const gest = tH && lh ? clamp((t - lh.s) / 0.35) * clamp((lh.e + 0.3 - t) / 0.35) : 0;
    animHuman(HAM, t, mH, tH, lk.h, {gesture: shot.kind === 'human_full' ? gest * 0.7 : gest * 0.55});
    animRobot(BOT, t, mC, tC, lk.b);
    animBokeh(MAIN, t);
    renderer.setScissorTest(false); renderer.setViewport(0, 0, W, H); renderer.clear();
    const inMon = t >= TL.montage[0] && t < TL.montage[1];
    if (!inMon) { shotCam(shot.kind, k, t); renderer.render(MAIN.sc, cam); }
    else {
      renderer.setClearColor(0x000000, 1); renderer.clear();
      const mk = (t - TL.montage[0]);
      MON.forEach((m, i) => {
        const [x, y, w, h] = PANELS[i];
        const [p, q] = m.shot(mk); m.cam.aspect = w / h; m.cam.position.set(...p); m.cam.lookAt(...q); m.cam.updateProjectionMatrix();
        const talkA = (Math.floor(mk * 1.5 + i) % 2) === 0;
        m.chars.forEach((c, j) => {
          const mo = talkA === (j === 0) ? clamp(0.5 + noise1(mk * 9 + i * 3) * 0.6) : 0;
          if (c.mouth && c.P) animHuman(c, mk + i, mo, mo > 0, m.walk ? 0.6 : (i === 2 ? 0.0 : 0.05), {gesture: 0});
          else animRobot(c, mk + i, mo, mo > 0, m.walk ? -0.6 : 0);
          if (m.walk) { c.root.position.x += 0; const ph = (mk + j * 0.3) * 7; if (c.legL) { c.legL.rotation.x = Math.sin(ph) * 0.35; c.legR.rotation.x = -Math.sin(ph) * 0.35; } c.root.position.y = 0.04 + Math.abs(Math.sin(ph)) * 0.02; }
        });
        if (m.phone) { const c = m.chars[0]; c.head.rotation.x = 0.25; c.shR.rotation.x = -0.9; c.elR.rotation.x = -1.2; c.shL.rotation.x = -0.9; c.elL.rotation.x = -1.2; }
        animBokeh(m.w, mk);
        renderer.setViewport(x, H - y - h, w, h); renderer.setScissor(x, H - y - h, w, h); renderer.setScissorTest(true);
        renderer.render(m.w.sc, m.cam);
      });
      renderer.setScissorTest(false);
    }
    document.getElementById('montage').style.opacity = inMon ? 1 : 0;
    const mcs = document.querySelectorAll('#montage .mcap');
    mcs.forEach((el, i) => { const lines = el.dataset.lines.split('|'); const mk = Math.max(0, t - TL.montage[0]); el.textContent = lines[Math.min(lines.length - 1, Math.floor(mk / ((TL.montage[1] - TL.montage[0]) / lines.length)))]; });
    // fade to black at the very end (reference)
    document.getElementById('fade').style.opacity = clamp((t - (TL.end - 0.9)) / 0.8);
  }

  window.__pocketRender = renderAt;
  window.addEventListener('hf-seek', e => renderAt(e.detail.time));
  renderAt(0);
})();
