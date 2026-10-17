/**
 * Props for the "Explainer" composition: the reference-matched format (hook flip-in with pink-step captions,
 * white grid canvas + dark recording card, short talking-head breathers, stat pops, comment CTA, end card).
 * Written by studio/app/edit_explainer.py (edit_explainer.json). Every src is relative to remotion/public/.
 * All times are milliseconds on the avatar timeline; overlay/pushIn times are relative to their scene start.
 */

export type CaptionSystem = "hook" | "explainer" | "talk";
export type SceneType = "avatar" | "split" | "card" | "text" | "stat" | "endcard";

/** A Remotion-side callout, scene-relative. mode "content" (default) pushes the camera into the recording;
 *  mode "card" pops the whole card out (scale + orange outline) and leaves the recording at 1.0. */
export type PushIn = { atMs: number; scale: number; originX: number; originY: number; durMs?: number; mode?: "content" | "card" };

/** A push-in on one highlight box of the recording (scene-relative ms). box: [x, y, w, h] fractions of the
 *  recording frame; the card aims the zoom so the whole box stays inside the card (scale capped to fit). */
export type Zoom = { atMs: number; endMs: number; scale: number; box: [number, number, number, number] };

/** A real screen recording (1080x1350, 25 fps). inMs is the source in-point; durationMs (source length)
 *  lets the card freeze on the last frame instead of running out. */
export type Recording = { src: string; inMs: number; playbackRate?: number; pushIn?: PushIn; durationMs?: number; zooms?: Zoom[] };

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
};

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
