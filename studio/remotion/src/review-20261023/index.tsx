import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Comedy} from './Comedy';
import {Returns} from './Returns';
import {ComedyCover,ReturnsCover} from './Covers';
export const ReviewRoot:React.FC=()=> <><Composition id="CodingComedyReview" component={Comedy} durationInFrames={1477} fps={30} width={1080} height={1920}/><Composition id="AIReturnsReview" component={Returns} durationInFrames={2380} fps={30} width={1080} height={1920}/><Composition id="ComedyCover" component={ComedyCover} durationInFrames={1} fps={30} width={1080} height={1920}/><Composition id="ReturnsCover" component={ReturnsCover} durationInFrames={1} fps={30} width={1080} height={1920}/></>;
registerRoot(ReviewRoot);
