import {AbsoluteFill,Composition,Img,OffthreadVideo,interpolate,registerRoot,staticFile,useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {poems,Poem} from './poetry-data';
loadFont({family:'PoemUrdu',url:staticFile('fonts/Amiri-Regular.ttf')});
loadFont({family:'PoemEnglish',url:staticFile('fonts/instrument-serif-latin-400-normal.woff2')});

const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
const Poetry=({poem}:{poem:Poem})=>{
 const f=useCurrentFrame(),t=f/30;
 const next=poem.verses.findIndex(v=>v.start>t);
 const vi=next===-1?poem.verses.length-1:Math.max(0,next-1);
 const v=poem.verses[vi];const local=t-v.start;
 const textIn=vi===0?1:interpolate(local,[0,.12],[0,1],clamp);
 const scenic=!poem.crop;
 const scene=Math.floor(vi/2)%2;
 const bg=scenic&&scene===0?'river':'courtyard';
 const sceneStart=scenic?poem.verses[Math.floor(vi/2)*2].start:0;
 const sceneEnd=scenic?(poem.verses[Math.floor(vi/2)*2+2]?.start??poem.duration):poem.duration;
 const push=interpolate(t,[sceneStart,sceneEnd],[1.008,1.055],clamp);
 return <AbsoluteFill style={{background:'#0a1922',overflow:'hidden',color:'#fff3dc'}}>
  <Img src={staticFile(`personal-poetry/${bg}.png`)} style={{width:1080,height:1920,objectFit:'cover',transform:`scale(${push})`,transformOrigin:scenic?'50% 74%':'67% 85%'}}/>
  <AbsoluteFill style={{background:scenic?'linear-gradient(180deg,rgba(7,18,24,.60) 0%,rgba(7,18,24,.34) 32%,transparent 58%)':'linear-gradient(180deg,rgba(3,15,23,.25),transparent 62%)'}}/>
  <div style={{position:'absolute',top:234,left:90,right:90,textAlign:'center',fontFamily:'PoemUrdu',fontSize:31,color:'#e0c195',letterSpacing:1}} lang="ur" dir="rtl">{poem.title} · علامہ اقبال</div>
  <div style={{position:'absolute',left:80,right:80,top:scenic?330:315,textAlign:'center',opacity:textIn,transform:`translateY(${(1-textIn)*8}px)`,textShadow:'0 3px 16px rgba(0,0,0,.65)'}}>
   <div lang="ur" dir="rtl" style={{fontFamily:'PoemUrdu',fontSize:v.ur.length>48?59:65,lineHeight:1.55,minHeight:195,display:'flex',alignItems:'center',justifyContent:'center',textWrap:'balance'}}>{v.ur}</div>
   <div style={{fontFamily:'PoemEnglish',fontSize:43,lineHeight:1.23,color:'#f0e4cd',marginTop:12,textWrap:'balance',maxWidth:860,marginInline:'auto'}}>{v.en}</div>
  </div>
  {!scenic&&<div style={{position:'absolute',left:54,top:765,width:972,height:546,overflow:'hidden',borderRadius:12,boxShadow:'0 22px 60px rgba(0,0,0,.58)',border:'1px solid rgba(226,192,138,.35)',background:'#131512'}}>
   <OffthreadVideo src={staticFile(`personal-poetry/clips/${poem.id}.mp4`)} muted style={{width:'100%',height:'100%',objectFit:'cover',transform:`scale(${interpolate(local,[0,8],[1,1.025],clamp)})`}}/>
  </div>}
 </AbsoluteFill>;
};
registerRoot(()=> <>{poems.map(poem=><Composition key={poem.id} id={`Poetry-${poem.id.replace(/_/g,'X')}`} component={Poetry} defaultProps={{poem}} width={1080} height={1920} fps={30} durationInFrames={Math.ceil(poem.duration*30)}/>)}</>);
