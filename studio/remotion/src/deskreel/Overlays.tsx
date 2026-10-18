import { Video } from "@remotion/media";
import { AbsoluteFill, Freeze, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { H, toFrame, W } from "./camera";
import { fontStack } from "./fonts";
import type { ChipOverlay, ImageOverlay, InsetOverlay, InsetSource, Overlay, StatCardOverlay, TextLine, TextOverlay } from "./types";

/**
 * Overlay kinds. Each renders inside its own Sequence from its startMs, so a change is always a hard 1-frame cut;
 * the only animation is a typewriter reveal or a fade where the props ask for one. `at` is the absolute frame.
 */

const px = (pct: number, of: number) => (pct / 100) * of;
const IMAGE = /\.(png|jpe?g|webp)$/i;

// ------------------------------------------------------------------------------------------- text

type Segmenter = { segment: (text: string) => Iterable<{ segment: string }> };
const SegmenterCtor = (Intl as unknown as { Segmenter?: new (locale?: string, o?: { granularity: "grapheme" }) => Segmenter }).Segmenter;
const segmenter = SegmenterCtor ? new SegmenterCtor(undefined, { granularity: "grapheme" }) : null;

/** The characters a typewriter reveals: grapheme clusters, so an emoji (a surrogate pair, maybe with a skin tone, a
 *  variation selector or a ZWJ sequence) is one character, never half of one. edit_deskreel.graphemes is the mirror
 *  (a test runs both on the same strings). Code points when Intl.Segmenter is missing. */
export const graphemes = (text: string): string[] => (segmenter ? Array.from(segmenter.segment(text), (x) => x.segment) : Array.from(text));

/** How many characters of the block are revealed on this absolute frame (all when it appears hard). */
export const revealedChars = (o: TextOverlay, at: number) => {
  if (o.appear?.mode !== "typewriter") return Infinity;
  let n = 0;
  for (const t of o.appear.charTimesMs) if (toFrame(t) <= at) n++;
  return n;
};

/** One line, laid out on its FINAL text: the unrevealed tail is only hidden (never removed), so the revealed
 *  characters sit exactly where the finished, aligned line puts them. Stroke under fill, shadows of the whole. */
const Line: React.FC<{ l: TextLine; shown: number; align: "left" | "center" | "right" }> = ({ l, shown, align }) => {
  const chars = graphemes(l.text);
  const head = chars.slice(0, Math.max(0, shown)).join("");
  const tail = chars.slice(Math.max(0, shown)).join("");
  const lh = l.lineHeight ?? 1.15;
  const font: React.CSSProperties = {
    fontFamily: fontStack(l.font),
    fontWeight: l.weight ?? 400,
    fontStyle: l.italic ? "italic" : "normal",
    fontSize: l.size,
    lineHeight: `${(l.size * lh).toFixed(2)}px`,
    letterSpacing: l.letterSpacing ?? 0,
    whiteSpace: "pre",
    textAlign: align,
    gridArea: "1 / 1",
  };
  const parts = (
    <>
      {head}
      {tail ? <span style={{ visibility: "hidden" }}>{tail}</span> : null}
    </>
  );
  const shadows = [
    l.shadow ? `drop-shadow(${l.shadow.dx}px ${l.shadow.dy}px 0 ${l.shadow.color})` : "",
    l.softShadow ? `drop-shadow(${l.softShadow.dx ?? 0}px ${l.softShadow.dy ?? 1}px ${l.softShadow.blur}px ${l.softShadow.color})` : "",
  ].filter(Boolean);
  return (
    <div style={{ display: "grid", width: "100%", filter: shadows.length ? shadows.join(" ") : undefined }}>
      {l.stroke && l.stroke.px > 0 ? (
        <div aria-hidden style={{ ...font, color: l.stroke.color, WebkitTextStroke: `${2 * l.stroke.px}px ${l.stroke.color}` }}>
          {parts}
        </div>
      ) : null}
      <div style={{ ...font, color: l.fill }}>{parts}</div>
    </div>
  );
};

const TextBlock: React.FC<{ o: TextOverlay; at: number }> = ({ o, at }) => {
  let budget = revealedChars(o, at);
  const align = o.align ?? "center";
  return (
    <div style={{ position: "absolute", left: px(o.x, W), top: px(o.y, H), width: px(o.w, W), opacity: fadeOpacity(o, at) }}>
      {o.lines.map((l, i) => {
        const n = graphemes(l.text).length;
        const shown = Math.min(n, budget);
        budget = Math.max(0, budget - n);
        return <Line key={i} l={l} shown={shown} align={align} />;
      })}
    </div>
  );
};

/** fadeOut: linear 1 -> 0 across its frames; a window shorter than one frame (validate() refuses it) is a hard cut
 *  at its start instead of an interpolate() over an empty range, which throws. */
export const fadeOpacity = (o: TextOverlay, at: number) => {
  if (!o.fadeOut) return 1;
  const a = toFrame(o.fadeOut.startMs);
  const b = toFrame(o.fadeOut.endMs);
  if (b <= a) return at < a ? 1 : 0;
  return interpolate(at, [a, b], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
};

// ------------------------------------------------------------------------------------------- chip

const Chip: React.FC<{ o: ChipOverlay }> = ({ o }) => {
  const h = px(o.h, H);
  return (
    <div
      style={{
        position: "absolute", left: px(o.x, W), top: px(o.y, H), width: px(o.w, W), height: h,
        background: o.fill ?? "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <span
        style={{
          fontFamily: fontStack(o.font ?? "Inter"), fontWeight: o.weight ?? 800, fontSize: o.size ?? Math.round(h * 0.52),
          color: o.color ?? "#111111", letterSpacing: o.letterSpacing ?? -0.5, whiteSpace: "pre", lineHeight: 1,
        }}
      >
        {o.text}
      </span>
    </div>
  );
};

// ------------------------------------------------------------------------------------------- inset

/** Geometry of an inset in px: the outer frame box and the picture inside it. */
export const insetBox = (o: InsetOverlay) => {
  const f = { top: 10, side: 7, bottom: 7, color: "#000000", ...o.frame };
  const outerW = px(o.w, W);
  const innerW = outerW - 2 * f.side;
  const innerH = innerW / (o.aspect ?? 16 / 9);
  return { left: px(o.x, W), top: px(o.y, H), outerW, outerH: f.top + innerH + f.bottom, innerW, innerH, f };
};

/** One source state, from its own Sequence: a held frame, a playing muted video (freezing on its last frame), or an image. */
const InsetSourceView: React.FC<{ s: InsetSource; w: number; h: number }> = ({ s, w, h }) => {
  const frame = useCurrentFrame();
  const objectPosition = `50% ${Math.round((s.focusY ?? 0.5) * 100)}%`;
  if (IMAGE.test(s.src)) return <Img src={staticFile(s.src)} style={{ width: w, height: h, objectFit: "cover", objectPosition }} />;
  const from = s.startFromMs ?? 0;
  const last = s.durationMs !== undefined ? Math.max(0, toFrame(s.durationMs - from) - 2) : Infinity;
  return (
    <Freeze frame={s.hold ? 0 : Math.min(frame, last)} active={!!s.hold || frame > last}>
      <Video src={staticFile(s.src)} trimBefore={toFrame(from)} muted objectFit="cover" style={{ width: w, height: h, objectPosition }} />
    </Freeze>
  );
};

const Inset: React.FC<{ o: InsetOverlay }> = ({ o }) => {
  const b = insetBox(o);
  const startF = toFrame(o.startMs);
  const endF = toFrame(o.endMs);
  const states = [{ ...o.source, atMs: o.startMs }, ...(o.swaps ?? [])];
  return (
    <div style={{ position: "absolute", left: b.left, top: b.top, width: b.outerW, height: b.outerH, background: b.f.color }}>
      <div style={{ position: "absolute", left: b.f.side, top: b.f.top, width: b.innerW, height: b.innerH, overflow: "hidden" }}>
        {states.map((s, i) => {
          const from = Math.max(0, toFrame(s.atMs) - startF);
          const to = i + 1 < states.length ? toFrame(states[i + 1].atMs) - startF : endF - startF;
          if (to <= from) return null;
          return (
            <Sequence key={i} from={from} durationInFrames={to - from} layout="none" name={`inset state ${i}`}>
              <InsetSourceView s={s} w={b.innerW} h={b.innerH} />
            </Sequence>
          );
        })}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------------------------------- stat card

/** Must match edit_deskreel.STATCARD. dek and source at 14 px: the smallest that stays legible on a phone. */
export const STATCARD_DEFAULTS = { headlineSize: 22, dekSize: 14, sourceSize: 14, padding: 12, headlineColor: "#101010" };

const StatCard: React.FC<{ o: StatCardOverlay }> = ({ o }) => {
  const d = { ...STATCARD_DEFAULTS, ...o };
  const align = o.align ?? "center";
  const serif = fontStack("Source Serif 4");
  return (
    <div
      style={{
        position: "absolute", left: px(o.x, W), top: px(o.y, H), width: px(o.w, W), boxSizing: "border-box",
        padding: d.padding, background: o.fill ?? "#FFFFFF", textAlign: align,
      }}
    >
      {o.headline.split("\n").map((t, i) => (
        <div key={i} style={{ fontFamily: serif, fontWeight: 700, fontStyle: o.italic ? "italic" : "normal", fontSize: d.headlineSize, lineHeight: 1.12, color: d.headlineColor, whiteSpace: "pre" }}>
          {t}
        </div>
      ))}
      {o.dek
        ? o.dek.split("\n").map((t, i) => (
            <div key={`d${i}`} style={{ fontFamily: serif, fontWeight: 400, fontSize: d.dekSize, lineHeight: 1.25, color: "#2A2A2A", whiteSpace: "pre", marginTop: i === 0 ? 5 : 0 }}>
              {t}
            </div>
          ))
        : null}
      {o.source ? (
        <div style={{ fontFamily: serif, fontWeight: 400, fontSize: d.sourceSize, lineHeight: 1.2, color: "#6A6A6A", whiteSpace: "pre", marginTop: 6 }}>{o.source}</div>
      ) : null}
    </div>
  );
};

// ------------------------------------------------------------------------------------------- image

const ImageView: React.FC<{ o: ImageOverlay }> = ({ o }) => (
  <Img
    src={staticFile(o.src)}
    style={{ position: "absolute", left: px(o.x, W), top: px(o.y, H), width: px(o.w, W), height: o.h !== undefined ? px(o.h, H) : "auto", objectFit: o.fit ?? "cover" }}
  />
);

// ------------------------------------------------------------------------------------------- layer

const OverlayView: React.FC<{ o: Overlay; from: number }> = ({ o, from }) => {
  const at = useCurrentFrame() + from;
  switch (o.type) {
    case "text":
      return <TextBlock o={o} at={at} />;
    case "chip":
      return <Chip o={o} />;
    case "inset":
      return <Inset o={o} />;
    case "statcard":
      return <StatCard o={o} />;
    case "image":
      return <ImageView o={o} />;
    default:
      return null;
  }
};

export const OverlayLayer: React.FC<{ overlays: Overlay[] }> = ({ overlays }) => (
  <AbsoluteFill>
    {overlays
      .map((o, i) => ({ o, i }))
      .sort((a, b) => (a.o.z ?? 0) - (b.o.z ?? 0) || a.i - b.i)
      .map(({ o, i }) => {
        const from = toFrame(o.startMs);
        const dur = toFrame(o.endMs) - from;
        if (dur <= 0) return null;
        return (
          <Sequence key={i} from={from} durationInFrames={dur} layout="none" name={`${o.type} ${o.id ?? i}`}>
            <AbsoluteFill>
              <OverlayView o={o} from={from} />
            </AbsoluteFill>
          </Sequence>
        );
      })}
  </AbsoluteFill>
);
