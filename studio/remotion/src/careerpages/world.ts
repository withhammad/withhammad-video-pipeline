// Low-poly 3D world for the career-pages reel (job d463f2086d47): the job seeker, the Claude mascot,
// the night desk and the morning room. Plain three.js (vendored, MIT) driven frame by frame by Remotion.
// @ts-ignore vendored ES module build, no types needed here
import * as THREE from './three.module.min.js';

type T = any;
const flat = (color: string, extra: Record<string, unknown> = {}) =>
  new THREE.MeshStandardMaterial({color, flatShading: true, roughness: 0.82, metalness: 0, ...extra});
const basic = (color: string, extra: Record<string, unknown> = {}) => new THREE.MeshBasicMaterial({color, ...extra});
const box = (w: number, h: number, d: number, m: T) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);

export type Mood = {
  mouth: number;          // 0 closed .. 1 wide open (speech envelope)
  smile: number;          // -1 frown .. 1 smile (closed mouth curve)
  brow: number;           // -1 worried/sad, 0 neutral, 1 angry/determined
  blink: number;          // 0 open .. 1 closed
  lookX: number; lookY: number;
  headTilt: number; headTurn: number; headNod: number;
  armUp: number;          // 0 typing pose .. 1 hand to face (facepalm)
  phone: number;          // 0 none .. 1 holding phone up
  typing: number;         // 0..1 typing bob
  breathe: number;        // seconds, for idle motion
};
export type BotMood = {
  eyes: 'open' | 'line' | 'happy' | 'wink' | 'sleep' | 'tall';
  hop: number; tilt: number; talk: number; squash: number; lookX: number;
};

// ---------- textures ----------
function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  draw(cv.getContext('2d')!);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function rng(seed: number) { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

export function cityTexture(blur: number, morning = false) {
  return canvasTex(1024, 1024, (c) => {
    const r = rng(7);
    const g = c.createLinearGradient(0, 0, 0, 1024);
    if (morning) { g.addColorStop(0, '#f6d9b8'); g.addColorStop(0.6, '#e9b38e'); g.addColorStop(1, '#c98a72'); }
    else { g.addColorStop(0, '#0b1430'); g.addColorStop(0.55, '#14214a'); g.addColorStop(1, '#1d2752'); }
    c.fillStyle = g; c.fillRect(0, 0, 1024, 1024);
    c.filter = `blur(${blur}px)`;
    // towers
    for (let i = 0; i < 16; i++) {
      const x = i * 66 + r() * 20 - 10, w = 52 + r() * 40, top = 120 + r() * 380;
      c.fillStyle = morning ? `rgba(150,105,95,${0.35 + r() * 0.2})` : `rgba(9,14,34,${0.75 + r() * 0.2})`;
      c.fillRect(x, top, w, 1024 - top);
      for (let y = top + 14; y < 1000; y += 22) for (let xx = x + 6; xx < x + w - 8; xx += 14) {
        if (r() < (morning ? 0.12 : 0.42)) {
          const warm = r() < 0.82;
          c.fillStyle = morning ? 'rgba(255,240,220,0.5)' : warm ? `rgba(255,${190 + r() * 40 | 0},${90 + r() * 50 | 0},${0.7 + r() * 0.3})` : 'rgba(120,170,255,0.9)';
          c.fillRect(xx, y, 8, 11);
        }
      }
    }
    c.filter = 'none';
  });
}
export function bokehTexture() {
  return canvasTex(1024, 1024, (c) => {
    const r = rng(42); c.clearRect(0, 0, 1024, 1024);
    for (let i = 0; i < 70; i++) {
      const x = r() * 1024, y = r() * 1024, rad = 10 + r() * 34; const warm = r() < 0.8;
      const g = c.createRadialGradient(x, y, 0, x, y, rad);
      const col = warm ? '255,205,120' : '255,120,90';
      g.addColorStop(0, `rgba(${col},${0.55 + r() * 0.35})`); g.addColorStop(0.7, `rgba(${col},${0.35})`); g.addColorStop(1, `rgba(${col},0)`);
      c.fillStyle = g; c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fill();
    }
  });
}
function noteTex(text: string, bg: string, rot = 0) {
  return canvasTex(256, 256, (c) => {
    c.fillStyle = bg; c.fillRect(0, 0, 256, 256);
    c.fillStyle = 'rgba(0,0,0,0.08)'; c.fillRect(0, 0, 256, 30);
    c.translate(128, 140); c.rotate(rot); c.fillStyle = '#2a2420';
    c.font = `800 ${text.length > 5 ? 52 : 70}px Inter, Arial`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(text, 0, 0);
    if (text === '200') { c.strokeStyle = '#c0392b'; c.lineWidth = 8; c.beginPath(); c.arc(0, 0, 80, 0, Math.PI * 2); c.stroke(); }
  });
}
function monitorTex(title: string) {
  return canvasTex(512, 640, (c) => {
    c.fillStyle = '#f4f2ee'; c.fillRect(0, 0, 512, 640);
    c.fillStyle = '#1f1d1a'; c.font = '700 34px Inter, Arial'; c.fillText(title, 28, 60);
    const cols = ['#d1453b', '#3f7fd8', '#4f8a3a', '#d6a12b', '#8b5cf6'];
    for (let i = 0; i < 5; i++) {
      const y = 100 + i * 104; c.fillStyle = cols[i]; c.fillRect(28, y, 54, 54);
      c.fillStyle = '#3b3833'; c.fillRect(100, y + 6, 330, 14); c.fillStyle = '#9b968e'; c.fillRect(100, y + 32, 230, 11);
    }
  });
}

// ---------- characters ----------
export function makeBoy() {
  const root = new THREE.Group();
  const skin = flat('#efa07c'); const hairM = flat('#1c1a20'); const black = basic('#111014');
  const hoodL = flat('#b8c7bd'); const hoodR = flat('#5b83d9'); const accent = flat('#e2683a');

  // body (hoodie), split two-tone like the reference
  const body = new THREE.Group(); root.add(body);
  const torsoGeoL = new THREE.CylinderGeometry(0.95, 1.25, 2.1, 7, 1, false, 0, Math.PI);
  const torsoGeoR = new THREE.CylinderGeometry(0.95, 1.25, 2.1, 7, 1, false, Math.PI, Math.PI);
  const tl = new THREE.Mesh(torsoGeoL, hoodR); const tr = new THREE.Mesh(torsoGeoR, hoodL);
  tl.position.y = tr.position.y = -1.75; body.add(tl, tr);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.22, 6, 10), flat('#7d97c9'));
  collar.rotation.x = Math.PI / 2; collar.position.y = -0.72; body.add(collar);
  const neckHole = new THREE.Mesh(new THREE.CircleGeometry(0.42, 8), flat('#2a2225'));
  neckHole.rotation.x = -Math.PI / 2; neckHole.position.set(0, -0.66, 0.08); body.add(neckHole);
  for (const x of [-0.32, 0.3]) { const s = box(0.07, 0.75, 0.07, accent); s.position.set(x, -1.3, 1.02); s.rotation.x = -0.18; body.add(s); const tip = box(0.08, 0.12, 0.08, flat('#f2efe6')); tip.position.set(x, -1.7, 1.08); body.add(tip); }
  // arms
  const mkArm = (side: number) => {
    const sh = new THREE.Group(); sh.position.set(side * 1.08, -1.05, 0.05);
    const up = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.24, 1.2, 6), side < 0 ? hoodR : hoodL); up.position.y = -0.55; sh.add(up);
    const el = new THREE.Group(); el.position.y = -1.1; sh.add(el);
    const fo = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 1.1, 6), side < 0 ? hoodR : hoodL); fo.position.y = -0.5; el.add(fo);
    const hand = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), skin); hand.position.y = -1.08; el.add(hand);
    body.add(sh); return {sh, el, hand};
  };
  const armL = mkArm(-1), armR = mkArm(1);
  const palm = new THREE.Group(); body.add(palm);
  const palmArm = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 3.2, 6), hoodL); palmArm.position.y = -1.6; palm.add(palmArm);
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.18, 6), hoodR); cuff.position.y = -0.12; palm.add(cuff);
  const palmHand = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 0), skin); palmHand.scale.set(1, 1.2, 0.7); palmHand.position.y = 0.12; palm.add(palmHand);
  palm.visible = false;
  const phone = new THREE.Group();
  const ph = box(0.38, 0.7, 0.05, flat('#18171c')); phone.add(ph);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.6), basic('#cfe3ff')); scr.position.z = 0.03; phone.add(scr);
  phone.visible = false; armR.hand.add(phone); phone.position.set(0, -0.2, 0.15);

  // head
  const head = new THREE.Group(); head.position.y = 0.42; root.add(head);
  const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), skin); skull.scale.set(1.05, 1.0, 0.95); head.add(skull);
  // hair: cap + tufts
  const cap = new THREE.Mesh(new THREE.SphereGeometry(1.08, 9, 6, 0, Math.PI * 2, 0, Math.PI * 0.42), hairM);
  cap.position.y = 0.05; cap.rotation.x = -0.32; head.add(cap);
  const back = new THREE.Mesh(new THREE.SphereGeometry(1.07, 9, 6, Math.PI * 0.7, Math.PI * 1.6, 0, Math.PI * 0.62), hairM); back.position.y = 0.0; head.add(back);
  const r = rng(3);
  for (let i = 0; i < 9; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.18 + r() * 0.1, 0.42, 4), hairM); const a = -0.9 + i * 0.22; t.position.set(Math.sin(a) * 0.82, 0.78 + r() * 0.08, Math.cos(a) * 0.5); t.rotation.set(0.9 + r() * 0.3, a, (r() - 0.5) * 0.6); head.add(t); }
  for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), skin); ear.position.set(s * 1.04, -0.05, 0); ear.scale.set(0.6, 1, 0.8); head.add(ear); }
  // face features
  const face = new THREE.Group(); face.position.z = 0.88; head.add(face);
  const nose = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 1), flat('#e48a68')); nose.position.set(0, -0.12, 0.08); face.add(nose);
  const cheekM = basic('#ef7f86', {transparent: true, opacity: 0.55});
  for (const s of [-1, 1]) { const ck = new THREE.Mesh(new THREE.CircleGeometry(0.12, 12), cheekM); ck.scale.set(1.4, 0.8, 1); ck.position.set(s * 0.56, -0.26, -0.06); ck.rotation.y = s * 0.45; face.add(ck); }
  const eyes: T[] = [], lids: T[] = [], pupils: T[] = [], brows: T[] = [];
  for (const s of [-1, 1]) {
    const eg = new THREE.Group(); eg.position.set(s * 0.36, 0.08, 0.02); eg.rotation.y = s * 0.2; face.add(eg);
    const white = new THREE.Mesh(new THREE.CircleGeometry(0.13, 16), basic('#f3e6dc')); white.scale.set(1, 1.15, 1); eg.add(white);
    const pg = new THREE.Group(); pg.position.z = 0.005; eg.add(pg);
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), black); pupil.scale.set(0.82, 1.12, 1); pg.add(pupil);
    const hl = new THREE.Mesh(new THREE.CircleGeometry(0.03, 8), basic('#ffffff')); hl.position.set(0.035, 0.05, 0.004); pg.add(hl);
    const lid = new THREE.Mesh(new THREE.CircleGeometry(0.17, 16, 0, Math.PI), flat('#e9967a', {side: THREE.DoubleSide})); lid.position.z = 0.012; eg.add(lid);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.032, 6, 20), basic('#0e0d11')); rim.position.z = 0.09; eg.add(rim);
    const glint = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.02), basic('#ffffff', {transparent: true, opacity: 0.85})); glint.position.set(-0.11, 0.14, 0.1); glint.rotation.z = 0.6; eg.add(glint);
    const brow = box(0.34, 0.07, 0.05, hairM); brow.position.set(s * 0.37, 0.43, 0.03); face.add(brow);
    eyes.push(eg); lids.push(lid); pupils.push(pg); brows.push(brow);
  }
  const bridge = box(0.18, 0.03, 0.03, flat('#121116')); bridge.position.set(0, 0.12, 0.13); face.add(bridge);
  // mouth: open ellipse + closed curve
  const mouthOpen = new THREE.Group(); mouthOpen.position.set(0, -0.45, 0.02); face.add(mouthOpen);
  const mo = new THREE.Mesh(new THREE.CircleGeometry(0.11, 16), basic('#5a1a22')); mouthOpen.add(mo);
  const tongue = new THREE.Mesh(new THREE.CircleGeometry(0.06, 12), basic('#e5636d')); tongue.position.set(0, -0.05, 0.002); mouthOpen.add(tongue);
  const tooth = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.035), basic('#ffffff')); tooth.position.set(-0.02, 0.075, 0.003); mouthOpen.add(tooth);
  const mouthLine = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.014, 4, 12, Math.PI), basic('#3a1416')); mouthLine.position.set(0, -0.42, 0.02); face.add(mouthLine);

  const api = {
    root, head, body,
    set(m: Mood) {
      const b = Math.sin(m.breathe * 2.1) * 0.02;
      body.position.y = b; head.position.y = 0.42 + b * 1.4;
      head.rotation.set(m.headNod + Math.sin(m.breathe * 1.3) * 0.015, m.headTurn + Math.sin(m.breathe * 0.7) * 0.02, m.headTilt);
      const open = Math.max(0, Math.min(1, m.mouth));
      mouthOpen.visible = open > 0.06; mouthLine.visible = !mouthOpen.visible;
      mouthOpen.scale.set(0.75 + open * 0.35, 0.25 + open * 1.0, 1);
      mouthLine.rotation.z = m.smile >= 0 ? Math.PI : 0;
      mouthLine.position.y = m.smile >= 0 ? -0.36 : -0.47;
      mouthLine.scale.set(0.7 + Math.abs(m.smile) * 0.6, 0.35 + Math.abs(m.smile) * 0.6, 1);
      brows.forEach((br, i) => { const s = i === 0 ? -1 : 1; br.rotation.z = s * m.brow * 0.32; br.position.y = 0.43 - Math.abs(m.brow) * 0.03 + (m.brow < 0 ? 0.04 : 0); });
      lids.forEach((l, i) => { const k = Math.max(0.0, Math.min(1, m.blink)); l.scale.set(1, 0.02 + k * 1.15, 1); l.position.y = 0.17 - k * 0.17; l.rotation.z = Math.PI * 0; void i; });
      pupils.forEach((p) => p.position.set(m.lookX * 0.04, m.lookY * 0.04, 0.005));
      // arms
      const typ = Math.sin(m.breathe * 14) * 0.06 * m.typing;
      armL.sh.rotation.set(-0.7 + typ, 0, 0.1); armL.el.rotation.set(-0.6, 0, 0);
      armR.sh.rotation.set(-0.7 - typ, 0, -0.1); armR.el.rotation.set(-0.6, 0, 0);
      palm.visible = m.armUp > 0.01; armR.sh.visible = !palm.visible;
      if (palm.visible) {
        const k = m.armUp; const tip = new THREE.Vector3(0.12, 0.42 + 0.03 * Math.sin(m.breathe * 9), 1.25);
        const from = new THREE.Vector3(1.6, -3.4, 1.9);
        const end = from.clone().lerp(tip, 0.25 + 0.75 * k);
        palm.position.copy(end);
        palm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tip.clone().sub(from).normalize());
      }
      phone.visible = m.phone > 0.01;
      if (m.phone > 0) { const k = m.phone; armR.sh.rotation.set(-0.95 - k * 0.5, -k * 0.35, -0.12 + k * 0.3); armR.el.rotation.set(-0.8 - k * 1.05, 0, 0); phone.scale.setScalar(k); }
    },
  };
  return api;
}

export function makeBot() {
  const root = new THREE.Group();
  const orange = flat('#d97757', {roughness: 0.7}); const dark = basic('#16110f');
  const bodyG = new THREE.Group(); root.add(bodyG);
  const body = box(1.5, 1.1, 1.0, orange); body.position.y = 0.95; bodyG.add(body);
  for (const s of [-1, 1]) { const arm = box(0.32, 0.26, 0.42, orange); arm.position.set(s * 0.9, 1.0, 0); bodyG.add(arm); }
  const legs: T[] = [];
  for (const x of [-0.55, -0.2, 0.2, 0.55]) { const l = box(0.2, 0.42, 0.24, orange); l.position.set(x, 0.21, 0); root.add(l); legs.push(l); }
  // eye sets
  const face = new THREE.Group(); face.position.set(0, 1.0, 0.505); bodyG.add(face);
  const sets: Record<string, T> = {};
  const mk = (name: string, build: (g: T, s: number) => void) => { const g = new THREE.Group(); for (const s of [-1, 1]) { const e = new THREE.Group(); e.position.x = s * 0.32; build(e, s); g.add(e); } face.add(g); sets[name] = g; };
  const slab = (w: number, h: number) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), dark);
  mk('open', (e) => { const p = slab(0.15, 0.3); e.add(p); const hl = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.08), basic('#ffffff')); hl.position.set(0.02, 0.07, 0.002); e.add(hl); });
  mk('tall', (e) => { const p = slab(0.17, 0.4); e.add(p); });
  mk('line', (e) => { const p = slab(0.24, 0.05); e.add(p); });
  mk('happy', (e) => { for (const d of [-1, 1]) { const p = slab(0.17, 0.05); p.position.set(d * 0.06, 0.0, 0); p.rotation.z = -d * 0.75; e.add(p); } });
  mk('sleep', (e) => { for (const d of [-1, 1]) { const p = slab(0.15, 0.045); p.position.set(d * 0.055, 0.0, 0); p.rotation.z = d * 0.45; e.add(p); } });
  mk('wink', (e, s) => { if (s < 0) { const p = slab(0.15, 0.32); e.add(p); } else { for (const d of [-1, 1]) { const p = slab(0.17, 0.05); p.position.set(d * 0.06, 0, 0); p.rotation.z = -d * 0.75; e.add(p); } } });
  return {
    root,
    set(m: BotMood, t: number) {
      Object.entries(sets).forEach(([k, g]) => { (g as T).visible = k === m.eyes; });
      const hop = Math.max(0, m.hop);
      bodyG.position.y = hop * 0.35 + Math.sin(t * 2.2) * 0.015 + m.talk * 0.04;
      bodyG.scale.set(1 + m.squash * 0.08, 1 - m.squash * 0.1 + m.talk * 0.03, 1 + m.squash * 0.08);
      bodyG.rotation.z = m.tilt; face.position.x = m.lookX * 0.12;
      legs.forEach((l, i) => { l.position.y = 0.21 + (hop > 0.05 ? Math.sin(t * 18 + i) * 0.03 : 0); });
    },
  };
}

// ---------- sets ----------
export function makeDesk() {
  const g = new THREE.Group();
  const top = box(9, 0.28, 4.2, flat('#7f4636', {roughness: 0.55})); top.position.set(0, -0.14, 0); g.add(top);
  const front = box(9, 2.2, 0.2, flat('#6d3428')); front.position.set(0, -1.3, 2.0); g.add(front);
  const kb = box(2.6, 0.12, 0.8, flat('#2a2830')); kb.position.set(0.1, 0.06, -0.55); g.add(kb);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 12; j++) { const k = box(0.16, 0.05, 0.14, flat('#3b3944')); k.position.set(-1.05 + j * 0.2, 0.14, -0.82 + i * 0.18); g.add(k); }
  const cards: [number, number, string][] = [[-1.2, 1.35, '#f3c27a'], [0.2, 1.45, '#f6b38c'], [1.5, 1.3, '#f3c27a']];
  for (const [x, z, c] of cards) { const p = box(0.62, 0.02, 0.36, flat(c)); p.position.set(x, 0.01, z); p.rotation.y = (x * 0.13); g.add(p); }
  const phone = box(0.55, 0.05, 0.85, flat('#18171c')); phone.position.set(2.6, 0.03, 1.1); phone.rotation.y = -0.3; g.add(phone);
  // lamp
  const lamp = new THREE.Group(); lamp.position.set(-5.0, 0, -2.6); g.add(lamp);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.12, 8), flat('#b13d2a')); lamp.add(base);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 6), flat('#b13d2a')); pole.position.set(0.25, 0.9, 0); pole.rotation.z = -0.28; lamp.add(pole);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.7, 8, 1, true), flat('#e0533a', {side: THREE.DoubleSide})); shade.position.set(0.75, 1.75, 0.2); shade.rotation.z = -1.0; lamp.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), basic('#ffe1a8')); bulb.position.set(0.95, 1.6, 0.2); lamp.add(bulb);
  // books
  for (let i = 0; i < 3; i++) { const b = box(1.1, 0.18, 0.8, flat(['#3d5a9e', '#d9a441', '#7b3b2a'][i])); b.position.set(-3.4, 0.09 + i * 0.18, -1.7); b.rotation.y = i * 0.12; g.add(b); }
  // monitor
  const mon = new THREE.Group(); mon.position.set(3.3, 0, -1.2); mon.rotation.y = -0.45; g.add(mon);
  const stand = box(0.15, 1.0, 0.15, flat('#222128')); stand.position.y = 0.5; mon.add(stand);
  const frame = box(2.1, 2.5, 0.12, flat('#222128')); frame.position.y = 2.0; mon.add(frame);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 2.35), new THREE.MeshBasicMaterial({map: monitorTex('Jobs for you')})); screen.position.set(0, 2.0, 0.065); mon.add(screen);
  return g;
}

export function makeRoom(morning: boolean) {
  const g = new THREE.Group();
  const win = new THREE.Mesh(new THREE.PlaneGeometry(26, 20), new THREE.MeshBasicMaterial({map: cityTexture(morning ? 6 : 3, morning)}));
  win.position.set(0, 3.5, -9); g.add(win);
  const bok = new THREE.Mesh(new THREE.PlaneGeometry(26, 20), new THREE.MeshBasicMaterial({map: bokehTexture(), transparent: true, opacity: morning ? 0.25 : 0.9, depthWrite: false}));
  bok.position.set(0, 3.5, -8.6); g.add(bok);
  // window frame mullions
  const fm = flat(morning ? '#3b2c2a' : '#0d0f1c');
  for (const x of [-6.5, 0.4, 7]) { const v = box(0.22, 20, 0.2, fm); v.position.set(x, 3.5, -8.4); g.add(v); }
  const h = box(26, 0.22, 0.2, fm); h.position.set(0, 3.2, -8.4); g.add(h);
  // sticky notes on the glass
  if (!morning) {
    const notes: [string, string, number, number, number][] = [['REJECTED', '#f2d04a', -3.6, 3.6, -0.2], ['NOPE', '#f2d04a', 3.7, 3.4, 0.15], ['NO REPLY', '#f08a5a', -2.9, 2.2, 0.12], ['200', '#f2d04a', 3.2, 5.0, -0.1], ['✕', '#f08a5a', 1.6, 4.6, 0.2]];
    for (const [t, c, x, y, rr] of notes) { const n = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshStandardMaterial({map: noteTex(t, c), roughness: 0.9})); n.position.set(x, y, -8.2); n.rotation.z = rr; g.add(n); }
    // string lights
    for (let i = 0; i < 14; i++) { const x = -7 + i; const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 4), basic('#ffd27a')); b.position.set(x, 6.4 - Math.sin((i / 13) * Math.PI) * 0.7, -8.0); g.add(b); }
  } else {
    for (let i = 0; i < 14; i++) { const x = -7 + i; const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 4), basic('#fff1cf')); b.position.set(x, 6.4 - Math.sin((i / 13) * Math.PI) * 0.7, -8.0); g.add(b); }
  }
  return g;
}

export {THREE};
