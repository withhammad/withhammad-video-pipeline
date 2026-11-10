import React from 'react';
import {AbsoluteFill,Audio,Composition,registerRoot,staticFile} from 'remotion';
import {Higgs} from './Higgs';
import {Advisor} from './Advisor';
import {DraftFlag} from './shared';
import type {BatchProps} from './types';
import higgs from './higgs.preflight.json';
import advisor from './advisor.preflight.json';
import '../fonts';

const Edit:React.FC<BatchProps>=(p)=>{
  if(!p.draft&&(!p.voice||!p.avatar||!p.words.length||p.timingSource!=='recorded'||!p.voiceVerified||!p.avatarVerified))throw new Error('Final render requires verified voice, camera take and recorded word timings');
  return <AbsoluteFill>
    {p.keyword==='HIGGS'?<Higgs {...p}/>:<Advisor {...p}/>}
    {p.voice&&<Audio src={staticFile(p.voice)}/>}
    {p.draft&&<DraftFlag/>}
  </AbsoluteFill>;
};
const Root:React.FC=()=> <>
  {[higgs,advisor].map(p=><Composition key={p.keyword} id={p.keyword} component={Edit} width={1080} height={1920} fps={30}
    durationInFrames={Math.ceil(p.duration*30)} defaultProps={p as BatchProps}
    calculateMetadata={({props})=>({durationInFrames:Math.ceil(props.duration*30)})}/>) }
</>;
registerRoot(Root);
