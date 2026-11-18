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
  // Owner likeness (headshot v3): warm brown skin, thick dark swept-back wavy hair, short dark beard + moustache, no glasses, dark outfit.
  const skin = flat('#b88a72'); const hairM = new THREE.MeshLambertMaterial({color: '#140f0e', flatShading: true}); const hairWave = flat('#1d1513', {roughness: 0.45}); const browM = basic('#120d0b'); const black = basic('#111014');
  const hoodL = flat('#2b2e38'); const hoodR = flat('#1c1e26'); const accent = flat('#3a3e4c');

  // body (hoodie), split two-tone like the reference
  const body = new THREE.Group(); root.add(body);
  const torsoGeoL = new THREE.CylinderGeometry(0.95, 1.25, 2.1, 7, 1, false, 0, Math.PI);
  const torsoGeoR = new THREE.CylinderGeometry(0.95, 1.25, 2.1, 7, 1, false, Math.PI, Math.PI);
  const tl = new THREE.Mesh(torsoGeoL, hoodR); const tr = new THREE.Mesh(torsoGeoR, hoodL);
  tl.position.y = tr.position.y = -1.75; body.add(tl, tr);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.26, 6, 10), flat('#101116'));
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

  // head v2.1, owner-approved likeness 17 Nov (qa/likeness.jpg in job 0215fbca0f39; standard for his 3D dialogue reels): oval face + defined jaw, groomed short beard on the jaw line,
  // thick hair swept up and back, strong brows, proportioned nose, almond dark eyes, slight toothy smile.
  const head = new THREE.Group(); head.position.y = 0.42; head.scale.setScalar(0.9); root.add(head);
  const sk = new THREE.IcosahedronGeometry(1, 3); const P = sk.attributes.position;
  for (let i = 0; i < P.count; i++) {
    let x = P.getX(i), y = P.getY(i), z = P.getZ(i);
    x *= 0.84; y *= 1.14; z *= 0.9;
    if (y < 0) { const k = Math.min(1, -y / 1.14); x *= 1 - 0.34 * k * k; if (z > 0) z *= 1 - 0.08 * k; }
    if (y > 0.2 && z > 0.3) z *= 0.97; // flatter forehead
    P.setXYZ(i, x, y, z);
  }
  sk.computeVertexNormals();
  // neutral key on the face so the warm night lights don't turn his skin orange (narrow cone: the face only)
  const faceKey = new THREE.SpotLight('#f4f2ff', 9, 7, 0.3, 0.6, 1.2); faceKey.position.set(0.6, 0.6, 4.2); faceKey.target.position.set(0, 0, 0.5);
  head.add(faceKey, faceKey.target);
  const skull = new THREE.Mesh(sk, skin); head.add(skull);
  // shell of the skull triangles that pass pred, pushed outward
  const shell = (pred: (x: number, y: number, z: number) => boolean, out: number) => {
    const src = sk.attributes.position; const v: number[] = [];
    for (let i = 0; i < src.count; i += 3) {
      const cx = (src.getX(i) + src.getX(i + 1) + src.getX(i + 2)) / 3, cy = (src.getY(i) + src.getY(i + 1) + src.getY(i + 2)) / 3, cz = (src.getZ(i) + src.getZ(i + 1) + src.getZ(i + 2)) / 3;
      if (!pred(cx, cy, cz)) continue;
      for (let k = 0; k < 3; k++) v.push(src.getX(i + k) * out, src.getY(i + k) * out, src.getZ(i + k) * out);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals(); return g;
  };
  // hair: cap with a real hairline, then volume swept up and back
  head.add(new THREE.Mesh(shell((x, y, z) => y > (z > 0.35 ? 0.62 : z > -0.2 ? 0.34 : -0.42), 1.05), hairM));
  const tuft = (sx: number, sy: number, sz: number, px: number, py: number, pz: number, rx: number, ry = 0, rz = 0) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), hairM); m.scale.set(sx, sy, sz); m.position.set(px, py, pz); m.rotation.set(rx, ry, rz); head.add(m);
  };
  {
    // v2.1 hair (his photo): thick, swept UP at the front and BACK over the top in soft waves, slight side sweep;
    // broad swept lobes with a slight sheen so the waves catch light instead of one dark mass
    tuft(1.62, 0.5, 1.75, 0.04, 0.96, 0.02, -0.32, 0, -0.1);   // body of the hair
    const lobe = (sx: number, sy: number, sz: number, px: number, py: number, pz: number, rx: number, ry: number, rz: number) => {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), hairWave); m.scale.set(sx, sy, sz); m.position.set(px, py, pz); m.rotation.set(rx, ry, rz); head.add(m);
    };
    lobe(1.0, 0.42, 1.55, -0.28, 1.07, 0.06, -0.42, 0.12, 0.2);   // high swept wave on one side (his photo: left of frame)
    lobe(0.95, 0.36, 1.45, 0.3, 1.0, 0.02, -0.36, -0.12, -0.24); // second wave, lower, falling to the other side
    lobe(1.15, 0.3, 0.75, 0.02, 0.93, 0.5, -0.72, 0, -0.06);     // front quiff rolling up and back
    tuft(1.5, 0.4, 1.3, 0, 0.78, -0.5, 0.25);                  // back of the top
    tuft(1.42, 0.36, 0.7, 0, 0.7, 0.66, -0.95);                // front fringe swept up, smooth hairline
    tuft(0.55, 0.3, 1.0, -0.62, 0.62, 0.0, -0.2, 0.2, 0.3); tuft(0.55, 0.3, 1.0, 0.62, 0.62, 0.0, -0.2, -0.2, -0.3); // short sides, swept back
  }
  for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 0), skin); ear.position.set(s * 0.84, 0.02, -0.02); ear.scale.set(0.5, 1.05, 0.8); head.add(ear); }
  // groomed short beard: jaw line, chin and sideburns only, cheeks stay clear
  const beardM = flat('#2a201c', {roughness: 1});
  const beardShell = new THREE.Mesh(shell((x, y, z) => (y < -0.5 && z > -0.3) || (y < 0.12 && y >= -0.5 && Math.abs(x) > 0.6 - (y < -0.2 ? 0.12 : 0) && z > -0.3 && z < 0.5), 1.02), beardM); head.add(beardShell);
  // face features
  const face = new THREE.Group(); face.position.z = 0.82; head.add(face);
  const noseM = flat('#a9806e');
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.34, 4), noseM); nose.rotation.set(0.38, Math.PI / 4, 0); nose.position.set(0, -0.08, 0.09); face.add(nose);
  const nb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 1), noseM); nb.scale.set(1.5, 0.7, 0.9); nb.position.set(0, -0.25, 0.1); face.add(nb);
  const eyes: T[] = [], lids: T[] = [], pupils: T[] = [], brows: T[] = [];
  for (const s of [-1, 1]) {
    const eg = new THREE.Group(); eg.position.set(s * 0.3, 0.1, 0.0); eg.rotation.y = s * 0.28; face.add(eg);
    const white = new THREE.Mesh(new THREE.CircleGeometry(0.1, 18), basic('#efe4da')); white.scale.set(1.45, 0.82, 1); eg.add(white);
    const pg = new THREE.Group(); pg.position.z = 0.004; eg.add(pg);
    const iris = new THREE.Mesh(new THREE.CircleGeometry(0.065, 16), basic('#3a2418')); pg.add(iris);
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.035, 12), black); pupil.position.z = 0.001; pg.add(pupil);
    const hl = new THREE.Mesh(new THREE.CircleGeometry(0.016, 8), basic('#ffffff')); hl.position.set(0.022, 0.025, 0.002); pg.add(hl);
    const lash = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.016, 3, 14, Math.PI), black); lash.scale.set(1, 0.58, 1); lash.position.set(0, 0.0, 0.008); eg.add(lash);
    const lid = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16, 0, Math.PI), flat('#a98270', {side: THREE.DoubleSide})); lid.position.z = 0.012; eg.add(lid);
    const brow = box(0.34, 0.095, 0.05, browM); brow.position.set(s * 0.3, 0.27, 0.02); brow.rotation.set(0, s * 0.28, -s * 0.05); face.add(brow);
    eyes.push(eg); lids.push(lid); pupils.push(pg); brows.push(brow);
  }
  const stache = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.3, 4, 8), beardM); stache.rotation.z = Math.PI / 2; stache.position.set(0, -0.36, 0.06); face.add(stache);
  // mouth: open ellipse + closed smile (teeth showing)
  const mouthOpen = new THREE.Group(); mouthOpen.position.set(0, -0.5, 0.06); face.add(mouthOpen);
  const mo = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), basic('#4a161c')); mouthOpen.add(mo);
  const tongue = new THREE.Mesh(new THREE.CircleGeometry(0.055, 12), basic('#d9606a')); tongue.position.set(0, -0.045, 0.002); mouthOpen.add(tongue);
  const tooth = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.03), basic('#f6f1ea')); tooth.position.set(0, 0.07, 0.003); mouthOpen.add(tooth);
  const mouthLine = new THREE.Group(); face.add(mouthLine);
  const lip = new THREE.Mesh(new THREE.CircleGeometry(0.2, 18, 0, Math.PI), basic('#6a3430')); mouthLine.add(lip);
  const teeth = new THREE.Mesh(new THREE.CircleGeometry(0.18, 18, 0, Math.PI), basic('#f6f1ea')); teeth.position.z = 0.002; teeth.scale.set(0.92, 0.5, 1); teeth.position.y = -0.01; mouthLine.add(teeth);
  mouthLine.position.set(0, -0.46, 0.06);

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
      mouthLine.position.y = m.smile >= 0 ? -0.45 : -0.53;
      mouthLine.scale.set(0.95 + Math.abs(m.smile) * 0.3, 0.3 + Math.abs(m.smile) * 0.5, 1);
      brows.forEach((br, i) => { const s = i === 0 ? -1 : 1; br.rotation.z = s * m.brow * 0.32; br.position.y = 0.27 - Math.abs(m.brow) * 0.025 + (m.brow < 0 ? 0.03 : 0); });
      lids.forEach((l, i) => { const k = Math.max(0.0, Math.min(1, m.blink)); l.scale.set(1, 0.02 + k * 0.55, 1); l.position.y = 0.08 - k * 0.08; l.rotation.z = Math.PI * 0; void i; });
      pupils.forEach((p) => p.position.set(m.lookX * 0.035, m.lookY * 0.015, 0.004));
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
    const notes: [string, string, number, number, number][] = [['JUST MARRIED', '#f6e7c8', -3.6, 3.6, -0.2], ['161,015', '#f2d04a', 3.7, 3.4, 0.15], ['❤ 1,795', '#f08a5a', 3.2, 5.0, -0.1]];
    for (const [t, c, x, y, rr] of notes) { const n = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshStandardMaterial({map: noteTex(t, c), roughness: 0.9})); n.position.set(x, y, -8.2); n.rotation.z = rr; g.add(n); }
    // string lights
    for (let i = 0; i < 14; i++) { const x = -7 + i; const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 4), basic('#ffd27a')); b.position.set(x, 6.4 - Math.sin((i / 13) * Math.PI) * 0.7, -8.0); g.add(b); }
  } else {
    for (let i = 0; i < 14; i++) { const x = -7 + i; const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 4), basic('#fff1cf')); b.position.set(x, 6.4 - Math.sin((i / 13) * Math.PI) * 0.7, -8.0); g.add(b); }
  }
  return g;
}

export {THREE};
