import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, CalculateMetadataFunction, Composition, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { fontsReady } from "../fonts";
import { AvatarLayer } from "./Avatar";
import { Canvas } from "./Canvas";
import { Captions } from "./Captions";
import { Entrance, PrevShot, pushOrigin, pushZoom, RecordingCard } from "./Card";
import { CommentCta, EndCard } from "./Cta";
import { OverlayLayer } from "./Overlays";
import { TextCard } from "./TextCard";
import {
  BACKDROP,
  Box,
  boxOf,
  CARD_BOX,
  clamp,
  FACECAM,
  FPS,
  H,
  isCanvas,
  smoothstep,
  speechAmount,
  systemOf,
  toFrame,
  toMs,
  W,
  wordsIn,
} from "./theme";
import { defaultExplainer, ExplainerProps, Music, Scene, Word } from "./types";

// =============================================================================================
// Metadata: duration from props; missing assets are dropped so a render never crashes on them.
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

export const sanitizeExplainer = async (p: ExplainerProps, exists: (src: string) => Promise<boolean>): Promise<ExplainerProps> => {
  const cache = new Map<string, Promise<boolean>>();
  const has = (src?: string | null) => {
    if (!src) return Promise.resolve(false);
    let r = cache.get(src);
    if (!r) {
      r = exists(src).catch(() => false);
      cache.set(src, r);
    }
    return r;
  };
  const scenes: Scene[] = [];
  for (const s of p.scenes) scenes.push(s.recording && !(await has(s.recording.src)) ? { ...s, recording: undefined } : s);
  const sfx = [];
  for (const x of p.sfx ?? []) if (await has(x.src)) sfx.push(x);
  return {
    ...p,
    avatar: { ...p.avatar, src: (await has(p.avatar.src)) ? p.avatar.src : "" },
    tail: p.tail && (await has(p.tail.src)) ? p.tail : null,
    scenes,
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
    props: await sanitizeExplainer(props, assetExists),
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

const FacecamRing: React.FC = () => {
  const ms = toMs(useCurrentFrame());
  const p = interpolate(ms, [0, 260], [0, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const r = FACECAM.r;
  return (
    <div
      style={{
        position: "absolute", left: FACECAM.cx - r - 6, top: FACECAM.cy - r - 6, width: 2 * r + 12, height: 2 * r + 12, borderRadius: "50%",
        border: "6px solid white", boxShadow: "0 24px 50px rgba(20,24,40,0.28)", transform: `scale(${0.9 + 0.1 * p})`, opacity: p,
      }}
    />
  );
};

const SceneView: React.FC<{ s: Scene; prev?: Scene; edit: ExplainerProps; words: Word[] }> = ({ s, prev, edit, words }) => {
  const sceneWords = useMemo(() => wordsIn(words, s), [words, s]);
  const system = systemOf(s);
  const room = !!edit.tail && s.startMs >= edit.tail.startMs - 40;
  const caption = system ? (
    <Captions words={sceneWords} system={system} sceneStartMs={s.startMs} sceneEndMs={s.endMs} layout={s.type === "split" ? "split" : "canvas"} room={room} />
  ) : null;
  const box = boxOf(s);
  const overlay = s.overlay ? <OverlayLayer o={s.overlay} card={box} /> : null;

  if (s.type === "endcard") return <EndCard keyword={edit.cta?.keyword ?? s.overlay?.text ?? ""} pill={s.overlay?.text} />;
  if (s.type === "avatar") {
    return (
      <>
        {overlay}
        {caption}
      </>
    );
  }
  if (s.type === "split") {
    return (
      <>
        <RecordingCard box={box} rec={s.recording} entrance={s.cardSlide ?? "in"} label={s.label} highlightMs={s.recording?.pushIn?.atMs} />
        <FacecamRing />
        {overlay}
        {caption}
      </>
    );
  }
  // Canvas scenes: card, stat, text.
  const { entrance, fromBox, prevShot } = entranceOf(s, prev);
  return (
    <AbsoluteFill>
      <Canvas />
      {s.type === "text" && s.items?.length ? (
        <TextCard box={CARD_BOX} items={s.items} durMs={s.endMs - s.startMs} />
      ) : s.type !== "text" || s.recording ? (
        <RecordingCard box={box} fromBox={fromBox} rec={s.recording} entrance={entrance} label={s.label} highlightMs={s.recording?.pushIn?.atMs} prev={prevShot} />
      ) : null}
      {overlay}
      {caption}
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
        pointerEvents: "none", opacity: o,
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
  const words = edit.captions?.words ?? [];
  const scenes = edit.scenes;
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
            <Canvas />
          </Sequence>
        ) : null,
      )}
      <AvatarLayer edit={edit} />
      {scenes.map((s, i) => {
        const from = toFrame(s.startMs);
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(1, toFrame(s.endMs) - from)} layout="none" name={`${s.id ?? s.type} ${i}`}>
            <SceneView s={s} prev={scenes[i - 1]} edit={edit} words={words} />
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

