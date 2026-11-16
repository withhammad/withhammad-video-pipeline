import React from 'react';
import {AbsoluteFill, Audio, Composition, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {Blender3d, type BlenderProps} from './Blender3d';
import words from './words.json';

const font = (family: string, file: string, weight: string, style = 'normal') => loadFont({family, url: staticFile(`fonts/${file}`), weight, style});
export const fontsReady = Promise.all([
  ...['500', '600', '700', '800', '900'].map(w => font('Inter', `inter-latin-${w}-normal.woff2`, w)),
  font('JetBrains Mono', 'jetbrains-mono-latin-500-normal.woff2', '500'), font('JetBrains Mono', 'jetbrains-mono-latin-700-normal.woff2', '700'),
  font('Instrument Serif', 'instrument-serif-latin-400-italic.woff2', '400', 'italic'),
]);
type Props = BlenderProps & {audio?: string};
const Edit: React.FC<Props> = ({audio, ...p}) => <AbsoluteFill><Blender3d {...p} />{audio && <Audio src={staticFile(audio)} />}</AbsoluteFill>;
// Public dir = the job's render-public folder (fonts/, x/): see render.mjs. 39.63 s narration -> 1190 frames.
registerRoot(() => <Composition id="BLENDER" component={Edit} width={1080} height={1920} fps={30} durationInFrames={1190}
  defaultProps={{words, audio: 'x/voice.mp3'} as Props} />);
