import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {LinkedInBanner, XHeader, YouTubeBanner} from './Banners';

export const BannersRoot: React.FC = () => <>
  <Composition id="YouTubeBanner" component={YouTubeBanner} durationInFrames={1} fps={30} width={2560} height={1440} defaultProps={{guides: false}}/>
  <Composition id="XHeader" component={XHeader} durationInFrames={1} fps={30} width={1500} height={500} defaultProps={{guides: false}}/>
  <Composition id="LinkedInBanner" component={LinkedInBanner} durationInFrames={1} fps={30} width={1584} height={396} defaultProps={{guides: false}}/>
</>;
registerRoot(BannersRoot);
