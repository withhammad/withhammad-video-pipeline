import { interpolate, spring, useCurrentFrame } from "remotion";
import { ARROW_RED, Box, CHIP_Y_MAX, clamp, DEEP_GREEN, DEFAULT_FACE_BOX, EXPO_OUT, FPS, H, hasNumeral, IN_OUT, INK, NUMERAL_STYLE, placeDisplayWord, SAFE, SANS, SERIF, STAT_GREEN, toFrame, toMs, W } from "./theme";
import type { FaceBox, Overlay } from "./types";

const DEFAULT_AT: Record<Overlay["kind"], number> = { stat: 150, chip: 450, arrow: 350, bigtext: 0 };

/** Giant light-green words sliding up word by word out of a mask line (~48-50% W like the reference). */
const Stat: React.FC<{ o: Overlay; ms: number }> = ({ o, ms }) => {
  const words = o.text.split(/\s+/).filter(Boolean);
  const size = Math.min(66, (W * 0.5) / Math.max(1, o.text.length * 0.6));
  const at = o.atMs ?? DEFAULT_AT.stat;
  return (
    <div style={{ position: "absolute", top: H * (o.y ?? 0.7) - size * 0.62, left: 0, width: W, display: "flex", justifyContent: "center", gap: size * 0.24 }}>
      {words.map((w, i) => {
        const p = interpolate(ms, [at + i * 120, at + i * 120 + 420], [0, 1], { ...clamp, easing: EXPO_OUT });
        return (
          <div key={i} style={{ overflow: "hidden", height: size * 1.22, paddingTop: size * 0.04 }}>
            <div
              style={{
                fontFamily: SANS, fontWeight: 800, fontSize: size, lineHeight: 1.1, letterSpacing: -2, color: o.color ?? STAT_GREEN,
                transform: `translateY(${(1 - p) * 110}%)`, textShadow: "0 2px 0 rgba(70,100,40,0.18)",
              }}
            >
              {w}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** White pill(s); several lines (split on "\n") stagger in, or pop on their own times (itemsAtMs). The stack's
 *  lowest centre never goes below CHIP_Y_MAX (the Reels caption block and right rail live under it). A centred chip
 *  sits on the safe area's centre line and never runs past it (x 0.06-0.86W): a long line gets a smaller font. */
const Chips: React.FC<{ o: Overlay; ms: number; atDefault?: number }> = ({ o, ms, atDefault }) => {
  const items = o.text.split("\n").filter(Boolean);
  const at = o.atMs ?? atDefault ?? DEFAULT_AT.chip;
  const align = o.align ?? "center";
  const gap = 58;
  // A carried chip (untilMs) re-docks on each later scene's chip line at that scene's cut, and fades at its end.
  const yFrac = (o.moves ?? []).reduce((y, m) => (ms >= m.atMs ? m.y : y), o.y ?? 0.775);
  const out = o.untilMs !== undefined && o.fadeOutMs ? interpolate(ms, [o.untilMs - o.fadeOutMs, o.untilMs], [1, 0], clamp) : 1;
  const y = Math.min(H * yFrac, H * CHIP_Y_MAX - ((items.length - 1) * gap) / 2);
  const top0 = y - ((items.length - 1) * gap) / 2 - 24;
  return (
    <>
      {items.map((t, i) => {
        const t0 = o.itemsAtMs?.[i] ?? at + i * 160;
        const f = toFrame(ms - t0);
        const sp = f >= 0 ? spring({ frame: f, fps: FPS, config: { damping: 15, stiffness: 210, mass: 0.6 } }) : 0;
        if (f < 0) return null;
        const num = /^(\d+)\s+(.*)$/.exec(t);
        const label = num ? num[2] : t;
        const fontSize = Math.min(21, (SAFE.right - SAFE.left - 64) / Math.max(1, label.length * 0.56));
        const side: React.CSSProperties =
          align === "right"
            ? { right: 30 }
            : align === "left"
              ? { left: 30 }
              : { left: (SAFE.left + SAFE.right) / 2, transform: `translateX(-50%) translateY(${(1 - sp) * 26}px) scale(${0.9 + 0.1 * sp})` };
        return (
          <div
            key={i}
            style={{
              position: "absolute", top: top0 + i * gap, ...side,
              ...(align === "center" ? {} : { transform: `translateX(${(1 - sp) * (align === "right" ? 60 : -60)}px) scale(${0.9 + 0.1 * sp})` }),
              opacity: interpolate(f, [0, 2], [0, 1], clamp) * out,
              display: "flex", alignItems: "center", gap: 10, height: 48, padding: "0 20px 0 14px", borderRadius: 24,
              background: "rgba(255,255,255,0.97)", boxShadow: "0 10px 28px rgba(20,24,40,0.22)", whiteSpace: "nowrap",
              fontFamily: SANS, fontWeight: 600, fontSize, color: INK,
            }}
          >
            {num ? (
              <span style={{ width: 28, height: 28, borderRadius: 14, background: DEEP_GREEN, color: "white", fontWeight: 800, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {num[1]}
              </span>
            ) : (
              <span style={{ width: 9, height: 9, borderRadius: 5, background: o.color ?? "#3a8f3a" }} />
            )}
            {label}
          </div>
        );
      })}
    </>
  );
};

/** Red arrow: drops onto the card's top edge while its stroke draws on, then the chip slides in. */
const Arrow: React.FC<{ o: Overlay; ms: number; card: Box }> = ({ o, ms, card }) => {
  const at = o.atMs ?? DEFAULT_AT.arrow;
  const drop = interpolate(ms, [at, at + 380], [0, 1], { ...clamp, easing: EXPO_OUT });
  const draw = interpolate(ms, [at, at + 300], [0, 1], { ...clamp, easing: IN_OUT });
  const settle = Math.sin(clampN((ms - at - 380) / 260) * Math.PI) * 6;
  const len = 260;
  // Lands inside the card's upper area, right of centre, clear of the headline above the card.
  const x = card.left + card.width * 0.7;
  const tipY = card.top + 150;
  return (
    <>
      <svg
        width={140}
        height={190}
        viewBox="0 0 140 190"
        style={{ position: "absolute", left: x - 70, top: tipY - 172 + (1 - drop) * -120 + settle, opacity: interpolate(ms, [at, at + 60], [0, 1], clamp), filter: "drop-shadow(0 6px 10px rgba(120,20,20,0.35))" }}
      >
        <path d="M 30 10 C 110 40, 110 110, 72 168" fill="none" stroke={o.color ?? ARROW_RED} strokeWidth={9} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
        <path d="M 46 150 L 72 172 L 92 142" fill="none" stroke={o.color ?? ARROW_RED} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" opacity={interpolate(ms, [at + 220, at + 300], [0, 1], clamp)} />
      </svg>
      {o.text ? <Chips o={{ ...o, kind: "chip", color: o.color ?? ARROW_RED }} ms={ms} atDefault={at + 420} /> : null}
    </>
  );
};

const clampN = (t: number) => Math.min(1, Math.max(0, t));

/** Giant serif display word (e.g. "Wait!", ~45-48% W like the reference's "Wait,"), scaling in through blur,
 *  letter by letter; its top stays below the Reels header (>= 150 px). It never covers the face: the props place
 *  it (x, y, size from edit_explainer.place_display_word) and placeDisplayWord re-checks against the take's face box. */
const BigText: React.FC<{ o: Overlay; ms: number; face?: FaceBox }> = ({ o, ms, face }) => {
  const at = o.atMs ?? DEFAULT_AT.bigtext;
  const letters = Array.from(o.text);
  const p = placeDisplayWord(o.text, o.y ?? 0.18, face ?? DEFAULT_FACE_BOX, o.x ?? 0.5, o.size);
  const size = p.size;
  const top = Math.max(150, p.y - size * 0.55);
  const width = W;
  return (
    <div style={{ position: "absolute", top, left: p.x - width / 2, width, textAlign: "center", whiteSpace: "nowrap", fontFamily: SERIF, fontStyle: "italic", fontSize: size, lineHeight: 1.1, color: o.color ?? DEEP_GREEN, ...(hasNumeral(o.text) ? { ...NUMERAL_STYLE, fontSize: size * 0.8 } : {}) }}>
      {letters.map((ch, i) => {
        const p = interpolate(ms, [at + i * 35, at + i * 35 + 380], [0, 1], { ...clamp, easing: EXPO_OUT });
        return (
          <span key={i} style={{ display: "inline-block", whiteSpace: "pre", opacity: p, transform: `translateY(${(1 - p) * 30}px) scale(${0.85 + 0.15 * p})`, filter: p < 0.98 ? `blur(${((1 - p) * 10).toFixed(2)}px)` : undefined }}>
            {ch}
          </span>
        );
      })}
    </div>
  );
};

export const OverlayLayer: React.FC<{ o: Overlay; card: Box; face?: FaceBox }> = ({ o, card, face }) => {
  const ms = toMs(useCurrentFrame());
  if (o.kind === "stat") return <Stat o={o} ms={ms} />;
  if (o.kind === "arrow") return <Arrow o={o} ms={ms} card={card} />;
  if (o.kind === "bigtext") return <BigText o={o} ms={ms} face={face} />;
  return <Chips o={o} ms={ms} />;
};
