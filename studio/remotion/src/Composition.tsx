import { Audio, Video } from "@remotion/media";
import { useMemo } from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Composition,
  Easing,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  buildPages,
  CapPage,
  Chrome,
  cleanWord,
  defaultEdit,
  EditProps,
  Focus,
  Highlight,
  musicGain,
  Music,
  punchAmount,
  punchTriggers,
  sanitizeEdit,
  Scene,
} from "./edit";
import type { Caption } from "@remotion/captions";
import { fontsReady } from "./fonts";

/** Matches the HeyGen take (25 fps): a 30 fps timeline repeats every 6th face frame (5 Hz judder). */
const FPS = 25;
const W = 720;
const H = 1280;
const BLUE = "#2f6bff";
const BLUE_LIGHT = "#7ea4ff";
/** Emphasis text on light scenes: BLUE fails 4.5:1 there; this measures 5.6–6.9:1. */
const BLUE_TEXT = "#1e40af";
const SANS = "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif";
const SERIF = "'Instrument Serif', 'New York', 'Iowan Old Style', Palatino, Georgia, 'Times New Roman', serif";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EXPO_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
const FRAME_MS = 1000 / FPS;
const IMG_ASPECT = 1280 / 800;

/** The presenter sits this far down the frame while a card is on screen (split and title scenes). */
/** Keeps the mouth above the bottom-20% platform UI band while cards sit on top. */
const LOWERED_PX = Math.round(H * 0.32);
/** Avatar zoom origin: the face (eye line of the HeyGen framing). */
const FACE_ORIGIN = "50% 38%";

const toMs = (frame: number, fps: number) => (frame / fps) * 1000;
const toFrame = (ms: number, fps: number) => Math.round((ms / 1000) * fps);
/** Same rounding as the scene Sequences, so layers never disagree for a frame at a cut. */
const sceneAtFrame = (scenes: Scene[], frame: number, fps: number) =>
  scenes.find((s) => frame >= toFrame(s.startMs, fps) && frame < toFrame(s.endMs, fps));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clampN = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const assetExists = async (src: string): Promise<boolean> => {
  try {
    const url = staticFile(src);
    const head = await fetch(url, { method: "HEAD" });
    if (head.ok) return true;
    if (head.status === 404) return false;
    const get = await fetch(url);
    return get.ok;
  } catch {
    return false;
  }
};

const calculateMetadata: CalculateMetadataFunction<EditProps> = async ({ props }) => ({
  ...(await fontsReady.then(() => ({}))),
  durationInFrames: Math.max(1, Math.ceil((props.durationMs / 1000) * FPS)),
  props: await sanitizeEdit(props, assetExists),
});

export const MyComposition = () => (
  <Composition
    id="Reel"
    component={Reel}
    durationInFrames={150}
    fps={FPS}
    width={W}
    height={H}
    defaultProps={defaultEdit}
    calculateMetadata={calculateMetadata}
  />
);

// =============================================================================================
// Presenter
// =============================================================================================

const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 90) * 18;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(120% 80% at 30% 10%, #ffffff 0%, #eef2f6 55%, #e1e7ee 100%)" }}>
      {/* soft daylight dapple, like light through leaves in the reference room */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(28% 16% at 18% 12%, rgba(120,140,160,0.10), transparent 70%)," +
            "radial-gradient(22% 12% at 82% 22%, rgba(120,140,160,0.08), transparent 70%)," +
            "radial-gradient(35% 18% at 60% 4%, rgba(255,255,255,0.7), transparent 70%)",
          transform: `translate(${drift}px, ${drift * 0.4}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** The avatar layer: lowered under the cards, slow constant push-in, punch-ins on emphasis and cuts. */
const AvatarLayer: React.FC<{ edit: EditProps; punches: ReturnType<typeof punchTriggers> }> = ({ edit, punches }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = toMs(frame, fps);
  const scene = sceneAtFrame(edit.scenes, frame, fps);
  const lowered = scene?.type === "split" || scene?.type === "title";
  const since = scene ? ms - scene.startMs : 0;
  const push = 1 + 0.04 * clampN(ms / Math.max(1, edit.durationMs), 0, 1);
  const punch = 1 + 0.07 * punchAmount(punches, ms);
  const endZoom = scene?.type === "end" ? interpolate(since, [0, Math.max(1, scene.endMs - scene.startMs)], [1.12, 1.2], clamp) : 1;
  const scale = push * punch * endZoom;
  const feather = lowered ? "linear-gradient(to bottom, transparent 0px, #000 110px)" : "none";
  return (
    <AbsoluteFill style={{ backgroundColor: "#eef2f5", overflow: "hidden" }}>
      <Backdrop />
      {edit.avatar ? (
        <AbsoluteFill style={{ transform: `translateY(${lowered ? LOWERED_PX : 0}px)`, maskImage: feather, WebkitMaskImage: feather }}>
          <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: FACE_ORIGIN }}>
            <Video src={staticFile(edit.avatar)} objectFit="cover" style={{ width: "100%", height: "100%" }} />
          </AbsoluteFill>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

// =============================================================================================
// Cards
// =============================================================================================

type Box = { left: number; top: number; width: number; height: number };
type View = { zoomFrom?: number; zoomTo?: number; panY?: [number, number]; highlight?: Highlight; focus?: Focus };
type Shot = { image?: string; view: View; durationMs: number; url?: string; chrome?: Chrome };

const BAR = 34;
const SPLIT_BOX: Box = { left: 44, top: 66, width: 632, height: 456 };
const TITLE_BOX: Box = { left: 74, top: 270, width: 572, height: 292 };
/** Title card when the title text comes from an insert: clears the insert's chip row (ends ~y 300). */
const TITLE_BOX_LOW: Box = { left: 74, top: 368, width: 572, height: 206 };
const BROLL_BOX: Box = { left: 34, top: 196, width: 652, height: 620 };

/** Ken Burns for a screenshot inside a W x H window. With a highlight the camera settles on it. */
const viewAt = (v: View, ms: number, durMs: number, cw: number, ch: number) => {
  const bw = Math.max(cw, ch * IMG_ASPECT);
  const bh = bw / IMG_ASPECT;
  const t = Easing.out(Easing.quad)(clampN(ms / Math.max(1, durMs), 0, 1));
  if (v.highlight || v.focus) {
    const f = v.focus ?? (v.highlight ? { x: v.highlight.x + v.highlight.w / 2, y: v.highlight.y + v.highlight.h / 2 } : { x: 50, y: 50 });
    const zf = v.zoomFrom ?? 1.25;
    const z = lerp(zf, v.zoomTo ?? zf + 0.12, t);
    const cx = f.x / 100 + 0.03 * (1 - t);
    const cy = f.y / 100 + 0.07 * (1 - t);
    const tx = clampN(cw / 2 - z * bw * cx, cw - z * bw, 0);
    const ty = clampN(ch / 2 - z * bh * cy, ch - z * bh, 0);
    return { bw, bh, tx, ty, z };
  }
  // No highlight: v1 behaviour (zoom from the top centre, optional vertical pan in % of the image).
  const z = lerp(v.zoomFrom ?? 1, v.zoomTo ?? 1.12, t);
  const pan = v.panY ?? [0, -6];
  return { bw, bh, tx: (cw - bw) / 2 + (bw / 2) * (1 - z), ty: (lerp(pan[0], pan[1], t) / 100) * bh, z };
};

const HighlightBox: React.FC<{ hl: Highlight; progress: number; z: number }> = ({ hl, progress, z }) => {
  if (progress <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: `${hl.x}%`,
        top: `${hl.y}%`,
        width: `${hl.w * progress}%`,
        height: `${hl.h}%`,
        background: "rgba(47,107,255,0.25)",
        border: `${3 / z}px solid ${BLUE}`,
        borderRadius: 10 / z,
        boxShadow: `0 0 ${18 / z}px rgba(47,107,255,${0.35 * progress})`,
        opacity: interpolate(progress, [0, 0.15], [0, 1], clamp),
      }}
    />
  );
};

const ShotImage: React.FC<{ shot: Shot; ms: number; cw: number; ch: number }> = ({ shot, ms, cw, ch }) => {
  const v = viewAt(shot.view, ms, shot.durationMs, cw, ch);
  const hl = shot.view.highlight;
  const delay = hl?.delayMs ?? Math.min(500, shot.durationMs * 0.22);
  const drawn = interpolate(ms, [delay, delay + 450], [0, 1], { ...clamp, easing: IN_OUT });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: v.bw,
        height: v.bh,
        transformOrigin: "0 0",
        transform: `translate(${v.tx}px, ${v.ty}px) scale(${v.z})`,
      }}
    >
      {shot.image ? <Img src={staticFile(shot.image)} style={{ width: "100%", height: "100%", display: "block" }} /> : null}
      {hl ? <HighlightBox hl={hl} progress={drawn} z={v.z} /> : null}
    </div>
  );
};

/** Card entrance: whip up from below with a velocity-driven blur and stretch (motion-blur feel). */
const whip = (ms: number, delayMs: number, distance: number) => {
  // Starts 60 ms "early" so the cut frame already shows the card in flight (no empty first frame).
  const curve = (m: number) => interpolate(m, [delayMs - 60, delayMs + 340], [0, 1], { ...clamp, easing: EXPO_OUT });
  const p = curve(ms);
  const vel = Math.abs(p - curve(ms - FRAME_MS));
  return {
    p,
    y: (1 - p) * distance,
    scale: 0.9 + 0.1 * p,
    stretch: 1 + Math.min(0.09, vel * 0.3),
    blur: Math.min(6, vel * 20),
    opacity: interpolate(ms, [delayMs - 60, delayMs + 50], [0, 1], clamp),
  };
};

const WindowBar: React.FC<{ kind: Chrome; dark: boolean; url?: string }> = ({ kind, dark, url }) => {
  const terminal = kind === "terminal";
  const bg = terminal ? "#1b1f27" : dark ? "#23232f" : "#f3f4f6";
  const line = terminal ? "#2a2f38" : dark ? "#2f2f3d" : "#e5e7eb";
  return (
    <div style={{ height: BAR, background: bg, display: "flex", alignItems: "center", gap: 7, paddingLeft: 14, borderBottom: `1px solid ${line}`, position: "relative", zIndex: 2 }}>
      {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
        <div key={c} style={{ width: 11, height: 11, borderRadius: 6, background: c }} />
      ))}
      {terminal ? (
        <div style={{ position: "absolute", left: 0, right: 0, textAlign: "center", fontFamily: SANS, fontSize: 13, fontWeight: 600, color: "#8b93a1" }}>zsh — ~/projects</div>
      ) : (
        <div
          style={{
            marginLeft: 16, flex: 1, marginRight: 60, height: 20, borderRadius: 10,
            background: dark ? "#16161f" : "white", border: `1px solid ${line}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: SANS, fontSize: 11.5, fontWeight: 500, color: dark ? "#9aa0b4" : "#6b7280",
          }}
        >
          {url ?? ""}
        </div>
      )}
    </div>
  );
};

/**
 * Floating window card. enter="whip" slides it up from below; enter="swap" keeps the frame still
 * and scroll-whips the previous screenshot out and the new one in (contiguous split scenes).
 */
const Card: React.FC<{ box: Box; shot: Shot; enter: "whip" | "swap" | "cut"; delayMs?: number; prev?: Shot; dark?: boolean }> = ({
  box, shot, enter, delayMs = 0, prev, dark = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = toMs(frame, fps);
  const cw = box.width;
  const ch = box.height - BAR;

  let wrap: React.CSSProperties = {};
  let content = <ShotImage shot={shot} ms={ms} cw={cw} ch={ch} />;
  if (enter === "cut") {
    // same screenshot as the previous scene: a hard punch-in, no second entrance
  } else if (enter === "whip") {
    const w = whip(ms, delayMs, 380);
    wrap = {
      transform: `translateY(${w.y}px) scale(${w.scale}, ${w.scale * w.stretch})`,
      opacity: w.opacity,
      filter: w.blur > 0.3 ? `blur(${w.blur.toFixed(2)}px)` : undefined,
    };
  } else {
    const curve = (m: number) => interpolate(m, [0, 300], [0, 1], { ...clamp, easing: IN_OUT });
    const s = curve(ms);
    const vel = Math.abs(s - curve(ms - FRAME_MS));
    const blur = Math.min(6, vel * 20);
    wrap = { transform: `scale(${1 - 0.018 * Math.sin(Math.PI * s)})` };
    if (s < 1) {
      content = (
        <div style={{ position: "absolute", inset: 0, filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined }}>
          {prev ? (
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", transform: `translateY(${-s * ch}px)` }}>
              <ShotImage shot={prev} ms={prev.durationMs} cw={cw} ch={ch} />
            </div>
          ) : null}
          <div style={{ position: "absolute", inset: 0, overflow: "hidden", transform: `translateY(${(1 - s) * ch}px)` }}>
            <ShotImage shot={shot} ms={ms} cw={cw} ch={ch} />
          </div>
        </div>
      );
    }
  }

  const terminal = shot.chrome === "terminal";
  const surface = terminal ? "#0d1117" : dark ? "#1e1e2e" : "white";
  return (
    <div
      style={{
        position: "absolute", left: box.left, top: box.top, width: box.width, height: box.height,
        borderRadius: 18, overflow: "hidden", background: surface,
        boxShadow: dark ? "0 0 0 2px rgba(47,107,255,0.55), 0 30px 80px rgba(0,0,0,0.6)" : "0 18px 50px rgba(20,40,80,0.22)",
        border: dark ? undefined : `3px solid ${BLUE}55`,
        ...wrap,
      }}
    >
      <WindowBar kind={shot.chrome ?? "browser"} dark={dark} url={shot.url} />
      <div style={{ position: "absolute", top: BAR, left: 0, width: cw, height: ch, overflow: "hidden" }}>{content}</div>
    </div>
  );
};

const shotOf = (s: Scene): Shot | undefined => {
  if (s.type === "end") return undefined;
  const view: View = { zoomFrom: s.zoomFrom, zoomTo: s.zoomTo, highlight: s.highlight, focus: s.focus };
  if (s.type === "split") view.panY = s.panY;
  if (s.type === "title") {
    view.zoomFrom = s.zoomFrom ?? 1;
    view.zoomTo = s.zoomTo ?? 1.06;
    view.panY = [0, 0];
  }
  return { image: s.image, view, durationMs: s.endMs - s.startMs, url: s.url, chrome: s.chrome };
};

// =============================================================================================
// Scenes
// =============================================================================================

const TitleScene: React.FC<{ scene: Extract<Scene, { type: "title" }> }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = toMs(frame, fps);
  const words = scene.line1.split(/\s+/).filter(Boolean);
  // The stagger starts 120 ms before the cut so frame 0 (the platform thumbnail) already shows the title.
  const pillOpen = interpolate(ms, [140, 460], [0, 1], { ...clamp, easing: IN_OUT });
  const textPop = spring({ frame: frame - toFrame(320, fps), fps, config: { damping: 12, stiffness: 180, mass: 0.6 } });
  const shot = shotOf(scene);
  // Landed before frame 0 so the first frame (the thumbnail) already shows the card.
  if (scene.hideText) return shot && shot.image ? <Card box={TITLE_BOX_LOW} shot={shot} enter="whip" delayMs={-300} /> : null;
  return (
    <>
      <div style={{ position: "absolute", top: 78, width: "100%", textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 58, color: "#111", letterSpacing: -1.2, whiteSpace: "nowrap" }}>
        {words.map((w, i) => {
          const t0 = -120 + i * 120;
          const p = interpolate(ms, [t0, t0 + 340], [0, 1], { ...clamp, easing: EXPO_OUT });
          return (
            <span key={i} style={{ display: "inline-block", marginRight: i < words.length - 1 ? "0.24em" : 0, opacity: interpolate(ms, [t0, t0 + 120], [0, 1], clamp), transform: `translateY(${(1 - p) * 26}px)`, filter: p < 0.98 ? `blur(${((1 - p) * 10).toFixed(2)}px)` : undefined }}>
              {w}
            </span>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 154, width: "100%", display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", padding: "2px 24px 8px", fontFamily: SERIF, fontStyle: "italic", fontSize: 60, color: "white", whiteSpace: "nowrap" }}>
          <div style={{ position: "absolute", inset: 0, background: BLUE, borderRadius: 10, transform: `scaleX(${pillOpen})`, boxShadow: `0 10px 30px rgba(47,107,255,${0.35 * pillOpen})` }} />
          <div style={{ position: "relative", opacity: interpolate(textPop, [0, 0.4], [0, 1], clamp), transform: `scale(${0.7 + 0.3 * textPop})` }}>{scene.line2}</div>
        </div>
      </div>
      {shot && shot.image ? <Card box={TITLE_BOX} shot={shot} enter="whip" delayMs={420} /> : null}
    </>
  );
};

const BRollScene: React.FC<{ scene: Extract<Scene, { type: "broll" }>; enter?: "whip" | "cut" }> = ({ scene, enter = "whip" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = toMs(frame, fps);
  const d = scene.endMs - scene.startMs;
  const zoom = interpolate(ms, [0, d], [1, 1.05], clamp);
  const glow = 0.5 + 0.15 * Math.sin(frame / 14);
  const shot = shotOf(scene);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(130% 70% at 50% 0%, #17223d 0%, #0a0e18 55%, #05070c 100%)" }}>
      <AbsoluteFill style={{ background: `radial-gradient(55% 32% at 50% 40%, rgba(47,107,255,${(0.32 * glow).toFixed(3)}), transparent 72%)` }} />
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: "50% 40%" }}>
        {shot ? <Card box={BROLL_BOX} shot={{ ...shot, view: { zoomFrom: 1.0, zoomTo: 1.12, panY: [0, -4], ...stripUndefined(shot.view) } }} enter={enter} dark /> : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const stripUndefined = (v: View): View => {
  const out: View = {};
  if (v.zoomFrom !== undefined) out.zoomFrom = v.zoomFrom;
  if (v.zoomTo !== undefined) out.zoomTo = v.zoomTo;
  if (v.panY !== undefined) out.panY = v.panY;
  if (v.highlight !== undefined) out.highlight = v.highlight;
  if (v.focus !== undefined) out.focus = v.focus;
  return out;
};

const EndWord: React.FC<{ word: string; keyword?: string; keywordAtMs?: number }> = ({ word, keyword, keywordAtMs = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!word && !keyword) return null;
  const pop = spring({ frame: frame + 2, fps, config: { damping: 13, stiffness: 190, mass: 0.6 } });
  const kPop = spring({ frame: frame - toFrame(keywordAtMs, fps) + 1, fps, config: { damping: 12, stiffness: 200, mass: 0.6 } });
  return (
    <>
      {word ? (
        <div
          style={{
            position: "absolute", top: keyword ? 742 : 778, width: "100%", textAlign: "center", fontFamily: SERIF, fontStyle: "italic",
            fontSize: keyword ? 88 : 96, color: "white", textShadow: "0 0 3px rgba(0,0,0,0.85), 0 4px 24px rgba(0,0,0,0.45)",
            opacity: interpolate(pop, [0, 0.35], [0, 1], clamp), transform: `translateY(${(1 - pop) * 18}px) scale(${0.82 + 0.18 * pop})`,
          }}
        >
          {word}
        </div>
      ) : null}
      {keyword ? (
        <div
          style={{
            position: "absolute", top: 826, width: "100%", textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 84, letterSpacing: 1,
            color: BLUE_LIGHT, textShadow: "0 0 3px rgba(0,0,0,0.85), 0 0 28px rgba(90,140,255,0.75), 0 4px 18px rgba(0,0,0,0.5)",
            opacity: interpolate(kPop, [0, 0.35], [0, 1], clamp), transform: `translateY(${(1 - kPop) * 14}px) scale(${0.8 + 0.2 * kPop})`,
          }}
        >
          {keyword}
        </div>
      ) : null}
    </>
  );
};

// =============================================================================================
// Captions: 1–2 words, each word pops in; emphasis in blue italic serif
// =============================================================================================

const CAPTION_TOP: Record<Scene["type"], number> = { title: 572, split: 548, broll: 860, end: 912 };

const Captions: React.FC<{ edit: EditProps; pages: CapPage[] }> = ({ edit, pages }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const page = pages.find((p) => frame >= toFrame(p.startMs, fps) && frame < toFrame(p.endMs, fps));
  if (!page) return null;
  const scene = sceneAtFrame(edit.scenes, frame, fps);
  // The end card carries the CTA alone; captions.srt still has the full line for accessibility.
  if (scene?.type === "end" && scene.keyword) return null;
  const type = scene?.type ?? "split";
  const dark = type === "broll" || type === "end";
  const skip = new Set(scene?.type === "end" ? [scene.word, scene.keyword ?? ""].flatMap((x) => x.split(/\s+/)).map(cleanWord).filter(Boolean) : []);
  // Only words already spoken take space, so the light-scene pill never shows a blank slot for the next word.
  const words = page.words.filter((w) => !skip.has(w.clean) && frame - toFrame(w.startMs, fps) + 1 >= 0);
  if (!words.length) return null;
  return (
    <div style={{ position: "absolute", top: CAPTION_TOP[type], left: 0, width: "100%", display: "flex", justifyContent: "center", whiteSpace: "nowrap", lineHeight: 1.12 }}>
      {/* Light scenes: a white pill keeps captions off the hair and above 4.5:1 contrast. */}
      <div style={dark ? {} : { background: "rgba(255,255,255,0.92)", borderRadius: 16, padding: "2px 18px 6px", boxShadow: "0 6px 20px rgba(20,40,80,0.12)" }}>
      {words.map((w, j) => {
        // +1: each word lands one frame ahead of the voice, which reads as in sync.
        const since = frame - toFrame(w.startMs, fps) + 1;
        const visible = since >= 0;
        const sp = visible ? spring({ frame: since, fps, config: { damping: 13, stiffness: 230, mass: 0.55 } }) : 0;
        const blur = visible ? interpolate(since, [0, 3], [6, 0], clamp) : 0;
        const color = w.em ? (dark ? BLUE_LIGHT : BLUE_TEXT) : dark ? "white" : "#111";
        return (
          <span
            key={j}
            style={{
              display: "inline-block",
              marginRight: j < words.length - 1 ? (w.em ? "0.22em" : "0.26em") : 0,
              fontFamily: w.em ? SERIF : SANS,
              fontStyle: w.em ? "italic" : "normal",
              fontWeight: w.em ? 400 : 800,
              fontSize: w.em ? 82 : 64,
              letterSpacing: w.em ? 0 : -1.2,
              color,
              textShadow: dark
                ? w.em ? "0 0 22px rgba(90,140,255,0.6), 0 3px 14px rgba(0,0,0,0.5)" : "0 3px 16px rgba(0,0,0,0.55)"
                : "0 0 2px #fff, 0 0 4px #fff, 0 0 8px rgba(255,255,255,0.9)",
              visibility: visible ? "visible" : "hidden",
              opacity: visible ? interpolate(since, [0, 2], [0.15, 1], clamp) : 0,
              transform: `translateY(${(1 - sp) * 16}px) scale(${0.8 + 0.2 * sp})`,
              transformOrigin: "50% 80%",
              filter: blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : undefined,
            }}
          >
            {w.text}
          </span>
        );
      })}
      </div>
    </div>
  );
};

// =============================================================================================
// Finishing: grain + vignette, audio, overlays
// =============================================================================================

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = frame % 12;
  const id = `grain-${seed}`;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 75% at 50% 46%, transparent 58%, rgba(10,18,36,0.16) 100%)" }} />
      <AbsoluteFill style={{ mixBlendMode: "soft-light", opacity: 0.32 }}>
        <svg width={W} height={H} viewBox={`0 0 ${W / 2} ${H / 2}`} preserveAspectRatio="none">
          <filter id={id} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width={W / 2} height={H / 2} filter={`url(#${id})`} />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const MusicTrack: React.FC<{ music: Music; captions: Caption[]; durationMs: number }> = ({ music, captions, durationMs }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const volume = musicGain(music, captions, toMs(frame, fps), durationMs);
  return <Audio src={staticFile(music.src)} volume={volume} loop={music.loop ?? false} name="music" />;
};

export const Reel: React.FC<EditProps> = (edit) => {
  const { fps } = useVideoConfig();
  const pages = useMemo(() => buildPages(edit.captions, edit.emphasis), [edit.captions, edit.emphasis]);
  const punches = useMemo(() => punchTriggers(edit.scenes, pages), [edit.scenes, pages]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#eef2f5" }}>
      <AvatarLayer edit={edit} punches={punches} />
      {edit.scenes.map((s, i) => {
        const from = toFrame(s.startMs, fps);
        const dur = Math.max(1, toFrame(s.endMs, fps) - from);
        const prevScene = edit.scenes[i - 1];
        const contiguous = s.type === "split" && prevScene?.type === "split" && Math.abs(prevScene.endMs - s.startMs) < 40;
        const shot = shotOf(s);
        return (
          <Sequence key={i} from={from} durationInFrames={dur} layout="none" name={`${s.type} ${i}`}>
            {s.type === "title" ? <TitleScene scene={s} /> : null}
            {s.type === "split" && shot ? (
              <Card box={SPLIT_BOX} shot={shot} enter={contiguous ? "swap" : "whip"} prev={contiguous ? shotOf(prevScene) : undefined} />
            ) : null}
            {s.type === "broll" ? (
              <BRollScene scene={s} enter={prevScene?.type === "broll" && prevScene.image === s.image && Math.abs(prevScene.endMs - s.startMs) < 40 ? "cut" : "whip"} />
            ) : null}
            {s.type === "end" ? (
              <EndWord
                word={s.word}
                keyword={s.keyword}
                keywordAtMs={Math.max(0, (edit.captions.find((cap) => s.keyword && cleanWord(cap.text) === cleanWord(s.keyword) && cap.startMs >= s.startMs - 50)?.startMs ?? s.startMs) - s.startMs)}
              />
            ) : null}
          </Sequence>
        );
      })}
      {(edit.inserts ?? []).map((ins, i) => {
        const from = toFrame(ins.startMs, fps);
        const dur = Math.max(1, toFrame(ins.endMs, fps) - from);
        return (
          <Sequence key={`ins${i}`} from={from} durationInFrames={dur} layout="none" name={`insert ${i}`}>
            <AbsoluteFill style={{ pointerEvents: "none" }}>
              <Video src={staticFile(ins.src)} muted objectFit="cover" style={{ width: "100%", height: "100%" }} />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      <Captions edit={edit} pages={pages} />
      <Grain />
      {edit.music ? <MusicTrack music={edit.music} captions={edit.captions} durationMs={edit.durationMs} /> : null}
      {(edit.sfx ?? []).map((x, i) => {
        const at = toFrame(x.atMs, fps);
        return (
          <Sequence key={`sfx${i}`} from={Math.max(0, at)} layout="none" name={`sfx ${i}`}>
            <Audio src={staticFile(x.src)} volume={clampN(x.volume ?? 0.35, 0, 1)} trimBefore={at < 0 ? -at : undefined} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
