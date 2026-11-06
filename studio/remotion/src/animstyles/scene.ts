// One scene, ten looks (job 6a48be151b7a). The reference (@tonistelk) shows the same shot in every style: an office
// worker walking left to right through an office, carrying something. This file is the shared geometry: a walking rig
// and the office, as SVG path strings in a 540x960 card space, so every style (and the ASCII canvas, via Path2D)
// draws exactly the same motion.

export const CW = 540, CH = 960, FLOOR = 790;
export type Part = 'skin' | 'hair' | 'shirt' | 'pants' | 'shoe' | 'box' | 'tie';
export type Env = 'floor' | 'window' | 'pane' | 'board' | 'bar' | 'desk' | 'monitor' | 'screen' | 'pot' | 'leaf' | 'clock' | 'hand';
export type Prim = {d: string; part: Part; depth: 0 | 1 | 2}; // depth 0 = back limbs, 1 = body, 2 = front limbs/box
export type EnvPrim = {d: string; part: Env};

const f = (n: number) => n.toFixed(1);
export const rectP = (x: number, y: number, w: number, h: number, r = 0) => r <= 0
  ? `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`
  : `M${f(x + r)} ${f(y)}h${f(w - 2 * r)}a${r} ${r} 0 0 1 ${r} ${r}v${f(h - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${r}h${f(-(w - 2 * r))}a${r} ${r} 0 0 1 ${-r} ${-r}v${f(-(h - 2 * r))}a${r} ${r} 0 0 1 ${r} ${-r}Z`;
export const circP = (cx: number, cy: number, r: number) => `M${f(cx - r)} ${f(cy)}a${r} ${r} 0 1 0 ${f(2 * r)} 0a${r} ${r} 0 1 0 ${f(-2 * r)} 0Z`;
export const ellP = (cx: number, cy: number, rx: number, ry: number) => `M${f(cx - rx)} ${f(cy)}a${rx} ${ry} 0 1 0 ${f(2 * rx)} 0a${rx} ${ry} 0 1 0 ${f(-2 * rx)} 0Z`;
export const polyP = (pts: number[][]) => 'M' + pts.map(p => `${f(p[0])} ${f(p[1])}`).join('L') + 'Z';
// A limb as a closed capsule outline (so outline styles and canvas fills both work)
export const capP = (x1: number, y1: number, x2: number, y2: number, r: number) => {
  const a = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(a) * r, ny = Math.cos(a) * r;
  return `M${f(x1 + nx)} ${f(y1 + ny)}L${f(x2 + nx)} ${f(y2 + ny)}A${r} ${r} 0 0 0 ${f(x2 - nx)} ${f(y2 - ny)}L${f(x1 - nx)} ${f(y1 - ny)}A${r} ${r} 0 0 0 ${f(x1 + nx)} ${f(y1 + ny)}Z`;
};

const rad = (d: number) => (d * Math.PI) / 180;

/** The walking rig at time t (s). x0..x1 = hip travel across the card during `span` seconds. s = scale. */
export function rig(t: number, opts: {x0?: number; x1?: number; span?: number; s?: number; cy?: number} = {}): Prim[] {
  const {x0 = 150, x1 = 300, span = 1.6, s = 1, cy = 0} = opts;
  const ph = 2 * Math.PI * 1.55 * t;
  const x = x0 + (x1 - x0) * Math.min(1, t / span);
  const L1 = 118 * s, L2 = 116 * s;
  const hip = [x, FLOOR - (L1 + L2 - 4 * s) - 8 * s * Math.abs(Math.sin(ph)) + cy];
  const neck = [hip[0] + 10 * s, hip[1] - 172 * s];
  const head = [neck[0] + 6 * s, neck[1] - 50 * s];
  const out: Prim[] = [];
  const leg = (i: number, depth: 0 | 2) => {
    const p = ph + i * Math.PI, th = rad(27 * Math.sin(p)), bend = rad(8 + 42 * Math.max(0, Math.cos(p)));
    const knee = [hip[0] + L1 * Math.sin(th), hip[1] + L1 * Math.cos(th)];
    const foot = [knee[0] + L2 * Math.sin(th - bend), knee[1] + L2 * Math.cos(th - bend)];
    out.push({d: capP(hip[0], hip[1], knee[0], knee[1], 17 * s), part: 'pants', depth});
    out.push({d: capP(knee[0], knee[1], foot[0], foot[1], 15 * s), part: 'pants', depth});
    out.push({d: rectP(foot[0] - 14 * s, foot[1] - 6 * s, 44 * s, 18 * s, 8 * s), part: 'shoe', depth});
  };
  const bob = 4 * s * Math.sin(ph * 2);
  const box = [neck[0] + 84 * s, neck[1] + 92 * s + bob];
  const arm = (dx: number, depth: 0 | 2) => {
    const sh = [neck[0] + dx, neck[1] + 20 * s];
    const el = [sh[0] + 30 * s, sh[1] + 76 * s];
    const hd = [box[0] - 30 * s + dx * 0.4, box[1] + 6 * s];
    out.push({d: capP(sh[0], sh[1], el[0], el[1], 12 * s), part: 'shirt', depth});
    out.push({d: capP(el[0], el[1], hd[0], hd[1], 11 * s), part: 'shirt', depth});
    out.push({d: circP(hd[0] + 4 * s, hd[1], 10 * s), part: 'skin', depth});
  };
  leg(1, 0);
  arm(-8 * s, 0);
  // torso + tie + neck + head + hair
  out.push({d: polyP([[hip[0] - 30 * s, hip[1] + 8 * s], [neck[0] - 34 * s, neck[1] + 10 * s], [neck[0] - 20 * s, neck[1] - 4 * s],
    [neck[0] + 22 * s, neck[1] - 4 * s], [neck[0] + 34 * s, neck[1] + 12 * s], [hip[0] + 32 * s, hip[1] + 8 * s]]), part: 'shirt', depth: 1});
  out.push({d: rectP(hip[0] - 31 * s, hip[1] - 6 * s, 64 * s, 22 * s, 6 * s), part: 'pants', depth: 1});
  out.push({d: polyP([[neck[0] + 2 * s, neck[1] + 2 * s], [neck[0] + 10 * s, neck[1] + 2 * s], [neck[0] + 12 * s, neck[1] + 70 * s], [neck[0] + 6 * s, neck[1] + 80 * s], [neck[0], neck[1] + 70 * s]]), part: 'tie', depth: 1});
  out.push({d: rectP(neck[0] - 8 * s, neck[1] - 22 * s, 18 * s, 26 * s, 4 * s), part: 'skin', depth: 1});
  out.push({d: circP(head[0], head[1], 36 * s), part: 'skin', depth: 1});
  out.push({d: `M${f(head[0] - 37 * s)} ${f(head[1] - 2 * s)}A${37 * s} ${37 * s} 0 0 1 ${f(head[0] + 37 * s)} ${f(head[1] - 8 * s)}L${f(head[0] + 30 * s)} ${f(head[1] - 20 * s)}L${f(head[0] - 18 * s)} ${f(head[1] - 16 * s)}L${f(head[0] - 30 * s)} ${f(head[1] + 10 * s)}Z`, part: 'hair', depth: 1});
  leg(0, 2);
  out.push({d: rectP(box[0] - 48 * s, box[1] - 40 * s, 96 * s, 74 * s, 4 * s), part: 'box', depth: 2});
  arm(10 * s, 2);
  return out;
}

/** The office (static). */
export function office(): EnvPrim[] {
  const e: EnvPrim[] = [];
  e.push({d: rectP(0, FLOOR, CW, CH - FLOOR), part: 'floor'});
  e.push({d: rectP(36, 150, 210, 250, 6), part: 'window'});
  e.push({d: rectP(50, 164, 87, 106), part: 'pane'}); e.push({d: rectP(145, 164, 87, 106), part: 'pane'});
  e.push({d: rectP(50, 278, 87, 108), part: 'pane'}); e.push({d: rectP(145, 278, 87, 108), part: 'pane'});
  e.push({d: rectP(290, 200, 210, 150, 8), part: 'board'});
  [[318, 60], [366, 92], [414, 72], [462, 118]].forEach(([x, h]) => e.push({d: rectP(x, 330 - h, 26, h), part: 'bar'}));
  e.push({d: circP(470, 100, 32), part: 'clock'});
  e.push({d: `M470 100L470 80M470 100L484 108`, part: 'hand'});
  e.push({d: rectP(372, 532, 124, 80, 6), part: 'monitor'}); e.push({d: rectP(382, 542, 104, 58, 3), part: 'screen'});
  e.push({d: rectP(426, 612, 16, 22), part: 'monitor'});
  e.push({d: rectP(340, 634, 190, 18, 4), part: 'desk'});
  e.push({d: rectP(352, 652, 14, FLOOR - 652), part: 'desk'}); e.push({d: rectP(504, 652, 14, FLOOR - 652), part: 'desk'});
  e.push({d: polyP([[30, 712], [96, 712], [88, FLOOR], [38, FLOOR]]), part: 'pot'});
  [[48, 670, 16, 46, -20], [66, 650, 15, 60, 0], [84, 672, 16, 46, 22], [38, 694, 14, 30, -50], [96, 694, 14, 30, 50]].forEach(([cx, cy, rx, ry, a]) => {
    const r = rad(a), c = Math.cos(r), s2 = Math.sin(r);
    const pts = Array.from({length: 18}, (_, k) => { const u = (k / 18) * 2 * Math.PI, px = rx * Math.cos(u), py = ry * Math.sin(u); return [cx + px * c - py * s2, cy + px * s2 + py * c]; });
    e.push({d: polyP(pts), part: 'leaf'});
  });
  return e;
}

export const OFFICE = office();
