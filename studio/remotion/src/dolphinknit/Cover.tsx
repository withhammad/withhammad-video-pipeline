// Cover (9:16) and grid thumbnail (4:5) for the private golden-dolphin salawat reel (@heal.ingthroughquran): the knitted gold
// dolphin at the top of its leap with «اللَّه» glowing on its flank, the salawat line big at the top. On the 9:16 cover the
// title and the dolphin sit inside the 4:5 and 1:1 grid crops (y 285-1635 and 420-1500); the 4:5 thumbnail is its own layout.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Handle, Salawat} from './DolphinKnit';

export const DolphinCover: React.FC<{grid?: boolean}> = ({grid = false}) =>
  <AbsoluteFill style={{background: '#0E1E33', overflow: 'hidden'}}>
    <Img src={staticFile('cover_bg.jpg')} style={{position: 'absolute', left: 0, top: grid ? -330 : 0, width: 1080, height: 1920}}/>
    <AbsoluteFill style={{background: `linear-gradient(180deg, #0B1A2Ecc 0px, #0B1A2E88 ${grid ? 330 : 700}px, #0B1A2E00 ${grid ? 520 : 900}px)`}}/>
    <Salawat t={5} top={grid ? 60 : 380} size={grid ? 112 : 124}/>
    <Handle top={grid ? 1250 : 1560}/>
  </AbsoluteFill>;
