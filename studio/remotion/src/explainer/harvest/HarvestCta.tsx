import { Video } from "@remotion/media";
import { Freeze, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, EXPO_OUT, H, SANS, toMs, W } from "../theme";
import type { Cta } from "../types";

/**
 * The reference's CTA (scene 24), inside a Sequence starting at cta.atMs on the close-up: a comment composer at
 * 0.62-0.68H (round avatar, dark translucent pill typing the keyword, purple send button), a hand cursor taps send,
 * then an iOS-style notification "<handle> / <reply> / now" replaces it in the same spot. Our own app icon, no
 * third-party logo. Times match edit_explainer.CTA_TAP_MS / CTA_NOTIF_MS (the tap and notification SFX).
 */
const TYPE_START_MS = 120;
const CHAR_MS = 70;
const TAP_MS = 900;
const NOTIF_MS = 1100;

const CY = Math.round(H * 0.65);
const ROW_H = 64;
const PILL_L = 112;
const PILL_R = 640;
const SEND = 48;
const SEND_CX = PILL_R - 8 - SEND / 2;

/** A plain white pointing hand with a dark outline (our own drawing). */
const Hand: React.FC<{ x: number; y: number; press: number }> = ({ x, y, press }) => (
  <svg width={46} height={56} viewBox="0 0 23 28" style={{ position: "absolute", left: x - 9, top: y - 3, transform: `scale(${(1 - 0.12 * press).toFixed(3)})`, transformOrigin: "9px 3px" }}>
    <path
      d="M8 1.5c1.2 0 2 .9 2 2v8.2l.6-.1c.9-.1 1.6.3 1.9 1l.4-.1c.9-.1 1.7.3 2 1.1l.5-.1c1-.1 1.9.5 2 1.5l.6 4.4c.3 2.6-1 5.1-3.3 6.3l-.6.3c-1.6.8-3.5.8-5 0-1.3-.7-2.4-1.7-3.1-3L3 17.6c-.5-.9-.2-2 .7-2.5.8-.4 1.8-.2 2.3.5L6 16V3.5c0-1.1.9-2 2-2z"
      fill="white"
      stroke="#111"
      strokeWidth={1.3}
      strokeLinejoin="round"
    />
  </svg>
);

export const HarvestCta: React.FC<{ cta: Cta; avatarSrc: string }> = ({ cta, avatarSrc }) => {
  const frame = useCurrentFrame();
  const ms = toMs(frame);
  const kw = cta.keyword;
  const n = Math.max(0, Math.min(kw.length, Math.floor((ms - TYPE_START_MS) / CHAR_MS) + 1));
  const typed = ms < TYPE_START_MS ? "" : kw.slice(0, n);
  const composer = ms < NOTIF_MS;
  const handIn = interpolate(ms, [420, 840], [0, 1], { ...clamp, easing: EXPO_OUT });
  const press = interpolate(ms, [TAP_MS - 40, TAP_MS + 40, TAP_MS + 160], [0, 1, 0], clamp);
  const hx = interpolate(handIn, [0, 1], [SEND_CX + 70, SEND_CX + 4]);
  const hy = interpolate(handIn, [0, 1], [CY + 150, CY + 6]);
  const notif = interpolate(ms, [NOTIF_MS, NOTIF_MS + 240], [0, 1], { ...clamp, easing: EXPO_OUT });
  return (
    <>
      {composer ? (
        <div style={{ position: "absolute", left: 0, top: CY - ROW_H / 2, width: W, height: ROW_H }}>
          <div style={{ position: "absolute", left: 30, top: 0, width: ROW_H, height: ROW_H, borderRadius: ROW_H / 2, overflow: "hidden", border: "2px solid rgba(255,255,255,0.85)", background: "#222" }}>
            {/* The presenter's own face, frozen: a 0.2x copy of the take with the face in the circle. */}
            <div style={{ position: "absolute", left: ROW_H / 2 - 72, top: ROW_H / 2 - 77, width: 144, height: 256 }}>
              <Freeze frame={50}>
                <Video src={staticFile(avatarSrc)} muted objectFit="cover" style={{ width: "100%", height: "100%" }} />
              </Freeze>
            </div>
          </div>
          <div
            style={{
              position: "absolute", left: PILL_L, top: 0, width: PILL_R - PILL_L, height: ROW_H, borderRadius: ROW_H / 2, background: "rgba(24,24,28,0.74)",
              border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 10px 30px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", padding: "0 0 0 28px",
            }}
          >
            <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 30, color: "white", letterSpacing: 1.2, whiteSpace: "nowrap" }}>{typed}</span>
            {ms >= TYPE_START_MS && n < kw.length ? <span style={{ width: 3, height: 32, marginLeft: 3, background: "white", opacity: 0.9 }} /> : null}
          </div>
          <div
            style={{
              position: "absolute", left: SEND_CX - SEND / 2, top: (ROW_H - SEND) / 2, width: SEND, height: SEND, borderRadius: SEND / 2, background: "#7064F4",
              display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${(1 - 0.14 * press).toFixed(3)})`,
            }}
          >
            <svg width={24} height={24} viewBox="0 0 24 24">
              <path d="M12 19V5 M5.5 11.5L12 5l6.5 6.5" fill="none" stroke="white" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {handIn > 0 ? <Hand x={hx} y={hy - (CY - ROW_H / 2)} press={press} /> : null}
        </div>
      ) : null}
      {notif > 0 ? (
        <div
          style={{
            position: "absolute", left: 40, width: W - 80, top: CY - 44, height: 88, borderRadius: 24, background: "rgba(92,26,58,0.86)",
            border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 14px 36px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", gap: 16, padding: "0 22px",
            opacity: notif, transform: `translateY(${((1 - notif) * -22).toFixed(2)}px) scale(${(0.96 + 0.04 * notif).toFixed(4)})`,
          }}
        >
          <div
            style={{
              width: 50, height: 50, borderRadius: 13, flexShrink: 0, background: "linear-gradient(135deg,#11E2C0,#0E7C6B)", display: "flex", alignItems: "center",
              justifyContent: "center", color: "white", fontFamily: SANS, fontWeight: 800, fontSize: 20, letterSpacing: -0.5,
            }}
          >
            wh
          </div>
          <div style={{ flex: 1, fontFamily: SANS, color: "white", lineHeight: 1.22 }}>
            <div style={{ fontWeight: 800, fontSize: 23 }}>{cta.handle ?? "with.hammad"}</div>
            <div style={{ fontWeight: 600, fontSize: 21, opacity: 0.92 }}>{cta.reply ?? "Here you go!"}</div>
          </div>
          <div style={{ alignSelf: "flex-start", marginTop: 16, fontFamily: SANS, fontWeight: 600, fontSize: 17, color: "rgba(255,255,255,0.62)" }}>now</div>
        </div>
      ) : null}
    </>
  );
};
