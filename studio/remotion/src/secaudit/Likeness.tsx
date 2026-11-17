// Likeness check (owner rule 2026-11-17): neutral close-up of the human character, compared with his headshot.
import React from 'react';
import {AbsoluteFill, registerRoot, Composition} from 'remotion';
import {Stage} from './Stage';
const Still: React.FC<{cam: string}> = ({cam}) => {
  const C: Record<string, any> = {
    cu: {pos: [0, 3.0, 6.4], look: [0, 2.6, -2.35], fov: 30},
    three: {pos: [2.4, 3.1, 6.2], look: [0, 2.6, -2.35], fov: 32},
  };
  return <AbsoluteFill style={{background: '#0c1330'}}><Stage at={() => ({morning: false, cam: C[cam], boy: {mouth: 0, smile: 0.25, blink: 0, lookY: 0, lookX: cam === 'three' ? -0.3 : 0, brow: 0}, bot: null})} /></AbsoluteFill>;
};
export const LikenessRoot: React.FC = () => <>
  <Composition id="LikenessCU" component={Still as any} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{cam: 'cu'}} />
  <Composition id="Likeness34" component={Still as any} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{cam: 'three'}} />
</>;
registerRoot(LikenessRoot);
