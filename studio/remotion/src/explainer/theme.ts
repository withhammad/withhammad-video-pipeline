import { Easing } from "remotion";
import type { CaptionSystem, FaceBox, HeadlinePage, Recording, Scene, Word, Zoom } from "./types";

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

/** Instrument Serif italic draws "1" with no base serif and a hairline flag, so "11" reads "ll" and "21" reads "2l".
 *  A word holding a digit is never set in it: it takes the heavy sans (still the emphasis, by weight and size). */
export const hasNumeral = (t: string) => /\d/.test(t);
export const NUMERAL_STYLE = { fontFamily: SANS, fontStyle: "normal", fontWeight: 800, letterSpacing: -0.5 } as const;

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
// Layout boxes (px). The card spans x 0.06-0.86W (clear of the right action rail) and 0.26-0.79H like the
// reference canvas. Recordings are 4:5 (1080x1350) and sit CARD_INSET px inside the card, so no line of text
// touches the card edge; the cover crop takes ~3% off the top and bottom.
// Everything stays out of the Reels UI: header above ~0.11H, caption block and right rail below ~0.79H.
// ---------------------------------------------------------------------------------------------

export type Box = { left: number; top: number; width: number; height: number };
/** The safe area a card (and its pop) must stay inside. */
export const SAFE = { left: Math.round(W * 0.06), right: Math.round(W * 0.86), bottom: Math.round(H * 0.79) };
export const CARD_BOX: Box = { left: SAFE.left, top: Math.round(H * 0.26), width: SAFE.right - SAFE.left, height: SAFE.bottom - Math.round(H * 0.26) };
/** Recording inset inside the card (px, every side); edit_explainer.CARD_INNER_W = CARD_BOX.width - 2 * CARD_INSET. */
export const CARD_INSET = 14;
/** Stat scenes: a narrower 4:5-friendly card (0.66W x 0.42H) so the giant stat sits under it at ~0.70H. */
export const CARD_COMPACT: Box = { left: 122, top: 290, width: 476, height: 536 };
/** Split: headline on top, card in the middle, the presenter in a round facecam below it. */
export const SPLIT_CARD: Box = { left: 140, top: 230, width: 440, height: 462 };
export const FACECAM = { cx: 360, cy: 860, r: 150 };

export const boxOf = (s: Scene): Box => (s.type === "stat" ? CARD_COMPACT : s.type === "split" ? SPLIT_CARD : CARD_BOX);

export const HEADLINE_TOP = { canvas: 168, split: 132 };
/** Lowest a chip centre may sit (fractions of H): below it the Reels caption block and right rail take over. */
export const CHIP_Y_MAX = 0.78;

/** The largest card-level scale (<= scale) that keeps the card inside SAFE (it scales around its centre). */
export const clampCardScale = (box: Box, scale: number) => {
  const cx = box.left + box.width / 2;
  const cy = box.top + box.height / 2;
  const fit = Math.min((SAFE.right - cx) / (box.width / 2), (cx - SAFE.left) / (box.width / 2), (SAFE.bottom - cy) / (box.height / 2));
  return Math.max(1, Math.min(scale, fit));
};

// ---------------------------------------------------------------------------------------------
// Push-ins on highlight boxes (recording.zooms). The recording is drawn "cover" inside the inset box; a zoom aims
// its transform origin so the highlight box moves toward the middle and stays wholly inside (the scale is capped
// so the box fits). Consecutive zooms closer than ZOOM_LINK_MS pan from one box to the next instead of zooming out.
// ---------------------------------------------------------------------------------------------

const ZOOM_IN_MS = 420;
const ZOOM_OUT_MS = 360;
const ZOOM_LINK_MS = 600;
const REC_W = 1080;
const REC_H = 1350;

export type ZoomState = { scale: number; originX: number; originY: number };

/** Where a recording point (fractions) is drawn inside an inner box of iw x ih px ("cover" fit; focusY aligns the
 *  vertical crop: 0 top, 0.5 centre, 1 bottom). */
const coverPoint = (fx: number, fy: number, iw: number, ih: number, focusY = 0.5) => {
  const c = Math.max(iw / REC_W, ih / REC_H);
  return { x: (iw - REC_W * c) / 2 + fx * REC_W * c, y: (ih - REC_H * c) * focusY + fy * REC_H * c, c };
};

/** Scale and origin (px in the inner box) for a push-in on a highlight box: the box moves as near the middle as the
 *  frame allows and keeps its full height in view. A box wider than the card at that scale (a whole paragraph)
 *  starts with its LEFT edge in view and, when the push holds long enough, glides to its right edge (originXEnd),
 *  so every highlighted line is read from its start, at the larger size. */
type Aim = ZoomState & { originXEnd: number };
const ZOOM_MARGIN = 0.07;
/** Margin kept around a zoom's content span (fraction of the recording width; edit_explainer.CONTENT_PAD). */
const CONTENT_PAD = 0.01;
const PAN_MIN_HOLD_MS = 600;

const aim = (z: Zoom, iw: number, ih: number, focusY = 0.5): Aim => {
  const [bx, by, bw, bh] = z.box;
  const p = coverPoint(bx + bw / 2, by + bh / 2, iw, ih, focusY);
  // z.content: the page's content span [x0, x1] (fractions of the recording width). The push never crops into it:
  // the scale is capped so the span fits, and the origin keeps the whole span in view (the crop lands in margins).
  const cl = z.content ? coverPoint(z.content[0] - CONTENT_PAD, 0, iw, ih, focusY).x : null;
  const cr = z.content ? coverPoint(z.content[1] + CONTENT_PAD, 0, iw, ih, focusY).x : null;
  let s = Math.max(1, Math.min(z.scale, (ih * 0.9) / Math.max(1, bh * REC_H * p.c)));
  if (cl !== null && cr !== null) s = Math.min(s, iw / Math.max(1, cr - cl));
  if (s <= 1.001) return { scale: 1, originX: iw / 2, originY: ih / 2, originXEnd: iw / 2 };
  const o = (v: number, size: number) => Math.min(size, Math.max(0, (s * v - size / 2) / (s - 1)));
  // The visible window starts at origin * (1 - 1/s): keep [cl, cr] inside it.
  const keep = (v: number) => (cl === null || cr === null ? v : Math.min(cl / (1 - 1 / s), Math.max((cr - iw / s) / (1 - 1 / s), v)));
  const clampX = (v: number) => Math.min(iw, Math.max(0, keep(v)));
  const oy = o(p.y, ih);
  if (bw * REC_W * p.c * s <= iw * (1 - 2 * ZOOM_MARGIN)) {
    const ox = clampX(o(p.x, iw));
    return { scale: s, originX: ox, originY: oy, originXEnd: ox };
  }
  const left = coverPoint(bx, by, iw, ih, focusY).x;
  const right = coverPoint(bx + bw, by, iw, ih, focusY).x;
  const m = iw * ZOOM_MARGIN;
  return { scale: s, originX: clampX((s * left - m) / (s - 1)), originY: oy, originXEnd: clampX((s * right - (iw - m)) / (s - 1)) };
};

export const zoomAt = (zooms: Zoom[] | undefined, ms: number, iw: number, ih: number, focusY = 0.5): ZoomState => {
  const none = { scale: 1, originX: iw / 2, originY: ih / 2 };
  if (!zooms?.length) return none;
  const zs = [...zooms].sort((a, b) => a.atMs - b.atMs);
  const panX = (z: Zoom, a: Aim, t: number) => {
    const h0 = z.atMs + ZOOM_IN_MS;
    const h1 = z.endMs - ZOOM_OUT_MS;
    return h1 - h0 >= PAN_MIN_HOLD_MS ? lerp(a.originX, a.originXEnd, smoothstep((t - h0) / (h1 - h0))) : a.originX;
  };
  for (let i = 0; i < zs.length; i++) {
    const z = zs[i];
    const prev = zs[i - 1];
    const next = zs[i + 1];
    const linkedPrev = !!prev && z.atMs - prev.endMs < ZOOM_LINK_MS;
    const linkedNext = !!next && next.atMs - z.endMs < ZOOM_LINK_MS;
    const a = aim(z, iw, ih, focusY);
    if (ms >= z.atMs && ms <= z.endMs) {
      const kIn = linkedPrev ? 1 : smoothstep((ms - z.atMs) / ZOOM_IN_MS);
      const kOut = linkedNext ? 1 : 1 - smoothstep((ms - (z.endMs - ZOOM_OUT_MS)) / ZOOM_OUT_MS);
      const k = Math.min(kIn, kOut);
      return { scale: 1 + (a.scale - 1) * k, originX: panX(z, a, ms), originY: a.originY };
    }
    if (linkedNext && ms > z.endMs && ms < next.atMs) {
      const b = aim(next, iw, ih, focusY);
      const u = smoothstep((ms - z.endMs) / Math.max(1, next.atMs - z.endMs));
      return { scale: lerp(a.scale, b.scale, u), originX: lerp(panX(z, a, z.endMs), b.originX, u), originY: lerp(a.originY, b.originY, u) };
    }
  }
  return none;
};

// ---------------------------------------------------------------------------------------------
// Display words (bigtext) never cover the face: the same placement as edit_explainer.place_display_word.
// ---------------------------------------------------------------------------------------------

export const DEFAULT_FACE_BOX: FaceBox = [0.28, 0.12, 0.44, 0.36];
const SAFE_TOP_PX = 150;
const DISPLAY_EM = 0.42;
const FACE_MARGIN = 14;

type Rect = [number, number, number, number];
const faceRect = (f: FaceBox): Rect => [f[0] * W, f[1] * H, (f[0] + f[2]) * W, (f[1] + f[3]) * H];
const displayRect = (n: number, size: number, cx: number, cy: number): Rect => {
  const w = Math.max(1, n) * DISPLAY_EM * size;
  const h = 1.1 * size;
  return [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2];
};
const overlaps = (a: Rect, b: Rect, m = 0) => a[0] < b[2] + m && a[2] > b[0] - m && a[1] < b[3] + m && a[3] > b[1] - m;

/** {x, y (centre px), size (px)} of a display word clear of the face box. */
export const placeDisplayWord = (text: string, y: number, face: FaceBox = DEFAULT_FACE_BOX, x = 0.5, size?: number) => {
  const n = Math.max(1, Array.from(text).length);
  const size0 = size ?? Math.min(120, (W * 0.48) / (n * DISPLAY_EM));
  const fb = faceRect(face);
  const cy0 = Math.max(y * H, SAFE_TOP_PX + 0.55 * size0);
  if (!overlaps(displayRect(n, size0, x * W, cy0), fb, FACE_MARGIN)) return { x: x * W, y: cy0, size: size0 };
  const room = fb[1] - FACE_MARGIN - SAFE_TOP_PX;
  let s = Math.min(size0, room / 1.1, (W * 0.8) / (n * DISPLAY_EM));
  if (s >= 56) return { x: W / 2, y: (SAFE_TOP_PX + fb[1] - FACE_MARGIN) / 2, size: s };
  const sides: [number, number][] = [[SAFE.left - 0.01 * W, fb[0] - FACE_MARGIN], [fb[2] + FACE_MARGIN, SAFE.right]];
  const [lo, hi] = sides[0][1] - sides[0][0] >= sides[1][1] - sides[1][0] ? sides[0] : sides[1];
  s = Math.min(size0, (hi - lo) / (n * DISPLAY_EM));
  if (s >= 56) return { x: (lo + hi) / 2, y: Math.max((fb[1] + fb[3]) / 2, SAFE_TOP_PX + 0.55 * s), size: s };
  return { x: W / 2, y: fb[3] + FACE_MARGIN + 0.55 * size0, size: size0 };
};

/** Recording zooms present? (the push-in state of a card at scene-relative ms, for the in-card swap freeze). */
export const hasZooms = (rec?: Recording) => !!rec?.zooms?.length;

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

/** The CTA keyword page ("comment / SKILL") stays up at least this long before the next page replaces it. */
const KEYWORD_HOLD_MS = 800;

/**
 * hook: 3 words per line; talk: 2-4 words, and an emphasis phrase (with its article: "the full guide") drops to
 * a second line of the SAME page, like the reference's "and I'll send it / over to you"; the page turns after
 * it. A page never ends on an article ("If you want the" / "link"). Pages hold until the next page or the run end
 * (talk pages clear 700 ms after their last word so silence never carries stale text); the CTA keyword page holds
 * KEYWORD_HOLD_MS.
 */
export const buildPages = (words: Word[], system: CaptionSystem, endMs: number, ctaKeyword?: string): Page[] => {
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
      const dangling = DETERMINERS.has(cleanWord(last.text));
      brk = sentence || (endsComma(last.text) && n >= 2) || (hasEm && !!last.em && !w.em) || (n >= max && !emAhead && !inEmRun && !dangling) || n >= max + 4;
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
  if (ctaKeyword) {
    pages.forEach((p, i) => {
      const hasKey = p.words.some((w, j) => j > 0 && cleanWord(p.words[j - 1].text) === "comment" && cleanWord(w.text) === cleanWord(ctaKeyword));
      const next = pages[i + 1];
      if (hasKey && next && next.startMs < p.startMs + KEYWORD_HOLD_MS) {
        const hold = Math.min(p.startMs + KEYWORD_HOLD_MS, next.endMs - 200);
        p.endMs = Math.max(p.endMs, hold);
        next.startMs = Math.max(next.startMs, hold);
      }
    });
  }
  return pages;
};

export const displayText = (t: string, system: CaptionSystem) => {
  const s = t.trim();
  if (system === "hook") return s.replace(/[.,;:!?"]+$/g, "").toUpperCase();
  // Headlines keep ':' and ',' inside a line; only line-final '.', ',' and ';' go (see lineText).
  if (system === "explainer") return s;
  return s.replace(/[,;:.]+$/g, "");
};

/** A headline line's last word drops its trailing '.', ',' or ';' (the reference never ends a line on one). */
export const lineText = (t: string, last: boolean) => (last ? t.replace(/[.,;]+$/g, "") : t);

// ---------------------------------------------------------------------------------------------
// Music ducking under the voice (spans from the caption words, 150 ms smoothstep ramps).
// ---------------------------------------------------------------------------------------------

export const speechAmount = (words: Word[], ms: number, rampMs = 150, holdGapMs = 0) => {
  let best = 0;
  let before: Word | undefined;
  let after: Word | undefined;
  for (const w of words) {
    if (ms >= w.startMs && ms <= w.endMs) return 1;
    if (w.endMs < ms && (!before || w.endMs > before.endMs)) before = w;
    if (w.startMs > ms && (!after || w.startMs < after.startMs)) after = w;
    const d = ms < w.startMs ? w.startMs - ms : ms - w.endMs;
    if (d < rampMs) best = Math.max(best, 1 - smoothstep(d / rampMs));
  }
  // A short gap between two words stays ducked: the bed only comes up at real pauses.
  if (before && after && after.startMs - before.endMs < holdGapMs) return 1;
  return best;
};
