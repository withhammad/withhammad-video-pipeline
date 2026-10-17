import { interpolate, spring, useCurrentFrame } from "remotion";
import { clamp, DEEP_GREEN, EXPO_OUT, FPS, H, INK, SANS, SERIF, toFrame, toMs, W } from "./theme";
import type { Cta } from "./types";

const TYPE_DELAY_MS = 350;
const CHAR_MS = 85;

/** Typed prefix of `text` at ms (typing starts at startMs). */
const typed = (text: string, ms: number, startMs: number) => text.slice(0, Math.max(0, Math.min(text.length, Math.floor((ms - startMs) / CHAR_MS) + 1)));

const Caret: React.FC<{ frame: number; solid: boolean; color?: string }> = ({ frame, solid, color = INK }) => (
  <span style={{ display: "inline-block", width: 3, height: 28, marginLeft: 2, background: color, verticalAlign: "middle", opacity: solid || Math.floor(frame / 7) % 2 === 0 ? 1 : 0 }} />
);

/**
 * Comment-composer CTA (inside a Sequence that starts at cta.atMs): the composer slides up, types the keyword,
 * presses "Post", then a DM notification slides in from the top: "<handle>: <reply>".
 */
export const CommentCta: React.FC<{ cta: Cta }> = ({ cta }) => {
  const frame = useCurrentFrame();
  const ms = toMs(frame);
  const kw = cta.keyword;
  const typeEnd = TYPE_DELAY_MS + kw.length * CHAR_MS;
  const postAt = typeEnd + 260;
  const notifAt = postAt + 520;
  const inP = spring({ frame, fps: FPS, config: { damping: 16, stiffness: 200, mass: 0.7 } });
  const press = interpolate(ms, [postAt, postAt + 90, postAt + 220], [1, 0.9, 1], clamp);
  const posted = interpolate(ms, [postAt + 120, postAt + 360], [0, 1], { ...clamp, easing: EXPO_OUT });
  const nf = toFrame(ms - notifAt);
  const notif = nf >= 0 ? spring({ frame: nf, fps: FPS, config: { damping: 15, stiffness: 190, mass: 0.7 } }) : 0;
  const text = typed(kw, ms, TYPE_DELAY_MS);
  const ready = text.length === kw.length;
  return (
    <>
      <div
        style={{
          position: "absolute", left: 40, width: W - 80, top: H * 0.8 - 34, height: 68, borderRadius: 34,
          background: "rgba(255,255,255,0.98)", boxShadow: "0 16px 40px rgba(10,12,20,0.35)",
          display: "flex", alignItems: "center", padding: "0 10px 0 12px", gap: 14,
          transform: `translateY(${(1 - inP) * 140}px)`, opacity: interpolate(frame, [0, 2], [0, 1], clamp),
        }}
      >
        <div style={{ width: 46, height: 46, borderRadius: 23, background: "linear-gradient(135deg,#d6d9e0,#aab0bd)", flexShrink: 0 }} />
        <div style={{ flex: 1, fontFamily: SANS, fontWeight: 600, fontSize: 27, color: text ? INK : "#9aa0aa", whiteSpace: "nowrap" }}>
          {ms < TYPE_DELAY_MS ? "Add a comment…" : text}
          {ms >= TYPE_DELAY_MS && posted < 1 ? <Caret frame={frame} solid={!ready} /> : null}
        </div>
        <div
          style={{
            height: 48, padding: "0 22px", borderRadius: 24, display: "flex", alignItems: "center",
            fontFamily: SANS, fontWeight: 800, fontSize: 21, color: "white", background: posted > 0.5 ? "#34a853" : ready ? "#0a84ff" : "#b8c9e6",
            transform: `scale(${press})`,
          }}
        >
          {posted > 0.5 ? "Sent" : "Post"}
        </div>
      </div>
      {nf >= 0 ? (
        <div
          style={{
            position: "absolute", left: 28, width: W - 56, top: 46, height: 92, borderRadius: 26,
            background: "rgba(250,250,252,0.97)", boxShadow: "0 18px 44px rgba(10,12,20,0.32)",
            display: "flex", alignItems: "center", gap: 16, padding: "0 22px",
            transform: `translateY(${(1 - notif) * -170}px)`,
          }}
        >
          <div style={{ width: 56, height: 56, borderRadius: 28, flexShrink: 0, background: "linear-gradient(135deg,#ef5ab0,#f6a04d)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: SANS, fontWeight: 800, fontSize: 22 }}>
            wh
          </div>
          <div style={{ flex: 1, fontFamily: SANS, fontSize: 24, color: INK, whiteSpace: "nowrap", overflow: "hidden" }}>
            <span style={{ fontWeight: 800 }}>{cta.handle ?? "with.hammad"}:</span> <span style={{ fontWeight: 600 }}>{cta.reply ?? "Here you go!"}</span>
          </div>
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 17, color: "#8a8f99" }}>now</div>
        </div>
      ) : null}
    </>
  );
};

/** End card over the blurred, green-tinted presenter: pill, "Comment KEYWORD", a comment box typing the keyword. */
export const EndCard: React.FC<{ keyword: string; pill?: string }> = ({ keyword, pill }) => {
  const frame = useCurrentFrame();
  const ms = toMs(frame);
  const tint = interpolate(ms, [0, 320], [0, 1], clamp);
  const pop = (delay: number) => {
    const f = toFrame(ms - delay);
    return f >= 0 ? spring({ frame: f, fps: FPS, config: { damping: 14, stiffness: 190, mass: 0.6 } }) : 0;
  };
  const pPill = pop(120);
  const pHead = pop(240);
  const pKey = pop(420);
  const pBox = pop(600);
  const typeStart = 900;
  const text = typed(keyword, ms, typeStart);
  const ready = text.length === keyword.length && ms >= typeStart;
  const draw = interpolate(ms, [700, 1050], [0, 1], { ...clamp, easing: EXPO_OUT });
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: `rgba(64,98,22,${0.36 * tint})` }} />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(255,255,255,${0.32 * tint}) 0%, rgba(255,255,255,${0.12 * tint}) 100%)` }} />
      <div style={{ position: "absolute", top: H * 0.3, width: W, display: "flex", justifyContent: "center", opacity: pPill, transform: `translateY(${(1 - pPill) * 16}px)` }}>
        <div style={{ padding: "8px 18px", borderRadius: 18, background: "rgba(255,255,255,0.92)", fontFamily: SANS, fontWeight: 800, fontSize: 16, letterSpacing: 2.4, color: DEEP_GREEN }}>
          {"• "}
          {(pill ?? "FREE GUIDE").toUpperCase()}
        </div>
      </div>
      <div style={{ position: "absolute", top: H * 0.355, width: W, textAlign: "center", whiteSpace: "nowrap" }}>
        <span style={{ display: "inline-block", fontFamily: SANS, fontWeight: 800, fontSize: 60, color: "white", textShadow: "0 3px 18px rgba(0,0,0,0.35)", opacity: pHead, transform: `translateY(${(1 - pHead) * 20}px)` }}>
          Comment
        </span>{" "}
        <span style={{ display: "inline-block", marginLeft: 16, fontFamily: SERIF, fontStyle: "italic", fontSize: 84, color: "#e9f7cf", textShadow: "0 3px 18px rgba(0,0,0,0.35)", opacity: pKey, transform: `translateY(${(1 - pKey) * 20}px) scale(${0.85 + 0.15 * pKey})` }}>
          {keyword}
        </span>
      </div>
      <svg width={120} height={120} viewBox="0 0 120 120" style={{ position: "absolute", left: 70, top: H * 0.44, opacity: draw }}>
        <path d="M 20 10 C 10 60, 40 90, 92 96" fill="none" stroke="white" strokeWidth={6} strokeLinecap="round" strokeDasharray={160} strokeDashoffset={160 * (1 - draw)} />
        <path d="M 76 82 L 94 96 L 76 110" fill="none" stroke="white" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={draw > 0.9 ? 1 : 0} />
      </svg>
      <div
        style={{
          position: "absolute", left: 160, width: W - 220, top: H * 0.49, height: 74, borderRadius: 22,
          background: "white", boxShadow: "0 18px 40px rgba(20,40,10,0.3)", display: "flex", alignItems: "center", padding: "0 10px 0 24px",
          opacity: pBox, transform: `translateY(${(1 - pBox) * 30}px) scale(${0.92 + 0.08 * pBox})`,
        }}
      >
        <div style={{ flex: 1, fontFamily: SANS, fontWeight: 600, fontSize: 30, color: text && ms >= typeStart ? INK : "#9aa0aa", whiteSpace: "nowrap" }}>
          {ms < typeStart ? "Add a comment…" : text}
          {ms >= typeStart ? <Caret frame={frame} solid={!ready} /> : null}
        </div>
        <div style={{ height: 52, padding: "0 20px", borderRadius: 16, display: "flex", alignItems: "center", fontFamily: SANS, fontWeight: 800, fontSize: 21, color: "white", background: ready ? DEEP_GREEN : "#a9bf8c" }}>
          Post
        </div>
      </div>
    </>
  );
};
