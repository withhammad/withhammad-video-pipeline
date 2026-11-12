import React from 'react';
import {AbsoluteFill, Audio, Composition, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {Dossier, type DossierProps} from './Dossier';
import words from './words.json';

const font = (family: string, file: string, weight: string, style = 'normal') => loadFont({family, url: staticFile(`fonts/${file}`), weight, style});
export const fontsReady = Promise.all([
  ...['500', '600', '700', '800', '900'].map(w => font('Inter', `inter-latin-${w}-normal.woff2`, w)),
  ...['600', '700', '800', '900'].map(w => font('Montserrat', `montserrat-latin-${w}-normal.woff2`, w)),
  font('Google Sans', 'google-sans-latin-500-normal.woff2', '500'), font('Google Sans', 'google-sans-latin-700-normal.woff2', '700'),
  font('Instrument Serif', 'instrument-serif-latin-400-normal.woff2', '400'), font('Instrument Serif', 'instrument-serif-latin-400-italic.woff2', '400', 'italic'),
  font('JetBrains Mono', 'jetbrains-mono-latin-500-normal.woff2', '500'), font('JetBrains Mono', 'jetbrains-mono-latin-700-normal.woff2', '700'),
]);
type Props = DossierProps & {audio?: string};
const Edit: React.FC<Props> = ({audio, ...p}) => <AbsoluteFill><Dossier {...p} />{audio && <Audio src={staticFile(audio)} />}</AbsoluteFill>;
// The public dir is the job's render-public folder (fonts/, x/): see render.mjs. 2418 frames = the 80.51 s narration rounded
// up to a whole frame (2416) + 2 frames. `stars` is the live figure read on 12 Nov 2026 (api.github.com/repos/AienTech/dossier).
registerRoot(() => <Composition id="DOSSIER" component={Edit} width={1080} height={1920} fps={30} durationInFrames={2418}
  defaultProps={{words, stars: 5066, audio: 'x/voice.mp3'} as Props} />);
