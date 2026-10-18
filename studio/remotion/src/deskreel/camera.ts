import { random } from "remotion";
import type { BlurAxis, CameraKey, CameraShot, Ease, Shake } from "./types";

/** 30 fps like both references (frame-exact timings in their visual.md). */
export const FPS = 30;
export const W = 720;
export const H = 1280;
export const toFrame = (ms: number) => Math.round((ms / 1000) * FPS);
export const toMs = (frame: number) => (frame / FPS) * 1000;
/** [startMs, endMs) is on screen on this frame (the rule every layer and edit_deskreel.py share). */
export const onAt = (frame: number, startMs: number, endMs: number) => frame >= toFrame(startMs) && frame < toFrame(endMs);

/** Must match edit_deskreel.EASES. */
export const EASES: Record<string, [number, number, number, number]> = {
  linear: [0, 0, 1, 1],
  easeIn: [0.42, 0, 1, 1],
  easeOut: [0, 0, 0.58, 1],
  easeInOut: [0.42, 0, 0.58, 1],
  expoOut: [0.16, 1, 0.3, 1],
};

/** CSS cubic-bezier(x1, y1, x2, y2) at t (bisection on x, exact enough for frame sampling). */
export const bezier = ([x1, y1, x2, y2]: [number, number, number, number], t: number) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const cx = (u: number) => 3 * x1 * u * (1 - u) ** 2 + 3 * x2 * u * u * (1 - u) + u ** 3;
  const cy = (u: number) => 3 * y1 * u * (1 - u) ** 2 + 3 * y2 * u * u * (1 - u) + u ** 3;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (cx(mid) < t) lo = mid;
    else hi = mid;
  }
  return cy((lo + hi) / 2);
};

export const ease = (e: Ease | undefined, t: number) => {
  if (e === "hold") return t >= 1 ? 1 : 0;
  return bezier(Array.isArray(e) ? e : EASES[e ?? "linear"] ?? EASES.linear, t);
};

export type CamState = { x: number; y: number; scale: number; rot: number; blurPx: number; blurAxis: BlurAxis };
export const IDENTITY: CamState = { x: 0, y: 0, scale: 1, rot: 0, blurPx: 0, blurAxis: "xy" };

/** Keys with every field filled (carried over from the previous key). */
export const fillKeys = (keys: CameraKey[]): (CamState & { ms: number; ease?: Ease })[] => {
  let prev: CamState = IDENTITY;
  return [...keys]
    .sort((a, b) => a.ms - b.ms)
    .map((k) => {
      const s: CamState = {
        x: k.x ?? prev.x,
        y: k.y ?? prev.y,
        scale: k.scale ?? prev.scale,
        rot: k.rot ?? prev.rot,
        blurPx: k.blurPx ?? prev.blurPx,
        blurAxis: k.blurAxis ?? prev.blurAxis,
      };
      prev = s;
      return { ...s, ms: k.ms, ease: k.ease };
    });
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Smooth 1-D value noise in [-1, 1] (cosine-interpolated random lattice), deterministic per seed. */
const noise = (seed: string, x: number) => {
  const i = Math.floor(x);
  const f = x - i;
  const a = random(`${seed}:${i}`) * 2 - 1;
  const b = random(`${seed}:${i + 1}`) * 2 - 1;
  return lerp(a, b, (1 - Math.cos(f * Math.PI)) / 2);
};

export const shakeAt = (s: Shake, ms: number, shotStartMs: number) => {
  const t = ms - (s.startMs ?? shotStartMs);
  if (t < 0) return { x: 0, y: 0, rot: 0 };
  const env = Math.exp(-t / Math.max(1, s.decayMs));
  const u = (t / 1000) * (s.freqHz ?? 9);
  const seed = String(s.seed ?? 1);
  return {
    x: s.ampPx * env * noise(`${seed}x`, u),
    y: s.ampPx * env * noise(`${seed}y`, u + 17.3),
    rot: (s.rotDeg ?? 0) * env * noise(`${seed}r`, u + 41.7),
  };
};

/** The camera on this frame: the shot that holds it (identity outside every shot), its keys eased, plus shake. */
export const cameraAt = (shots: CameraShot[], frame: number): CamState => {
  const shot = shots.find((s) => onAt(frame, s.startMs, s.endMs));
  if (!shot) return IDENTITY;
  const ms = toMs(frame);
  const keys = fillKeys(shot.keys);
  let st: CamState = IDENTITY;
  if (keys.length) {
    if (ms <= keys[0].ms) st = keys[0];
    else if (ms >= keys[keys.length - 1].ms) st = keys[keys.length - 1];
    else {
      const j = keys.findIndex((k) => k.ms > ms);
      const a = keys[j - 1];
      const b = keys[j];
      const t = ease(b.ease, (ms - a.ms) / Math.max(1e-6, b.ms - a.ms));
      st = {
        x: lerp(a.x, b.x, t),
        y: lerp(a.y, b.y, t),
        scale: lerp(a.scale, b.scale, t),
        rot: lerp(a.rot, b.rot, t),
        blurPx: lerp(a.blurPx, b.blurPx, t),
        blurAxis: t < 1 ? a.blurAxis : b.blurAxis,
      };
    }
  }
  if (shot.shake) {
    const sh = shakeAt(shot.shake, ms, shot.startMs);
    st = { ...st, x: st.x + sh.x, y: st.y + sh.y, rot: st.rot + sh.rot };
  }
  return st;
};

/** The picture's travel (px) into this frame from the previous one in the same shot (from the next one on a shot's
 *  first frame): the direction a "motion" blur streaks along. */
export const cameraVelocity = (shots: CameraShot[], frame: number) => {
  const shot = shots.find((s) => onAt(frame, s.startMs, s.endMs));
  if (!shot) return { dx: 0, dy: 0 };
  const first = frame <= toFrame(shot.startMs);
  const a = cameraAt(shots, first ? frame : frame - 1);
  const b = cameraAt(shots, first ? frame + 1 : frame);
  return { dx: b.x - a.x, dy: b.y - a.y };
};
