import React from 'react';
import {AbsoluteFill, Audio, Composition, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {Carbon, type CarbonProps} from './Carbon';
import words from './words.json';

const font = (family: string, file: string, weight: string, style = 'normal') => loadFont({family, url: staticFile(`fonts/${file}`), weight, style});
export const fontsReady = Promise.all([
  ...['500', '600', '700', '800'].map(w => font('Figtree', `figtree-latin-${w}-normal.woff2`, w)),
  ...['500', '600'].map(w => font('Newsreader', `newsreader-latin-${w}-italic.woff2`, w, 'italic')),
  font('Poppins', 'poppins-latin-800-normal.woff2', '800'),
  ...['500', '600', '700', '800'].map(w => font('Inter', `inter-latin-${w}-normal.woff2`, w)),
  font('JetBrains Mono', 'jetbrains-mono-latin-500-normal.woff2', '500'), font('JetBrains Mono', 'jetbrains-mono-latin-700-normal.woff2', '700'),
]);
type Props = CarbonProps & {audio?: string};
const Edit: React.FC<Props> = ({audio, ...p}) => <AbsoluteFill><Carbon {...p} />{audio && <Audio src={staticFile(audio)} />}</AbsoluteFill>;
// The public dir is the job's render-public folder (fonts/, x/): see render.mjs. 4234 frames = the 141.009 s narration
// rounded up to frame 4231 plus 0.1 s. Optional prop `avatar` (a video under the public dir): see SLOTS in Carbon.tsx.
registerRoot(() => <Composition id="CARBON" component={Edit} width={1080} height={1920} fps={30} durationInFrames={4234}
  defaultProps={{words, audio: 'x/voice.mp3'} as Props} />);
