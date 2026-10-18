import { Video } from "@remotion/media";
import { AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { MusicTrack, SfxTracks } from "../Sound";
import { clamp, EXPO_OUT, H, sceneIndexAtFrame, toFrame, toMs, W } from "../theme";
import type { ExplainerProps, Scene } from "../types";
import { HarvestCaptions } from "./HarvestCaptions";
import { HarvestCardView } from "./HarvestCards";
import { HarvestCta } from "./HarvestCta";
import { RegionRecording } from "./HarvestRecording";
import {
  CARD, closeUpScale, DARK_BG, FACE_ORIGIN, LIGHT_BG, PAPER, PIP, PIP_BG, PIP_REC_TOP, PIP_SCALE, PIP_TX, PIP_TY, SPLIT_SHIFT, SPLIT_Y,
} from "./layout";

/**
 * Theme "harvest" (props.theme): the Nate Herk reference format. One continuous presenter layer (never remounted,
 * so lip sync is unbroken) is framed per scene: punch-in close-up, the bottom 54% of a split, or the PiP window
 * above the composer. Scenes draw what sits around it; captions and the CTA run on top. All cuts are hard cuts and
 * every motion is derived from the frame.
 */

const CAM_Z = 3;
const CAPTION_Z = 10;

const AvatarLayer: React.FC<{ edit: ExplainerProps }> = ({ edit }) => {
  const frame = useCurrentFrame();
  const idx = sceneIndexAtFrame(edit.scenes, frame);
  const s: Scene | undefined = edit.scenes[idx];
  let outer: React.CSSProperties = {};
  let inner: React.CSSProperties = {};
  let z = 0;
  if (s?.type === "split") {
    outer = { clipPath: `inset(${SPLIT_Y}px 0 0 0)` };
    inner = { transform: `translateY(${SPLIT_SHIFT}px)` };
  } else if (s?.type === "pip") {
    outer = { clipPath: `inset(${PIP.top}px ${W - PIP.left - PIP.width}px ${H - PIP.top - PIP.height}px ${PIP.left}px round ${PIP.radius}px)` };
    inner = { transformOrigin: "0 0", transform: `translate(${PIP_TX}px, ${PIP_TY}px) scale(${PIP_SCALE})` };
    z = CAM_Z;
  } else if (!s || s.type === "avatar") {
    const k = idx >= 0 ? closeUpScale(edit.scenes, idx) : 1;
    inner = { transformOrigin: FACE_ORIGIN, transform: `scale(${k})` };
  }
  return (
    <AbsoluteFill style={{ zIndex: z }}>
      <AbsoluteFill style={{ backgroundColor: "#000", ...outer }}>
        <AbsoluteFill style={inner}>
          {edit.avatar.src ? <Video src={staticFile(edit.avatar.src)} loop={edit.avatar.loop ?? false} objectFit="cover" style={{ width: "100%", height: "100%" }} /> : null}
        </AbsoluteFill>
      </AbsoluteFill>
      {s?.type === "pip" ? (
        <div
          style={{
            position: "absolute", left: PIP.left - PIP.border / 2, top: PIP.top - PIP.border / 2, width: PIP.width + PIP.border, height: PIP.height + PIP.border,
            borderRadius: PIP.radius + PIP.border / 2, border: `${PIP.border}px solid ${PIP.color}`, boxSizing: "border-box",
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

/** The reference's green square that morphs into a check box (scene 18), straddling the card's top edge. */
const CheckFx: React.FC = () => {
  const ms = toMs(useCurrentFrame());
  const grow = interpolate(ms, [80, 240], [0, 1], { ...clamp, easing: EXPO_OUT });
  const draw = interpolate(ms, [300, 520], [0, 1], clamp);
  const size = 72;
  if (grow <= 0) return null;
  return (
    <div
      style={{
        position: "absolute", left: W / 2 - size / 2, top: CARD.top - size / 2 - 6, width: size, height: size, borderRadius: 18, background: "#2DFF06",
        transform: `scale(${grow.toFixed(4)})`, boxShadow: "0 10px 26px rgba(45,255,6,0.25)", display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <svg width={44} height={44} viewBox="0 0 24 24">
        <path d="M4.5 12.5l5 5L19.5 7" fill="none" stroke="#0B0B0B" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={24} strokeDashoffset={24 * (1 - draw)} />
      </svg>
    </div>
  );
};

/** A full-bleed recording (the reference's scene 2: the screen fills the frame edge to edge) with a slow linear
 *  push-in to s.push over the whole scene. */
const BleedScene: React.FC<{ s: Scene }> = ({ s }) => {
  const ms = toMs(useCurrentFrame());
  const k = interpolate(ms, [0, Math.max(1, s.endMs - s.startMs)], [1, s.push ?? 1], clamp);
  return (
    <AbsoluteFill style={{ background: s.tone === "dark" ? DARK_BG : "white", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: k !== 1 ? `scale(${k.toFixed(4)})` : undefined, transformOrigin: "50% 35%" }}>
        {s.recording ? <RegionRecording rec={s.recording} w={W} h={H} /> : null}
      </AbsoluteFill>
      {s.fx?.check ? <CheckFx /> : null}
    </AbsoluteFill>
  );
};

/** A full-frame recording: a plain card on a plain canvas, settling in over 280 ms after the hard cut. */
const CardScene: React.FC<{ s: Scene }> = ({ s }) => {
  const ms = toMs(useCurrentFrame());
  const dark = s.tone === "dark";
  if (s.bleed) return <BleedScene s={s} />;
  const settle = s.swap ? 1 : interpolate(ms, [0, 280], [1.025, 1], { ...clamp, easing: EXPO_OUT });
  return (
    <AbsoluteFill style={{ background: dark ? DARK_BG : LIGHT_BG }}>
      <div
        style={{
          position: "absolute", left: CARD.left, top: CARD.top, width: CARD.width, height: CARD.height, borderRadius: CARD.radius, overflow: "hidden",
          background: dark ? "#0d1117" : "white", transform: `scale(${settle.toFixed(4)})`,
          boxShadow: dark ? "0 0 0 1px rgba(255,255,255,0.08), 0 26px 60px rgba(0,0,0,0.55)" : "0 18px 50px rgba(20,20,30,0.12), 0 2px 8px rgba(20,20,30,0.06)",
        }}
      >
        {s.recording ? <RegionRecording rec={s.recording} w={CARD.width} h={CARD.height} /> : null}
      </div>
      {s.fx?.check ? <CheckFx /> : null}
    </AbsoluteFill>
  );
};

const SceneView: React.FC<{ s: Scene }> = ({ s }) => {
  const durMs = s.endMs - s.startMs;
  if (s.type === "split") {
    return (
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: SPLIT_Y, overflow: "hidden", background: s.tone === "dark" ? DARK_BG : LIGHT_BG }}>
        {s.card ? <HarvestCardView card={s.card} w={W} h={SPLIT_Y} durMs={durMs} /> : s.recording ? <RegionRecording rec={s.recording} w={W} h={SPLIT_Y} /> : null}
      </div>
    );
  }
  if (s.type === "pip") {
    return (
      <AbsoluteFill style={{ background: PIP_BG }}>
        {s.recording ? (
          <div style={{ position: "absolute", left: 0, top: PIP_REC_TOP, width: W, height: H - PIP_REC_TOP }}>
            <RegionRecording rec={s.recording} w={W} h={H - PIP_REC_TOP} />
          </div>
        ) : null}
      </AbsoluteFill>
    );
  }
  if (s.type === "card") return <CardScene s={s} />;
  if (s.type === "text" || s.type === "stat") {
    if (s.card) return <HarvestCardView card={s.card} durMs={durMs} />;
    return s.recording ? <CardScene s={s} /> : <AbsoluteFill style={{ background: PAPER }} />;
  }
  return s.fx?.check ? <CheckFx /> : null;
};

export const HarvestExplainer: React.FC<ExplainerProps> = (edit) => {
  const scenes = edit.scenes;
  const durationMs = edit.durationMs ?? Math.max(1000, ...scenes.map((s) => s.endMs));
  const cta = edit.cta;
  const ctaFrom = cta ? toFrame(cta.atMs) : 0;
  const end = toFrame(durationMs);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AvatarLayer edit={edit} />
      {scenes.map((s, i) => {
        const from = toFrame(s.startMs);
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(1, toFrame(s.endMs) - from)} layout="none" name={`${s.id ?? s.type} ${i}`}>
            <SceneView s={s} />
          </Sequence>
        );
      })}
      <AbsoluteFill style={{ zIndex: CAPTION_Z }}>
        <HarvestCaptions chunks={edit.chunks ?? []} scenes={scenes} ctaAtMs={cta?.atMs} />
      </AbsoluteFill>
      {cta && ctaFrom < end ? (
        <Sequence from={ctaFrom} durationInFrames={Math.max(1, end - ctaFrom)} layout="none" name="cta">
          <AbsoluteFill style={{ zIndex: CAPTION_Z + 1 }}>
            <HarvestCta cta={cta} avatarSrc={edit.avatar.src} />
          </AbsoluteFill>
        </Sequence>
      ) : null}
      {edit.music ? <MusicTrack music={edit.music} words={edit.captions?.words ?? []} durationMs={durationMs} /> : null}
      <SfxTracks sfx={edit.sfx ?? []} />
    </AbsoluteFill>
  );
};
