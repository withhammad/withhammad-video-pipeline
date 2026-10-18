import { Audio } from "@remotion/media";
import { AbsoluteFill, CalculateMetadataFunction, Composition, Sequence, staticFile } from "remotion";
import { assetExists } from "../explainer/Explainer";
import { FPS, H, toFrame, toMs, W } from "./camera";
import { deskFontsReady } from "./fonts";
import { OverlayLayer } from "./Overlays";
import { StillLayer } from "./Stills";
import { defaultDeskReel, DeskReelProps, InsetSource, Music, Sfx } from "./types";

// =============================================================================================
// Metadata: duration from props. A missing still or inset source stops the render with the list (a typo must never
// render as a black frame or an empty card); missing music/SFX are dropped only with allowMissingAudio.
// =============================================================================================

export const checkDeskAssets = async (p: DeskReelProps, exists: (src: string) => Promise<boolean>): Promise<DeskReelProps> => {
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
  for (const s of p.stills) if (!(await has(s.src))) missing.push(`still ${s.id}: ${s.src}`);
  for (const o of p.overlays) {
    const srcs: InsetSource[] = o.type === "inset" ? [o.source, ...(o.swaps ?? [])] : [];
    for (const s of srcs) if (!(await has(s.src))) missing.push(`inset ${o.id ?? ""}: ${s.src}`);
    if (o.type === "image" && !(await has(o.src))) missing.push(`image ${o.id ?? ""}: ${o.src}`);
  }
  const audioMissing: string[] = [];
  if (p.music && !(await has(p.music.src))) audioMissing.push(`music: ${p.music.src}`);
  const sfx: Sfx[] = [];
  for (const x of p.sfx ?? []) {
    if (await has(x.src)) sfx.push(x);
    else audioMissing.push(`sfx: ${x.src}`);
  }
  if (!p.allowMissingAudio) missing.push(...audioMissing);
  if (missing.length) throw new Error(`DeskReel: ${missing.length} missing asset(s) under remotion/public/ (run edit_deskreel build): ${missing.join("; ")}`);
  return { ...p, music: p.music && (await has(p.music.src)) ? p.music : null, sfx };
};

const calculateMetadata: CalculateMetadataFunction<DeskReelProps> = async ({ props }) => {
  await deskFontsReady;
  return {
    durationInFrames: Math.max(1, toFrame(props.durationMs)),
    props: await checkDeskAssets(props, assetExists),
  };
};

export const DeskReelComposition = () => (
  <Composition
    id="DeskReel"
    component={DeskReel}
    durationInFrames={30}
    fps={FPS}
    width={W}
    height={H}
    defaultProps={defaultDeskReel}
    calculateMetadata={calculateMetadata}
  />
);

// =============================================================================================
// Sound: the references are music only (no voice), so the bed plays at its level with short edge fades.
// =============================================================================================

/** The bed's level on frame f: volume, times a linear fade-in over fadeInMs (none by default: the references start
 *  their bed at full level on frame 0) and a fade-out over the last fadeOutMs (120 ms by default). Each frame is
 *  measured at its END for the fade-in, so frame 0 is never silent, and at its start for the fade-out. */
export const musicLevel = (music: Music, durationMs: number, f: number) => {
  const volume = music.volume ?? 0.9;
  const ms = toMs(f);
  const fadeIn = music.fadeInMs && music.fadeInMs > 0 ? Math.min(1, (ms + 1000 / FPS) / music.fadeInMs) : 1;
  const fadeOutMs = Math.max(1, music.fadeOutMs ?? 120);
  const fadeOut = Math.max(0, Math.min(1, (durationMs - ms) / fadeOutMs));
  return Math.max(0, Math.min(1, volume * Math.min(fadeIn, fadeOut)));
};

const MusicBed: React.FC<{ music: Music; durationMs: number }> = ({ music, durationMs }) => (
  <Audio src={staticFile(music.src)} name="music" volume={(f) => musicLevel(music, durationMs, f)} />
);

const SfxHits: React.FC<{ sfx: Sfx[] }> = ({ sfx }) => (
  <>
    {sfx.map((x, i) => (
      <Sequence key={`sfx${i}`} from={Math.max(0, toFrame(x.atMs))} layout="none" name={`sfx ${i}`}>
        <Audio src={staticFile(x.src)} volume={Math.min(1, Math.max(0, x.volume ?? 0.3))} />
      </Sequence>
    ))}
  </>
);

// =============================================================================================
// The reel: stills (poses, camera, grade) under the overlays, then the sound.
// =============================================================================================

export const DeskReel: React.FC<DeskReelProps> = (p) => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <StillLayer stills={p.stills} poses={p.poses} camera={p.camera} grade={p.grade} />
    <OverlayLayer overlays={p.overlays} />
    {p.music ? <MusicBed music={p.music} durationMs={p.durationMs} /> : null}
    <SfxHits sfx={p.sfx ?? []} />
  </AbsoluteFill>
);
