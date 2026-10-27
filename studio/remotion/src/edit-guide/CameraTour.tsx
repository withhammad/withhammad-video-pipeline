// A 9:16 reel made from a 4:5 board: the hook over the whole board, a camera that visits stops in order, and a
// pull-back for the keyword ending. Posts 1 and 2 use it so the reel always matches the poster.
import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {BLUE, GridPaper, INK, MUTED, SANS} from './ui';

export type Stop = {cx: number; cy: number; k: number; hold?: number};
export type TourSpec = {
  full: Stop;                // the whole board, shown under the hook and the ending
  stops: Stop[];
  intro: number;             // s on the full board with the hook
  move: number;              // s per camera move
  hold: number;              // default s per stop
  outro: number;             // s back on the full board with the ending
};

export const tourLength = (s: TourSpec) =>
  s.intro + s.stops.reduce((a, st) => a + s.move + (st.hold ?? s.hold), 0) + s.move + s.outro;

// Start time of each move (index i moves from key i to key i+1, keys = [full, ...stops, full]).
export const moveStarts = (s: TourSpec) => {
  const out = [s.intro];
  s.stops.forEach((st) => out.push(out[out.length - 1] + s.move + (st.hold ?? s.hold)));
  return out;
};

const ease = Easing.bezier(0.65, 0, 0.35, 1);

const cameraAt = (s: TourSpec, t: number): Stop => {
  const keys = [s.full, ...s.stops, s.full];
  const starts = moveStarts(s);
  for (let i = 0; i < keys.length - 1; i++) {
    if (t < starts[i]) return keys[i];
    if (t < starts[i] + s.move) {
      const p = ease((t - starts[i]) / s.move);
      const a = keys[i], b = keys[i + 1];
      // zoom in log space so the scale change feels even
      const k = Math.exp(Math.log(a.k) + (Math.log(b.k) - Math.log(a.k)) * p);
      return {cx: a.cx + (b.cx - a.cx) * p, cy: a.cy + (b.cy - a.cy) * p, k};
    }
  }
  return s.full;
};

const band = (side: 'top' | 'bottom'): React.CSSProperties => ({
  position: 'absolute', left: 0, right: 0, [side]: 0, height: side === 'top' ? 290 : 285,
  background: `linear-gradient(${side === 'top' ? '180deg' : '0deg'}, #f7f8fb 78%, rgba(247,248,251,0))`,
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: SANS,
});

export const CameraTour: React.FC<{spec: TourSpec; board: (style: React.CSSProperties) => React.ReactNode;
  hook: React.ReactNode; hookSize?: number; hookPill: string; ctaTitle: React.ReactNode; keyword: string; ctaSub: string}> =
  ({spec, board, hook, hookSize = 86, hookPill, ctaTitle, keyword, ctaSub}) => {
  const frame = useCurrentFrame();
  const {durationInFrames, fps} = useVideoConfig();
  const t = frame / fps;
  const cam = cameraAt(spec, t);
  const end = durationInFrames / fps;
  const hookOpacity = interpolate(t, [spec.intro, spec.intro + 0.3], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const ctaOpacity = interpolate(t, [end - spec.outro + 0.2, end - spec.outro + 0.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#f7f8fb', overflow: 'hidden'}}>
      <GridPaper step={30}/>
      {board({translate: `${540 - cam.cx * cam.k}px ${960 - cam.cy * cam.k}px`, scale: String(cam.k)})}

      {/* hook, on screen from frame 0 */}
      <div style={{...band('top'), opacity: hookOpacity}}>
        <div style={{fontWeight: 900, fontSize: hookSize, letterSpacing: -hookSize * 0.04, color: INK, lineHeight: 1.04,
          textAlign: 'center'}}>{hook}</div>
      </div>
      <div style={{...band('bottom'), opacity: hookOpacity}}>
        <span style={{background: INK, color: 'white', borderRadius: 40, padding: '18px 34px', fontWeight: 700, fontSize: 44}}>
          {hookPill}
        </span>
      </div>

      {/* keyword ending */}
      <div style={{...band('top'), opacity: ctaOpacity}}>
        <div style={{fontWeight: 900, fontSize: 80, letterSpacing: -3, color: INK, lineHeight: 1.05}}>{ctaTitle}</div>
      </div>
      <div style={{...band('bottom'), opacity: ctaOpacity, gap: 16}}>
        <span style={{background: BLUE, color: 'white', borderRadius: 40, padding: '18px 40px', fontWeight: 800, fontSize: 52,
          boxShadow: '0 10px 30px rgba(31,107,255,0.35)'}}>Comment "{keyword}"</span>
        <span style={{color: MUTED, fontWeight: 600, fontSize: 32}}>{ctaSub}</span>
      </div>
    </AbsoluteFill>
  );
};
