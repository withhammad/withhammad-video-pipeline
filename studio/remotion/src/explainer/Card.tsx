import { Video } from "@remotion/media";
import { Freeze, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Box, CARD_BG, CARD_INSET, clamp, clampCardScale, EXPO_OUT, FPS, H, IN_OUT, lerp, SANS, toFrame, toMs, zoomAt } from "./theme";
import type { Recording } from "./types";

export type Entrance = "up" | "in" | "swap" | "none";

/** What the previous contiguous card showed last: kept frozen under the incoming recording during a swap. */
export type PrevShot = { rec: Recording; frames: number; zoom: number; origin: string };

/** The content transform (push-in) of a recording at scene-relative ms inside an inner box of iw x ih px:
 *  the highlight zooms when the recording has them, else the legacy content pushIn. */
export const contentZoom = (rec: Recording | undefined, ms: number, iw: number, ih: number) => {
  if (rec?.zooms?.length) {
    const z = zoomAt(rec.zooms, ms, iw, ih);
    return { scale: z.scale, origin: `${z.originX.toFixed(1)}px ${z.originY.toFixed(1)}px` };
  }
  return { scale: pushZoom(rec, ms), origin: pushOrigin(rec) };
};

/** Last source frame the recording can show for this scene (freeze there instead of running out). */
const lastFrame = (rec: Recording) => {
  if (!rec.durationMs) return Infinity;
  const rate = rec.playbackRate ?? 1;
  return Math.max(0, Math.floor(((rec.durationMs - rec.inMs) / 1000) * FPS / rate) - 2);
};

const pushProgress = (rec: Recording | undefined, ms: number) => {
  const push = rec?.pushIn;
  if (!push) return 0;
  return interpolate(ms, [push.atMs, push.atMs + (push.durMs ?? 520)], [0, 1], { ...clamp, easing: IN_OUT });
};

/** The push-in zoom a card's content shows at scene-relative ms (also used to freeze the previous card's last look). */
export const pushZoom = (rec: Recording | undefined, ms: number) => {
  const push = rec?.pushIn;
  if (!push || push.mode === "card") return 1;
  return 1 + (push.scale - 1) * pushProgress(rec, ms);
};

/** The card-level pop ("Remotion pops the box out"): the whole card scales, the recording stays at 1.0. The
 *  scale is clamped so the card never leaves the safe area (x 0.06-0.86W, bottom 0.79H). */
const cardPop = (rec: Recording | undefined, ms: number, box: Box) =>
  rec?.pushIn?.mode === "card" ? 1 + (clampCardScale(box, rec.pushIn.scale) - 1) * pushProgress(rec, ms) : 1;

/** Recording edges fade into the card (a scrolling window), so the 4:5 cover crop never slices a line of text. */
const EDGE_FADE = "linear-gradient(to bottom, transparent 0, #000 18px, #000 calc(100% - 18px), transparent 100%)";
export const pushOrigin = (rec: Recording | undefined) => (rec?.pushIn ? `${rec.pushIn.originX * 100}% ${rec.pushIn.originY * 100}%` : "50% 50%");

export const RecordingVideo: React.FC<{ rec: Recording; holdAt?: number }> = ({ rec, holdAt }) => {
  const frame = useCurrentFrame();
  const last = lastFrame(rec);
  // holdAt: show this scene-relative frame for good (the previous card's final frame under an in-card swap).
  const f = holdAt ?? frame;
  return (
    <Freeze frame={Math.min(f, last)} active={holdAt !== undefined || frame > last}>
      <Video
        src={staticFile(rec.src)}
        trimBefore={toFrame(rec.inMs)}
        playbackRate={rec.playbackRate ?? 1}
        muted
        objectFit="cover"
        style={{ width: "100%", height: "100%" }}
      />
    </Freeze>
  );
};

/** Entrance transform at scene-relative ms. Starts slightly "early" so the cut frame already shows the card moving. */
const entranceStyle = (kind: Entrance, ms: number, box: Box): React.CSSProperties => {
  if (kind === "up") {
    const curve = (m: number) => interpolate(m, [-80, 460], [0, 1], { ...clamp, easing: EXPO_OUT });
    const p = curve(ms);
    const vel = Math.abs(p - curve(ms - 40));
    const blur = Math.min(7, vel * 26);
    return {
      transform: `translateY(${(1 - p) * (H - box.top + 60)}px) scaleY(${1 + Math.min(0.08, vel * 0.35)})`,
      filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined,
    };
  }
  if (kind === "in") {
    const p = interpolate(ms, [-40, 340], [0, 1], { ...clamp, easing: EXPO_OUT });
    const blur = (1 - p) * 9;
    return {
      transform: `scale(${0.86 + 0.14 * p})`,
      opacity: interpolate(ms, [-40, 90], [0, 1], clamp),
      filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined,
    };
  }
  return {};
};

/**
 * The dark rounded UI card holding a real recording. Everything is a function of the scene-relative frame:
 * entrance, optional box morph from the previous card layout, in-card swap and the Remotion push-in.
 */
export const RecordingCard: React.FC<{
  box: Box;
  fromBox?: Box;
  rec?: Recording;
  entrance: Entrance;
  label?: string;
  highlightMs?: number;
  prev?: PrevShot;
  children?: React.ReactNode;
}> = ({ box, fromBox, rec, entrance, label, highlightMs, prev, children }) => {
  const frame = useCurrentFrame();
  const ms = toMs(frame);
  const m = fromBox ? interpolate(ms, [0, 220], [0, 1], { ...clamp, easing: IN_OUT }) : 1;
  const b: Box = fromBox
    ? { left: lerp(fromBox.left, box.left, m), top: lerp(fromBox.top, box.top, m), width: lerp(fromBox.width, box.width, m), height: lerp(fromBox.height, box.height, m) }
    : box;

  const iw = b.width - 2 * CARD_INSET;
  const ih = b.height - 2 * CARD_INSET;
  const zoom = contentZoom(rec, ms, iw, ih);
  // In-card swap: the new recording dissolves in over the previous card's frozen last frame (never an empty card).
  const swapT = entrance === "swap" ? interpolate(ms, [-60, 180], [0, 1], { ...clamp, easing: EXPO_OUT }) : 1;
  const glow = highlightMs !== undefined ? interpolate(ms, [highlightMs, highlightMs + 260], [0, 1], { ...clamp, easing: IN_OUT }) : 0;
  const enter = entranceStyle(entrance, ms, b);
  const pop = cardPop(rec, ms, box);

  return (
    <div
      style={{
        position: "absolute", left: b.left, top: b.top, width: b.width, height: b.height,
        transformOrigin: "50% 50%", ...enter,
        transform: [enter.transform, pop !== 1 ? `scale(${pop.toFixed(4)})` : ""].filter(Boolean).join(" ") || undefined,
      }}
    >
      <div
        style={{
          position: "absolute", inset: 0, borderRadius: 24, overflow: "hidden", background: CARD_BG,
          boxShadow: `0 34px 70px rgba(15,18,30,0.28), 0 6px 18px rgba(15,18,30,0.18), 0 0 0 ${3 * glow}px rgba(242,140,60,${0.95 * glow})`,
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ position: "absolute", inset: CARD_INSET, borderRadius: 12, overflow: "hidden", WebkitMaskImage: EDGE_FADE, maskImage: EDGE_FADE }}>
          {entrance === "swap" && prev && swapT < 1 ? (
            <div style={{ position: "absolute", inset: 0, transform: `scale(${prev.zoom})`, transformOrigin: prev.origin }}>
              <RecordingVideo rec={prev.rec} holdAt={Math.max(0, prev.frames - 1)} />
            </div>
          ) : null}
          {rec ? (
            <div
              style={{
                position: "absolute", inset: 0,
                transform: `scale(${zoom.scale * (1.03 - 0.03 * swapT)})`,
                transformOrigin: zoom.origin,
                opacity: swapT,
              }}
            >
              <RecordingVideo rec={rec} />
            </div>
          ) : null}
        </div>
        {children}
      </div>
      {label ? (
        <div
          style={{
            position: "absolute", left: 18, top: -17, height: 34, padding: "0 14px", borderRadius: 17,
            display: "flex", alignItems: "center", background: "#1d2330", color: "#9ecbff",
            fontFamily: SANS, fontWeight: 600, fontSize: 16, letterSpacing: 0.2,
            boxShadow: "0 6px 16px rgba(10,14,25,0.3)", border: "1px solid rgba(158,203,255,0.25)",
            opacity: interpolate(ms, [60, 200], [0, 1], clamp),
            transform: `translateY(${interpolate(ms, [60, 260], [8, 0], { ...clamp, easing: EXPO_OUT })}px)`,
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};
