import React from 'react';
import {Composition, delayRender, continueRender, registerRoot} from 'remotion';
import {Poster} from './Poster';
import {PromptCard} from './PromptCard';
import {fontsReady} from './ui';
import {PromptTour, Tour, TOUR2_S, TOUR_S} from './Tour';
import {staticFile} from 'remotion';
import {ReelCover} from '../brand/ReelCover';
import {fontsReady as brandFonts} from '../brand/fonts';
import {LOGO} from '../brand/glowCovers';
import {GlowWide} from '../brand/GlowWide';

const hb = delayRender('brand fonts');
brandFonts.then(() => continueRender(hb));

// Glow-grid covers (fixed template, owner rule 2026-10-24) for the three G2 posts.
export const COVERS = {
  p1: {variant: 'glow' as const, line1: 'Claude Code', line2: 'Edits My Reels', leftLogo: LOGO.claude, rightLogo: LOGO.remotion},
  p2: {variant: 'glow' as const, line1: '1 Prompt', line2: 'Edits My Videos', leftLogo: LOGO.claude,
    rightLogo: {mask: staticFile('edit-guide/si-ffmpeg.svg'), color: '#2BD94A', bg: 'linear-gradient(160deg, #161D31 0%, #070B16 100%)', glow: '#2BD94A', fit: 0.62}},
};
const Cover = ReelCover as unknown as React.FC<Record<string, unknown>>;
const Wide = GlowWide as unknown as React.FC<Record<string, unknown>>;

const h = delayRender('fonts');
fontsReady.then(() => continueRender(h));

export const EditGuideRoot: React.FC = () => <>
  <Composition id="EditGuidePoster" component={Poster} durationInFrames={300} fps={30} width={1080} height={1350}/>
  <Composition id="EditPromptCard" component={PromptCard} durationInFrames={300} fps={30} width={1080} height={1350}/>
  <Composition id="EditPromptTour" component={PromptTour} durationInFrames={Math.round(TOUR2_S * 30)} fps={30} width={1080} height={1920}/>
  <Composition id="EditGuideTour" component={Tour} durationInFrames={Math.round(TOUR_S * 30)} fps={30} width={1080} height={1920}/>
  {Object.entries(COVERS).map(([k, c]) => <Composition key={k} id={`EditGuideCover-${k}`} component={Cover}
    durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={c}/>)}
  {Object.entries(COVERS).map(([k, c]) => <Composition key={k} id={`EditGuideCoverGuides-${k}`} component={Cover}
    durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{...c, guides: true}}/>)}
  {Object.entries(COVERS).map(([k, c]) => <Composition key={k} id={`EditGuideWide-${k}`} component={Wide}
    durationInFrames={1} fps={30} width={1280} height={720} defaultProps={c}/>)}
</>;
registerRoot(EditGuideRoot);
