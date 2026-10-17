// House-style reel cover ("C1 v2"): one 1080x1920 Still per reel, rendered by studio/app/thumbnail.py.
//
// Crop-safe rule: every word sits inside the centred 1:1 band (y 420-1500) with at least 70 px side margins, so the
// copy survives the Instagram 3:4 profile grid and 1:1 web grid / feed shares, YouTube's 4:5 and 2:3 shelf crops and
// TikTok's 3:4 grid. Nothing essential sits in the bottom 20 % where the Reels/TikTok UI overlays the video.
// Long hooks shrink to fit: the text is measured with the loaded fonts in calculateMetadata (see fitCover).
import React from "react";
import { AbsoluteFill, Img, staticFile, type CalculateMetadataFunction } from "remotion";
import { fontsReady } from "./fonts";

// Same values as BLUE / SANS / SERIF in ./Composition.tsx (not exported there). Keep the two files in sync by hand
// so the cover and the reel's own title cards read as one series.
const BLUE = "#2f6bff";
const SANS = "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif";
const SERIF = "'Instrument Serif', 'New York', 'Iowan Old Style', Palatino, Georgia, 'Times New Roman', serif";

export const COVER_W = 1080;
export const COVER_H = 1920;
export const SAFE_TOP = 420;
export const SAFE_BOTTOM = 1500;
export const SIDE_MARGIN = 70;
const TEXT_W = COVER_W - 2 * SIDE_MARGIN;

// The face frame is extracted at 2x the 720x1280 take (1440x2560) and drawn at faceScale.
export const FACE_W = 1440;
export const FACE_H = 2560;

// Vertical layout, all inside the safe band: kicker chip, hook line, blue pill, then the face from ~y 790
// (HAIR_Y in studio/app/thumbnail.py). The kicker is 42 px so it still reads at 25 % (the approval sheet tiles).
const KICKER = { top: 432, size: 42, padX: 24, padTop: 8, padBottom: 10 };
const HOOK = { top: 510, size: 116, lineHeight: 1.1, tracking: -0.025 };
const PILL = { top: 654, strong: 104, serif: 120, padX: 40, padTop: 2, padBottom: 12, radius: 22 };
// Glyphs such as "T" and "y" overhang their advance width, so the hook is fitted a little narrower than the band.
const HOOK_FIT_W = TEXT_W - 8;

export type CoverFit = { kickerSize: number; hookSize: number; pillScale: number };

export type CoverProps = {
  face: string; // staticFile path (e.g. "job/cover_face_1.png") or an http(s)/data URL
  faceTop: number; // y of the face image's top edge in cover pixels
  faceScale: number; // 0.75 draws the 1440x2560 frame 1080 px wide
  faceShiftX: number; // horizontal nudge that centres the head, in cover pixels
  kicker: string; // small chip above the hook; must be factually accurate (lesson.cover.kicker)
  hook: string; // 1-3 words, Inter 800 (lesson.cover.hook, <= 18 characters)
  pillStrong: string; // "ANY" (Inter 800 inside the blue pill)
  pillSerif: string; // "feature" (Instrument Serif italic inside the blue pill)
  dark: boolean;
  fit?: CoverFit; // filled in by calculateMetadata; estimated when missing (Studio preview)
};

export const coverDefaults: CoverProps = {
  face: "job/cover_face_1.png",
  faceTop: 467,
  faceScale: 0.75,
  faceShiftX: 0,
  kicker: "Open-source REA · MIT licence",
  hook: "Reverse-engineer",
  pillStrong: "ANY",
  pillSerif: "feature",
  dark: false,
};

let canvas: HTMLCanvasElement | null = null;

// Width of `text` at 100 px. Uses the real font metrics once the fonts are loaded; falls back to an average glyph
// width when no DOM is available.
const width100 = (text: string, font: string, fallbackEm: number): number => {
  if (typeof document === "undefined") {
    return text.length * fallbackEm * 100;
  }
  canvas = canvas ?? document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return text.length * fallbackEm * 100;
  }
  ctx.font = font;
  return ctx.measureText(text).width;
};

// Tracking counts between glyphs only: Chrome also adds it after the last glyph, and the hook's span cancels that
// trailing space with a margin (see Cover), so the box is exactly the ink's advance width and centres on it.
const hookWidth100 = (hook: string) =>
  width100(hook, "800 100px Inter", 0.62) + HOOK.tracking * 100 * Math.max(0, hook.length - 1);

const pillWidth = (strong: string, serif: string, scale: number) => {
  const strongW = (width100(strong ? `${strong} ` : "", "800 100px Inter", 0.66) * PILL.strong) / 100;
  const serifW = (width100(serif, "italic 400 100px 'Instrument Serif'", 0.42) * PILL.serif) / 100;
  return 2 * PILL.padX + scale * (strongW + serifW);
};

export const fitCover = (p: CoverProps): CoverFit => {
  const hookSize = Math.min(HOOK.size, Math.floor((HOOK_FIT_W * 100) / Math.max(1, hookWidth100(p.hook))));
  const pillNatural = pillWidth(p.pillStrong, p.pillSerif, 1);
  const pillScale = Math.min(1, (TEXT_W - 2 * PILL.padX) / Math.max(1, pillNatural - 2 * PILL.padX));
  const kickerW = (width100(p.kicker, "600 100px Inter", 0.58) * KICKER.size) / 100;
  const kickerSize = Math.min(KICKER.size, Math.floor((KICKER.size * (TEXT_W - 2 * KICKER.padX)) / Math.max(1, kickerW)));
  return { kickerSize, hookSize, pillScale: Math.floor(pillScale * 1000) / 1000 };
};

export const calculateCoverMetadata: CalculateMetadataFunction<CoverProps> = async ({ props }) => {
  await fontsReady;
  return { props: { ...props, fit: fitCover(props) } };
};

const src = (face: string) => (/^(https?:|data:|blob:)/.test(face) ? face : staticFile(face));

export const Cover: React.FC<CoverProps> = (p) => {
  const fit = p.fit ?? fitCover(p);
  const w = Math.round(FACE_W * p.faceScale);
  const h = Math.round(FACE_H * p.faceScale);
  const ink = p.dark ? "white" : "#111";
  const bg = p.dark
    ? "radial-gradient(130% 70% at 50% 0%, #17223d 0%, #0a0e18 55%, #05070c 100%)"
    : "radial-gradient(120% 80% at 30% 10%, #ffffff 0%, #eef2f6 55%, #e1e7ee 100%)";
  const fade = "linear-gradient(to bottom, transparent 0px, black 380px)";
  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <Img
        src={src(p.face)}
        style={{
          position: "absolute",
          left: (COVER_W - w) / 2 + p.faceShiftX,
          top: p.faceTop,
          width: w,
          height: h,
          WebkitMaskImage: fade,
          maskImage: fade,
        }}
      />
      {p.kicker ? (
        <div style={{ position: "absolute", top: KICKER.top, left: SIDE_MARGIN, width: TEXT_W, display: "flex", justifyContent: "center" }}>
          <div
            style={{
              fontFamily: SANS,
              fontWeight: 600,
              fontSize: fit.kickerSize,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              color: p.dark ? "#111" : "white",
              background: p.dark ? "white" : "#111",
              borderRadius: 12,
              padding: `${KICKER.padTop}px ${KICKER.padX}px ${KICKER.padBottom}px`,
            }}
          >
            {p.kicker}
          </div>
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          top: HOOK.top,
          left: SIDE_MARGIN,
          width: TEXT_W,
          height: HOOK.size * HOOK.lineHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: fit.hookSize,
          lineHeight: HOOK.lineHeight,
          letterSpacing: `${HOOK.tracking}em`,
          whiteSpace: "nowrap",
          color: ink,
          textShadow: p.dark
            ? "0 4px 24px rgba(0,0,0,.6)"
            : "0 0 2px #fff, 0 0 18px rgba(255,255,255,.95), 0 0 36px rgba(255,255,255,.8)",
        }}
      >
        <span style={{ marginRight: `${-HOOK.tracking}em` }}>{p.hook}</span>
      </div>
      <div style={{ position: "absolute", top: PILL.top, left: SIDE_MARGIN, width: TEXT_W, display: "flex", justifyContent: "center" }}>
        <div
          style={{
            background: BLUE,
            borderRadius: PILL.radius,
            padding: `${PILL.padTop}px ${PILL.padX}px ${PILL.padBottom}px`,
            boxShadow: "0 18px 50px rgba(47,107,255,.45)",
            color: "white",
            whiteSpace: "nowrap",
            lineHeight: 1,
          }}
        >
          {p.pillStrong ? (
            <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: PILL.strong * fit.pillScale, letterSpacing: -1 }}>
              {`${p.pillStrong} `}
            </span>
          ) : null}
          <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: PILL.serif * fit.pillScale }}>{p.pillSerif}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- approval sheet

// One row per face pick: the full 9:16 cover and the three crops platforms show in grids and feeds.
const CROPS = [
  { name: "3:4 IG/TikTok grid", top: 240, height: 1440 },
  { name: "4:5 YouTube feed", top: 285, height: 1350 },
  { name: "1:1 IG web / share", top: 420, height: 1080 },
];
const TILE = 0.25;
const SHEET = { margin: 40, gap: 28, header: 70, label: 46, caption: 34, rowGap: 30 };
const TILE_W = COVER_W * TILE;
export const SHEET_W = 2 * SHEET.margin + 4 * TILE_W + 3 * SHEET.gap;
const ROW_H = SHEET.label + COVER_H * TILE + SHEET.caption;

export type CoverSheetProps = { title: string; subtitle: string; items: { label: string; cover: CoverProps }[] };

export const coverSheetDefaults: CoverSheetProps = {
  title: "Cover picks",
  subtitle: 'Reply "cover 2" or "cover 3" to switch',
  items: [1, 2, 3].map((n) => ({ label: `Pick ${n}`, cover: { ...coverDefaults, face: `job/cover_face_${n}.png` } })),
};

export const sheetHeight = (count: number) =>
  2 * SHEET.margin + SHEET.header + count * ROW_H + Math.max(0, count - 1) * SHEET.rowGap;

export const calculateCoverSheetMetadata: CalculateMetadataFunction<CoverSheetProps> = async ({ props }) => {
  await fontsReady;
  const items = props.items.map((item) => ({ ...item, cover: { ...item.cover, fit: fitCover(item.cover) } }));
  return { props: { ...props, items }, width: SHEET_W, height: sheetHeight(Math.max(1, items.length)) };
};

const Tile: React.FC<{ cover: CoverProps; top: number; height: number }> = ({ cover, top, height }) => (
  <div style={{ position: "relative", width: TILE_W, height: height * TILE, overflow: "hidden", borderRadius: 6, boxShadow: "0 0 0 1px #c9d1dc" }}>
    <div style={{ position: "absolute", left: 0, top: -top * TILE, width: COVER_W, height: COVER_H, transform: `scale(${TILE})`, transformOrigin: "0 0" }}>
      <Cover {...cover} />
    </div>
  </div>
);

const oneLine: React.CSSProperties = { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };

export const CoverSheet: React.FC<CoverSheetProps> = ({ title, subtitle, items }) => (
  <AbsoluteFill style={{ background: "#f4f6f9", padding: SHEET.margin, fontFamily: SANS, color: "#111" }}>
    <div style={{ height: SHEET.header }}>
      <div style={{ ...oneLine, fontWeight: 800, fontSize: 34, lineHeight: 1.1 }}>{title}</div>
      <div style={{ ...oneLine, fontWeight: 600, fontSize: 20, marginTop: 4, color: "#444" }}>{subtitle}</div>
    </div>
    {items.map((item, i) => (
      <div key={item.label} style={{ height: ROW_H, marginTop: i ? SHEET.rowGap : 0 }}>
        <div style={{ ...oneLine, height: SHEET.label, fontWeight: 800, fontSize: 28 }}>{item.label}</div>
        <div style={{ display: "flex", gap: SHEET.gap, alignItems: "flex-start" }}>
          {[{ name: "9:16 full cover", top: 0, height: COVER_H }, ...CROPS].map((crop) => (
            <div key={crop.name}>
              <Tile cover={item.cover} top={crop.top} height={crop.height} />
              <div style={{ fontWeight: 600, fontSize: 20, marginTop: 6, color: "#444" }}>{crop.name}</div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </AbsoluteFill>
);
