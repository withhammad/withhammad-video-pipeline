import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {FiveRepos} from './reel';
registerRoot(() => <>
  <Composition id="FiveRepos" component={FiveRepos} durationInFrames={1470} fps={30} width={1080} height={1920}/>
  <Composition id="FiveReposLinkedIn" component={FiveRepos} defaultProps={{linkedin: true}} durationInFrames={1470} fps={30} width={1080} height={1920}/>
</>);
