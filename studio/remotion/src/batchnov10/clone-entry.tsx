import React from 'react';
import {AbsoluteFill,Audio,Composition,registerRoot,staticFile} from 'remotion';
import {Clone,type CloneProps} from './Clone';
import props from './clone.preflight.json';
import '../fonts';
export const CloneEdit:React.FC<CloneProps>=(p)=>{
 if(!p.draft&&(!p.voice||!p.avatar||!p.words.length||p.timingSource!=='recorded'||!p.voiceVerified||!p.avatarVerified))throw new Error('CLONE final requires verified owner voice, new CLONE avatar and recorded caption timings');
 return <AbsoluteFill><Clone {...p}/>{p.voice&&<Audio src={staticFile(p.voice)}/>}{p.draft&&<div style={{position:'absolute',top:0,left:0,right:0,padding:18,background:'#a82828',color:'white',textAlign:'center',fontSize:28,fontWeight:800}}>INTERNAL DRAFT · NEW PRESENTER + FINAL APPROVAL PENDING</div>}</AbsoluteFill>;
};
registerRoot(()=> <Composition id="CLONE" component={CloneEdit} width={1080} height={1920} fps={30} durationInFrames={1647} defaultProps={props as unknown as CloneProps} calculateMetadata={({props:p})=>({durationInFrames:Math.ceil(p.duration*30)})}/>);
