import React from 'react';
import {AbsoluteFill, Audio, Composition, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {Course, type CourseProps} from './Course';
import words from './words.json';

const font = (family: string, file: string, weight: string) => loadFont({family, url: staticFile(`fonts/${file}`), weight});
export const fontsReady = Promise.all([
  ...['500', '600', '700', '800', '900'].map(w => font('Inter', `inter-latin-${w}-normal.woff2`, w)),
  font('JetBrains Mono', 'jetbrains-mono-latin-500-normal.woff2', '500'), font('JetBrains Mono', 'jetbrains-mono-latin-700-normal.woff2', '700'),
]);
type Props = CourseProps & {audio?: string};
const Edit: React.FC<Props> = ({audio, ...p}) => <AbsoluteFill><Course {...p} />{audio && <Audio src={staticFile(audio)} />}</AbsoluteFill>;
// The public dir is the job's render-public folder (fonts/, x/): see render.mjs. 1538 frames = the 51.148 s narration
// rounded up to frame 1535 plus 0.1 s. Optional prop `avatar` (a video under the public dir): see SLOTS in Course.tsx.
registerRoot(() => <Composition id="COURSE" component={Edit} width={1080} height={1920} fps={30} durationInFrames={1538}
  defaultProps={{words, audio: 'x/voice.mp3'} as Props} />);
