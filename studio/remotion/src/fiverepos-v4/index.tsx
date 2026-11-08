import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {FiveReposV4} from './reel';
import retime from './retime.json';
registerRoot(() => <>
  <Composition id="FiveReposV4" component={FiveReposV4} durationInFrames={retime.durationFrames} fps={30} width={1080} height={1920}/>
  <Composition id="FiveReposV4LinkedIn" component={FiveReposV4} defaultProps={{linkedin: true}} durationInFrames={retime.durationFrames} fps={30} width={1080} height={1920}/>
</>);
