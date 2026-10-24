import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Vendored OFL fonts (public/fonts, licences alongside). Own family names so nothing collides with other compositions.
const f = (family: string, file: string, weight: string, style: 'normal' | 'italic' = 'normal') =>
  loadFont({family, url: staticFile(`fonts/${file}`), weight, style});

export const fontsReady: Promise<unknown> = Promise.all([
  f('BrInter', 'inter-latin-600-normal.woff2', '600'),
  f('BrInter', 'inter-latin-700-normal.woff2', '700'),
  f('BrInter', 'inter-latin-800-normal.woff2', '800'),
  f('BrInter', 'inter-latin-900-normal.woff2', '900'),
  f('BrSerif', 'instrument-serif-latin-400-italic.woff2', '400', 'italic'),
  f('BrArchivo', 'archivo-black-latin-400-normal.woff2', '400'),
  f('BrDoto', 'doto-latin-500-normal.woff2', '500'),
]);
