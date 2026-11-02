import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ReelCover, ReelCoverProps} from './ReelCover';
import {CarouselSlide, CarouselProps} from './Carousel';
import {kimiCover, skillCover, skillCarousel} from './samples';
import {CANVAS} from './tokens';
import {glowJobs} from './glowCovers';
import {GlowWide} from './GlowWide';
import {GlowBanner} from './GlowBanner';
import {JobCarousel} from './JobCarousel';
import {GuideDoc} from './GuideDoc';

// Entry: npx remotion still src/brand/index.tsx <id> out.png  (or node src/brand/render.mjs for every sample)
const Cover = ReelCover as React.FC<Record<string, unknown>>;
const Slide = CarouselSlide as unknown as React.FC<Record<string, unknown>>;
const still = {durationInFrames: 1, fps: 30};

export const BrandRoot: React.FC = () => <>
  <Composition id="BrandCover" component={Cover} {...still} {...CANVAS.reel} defaultProps={skillCover as ReelCoverProps & Record<string, unknown>}/>
  <Composition id="BrandCoverKimi" component={Cover} {...still} {...CANVAS.reel} defaultProps={kimiCover as ReelCoverProps & Record<string, unknown>}/>
  <Composition id="BrandCoverSkill" component={Cover} {...still} {...CANVAS.reel} defaultProps={skillCover as ReelCoverProps & Record<string, unknown>}/>
  <Composition id="BrandCoverKimiGuides" component={Cover} {...still} {...CANVAS.reel} defaultProps={{...kimiCover, guides: true}}/>
  <Composition id="BrandCoverSkillGuides" component={Cover} {...still} {...CANVAS.reel} defaultProps={{...skillCover, guides: true}}/>
  {glowJobs.map(j => <Composition key={j.job} id={`GlowCover-${j.job}`} component={Cover} {...still} {...CANVAS.reel} defaultProps={j.cover as ReelCoverProps & Record<string, unknown>}/>)}
  {glowJobs.map(j => <Composition key={j.job} id={`GlowCoverGuides-${j.job}`} component={Cover} {...still} {...CANVAS.reel} defaultProps={{...j.cover, guides: true} as ReelCoverProps & Record<string, unknown>}/>)}
  <Composition id="LinkedInBanner" component={GlowBanner} {...still} width={1584} height={396}/>
  {glowJobs.map(j => <Composition key={j.job} id={`GlowWide-${j.job}`} component={GlowWide as unknown as React.FC<Record<string, unknown>>} {...still} width={1280} height={720} defaultProps={j.cover as unknown as Record<string, unknown>}/>)}
  {(['instagram', 'linkedin'] as const).map(pf => <Composition key={pf} id={`BrandCarousel-${pf}`} component={Slide} {...still} {...CANVAS.carousel}
    defaultProps={{slides: skillCarousel[pf], index: 0, platform: pf, accent: 'red'} as CarouselProps & Record<string, unknown>}/>)}
  {(['instagram', 'linkedin'] as const).map(pf => <Composition key={`job-${pf}`} id={`JobCarousel-${pf}`} component={JobCarousel as unknown as React.FC<Record<string, unknown>>}
    {...still} {...CANVAS.carousel} defaultProps={{slides: [{kind: 'quote', quote: 'placeholder', by: 'render-carousel.mjs passes the slides'}], index: 0, platform: pf}}/>)}
  <Composition id="GuideDoc" component={GuideDoc as unknown as React.FC<Record<string, unknown>>} {...still} {...CANVAS.carousel}
    defaultProps={{docTitle: 'Guide', index: 0, pages: [{kind: 'more', title: 'placeholder', sub: 'render-guide.mjs passes the pages', items: []}]}}/>
</>;
registerRoot(BrandRoot);
