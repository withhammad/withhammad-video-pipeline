import React from 'react';
import {AbsoluteFill, Audio, Composition, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {SkillFinder, type SkillFinderProps} from './SkillFinder';
import words from './words.json';

const font = (family: string, file: string, weight: string) => loadFont({family, url: staticFile(`fonts/${file}`), weight});
export const fontsReady = Promise.all([
  ...['500', '600', '700', '800', '900'].map(w => font('Inter', `inter-latin-${w}-normal.woff2`, w)),
  ...['800', '900'].map(w => font('Montserrat', `montserrat-latin-${w}-normal.woff2`, w)),
  font('JetBrains Mono', 'jetbrains-mono-latin-500-normal.woff2', '500'), font('JetBrains Mono', 'jetbrains-mono-latin-700-normal.woff2', '700'),
  font('Playfair Display', 'playfair-display-latin-700-normal.woff2', '700'), font('Pixelify Sans', 'pixelify-sans-latin-700-normal.woff2', '700'),
]);
type Props = SkillFinderProps & {audio?: string};
const Edit: React.FC<Props> = ({audio, ...p}) => <AbsoluteFill><SkillFinder {...p} />{audio && <Audio src={staticFile(audio)} />}</AbsoluteFill>;
// The public dir is the job's render-public folder (fonts/, x/): see render.mjs. 1227 frames = the 40.83 s narration + 0.07 s.
// skillsTotal and installs are the two live figures read on 12 Nov 2026 (skills.sh "All Time" tab; find-skills page JSON-LD).
registerRoot(() => <Composition id="SKILLFINDER" component={Edit} width={1080} height={1920} fps={30} durationInFrames={1227}
  defaultProps={{words, skillsTotal: 1351612, installs: 4326030, audio: 'x/voice.mp3'} as Props} />);
