import { useCurrentFrame } from "remotion";
import { RecordingVideo } from "../Card";
import { toMs, zoomAt } from "../theme";
import type { Recording } from "../types";

const REC_W = 1080;
const REC_H = 1350;

/** Source size: 1080x1350 unless the recording says otherwise (a 9:16 full-bleed recording). */
export const sourceSize = (rec: Recording): [number, number] => rec.size ?? [REC_W, REC_H];

/** Where the source sits inside a w x h region: "cover" aligned by focusY, or (cropTop) the width fitted and that
 *  fraction of the source cut off the top. */
export const sourceRect = (rec: Recording, w: number, h: number) => {
  const [sw, sh] = sourceSize(rec);
  if (rec.cropTop !== undefined) {
    const c = w / sw;
    return { c, x: 0, y: -rec.cropTop * sh * c };
  }
  const c = Math.max(w / sw, h / sh);
  return { c, x: (w - sw * c) / 2, y: (h - sh * c) * (rec.focusY ?? 0.5) };
};

/**
 * A real screen recording filling a w x h region (split top panel, card, PiP composer). Push-ins on the recorder's
 * highlight boxes (rec.zooms) aim at the box with the same math as the default card; masks paint over boxes of the
 * source and move with it. Everything is a function of the scene-relative frame.
 */
export const RegionRecording: React.FC<{ rec: Recording; w: number; h: number }> = ({ rec, w, h }) => {
  const ms = toMs(useCurrentFrame());
  const r = sourceRect(rec, w, h);
  const z = rec.cropTop !== undefined ? { scale: 1, originX: w / 2, originY: h / 2 } : zoomAt(rec.zooms, ms, w, h, rec.focusY ?? 0.5);
  const [srcW, srcH] = sourceSize(rec);
  const sw = srcW * r.c;
  const sh = srcH * r.c;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: z.scale !== 1 ? `scale(${z.scale.toFixed(4)})` : undefined, transformOrigin: `${z.originX.toFixed(1)}px ${z.originY.toFixed(1)}px` }}>
        <div style={{ position: "absolute", left: r.x, top: r.y, width: sw, height: sh }}>
          <RecordingVideo rec={rec} />
          {(rec.masks ?? []).map((m, i) => (
            <div key={i} style={{ position: "absolute", left: m.box[0] * sw, top: m.box[1] * sh, width: m.box[2] * sw, height: m.box[3] * sh, background: m.color }} />
          ))}
        </div>
      </div>
    </div>
  );
};
