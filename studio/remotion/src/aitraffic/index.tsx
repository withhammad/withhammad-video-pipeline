import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Reel} from './Reel';
import {ReelCover, ReelCoverProps} from '../brand/ReelCover';
import {CarouselSlide, CarouselProps} from '../brand/Carousel';
import {CANVAS} from '../brand/tokens';
import {carousel, covers} from './Covers';
import data from './data.json';

const Cover = ReelCover as React.FC<Record<string, unknown>>;
const Slide = CarouselSlide as unknown as React.FC<Record<string, unknown>>;
const still = {durationInFrames: 1, fps: 30};

export const AitrafficRoot: React.FC = () => <>
  <Composition id="AitrafficReel" component={Reel} durationInFrames={data.frames} fps={30} width={1080} height={1920}/>
  {covers.map((c, i) => <React.Fragment key={i}>
    <Composition id={`AitrafficCover${i + 1}`} component={Cover} {...still} {...CANVAS.reel} defaultProps={c as ReelCoverProps & Record<string, unknown>}/>
    <Composition id={`AitrafficCover${i + 1}Guides`} component={Cover} {...still} {...CANVAS.reel} defaultProps={{...c, guides: true} as ReelCoverProps & Record<string, unknown>}/>
  </React.Fragment>)}
  {(['instagram', 'linkedin'] as const).map(pf => <Composition key={pf} id={`AitrafficCarousel-${pf}`} component={Slide} {...still} {...CANVAS.carousel}
    defaultProps={{slides: carousel[pf], index: 0, platform: pf, accent: 'red'} as CarouselProps & Record<string, unknown>}/>)}
</>;
registerRoot(AitrafficRoot);
