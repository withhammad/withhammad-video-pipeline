// Cover for the private knitted "Three lanterns" dhikr reel (her Instagram, @heal.ingthroughquran): the finished state after 99 —
// the night sky full of crochet stars, the three crochet fanoos lanterns full of glowing felted beads (turquoise, coral, saffron),
// the crescent lit — under a big gold yarn "Three lanterns, one calm heart" and the three dhikr. Title, lanterns and tags sit
// inside the 1:1 grid crop (y 420-1500) and the handle inside the 4:5 crop (y 285-1635). With grid=true the same picture is laid
// out on 1080x1350 (the 4:5 profile-grid thumbnail): the 1920 frame shifted up by 285 px, its centre crop.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {PUFF, YarnDefs, gold} from '../asmaknit/AsmaKnit';
import {Filters, Handle} from '../tasbeehknit/TasbeehKnit';
import {COMPLETE, FPS, Halo, Lantern, PHASE, SERIF, Sky, Tag} from './LanternKnit';

const F = COMPLETE + 120;
const STARS: [number, number, number, string][] = [[210, 300, 24, 'star_go'], [870, 320, 22, 'star_cr'], [250, 880, 20, 'star_tq'], [840, 870, 24, 'star_go'],
  [190, 640, 18, 'star_cr'], [890, 640, 18, 'star_tq'], [300, 230, 16, 'star_cr'], [780, 230, 16, 'star_cr'], [190, 760, 14, 'star_tq'], [892, 760, 14, 'star_go'],
  [380, 800, 16, 'star_cr'], [700, 805, 16, 'star_cr']];

export const LanternCover: React.FC<{grid?: boolean}> = ({grid = false}) => <AbsoluteFill style={{background: '#120F2C', overflow: 'hidden'}}>
  <YarnDefs/>
  <Filters/>
  <AbsoluteFill style={{transform: `translateY(${grid ? -285 : 0}px)`, height: 1920}}>
    <Sky u={1}/>
    {STARS.map(([x, y, s, src], k) => <Img key={k} src={staticFile(`parts/${src}.png`)} style={{position: 'absolute', left: x - s, top: y - s, width: 2 * s, height: 2 * s,
      transform: `rotate(${k * 33}deg)`, filter: 'drop-shadow(0 0 8px #FFF1C9)'}}/>)}
    <Img src={staticFile('bg.png')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, filter: 'brightness(0.5) saturate(0.85)'}}/>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 60% at 50% 70%, #1B1D4A00 0%, #1B1D4A66 100%)'}}/>
    {[0, 1, 2].map((k) => <Halo key={k} g={k} f={F} u={1} boost={0.15}/>)}
    {[0, 1, 2].map((k) => <Lantern key={k} g={k} f={F} u={1} boost={0.1} z={k + 1} flyers={false}/>)}
    <div style={{position: 'absolute', left: 540 - 62, top: 742, width: 124, height: 141, zIndex: 4}}>
      <Img src={staticFile('parts/crescent.png')} style={{width: 124, height: 141, transform: 'rotate(-14deg)', filter: 'drop-shadow(0 8px 8px #00000099) drop-shadow(0 0 22px #FFE3A0cc)'}}/>
    </div>
    {/* calm the sky behind the title */}
    <div style={{position: 'absolute', left: 0, right: 0, top: 380, height: 420, background: 'radial-gradient(ellipse 60% 50% at 50% 50%, #0E0B2899 0%, #0E0B2800 100%)'}}/>
    <Handle top={318} endP={1}/>
    <div style={{position: 'absolute', top: 438, left: 0, right: 0, textAlign: 'center', zIndex: 6}}>
      <div style={{fontFamily: SERIF, fontSize: 124, lineHeight: 1.0, ...gold(0.62, 1), WebkitTextStroke: '2px #E7B040', filter: `${PUFF} drop-shadow(0 0 24px #FFC64A66)`}}>
        Three lanterns,</div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 86, lineHeight: 1.08, color: '#FFF3DA', textShadow: '0 3px 5px #000000cc'}}>one calm heart</div>
      <div style={{display: 'flex', justifyContent: 'center', gap: 16, marginTop: 14}}>
        {PHASE.map((p) => <span key={p.name} style={{padding: '3px 16px 6px', borderRadius: 30, background: '#1B1745dd', border: `2.5px dashed ${p.main}`,
          fontFamily: SERIF, fontSize: 31, color: p.light, boxShadow: `0 0 12px ${p.glow}55`}}>{p.tr} ×33</span>)}
      </div>
    </div>
    {[0, 1, 2].map((k) => <Tag key={k} g={k} f={F} allDone/>)}
  </AbsoluteFill>
</AbsoluteFill>;

export const COVER_T = F / FPS;
