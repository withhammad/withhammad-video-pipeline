import React from 'react';
import {AbsoluteFill, Composition, Img, interpolate, registerRoot, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';

loadFont({family:'IqbalSerif',url:staticFile('fonts/instrument-serif-latin-400-normal.woff2')});
loadFont({family:'IqbalSans',url:staticFile('fonts/inter-latin-400-normal.woff2')});
loadFont({family:'IqbalArabic',url:staticFile('fonts/Amiri-Regular.ttf')});
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
const root='personal-iqbal-anime/';
const verses=[
 {from:0,to:144,ar:'يا بستان الأندلس، أتذكر تلك الأيام؟',roman:'Ae gulistan-e-Andalus, woh din hain yaad tujh ko',en:'O garden of Andalus, do you remember those days?'},
 {from:144,to:265,ar:'حين كان عشنا بين أغصانك',roman:'Tha teri daaliyon par jab aashiyaan hamaara',en:'When our nest rested among your branches?'},
 {from:265,to:384,ar:'يا أمواج دجلة، ألا تزالين تعرفيننا؟',roman:'Ae mauj-e-Dijla, tu bhi pehchaanti hai hum ko',en:'O waves of the Tigris, do you still recognise us?'},
 {from:384,to:495,ar:'لا يزال نهرك يروي حكايتنا',roman:'Ab tak hai tera darya afsaana-khwaan hamaara',en:'Your river still tells our story.'},
 {from:495,to:606,ar:'يا أرض الطهر، بذلنا أرواحنا صونًا لحرمتك',roman:'Ae arz-e-paak, teri hurmat pe kat mare hum',en:'O sacred land, we gave our lives for your honour.'},
 {from:606,to:885,ar:'لا يزال دمنا يجري في عروقك',roman:'Hai khoon teri ragon mein ab tak rawaan hamaara',en:'Our blood still flows through your veins.'},
];
const shots=[
 {from:0,to:144,bg:'terrace',x:[870,1187],height:[765,765],floor:[822,822],flip:false},
 {from:144,to:265,bg:'valley',x:[1335,1069],height:[730,750],floor:[807,822],flip:true},
 {from:265,to:384,bg:'river',x:[475,737],height:[760,760],floor:[822,822],flip:false},
 {from:384,to:495,bg:'river',x:[737,981],height:[760,760],floor:[822,822],flip:false},
 {from:495,to:606,bg:'courtyard',x:[1300,1056],height:[760,760],floor:[822,822],flip:true},
 {from:606,to:885,bg:'valley',x:[760,1251],height:[750,635],floor:[820,772],flip:false},
];

const AnimeFilm=()=>{
 const f=useCurrentFrame();const t=f/25;
 const s=shots.find(v=>f>=v.from&&f<v.to)??shots[shots.length-1];
 const verse=verses.find(v=>f>=v.from&&f<v.to)??verses[verses.length-1];
 const x=interpolate(f,[s.from,s.to-1],s.x,clamp);
 const h=interpolate(f,[s.from,s.to-1],s.height,clamp);
 const floor=interpolate(f,[s.from,s.to-1],s.floor,clamp);
 const walkFrame=(f%150)+1;
 const sprite=staticFile(`${root}walk/walk-${String(walkFrame).padStart(4,'0')}.png`);
 return <AbsoluteFill style={{backgroundColor:'#101b17',color:'#fff6e7',overflow:'hidden'}}>
   <div style={{position:'absolute',inset:'0 0 230px',overflow:'hidden'}}>
     <Img src={staticFile(`${root}${s.bg}.png`)} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center bottom'}}/>
     {/* A few hand-drawn leaves drift on their own paths; no haze overlay. */}
     <svg width="1920" height="850" style={{position:'absolute',inset:0,pointerEvents:'none'}}>
       {[0,1,2,3,4].map(i=>{
         const p=((t*.075+i*.21)%1);const lx=180+i*338+Math.sin(t*.8+i)*32;const ly=-60+p*890;
         return <g key={i} transform={`translate(${lx},${ly}) rotate(${t*32+i*42})`} opacity={.75}>
           <path d="M-8 0 Q0 -10 10 0 Q0 9 -8 0" fill={i%2?'#c89a38':'#7e913e'}/>
           <path d="M-6 0 L8 0" stroke="#58602e" strokeWidth="1"/>
         </g>;
       })}
       {s.bg==='river'&&[0,1,2,3,4,5,6,7].map(i=><path key={`r${i}`} d={`M${1030+i*82+Math.sin(t*1.4+i)*12} ${590+(i%3)*35} h${25+(i%3)*14}`} stroke="#eaf1d5" strokeWidth="2" opacity={.2+.14*Math.sin(t*2+i)}/>)}
     </svg>
     <div style={{position:'absolute',left:x-h*.13,top:floor-13,width:h*.26,height:20,borderRadius:'50%',background:'rgba(31,34,24,.28)',filter:'blur(6px)'}}/>
     <Img src={sprite} style={{position:'absolute',height:h,width:h*2/3,left:x-h/3,top:floor-h*.975,scale:s.flip?'-1 1':'1 1'}}/>
   </div>
   <div style={{position:'absolute',left:0,right:0,top:850,bottom:0,background:'#101b17',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:9,padding:'8px 80px 20px',textAlign:'center'}}>
     <div lang="ar" dir="rtl" style={{fontFamily:'IqbalArabic',fontSize:43,lineHeight:1.45,color:'#d5b784'}}>{verse.ar}</div>
     <div style={{fontFamily:'IqbalSans',fontSize:30,lineHeight:1.3,letterSpacing:.5}}>{verse.roman}</div>
     <div style={{fontFamily:'IqbalSerif',fontSize:39,lineHeight:1.25,color:'#ede4d4'}}>{verse.en}</div>
   </div>
 </AbsoluteFill>;
};
registerRoot(()=><Composition id="PersonalIqbalAnime" component={AnimeFilm} width={1920} height={1080} fps={25} durationInFrames={885}/>);
