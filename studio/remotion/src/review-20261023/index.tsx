import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Comedy} from './Comedy';
import {Returns} from './Returns';
import {ComedyCover,ComedyCoverB,ReturnsCover} from './Covers';
import comedy from './comedy-data.json';
export const ReviewRoot:React.FC=()=> <><Composition id="CodingComedyReview" component={Comedy} durationInFrames={comedy.frames} fps={30} width={1080} height={1920} defaultProps={{cta:''}}/><Composition id="AIReturnsReview" component={Returns} durationInFrames={2380} fps={30} width={1080} height={1920}/><Composition id="ComedyCover" component={ComedyCover} durationInFrames={1} fps={30} width={1080} height={1920}/><Composition id="ComedyCoverB" component={ComedyCoverB} durationInFrames={1} fps={30} width={1080} height={1920}/><Composition id="ReturnsCover" component={ReturnsCover} durationInFrames={1} fps={30} width={1080} height={1920}/></>;
registerRoot(ReviewRoot);
