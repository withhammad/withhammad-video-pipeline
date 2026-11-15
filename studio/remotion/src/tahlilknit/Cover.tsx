// Cover for the private knitted "Say it 10 times" dhikr reel (her Instagram, @heal.ingthroughquran): the finished state just after
// 10 (cover_bg.jpg = a Blender plate frame: the hoop wrapped in all ten colours, the ten dyed beads, pompoms bursting) under a big
// gold yarn "Say it 10 times" on the felted plaque, the reward line and the first dhikr line. Title and hoop sit inside the 4:5 crop
// (y 285-1635), the title inside the 1:1 crop (y 420-1500). With grid=true the same picture is laid out on 1080x1350 (the 4:5
// profile-grid thumbnail): the 1920 frame shifted up by 285 px, its centre crop.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {YarnDefs, gold} from '../asmaknit/AsmaKnit';
import {ArDefs} from '../lanternknit/LanternKnit';
import {AR, AR_THREAD, PLUM, PLUM2, ROUND, SERIF} from './TahlilKnit';
import TX from './texts.json';
import G from './geom.json';

export const COVER_F = 1426;
const H = G.hoop[COVER_F];

export const TahlilCover: React.FC<{grid?: boolean}> = ({grid = false}) => <AbsoluteFill style={{background: '#2A1840', overflow: 'hidden'}}>
  <YarnDefs/>
  <ArDefs/>
  <AbsoluteFill style={{transform: `translateY(${grid ? -285 : 0}px)`, height: 1920}}>
    <Img src={staticFile('cover_bg.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}}/>
    <div style={{position: 'absolute', top: 322, left: 0, right: 0, textAlign: 'center'}}>
      <span style={{display: 'inline-block', padding: '4px 22px 7px', borderRadius: 30, background: '#FFF4E2', border: `2.5px dashed ${PLUM2}`,
        fontFamily: SERIF, fontStyle: 'italic', fontSize: 30, color: PLUM}}>@heal.ingthroughquran</span>
    </div>
    <div style={{position: 'absolute', top: 428, left: 0, right: 0, textAlign: 'center'}}>
      <div style={{fontFamily: SERIF, fontSize: 132, lineHeight: 0.98, ...gold(0.62, 1), WebkitTextStroke: '2.5px #B8801F',
        filter: 'url(#yarn) drop-shadow(0 3px 0 #FFFFFFAA) drop-shadow(0 6px 8px #6A3A1077)'}}>Say it 10 times</div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 64, lineHeight: 1.1, marginTop: 8, color: PLUM}}>like freeing four souls</div>
      <div dir="rtl" lang="ar" style={{fontFamily: AR, fontSize: 50, lineHeight: 1.5, marginTop: 14, color: PLUM, filter: AR_THREAD}}>{TX.line1}</div>
    </div>
    <div style={{position: 'absolute', left: H[0] - 200, width: 400, top: H[1] - 112 * H[2] / G.hoop[60][2], textAlign: 'center',
      transform: `scale(${H[2] / G.hoop[60][2]})`, transformOrigin: '50% 112px'}}>
      <div style={{fontFamily: ROUND, fontSize: 150, lineHeight: 1.05, color: PLUM, WebkitTextStroke: `3px ${PLUM}`, filter: 'url(#yarn) drop-shadow(0 2px 0 #FFFFFFB0)'}}>10</div>
      <div style={{fontFamily: ROUND, fontSize: 34, lineHeight: 1, color: PLUM2}}>/ 10</div>
    </div>
  </AbsoluteFill>
</AbsoluteFill>;
