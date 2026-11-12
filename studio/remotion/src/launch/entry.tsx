import React from 'react';
import {AbsoluteFill, Audio, Composition, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {Launch, type LaunchProps} from './Launch';
import words from './words.json';

const font = (family: string, file: string, weight: string, style = 'normal') => loadFont({family, url: staticFile(`fonts/${file}`), weight, style});
export const fontsReady = Promise.all([
  ...['500', '600', '700', '800', '900'].map(w => font('Inter', `inter-latin-${w}-normal.woff2`, w)),
  ...['600', '700', '900'].map(w => font('Montserrat', `montserrat-latin-${w}-normal.woff2`, w)),
  font('Newsreader', 'newsreader-latin-500-italic.woff2', '500', 'italic'),
  font('JetBrains Mono', 'jetbrains-mono-latin-500-normal.woff2', '500'), font('JetBrains Mono', 'jetbrains-mono-latin-700-normal.woff2', '700'),
]);
type Props = LaunchProps & {audio?: string};
const Edit: React.FC<Props> = ({audio, ...p}) => <AbsoluteFill><Launch {...p} />{audio && <Audio src={staticFile(audio)} />}</AbsoluteFill>;
// The public dir is the job's render-public folder (fonts/, x/): see render.mjs. 4374 frames = 145.8 s (narration 145.711 s).
registerRoot(() => <Composition id="LAUNCH" component={Edit} width={1080} height={1920} fps={30} durationInFrames={4374}
  defaultProps={{words, audio: 'x/voice.mp3'} as Props} />);
