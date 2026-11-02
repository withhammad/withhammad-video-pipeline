import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Reel} from './Reel';
import {ReelCover, ReelCoverProps} from '../brand/ReelCover';
import {GlowWide} from '../brand/GlowWide';
import {CANVAS} from '../brand/tokens';
import {covers} from './Covers';
import data from './data.json';

const Cover = ReelCover as React.FC<Record<string, unknown>>;
const still = {durationInFrames: 1, fps: 30};

export const Claude20Root: React.FC = () => <>
  <Composition id="Claude20Reel" component={Reel} durationInFrames={data.frames} fps={30} width={1080} height={1920}/>
  {covers.map((c, i) => <React.Fragment key={i}>
    <Composition id={`Claude20Cover${i + 1}`} component={Cover} {...still} {...CANVAS.reel} defaultProps={c as ReelCoverProps & Record<string, unknown>}/>
    <Composition id={`Claude20Cover${i + 1}Guides`} component={Cover} {...still} {...CANVAS.reel} defaultProps={{...c, guides: true} as ReelCoverProps & Record<string, unknown>}/>
    <Composition id={`Claude20Wide${i + 1}`} component={GlowWide as unknown as React.FC<Record<string, unknown>>} {...still} width={1280} height={720} defaultProps={c as unknown as Record<string, unknown>}/>
  </React.Fragment>)}
</>;
registerRoot(Claude20Root);
