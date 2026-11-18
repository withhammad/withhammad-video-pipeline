import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';
const f = (family: string, file: string, weight: string, style: 'normal' | 'italic' = 'normal') => loadFont({family, url: staticFile(`fonts/${file}`), weight, style});
export const cpFonts = Promise.all([
  f('CpInter', 'inter-latin-500-normal.woff2', '500'), f('CpInter', 'inter-latin-700-normal.woff2', '700'), f('CpInter', 'inter-latin-800-normal.woff2', '800'),
  f('CpSerif', 'instrument-serif-latin-400-normal.woff2', '400'), f('CpSerif', 'instrument-serif-latin-400-italic.woff2', '400', 'italic'),
  f('CpMono', 'jetbrains-mono-latin-500-normal.woff2', '500'),
]);
