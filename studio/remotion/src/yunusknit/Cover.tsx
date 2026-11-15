// Cover (9:16) and grid thumbnail (4:5) for the private knitted Yunus reel (her Instagram, @heal.ingthroughquran): the knitted
// whale breaching out of the yarn sea under Fair Isle stars (a frame of the Blender plate, cover_bg.jpg), the reel's hook in big
// yarn letters, and the reference caption's own first line, 37:143 «فَلَوْلَآ أَنَّهُۥ كَانَ مِنَ ٱلْمُسَبِّحِينَ» (texts.json, checked by
// text.py) in gold with its English. Every word sits inside the 1:1 grid crop (y 420-1500 of the 9:16 frame); the 4:5 thumbnail is
// the same design on the 4:5 crop (y 285-1635).
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {YarnDefs, gold} from '../asmaknit/AsmaKnit';
import {ArDefs} from '../lanternknit/LanternKnit';
import {AR, AR_THREAD, SERIF} from './YunusKnit';
import TX from './texts.json';

export const YunusCover: React.FC<{grid?: boolean}> = ({grid = false}) => {
  const dy = grid ? -285 : 0;
  const ws = TX.words['143'];
  return <AbsoluteFill style={{background: '#0B0E24', overflow: 'hidden'}}>
    <YarnDefs/>
    <ArDefs/>
    <Img src={staticFile('cover_bg.jpg')} style={{position: 'absolute', left: 0, top: dy, width: 1080, height: 1920}}/>
    <AbsoluteFill style={{background: `linear-gradient(180deg, #05061Acc ${380 + dy}px, #05061A99 ${760 + dy}px, #05061A00 ${980 + dy}px, #05061A00 ${1180 + dy}px, #05061Acc ${1420 + dy}px, #05061Aee ${1620 + dy}px)`}}/>
    <div style={{position: 'absolute', top: 444 + dy, left: 0, right: 0, textAlign: 'center'}}>
      <span style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 36, color: '#F6E3BC', letterSpacing: 1, paddingBottom: 5, borderBottom: '3px dashed #D9A847',
        textShadow: '0 2px 3px #000000aa'}}>@heal.ingthroughquran</span>
    </div>
    <div style={{position: 'absolute', top: 512 + dy, left: 0, right: 0, textAlign: 'center'}}>
      <div style={{fontFamily: SERIF, fontSize: 132, lineHeight: 0.98, ...gold(0.35, 0.25), WebkitTextStroke: '2.2px #E7B040',
        filter: 'url(#yarn) drop-shadow(0 4px 3px #1A0A04cc) drop-shadow(0 14px 22px #000000bb) drop-shadow(0 0 26px #FFC85A77)'}}>Three<br/>darknesses</div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 70, lineHeight: 1.1, marginTop: 14, color: '#FBF1DE',
        textShadow: '0 3px 5px #000000dd, 0 0 18px #000000aa', filter: 'url(#yarn)'}}>and one thing saved him</div>
    </div>
    <div dir="rtl" lang="ar" style={{position: 'absolute', top: 1232 + dy, left: 90, right: 90, textAlign: 'center', fontFamily: AR, fontSize: 70, lineHeight: 1.7,
      ...gold(0.6, 0.4), WebkitTextStroke: '1.1px #E3AC45', filter: AR_THREAD, whiteSpace: 'nowrap'}}>{ws.join(' ')}</div>
    <div style={{position: 'absolute', top: 1366 + dy, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14}}>
      <span style={{width: 60, borderTop: '2px dashed #D9A847'}}/>
      <span style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 32, color: '#F6E3BC', textShadow: '0 2px 3px #000000cc'}}>
        Surah As-Saffat 37:143</span>
      <span style={{width: 60, borderTop: '2px dashed #D9A847'}}/>
    </div>
  </AbsoluteFill>;
};
