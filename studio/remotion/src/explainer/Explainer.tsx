import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, CalculateMetadataFunction, Composition, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { fontsReady } from "../fonts";
import { AvatarLayer, CAPTION_Z } from "./Avatar";
import { Canvas } from "./Canvas";
import { CaptionRun, Captions } from "./Captions";
import { Entrance, PrevShot, pushOrigin, pushZoom, RecordingCard } from "./Card";
import { CommentCta, EndCard } from "./Cta";
import { OverlayLayer } from "./Overlays";
import { TextCard } from "./TextCard";
import { BACKDROP, Box, boxOf, CARD_BOX, cleanWord, FPS, H, isCanvas, smoothstep, speechAmount, systemOf, toFrame, toMs, W, wordsBetween } from "./theme";
import { defaultExplainer, ExplainerProps, Music, Scene, TailSrc, Word } from "./types";

// =============================================================================================
// Metadata: duration from props. A missing presenter take or recording stops the render with the list of
// missing files (a typo or an unstaged file must never render as a blank frame or an empty card); missing
// music/SFX are dropped only when the props say allowMissingAudio.
// =============================================================================================

const assetExists = async (src: string): Promise<boolean> => {
  try {
    const url = staticFile(src);
    const head = await fetch(url, { method: "HEAD" });
    if (head.ok) return true;
    if (head.status === 404) return false;
    return (await fetch(url)).ok;
  } catch {
    return false;
  }
};

export const checkExplainerAssets = async (p: ExplainerProps, exists: (src: string) => Promise<boolean>): Promise<ExplainerProps> => {
  const cache = new Map<string, Promise<boolean>>();
  const has = (src: string) => {
    let r = cache.get(src);
    if (!r) {
      r = exists(src).catch(() => false);
      cache.set(src, r);
    }
    return r;
  };
  const missing: string[] = [];
  const need = async (label: string, src?: string | null) => {
    if (!src) missing.push(`${label} (no src)`);
    else if (!(await has(src))) missing.push(`${label}: ${src}`);
  };
  if (p.scenes.some((s) => s.type === "avatar" || s.type === "split" || s.type === "endcard")) await need("avatar", p.avatar?.src);
  if (p.tail) await need("tail", p.tail.src);
  for (const [i, s] of p.scenes.entries()) if (s.recording) await need(`scene ${s.id ?? i} recording`, s.recording.src);
  const audioMissing: string[] = [];
  if (p.music && !(await has(p.music.src))) audioMissing.push(`music: ${p.music.src}`);
  const sfx = [];
  for (const x of p.sfx ?? []) {
    if (await has(x.src)) sfx.push(x);
    else audioMissing.push(`sfx: ${x.src}`);
  }
  if (!p.allowMissingAudio) missing.push(...[...new Set(audioMissing)]);
  if (missing.length) {
    throw new Error(`Explainer: ${missing.length} missing asset(s) under remotion/public/ (stage the job first): ${missing.join("; ")}`);
  }
  return {
    ...p,
    captions: { words: p.captions?.words ?? [] },
    music: p.music && (await has(p.music.src)) ? p.music : null,
    sfx,
  };
};

export const durationMsOf = (p: ExplainerProps) => p.durationMs ?? Math.max(1000, ...p.scenes.map((s) => s.endMs));

const calculateMetadata: CalculateMetadataFunction<ExplainerProps> = async ({ props }) => {
  await fontsReady;
  return {
    durationInFrames: Math.max(1, Math.ceil((durationMsOf(props) / 1000) * FPS)),
    props: await checkExplainerAssets(props, assetExists),
  };
};

export const ExplainerComposition = () => (
  <Composition
    id="Explainer"
    component={Explainer}
    durationInFrames={75}
    fps={FPS}
    width={W}
    height={H}
    defaultProps={defaultExplainer}
    calculateMetadata={calculateMetadata}
  />
);

// =============================================================================================
// Scenes
// =============================================================================================

const contiguous = (a: Scene | undefined, b: Scene) => !!a && Math.abs(a.endMs - b.startMs) < 40;

/**
 * How a card arrives. After a contiguous card (or split) it never re-enters: the same recording simply continues
 * (the box morphs if the layout changes); a different one dissolves in over the previous card's frozen last frame.
 */
const entranceOf = (s: Scene, prev: Scene | undefined): { entrance: Entrance; fromBox?: Box; prevShot?: PrevShot } => {
  if (prev && contiguous(prev, s) && (isCanvas(prev) || prev.type === "split") && prev.type !== "text") {
    const a = boxOf(prev);
    const b = boxOf(s);
    const fromBox = a.top === b.top && a.height === b.height && a.width === b.width && a.left === b.left ? undefined : a;
    const pr = prev.recording;
    const r = s.recording;
    const prevDur = prev.endMs - prev.startMs;
    if (pr && r && pr.src === r.src && Math.abs(r.inMs - (pr.inMs + prevDur * (pr.playbackRate ?? 1))) < 250) return { entrance: "none", fromBox };
    const prevShot = pr ? { rec: pr, frames: toFrame(prev.endMs) - toFrame(prev.startMs), zoom: pushZoom(pr, prevDur), origin: pushOrigin(pr) } : undefined;
    return { entrance: "swap", fromBox, prevShot };
  }
  if (s.cardSlide) return { entrance: s.cardSlide };
  return { entrance: "in" };
};

/** Scene visuals (captions run separately, per caption run). Overlays sit above the facecam (CAPTION_Z). */
const SceneView: React.FC<{ s: Scene; prev?: Scene; edit: ExplainerProps }> = ({ s, prev, edit }) => {
  const box = boxOf(s);
  const overlay = s.overlay ? (
    <AbsoluteFill style={{ zIndex: CAPTION_Z }}>
      <OverlayLayer o={s.overlay} card={box} />
    </AbsoluteFill>
  ) : null;

  if (s.type === "endcard") return <EndCard keyword={edit.cta?.keyword ?? s.overlay?.text ?? ""} pill={s.overlay?.text} />;
  if (s.type === "avatar") return overlay;
  if (s.type === "split") {
    // The split card always scales in: sliding up would carry it through the facecam circle.
    return (
      <>
        <RecordingCard box={box} rec={s.recording} entrance="in" label={s.label} highlightMs={s.recording?.pushIn?.atMs} />
        {overlay}
      </>
    );
  }
  // Canvas scenes: card, stat, text.
  const { entrance, fromBox, prevShot } = entranceOf(s, prev);
  return (
    <AbsoluteFill>
      <Canvas frameOffset={toFrame(s.startMs)} />
      {s.type === "text" && s.items?.length ? (
        <TextCard box={CARD_BOX} items={s.items} durMs={s.endMs - s.startMs} />
      ) : s.type !== "text" || s.recording ? (
        <RecordingCard box={box} fromBox={fromBox} rec={s.recording} entrance={entrance} label={s.label} highlightMs={s.recording?.pushIn?.atMs} prev={prevShot} />
      ) : null}
      {overlay}
    </AbsoluteFill>
  );
};

// =============================================================================================
// Caption runs: contiguous scenes that share a caption system render ONE caption track, so a punch-in jump cut
// inside a talking head never resets a page. A new run starts where the system changes, at the second look
// (its caption variant), and, for headlines, at a new beat.
// =============================================================================================

export const captionRuns = (scenes: Scene[], tail?: TailSrc | null): CaptionRun[] => {
  const runs: CaptionRun[] = [];
  for (const s of scenes) {
    const system = systemOf(s);
    if (!system) continue;
    const room = !!tail && s.startMs >= tail.startMs - 40;
    const last = runs[runs.length - 1];
    const lastScene = last?.scenes[last.scenes.length - 1];
    if (last && last.system === system && last.room === room && Math.abs(last.endMs - s.startMs) < 40 && (system !== "explainer" || (lastScene?.beat ?? "") === (s.beat ?? ""))) {
      last.endMs = s.endMs;
      last.scenes.push(s);
    } else {
      runs.push({ system, startMs: s.startMs, endMs: s.endMs, scenes: [s], room });
    }
  }
  return runs;
};

/** Words a giant display overlay already shows ("Hold on.") are not captioned again (the reference never
 *  captions its display word): matching words within 1.5 s of the overlay's start are left out. */
const withoutDisplayWords = (words: Word[], scenes: Scene[]) => {
  const drop = new Set<Word>();
  for (const s of scenes) {
    const o = s.overlay;
    if (!o || o.kind !== "bigtext") continue;
    const want = new Set(o.text.split(/\s+/).map(cleanWord).filter(Boolean));
    const t0 = s.startMs + (o.atMs ?? 0);
    for (const w of words) if (w.startMs >= t0 - 300 && w.startMs <= t0 + 1500 && want.has(cleanWord(w.text))) drop.add(w);
  }
  return drop.size ? words.filter((w) => !drop.has(w)) : words;
};

const RunCaptions: React.FC<{ run: CaptionRun; words: Word[]; edit: ExplainerProps }> = ({ run, words, edit }) => {
  const runWords = useMemo(() => wordsBetween(words, run.startMs, run.endMs), [words, run.startMs, run.endMs]);
  const headlines = useMemo(
    () => (run.system === "explainer" && edit.headlines ? edit.headlines.filter((h) => h.startMs >= run.startMs && h.startMs < run.endMs).map((h) => ({ ...h, endMs: Math.min(h.endMs, run.endMs) })) : undefined),
    [run.system, run.startMs, run.endMs, edit.headlines],
  );
  return (
    <AbsoluteFill style={{ zIndex: CAPTION_Z }}>
      <Captions words={runWords} run={run} headlines={headlines} ctaKeyword={edit.cta?.keyword} />
    </AbsoluteFill>
  );
};

// =============================================================================================
// Finishing: warm light-leak dissolve out of the hook, music bed ducked under the voice, SFX.
// =============================================================================================

const LightLeak: React.FC<{ atMs: number }> = ({ atMs }) => {
  const t = toMs(useCurrentFrame()) - atMs;
  if (t < -340 || t > 340) return null;
  const o = 0.9 * Math.min(smoothstep((t + 340) / 300), 1 - smoothstep((t - 20) / 320));
  const x = interpolate(t, [-340, 340], [12, 88]);
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none", opacity: o, zIndex: CAPTION_Z + 1,
        background: `radial-gradient(75% 55% at ${x}% 40%, rgba(255,248,236,1) 0%, rgba(255,222,176,0.94) 36%, rgba(250,190,128,0.62) 64%, rgba(255,236,214,0.4) 100%)`,
      }}
    />
  );
};

const MusicTrack: React.FC<{ music: Music; words: Word[]; durationMs: number }> = ({ music, words, durationMs }) => {
  const volume = music.volume ?? 0.12;
  const duckTo = music.duckTo ?? 0.07;
  const fadeOut = Math.max(1, music.fadeOutMs ?? 500);
  return (
    <Audio
      src={staticFile(music.src)}
      name="music"
      volume={(f) => {
        const ms = toMs(f);
        const g = volume + (duckTo - volume) * speechAmount(words, ms);
        return Math.max(0, Math.min(1, g * Math.min(1, Math.max(0, (durationMs - ms) / fadeOut))));
      }}
    />
  );
};

export const Explainer: React.FC<ExplainerProps> = (edit) => {
  const scenes = edit.scenes;
  const words = useMemo(() => withoutDisplayWords(edit.captions?.words ?? [], scenes), [edit.captions, scenes]);
  const runs = useMemo(() => captionRuns(scenes, edit.tail), [scenes, edit.tail]);
  const durationMs = durationMsOf(edit);
  // The hook may be split by jump cuts: the leak sits on the end of the last contiguous hook scene.
  let hookEnd: number | undefined;
  for (const s of scenes) {
    if (systemOf(s) !== "hook") break;
    hookEnd = s.endMs;
  }
  const cta = edit.cta;
  const ctaIdx = cta ? scenes.findIndex((s) => cta.atMs >= s.startMs && cta.atMs < s.endMs) : -1;
  const ctaScene = ctaIdx >= 0 ? scenes[ctaIdx] : undefined;
  // The CTA runs through jump cuts inside the same talking head, until the next graphic or the second look.
  let ctaEndMs = ctaScene?.endMs ?? 0;
  for (let i = ctaIdx + 1; ctaIdx >= 0 && i < scenes.length; i++) {
    const n = scenes[i];
    if (n.type !== "avatar" || Math.abs(n.startMs - ctaEndMs) > 40 || (edit.tail && n.startMs >= edit.tail.startMs - 40)) break;
    ctaEndMs = n.endMs;
  }
  return (
    <AbsoluteFill style={{ backgroundColor: BACKDROP }}>
      {scenes.map((s, i) =>
        s.type === "split" ? (
          <Sequence key={`bg${i}`} from={toFrame(s.startMs)} durationInFrames={Math.max(1, toFrame(s.endMs) - toFrame(s.startMs))} layout="none" name={`canvas ${i}`}>
            <Canvas frameOffset={toFrame(s.startMs)} />
          </Sequence>
        ) : null,
      )}
      <AvatarLayer edit={edit} />
      {scenes.map((s, i) => {
        const from = toFrame(s.startMs);
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(1, toFrame(s.endMs) - from)} layout="none" name={`${s.id ?? s.type} ${i}`}>
            <SceneView s={s} prev={scenes[i - 1]} edit={edit} />
          </Sequence>
        );
      })}
      {runs.map((run, i) => {
        const from = toFrame(run.startMs);
        return (
          <Sequence key={`cap${i}`} from={from} durationInFrames={Math.max(1, toFrame(run.endMs) - from)} layout="none" name={`captions ${run.system} ${i}`}>
            <RunCaptions run={run} words={words} edit={edit} />
          </Sequence>
        );
      })}
      {cta && ctaScene && ctaScene.type !== "endcard" ? (
        <Sequence from={toFrame(cta.atMs)} durationInFrames={Math.max(1, toFrame(ctaEndMs) - toFrame(cta.atMs))} layout="none" name="cta">
          <CommentCta cta={cta} />
        </Sequence>
      ) : null}
      {hookEnd !== undefined && hookEnd < durationMs ? <LightLeak atMs={hookEnd} /> : null}
      {edit.music ? <MusicTrack music={edit.music} words={words} durationMs={durationMs} /> : null}
      {(edit.sfx ?? []).map((x, i) => (
        <Sequence key={`sfx${i}`} from={Math.max(0, toFrame(x.atMs))} layout="none" name={`sfx ${i}`}>
          <Audio src={staticFile(x.src)} volume={Math.min(1, Math.max(0, x.volume ?? 0.3))} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

