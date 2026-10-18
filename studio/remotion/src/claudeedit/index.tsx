import React from 'react';
import {AbsoluteFill, Composition, registerRoot, useCurrentFrame, useVideoConfig, interpolate, Sequence, staticFile} from 'remotion';
import {Video} from '@remotion/media';

type Scene={start:number;end:number;title:string;subtitle:string;items:string[]};
type Props={source:string;seconds:number;scenes:Scene[]};
const Card:React.FC<{scene:Scene;index:number}>=({scene,index})=>{
 const f=useCurrentFrame();const {fps}=useVideoConfig();
 return <AbsoluteFill style={{left:760,width:1060,top:150,height:760,color:'#102448',fontFamily:'Arial'}}>
  <div style={{fontSize:24,letterSpacing:3,color:'#1877f2',marginBottom:26}}>CAMPAIGN PLANNING / {String(index+1).padStart(2,'0')}</div>
  <div style={{fontSize:66,fontWeight:700,lineHeight:1.08,opacity:interpolate(f,[0,12],[0,1],{extrapolateRight:'clamp'}),translate:`0 ${interpolate(f,[0,18],[32,0],{extrapolateRight:'clamp'})}px`}}>{scene.title}</div>
  <div style={{width:interpolate(f,[7,28],[0,140],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}),height:6,background:'#1877f2',margin:'27px 0'}}/>
  <div style={{fontSize:29,color:'#52647d',lineHeight:1.35,marginBottom:40}}>{scene.subtitle}</div>
  {scene.items.map((item,i)=><div key={item} style={{display:'flex',alignItems:'center',gap:24,padding:'22px 26px',marginBottom:16,borderRadius:20,background:index%2?'#102448':'white',color:index%2?'white':'#102448',boxShadow:'0 8px 24px #10244809',opacity:interpolate(f,[10+i*7,23+i*7],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}),translate:`${interpolate(f,[10+i*7,27+i*7],[35,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}px 0`}}><span style={{fontSize:22,background:'#1877f2',color:'white',borderRadius:12,padding:'10px 15px'}}>{i+1}</span><span style={{fontSize:34}}>{item}</span></div>)}
  <div style={{height:3,background:'#dce5f4',marginTop:24}}><div style={{height:3,background:'#1877f2',width:`${interpolate(f,[0,(scene.end-scene.start)*fps],[0,100],{extrapolateRight:'clamp'})}%`}}/></div>
 </AbsoluteFill>
};
const Edit:React.FC<Props>=({source,scenes})=>{const {fps}=useVideoConfig();return <AbsoluteFill style={{background:'#f5f8ff',fontFamily:'Arial'}}>
 <div style={{position:'absolute',left:60,top:50,fontSize:23,color:'#1877f2',letterSpacing:3}}>WITH HAMMAD / PRACTICAL AI</div>
 <div style={{position:'absolute',left:60,top:120,width:630,height:840,borderRadius:32,overflow:'hidden',background:'#dce5f4'}}>
 {source?<Video src={staticFile(source)} premountFor={fps} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center 25%'}}/>:<AbsoluteFill style={{justifyContent:'center',alignItems:'center',padding:60,fontSize:35,color:'#52647d',textAlign:'center'}}>Urdu avatar is generating<br/>Layout preview only</AbsoluteFill>}
 </div>
 {scenes.map((scene,index)=><Sequence key={index} from={Math.round(scene.start*fps)} durationInFrames={Math.max(1,Math.round((scene.end-scene.start)*fps))} premountFor={fps} name={scene.title}><Card scene={scene} index={index}/></Sequence>)}
 <div style={{position:'absolute',left:60,bottom:50,fontSize:21,color:'#52647d'}}>AI avatar of Hammad · Original cloned voice · Illustrative campaign plan</div>
 </AbsoluteFill>};
const Root=()=> <Composition id="HammadEditingDemo" component={Edit} width={1920} height={1080} fps={30} durationInFrames={1500} defaultProps={{source:'',seconds:50,scenes:[{start:0,end:50,title:'A clear campaign plan',subtitle:'Measured speech. Purposeful motion.',items:['Outcome','Audience','Message']}]}} calculateMetadata={({props})=>({durationInFrames:Math.ceil(props.seconds*30)})}/>;
registerRoot(Root);
