/**
 * Props for the "Explainer" composition: the reference-matched format (hook flip-in with pink-step captions,
 * white grid canvas + dark recording card, short talking-head breathers, stat pops, comment CTA, end card).
 * Written by studio/app/edit_explainer.py (edit_explainer.json). Every src is relative to remotion/public/.
 * All times are milliseconds on the avatar timeline; overlay/pushIn times are relative to their scene start.
 */

export type CaptionSystem = "hook" | "explainer" | "talk";
/** pip (theme "harvest"): a full-frame recording with the presenter in a small window above it. */
export type SceneType = "avatar" | "split" | "card" | "text" | "stat" | "endcard" | "pip";

/** A Remotion-side callout, scene-relative. mode "content" (default) pushes the camera into the recording;
 *  mode "card" pops the whole card out (scale + orange outline) and leaves the recording at 1.0. */
export type PushIn = { atMs: number; scale: number; originX: number; originY: number; durMs?: number; mode?: "content" | "card" };

/** A push-in on one highlight box of the recording (scene-relative ms). box: [x, y, w, h] fractions of the
 *  recording frame; the card aims the zoom so the whole box stays inside the card (scale capped to fit). */
export type Zoom = { atMs: number; endMs: number; scale: number; box: [number, number, number, number] };

/** A real screen recording (1080x1350, 25 fps). inMs is the source in-point; durationMs (source length)
 *  lets the card freeze on the last frame instead of running out. */
export type Recording = {
  src: string;
  inMs: number;
  playbackRate?: number;
  pushIn?: PushIn;
  durationMs?: number;
  zooms?: Zoom[];
  /** Theme "harvest": vertical alignment of a cover crop (0 top, 0.5 centre, 1 bottom). */
  focusY?: number;
  /** Theme "harvest": fit the width and cut this fraction of the source off the top (the PiP composer). */
  cropTop?: number;
  /** Theme "harvest": boxes of the source ([x, y, w, h] fractions) painted over, e.g. a third-party logo. */
  masks?: { box: [number, number, number, number]; color: string }[];
};

/**
 * chip: white pill(s) (text split on "\n", staggered, optional per-item times in itemsAtMs);
 * bigtext: giant serif display word; arrow: red arrow drops onto the card, then a chip with `text`;
 * stat: giant light-green words sliding up word by word. y is the centre in fractions of the height.
 */
export type Overlay = {
  kind: "chip" | "bigtext" | "arrow" | "stat";
  text: string;
  color?: string;
  y?: number;
  /** bigtext: centre x (fraction of W) and font size (px) placed clear of the face (edit_explainer.place_display_word). */
  x?: number;
  size?: number;
  atMs?: number;
  align?: "left" | "center" | "right";
  itemsAtMs?: number[];
  /** A chip that must stay up longer than its scene (fine print people have to read): scene-relative end. It runs
   *  on over the next scenes (edit_explainer._carry_overlays), moving to each scene's chip line (moves, scene-relative),
   *  and fades out over fadeOutMs when it ends inside a scene. */
  untilMs?: number;
  moves?: { atMs: number; y: number }[];
  fadeOutMs?: number;
};

export type Item = { label: string; sub?: string };

export type Scene = {
  id?: string;
  type: SceneType;
  startMs: number;
  endMs: number;
  recording?: Recording;
  /** Card entrance: "up" slides in from the bottom edge, "in" scales in. Default: "in" after a non-card scene,
   *  an in-card swap after a contiguous card. */
  cardSlide?: "up" | "in";
  overlay?: Overlay;
  /** Static presenter framing for talking-head scenes (alternates on jump cuts). */
  punch?: 1 | 1.06;
  /** The hook pattern interrupt: the avatar drops in upside-down and whips upright. */
  flipIn?: boolean;
  /** ...after hanging upside-down this long (ms after the drop lands). */
  flipHoldMs?: number;
  /** Hook caption centre (fraction of H) while the presenter is inverted: clear of the turned face box
   *  (edit_explainer.flip_caption_y); it rides the drop and eases to the upright line as the whip rights him. */
  flipCaptionY?: number;
  /** Caption system for this scene; defaults by type (avatar: talk, canvas scenes: explainer, endcard: none). */
  system?: CaptionSystem;
  /** Small command chip on the card's top-left edge (e.g. "/yt-script"). */
  label?: string;
  /** Text card tiles (e.g. the eleven commands). */
  items?: Item[];
  /** Spec beat name: explainer caption runs never cross a beat. */
  beat?: string;
  /** End card: the site the tail names ("withhammad.com") and a note ("link in bio"). */
  site?: string;
  siteNote?: string;
  /** Theme "harvest": a designed card (title, logo, stat counter, cost, kinetic type) instead of a recording. */
  card?: HarvestCard;
  /** Theme "harvest": canvas tone behind a full-frame card (dark for dark recordings), and the caption treatment. */
  tone?: "light" | "dark";
  /** Theme "harvest": extra motion on the scene (check: a green square morphs into a check box). */
  fx?: { check?: boolean };
  /** Theme "harvest": caption centre (fraction of H) when the default for the scene type does not fit. */
  captionY?: number;
};

export type HarvestCard =
  | { kind: "title"; text: string; accent?: string }
  | { kind: "logo"; name: string }
  | { kind: "stars"; owner: string; repo: string; about?: string; from: number; to: number; language?: string; license?: string; forks?: string }
  | { kind: "cost"; label: string; value: string; note?: string }
  | { kind: "kinetic"; small: string; big: string };

/** Theme "harvest" caption chunk: up to two lines, each hard-cutting on at startMs (absolute ms). */
export type ChunkLine = { text: string; startMs: number; serif?: boolean; color?: "white" | "teal" | "red" };
export type CaptionChunk = { startMs: number; endMs: number; lines: ChunkLine[] };

export type Word = { text: string; startMs: number; endMs: number; em?: boolean };

/** A curated explainer headline page (spec on_screen_text): up to two lines; each word appears at startMs
 *  (absolute) and is set in the italic serif when italic. Shown in explainer scenes from startMs to endMs. */
export type HeadlineWord = { text: string; startMs: number; italic?: boolean };
export type HeadlinePage = { startMs: number; endMs: number; lines: { italic?: boolean; words: HeadlineWord[] }[] };

/** holdGapMs: word gaps shorter than this stay ducked (no swell between phrases); fadeInMs: bed fade-in. */
export type Music = { src: string; volume?: number; duckTo?: number; fadeOutMs?: number; fadeInMs?: number; holdGapMs?: number };
export type Sfx = { src: string; atMs: number; volume?: number };

/** Comment-composer CTA: types the keyword at atMs, then a notification slides in. */
export type Cta = { keyword: string; atMs: number; handle?: string; reply?: string };

/** faceBox: [x, y, w, h] fractions of the frame where the take's face sits (display words keep clear of it). */
export type FaceBox = [number, number, number, number];
export type AvatarSrc = { src: string; loop?: boolean; faceBox?: FaceBox };
/** durationMs: the take's length; past it the take holds its last frame (e.g. under a longer end card). */
export type TailSrc = { src: string; startMs: number; loop?: boolean; faceBox?: FaceBox; durationMs?: number };

export type ExplainerProps = {
  /** "harvest": the Nate Herk reference format (src/explainer/harvest). Default: the original Explainer look. */
  theme?: "default" | "harvest";
  /** Theme "harvest": caption chunks (edit_explainer.harvest_chunks). */
  chunks?: CaptionChunk[];
  avatar: AvatarSrc;
  tail?: TailSrc | null;
  scenes: Scene[];
  captions: { words: Word[] };
  /** Curated headline pages; explainer runs without any fall back to pages built from the spoken words. */
  headlines?: HeadlinePage[];
  music?: Music | null;
  sfx?: Sfx[];
  cta?: Cta | null;
  /** Defaults to the last scene's end. */
  durationMs?: number;
  /** A missing asset stops the render (calculateMetadata lists them). With this set, missing music/SFX are
   *  dropped instead; the presenter takes and recordings are always required. */
  allowMissingAudio?: boolean;
};

/** Studio placeholder: no scenes, so nothing is required on disk; real renders pass the full props. */
export const defaultExplainer: ExplainerProps = {
  avatar: { src: "" },
  scenes: [],
  captions: { words: [] },
};
