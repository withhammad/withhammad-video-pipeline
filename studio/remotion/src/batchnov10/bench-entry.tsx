import React from 'react';
import {AbsoluteFill,Audio,Composition,registerRoot,staticFile} from 'remotion';
import {Bench,type BenchProps} from './Bench';
import props from './bench.preflight.json';
import '../fonts';
export const BenchEdit:React.FC<BenchProps>=(p)=>{
 if(p.segments.some(s=>s.camera))throw new Error('BENCH is a faceless reference; camera segments are not authorized');
 if(!p.draft&&(!p.voice||!p.words.length||p.timingSource!=='recorded'||!p.voiceVerified))throw new Error('BENCH final requires approved owner narration and recorded word timings');
 if(!p.draft&&(p.duration<60.3||p.duration>73.7)&&p.durationExceptionApproved!==true)throw new Error('BENCH duration is outside 60.3–73.7 seconds; explicit owner duration exception is required');
 if(!p.draft&&(p.approvedNarrationSha256!=='429724519a16571fe8701cec16e8670b6bb0c9f4bd6c1aeb67646b6bc71be130'||p.durationApprovedSeconds!==p.duration||Math.abs(p.duration-75.2326530612245)>1e-6))throw new Error('BENCH exact approved narration/length mismatch');
 return <AbsoluteFill><Bench {...p}/>{p.voice&&<Audio src={staticFile(p.voice)}/>}{p.draft&&<div style={{position:'absolute',top:0,left:0,right:0,padding:18,textAlign:'center',fontFamily:'Inter',fontSize:25,color:'white',background:'#973832',fontWeight:800}}>INTERNAL DRAFT · VOICE / DURATION APPROVAL PENDING</div>}</AbsoluteFill>;
};
registerRoot(()=> <Composition id="BENCH" component={BenchEdit} width={1080} height={1920} fps={30} durationInFrames={2010} defaultProps={props as unknown as BenchProps} calculateMetadata={({props:p})=>({durationInFrames:Math.ceil(p.duration*30)})}/>);
