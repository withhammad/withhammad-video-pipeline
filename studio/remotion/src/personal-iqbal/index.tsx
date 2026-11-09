import React from 'react';
import {AbsoluteFill, Composition, Img, interpolate, registerRoot, staticFile, useCurrentFrame} from 'remotion';
import {Video} from '@remotion/media';
import {loadFont} from '@remotion/fonts';

loadFont({family: 'IqbalSerif', url: staticFile('fonts/instrument-serif-latin-400-normal.woff2')});
loadFont({family: 'IqbalSans', url: staticFile('fonts/inter-latin-400-normal.woff2')});
loadFont({family: 'IqbalArabic', url: staticFile('fonts/Amiri-Regular.ttf')});

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const gold = '#d5b784';
const paper = '#fff6e7';
const verses = [
  {from:0, to:144, ar:'يا بستان الأندلس، أتذكر تلك الأيام؟', roman:'Ae gulistan-e-Andalus, woh din hain yaad tujh ko', en:'O garden of Andalus, do you remember those days?'},
  {from:144, to:265, ar:'حين كان عشنا بين أغصانك', roman:'Tha teri daaliyon par jab aashiyaan hamaara', en:'When our nest rested among your branches?'},
  {from:265, to:384, ar:'يا أمواج دجلة، ألا تزالين تعرفيننا؟', roman:'Ae mauj-e-Dijla, tu bhi pehchaanti hai hum ko', en:'O waves of the Tigris, do you still recognise us?'},
  {from:384, to:495, ar:'لا يزال نهرك يروي حكايتنا', roman:'Ab tak hai tera darya afsaana-khwaan hamaara', en:'Your river still tells our story.'},
  {from:495, to:606, ar:'يا أرض الطهر، بذلنا أرواحنا صونًا لحرمتك', roman:'Ae arz-e-paak, teri hurmat pe kat mare hum', en:'O sacred land, we gave our lives for your honour.'},
  {from:606, to:768, ar:'لا يزال دمنا يجري في عروقك', roman:'Hai khoon teri ragon mein ab tak rawaan hamaara', en:'Our blood still flows through your veins.'},
];

const Film = () => {
  const f = useCurrentFrame();
  const close = f >= 768;
  const verse = verses.find(v => f >= v.from && f < v.to);
  return <AbsoluteFill style={{backgroundColor: '#131b18', color: paper}}>
    {close ? <AbsoluteFill>
      <Img src={staticFile('personal-iqbal/palace.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', scale: interpolate(f, [768, 885], [1.025, 1.065], clamp)}}/>
      <AbsoluteFill style={{background: 'linear-gradient(90deg,rgba(8,17,14,.82),rgba(8,17,14,.65))'}}/>
    </AbsoluteFill> : <Video src={staticFile('personal-iqbal/reference.mp4')} muted style={{width:'100%', height:'100%', objectFit:'contain'}}/>}

    {!close && <AbsoluteFill style={{pointerEvents:'none', opacity:interpolate(f,[0,8,90,112],[1,1,1,0],clamp)}}>
      <div style={{position:'absolute',top:64,left:82,padding:'24px 35px 30px',background:'linear-gradient(90deg,rgba(13,23,18,.84),rgba(13,23,18,.55))',borderLeft:`2px solid ${gold}`}}>
        <div style={{fontFamily:'IqbalSans',fontSize:22,letterSpacing:5,color:gold}}>ALLAMA IQBAL · 9 NOVEMBER</div>
        <div style={{fontFamily:'IqbalSerif',fontSize:88,lineHeight:1.08,marginTop:13,translate:`0 ${interpolate(f,[0,24],[10,0],clamp)}px`}}>Andalus</div>
      </div>
    </AbsoluteFill>}

    {verse && <div style={{position:'absolute',left:0,right:0,top:850,bottom:0,background:'#101b17',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:9,padding:'8px 80px 20px'}}>
      <div lang="ar" dir="rtl" style={{fontFamily:'IqbalArabic',fontSize:43,lineHeight:1.45,color:gold}}>{verse.ar}</div>
      <div style={{fontFamily:'IqbalSans',fontSize:30,lineHeight:1.3,letterSpacing:.5}}>{verse.roman}</div>
      <div style={{fontFamily:'IqbalSerif',fontSize:39,lineHeight:1.25,color:'#ede4d4'}}>{verse.en}</div>
    </div>}

    {close && <AbsoluteFill style={{alignItems:'center',justifyContent:'center',opacity:interpolate(f,[768,778],[0,1],clamp)}}>
      <div style={{position:'absolute',inset:60,border:`1px solid ${gold}66`}}/>
      <div style={{fontFamily:'IqbalSans',fontSize:25,letterSpacing:7,color:gold}}>IN THE WORDS OF</div>
      <div lang="ur" dir="rtl" style={{fontFamily:'IqbalArabic',fontSize:154,lineHeight:1.5,marginTop:15}}>علامہ اقبال</div>
      <div style={{width:90,height:2,background:gold,margin:'2px 0 32px',scale:interpolate(f,[773,800],[.3,1],clamp)}}/>
      <div style={{fontFamily:'IqbalSerif',fontSize:72}}>Tarana-e-Milli</div>
      <div style={{fontFamily:'IqbalSans',fontSize:24,letterSpacing:4,marginTop:22,color:'#e4d8c2'}}>ANDALUS · 9 NOVEMBER</div>
      <div style={{position:'absolute',bottom:101,fontFamily:'IqbalSans',fontSize:23,color:'#e2d6c3'}}>Source reel: @multazimmominx</div>
    </AbsoluteFill>}
  </AbsoluteFill>;
};
registerRoot(() => <Composition id="PersonalIqbal" component={Film} width={1920} height={1080} fps={25} durationInFrames={885}/>);
