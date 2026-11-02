import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Reel} from './Reel';
import {GlowCover, GlowCoverProps} from '../brand/GlowCover';
import {GlowWide} from '../brand/GlowWide';
import {LOGO} from '../brand/glowCovers';
import data from './data.json';

// Glow-template cover (owner rule 2026-10-24): same pose, line 1 white, line 2 in the blue pill, Claude + GitHub tiles.
const cover: GlowCoverProps = {variant: 'glow', line1: '7 AI Advisors', line2: 'Roasted My Idea', leftLogo: LOGO.claude, rightLogo: LOGO.github};
const Cover = GlowCover as unknown as React.FC<Record<string, unknown>>;
const still = {durationInFrames: 1, fps: 30};

export const RoastroomRoot: React.FC = () => <>
  <Composition id="RoastroomReel" component={Reel} durationInFrames={data.frames} fps={30} width={1080} height={1920}/>
  <Composition id="RoastroomCover" component={Cover} {...still} width={1080} height={1920} defaultProps={cover as unknown as Record<string, unknown>}/>
  <Composition id="RoastroomCoverGuides" component={Cover} {...still} width={1080} height={1920} defaultProps={{...cover, guides: true} as unknown as Record<string, unknown>}/>
  <Composition id="RoastroomWide" component={GlowWide as unknown as React.FC<Record<string, unknown>>} {...still} width={1280} height={720} defaultProps={cover as unknown as Record<string, unknown>}/>
</>;
registerRoot(RoastroomRoot);
