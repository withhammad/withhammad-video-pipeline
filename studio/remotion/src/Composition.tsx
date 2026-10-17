import { createTikTokStyleCaptions } from "@remotion/captions";
import { Video } from "@remotion/media";
import { useMemo } from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Composition,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { defaultEdit, EditProps, Scene } from "./edit";

const FPS = 30;
const BLUE = "#2f6bff";
const SANS = "'Inter', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif";
const SERIF = "'Instrument Serif', Georgia, 'Times New Roman', serif";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const calculateMetadata: CalculateMetadataFunction<EditProps> = ({ props }) => ({
  durationInFrames: Math.max(1, Math.ceil((props.durationMs / 1000) * FPS)),
});

export const MyComposition = () => (
  <Composition
    id="Reel"
    component={Reel}
    durationInFrames={150}
    fps={FPS}
    width={720}
    height={1280}
    defaultProps={defaultEdit}
    calculateMetadata={calculateMetadata}
  />
);

const sceneAt = (scenes: Scene[], ms: number) => scenes.find((s) => ms >= s.startMs && ms < s.endMs);

/** The avatar layer. Split scenes push the presenter into the lower half like the reference reel. */
const AvatarLayer: React.FC<{ src: string; scenes: Scene[] }> = ({ src, scenes }) => {
  const frame = useCurrentFrame();
  const ms = (frame / FPS) * 1000;
  const scene = sceneAt(scenes, ms);
  const lowered = scene?.type === "split" || scene?.type === "title";
  const since = scene ? ms - scene.startMs : 0;
  const enter = interpolate(since, [0, 280], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const offset = lowered ? interpolate(enter, [0, 1], [0, 34]) : 0;
  const endZoom = scene?.type === "end" ? interpolate(since, [0, 2500], [1.12, 1.2], clamp) : 1;
  return (
    <AbsoluteFill style={{ backgroundColor: "#eef2f5", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(120% 80% at 30% 10%, #ffffff 0%, #eef2f6 55%, #e3e9ef 100%)" }} />
      <AbsoluteFill style={{ translate: `0 ${offset}%`, scale: String(endZoom) }}>
        <Video src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Floating browser-window card with a screenshot, slow zoom and pan. */
const BrowserCard: React.FC<{ image: string; durationMs: number; zoomFrom?: number; zoomTo?: number; panY?: [number, number] }> = ({
  image, durationMs, zoomFrom = 1.0, zoomTo = 1.12, panY = [0, -6],
}) => {
  const frame = useCurrentFrame();
  const ms = (frame / FPS) * 1000;
  return (
    <div
      style={{
        position: "absolute", left: 44, right: 44, top: 70, height: 430, borderRadius: 18, overflow: "hidden",
        background: "white", boxShadow: "0 18px 50px rgba(20,40,80,0.22)", border: `3px solid ${BLUE}55`,
        scale: String(interpolate(ms, [0, 260], [0.92, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) })),
        opacity: interpolate(ms, [0, 180], [0, 1], clamp),
      }}
    >
      <div style={{ height: 34, background: "#f3f4f6", display: "flex", alignItems: "center", gap: 7, paddingLeft: 14, borderBottom: "1px solid #e5e7eb" }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => <div key={c} style={{ width: 11, height: 11, borderRadius: 6, background: c }} />)}
        <div style={{ marginLeft: 16, flex: 1, marginRight: 60, height: 20, borderRadius: 10, background: "white", border: "1px solid #e5e7eb" }} />
      </div>
      <div style={{ position: "absolute", top: 34, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
        <Img
          src={staticFile(image)}
          style={{
            width: "100%", height: "100%", objectFit: "cover", objectPosition: "top",
            scale: String(interpolate(ms, [0, durationMs], [zoomFrom, zoomTo], clamp)),
            translate: `0 ${interpolate(ms, [0, durationMs], panY, clamp)}%`,
            transformOrigin: "50% 0%",
          }}
        />
      </div>
    </div>
  );
};

const TitleCard: React.FC<{ line1: string; line2: string; image?: string; durationMs: number }> = ({ line1, line2, image, durationMs }) => {
  const frame = useCurrentFrame();
  const ms = (frame / FPS) * 1000;
  const pop = interpolate(ms, [120, 420], [0.6, 1], { ...clamp, easing: Easing.bezier(0.34, 1.56, 0.64, 1) });
  return (
    <>
      <div style={{ position: "absolute", top: 70, width: "100%", textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 56, color: "#111", letterSpacing: -1 }}>
        {line1}
      </div>
      <div style={{ position: "absolute", top: 142, width: "100%", display: "flex", justifyContent: "center" }}>
        <div style={{ background: BLUE, color: "white", fontFamily: SERIF, fontStyle: "italic", fontSize: 58, padding: "2px 22px 8px", borderRadius: 8, scale: String(pop) }}>
          {line2}
        </div>
      </div>
      {image ? (
        <div style={{ position: "absolute", top: 160, left: 0, right: 0 }}>
          <div style={{ translate: "0 70px" }}>
            <BrowserCard image={image} durationMs={durationMs} zoomFrom={1} zoomTo={1.06} panY={[0, 0]} />
          </div>
        </div>
      ) : null}
    </>
  );
};

const BRoll: React.FC<{ image: string; durationMs: number }> = ({ image, durationMs }) => {
  const frame = useCurrentFrame();
  const ms = (frame / FPS) * 1000;
  return (
    <AbsoluteFill style={{ background: "#0b0f17", justifyContent: "center", alignItems: "center" }}>
      <Img
        src={staticFile(image)}
        style={{ width: "92%", borderRadius: 14, boxShadow: "0 0 0 2px #2f6bff88, 0 30px 80px rgba(0,0,0,0.6)",
          scale: String(interpolate(ms, [0, durationMs], [1.0, 1.15], clamp)) }}
      />
    </AbsoluteFill>
  );
};

const EndWord: React.FC<{ word: string }> = ({ word }) => {
  const frame = useCurrentFrame();
  const ms = (frame / FPS) * 1000;
  return (
    <div style={{ position: "absolute", top: 820, width: "100%", textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 92, color: "white",
      textShadow: "0 4px 24px rgba(0,0,0,0.45)", opacity: interpolate(ms, [0, 200], [0, 1], clamp),
      scale: String(interpolate(ms, [0, 300], [0.85, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) })) }}>
      {word}
    </div>
  );
};

/** One or two words at a time in the middle band; emphasis words in blue italic serif. */
const Captions: React.FC<{ edit: EditProps }> = ({ edit }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const ms = (frame / fps) * 1000;
  const { pages } = useMemo(
    () => createTikTokStyleCaptions({ captions: edit.captions, combineTokensWithinMilliseconds: 450 }),
    [edit.captions],
  );
  const emphasis = useMemo(() => new Set(edit.emphasis.map((w) => w.toLowerCase())), [edit.emphasis]);
  const scene = sceneAt(edit.scenes, ms);
  if (scene?.type === "end" || scene?.type === "title") return null;
  const dark = scene?.type === "broll";
  const top = dark ? 1040 : 560;
  return (
    <>
      {pages.map((page, i) => {
        const next = pages[i + 1];
        const from = Math.round((page.startMs / 1000) * fps);
        const to = Math.round(((next ? next.startMs : page.startMs + 900) / 1000) * fps);
        if (to <= from) return null;
        return (
          <Sequence key={i} from={from} durationInFrames={to - from} layout="none">
            <div style={{ position: "absolute", top, width: "100%", textAlign: "center", padding: "0 40px" }}>
              {page.tokens.map((t, j) => {
                const word = t.text.trim();
                const clean = word.toLowerCase().replace(/[^a-z0-9']/g, "");
                const em = emphasis.has(clean);
                return (
                  <span key={j} style={{
                    fontFamily: em ? SERIF : SANS, fontStyle: em ? "italic" : "normal", fontWeight: em ? 400 : 800,
                    fontSize: em ? 78 : 66, color: em ? BLUE : dark ? "white" : "#111", letterSpacing: em ? 0 : -1,
                    textShadow: dark ? "0 2px 12px rgba(0,0,0,0.5)" : "0 2px 14px rgba(255,255,255,0.9)",
                  }}>
                    {(j ? " " : "") + word}
                  </span>
                );
              })}
            </div>
          </Sequence>
        );
      })}
    </>
  );
};

export const Reel: React.FC<EditProps> = (edit) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#eef2f5" }}>
      <AvatarLayer src={edit.avatar} scenes={edit.scenes} />
      {edit.scenes.map((s, i) => {
        const from = Math.round((s.startMs / 1000) * fps);
        const dur = Math.max(1, Math.round(((s.endMs - s.startMs) / 1000) * fps));
        const d = s.endMs - s.startMs;
        return (
          <Sequence key={i} from={from} durationInFrames={dur} layout="none">
            {s.type === "title" ? <TitleCard line1={s.line1} line2={s.line2} image={s.image} durationMs={d} /> : null}
            {s.type === "split" ? <BrowserCard image={s.image} durationMs={d} zoomFrom={s.zoomFrom} zoomTo={s.zoomTo} panY={s.panY} /> : null}
            {s.type === "broll" ? <BRoll image={s.image} durationMs={d} /> : null}
            {s.type === "end" ? <EndWord word={s.word} /> : null}
          </Sequence>
        );
      })}
      <Captions edit={edit} />
    </AbsoluteFill>
  );
};
