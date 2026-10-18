import { H, W } from "../theme";
import type { Scene } from "../types";

/**
 * Theme "harvest": the Nate Herk reference format (job f7da978d101e, analysis/visual.md), on the 720x1280 canvas.
 * Every number below was read off the reference frames (analysis/sheets, analysis/scenes).
 */

/** Split screen: the card/recording fills the top 46%, the presenter (chest-up) the bottom 54%; hard seam. */
export const SPLIT_Y = Math.round(H * 0.46);
/** The take moves down this far under a split so the head sits just below the seam, eyes at ~0.62H. */
export const SPLIT_SHIFT = Math.round(H * 0.33);

/** Full-frame talking heads are punch-ins (the reference's close-ups are tighter than its split framing);
 *  consecutive close-ups alternate between the two so every return to the face reads as a new shot. */
export const CLOSE_UP: [number, number] = [1.18, 1.27];
export const FACE_ORIGIN = "50% 30%";

/** PiP over the composer: 0.28-0.72W x 0.035-0.34H with a 4 px mint border (scene 9). */
export const PIP = { left: 202, top: 45, width: 316, height: 392, radius: 16, border: 4, color: "#22FFCB" };
/** The take inside the PiP: scaled to 0.6 and centred, the window starting at 3.5% of the frame (head + mic). */
export const PIP_SCALE = 0.6;
export const PIP_TX = PIP.left + PIP.width / 2 - (PIP_SCALE * W) / 2;
export const PIP_TY = PIP.top - PIP_SCALE * H * 0.035;
/** The composer recording starts under the PiP. */
export const PIP_REC_TOP = Math.round(H * 0.36);

/** Full-frame recordings: a plain card on a plain canvas (scenes 6, 12), 4:5 like the recordings. */
export const CARD = { left: 20, top: 196, width: 680, height: 850, radius: 22 };

export const LIGHT_BG = "#F5F4F1";
export const DARK_BG = "#1C1C1E";
export const PAPER = "#FCFBFA";
export const PIP_BG = "#FBFAF7";

// Caption system (visual.md section 4).
export const CAP_SANS = 44;
export const CAP_SERIF = 54;
export const CAP_MAX_W = Math.round(W * 0.66);
export const TEAL = "#11E2C0";
export const TEAL_SERIF = "#17DDBA";
export const RED = "#E10006";
/** The money line: the reference's red lifted to ~5:1 on near-black (#E10006 is ~3.8:1 there), with a thin light
 *  glow over video so it holds on the dark seam and dark hair. */
export const RED_ON_VIDEO = "#FF2B2B";
export const RED_GLOW = "0 0 1px rgba(255,255,255,0.9), 0 0 7px rgba(255,255,255,0.4)";
export const PILL_LIGHT = "rgba(58,58,58,0.88)";
/** Over a dark recording (code on #0d1117) a near-black pill vanished into the page: opaque black with a light rim,
 *  on a soft darkening band, so the page's text never runs through the caption. */
export const PILL_DARK = "rgba(0,0,0,0.92)";
export const PILL_DARK_RIM = "0 0 0 1.5px rgba(255,255,255,0.2)";
export const DARK_SCRIM = "rgba(0,0,0,0.42)";
export const CAP_SHADOW = "0 2px 4px rgba(0,0,0,0.6), 0 0 2px rgba(0,0,0,0.4)";

/** Caption centre (fraction of H) per scene: on the seam for splits, on the chest for close-ups, under the card
 *  over UI, mid-frame over a full-bleed screen (the reference's scene 2 pill at ~0.50H); null where the reference
 *  shows none (the typed prompt, the logo card). */
export const captionYOf = (s: Scene): number | null => {
  if (s.type === "pip" || s.type === "endcard") return null;
  if (s.captionY !== undefined) return s.captionY;
  if (s.bleed) return 0.5;
  if (s.type === "split") return 0.46;
  if (s.type === "avatar") return 0.58;
  if (s.card?.kind === "logo") return null;
  if (s.type === "text" || s.type === "stat") return 0.62;
  return 0.7;
};

/** Over UI the reference puts each caption line on a dark pill; over video (and dark splits) only a soft shadow.
 *  scene.pill overrides it (a dark split over dense page text takes the opaque dark pill, like the reference's
 *  scene 10). */
export const captionPill = (s: Scene): string | null => {
  if (s.pill === "none") return null;
  if (s.pill === "dark") return PILL_DARK;
  if (s.pill === "light") return PILL_LIGHT;
  if (s.type === "avatar") return null;
  if (s.type === "split") return s.tone === "dark" ? null : PILL_LIGHT;
  return s.tone === "dark" ? PILL_DARK : PILL_LIGHT;
};

/** Index of a talking-head scene among the talking heads before it (close-up alternation). */
export const closeUpScale = (scenes: Scene[], idx: number) => {
  let n = 0;
  for (let i = 0; i < idx; i++) if (scenes[i].type === "avatar") n++;
  const flip = scenes[idx]?.punch === 1.06 ? 1 : 0;
  return CLOSE_UP[(n + flip) % 2];
};
