import React from 'react';
import {AbsoluteFill, Audio, Composition, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {OpenHiggs, type OpenHiggsProps} from './OpenHiggs';
import words from './words.json';

const font = (family: string, file: string, weight: string, style = 'normal') => loadFont({family, url: staticFile(`fonts/${file}`), weight, style});
export const fontsReady = Promise.all([
  ...['500', '600', '700', '800', '900'].map(w => font('Inter', `inter-latin-${w}-normal.woff2`, w)),
  ...['500', '600', '700'].map(w => font('Poppins', `poppins-latin-${w}-normal.woff2`, w)),
  ...['500', '600', '700'].map(w => font('Playfair Display', `playfair-display-latin-${w}-italic.woff2`, w, 'italic')),
  font('Playfair Display', 'playfair-display-latin-700-normal.woff2', '700'),
  font('JetBrains Mono', 'jetbrains-mono-latin-500-normal.woff2', '500'), font('JetBrains Mono', 'jetbrains-mono-latin-700-normal.woff2', '700'),
]);
type Props = OpenHiggsProps & {audio?: string};
const Edit: React.FC<Props> = ({audio, ...p}) => <AbsoluteFill><OpenHiggs {...p} />{audio && <Audio src={staticFile(audio)} />}</AbsoluteFill>;
// The public dir is the job's render-public folder (fonts/, x/): see render.mjs. 1884 frames = the 62.75 s narration rounded up + 0.03 s.
// stars is the GitHub figure read on 12 Nov 2026 (repo page "34.3k stars"; API stargazers_count 34,274).
registerRoot(() => <Composition id="OPENHIGGS" component={Edit} width={1080} height={1920} fps={30} durationInFrames={1884}
  defaultProps={{words, stars: 34.3, audio: 'x/voice.mp3'} as Props} />);
