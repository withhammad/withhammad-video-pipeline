/**
 * Props for the "Explainer" composition: the reference-matched format (hook flip-in with pink-step captions,
 * white grid canvas + dark recording card, short talking-head breathers, stat pops, comment CTA, end card).
 * Written by studio/app/edit_explainer.py (edit_explainer.json). Every src is relative to remotion/public/.
 * All times are milliseconds on the avatar timeline; overlay/pushIn times are relative to their scene start.
 */

export type CaptionSystem = "hook" | "explainer" | "talk";
export type SceneType = "avatar" | "split" | "card" | "text" | "stat" | "endcard";

/** A slow camera push into the recording (Remotion-side callout zoom), scene-relative. */
export type PushIn = { atMs: number; scale: number; originX: number; originY: number; durMs?: number };

/** A real screen recording (1080x1350, 25 fps). inMs is the source in-point; durationMs (source length)
 *  lets the card freeze on the last frame instead of running out. */
export type Recording = { src: string; inMs: number; playbackRate?: number; pushIn?: PushIn; durationMs?: number };

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
  /** Caption system for this scene; defaults by type (avatar: talk, canvas scenes: explainer, endcard: none). */
  system?: CaptionSystem;
  /** Small command chip on the card's top-left edge (e.g. "/yt-script"). */
  label?: string;
  /** Text card tiles (e.g. the eleven commands). */
  items?: Item[];
};

export type Word = { text: string; startMs: number; endMs: number; em?: boolean };

export type Music = { src: string; volume?: number; duckTo?: number; fadeOutMs?: number };
export type Sfx = { src: string; atMs: number; volume?: number };

/** Comment-composer CTA: types the keyword at atMs, then a notification slides in. */
export type Cta = { keyword: string; atMs: number; handle?: string; reply?: string };

export type AvatarSrc = { src: string; loop?: boolean };
export type TailSrc = { src: string; startMs: number; loop?: boolean };

export type ExplainerProps = {
  avatar: AvatarSrc;
  tail?: TailSrc | null;
  scenes: Scene[];
  captions: { words: Word[] };
  music?: Music | null;
  sfx?: Sfx[];
  cta?: Cta | null;
  /** Defaults to the last scene's end. */
  durationMs?: number;
};

export const defaultExplainer: ExplainerProps = {
  avatar: { src: "job/avatar_main.mp4" },
  scenes: [{ type: "avatar", startMs: 0, endMs: 3000, flipIn: true, system: "hook" }],
  captions: { words: [] },
};
