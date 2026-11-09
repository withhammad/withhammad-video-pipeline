import React from 'react';
import {AbsoluteFill, Composition, Img, interpolate, registerRoot, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';

loadFont({family: 'IqbalSerif', url: staticFile('fonts/instrument-serif-latin-400-normal.woff2')});
loadFont({family: 'IqbalSans', url: staticFile('fonts/inter-latin-400-normal.woff2')});
loadFont({family: 'IqbalArabic', url: staticFile('fonts/Amiri-Regular.ttf')});

// Photo camera motion only. Original recitation/music is copied at final mux.
// No source-video picture, simulated speaking, title card or business branding.
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const beats = [
  {from:0, to:144, photo:'terrace', origin:70, zoom:[1.025,1.07], x:[-4,4],
    ar:'يا بستان الأندلس، أتذكر تلك الأيام؟',
    roman:'Ae gulistan-e-Andalus, woh din hain yaad tujh ko',
    en:'O garden of Andalus, do you remember those days?'},
  {from:144, to:265, photo:'terrace', origin:70, zoom:[1.17,1.13], x:[4,-4],
    ar:'حين كان عشنا بين أغصانك',
    roman:'Tha teri daaliyon par jab aashiyaan hamaara',
    en:'When our nest rested among your branches?'},
  {from:265, to:384, photo:'river', origin:28, zoom:[1.035,1.075], x:[4,-4],
    ar:'يا أمواج دجلة، ألا تزالين تعرفيننا؟',
    roman:'Ae mauj-e-Dijla, tu bhi pehchaanti hai hum ko',
    en:'O waves of the Tigris, do you still recognise us?'},
  {from:384, to:495, photo:'river', origin:28, zoom:[1.15,1.105], x:[-4,4],
    ar:'لا يزال نهرك يروي حكايتنا',
    roman:'Ab tak hai tera darya afsaana-khwaan hamaara',
    en:'Your river still tells our story.'},
  {from:495, to:606, photo:'courtyard', origin:64, zoom:[1.02,1.055], x:[-3,3],
    ar:'يا أرض الطهر، بذلنا أرواحنا صونًا لحرمتك',
    roman:'Ae arz-e-paak, teri hurmat pe kat mare hum',
    en:'O sacred land, we gave our lives for your honour.'},
  {from:606, to:885, photo:'courtyard', origin:64, zoom:[1.10,1.14], x:[3,-3],
    ar:'لا يزال دمنا يجري في عروقك',
    roman:'Hai khoon teri ragon mein ab tak rawaan hamaara',
    en:'Our blood still flows through your veins.'},
];

const PhotoFilm = () => {
  const frame = useCurrentFrame();
  const beat = beats.find(b => frame >= b.from && frame < b.to) ?? beats[beats.length - 1];
  const scale = interpolate(frame, [beat.from, beat.to - 1], beat.zoom, clamp);
  const x = interpolate(frame, [beat.from, beat.to - 1], beat.x, clamp);
  return <AbsoluteFill style={{backgroundColor:'#101b17', color:'#fff6e7', overflow:'hidden'}}>
    <Img src={staticFile(`personal-iqbal-v2/${beat.photo}.png`)} style={{
      width:'100%', height:'100%', objectFit:'cover',
      transformOrigin:`${beat.origin}% 0%`, transform:`translateX(${x}px) scale(${scale})`,
    }}/>
    <div style={{position:'absolute',left:0,right:0,top:850,bottom:0,
      background:'#101b17',display:'flex',flexDirection:'column',alignItems:'center',
      justifyContent:'center',gap:9,padding:'8px 80px 20px',textAlign:'center'}}>
      <div lang="ar" dir="rtl" style={{fontFamily:'IqbalArabic',fontSize:43,lineHeight:1.45,color:'#d5b784'}}>{beat.ar}</div>
      <div style={{fontFamily:'IqbalSans',fontSize:30,lineHeight:1.3,letterSpacing:.5}}>{beat.roman}</div>
      <div style={{fontFamily:'IqbalSerif',fontSize:39,lineHeight:1.25,color:'#ede4d4'}}>{beat.en}</div>
    </div>
  </AbsoluteFill>;
};

registerRoot(() => <Composition id="PersonalIqbalPhotos" component={PhotoFilm} width={1920} height={1080} fps={25} durationInFrames={885}/>);
