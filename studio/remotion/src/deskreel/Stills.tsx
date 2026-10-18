import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { cameraAt, cameraVelocity, H, onAt, W } from "./camera";
import type { CameraShot, Grade, Pose, Still } from "./types";

/** A square around the frame centre big enough to hold the frame at any rotation (the "motion" blur turns the
 *  picture into the blur's axis and back, and a filter never paints outside its element's box). */
const DIAG = Math.ceil(Math.hypot(W, H)) + 2;

/**
 * The presenter layer: the pose on this frame (a hard 1-frame swap, no blend), aligned by its fit, moved by the
 * shot's camera. The still is cover-fitted to the frame first; the fit (alignment) is applied inside the camera, so
 * a whip or a sag moves every pose of the shot together, like a real phone on a desk.
 */
export const StillLayer: React.FC<{ stills: Still[]; poses: Pose[]; camera: CameraShot[]; grade?: Grade }> = ({ stills, poses, camera, grade }) => {
  const frame = useCurrentFrame();
  const pose = poses.find((p) => onAt(frame, p.startMs, p.endMs));
  const still = pose ? stills.find((s) => s.id === pose.still) : undefined;
  const cam = cameraAt(camera, frame);
  const fit = still?.fit ?? {};
  const blur = cam.blurPx > 0.05 ? cam.blurPx : 0;
  // the blur's axis in screen degrees: 0 = horizontal streaks; null = an isotropic defocus
  let axisDeg: number | null = null;
  if (blur && cam.blurAxis === "x") axisDeg = 0;
  else if (blur && cam.blurAxis === "y") axisDeg = 90;
  else if (blur && cam.blurAxis === "motion") {
    const v = cameraVelocity(camera, frame);
    axisDeg = Math.hypot(v.dx, v.dy) < 0.5 ? 0 : (Math.atan2(v.dy, v.dx) * 180) / Math.PI;
  }
  const filterId = `deskblur-${frame}`;
  const picture = still ? (
    <AbsoluteFill
      style={{
        transform: `translate(${cam.x.toFixed(2)}px, ${cam.y.toFixed(2)}px) rotate(${cam.rot.toFixed(3)}deg) scale(${cam.scale.toFixed(4)})`,
        transformOrigin: `${W / 2}px ${H / 2}px`,
        filter: blur && axisDeg === null ? `blur(${blur.toFixed(2)}px)` : undefined,
      }}
    >
      <AbsoluteFill
        style={{
          transform: `translate(${(fit.dx ?? 0).toFixed(2)}px, ${(fit.dy ?? 0).toFixed(2)}px) rotate(${(fit.rot ?? 0).toFixed(3)}deg) scale(${(fit.scale ?? 1).toFixed(4)})`,
          transformOrigin: `${W / 2}px ${H / 2}px`,
        }}
      >
        <Img src={staticFile(still.src)} style={{ width: W, height: H, objectFit: "cover", ...pictureFilter(grade) }} />
      </AbsoluteFill>
    </AbsoluteFill>
  ) : null;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      {axisDeg !== null && still ? (
        <>
          <svg width={0} height={0} style={{ position: "absolute" }}>
            <filter id={filterId} x="0" y="0" width="100%" height="100%" filterUnits="objectBoundingBox">
              <feGaussianBlur stdDeviation={`${blur} 0`} edgeMode="duplicate" />
            </filter>
          </svg>
          {/* Directional blur along axisDeg: a DIAG square turned to the axis blurs along its own x, and the
              picture inside it is turned back, so only the streaks keep the angle. */}
          <div
            style={{
              position: "absolute", left: (W - DIAG) / 2, top: (H - DIAG) / 2, width: DIAG, height: DIAG,
              transform: `rotate(${axisDeg.toFixed(2)}deg)`, filter: `url(#${filterId})`,
            }}
          >
            <div
              style={{
                position: "absolute", left: (DIAG - W) / 2, top: (DIAG - H) / 2, width: W, height: H,
                transform: `rotate(${(-axisDeg).toFixed(2)}deg)`, overflow: "visible",
              }}
            >
              {picture}
            </div>
          </div>
        </>
      ) : (
        picture
      )}
      <GradeLayer grade={grade} />
    </AbsoluteFill>
  );
};

/** On the picture itself: warmth (warm: a touch of sepia and saturation; cool: a hue nudge) and soften (a small blur
 *  that brings the AI still's detail down to phone-footage sharpness). */
const pictureFilter = (grade?: Grade): React.CSSProperties => {
  const w = Math.max(-1, Math.min(1, grade?.warmth ?? 0));
  const soften = Math.max(0, Math.min(2, grade?.soften ?? 0));
  const parts: string[] = [];
  if (w >= 0.01) parts.push(`sepia(${(0.22 * w).toFixed(3)})`, `saturate(${(1 + 0.08 * w).toFixed(3)})`);
  if (w <= -0.01) parts.push(`hue-rotate(${(-12 * w).toFixed(2)}deg)`, `saturate(${(1 + 0.15 * w).toFixed(3)})`);
  if (soften >= 0.05) parts.push(`blur(${soften.toFixed(2)}px)`);
  return parts.length ? { filter: parts.join(" ") } : {};
};

/** Phone-footage finish over the stills (never over the overlays): animated sensor grain and a soft vignette. The
 *  grain is coarse (about 2 px clumps, baseFrequency 0.5) and strong enough to survive H.264 at the platform bit
 *  rates: per-pixel noise is the first thing an encoder throws away. */
const GradeLayer: React.FC<{ grade?: Grade }> = ({ grade }) => {
  const frame = useCurrentFrame();
  const grain = Math.max(0, Math.min(1, grade?.grain ?? 0));
  const vignette = Math.max(0, Math.min(1, grade?.vignette ?? 0));
  const id = `deskgrain-${frame}`;
  return (
    <>
      {grain > 0 ? (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: Math.min(1, 1.1 * grain), mixBlendMode: "overlay" }}>
          <filter id={id}>
            <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves={1} seed={frame % 997} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="linear" slope="1.8" intercept="-0.4" />
              <feFuncG type="linear" slope="1.8" intercept="-0.4" />
              <feFuncB type="linear" slope="1.8" intercept="-0.4" />
            </feComponentTransfer>
          </filter>
          <rect width={W} height={H} filter={`url(#${id})`} />
        </svg>
      ) : null}
      {vignette > 0 ? (
        <AbsoluteFill
          style={{ background: `radial-gradient(120% 85% at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,${(0.55 * vignette).toFixed(3)}) 100%)` }}
        />
      ) : null}
    </>
  );
};
