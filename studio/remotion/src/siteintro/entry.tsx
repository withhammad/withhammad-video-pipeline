import {Composition, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {SiteIntro, type SiteIntroProps} from './SiteIntro';
import words from './words.json';

const font = (family: string, file: string, weight: string) => loadFont({family, url: staticFile(`fonts/${file}`), weight});
export const fontsReady = Promise.all([
  ...['500', '600', '700', '800'].map(w => font('Geist', `geist-sans-latin-${w}-normal.woff2`, w)),
  font('Martian Mono', 'martian-mono-latin-500-normal.woff2', '500'), font('Martian Mono', 'martian-mono-latin-700-normal.woff2', '700'),
]);
// Public dir: studio/.local/jobs/site-intro-20261112/render-public (fonts/, x/avatar.mp4). See render.mjs.
registerRoot(() => <>
  <Composition id="SITE-WIDE" component={SiteIntro} width={1920} height={1080} fps={30} durationInFrames={786} defaultProps={{words, fmt: 'wide'} as SiteIntroProps} />
  <Composition id="SITE-TALL" component={SiteIntro} width={1080} height={1920} fps={30} durationInFrames={786} defaultProps={{words, fmt: 'tall'} as SiteIntroProps} />
</>);
