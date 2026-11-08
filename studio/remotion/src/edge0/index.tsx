import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Edge0} from './reel';

// The tightened voice is 29.533 s. A 30 s master gives the final keyword a clean hold.
export const Root: React.FC = () => <>
  <Composition id="Edge0" component={Edge0} durationInFrames={900} fps={30} width={1080} height={1920}/>
  <Composition id="Edge0LinkedIn" component={Edge0} defaultProps={{linkedin: true}} durationInFrames={900} fps={30} width={1080} height={1920}/>
</>;
registerRoot(Root);
