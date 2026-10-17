import { useMemo } from "react";
import { interpolate, spring, useCurrentFrame } from "remotion";
import {
  buildPages,
  clamp,
  cleanWord,
  DEEP_GREEN,
  displayText,
  EXPO_OUT,
  FACECAM,
  fallbackHeadlines,
  FPS,
  H,
  HEADLINE_TOP,
  INK,
  lineText,
  Page,
  PEACH,
  PINK,
  SANS,
  SERIF,
  toFrame,
  W,
} from "./theme";
import type { CaptionSystem, HeadlinePage, HeadlineWord, Scene, Word } from "./types";

/** One caption run: contiguous scenes sharing a caption system (and beat, for headlines). */
export type CaptionRun = { system: CaptionSystem; startMs: number; endMs: number; scenes: Scene[]; room: boolean };

/** Captions inside the run's Sequence: times are absolute, the frame is run-relative. */
type Props = { words: Word[]; run: CaptionRun; headlines?: HeadlinePage[]; ctaKeyword?: string };

/** Headline words reveal this many frames ahead of the voice, so the cut frame into a card already carries
 *  the first incoming word (cuts land ~80 ms before the phrase). */
const HEADLINE_LEAD = 2;

const fitSize = (chars: number, base: number, maxWidth: number, em = 0.6) => Math.min(base, maxWidth / Math.max(1, chars * em));

const sceneAt = (run: CaptionRun, abs: number) => run.scenes.find((s) => abs >= toFrame(s.startMs) && abs < toFrame(s.endMs)) ?? run.scenes[0];

// ---------------------------------------------------------------------------------------------
// (A) Hook: heavy uppercase, 3 words, white with a dark outline + soft shadow, active word hot pink. The outline
// is a 2.5 px ring outside the glyphs (a stroked copy under the fill), heavy enough to read over the light
// backdrop during the flip-in.
// ---------------------------------------------------------------------------------------------

const STROKE = "#141414";

const HookCaption: React.FC<{ page: Page; abs: number }> = ({ page, abs }) => {
  const since = abs + 1 - toFrame(page.startMs);
  const pop = spring({ frame: since, fps: FPS, config: { damping: 14, stiffness: 260, mass: 0.5 } });
  const texts = page.words.map((w) => displayText(w.text, "hook"));
  // At most ~74% W, clear of the Reels right rail (the reference line spans ~60% W).
  const size = fitSize(texts.join(" ").length, 44, W * 0.74, 0.66);
  let active = -1;
  page.words.forEach((w, i) => {
    if (abs + 1 >= toFrame(w.startMs)) active = i;
  });
  const base: React.CSSProperties = {
    position: "absolute", top: H * 0.69 - size * 0.6, left: 0, width: W, textAlign: "center", whiteSpace: "nowrap",
    fontFamily: SANS, fontWeight: 800, fontSize: size, letterSpacing: 0.6, lineHeight: 1.2,
    transform: `scale(${0.9 + 0.1 * pop})`, opacity: interpolate(since, [0, 1], [0.4, 1], clamp),
  };
  const spans = (fill: (i: number) => string) =>
    texts.map((t, i) => (
      <span key={i} style={{ color: fill(i), marginRight: i < texts.length - 1 ? "0.28em" : 0 }}>
        {t}
      </span>
    ));
  return (
    <>
      <div style={{ ...base, WebkitTextStroke: `5px ${STROKE}`, textShadow: "0 5px 16px rgba(0,0,0,0.38)" }}>{spans(() => STROKE)}</div>
      <div style={base}>{spans((i) => (i === active ? PINK : "white"))}</div>
    </>
  );
};

// ---------------------------------------------------------------------------------------------
// (B) Explainer headline above the card: sans words in bold, *italic* words in the serif (the curated text
// marks them; the fallback sets line 2 in the serif). Each word arrives pale and blurred and sharpens to
// near-black within 120 ms. Sizes follow the reference (~27/31 px at 720, serif ~1.15x the sans).
// ---------------------------------------------------------------------------------------------

const S1 = 30;
const S2 = 35;
const EM_SANS = 0.56;
const EM_SERIF = 0.42;

const RevealWord: React.FC<{ w: HeadlineWord; abs: number; text: string; style: React.CSSProperties; last: boolean }> = ({ w, abs, text, style, last }) => {
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

const ExplainerHeadline: React.FC<{ page: HeadlinePage; abs: number; top: number }> = ({ page, abs, top }) => {
  let y = top;
  return (
    <>
      {page.lines.map((line, li) => {
        const texts = line.words.map((w, i) => lineText(displayText(w.text, "explainer"), i === line.words.length - 1));
        // One scale per line so mixed sans/serif lines keep the 1.15 ratio when they have to shrink.
        const width = line.words.reduce((a, w, i) => a + (texts[i].length + 1) * (w.italic ? S2 * EM_SERIF : S1 * EM_SANS), 0);
        const k = Math.min(1, (W * 0.88) / Math.max(1, width));
        const s1 = S1 * k;
        const s2 = S2 * k;
        const lineTop = y;
        y += Math.max(...line.words.map((w) => (w.italic ? s2 * 1.2 : s1 * 1.18)));
        return (
          <div key={li} style={{ position: "absolute", left: 0, width: W, top: lineTop, textAlign: "center", whiteSpace: "nowrap" }}>
            {line.words.map((w, i) => (
              <RevealWord
                key={i}
                w={w}
                abs={abs}
                text={texts[i]}
                last={i === line.words.length - 1}
                style={
                  w.italic
                    ? { fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: s2, color: INK, verticalAlign: "baseline" }
                    : { fontFamily: SANS, fontWeight: 800, fontSize: s1, letterSpacing: -0.3, color: INK, verticalAlign: "baseline" }
                }
              />
            ))}
          </div>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------------------------------------
// (C) Talking head: white sans sentence case at 0.69H, letters rise in through blur; emphasis words on a
// second line in peach italic serif (the CTA keyword fills ~70% W). The tail ("room") variant is bold, two
// lines at 0.72-0.79H, with the key word in a deep-green rounded box. On a split (facecam) the caption sits
// smaller on the lower part of the circle.
// ---------------------------------------------------------------------------------------------

const letterT = (abs: number, startFrame: number, j: number) => (abs + 1 - startFrame) * (1000 / FPS) - j * 22;

const Letters: React.FC<{ text: string; startFrame: number; abs: number }> = ({ text, startFrame, abs }) => (
  <>
    {Array.from(text).map((ch, j) => {
      const t = letterT(abs, startFrame, j);
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

const TalkCaption: React.FC<{ page: Page; abs: number; room: boolean; onCam: boolean; ctaKeyword?: string }> = ({ page, abs, room, onCam, ctaKeyword }) => {
  const spoken = page.words.filter((w) => abs + 1 >= toFrame(w.startMs));
  if (!spoken.length) return null;
  const word = (w: Word, i: number, n: number, style: React.CSSProperties) => (
    <span key={i} style={{ display: "inline-block", marginRight: i < n - 1 ? "0.26em" : 0, ...style }}>
      <Letters text={displayText(w.text, "talk")} startFrame={toFrame(w.startMs)} abs={abs} />
    </span>
  );
  if (room) {
    // Outro: up to two lines, the emphasis phrase in one deep-green rounded box on line 2 (else halves).
    const at = page.line2At > 0 && page.line2At < page.words.length ? page.line2At : Math.ceil(page.words.length / 2);
    const l1 = page.words.slice(0, at);
    const l2 = page.words.slice(at);
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
          {runs.map((run, r) => {
            if (!run[0].em) return word(run[0], r, runs.length, {});
            // The box grows in with its first letter, so it is never on screen empty.
            const t = letterT(abs, toFrame(run[0].startMs), 0);
            const b = interpolate(t, [0, 50], [0, 1], clamp);
            return (
              <span
                key={r}
                style={{
                  display: "inline-block", marginRight: r < runs.length - 1 ? "0.26em" : 0, background: DEEP_GREEN, borderRadius: 10, padding: "0 10px 4px",
                  textShadow: "none", opacity: b, transform: `scale(${0.85 + 0.15 * b})`,
                }}
              >
                {run.map((w, i) => word(w, i, run.length, {}))}
              </span>
            );
          })}
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
  const keyword = !!ctaKeyword && l2.length > 0 && l2.every((w) => cleanWord(w.text) === cleanWord(ctaKeyword));
  const k = onCam ? 0.78 : 1;
  const s2 = keyword ? fitSize(t2.length, 110, W * 0.7, 0.42) : fitSize(t2.length, 58 * k, (onCam ? 2 * FACECAM.r * 0.9 : W * 0.86), 0.42);
  // On the facecam the caption sits on the chest, below the chin.
  const top1 = onCam ? FACECAM.cy + FACECAM.r * 0.42 : H * 0.69 - 26;
  return (
    <>
      <div style={{ position: "absolute", top: top1, left: 0, width: W, textAlign: "center", whiteSpace: "nowrap", fontFamily: SANS, fontWeight: 600, fontSize: 36 * k, color: "white", textShadow: SHADOW }}>
        {l1.map((w, i) => word(w, i, l1.length, {}))}
      </div>
      {l2.length ? (
        <div style={{ position: "absolute", top: top1 + 48 * k, left: 0, width: W, textAlign: "center", whiteSpace: "nowrap", fontFamily: SERIF, fontStyle: "italic", fontSize: s2, lineHeight: 1.05, color: PEACH, textShadow: SHADOW }}>
          {l2.map((w, i) => word(w, i, l2.length, {}))}
        </div>
      ) : null}
    </>
  );
};

/** The page on screen at abs: the latest one that has started (lead frames early) and not yet ended. */
const activeOf = <T extends { startMs: number; endMs: number }>(pages: T[], abs: number, lead: number): T | undefined => {
  let page: T | undefined;
  for (const p of pages) if (abs + 1 + lead >= toFrame(p.startMs) && abs < toFrame(p.endMs)) page = p;
  return page;
};

export const Captions: React.FC<Props> = ({ words, run, headlines, ctaKeyword }) => {
  const frame = useCurrentFrame();
  const abs = toFrame(run.startMs) + frame;
  const { system } = run;
  const pages = useMemo(() => (system === "explainer" ? [] : buildPages(words, system, run.endMs)), [words, system, run.endMs]);
  const heads = useMemo(
    () => (system !== "explainer" ? [] : headlines && headlines.length ? headlines : fallbackHeadlines(words, run.endMs)),
    [system, headlines, words, run.endMs],
  );
  const scene = sceneAt(run, abs);
  if (system === "explainer") {
    const page = activeOf(heads, abs, HEADLINE_LEAD);
    if (!page) return null;
    return <ExplainerHeadline page={page} abs={abs + HEADLINE_LEAD} top={HEADLINE_TOP[scene.type === "split" ? "split" : "canvas"]} />;
  }
  const page = activeOf(pages, abs, 0);
  if (!page) return null;
  if (system === "hook") return <HookCaption page={page} abs={abs} />;
  return <TalkCaption page={page} abs={abs} room={run.room} onCam={scene.type === "split"} ctaKeyword={ctaKeyword} />;
};
