import React from 'react';
import {AbsoluteFill, Audio, Composition, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {Claim, type ClaimProps} from './Claim';
import words from './words.json';

const font = (family: string, file: string, weight: string) => loadFont({family, url: staticFile(`fonts/${file}`), weight});
export const fontsReady = Promise.all([
  ...['500', '600', '700', '800', '900'].map(w => font('Inter', `inter-latin-${w}-normal.woff2`, w)),
  font('JetBrains Mono', 'jetbrains-mono-latin-500-normal.woff2', '500'), font('JetBrains Mono', 'jetbrains-mono-latin-700-normal.woff2', '700'),
]);
type Props = ClaimProps & {audio?: string};
const Edit: React.FC<Props> = ({audio, ...p}) => <AbsoluteFill><Claim {...p} />{audio && <Audio src={staticFile(audio)} />}</AbsoluteFill>;
// The public dir is the job's render-public folder (fonts/, x/): see render.mjs. 1471 frames = the 48.949 s tight narration
// (voice/narration_tight.wav) rounded up to frame 1469 plus 2 frames (0.067 s). Optional prop `avatar` (a video under the
// public dir): see SLOTS in Claim.tsx and the job's avatar_slots.json.
registerRoot(() => <Composition id="CLAIM" component={Edit} width={1080} height={1920} fps={30} durationInFrames={1471}
  defaultProps={{words, audio: 'x/voice.wav'} as Props} />);
