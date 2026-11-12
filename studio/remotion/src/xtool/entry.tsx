import React from 'react';
import {AbsoluteFill, Audio, Composition, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {Xtool, type XtoolProps} from './Xtool';
import words from './words.json';

const font = (family: string, file: string, weight: string) => loadFont({family, url: staticFile(`fonts/${file}`), weight});
export const fontsReady = Promise.all([
  ...['500', '600', '700', '800', '900'].map(w => font('Inter', `inter-latin-${w}-normal.woff2`, w)),
  font('JetBrains Mono', 'jetbrains-mono-latin-500-normal.woff2', '500'), font('JetBrains Mono', 'jetbrains-mono-latin-700-normal.woff2', '700'),
  font('Doto', 'doto-latin-900-normal.woff2', '900'),
]);
type Props = XtoolProps & {audio?: string};
const Edit: React.FC<Props> = ({audio, ...p}) => <AbsoluteFill><Xtool {...p} />{audio && <Audio src={staticFile(audio)} />}</AbsoluteFill>;
// The public dir is the job's render-public folder (fonts/, x/): see render.mjs.
registerRoot(() => <Composition id="XTOOL" component={Edit} width={1080} height={1920} fps={30} durationInFrames={1152}
  defaultProps={{words, stars: 15364, audio: 'x/voice.mp3'} as Props} />);
