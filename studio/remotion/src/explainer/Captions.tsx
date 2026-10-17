import { useMemo } from "react";
import { interpolate, spring, useCurrentFrame } from "remotion";
import {
  buildPages,
  clamp,
  DEEP_GREEN,
  displayText,
  EXPO_OUT,
  FPS,
  H,
  HEADLINE_TOP,
  INK,
  Page,
  PEACH,
  PINK,
  SANS,
  SERIF,
  toFrame,
  W,
} from "./theme";
import type { CaptionSystem, Word } from "./types";

/** Captions inside a scene Sequence: times are absolute, the frame is scene-relative. */
type Props = { words: Word[]; system: CaptionSystem; sceneStartMs: number; sceneEndMs: number; layout?: "canvas" | "split"; room?: boolean };

/** Headline words reveal this many frames ahead of the voice, so the cut frame into a card already carries
 *  the first incoming word (cuts land ~80 ms before the phrase). */
const HEADLINE_LEAD = 2;

const usePage = (words: Word[], system: CaptionSystem, sceneStartMs: number, sceneEndMs: number, lead: number) => {
  const frame = useCurrentFrame();
  const pages = useMemo(() => buildPages(words, system, sceneEndMs), [words, system, sceneEndMs]);
  const abs = toFrame(sceneStartMs) + frame;
  // +1: text lands one frame ahead of the voice, which reads as in sync.
  const page = pages.find((p) => abs + 1 + lead >= toFrame(p.startMs) && abs < toFrame(p.endMs));
  return { page, abs };
};

const fitSize = (chars: number, base: number, maxWidth: number, em = 0.6) => Math.min(base, maxWidth / Math.max(1, chars * em));

// ---------------------------------------------------------------------------------------------
// (A) Hook: heavy uppercase, 3 words, white with a thin dark outline + soft shadow, active word hot pink.
// ---------------------------------------------------------------------------------------------

const OUTLINE = "0 0 1px #141414, 1.5px 1.5px 0 #141414, -1.5px -1.5px 0 #141414, 1.5px -1.5px 0 #141414, -1.5px 1.5px 0 #141414, 0 1.5px 0 #141414, 0 -1.5px 0 #141414, 1.5px 0 0 #141414, -1.5px 0 0 #141414, 0 5px 16px rgba(0,0,0,0.38)";

const HookCaption: React.FC<{ page: Page; abs: number }> = ({ page, abs }) => {
  const since = abs + 1 - toFrame(page.startMs);
  const pop = spring({ frame: since, fps: FPS, config: { damping: 14, stiffness: 260, mass: 0.5 } });
  const texts = page.words.map((w) => displayText(w.text, "hook"));
  const size = fitSize(texts.join(" ").length, 44, W * 0.86, 0.66);
  let active = -1;
  page.words.forEach((w, i) => {
    if (abs + 1 >= toFrame(w.startMs)) active = i;
  });
  return (
    <div
      style={{
        position: "absolute", top: H * 0.69 - size * 0.6, left: 0, width: W, textAlign: "center", whiteSpace: "nowrap",
        fontFamily: SANS, fontWeight: 800, fontSize: size, letterSpacing: 0.6, lineHeight: 1.2,
        transform: `scale(${0.9 + 0.1 * pop})`, opacity: interpolate(since, [0, 1], [0.4, 1], clamp),
      }}
    >
      {texts.map((t, i) => (
        <span key={i} style={{ color: i === active ? PINK : "white", textShadow: OUTLINE, marginRight: i < texts.length - 1 ? "0.28em" : 0 }}>
          {t}
        </span>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------------------------
// (B) Explainer headline above the card: line 1 bold sans, line 2 italic serif; each word arrives pale and
// blurred and sharpens to near-black within 120 ms.
// ---------------------------------------------------------------------------------------------

const RevealWord: React.FC<{ w: Word; abs: number; text: string; style: React.CSSProperties; last: boolean }> = ({ w, abs, text, style, last }) => {
  const since = abs + 1 - toFrame(w.startMs);
  if (since < 0) return null;
  const p = interpolate(since, [0, 3], [0, 1], { ...clamp, easing: EXPO_OUT });
  const grey = Math.round(200 - (200 - 17) * p);
  return (
    <span
      style={{
        ...style,
        display: "inline-block",
        marginRight: last ? 0 : "0.25em",
        color: `rgb(${grey},${grey},${grey})`,
        filter: p < 0.98 ? `blur(${((1 - p) * 6).toFixed(2)}px)` : undefined,
        transform: `translateY(${(1 - p) * 6}px)`,
      }}
    >
      {text}
    </span>
  );
};

const ExplainerHeadline: React.FC<{ page: Page; abs: number; top: number }> = ({ page, abs, top }) => {
  const l1 = page.words.slice(0, page.line2At);
  const l2 = page.words.slice(page.line2At);
  const t1 = l1.map((w) => displayText(w.text, "explainer"));
  const t2 = l2.map((w) => displayText(w.text, "explainer"));
  const s1 = fitSize(t1.join(" ").length, 34, W * 0.88, 0.56);
  const s2 = fitSize(t2.join(" ").length, 47, W * 0.9, 0.42);
  const row: React.CSSProperties = { position: "absolute", left: 0, width: W, textAlign: "center", whiteSpace: "nowrap" };
  return (
    <>
      <div style={{ ...row, top }}>
        {l1.map((w, i) => (
          <RevealWord key={i} w={w} abs={abs} text={t1[i]} last={i === l1.length - 1} style={{ fontFamily: SANS, fontWeight: 800, fontSize: s1, letterSpacing: -0.3, color: INK }} />
        ))}
      </div>
      {l2.length ? (
        <div style={{ ...row, top: top + s1 * 1.18 }}>
          {l2.map((w, i) => (
            <RevealWord key={i} w={w} abs={abs} text={t2[i]} last={i === l2.length - 1} style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: s2, color: INK }} />
          ))}
        </div>
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------------------------------------
// (C) Talking head: white sans sentence case at 0.69H, letters rise in through blur; emphasis words on a
// second line in peach italic serif. The tail ("room") variant is bold, two lines at 0.72-0.79H, with the
// key word in a deep-green rounded box.
// ---------------------------------------------------------------------------------------------

const Letters: React.FC<{ text: string; startFrame: number; abs: number }> = ({ text, startFrame, abs }) => (
  <>
    {Array.from(text).map((ch, j) => {
      const t = (abs + 1 - startFrame) * (1000 / FPS) - j * 22;
      const p = interpolate(t, [0, 130], [0, 1], { ...clamp, easing: EXPO_OUT });
      return (
        <span
          key={j}
          style={{
            display: "inline-block", whiteSpace: "pre", opacity: interpolate(t, [0, 50], [0, 1], clamp),
            transform: `translateY(${(1 - p) * 14}px)`, filter: p < 0.98 ? `blur(${((1 - p) * 5).toFixed(2)}px)` : undefined,
          }}
        >
          {ch}
        </span>
      );
    })}
  </>
);

const SHADOW = "0 2px 10px rgba(0,0,0,0.55), 0 0 2px rgba(0,0,0,0.5)";

const TalkCaption: React.FC<{ page: Page; abs: number; room: boolean }> = ({ page, abs, room }) => {
  const spoken = page.words.filter((w) => abs + 1 >= toFrame(w.startMs));
  if (!spoken.length) return null;
  const word = (w: Word, i: number, n: number, style: React.CSSProperties) => (
    <span key={i} style={{ display: "inline-block", marginRight: i < n - 1 ? "0.26em" : 0, ...style }}>
      <Letters text={displayText(w.text, "talk")} startFrame={toFrame(w.startMs)} abs={abs} />
    </span>
  );
  if (room) {
    // Outro: up to two lines, the emphasis word in a deep-green rounded box.
    const l1 = page.words.slice(0, Math.ceil(page.words.length / 2));
    const l2 = page.words.slice(l1.length);
    const line = (ws: Word[], top: number) => {
      const shown = ws.filter((w) => abs + 1 >= toFrame(w.startMs));
      // Consecutive emphasis words share one deep-green box.
      const runs: Word[][] = [];
      shown.forEach((w, i) => {
        if (i > 0 && w.em && shown[i - 1].em) runs[runs.length - 1].push(w);
        else runs.push([w]);
      });
      return (
        <div style={{ position: "absolute", top, left: 0, width: W, textAlign: "center", whiteSpace: "nowrap", fontFamily: SANS, fontWeight: 800, fontSize: 37, color: "white", textShadow: SHADOW }}>
          {runs.map((run, r) =>
            run[0].em ? (
              <span key={r} style={{ display: "inline-block", marginRight: r < runs.length - 1 ? "0.26em" : 0, background: DEEP_GREEN, borderRadius: 10, padding: "0 10px 4px", textShadow: "none" }}>
                {run.map((w, i) => word(w, i, run.length, {}))}
              </span>
            ) : (
              word(run[0], r, runs.length, {})
            ),
          )}
        </div>
      );
    };
    return (
      <>
        {line(l1, H * 0.72)}
        {page.words.length > 1 ? line(l2, H * 0.72 + 50) : null}
      </>
    );
  }
  const l1 = page.words.slice(0, page.line2At).filter((w) => abs + 1 >= toFrame(w.startMs));
  const l2 = page.words.slice(page.line2At).filter((w) => abs + 1 >= toFrame(w.startMs));
  const t2 = l2.map((w) => displayText(w.text, "talk")).join(" ");
  const s2 = fitSize(t2.length, 58, W * 0.86, 0.42);
  return (
    <>
      <div style={{ position: "absolute", top: H * 0.69 - 26, left: 0, width: W, textAlign: "center", whiteSpace: "nowrap", fontFamily: SANS, fontWeight: 600, fontSize: 36, color: "white", textShadow: SHADOW }}>
        {l1.map((w, i) => word(w, i, l1.length, {}))}
      </div>
      {l2.length ? (
        <div style={{ position: "absolute", top: H * 0.69 + 22, left: 0, width: W, textAlign: "center", whiteSpace: "nowrap", fontFamily: SERIF, fontStyle: "italic", fontSize: s2, color: PEACH, textShadow: SHADOW }}>
          {l2.map((w, i) => word(w, i, l2.length, {}))}
        </div>
      ) : null}
    </>
  );
};

export const Captions: React.FC<Props> = ({ words, system, sceneStartMs, sceneEndMs, layout = "canvas", room = false }) => {
  const lead = system === "explainer" ? HEADLINE_LEAD : 0;
  const { page, abs } = usePage(words, system, sceneStartMs, sceneEndMs, lead);
  if (!page) return null;
  if (system === "hook") return <HookCaption page={page} abs={abs} />;
  if (system === "explainer") return <ExplainerHeadline page={page} abs={abs + lead} top={HEADLINE_TOP[layout]} />;
  return <TalkCaption page={page} abs={abs} room={room} />;
};
