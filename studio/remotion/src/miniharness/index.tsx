import React from 'react';
import {Composition, Sequence, registerRoot} from 'remotion';
import {CARDS, DURATION, FPS, INTRO, OUTRO, STEP} from './data';
import {Intro} from './Intro';
import {StepScene} from './Step';
import {Outro} from './Outro';
import {Carousel} from './Carousel';

const Reel: React.FC<{linkedin?: boolean}> = ({linkedin = false}) => <>
  <Sequence from={0} durationInFrames={INTRO} name="Build your own Claude Code"><Intro/></Sequence>
  {CARDS.map((c, i) => <Sequence key={c.title} from={INTRO + i * STEP} durationInFrames={STEP} name={`${i + 1}. ${c.title}`}><StepScene index={i}/></Sequence>)}
  <Sequence from={INTRO + CARDS.length * STEP} durationInFrames={OUTRO} name="Save the map"><Outro linkedin={linkedin}/></Sequence>
</>;

const Root = () => <>
  <Composition id="MiniHarness" component={Reel} durationInFrames={DURATION} fps={FPS} width={1080} height={1920}/>
  <Composition id="MiniHarnessLinkedIn" component={Reel} defaultProps={{linkedin: true}} durationInFrames={DURATION} fps={FPS} width={1080} height={1920}/>
  <Composition id="HarnessCarousel" component={Carousel} defaultProps={{page: 0}} durationInFrames={1} fps={FPS} width={1080} height={1350}/>
</>;
registerRoot(Root);
