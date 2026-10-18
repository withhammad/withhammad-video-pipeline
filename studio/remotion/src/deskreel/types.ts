/**
 * Props for the "DeskReel" composition: a SILENT desk b-roll reel (the techwithprateek format, reference jobs
 * 6cff0a62569f and 6f8f4ad316a3) built from animated STILLS of the owner's avatar instead of a filmed presenter:
 * hard 1-frame pose swaps fake the fast-motion presenter, a per-shot camera adds the landing whip, the settle drift
 * and the mid-shot sag, and every overlay hard-cuts on and off (typewriter and fade only where specified).
 *
 * Written by studio/app/edit_deskreel.py (<job>/edit_deskreel.props.json). Every src is relative to remotion/public/.
 * Every time is ABSOLUTE milliseconds on the reel timeline. Positions (x, y, w, h) are % of the frame (x from the
 * left, y from the top, top-left corner of the box); every px value is at the 720 px wide frame.
 * An item with [startMs, endMs) is on screen on frame f when toFrame(startMs) <= f < toFrame(endMs).
 */

/** Alignment of one still on the shot's static background (app.edit_deskreel align): applied about the frame
 *  centre to the cover-fitted still, before the camera. dx/dy px, rot degrees. */
export type StillFit = { scale?: number; dx?: number; dy?: number; rot?: number };
export type Still = { id: string; src: string; fit?: StillFit };

/** A hard 1-frame swap to `still` (a Still id) for [startMs, endMs). Poses cover the whole reel without gaps. */
export type Pose = { startMs: number; endMs: number; still: string };

/** Named easings (cubic beziers, deskreel/camera.ts) or a custom [x1, y1, x2, y2]; "hold" jumps at the key. */
export type EaseName = "linear" | "easeIn" | "easeOut" | "easeInOut" | "expoOut" | "hold";
export type Ease = EaseName | [number, number, number, number];

/** A camera key. Missing fields carry over from the previous key (defaults 0 / scale 1). x/y px (positive moves the
 *  picture right/down), scale multiplies the cover fit, rot degrees (positive clockwise), blurPx motion blur
 *  (blurAxis "x" | "y" streaks along that axis; "motion" streaks along the camera's travel on that frame, keys plus
 *  shake, so a diagonal whip smears diagonally; "xy" is a plain defocus). `ease` shapes the segment ARRIVING at
 *  this key. */
export type BlurAxis = "xy" | "x" | "y" | "motion";

export type CameraKey = {
  ms: number;
  x?: number;
  y?: number;
  scale?: number;
  rot?: number;
  blurPx?: number;
  blurAxis?: BlurAxis;
  ease?: Ease;
};

/** Decaying handheld shake: smooth noise of ampPx / rotDeg at freqHz, envelope exp(-t / decayMs) from startMs
 *  (default the shot start). Deterministic per seed. */
export type Shake = { ampPx: number; rotDeg?: number; decayMs: number; seed?: number; freqHz?: number; startMs?: number };

/** One camera shot. Shots never overlap; a shot change is a hard cut (the transform jumps on that frame). */
export type CameraShot = { startMs: number; endMs: number; keys: CameraKey[]; shake?: Shake };

export type FontFamily = "Archivo Black" | "Titan One" | "Lilita One" | "Comfortaa" | "Source Serif 4" | "Inter" | "Instrument Serif";

/** One line of a text block. size: font px. stroke: an OUTER outline px wide. shadow: a hard (0 blur) drop shadow
 *  of the outlined text, dx/dy px (the references use dx -3, dy 3). softShadow: a blurred shadow. */
export type TextLine = {
  text: string;
  font: FontFamily;
  weight?: number;
  italic?: boolean;
  size: number;
  fill: string;
  stroke?: { px: number; color: string };
  shadow?: { dx: number; dy: number; color: string };
  softShadow?: { blur: number; color: string; dx?: number; dy?: number };
  /** em, default 1.15 */
  lineHeight?: number;
  /** px between letters */
  letterSpacing?: number;
};

/** How a text block appears. typewriter: charTimesMs holds one absolute time per CHARACTER of the block (all lines
 *  in order, newlines excluded, spaces included), where a character is a grapheme cluster (Intl.Segmenter; an emoji
 *  with its modifiers or a ZWJ sequence is one); each is revealed IN PLACE on the final laid-out line (never
 *  re-centred while typing). edit_deskreel expands {msPerChar, startMs} into charTimesMs. */
export type Appear = { mode: "hard" } | { mode: "typewriter"; charTimesMs: number[] };

type Timed = { id?: string; startMs: number; endMs: number; z?: number };

export type TextOverlay = Timed & {
  type: "text";
  x: number;
  y: number;
  w: number;
  align?: "left" | "center" | "right";
  lines: TextLine[];
  appear?: Appear;
  /** Linear opacity fade from 1 to 0 across [startMs, endMs] (inside the overlay's window, at least one frame). */
  fadeOut?: { startMs: number; endMs: number };
};

/** White (or tinted) rectangle with square corners and a TEXT wordmark in our font (never a logo image). */
export type ChipOverlay = Timed & {
  type: "chip";
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  fill?: string;
  color?: string;
  font?: FontFamily;
  weight?: number;
  size?: number;
  letterSpacing?: number;
};

/** One state of an inset: a muted video from startFromMs (hold: freeze that frame, the "thumbnail" state) or an
 *  image (.png/.jpg). durationMs (probed by edit_deskreel) lets the video hold its last frame instead of running out. */
export type InsetSource = { src: string; startFromMs?: number; hold?: boolean; durationMs?: number; focusY?: number };

/** A 16:9 (aspect) card inside a black frame of top/side/bottom px, square corners, no shadow. swaps change the
 *  source at atMs (hard cut): "thumbnail then playing" is a hold state followed by a playing swap. */
export type InsetOverlay = Timed & {
  type: "inset";
  x: number;
  y: number;
  w: number;
  aspect?: number;
  frame?: { top: number; side: number; bottom: number; color?: string };
  source: InsetSource;
  swaps?: (InsetSource & { atMs: number })[];
};

/** Our own stat card: white box, serif headline ("\n" breaks lines), optional dek and a source line (defaults:
 *  headline 22 px, dek and source 14 px, the smallest that survives a phone screen and an Instagram re-encode). */
export type StatCardOverlay = Timed & {
  type: "statcard";
  x: number;
  y: number;
  w: number;
  headline: string;
  dek?: string;
  source?: string;
  align?: "left" | "center";
  headlineSize?: number;
  headlineColor?: string;
  italic?: boolean;
  dekSize?: number;
  sourceSize?: number;
  padding?: number;
  fill?: string;
};

export type ImageOverlay = Timed & { type: "image"; x: number; y: number; w: number; h?: number; src: string; fit?: "cover" | "contain" };

export type Overlay = TextOverlay | ChipOverlay | InsetOverlay | StatCardOverlay | ImageOverlay;

export type Music = { src: string; volume?: number; fadeInMs?: number; fadeOutMs?: number };
export type Sfx = { src: string; atMs: number; volume?: number };

/** Applied to the still layer only (overlays stay crisp, like an edit made on top of phone footage). grain 0-1
 *  (animated sensor grain, coarse enough to survive H.264), vignette 0-1, warmth -1 (cool) to 1 (warm), soften 0-2
 *  px (a blur that brings an AI still's detail down to phone-footage sharpness). */
export type Grade = { grain?: number; vignette?: number; warmth?: number; soften?: number };

export type DeskReelProps = {
  durationMs: number;
  stills: Still[];
  poses: Pose[];
  camera: CameraShot[];
  overlays: Overlay[];
  music?: Music | null;
  sfx?: Sfx[];
  grade?: Grade;
  /** Missing music/SFX are dropped instead of stopping the render (stills and inset sources are always required). */
  allowMissingAudio?: boolean;
};

/** Studio placeholder: nothing on disk is required. */
export const defaultDeskReel: DeskReelProps = { durationMs: 1000, stills: [], poses: [], camera: [], overlays: [] };
