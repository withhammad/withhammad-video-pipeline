import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Reel, FPS, TOTAL} from './Reel';
import '../careerpages/fonts';
export const PhoneRoot: React.FC = () => <>
  <Composition id="PhoneReel" component={Reel as any} durationInFrames={Math.round(TOTAL * FPS)} fps={FPS} width={1080} height={1920} />
</>;
registerRoot(PhoneRoot);
