import React from 'react';
import {staticFile} from 'remotion';
import {CarouselSlide, CarouselProps, SlideData} from './Carousel';
import {glowJobs, LOGO} from './glowCovers';

// A job's carousel from its slides.json (studio/.local/jobs/<job>/carousel/slides.json), rendered by
// render-carousel.mjs. Two conveniences over the raw SlideData the slide writer may use:
//   {kind: 'cover', job: '<job id>'}  -> that reel's glow cover (the same click-first face and hook as the reel)
//   logos[].logo: '<LOGO key>'        -> the official mark from glowCovers.ts LOGO
//   end.face: 'glow'                  -> the shared pose cut-out used on every glow cover
type Loose = Record<string, unknown>;
export type JobCarouselProps = {slides: Loose[]; index: number; platform: 'instagram' | 'linkedin'; accent?: CarouselProps['accent']};

const resolve = (s: Loose): SlideData => {
  if (s.kind === 'cover' && typeof s.job === 'string') {
    const g = glowJobs.find(j => j.job === s.job);
    if (!g) throw new Error(`no glow cover for job ${s.job}`);
    return {kind: 'cover', cover: g.cover, offset: (s.offset as number) ?? 285};
  }
  if (s.kind === 'logos' && Array.isArray(s.logos)) {
    return {...s, logos: (s.logos as Loose[]).map(l => {
      if (typeof l.logo !== 'string') return l;
      const g = (LOGO as Record<string, Loose>)[l.logo as string];
      if (!g) throw new Error(`unknown LOGO key ${l.logo}`);
      // glow logos are either an image (src) or a one-colour mask; on a carousel tile a mask shows dark on white
      const tile = g.src ? {src: g.src as string, bg: '#FFFFFF'} : g.mask ? {src: g.mask as string, bg: '#FFFFFF'} : {text: g.text as string, bg: g.bg as string};
      return {tile, label: l.label as string};
    })} as SlideData;
  }
  if (s.kind === 'end' && s.face === 'glow') return {...s, face: staticFile('glow/pose-B-cut.png')} as SlideData;
  return s as unknown as SlideData;
};

export const JobCarousel: React.FC<JobCarouselProps> = ({slides, index, platform, accent}) =>
  <CarouselSlide slides={slides.map(resolve)} index={index} platform={platform} accent={accent ?? 'blue'}/>;
