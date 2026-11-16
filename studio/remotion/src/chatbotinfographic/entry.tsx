import React from 'react';
import {Composition, Still, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {CYCLE, FPS, Infographic} from './Infographic';
import {Recap, Stage, StageProps, Vertical} from './Extras';

// public dir: studio/remotion/public (fonts/, guides/how-ai-chatbot-is-made/hammad.jpg = the owner's headshot crop).
// Render with studio/heavy.sh node src/chatbotinfographic/render.mjs ...
export const fontsReady = Promise.all(['400', '500', '600', '700', '800'].map(w =>
  loadFont({family: 'CbInter', url: staticFile(`fonts/inter-latin-${w}-normal.woff2`), weight: w})));

registerRoot(() => <>
  <Composition id="CB-45" component={Infographic} width={1080} height={1350} fps={FPS} durationInFrames={CYCLE}/>
  <Composition id="CB-916" component={Vertical} width={1080} height={1920} fps={FPS} durationInFrames={CYCLE}/>
  <Still id="CB-ALL" component={() => <Infographic all/>} width={1080} height={1350}/>
  <Still id="CB-STAGE" component={Stage as React.FC<StageProps & Record<string, unknown>>} width={860} height={480} defaultProps={{n: 1}}/>
  <Still id="CB-RECAP" component={Recap as unknown as React.FC<Record<string, unknown>>} width={1080} height={1350} defaultProps={{docTitle: 'How an AI Chatbot Is Made'}}/>
</>);
