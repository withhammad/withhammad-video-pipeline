import { Easing, interpolate, spring, useCurrentFrame } from "remotion";
import { clamp, EXPO_OUT, FPS, H, SANS, toFrame, toMs, W } from "../theme";
import type { HarvestCard } from "../types";
import { DARK_BG, PAPER } from "./layout";

/**
 * Designed cards of the reference (title, logo tile, repo star counter, kinetic title) plus our replacement for its
 * stock cash shot (a cost card). Plain text only: no OpenAI/ChatGPT logo or trade dress, no third-party logo.
 * Every motion is a function of the scene-relative frame (durMs = the scene length).
 */

const pop = (ms: number, delay = 0, config = { damping: 13, stiffness: 210, mass: 0.6 }) => {
  const f = toFrame(ms - delay);
  return f >= 0 ? spring({ frame: f, fps: FPS, config }) : 0;
};

/** A neutral monogram (the name's first letter) where a brand mark would sit: no invented logo passed off as the
 *  project's own, and no third-party logo either. */
const Monogram: React.FC<{ name: string; size: number; radius: number; fontSize: number }> = ({ name, size, radius, fontSize }) => (
  <div
    style={{
      width: size, height: size, borderRadius: radius, background: "#E9E9EC", color: "#3A3A42", display: "flex", alignItems: "center",
      justifyContent: "center", fontFamily: SANS, fontWeight: 800, fontSize, lineHeight: 1, flexShrink: 0,
    }}
  >
    {(name.trim()[0] ?? "?").toUpperCase()}
  </div>
);

/** Scene 1 top panel: near-black with a deep maroon glow, "GPT-6" white + "ASTRA" hot pink, settling slowly. */
const TitleCard: React.FC<{ card: Extract<HarvestCard, { kind: "title" }>; w: number; h: number; ms: number; durMs: number }> = ({ card, w, h, ms, durMs }) => {
  const settle = interpolate(ms, [0, Math.max(400, durMs)], [1.07, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, overflow: "hidden", background: "#0A0607" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(90% 70% at 50% 100%, rgba(150,16,44,0.78) 0%, rgba(84,8,26,0.55) 38%, rgba(10,6,7,0) 78%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 40% at 50% 34%, rgba(120,14,40,0.22) 0%, rgba(0,0,0,0) 100%)" }} />
      <div
        style={{
          position: "absolute", left: 0, width: w, top: Math.round(h * 0.33) - 40, height: 80, display: "flex", alignItems: "center", justifyContent: "center",
          transform: `scale(${settle.toFixed(4)})`, fontFamily: SANS, fontWeight: 800, fontSize: 66, letterSpacing: 1, whiteSpace: "nowrap",
        }}
      >
        <span style={{ color: "white" }}>{card.text}</span>
        {card.accent ? <span style={{ color: "#FF2D78", marginLeft: 18 }}>{card.accent}</span> : null}
      </div>
    </div>
  );
};

/** Scene 5: off-white canvas, a white tile with the project's name as a wordmark (no glyph: we do not draw its
 *  logo, and an invented one would pass for it) pops in and settles. */
const LogoCard: React.FC<{ card: Extract<HarvestCard, { kind: "logo" }>; ms: number }> = ({ card, ms }) => {
  // Present on the cut frame (never a blank canvas), popping in from 0.8.
  const p = pop(ms, -40, { damping: 12, stiffness: 190, mass: 0.6 });
  const w = 520;
  const h = 210;
  const fontSize = Math.min(66, (w - 70) / Math.max(1, card.name.length * 0.6));
  return (
    <div style={{ position: "absolute", inset: 0, background: PAPER }}>
      <div
        style={{
          position: "absolute", left: W / 2 - w / 2, top: H * 0.44 - h / 2, width: w, height: h, borderRadius: 54, background: "white",
          boxShadow: "0 24px 60px rgba(30,30,40,0.14), 0 3px 10px rgba(30,30,40,0.08)", display: "flex",
          alignItems: "center", justifyContent: "center", transform: `scale(${(0.8 + 0.2 * p).toFixed(4)})`,
        }}
      >
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize, color: "#141414", letterSpacing: -1, whiteSpace: "nowrap" }}>{card.name}</div>
      </div>
    </div>
  );
};

const commas = (n: number) => Math.round(n).toLocaleString("en-US");

/** Scene 6: the repo card on the off-white canvas; the star counter rolls up across the whole scene (it lands
 *  ~0.4 s before the cut, so the card never sits static), then the count box turns black and the star gold (the
 *  reference's stat pop), with the verified numbers. */
const STARS_LAND_BEFORE_END_MS = 420;
const StarsCard: React.FC<{ card: Extract<HarvestCard, { kind: "stars" }>; ms: number; durMs: number }> = ({ card, ms, durMs }) => {
  const rollEnd = Math.max(1500, durMs - STARS_LAND_BEFORE_END_MS);
  const k = interpolate(ms, [200, rollEnd], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const value = card.from + (card.to - card.from) * k;
  const done = ms >= rollEnd + 60;
  const enter = interpolate(ms, [0, 380], [0, 1], { ...clamp, easing: EXPO_OUT });
  const left = 40;
  const width = W - 2 * left;
  return (
    <div style={{ position: "absolute", inset: 0, background: PAPER }}>
      <div
        style={{
          position: "absolute", left, width, top: Math.round(H * 0.29), height: 318, borderRadius: 22, background: "white",
          boxShadow: "0 22px 56px rgba(30,30,40,0.12), 0 2px 8px rgba(30,30,40,0.06)", border: "1px solid #E7E7E4",
          transform: `translateY(${((1 - enter) * 26).toFixed(2)}px)`, fontFamily: SANS,
        }}
      >
        <div style={{ position: "absolute", left: 30, top: 30, right: 30, height: 40, display: "flex", alignItems: "center", gap: 14 }}>
          <Monogram name={card.owner} size={38} radius={10} fontSize={21} />
          <div style={{ fontSize: 25, color: "#57606A", fontWeight: 600, whiteSpace: "nowrap" }}>
            {card.owner} / <span style={{ color: "#1F2328", fontWeight: 800 }}>{card.repo}</span>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 16, fontWeight: 600, color: "#57606A", border: "1px solid #D0D7DE", borderRadius: 14, padding: "3px 12px" }}>Public</div>
        </div>
        {card.about ? <div style={{ position: "absolute", left: 30, top: 92, fontSize: 22, fontWeight: 600, color: "#57606A" }}>{card.about}</div> : null}
        <div
          style={{
            position: "absolute", left: 30, right: 30, top: 146, height: 74, borderRadius: 14, background: "#F6F8FA", border: "1px solid #D0D7DE",
            display: "flex", alignItems: "center", padding: "0 10px 0 22px",
          }}
        >
          <svg width={30} height={30} viewBox="0 0 24 24">
            <path
              d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"
              fill={done ? "#E3B341" : "none"}
              stroke={done ? "#C99A2E" : "#57606A"}
              strokeWidth={1.8}
              strokeLinejoin="round"
            />
          </svg>
          <div style={{ marginLeft: 12, fontSize: 25, fontWeight: 600, color: "#1F2328" }}>Star</div>
          <div
            style={{
              marginLeft: "auto", minWidth: 190, height: 52, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
              background: done ? "#111111" : "white", border: done ? "1px solid #111" : "1px solid #D0D7DE", color: done ? "white" : "#1F2328",
              fontSize: 30, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: 0.4,
            }}
          >
            {commas(value)}
          </div>
        </div>
        <div style={{ position: "absolute", left: 30, top: 252, display: "flex", alignItems: "center", gap: 26, fontSize: 19, fontWeight: 600, color: "#57606A" }}>
          {card.language ? (
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 13, height: 13, borderRadius: 7, background: "#3572A5" }} />
              {card.language}
            </span>
          ) : null}
          {card.license ? <span>{card.license}</span> : null}
          {card.forks ? <span>{card.forks}</span> : null}
        </div>
      </div>
    </div>
  );
};

/** Our replacement for the reference's stock cash shot (scene 15): what a company found costs with a local model. */
const CostCard: React.FC<{ card: Extract<HarvestCard, { kind: "cost" }>; w: number; h: number; ms: number }> = ({ card, w, h, ms }) => {
  const p = interpolate(ms, [0, 260], [0, 1], { ...clamp, easing: EXPO_OUT });
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, overflow: "hidden", background: DARK_BG, fontFamily: SANS }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(70% 60% at 50% 46%, rgba(17,226,192,0.14) 0%, rgba(0,0,0,0) 70%)" }} />
      <div style={{ position: "absolute", left: 0, width: w, top: Math.round(h * 0.27), textAlign: "center", fontSize: 26, fontWeight: 600, color: "#A1A1AA", letterSpacing: 0.3 }}>
        {card.label}
      </div>
      <div
        style={{
          position: "absolute", left: 0, width: w, top: Math.round(h * 0.36), textAlign: "center", fontSize: 150, fontWeight: 800, color: "white",
          letterSpacing: -4, lineHeight: 1, transform: `scale(${(1.16 - 0.16 * p).toFixed(4)})`,
        }}
      >
        {card.value}
      </div>
      {card.note ? (
        <div style={{ position: "absolute", left: 0, width: w, top: Math.round(h * 0.68), textAlign: "center", fontSize: 22, fontWeight: 600, color: "#11E2C0" }}>{card.note}</div>
      ) : null}
    </div>
  );
};

/** Scene 19: white card, the small title slides up, then the huge word slams in grey and turns black. */
const KineticCard: React.FC<{ card: Extract<HarvestCard, { kind: "kinetic" }>; ms: number }> = ({ card, ms }) => {
  // The small title is already half in on the cut frame (the reference's first frame shows it), then slides up.
  const small = interpolate(ms, [-120, 200], [0, 1], { ...clamp, easing: EXPO_OUT });
  const slamAt = 280;
  const slam = interpolate(ms, [slamAt, slamAt + 140], [0, 1], { ...clamp, easing: EXPO_OUT });
  const black = ms >= slamAt + 120;
  return (
    <div style={{ position: "absolute", inset: 0, background: "white", fontFamily: SANS }}>
      <div
        style={{
          position: "absolute", left: 0, width: W, top: H * 0.375, textAlign: "center", fontSize: 40, fontWeight: 600, color: "#1A1A1A",
          opacity: small, transform: `translateY(${((1 - small) * 24).toFixed(2)}px)`,
        }}
      >
        {card.small}
      </div>
      {ms >= slamAt ? (
        <div
          style={{
            position: "absolute", left: 0, width: W, top: H * 0.41, textAlign: "center", fontSize: 188, fontWeight: 800, letterSpacing: -7, lineHeight: 1.05,
            color: black ? "#111111" : "#8C8C8C", transform: `scale(${(1.32 - 0.32 * slam).toFixed(4)})`,
          }}
        >
          {card.big}
        </div>
      ) : null}
    </div>
  );
};

/** A designed card filling a w x h region (the split's top panel or the full frame). */
export const HarvestCardView: React.FC<{ card: HarvestCard; w?: number; h?: number; durMs: number }> = ({ card, w = W, h = H, durMs }) => {
  const ms = toMs(useCurrentFrame());
  if (card.kind === "title") return <TitleCard card={card} w={w} h={h} ms={ms} durMs={durMs} />;
  if (card.kind === "logo") return <LogoCard card={card} ms={ms} />;
  if (card.kind === "stars") return <StarsCard card={card} ms={ms} durMs={durMs} />;
  if (card.kind === "cost") return <CostCard card={card} w={w} h={h} ms={ms} />;
  return <KineticCard card={card} ms={ms} />;
};
