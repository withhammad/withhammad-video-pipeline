import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';
loadFont({family: 'CtFredoka', url: staticFile('fonts/fredoka-latin-700-normal.woff2'), weight: '700'});
loadFont({family: 'CtSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), style: 'italic', weight: '400'});
loadFont({family: 'CtHand', url: staticFile('fonts/caveat-latin-500-normal.woff2'), weight: '500'});
loadFont({family: 'CtMono', url: staticFile('fonts/jetbrains-mono-latin-500-normal.woff2'), weight: '500'});
loadFont({family: 'CtInter', url: staticFile('fonts/inter-latin-800-normal.woff2'), weight: '800'});
