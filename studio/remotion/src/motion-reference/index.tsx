import React from 'react';
import {AbsoluteFill,Composition,registerRoot,OffthreadVideo,Audio,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import data from './alignment.json';
type Props={avatar:string;music:string;duration:number;voice?:string;voiceReady?:boolean};
const ReferenceMatch:React.FC<Props>=({avatar,voice='motion-library/voice-natural.wav',voiceReady=false})=>{
 const t=useCurrentFrame()/useVideoConfig().fps;
 const split=data.split.some(([a,b])=>t>=a-.2&&t<b+.2);
 const full=data.full.some(([a,b])=>t>=a-.2&&t<b+.2);
 const wi=data.captions.findIndex(w=>t*1000>=w.startMs&&t*1000<w.endMs+80);
 const group=wi<0?[]:data.captions.slice(Math.floor(wi/3)*3,Math.floor(wi/3)*3+3);
 const ending=t>=data.full[data.full.length-1][0]-.2;
 return <AbsoluteFill style={{background:'#101820',fontFamily:'Arial',color:'white'}}>
  <OffthreadVideo src={staticFile('motion-library/reference-aligned.mp4')} muted style={{width:'100%',height:'100%'}}/>
  {split&&<div style={{position:'absolute',left:0,right:0,top:980,bottom:0,background:'#101820'}}/>}
  {full&&<AbsoluteFill style={{background:'#101820',padding:'300px 90px'}}>
   <div style={{fontSize:27,letterSpacing:6,color:'#72c9ff'}}>PROMPT MOTION</div>
   <div style={{fontSize:100,fontWeight:900,lineHeight:1.08,marginTop:50}}>{ending?<>MAKE IT<br/>YOUR OWN.</>:<>COPY.<br/>ADAPT.<br/>CREATE.</>}</div>
   <div style={{fontSize:38,lineHeight:1.5,marginTop:55,color:'#d5e1ec'}}>{ending?'Comment MOTION for the starter brief and checklist.':'Choose an example. Adapt the prompt to your brand.'}</div>
  </AbsoluteFill>}
  {(split||full)&&<div style={{position:'absolute',top:1100,left:70,right:70,textAlign:'center',fontWeight:800,fontSize:58,lineHeight:1.2,textShadow:'0 3px 12px #000'}}>{group.map((w,i)=><span key={i} style={{color:/motion/i.test(w.text)?'#72c9ff':'white'}}>{w.text.trim()+' '}</span>)}</div>}
  <div style={{position:'absolute',right:46,bottom:90,width:300,height:450,overflow:'hidden',borderRadius:28,border:'2px solid #ffffff30',background:'#101820'}}>
   <OffthreadVideo src={staticFile(avatar)} muted style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'50% 35%'}}/>
  </div>
  {voiceReady&&<Audio src={staticFile(voice)}/>}
  <div style={{position:'absolute',bottom:65,left:42,fontSize:22,color:'#d5e1ec'}}>AI presenter · @with.hammad</div>
 </AbsoluteFill>;
};
registerRoot(()=> <Composition id="MotionReferenceMatch" component={ReferenceMatch} width={1080} height={1920} fps={30} durationInFrames={1028} calculateMetadata={({props})=>({durationInFrames:Math.ceil(props.duration*30)})} defaultProps={{avatar:'motion-library/avatar-natural.mp4',music:'motion-library/music.wav',voice:'motion-library/voice-natural.wav',voiceReady:false,duration:data.duration}}/>);
