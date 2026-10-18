import { useCurrentFrame } from "remotion";
import { H, hasNumeral, NUMERAL_STYLE, SANS, sceneIndexAtFrame, SERIF, toFrame, W } from "../theme";
import type { CaptionChunk, ChunkLine, Scene } from "../types";
import { CAP_MAX_W, CAP_SANS, CAP_SERIF, CAP_SHADOW, captionPill, captionYOf, RED, TEAL, TEAL_SERIF } from "./layout";

/**
 * The reference's caption system (visual.md section 4): 1-3 word chunks in a heavy uppercase sans, an optional
 * lowercase serif keyword line under it, white by default with teal emphasis chunks and one red line. Chunks and
 * lines hard-cut on at their word onsets (no pop, no karaoke); a soft shadow over video, a dark pill over UI.
 * Positions follow the scene on screen: the seam of a split, the chest on a close-up, under the card over UI;
 * none over the typed prompt (PiP) or once the comment composer opens.
 */

const SANS_EM = 0.7;
const SERIF_EM = 0.44;

const colorOf = (l: ChunkLine) => (l.color === "red" ? RED : l.color === "teal" ? (l.serif ? TEAL_SERIF : TEAL) : "white");

const sizeOf = (l: ChunkLine) => {
  const base = l.serif ? CAP_SERIF : CAP_SANS;
  const em = l.serif ? SERIF_EM : SANS_EM;
  return Math.min(base, CAP_MAX_W / Math.max(1, l.text.length * em));
};

const Line: React.FC<{ l: ChunkLine; cy: number; pill: string | null }> = ({ l, cy, pill }) => {
  const size = sizeOf(l);
  const serif = l.serif && !hasNumeral(l.text);
  const text = l.serif ? l.text : l.text.toUpperCase();
  const h = size * 1.18;
  return (
    <div style={{ position: "absolute", left: 0, width: W, top: cy - h / 2 - (pill ? 4 : 0), display: "flex", justifyContent: "center" }}>
      <span
        style={{
          display: "inline-block", whiteSpace: "nowrap", color: colorOf(l), lineHeight: 1.18, fontSize: size,
          ...(serif
            ? { fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, letterSpacing: 0.2 }
            : l.serif
              ? { ...NUMERAL_STYLE, fontSize: size * 0.82 }
              : { fontFamily: SANS, fontWeight: 800, letterSpacing: 0.4 }),
          ...(pill
            ? { background: pill, borderRadius: 12, padding: serif ? "0 16px 4px" : "2px 15px 4px" }
            : { textShadow: CAP_SHADOW }),
        }}
      >
        {text}
      </span>
    </div>
  );
};

export const HarvestCaptions: React.FC<{ chunks: CaptionChunk[]; scenes: Scene[]; ctaAtMs?: number }> = ({ chunks, scenes, ctaAtMs }) => {
  const frame = useCurrentFrame();
  const s = scenes[sceneIndexAtFrame(scenes, frame)];
  if (!s) return null;
  if (ctaAtMs !== undefined && frame >= toFrame(ctaAtMs)) return null;
  const y = captionYOf(s);
  if (y === null) return null;
  let chunk: CaptionChunk | undefined;
  for (const c of chunks) if (frame >= toFrame(c.startMs) && frame < toFrame(c.endMs)) chunk = c;
  if (!chunk) return null;
  const lines = chunk.lines.filter((l) => frame >= toFrame(l.startMs));
  if (!lines.length) return null;
  const pill = captionPill(s);
  // The first line sits on the scene's caption line; the next hangs under it (it never moves the first one).
  let cy = y * H;
  return (
    <>
      {lines.map((l, i) => {
        if (i > 0) cy += (sizeOf(lines[i - 1]) * 1.18) / 2 + (sizeOf(l) * 1.18) / 2 + (pill ? 10 : 0);
        return <Line key={i} l={l} cy={cy} pill={pill} />;
      })}
    </>
  );
};
