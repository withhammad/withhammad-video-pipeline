import { Easing } from "remotion";
import type { CaptionSystem, HeadlinePage, Scene, Word } from "./types";

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
// Layout boxes (px). The card is ~86% W; default sits at 0.26-0.80H like the reference canvas. Recordings are
// 4:5 (1080x1350); every box stays near that aspect so the cover crop takes at most ~6% off each edge.
// Everything stays out of the Reels UI: header above ~0.11H, caption block and right rail below ~0.78H.
// ---------------------------------------------------------------------------------------------

export type Box = { left: number; top: number; width: number; height: number };
export const CARD_BOX: Box = { left: 50, top: Math.round(H * 0.26), width: 620, height: Math.round(H * 0.54) };
/** Stat scenes: a narrower 4:5-friendly card (0.66W x 0.42H) so the giant stat sits under it at ~0.70H. */
export const CARD_COMPACT: Box = { left: 122, top: 290, width: 476, height: 536 };
/** Split: headline on top, card in the middle, the presenter in a round facecam below it. */
export const SPLIT_CARD: Box = { left: 140, top: 230, width: 440, height: 462 };
export const FACECAM = { cx: 360, cy: 860, r: 150 };

export const boxOf = (s: Scene): Box => (s.type === "stat" ? CARD_COMPACT : s.type === "split" ? SPLIT_CARD : CARD_BOX);

export const HEADLINE_TOP = { canvas: 168, split: 132 };
/** Lowest a chip centre may sit (fractions of H): below it the Reels caption block and right rail take over. */
export const CHIP_Y_MAX = 0.78;

// ---------------------------------------------------------------------------------------------
// Caption pages, one rule set per caption system. Captions render once per RUN of contiguous scenes with the
// same system, so a punch-in jump cut never resets a page; only a change of caption system (or of beat, for
// headlines) starts fresh.
// ---------------------------------------------------------------------------------------------

export type Page = { startMs: number; endMs: number; words: Word[]; line2At: number };

const endsSentence = (t: string) => /[.!?]["')]?$/.test(t.trim());
const endsClause = (t: string) => /[,:;.!?]["')]?$/.test(t.trim());
const endsComma = (t: string) => /[,;]["')]?$/.test(t.trim());
export const cleanWord = (t: string) => t.toLowerCase().replace(/[^a-z0-9']/g, "");
/** Headline lines may break before these words (and after a clause end). */
const BREAK_BEFORE = new Set(["by", "and", "then", "from", "so", "but", "with", "because"]);

export const wordsBetween = (words: Word[], startMs: number, endMs: number) => words.filter((w) => w.startMs >= startMs && w.startMs < endMs && w.text.trim());

/** Best split point of n words near the middle: after a clause end or before by/and/then/from. */
const balancedBreak = (ws: Word[], lo: number, hi: number, ideal: number) => {
  let best = Math.round(ideal);
  let bestCost = Infinity;
  for (let k = Math.max(1, lo); k <= Math.min(ws.length - 1, hi); k++) {
    const nice = endsClause(ws[k - 1].text) || BREAK_BEFORE.has(cleanWord(ws[k].text));
    const cost = Math.abs(k - ideal) + (nice ? 0 : 2);
    if (cost < bestCost) {
      bestCost = cost;
      best = k;
    }
  }
  return best;
};

/**
 * Fallback explainer headlines from the spoken words (when the spec gave no curated on_screen_text): a page is
 * a phrase (it turns after a sentence, after a comma once it holds 5+ words, or at a pause), ':' never turns a
 * page ("Script:" stays with its list), a phrase longer than 8 words splits into balanced pages (6+5, never
 * 8+3) at a clause end or before by/and/then/from, and a 1-2 word scrap joins its neighbour.
 */
const explainerPages = (words: Word[], endMs: number): Page[] => {
  const phrases: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w) => {
    const last = cur[cur.length - 1];
    if (last && (w.startMs - last.endMs > 600 || endsSentence(last.text) || (endsComma(last.text) && cur.length >= 5))) {
      phrases.push(cur);
      cur = [];
    }
    cur.push(w);
  });
  if (cur.length) phrases.push(cur);
  const chunks: Word[][] = [];
  phrases.forEach((ph) => {
    const k = Math.ceil(ph.length / 8);
    let at = 0;
    for (let j = 1; j < k; j++) {
      const cut = balancedBreak(ph, at + 3, ph.length - 3, (ph.length * j) / k);
      chunks.push(ph.slice(at, cut));
      at = cut;
    }
    chunks.push(ph.slice(at));
  });
  for (let i = chunks.length - 1; i > 0; i--) {
    const p = chunks[i];
    const prev = chunks[i - 1];
    const prevLast = prev[prev.length - 1];
    if (p.length <= 2 && prev.length + p.length <= 8 && !endsSentence(prevLast.text) && p[0].startMs - prevLast.endMs <= 450) {
      chunks[i - 1] = [...prev, ...p];
      chunks.splice(i, 1);
    }
  }
  for (let i = 0; i < chunks.length - 1; i++) {
    const p = chunks[i];
    if (p.length <= 2 && p.length + chunks[i + 1].length <= 8 && chunks[i + 1][0].startMs - p[p.length - 1].endMs <= 600) {
      chunks[i] = [...p, ...chunks[i + 1]];
      chunks.splice(i + 1, 1);
      i--;
    }
  }
  return chunks.map((ws, i) => {
    const n = ws.length;
    return {
      startMs: ws[0].startMs,
      endMs: chunks[i + 1] ? chunks[i + 1][0].startMs : endMs,
      words: ws,
      line2At: n <= 2 ? n : balancedBreak(ws, 1, n - 1, n / 2),
    };
  });
};

/** Fallback pages as headline pages: line 1 sans, line 2 italic serif. */
export const fallbackHeadlines = (words: Word[], endMs: number): HeadlinePage[] =>
  explainerPages(words, endMs).map((p) => ({
    startMs: p.startMs,
    endMs: p.endMs,
    lines: [p.words.slice(0, p.line2At), p.words.slice(p.line2At)]
      .filter((l) => l.length)
      .map((l, i) => ({ italic: i === 1, words: l.map((w) => ({ text: w.text.trim(), startMs: w.startMs, italic: i === 1 })) })),
  }));

const DETERMINERS = new Set(["the", "a", "an", "your", "my", "our", "this", "that", "its", "their"]);

/**
 * hook: 3 words per line; talk: 2-4 words, and an emphasis phrase (with its article: "the full guide") drops to
 * a second line of the SAME page, like the reference's "and I'll send it / over to you"; the page turns after
 * it. Pages hold until the next page or the run end (talk pages clear 700 ms after their last word so silence
 * never carries stale text).
 */
export const buildPages = (words: Word[], system: CaptionSystem, endMs: number): Page[] => {
  if (system === "explainer") return explainerPages(words, endMs);
  const max = system === "hook" ? 3 : 4;
  const gap = 350;
  const pages: Page[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) pages.push({ startMs: cur[0].startMs, endMs: 0, words: cur, line2At: cur.length });
    cur = [];
  };
  words.forEach((w, idx) => {
    const last = cur[cur.length - 1];
    if (!last) {
      cur.push(w);
      return;
    }
    const n = cur.length;
    const sentence = endsSentence(last.text) || w.startMs - last.endMs > gap;
    let brk = sentence || n >= max;
    if (system === "talk") {
      const hasEm = cur.some((x, j) => j > 0 && x.em);
      const next = words[idx + 1];
      const emAhead = !hasEm && (w.em || (DETERMINERS.has(cleanWord(w.text)) && !!next?.em));
      const inEmRun = !!last.em && !!w.em;
      brk = sentence || (endsComma(last.text) && n >= 2) || (hasEm && !!last.em && !w.em) || (n >= max && !emAhead && !inEmRun) || n >= max + 4;
    }
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
    const hold = system === "talk" ? Math.min(endMs, lastEnd + 700) : endMs;
    p.endMs = next ? Math.min(next.startMs, hold) : hold;
    if (system === "talk") {
      let k = p.words.findIndex((w, j) => j > 0 && w.em);
      if (k > 1 && DETERMINERS.has(cleanWord(p.words[k - 1].text))) k -= 1;
      p.line2At = k > 0 ? k : p.words.length;
    }
  });
  return pages;
};

export const displayText = (t: string, system: CaptionSystem) => {
  const s = t.trim();
  if (system === "hook") return s.replace(/[.,;:!?"]+$/g, "").toUpperCase();
  // Headlines keep ':' and ',' inside a line; only line-final '.', ',' and ';' go (see lineText).
  if (system === "explainer") return s;
  return s.replace(/[,;:]+$/g, "");
};

/** A headline line's last word drops its trailing '.', ',' or ';' (the reference never ends a line on one). */
export const lineText = (t: string, last: boolean) => (last ? t.replace(/[.,;]+$/g, "") : t);

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
