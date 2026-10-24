// WITHHAMMAD visual system, locked from the two latest click-first covers (2026-10-24):
//   Kimi K3 pick 3  (src/kimi/Covers.tsx)  -> variant "card": blurred scene, presenter card, head pops out, hook above
//   SkillSpector    (src/skill/Covers.tsx) -> variant "dark": teal glow on near-black, binary rain, logo on top,
//                                              tilted product tiles, cut-out face, hook below
// Every cover, thumbnail and carousel slide pulls its colours, type and safe zones from here.

export const CANVAS = {
  reel: {width: 1080, height: 1920},       // 9:16 cover / thumbnail (Reels, Shorts, TikTok, FB)
  carousel: {width: 1080, height: 1350},   // 4:5 Instagram carousel + LinkedIn document page
} as const;

export const COLOR = {
  ink: '#090A0A',          // dark-variant base (Skill cover)
  navy: '#06122E',         // card-variant base (Kimi cover)
  glow: '#0E3B44',         // teal radial centre
  glowMid: '#0A1F24',
  mint: '#5FE1D6',         // binary rain
  teal: '#2DD4BF',         // light bars, positive state
  white: '#FFFFFF',
  dim: 'rgba(255,255,255,.72)',
  faint: 'rgba(255,255,255,.45)',
  panel: '#121718',        // carousel cards on the dark background
  panelLine: 'rgba(95,225,214,.18)',
  boxDark: '#1E1E1E',      // Kimi line-1 box
  red: '#FF3231',          // accent box (Skill)
  orange: '#D0602C',       // accent box (Kimi)
  green: '#30A46C',
  amber: '#F5B300',
} as const;

export type AccentName = 'red' | 'orange';
export const ACCENT: Record<AccentName, string> = {red: COLOR.red, orange: COLOR.orange};

export const FONT = {
  sans: 'BrInter, Arial, sans-serif',              // Inter 600/800/900 (OFL)
  serif: 'BrSerif, Georgia, serif',                // Instrument Serif italic (OFL)
  display: 'BrArchivo, BrInter, Arial, sans-serif',// Archivo Black (OFL), for giant stats
  dots: 'BrDoto, Menlo, monospace',                // Doto (OFL), binary rain only
  mono: 'Menlo, "SF Mono", Monaco, monospace',     // terminal snippets (system mono; no OFL mono vendored)
} as const;

// Type scale (px at 1080 wide). Hook sizes are the covers' measured sizes; fit() only ever shrinks them.
export const TYPE = {
  hook: {size: 116, weight: 900, tracking: -2},         // both covers' line size
  hookBig: {size: 128, weight: 900, tracking: -2},      // Kimi line 2
  hookSmall: {size: 106, weight: 900, tracking: -2},    // Kimi line 1
  slideTitle: {size: 84, weight: 900, tracking: -1.5},
  slideBody: {size: 40, weight: 600, tracking: 0, lineHeight: 1.3},
  stat: {size: 300, tracking: -8},
  kicker: {size: 28, weight: 800, tracking: 6},
  brand: {size: 22, weight: 800, tracking: 6},
} as const;

export const SPACE = {xs: 8, s: 16, m: 24, l: 40, xl: 64, xxl: 96} as const;
export const RADIUS = {box: 16, card: 44, tile: 80, panel: 28, pill: 999} as const;
export const SHADOW = {
  text: '0 6px 20px rgba(0,0,0,.7)',
  tile: 'drop-shadow(0 20px 40px rgba(0,0,0,.6))',
  card: '0 24px 60px rgba(0,0,0,.45)',
} as const;

// Crop guides on the 1080x1920 cover (y ranges, full width unless noted).
// IG profile grid shows 3:4, the feed 4:5, X/FB/older grids 1:1; TikTok and Shorts lay UI over the bottom and right.
export const CROPS_9x16 = {
  grid3x4: {x: 0, y: 240, w: 1080, h: 1440},
  feed4x5: {x: 0, y: 284, w: 1080, h: 1350},
  square: {x: 0, y: 420, w: 1080, h: 1080},
} as const;
// Rules: the whole head and BOTH hook lines live inside CORE (the 1:1 window, which sits inside every other crop and
// above the TikTok/Shorts caption stack). Logos live inside BRAND_ZONE (the 4:5 window) and are best inside CORE.
export const SAFE_9x16 = {
  core: {x: 40, y: 430, w: 1000, h: 1065},     // y 430-1495
  brandZone: {x: 40, y: 284, w: 1000, h: 1352},
  rightRail: {x: 960, y: 900, w: 120, h: 700}, // TikTok/Shorts buttons: keep text out, decoration may pass under
} as const;

// Carousel 1080x1350: the IG profile grid shows the centred 3:4 (x 34-1046); keep everything 80 px in.
export const SAFE_4x5 = {x: 80, y: 80, w: 920, h: 1190, grid3x4: {x: 34, y: 0, w: 1012, h: 1350}} as const;

// Hook copy limits that keep the type big: line 1 <= 16 chars, line 2 <= 14 chars (longer lines get shrunk).
export const HOOK_LIMITS = {line1: 16, line2: 14, maxWidth: 1000} as const;

// "glow" variant (owner rule 2026-10-24, one fixed template for every reel cover, like a uniform creator grid):
// dark navy + electric-blue radial glow, line 1 huge white, line 2 white in a glowing electric-blue pill,
// the SAME pointing pose every time (public/glow/pose-B-cut.png), two tilted logo tiles beside the head, each glowing
// in its logo's colour. Everything that matters sits inside the 3:4 grid crop (y 240-1680).
export const GLOW = {
  base: '#030918',
  deep: '#061436',
  mid: '#0B2A78',
  core: '#1653D6',
  electric: '#2F8CFF',
  pillTop: '#3E93FF',
  pillBottom: '#1159E6',
  pillEdge: '#9CCBFF',
  // The pose cut-out (1072x1920 RGBA, edge fades baked in) and where it sits on the 1080x1920 canvas.
  pose: {src: 'glow/pose-B-cut.png', srcWidth: 1072, srcHeight: 1920, scale: 0.72, top: 582},
  line1: {size: 176, maxWidth: 1010, top: 300},
  line2: {size: 132, maxWidth: 1000},
  tile: {size: 296, radius: 74, leftX: 30, rightX: 754, y: 778, rotate: 9},
} as const;
