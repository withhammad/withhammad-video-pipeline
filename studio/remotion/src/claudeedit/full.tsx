import React from 'react';
import {AbsoluteFill,Composition,Sequence,registerRoot,staticFile,useCurrentFrame,interpolate,Img} from 'remotion';
import {Video,Audio} from '@remotion/media';
type Cue={start:number;end:number;text:string};
type Clip={start:number;frames:number;source:string;trim:number;kind:'presenter'|'screen'|'demo';title:string;subtitle:string;audio?:string;audioTrim?:number;cards?:string[]};
type Props={frames:number;clips:Clip[];captions:Cue[]};
const Shot:React.FC<{c:Clip}>=({c})=>{const f=useCurrentFrame();return <AbsoluteFill>
 {c.kind==='presenter'?<>
 <div style={{position:'absolute',left:100,top:100,width:580,height:810,borderRadius:32,overflow:'hidden'}}><Video src={staticFile('claude-edit/'+c.source)} trimBefore={c.trim} style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>
 <div style={{position:'absolute',left:760,top:170,width:1050}}><div style={{color:'#64c7ff',fontSize:24,letterSpacing:3}}>WITH HAMMAD / PRACTICAL AI</div><h1 style={{fontSize:74,lineHeight:1.1,margin:'28px 0'}}>{c.title}</h1><p style={{fontSize:31,color:'#bac9e1',lineHeight:1.5}}>{c.subtitle}</p>{(c.cards||[]).map((x,i)=><div key={x} style={{fontSize:32,padding:'20px 26px',border:'1px solid #334967',borderRadius:16,marginTop:18,opacity:interpolate(f,[i*9,i*9+18],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}><span style={{color:'#64c7ff',marginRight:24}}>0{i+1}</span>{x}</div>)}</div></>
 :<div style={{position:'absolute',top:75,left:0,width:1920,height:875,background:'#eef2f7',overflow:'hidden'}}><Video muted={!!c.audio} src={staticFile('claude-edit/'+c.source)} trimBefore={c.trim} style={{width:'100%',height:'100%',objectFit:'contain'}}/></div>}
 {c.audio&&<Audio src={staticFile('claude-edit/'+c.audio)} trimBefore={c.audioTrim||0}/>}
 {c.kind!=='presenter'&&<div style={{position:'absolute',top:23,left:42,right:42,fontSize:24,display:'flex',justifyContent:'space-between',color:'#d7e5f6'}}><span>{c.title}</span><span style={{fontSize:19,color:'#9aafc8'}}>WITH HAMMAD · AI AVATAR & CLONED VOICE</span></div>}
 </AbsoluteFill>};
const Full:React.FC<Props>=({clips,captions,frames})=>{const f=useCurrentFrame();const cue=captions.find(c=>f/30>=c.start&&f/30<c.end);return <AbsoluteFill style={{background:'#0c182b',color:'white',fontFamily:'Arial, sans-serif'}}>
 {clips.map((c,i)=><Sequence key={i} from={c.start} durationInFrames={c.frames} premountFor={30}><Shot c={c}/></Sequence>)}
 <div style={{position:'absolute',bottom:0,height:124,width:'100%',background:'#0c182b',display:'flex',alignItems:'center',justifyContent:'center',padding:'10px 80px 22px',boxSizing:'border-box'}}><div dir="auto" style={{fontSize:36,lineHeight:1.4,textAlign:'center',fontFamily:'Arial, sans-serif'}}>{cue?.text}</div></div>
 <div style={{position:'absolute',bottom:0,left:0,height:4,width:`${100*f/frames}%`,background:'#46b7ff'}}/>
 </AbsoluteFill>};
registerRoot(()=> <Composition id="FullTutorial" component={Full} fps={30} width={1920} height={1080} durationInFrames={30} defaultProps={{frames:30,clips:[],captions:[]}} calculateMetadata={({props})=>({durationInFrames:props.frames})}/>);
