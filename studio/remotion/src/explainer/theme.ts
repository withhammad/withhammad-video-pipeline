import { Easing } from "remotion";
import type { CaptionSystem, Scene, Word } from "./types";

// Canvas: 720x1280 at 25 fps, the HeyGen take's native rate (no repeated face frames).
export const FPS = 25;
export const W = 720;
export const H = 1280;
export const FRAME_MS = 1000 / FPS;

// Palette sampled from the reference (visual.md).
export const PINK = "#EF5AB0";
export const STAT_GREEN = "#9EC96E";
export const DEEP_GREEN = "#50771A";
export const PEACH = "#DE8C78";
export const INK = "#111111";
export const CARD_BG = "#0d0f14";
export const ARROW_RED = "#E5484D";
export const BACKDROP = "#E9E5E0";

export const SANS = "'Inter', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";
export const SERIF = "'Instrument Serif', 'New York', 'Iowan Old Style', Georgia, serif";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const EXPO_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

export const toFrame = (ms: number) => Math.round((ms / 1000) * FPS);
export const toMs = (frame: number) => (frame / FPS) * 1000;
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

/** Same rounding as the scene Sequences, so every layer agrees on the scene at a cut frame. */
export const sceneIndexAtFrame = (scenes: Scene[], frame: number) =>
  scenes.findIndex((s) => frame >= toFrame(s.startMs) && frame < toFrame(s.endMs));

export const isCanvas = (s?: Scene) => !!s && (s.type === "card" || s.type === "stat" || s.type === "text");

export const systemOf = (s: Scene): CaptionSystem | null => {
  if (s.system) return s.system;
  if (s.type === "endcard") return null;
  if (s.type === "avatar") return s.flipIn ? "hook" : "talk";
  return "explainer";
};

// ---------------------------------------------------------------------------------------------
// Layout boxes (px). The card is ~86% W; default sits at 0.26-0.80H like the reference canvas.
// ---------------------------------------------------------------------------------------------

export type Box = { left: number; top: number; width: number; height: number };
export const CARD_BOX: Box = { left: 50, top: Math.round(H * 0.26), width: 620, height: Math.round(H * 0.54) };
/** Stat scenes: the card rises and shortens so the giant stat sits under it at ~0.70H. */
export const CARD_COMPACT: Box = { left: 50, top: Math.round(H * 0.24), width: 620, height: Math.round(H * 0.385) };
/** Split: headline on top, card in the middle, the presenter in a round facecam at the bottom. */
export const SPLIT_CARD: Box = { left: 80, top: 236, width: 560, height: 452 };
export const FACECAM = { cx: 360, cy: 940, r: 186 };

export const boxOf = (s: Scene): Box => (s.type === "stat" ? CARD_COMPACT : s.type === "split" ? SPLIT_CARD : CARD_BOX);

export const HEADLINE_TOP = { canvas: 168, split: 108 };

// ---------------------------------------------------------------------------------------------
// Caption pages, one rule set per caption system. Pages never cross a scene cut.
// ---------------------------------------------------------------------------------------------

export type Page = { startMs: number; endMs: number; words: Word[]; line2At: number };

const endsSentence = (t: string) => /[.!?]["')]?$/.test(t.trim());
const endsClause = (t: string) => /[,:;]["')]?$/.test(t.trim());

export const wordsIn = (words: Word[], s: Scene) => words.filter((w) => w.startMs >= s.startMs && w.startMs < s.endMs && w.text.trim());

/**
 * hook: 3 words per line; explainer: up to 8 words in two lines (line 2 italic serif);
 * talk: 2-4 words, emphasis words drop to a second line. Pages hold until the next page or the scene end
 * (talk pages clear 700 ms after their last word so silence never carries stale text).
 */
export const buildPages = (words: Word[], system: CaptionSystem, sceneEndMs: number): Page[] => {
  const max = system === "hook" ? 3 : system === "explainer" ? 8 : 4;
  const gap = system === "explainer" ? 450 : 350;
  const pages: Page[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) pages.push({ startMs: cur[0].startMs, endMs: 0, words: cur, line2At: cur.length });
    cur = [];
  };
  words.forEach((w) => {
    const last = cur[cur.length - 1];
    if (!last) {
      cur.push(w);
      return;
    }
    const n = cur.length;
    const brk =
      system === "explainer"
        ? // Two-line headlines: a sentence or clause may end line 1; the page turns once it holds a full thought.
          n >= max || w.startMs - last.endMs > 600 || (endsSentence(last.text) && n >= 4) || (endsClause(last.text) && n >= 6)
        : n >= max || endsSentence(last.text) || w.startMs - last.endMs > gap || (system === "talk" && endsClause(last.text) && n >= 2);
    if (brk) flush();
    cur.push(w);
  });
  flush();
  // A dangling one-word page joins the previous page when they are spoken together (no lonely word flashing by).
  for (let i = pages.length - 1; i > 0; i--) {
    const p = pages[i];
    const prev = pages[i - 1];
    const prevLast = prev.words[prev.words.length - 1];
    if (p.words.length === 1 && prev.words.length < max + 1 && system !== "hook" && !endsSentence(prevLast.text) && p.words[0].startMs - prevLast.endMs <= gap) {
      prev.words = [...prev.words, ...p.words];
      pages.splice(i, 1);
    }
  }
  pages.forEach((p, i) => {
    const next = pages[i + 1];
    const lastEnd = p.words[p.words.length - 1].endMs;
    const hold = system === "talk" ? Math.min(sceneEndMs, lastEnd + 700) : sceneEndMs;
    p.endMs = next ? Math.min(next.startMs, hold) : hold;
    const n = p.words.length;
    if (system === "explainer") {
      // Line 2 (italic serif) starts after a sentence/clause end inside the page, else at the middle.
      let at = n <= 2 ? n : Math.ceil(n / 2);
      let best = Infinity;
      for (let k = 1; k <= n - 1; k++) {
        const t = p.words[k - 1].text;
        if ((endsSentence(t) || endsClause(t)) && Math.abs(k - n / 2) < best) {
          best = Math.abs(k - n / 2);
          at = k;
        }
      }
      p.line2At = at;
    } else if (system === "talk") {
      const k = p.words.findIndex((w, j) => j > 0 && w.em);
      p.line2At = k > 0 ? k : n;
    }
  });
  return pages;
};

export const displayText = (t: string, system: CaptionSystem) => {
  const s = t.trim();
  if (system === "hook") return s.replace(/[.,;:!?"]+$/g, "").toUpperCase();
  if (system === "explainer") return s.replace(/[.,;:"]+$/g, "");
  return s.replace(/[,;:]+$/g, "");
};

// ---------------------------------------------------------------------------------------------
// Music ducking under the voice (spans from the caption words, 150 ms smoothstep ramps).
// ---------------------------------------------------------------------------------------------

export const speechAmount = (words: Word[], ms: number, rampMs = 150) => {
  let best = 0;
  for (const w of words) {
    if (ms >= w.startMs && ms <= w.endMs) return 1;
    const d = ms < w.startMs ? w.startMs - ms : ms - w.endMs;
    if (d < rampMs) best = Math.max(best, 1 - smoothstep(d / rampMs));
  }
  return best;
};
