import { Video } from "@remotion/media";
import { AbsoluteFill, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BACKDROP, clamp, FACECAM, FPS, H, sceneIndexAtFrame, toFrame, toMs, W } from "./theme";
import type { ExplainerProps, Scene } from "./types";

/** Eye line of the HeyGen framing (punch-ins zoom around the face). */
const FACE_ORIGIN = "50% 37%";
/** Facecam framing for split scenes: the take scaled into the circle under the card, eyes just above its centre. */
const CAM_SCALE = 0.5;
const CAM_TX = FACECAM.cx - (CAM_SCALE * W) / 2;
const CAM_TY = FACECAM.cy - 16 - CAM_SCALE * 0.36 * H;
/** After a split, the facecam shrinks away over this long instead of vanishing on the cut. */
const CAM_OUT_MS = 200;

const easeOutCubic = Easing.out(Easing.cubic);

/**
 * Hook pattern interrupt (scene-relative frame): frames 0-12 the presenter hangs upside-down and drops in from
 * -60% H with a vertical smear, frames 12-24 a spring whips him upright (overshoot capped at 4 deg).
 */
export const flipState = (f: number) => {
  const drop = (x: number) => interpolate(x, [0, 12], [0, 1], { ...clamp, easing: easeOutCubic });
  const y = (1 - drop(f)) * -0.6 * H;
  const vel = Math.abs(drop(f) - drop(f - 1)) * 0.6 * H;
  const sp = f < 12 ? 0 : spring({ frame: f - 12, fps: FPS, config: { damping: 13, stiffness: 190, mass: 0.55 } });
  const rot = Math.max(-4, 180 * (1 - sp));
  const rotPrev = f - 1 < 12 ? 180 : Math.max(-4, 180 * (1 - spring({ frame: f - 13, fps: FPS, config: { damping: 13, stiffness: 190, mass: 0.55 } })));
  const spin = Math.abs(rot - rotPrev);
  const land = interpolate(f, [11, 14, 22], [1, 1.05, 1], clamp);
  return { y, rot, smear: Math.min(26, vel * 0.22 + spin * 0.06), blur: Math.min(5, spin * 0.05), scale: land };
};

/** Facecam at this frame: radius and ring progress on a split scene (the ring scales in over 260 ms), and a
 *  shrinking circle for the first CAM_OUT_MS of a graphic scene that follows a split. Null: full frame. */
const camOf = (scenes: Scene[], idx: number, local: number): { r: number; ring: number } | null => {
  const s = scenes[idx];
  if (!s) return null;
  const ms = toMs(local);
  if (s.type === "split") return { r: FACECAM.r, ring: interpolate(ms, [0, 260], [0, 1], { ...clamp, easing: easeOutCubic }) };
  const prev = scenes[idx - 1];
  if (prev?.type === "split" && Math.abs(prev.endMs - s.startMs) < 40 && s.type !== "avatar" && s.type !== "endcard" && ms < CAM_OUT_MS) {
    const k = 1 - interpolate(ms, [0, CAM_OUT_MS], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
    return { r: FACECAM.r * k, ring: k };
  }
  return null;
};

const layerStyle = (s: Scene | undefined, local: number, cam: { r: number } | null): { outer: React.CSSProperties; inner: React.CSSProperties; smear: number } => {
  if (!s) return { outer: {}, inner: {}, smear: 0 };
  if (cam) {
    return {
      outer: { clipPath: `circle(${cam.r.toFixed(2)}px at ${FACECAM.cx}px ${FACECAM.cy}px)` },
      inner: { transformOrigin: "0 0", transform: `translate(${CAM_TX}px, ${CAM_TY}px) scale(${CAM_SCALE})` },
      smear: 0,
    };
  }
  if (s.type === "endcard") {
    const t = interpolate(toMs(local), [0, 320], [0, 1], clamp);
    return { outer: {}, inner: { transformOrigin: FACE_ORIGIN, transform: `scale(${1 + 0.06 * t})`, filter: t > 0.01 ? `blur(${(18 * t).toFixed(2)}px)` : undefined }, smear: 0 };
  }
  const punch = s.punch ?? 1;
  if (s.flipIn && local < 40) {
    const f = flipState(local);
    return {
      outer: {},
      inner: {
        transformOrigin: "50% 50%",
        transform: `translateY(${f.y}px) rotate(${f.rot}deg) scale(${punch * f.scale})`,
        filter: f.blur > 0.3 ? `blur(${f.blur.toFixed(2)}px)` : undefined,
      },
      smear: f.smear,
    };
  }
  return { outer: {}, inner: { transformOrigin: FACE_ORIGIN, transform: punch !== 1 ? `scale(${punch})` : undefined }, smear: 0 };
};

/** z-index of the presenter while it is a facecam: above the canvas scenes (so it can shrink away over the next
 *  graphic), under the captions and overlays (CAPTION_Z). */
export const CAM_Z = 5;
export const CAPTION_Z = 6;

/** One continuous presenter layer for the whole timeline (never remounted at a cut, so lip sync is unbroken). */
export const AvatarLayer: React.FC<{ edit: ExplainerProps }> = ({ edit }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const idx = sceneIndexAtFrame(edit.scenes, frame);
  const s = idx >= 0 ? edit.scenes[idx] : undefined;
  const local = s ? frame - toFrame(s.startMs) : 0;
  const cam = camOf(edit.scenes, idx, local);
  const { outer, inner, smear } = layerStyle(s, local, cam);
  const tailFrom = edit.tail ? Math.max(1, toFrame(edit.tail.startMs)) : durationInFrames;
  const filter = [smear > 0.5 ? "url(#vsmear)" : "", inner.filter ?? ""].join(" ").trim() || undefined;
  const rr = cam ? cam.r * (0.9 + 0.1 * Math.min(1, cam.ring)) : 0;
  return (
    <AbsoluteFill style={{ zIndex: cam ? CAM_Z : undefined }}>
      <AbsoluteFill style={{ backgroundColor: BACKDROP, ...outer }}>
        {smear > 0.5 ? (
          <svg width={0} height={0} style={{ position: "absolute" }}>
            <filter id="vsmear" x="-5%" y="-20%" width="110%" height="140%">
              <feGaussianBlur stdDeviation={`0 ${smear.toFixed(2)}`} />
            </filter>
          </svg>
        ) : null}
        <AbsoluteFill style={{ ...inner, filter }}>
          {edit.avatar.src ? (
            <Sequence durationInFrames={tailFrom} layout="none" name="avatar main">
              <Video src={staticFile(edit.avatar.src)} loop={edit.avatar.loop ?? false} objectFit="cover" style={{ width: "100%", height: "100%" }} />
            </Sequence>
          ) : null}
          {edit.tail?.src ? (
            <Sequence from={tailFrom} layout="none" name="avatar tail">
              <Video src={staticFile(edit.tail.src)} loop={edit.tail.loop ?? false} objectFit="cover" style={{ width: "100%", height: "100%" }} />
            </Sequence>
          ) : null}
        </AbsoluteFill>
      </AbsoluteFill>
      {cam && cam.r > 1 ? (
        <div
          style={{
            position: "absolute", left: FACECAM.cx - rr - 6, top: FACECAM.cy - rr - 6, width: 2 * rr + 12, height: 2 * rr + 12, borderRadius: "50%",
            border: "6px solid white", boxShadow: "0 24px 50px rgba(20,24,40,0.28)", opacity: Math.min(1, cam.ring), boxSizing: "border-box",
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
