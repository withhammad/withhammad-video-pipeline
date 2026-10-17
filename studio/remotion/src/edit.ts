import type { Caption } from "@remotion/captions";

/** A region of a screenshot, in percent of the image (0–100). Drawn as an animated blue box. */
export type Highlight = { x: number; y: number; w: number; h: number; delayMs?: number };

/** Window chrome around a screenshot. "browser" (default) has a URL bar; "terminal" is a dark title bar. */
export type Chrome = "browser" | "terminal";

type Timed = { startMs: number; endMs: number };
/** Camera target in percent of the screenshot; defaults to the highlight centre. */
export type Focus = { x: number; y: number };

type Shot = { url?: string; chrome?: Chrome; zoomFrom?: number; zoomTo?: number; highlight?: Highlight; focus?: Focus };

export type Scene =
  /** hideText: an overlay insert (HyperFrames) draws the title; Remotion then shows only the card, below its chip row. */
  | (Timed & Shot & { type: "title"; line1: string; line2: string; image?: string; hideText?: boolean })
  | (Timed & Shot & { type: "split"; image: string; panY?: [number, number] })
  | (Timed & Shot & { type: "broll"; image: string })
  /** keyword: the comment-to-DM word, held large under `word` until the last frame. */
  | (Timed & { type: "end"; word: string; keyword?: string });

/** Background music. volume = gain while the voice is silent, duckTo = gain while a word is spoken. */
export type Music = { src: string; volume?: number; fadeInMs?: number; fadeOutMs?: number; duckTo?: number; loop?: boolean };
export type Sfx = { src: string; atMs: number; volume?: number };
/** Overlay video (usually WebM with alpha) drawn above the cards and below the captions. */
export type Insert = { src: string; startMs: number; endMs: number; alpha?: boolean };
/** A jump cut in the avatar clip (app.tighten): from atMs the avatar holds this scale (hard step, no easing). */
export type JumpCut = { atMs: number; scale: number };

export type EditProps = {
  avatar: string;
  captions: Caption[];
  emphasis: string[];
  scenes: Scene[];
  durationMs: number;
  music?: Music | null;
  sfx?: Sfx[];
  inserts?: Insert[];
  jumpCuts?: JumpCut[];
};

export const defaultEdit: EditProps = {
  avatar: "avatar.mp4",
  captions: [],
  emphasis: [],
  scenes: [],
  durationMs: 5000,
};

export const MUSIC_DEFAULTS = { volume: 0.12, fadeInMs: 0, fadeOutMs: 300, duckTo: 0.12 };
export const DUCK_RAMP_MS = 150;

export const cleanWord = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");

export const sceneAt = (scenes: Scene[], ms: number) => scenes.find((s) => ms >= s.startMs && ms < s.endMs);

// ---------------------------------------------------------------------------------------------
// Captions: 1–2 word pages, broken at punctuation and pauses, emphasis pairs kept together.
// ---------------------------------------------------------------------------------------------

export type CapWord = { text: string; clean: string; startMs: number; endMs: number; em: boolean };
export type CapPage = { startMs: number; endMs: number; words: CapWord[] };

export const buildPages = (
  captions: Caption[],
  emphasis: string[],
  { maxWords = 2, maxChars = 14, gapMs = 320, holdMs = 500 } = {},
): CapPage[] => {
  const em = new Set(emphasis.map(cleanWord));
  const words: CapWord[] = captions
    .map((c) => {
      const text = c.text.trim();
      const clean = cleanWord(text);
      return { text, clean, startMs: c.startMs, endMs: Math.max(c.endMs, c.startMs + 80), em: em.has(clean) };
    })
    .filter((w) => w.text.length > 0);

  const pages: CapPage[] = [];
  let cur: CapPage | null = null;
  words.forEach((w, i) => {
    if (cur) {
      const last = cur.words[cur.words.length - 1];
      const chars = cur.words.map((x) => x.text).join(" ").length + 1 + w.text.length;
      const next = words[i + 1];
      const emPairStarts = w.em && !!next && next.em && !last.em;
      const breakHere =
        cur.words.length >= maxWords ||
        chars > maxChars ||
        /[.,!?;:]$/.test(last.text) ||
        w.startMs - last.endMs > gapMs ||
        emPairStarts;
      if (breakHere) {
        pages.push(cur);
        cur = null;
      }
    }
    if (!cur) cur = { startMs: w.startMs, endMs: 0, words: [] };
    cur.words.push(w);
  });
  if (cur) pages.push(cur);

  pages.forEach((p, i) => {
    const lastEnd = p.words[p.words.length - 1].endMs;
    const next = pages[i + 1];
    p.endMs = next ? Math.min(next.startMs, lastEnd + holdMs) : lastEnd + holdMs;
  });
  return pages;
};

// ---------------------------------------------------------------------------------------------
// Presenter punch-ins: a quick eased 1.0 -> 1.07 zoom on emphasis words and at scene starts.
// ---------------------------------------------------------------------------------------------

export type Punch = { atMs: number; holdMs: number };

export const punchTriggers = (scenes: Scene[], pages: CapPage[]): Punch[] => {
  const raw: Punch[] = [];
  scenes.forEach((s) => {
    if (s.type !== "broll") raw.push({ atMs: s.startMs, holdMs: 260 });
  });
  pages.forEach((p) =>
    p.words.forEach((w) => {
      if (w.em) raw.push({ atMs: w.startMs, holdMs: Math.max(220, w.endMs - w.startMs) });
    }),
  );
  raw.sort((a, b) => a.atMs - b.atMs);
  const out: Punch[] = [];
  raw.forEach((p) => {
    const prev = out[out.length - 1];
    if (prev && p.atMs - prev.atMs < 300) prev.holdMs = Math.max(prev.holdMs, p.atMs + p.holdMs - prev.atMs);
    else out.push({ ...p });
  });
  return out;
};

/** Avatar scale from the jump cuts: the scale of the last cut at or before this frame (1 before the first). A hard
 * step on the cut frame, alternating 1.00 / 1.06, turns the head jump of a pause cut into a deliberate punch-in.
 * Compared in frames with the same rounding as sceneAtFrame: (frame / fps) * 1000 falls just under exact cut times
 * (frame 201 at 25 fps is 8039.999... ms), which put the step one frame late. */
export const jumpScale = (cuts: JumpCut[] | undefined, frame: number, fps: number): number => {
  let scale = 1;
  for (const c of cuts ?? []) {
    if (Math.round((c.atMs / 1000) * fps) > frame) break;
    scale = c.scale;
  }
  return scale;
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** 0..1 punch envelope at time ms: 160 ms attack, hold, 550 ms release. */
export const punchAmount = (punches: Punch[], ms: number, attackMs = 160, releaseMs = 550): number => {
  let best = 0;
  for (const p of punches) {
    const t = ms - p.atMs;
    if (t < 0 || t > attackMs + p.holdMs + releaseMs) continue;
    let v: number;
    if (t < attackMs) v = easeOutCubic(t / attackMs);
    else if (t < attackMs + p.holdMs) v = 1;
    else v = 1 - easeInOutSine(clamp01((t - attackMs - p.holdMs) / releaseMs));
    if (v > best) best = v;
  }
  return best;
};

// ---------------------------------------------------------------------------------------------
// Music ducking: speaking spans come from the captions, smoothed with DUCK_RAMP_MS ramps.
// ---------------------------------------------------------------------------------------------

const smoothstep = (t: number) => t * t * (3 - 2 * t);

/** 1 while a caption word is spoken, easing to 0 within rampMs before/after each word. */
export const speechAmount = (captions: Caption[], ms: number, rampMs = DUCK_RAMP_MS): number => {
  let best = 0;
  for (const c of captions) {
    if (ms >= c.startMs && ms <= c.endMs) return 1;
    const d = ms < c.startMs ? c.startMs - ms : ms - c.endMs;
    if (d < rampMs) best = Math.max(best, 1 - smoothstep(d / rampMs));
  }
  return best;
};

/** Linear music gain at time ms (fade-in, ducking under the voice, fade-out). */
export const musicGain = (music: Music, captions: Caption[], ms: number, durationMs: number): number => {
  const volume = music.volume ?? MUSIC_DEFAULTS.volume;
  const duckTo = music.duckTo ?? MUSIC_DEFAULTS.duckTo;
  const fadeIn = Math.max(1, music.fadeInMs ?? MUSIC_DEFAULTS.fadeInMs);
  const fadeOut = Math.max(1, music.fadeOutMs ?? MUSIC_DEFAULTS.fadeOutMs);
  const speak = speechAmount(captions, ms);
  const base = volume + (duckTo - volume) * speak;
  // fadeInMs 0 means present from frame 0 (ms/1 would be 0 there and drop the bed on the first frame).
  const fadeInPart = (music.fadeInMs ?? MUSIC_DEFAULTS.fadeInMs) > 0 ? clamp01(ms / fadeIn) : 1;
  const fade = Math.min(fadeInPart, clamp01((durationMs + 40 - ms) / fadeOut));
  return Math.max(0, Math.min(1, base * fade));
};

// ---------------------------------------------------------------------------------------------
// Missing assets must never crash a render: drop (or fall back) anything that is not served.
// ---------------------------------------------------------------------------------------------

export const sanitizeEdit = async (props: EditProps, exists: (src: string) => Promise<boolean>): Promise<EditProps> => {
  const cache = new Map<string, Promise<boolean>>();
  const has = (src?: string | null) => {
    if (!src) return Promise.resolve(false);
    let p = cache.get(src);
    if (!p) {
      p = exists(src).catch(() => false);
      cache.set(src, p);
    }
    return p;
  };

  let avatar = props.avatar;
  if (!(await has(avatar))) avatar = (await has("job/avatar.mp4")) ? "job/avatar.mp4" : "";

  const scenes: Scene[] = [];
  for (const s of props.scenes) {
    if (s.type === "end") scenes.push(s);
    else if (s.type === "title") scenes.push((await has(s.image)) ? s : { ...s, image: undefined });
    else scenes.push((await has(s.image)) ? s : { ...s, image: "" });
  }

  const music = props.music && (await has(props.music.src)) ? props.music : null;
  const sfx: Sfx[] = [];
  for (const x of props.sfx ?? []) if (await has(x.src)) sfx.push(x);
  const inserts: Insert[] = [];
  for (const x of props.inserts ?? []) if (x.endMs > x.startMs && (await has(x.src))) inserts.push(x);

  return { ...props, avatar, scenes, music, sfx, inserts };
};
