import {AbsoluteFill, Composition, Img, registerRoot, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';

loadFont({family:'IqbalSerif',url:staticFile('fonts/instrument-serif-latin-400-normal.woff2')});
loadFont({family:'IqbalSans',url:staticFile('fonts/inter-latin-400-normal.woff2')});
loadFont({family:'IqbalArabic',url:staticFile('fonts/Amiri-Regular.ttf')});

const ValleySample=()=>{
  const f=useCurrentFrame();
  return <AbsoluteFill style={{backgroundColor:'#101b17',color:'#fff6e7'}}>
    <div style={{position:'absolute',left:0,top:0,width:1920,height:850,overflow:'hidden'}}>
      <Img src={staticFile('personal-iqbal-anime/valley.png')} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center bottom'}}/>
      <Img src={staticFile(`personal-iqbal-valley/frames/frame-${String(f).padStart(4,'0')}.png`)} style={{position:'absolute',inset:0,width:1920,height:850}}/>
    </div>
    <div style={{position:'absolute',left:0,right:0,top:850,bottom:0,background:'#101b17',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:9,padding:'8px 80px 20px',textAlign:'center'}}>
      <div lang="ar" dir="rtl" style={{fontFamily:'IqbalArabic',fontSize:43,lineHeight:1.45,color:'#d5b784'}}>يا بستان الأندلس، أتذكر تلك الأيام؟</div>
      <div style={{fontFamily:'IqbalSans',fontSize:30,lineHeight:1.3,letterSpacing:.5}}>Ae gulistan-e-Andalus, woh din hain yaad tujh ko</div>
      <div style={{fontFamily:'IqbalSerif',fontSize:39,lineHeight:1.25,color:'#ede4d4'}}>O garden of Andalus, do you remember those days?</div>
    </div>
  </AbsoluteFill>;
};
registerRoot(()=><Composition id="PersonalValleySample" component={ValleySample} width={1920} height={1080} fps={25} durationInFrames={144}/>);
