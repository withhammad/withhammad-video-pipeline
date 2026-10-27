// 9:16 reels of posts 1 and 2: a camera tour over the same board as each 4:5 poster.
import React from 'react';
import {Board} from './Poster';
import {PromptCard} from './PromptCard';
import {CameraTour, TourSpec, tourLength} from './CameraTour';
import {BLUE} from './ui';

// Post 1: the 10 step cards in order (centres on the 1440x1800 board), then the phone.
export const TOUR1: TourSpec = {
  full: {cx: 720, cy: 900, k: 0.75},
  stops: [
    {cx: 226, cy: 470, k: 2.35}, {cx: 720, cy: 441, k: 1.95}, {cx: 1214, cy: 441, k: 2.35},
    {cx: 226, cy: 858, k: 2.35}, {cx: 1214, cy: 827, k: 2.35}, {cx: 226, cy: 1205, k: 2.35},
    {cx: 1214, cy: 1203, k: 2.35}, {cx: 226, cy: 1591, k: 2.35}, {cx: 1214, cy: 1591, k: 2.35},
    {cx: 720, cy: 1630, k: 1.95}, {cx: 720, cy: 1040, k: 1.85},
  ],
  intro: 2.6, move: 0.55, hold: 2.35, outro: 3.6,
};
export const TOUR_S = tourLength(TOUR1);

export const Tour: React.FC = () => (
  <CameraTour spec={TOUR1} board={(style) => <Board style={style}/>}
    hook={<>Claude Code <span style={{color: BLUE}}>edits</span><br/>my reels now</>}
    hookPill="The full setup, step by step ↓"
    ctaTitle={<>Want the <span style={{color: BLUE}}>full guide?</span></>}
    keyword="EDIT" ctaSub="Free guide + prompt on withhammad.com"/>
);

// Post 2: read down the left column, then the right, on the 1080x1350 prompt card.
export const TOUR2: TourSpec = {
  full: {cx: 540, cy: 675, k: 1},
  stops: [
    {cx: 540, cy: 190, k: 1.55, hold: 2.0},
    {cx: 292, cy: 560, k: 1.85, hold: 3.6},
    {cx: 292, cy: 1000, k: 1.85, hold: 3.6},
    {cx: 786, cy: 520, k: 1.85, hold: 3.6},
    {cx: 786, cy: 1040, k: 1.85, hold: 3.2},
  ],
  intro: 2.6, move: 0.6, hold: 3.4, outro: 3.6,
};
export const TOUR2_S = tourLength(TOUR2);

export const PromptTour: React.FC = () => (
  <CameraTour spec={TOUR2}
    board={(style) => <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1350, transformOrigin: '0 0', ...style}}><PromptCard/></div>}
    hookSize={74}
    hook={<>Claude Code can't edit video<br/>until you <span style={{color: BLUE}}>paste this</span></>}
    hookPill="7 installs + 1 prompt ↓"
    ctaTitle={<>Want the <span style={{color: BLUE}}>prompt?</span></>}
    keyword="PROMPT" ctaSub="Copy-paste version on withhammad.com"/>
);
