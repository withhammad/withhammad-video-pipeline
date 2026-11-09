import {AbsoluteFill, Composition, Img, interpolate, registerRoot, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
loadFont({family:'IqbalSerif',url:staticFile('fonts/instrument-serif-latin-400-normal.woff2')});
loadFont({family:'IqbalSans',url:staticFile('fonts/inter-latin-400-normal.woff2')});
loadFont({family:'IqbalArabic',url:staticFile('fonts/Amiri-Regular.ttf')});
const verses=[
 {from:0,to:144,ar:'يا بستان الأندلس، أتذكر تلك الأيام؟',roman:'Ae gulistan-e-Andalus, woh din hain yaad tujh ko',en:'O garden of Andalus, do you remember those days?'},
 {from:144,to:265,ar:'حين كان عشنا بين أغصانك',roman:'Tha teri daaliyon par jab aashiyaan hamaara',en:'When our nest rested among your branches?'},
 {from:265,to:384,ar:'يا أمواج دجلة، ألا تزالين تعرفيننا؟',roman:'Ae mauj-e-Dijla, tu bhi pehchaanti hai hum ko',en:'O waves of the Tigris, do you still recognise us?'},
 {from:384,to:495,ar:'لا يزال نهرك يروي حكايتنا',roman:'Ab tak hai tera darya afsaana-khwaan hamaara',en:'Your river still tells our story.'},
 {from:495,to:606,ar:'يا أرض الطهر، بذلنا أرواحنا صونًا لحرمتك',roman:'Ae arz-e-paak, teri hurmat pe kat mare hum',en:'O sacred land, we gave our lives for your honour.'},
 {from:606,to:885,ar:'لا يزال دمنا يجري في عروقك',roman:'Hai khoon teri ragon mein ab tak rawaan hamaara',en:'Our blood still flows through your veins.'},
];
const shots=[
 {from:0,to:144,bg:'valley',plate:true,start:0,ps:1,px:0,py:0,zoom:1},
 {from:144,to:265,bg:'courtyard',plate:true,start:23,ps:1,px:0,py:0,zoom:1},
 {from:265,to:384,bg:'river',plate:false,start:0,ps:1,px:0,py:0,zoom:1.035},
 {from:384,to:495,bg:'valley',plate:true,start:25,ps:1,px:0,py:0,zoom:1.22},
 {from:495,to:606,bg:'terrace',plate:false,start:30,ps:1,px:0,py:0,zoom:1.035},
 {from:606,to:750,bg:'courtyard',plate:true,start:0,ps:1,px:0,py:0,zoom:1.12},
 {from:750,to:885,bg:'valley',plate:true,start:9,ps:1,px:0,py:0,zoom:1},
];
const Film=()=>{
 const f=useCurrentFrame();const s=shots.find(s=>f>=s.from&&f<s.to)!;const v=verses.find(v=>f>=v.from&&f<v.to)!;
 const pf=Math.min(143,s.start+f-s.from);
 return <AbsoluteFill style={{backgroundColor:'#101b17',color:'#fff6e7'}}>
  <div style={{position:'absolute',left:0,top:0,width:1920,height:850,overflow:'hidden'}}>
   <div style={{position:'absolute',inset:0,scale:s.plate?s.zoom:interpolate(f,[s.from,s.to-1],[1,s.zoom]),transformOrigin:'55% 100%'}}>
    <Img src={staticFile(`personal-iqbal-anime/${s.bg}.png`)} style={{width:1920,height:850,objectFit:'cover',objectPosition:'center bottom'}}/>
    {s.plate&&<Img src={staticFile(`personal-iqbal-valley/frames/frame-${String(pf).padStart(4,'0')}.png`)} style={{position:'absolute',left:s.px,top:s.py,width:1920*s.ps,height:850*s.ps}}/>}
   </div>
  </div>
  <div style={{position:'absolute',left:0,right:0,top:850,bottom:0,background:'#101b17',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:9,padding:'8px 80px 20px',textAlign:'center'}}>
   <div lang="ar" dir="rtl" style={{fontFamily:'IqbalArabic',fontSize:43,lineHeight:1.45,color:'#d5b784'}}>{v.ar}</div>
   <div style={{fontFamily:'IqbalSans',fontSize:30,lineHeight:1.3,letterSpacing:.5}}>{v.roman}</div>
   <div style={{fontFamily:'IqbalSerif',fontSize:39,lineHeight:1.25,color:'#ede4d4'}}>{v.en}</div>
  </div>
 </AbsoluteFill>;
};
registerRoot(()=><Composition id="PersonalValleyFilm" component={Film} width={1920} height={1080} fps={25} durationInFrames={885}/>);
