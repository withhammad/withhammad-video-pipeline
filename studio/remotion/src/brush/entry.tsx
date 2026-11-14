import React from 'react';
import {AbsoluteFill, Audio, Composition, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {Brush, type BrushProps} from './Brush';
import words from './words.json';

const font = (family: string, file: string, weight: string) => loadFont({family, url: staticFile(`fonts/${file}`), weight});
export const fontsReady = Promise.all([
  ...['500', '600', '700', '800', '900'].map(w => font('Inter', `inter-latin-${w}-normal.woff2`, w)),
  ...['700', '800', '900'].map(w => font('Montserrat', `montserrat-latin-${w}-normal.woff2`, w)),
  font('JetBrains Mono', 'jetbrains-mono-latin-500-normal.woff2', '500'), font('JetBrains Mono', 'jetbrains-mono-latin-700-normal.woff2', '700'),
  font('Anton', 'anton-latin-400-normal.woff2', '400'),
]);
type Props = BrushProps & {audio?: string};
const Edit: React.FC<Props> = ({audio, ...p}) => <AbsoluteFill><Brush {...p} />{audio && <Audio src={staticFile(audio)} />}</AbsoluteFill>;
// The public dir is the job's render-public folder (fonts/, x/): see render.mjs. 1392 frames = the 46.29 s narration
// rounded up to a whole frame (1389) + 0.1 s. stars and forks: api.github.com/repos/JohnHeibel/ClaudeAnimationBase, 14 Nov 2026.
registerRoot(() => <Composition id="BRUSH" component={Edit} width={1080} height={1920} fps={30} durationInFrames={1392}
  defaultProps={{words, stars: 2970, forks: 288, audio: 'x/voice.mp3'} as Props} />);
