import {AbsoluteFill, Composition, Img, interpolate, registerRoot, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';

loadFont({family:'PoetryUrdu',url:staticFile('fonts/Amiri-Regular.ttf')});
const lines=[
  {start:3.72,end:7.32,text:'اور منافقت اتنی بری چیز ہے کہ'},
  {start:7.32,end:10.20,text:'ان پر عمل کرنے والا شخص'},
  {start:10.20,end:11.87,text:'گھاٹے ہی میں رہتا ہے'},
];
// The opening spoken word, دکھاوا, is already set in the artwork.
const Dikhawa=()=>{
 const f=useCurrentFrame();const t=f/30;
 const caption=lines.find(c=>t>=c.start&&t<c.end);
 return <AbsoluteFill style={{backgroundColor:'#22272b',overflow:'hidden'}}>
  <Img src={staticFile('personal-dikhawa/hero.png')} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',transformOrigin:'55% 65%',scale:interpolate(f,[0,355],[1.005,1.055]),translate:`${Math.sin(t*.18)*-5}px ${Math.sin(t*.13)*3}px`}}/>
  {caption&&<div lang="ur" dir="rtl" style={{position:'absolute',top:540,left:90,right:90,textAlign:'center',fontFamily:'PoetryUrdu',fontSize:59,lineHeight:1.65,color:'#fff4df',textShadow:'0 2px 14px rgba(0,0,0,.95), 0 1px 3px #141920',opacity:interpolate(t,[caption.start,caption.start+.08],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}>{caption.text}</div>}
 </AbsoluteFill>;
};
registerRoot(()=><Composition id="PersonalDikhawa" component={Dikhawa} width={1080} height={1920} fps={30} durationInFrames={356}/>);
