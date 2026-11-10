import React from 'react';
import {AbsoluteFill,Audio,Composition,registerRoot,staticFile} from 'remotion';
import {Fable,type FableProps} from './Fable';
import props from './fable.preflight.json';
import '../fonts';
export const FableEdit:React.FC<FableProps>=(p)=>{
 if(!p.draft&&(!p.voice||!p.avatar||!p.words.length||p.timingSource!=='recorded'||!p.voiceVerified||!p.avatarVerified))throw new Error('FABLE final requires verified generated voice/avatar and actual recorded word timings');
 return <AbsoluteFill><Fable {...p}/>{p.voice&&<Audio src={staticFile(p.voice)}/>}{p.draft&&<div style={{position:'absolute',top:0,left:0,right:0,padding:18,textAlign:'center',fontSize:28,color:'white',background:'#a82828',fontWeight:800}}>INTERNAL PREFLIGHT · PRESENTER & FINAL APPROVAL PENDING</div>}</AbsoluteFill>;
};
registerRoot(()=> <Composition id="FABLE" component={FableEdit} width={1080} height={1920} fps={30} durationInFrames={3261} defaultProps={props as FableProps} calculateMetadata={({props:p})=>({durationInFrames:Math.ceil(p.duration*30)})}/>);
