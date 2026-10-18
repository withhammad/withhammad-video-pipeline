import { Video } from "@remotion/media";
import { Freeze, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, EXPO_OUT, H, SANS, toMs, W } from "../theme";
import type { Cta } from "../types";

/**
 * The reference's CTA (scene 24), inside a Sequence starting at cta.atMs on the close-up: a comment composer at
 * 0.62-0.68H (round avatar, an opaque charcoal pill with a light rim typing the keyword, a wide glowing purple send
 * pill), a large pixel-art hand taps send, then an iOS-style notification "<handle> / <reply> / now" replaces it in
 * the same spot. Sizes were measured on the reference at 720 w (42.3 s): pill ~90 px tall, keyword cap height
 * ~39 px (~1/3 of the width), send ~112x64, hand ~75 px. Our own app icon and hand drawing, no third-party logo.
 * Times match edit_explainer.CTA_TAP_MS / CTA_NOTIF_MS (the tap and notification SFX).
 */
const TYPE_START_MS = 120;
const CHAR_MS = 70;
const TAP_MS = 900;
const NOTIF_MS = 1100;

const CY = Math.round(H * 0.652);
const ROW_H = 90;
const AV_D = 96;
const AV_LEFT = 34;
const PILL_L = 140;
const PILL_R = 652;
const SEND_W = 112;
const SEND_H = 64;
const SEND_CX = PILL_R - 14 - SEND_W / 2;
const KEY_SIZE = 54;               // Inter 500: cap height ~39 px
const CELL = 4;                    // pixel-art hand: one bitmap cell = 4 px (~76 px tall)

/** Our own pixel-art pointing hand (black outline, white fill), drawn cell by cell; hotspot = the fingertip. */
const HAND = [
  "....XX..........",
  "...XooX.........",
  "...XooX.........",
  "...XooX.........",
  "...XooX.........",
  "...XooXXX.......",
  "...XooXooXX.....",
  "...XooXooXoXX...",
  ".XXXooXooXoXoX..",
  "XooXooooooooooX.",
  "XoooXooooooooooX",
  ".XoooooooooooooX",
  "..XooooooooooooX",
  "..XoooooooooooX.",
  "...XooooooooooX.",
  "...XoooooooooX..",
  "....XooooooooX..",
  "....XooooooooX..",
  "....XXXXXXXXXX..",
];
const HAND_TIP_X = 4.5 * CELL;

const Hand: React.FC<{ x: number; y: number; press: number }> = ({ x, y, press }) => (
  <svg
    width={16 * CELL}
    height={HAND.length * CELL}
    shapeRendering="crispEdges"
    style={{
      position: "absolute", left: x - HAND_TIP_X, top: y, transform: `scale(${(1 - 0.1 * press).toFixed(3)})`, transformOrigin: `${HAND_TIP_X}px 0px`,
      filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.35))",
    }}
  >
    {HAND.flatMap((row, r) =>
      row.split("").map((c, k) =>
        c === "." ? null : <rect key={`${r}-${k}`} x={k * CELL} y={r * CELL} width={CELL} height={CELL} fill={c === "X" ? "#0B0B0B" : "white"} />,
      ),
    )}
  </svg>
);

export const HarvestCta: React.FC<{ cta: Cta; avatarSrc: string }> = ({ cta, avatarSrc }) => {
  const frame = useCurrentFrame();
  const ms = toMs(frame);
  const kw = cta.keyword;
  const n = Math.max(0, Math.min(kw.length, Math.floor((ms - TYPE_START_MS) / CHAR_MS) + 1));
  const typed = ms < TYPE_START_MS ? "" : kw.slice(0, n);
  const composer = ms < NOTIF_MS;
  const handIn = interpolate(ms, [380, 820], [0, 1], { ...clamp, easing: EXPO_OUT });
  const press = interpolate(ms, [TAP_MS - 40, TAP_MS + 40, TAP_MS + 160], [0, 1, 0], clamp);
  const hx = interpolate(handIn, [0, 1], [SEND_CX + 90, SEND_CX + 6]);
  const hy = interpolate(handIn, [0, 1], [CY + 170, CY + 8]);
  const notif = interpolate(ms, [NOTIF_MS, NOTIF_MS + 240], [0, 1], { ...clamp, easing: EXPO_OUT });
  const top = CY - ROW_H / 2;
  return (
    <>
      {composer ? (
        <div style={{ position: "absolute", left: 0, top, width: W, height: ROW_H }}>
          <div
            style={{
              position: "absolute", left: AV_LEFT, top: (ROW_H - AV_D) / 2, width: AV_D, height: AV_D, borderRadius: AV_D / 2, overflow: "hidden",
              border: "3px solid white", boxSizing: "border-box", background: "#222", boxShadow: "0 8px 22px rgba(0,0,0,0.35)",
            }}
          >
            {/* The presenter's own face, frozen: a 0.2x copy of the take, head and shoulders in the circle. */}
            <div style={{ position: "absolute", left: AV_D / 2 - 3 - 72, top: AV_D / 2 - 6 - 76, width: 144, height: 256 }}>
              <Freeze frame={50}>
                <Video src={staticFile(avatarSrc)} muted objectFit="cover" style={{ width: "100%", height: "100%" }} />
              </Freeze>
            </div>
          </div>
          <div
            style={{
              position: "absolute", left: PILL_L, top: 0, width: PILL_R - PILL_L, height: ROW_H, borderRadius: ROW_H / 2, boxSizing: "border-box",
              background: "linear-gradient(180deg, #36363D 0%, #26262C 100%)", border: "2px solid rgba(255,255,255,0.24)",
              boxShadow: "0 14px 34px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.08)", display: "flex", alignItems: "center", padding: "0 0 0 38px",
            }}
          >
            <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: KEY_SIZE, lineHeight: 1, color: "white", letterSpacing: 1.5, whiteSpace: "nowrap" }}>{typed}</span>
            {ms >= TYPE_START_MS && n < kw.length ? <span style={{ width: 4, height: 46, marginLeft: 4, background: "white", opacity: 0.9 }} /> : null}
          </div>
          <div
            style={{
              position: "absolute", left: SEND_CX - SEND_W / 2, top: (ROW_H - SEND_H) / 2, width: SEND_W, height: SEND_H, borderRadius: SEND_H / 2,
              background: "linear-gradient(180deg, #8A7DFF 0%, #7064F4 52%, #5B4DE6 100%)",
              boxShadow: "0 0 24px rgba(112,100,244,0.75), 0 6px 16px rgba(56,40,200,0.45), inset 0 2px 0 rgba(255,255,255,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${(1 - 0.1 * press).toFixed(3)})`,
            }}
          >
            <svg width={40} height={40} viewBox="0 0 24 24">
              <path d="M12 19.5V5 M5 11.5L12 4.5l7 7" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {handIn > 0 ? <Hand x={hx} y={hy - top} press={press} /> : null}
        </div>
      ) : null}
      {notif > 0 ? (
        <div
          style={{
            position: "absolute", left: 40, width: W - 80, top: CY - 52, height: 104, borderRadius: 28, boxSizing: "border-box",
            background: "linear-gradient(90deg, rgba(60,42,56,0.95) 0%, rgba(98,30,66,0.95) 55%, rgba(124,24,74,0.95) 100%)",
            border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 16px 38px rgba(0,0,0,0.35)", display: "flex", alignItems: "center", gap: 18, padding: "0 24px",
            opacity: notif, transform: `translateY(${((1 - notif) * -22).toFixed(2)}px) scale(${(0.96 + 0.04 * notif).toFixed(4)})`,
          }}
        >
          <div
            style={{
              width: 62, height: 62, borderRadius: 16, flexShrink: 0, background: "linear-gradient(135deg,#11E2C0,#0E7C6B)", display: "flex", alignItems: "center",
              justifyContent: "center", color: "white", fontFamily: SANS, fontWeight: 800, fontSize: 24, letterSpacing: -0.5,
            }}
          >
            wh
          </div>
          <div style={{ flex: 1, fontFamily: SANS, color: "white", lineHeight: 1.22 }}>
            <div style={{ fontWeight: 800, fontSize: 27 }}>{cta.handle ?? "with.hammad"}</div>
            <div style={{ fontWeight: 500, fontSize: 25, opacity: 0.94 }}>{cta.reply ?? "Here you go!"}</div>
          </div>
          <div style={{ alignSelf: "flex-start", marginTop: 18, fontFamily: SANS, fontWeight: 500, fontSize: 19, color: "rgba(255,255,255,0.62)" }}>now</div>
        </div>
      ) : null}
    </>
  );
};
