import React from 'react';
import {AbsoluteFill,Freeze,Img,OffthreadVideo,staticFile,useCurrentFrame} from 'remotion';
import type {BatchProps} from './types';
export type CloneProps=Omit<BatchProps,'keyword'>&{keyword:'CLONE';referenceImage?:string};
const base='batchnov10/0e375e205e9d';
const cream='#f5eee7',accent='#f3a477',muted='#b3aaa3';
const clamp=(n:number)=>Math.min(1,Math.max(0,n));
const ease=(n:number)=>1-Math.pow(1-clamp(n),3);
const lengths:Record<string,number>={'creator-projects':4.3,model:.4,topic:1.1,research:2.5,structure:1.1,skill:.75,'skill-menu':.9,connectors:.45,consent:.58,study:6.4};
const clock=(p:CloneProps,t:number)=>{const s=p.segments.find(x=>t>=x.start&&t<x.end)??p.segments[p.segments.length-1];return s.ref[0]+clamp((t-s.start)/(s.end-s.start))*(s.ref[1]-s.ref[0]);};
// Redistribute visual-only sub-beats to readable holds; the recorded audio/captions and camera clock stay unchanged.
const visualClock=(p:CloneProps,t:number)=>{
 const r=clock(p,t);if(p.timingSource!=='recorded')return r;
 const script=p.segments[2],inputs=p.segments[3];
 const photo=p.words.find(w=>w.text.toLowerCase()==='photos'&&w.startMs>=inputs.start*1000)?.startMs;
 if(photo===undefined)return r;const end=photo/1000;
 if(t>=script.start&&t<end&&end-script.start>=6){
  const times=[script.start,end-4.5,end-3,end-1.5,end],refs=[14.1,16.4,18.2,20.7,23.3];
  const i=times.findIndex((x,k)=>k<4&&t>=x&&t<times[k+1]);
  return refs[i]+clamp((t-times[i])/(times[i+1]-times[i]))*(refs[i+1]-refs[i]);
 }
 if(t>=end&&t<inputs.end)return 23.3+clamp((t-end)/(inputs.end-end))*(31.6-23.3);
 return r;
};
const Label:React.FC<React.PropsWithChildren<{accented?:boolean}>>=({children,accented})=><div style={{fontSize:25,lineHeight:1.4,color:accented?accent:muted,fontWeight:650,letterSpacing:.5}}>{children}</div>;
const Heading:React.FC<React.PropsWithChildren>=({children})=><div style={{fontSize:66,lineHeight:1.07,fontWeight:800,letterSpacing:-2}}>{children}</div>;
const Stage:React.FC<React.PropsWithChildren>=({children})=><div style={{position:'absolute',left:76,right:150,top:310}}>{children}</div>;
const Clip:React.FC<{name:string;progress:number}>=({name,progress})=><Freeze frame={Math.min(Math.floor(lengths[name]*30)-2,Math.max(0,Math.floor(clamp(progress)*lengths[name]*30)))}><OffthreadVideo src={staticFile(`${base}/${name}.mp4`)} muted style={{width:'100%',height:'100%',objectFit:'contain'}}/></Freeze>;
const Presenter:React.FC<{p:CloneProps;full?:boolean}>=({p,full})=>{const t=useCurrentFrame()/30,s=p.segments.find(x=>t>=x.start&&t<x.end);return <div style={{position:'absolute',...(full?{inset:0}:{left:0,right:0,top:960,height:960}),overflow:'hidden',background:'radial-gradient(at 85% 20%,#734b2a,#191514 65%)'}}>{p.avatar&&s?.camera?<Freeze frame={Math.round((s.avatarStart+t-s.start)*30)}>{!full&&<OffthreadVideo src={staticFile(p.avatar)} muted style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',filter:'blur(32px) brightness(.6)',transform:'scale(1.08)'}}/>}<OffthreadVideo src={staticFile(p.avatar)} muted style={{position:'relative',width:'100%',height:full?'100%':880,objectFit:full?'cover':'contain',objectPosition:'50% 0%'}}/></Freeze>:<AbsoluteFill style={{justifyContent:full?'center':'flex-start',alignItems:'center',padding:100,paddingTop:full?100:200,textAlign:'center',fontSize:31,color:'#e0cabc',lineHeight:1.5}}>INTERNAL LAYOUT ONLY<br/>New CLONE presenter take pending</AbsoluteFill>}</div>;};
const Captions:React.FC<{p:CloneProps}>=({p})=>{const ms=useCurrentFrame()/30*1000;if(p.timingSource==='preflight')return <div style={{position:'absolute',left:76,right:150,top:1380,textAlign:'center',fontSize:26,color:'#fff',background:'#231d1bef',border:'1px dashed #a99383',padding:17,borderRadius:10}}>CAPTION BAND · recorded words pending</div>;const i=p.words.findIndex(w=>ms>=w.startMs&&ms<w.endMs);if(i<0)return null;const a=Math.floor(i/3)*3;return <div style={{position:'absolute',left:76,right:150,top:1380,textAlign:'center'}}><span style={{display:'inline-block',fontSize:42,lineHeight:1.14,fontWeight:800,padding:'12px 20px',background:'#111e',borderRadius:10,color:'white'}}>{p.words.slice(a,a+3).map((w,k)=><React.Fragment key={w.startMs}><span style={{color:a+k===i?accent:undefined}}>{w.text.trim()}</span>{k<2?' ':''}</React.Fragment>)}</span></div>;};
const Demo:React.FC<{name:string;progress:number;title:string;step:string;note?:string}>=({name,progress,title,step,note})=><>
 <Stage><Label accented>{step}</Label><div style={{marginTop:18}}><Heading>{title}</Heading></div></Stage>
 <div style={{position:'absolute',left:54,right:54,top:465,height:420,background:'#191919',borderRadius:22,overflow:'hidden',border:'1px solid #4b3b30'}}><Clip name={name} progress={progress}/></div>
 <div style={{position:'absolute',left:76,right:150,top:899}}><Label>{note??'Source demo · Arshman Khalid'}</Label></div>
</>;
const Pill:React.FC<React.PropsWithChildren>=({children})=><div style={{border:'1px solid #725644',background:'#332820',borderRadius:20,padding:'20px 26px',fontSize:32,fontWeight:650}}>{children}</div>;

export const Clone:React.FC<CloneProps>=(p)=>{
 const t=useCurrentFrame()/30,r=visualClock(p,t);const full=r>=51.5;
 return <AbsoluteFill style={{fontFamily:'Inter',color:cream,background:'radial-gradient(at 92% 4%,#3a281c,#151313 55%)',overflow:'hidden'}}>
 <Presenter p={p} full={full}/>
 {r<8.3&&<>
  <Stage><Heading>{r<3.7?<>Your look<br/><span style={{color:accent}}>Your voice</span></>:<>Claude plans<br/><span style={{color:accent}}>Tools generate</span></>}</Heading></Stage>
  <div style={{position:'absolute',left:76,right:76,top:500,height:430,borderRadius:24,overflow:'hidden',background:'#30251c'}}>
   <Img src={staticFile(p.referenceImage??`${base}/saved-look.webp`)} style={{width:'100%',height:'100%',objectFit:'cover',filter:'blur(20px)',opacity:.3}}/><Img src={staticFile(p.referenceImage??`${base}/saved-look.webp`)} style={{position:'absolute',left:0,top:-30,width:'100%',height:800,objectFit:'contain'}}/>
   <div style={{position:'absolute',left:24,top:20,background:'#15110ee8',padding:'12px 18px',fontSize:27,borderRadius:10}}>Saved avatar look</div>
   {r>=6&&<div style={{position:'absolute',bottom:20,left:24,right:24,display:'flex',gap:15,alignItems:'center',fontSize:30,fontWeight:750}}><Pill>Claude</Pill><span>→</span><Pill>Connected tools</Pill></div>}
  </div>
  <div style={{position:'absolute',left:76,top:1000,padding:'12px 18px',background:'#15110ee8',borderRadius:10,fontSize:27}}>Generated motion</div>
 </>}
 {r>=8.3&&r<14.1&&<Stage><Label accented>CREATOR’S DEMONSTRATION</Label><div style={{marginTop:20}}><Heading>Three reels<br/>One workflow</Heading></div><div style={{height:250,marginTop:45,borderRadius:20,overflow:'hidden',background:'#0a1011'}}><Clip name="creator-projects" progress={(r-8.3)/5.8}/></div><div style={{marginTop:25,fontSize:33,color:accent}}>Their examples. Their results.</div><div style={{marginTop:16}}><Label>Demonstration excerpts · Arshman Khalid</Label></div></Stage>}
 {r>=14.1&&r<16.4&&<Demo name="model" progress={(r-14.1)/2.3} title="Choose Fable 5.2" step="01 / START IN CLAUDE"/>}
 {r>=16.4&&r<18.2&&<Demo name="topic" progress={(r-16.4)/1.8} title="Give it your topic" step="01 / TOPIC + STRUCTURE"/>}
 {r>=18.2&&r<20.7&&<Demo name="research" progress={(r-18.2)/2.5} title="Research the topic" step="01 / RESEARCH"/>}
 {r>=20.7&&r<23.3&&<Demo name="structure" progress={(r-20.7)/2.6} title="Plan the script" step="01 / SCRIPT STRUCTURE" note="Creator’s example structure · Not a viral guarantee"/>}
 {r>=23.3&&r<31.6&&<Stage><Label accented>02 / YOUR OWN REFERENCES</Label><div style={{marginTop:20}}><Heading>{r<27?'Photos + clean audio':'Check the requirements'}</Heading></div>
  <div style={{display:'flex',gap:25,marginTop:40,height:310}}><div style={{width:220,overflow:'hidden',borderRadius:20,border:'1px solid #74533b'}}><Img src={staticFile(p.referenceImage??`${base}/saved-look.webp`)} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'50% 20%'}}/></div><div style={{flex:1,background:'#26201d',padding:25,borderRadius:20}}><Label>VOICE REFERENCE</Label><div style={{height:110,display:'flex',gap:8,alignItems:'center',marginTop:35}}>{Array.from({length:25},(_,i)=><div key={i} style={{height:15+Math.abs(Math.sin(i*1.7))*(65+15*Math.sin(t*2+i)),width:8,borderRadius:5,background:accent}}/>)}</div><div style={{fontSize:26,marginTop:24,color:muted}}>Clean recording · Your voice</div></div></div>
  <div style={{display:'flex',gap:20,marginTop:28}}><Pill>3 photos</Pill><Pill>≈25 sec audio</Pill></div><div style={{marginTop:18}}><Label>Creator’s example only · Provider requirements vary</Label></div>
 </Stage>}
 {r>=31.6&&r<33.2&&<Demo name="skill" progress={(r-31.6)/1.6} title="Add the workflow skill" step="03 / CONNECT THE WORKFLOW"/>}
 {r>=33.2&&r<34.7&&<Demo name="skill-menu" progress={(r-33.2)/1.5} title="Open Connectors" step="03 / CONNECT THE WORKFLOW"/>}
 {r>=34.7&&r<36.5&&<Demo name={r<35.2?'connectors':'consent'} progress={r<35.2?(r-34.7)/.5:(r-35.2)/1.3} title="Connect Higgsfield" step="03 / CONNECT THE WORKFLOW"/>}
 {r>=36.5&&r<44.2&&<><Demo name="study" progress={(r-36.5)/7.7} title={r<40.1?'Study the skill':'Prepare the video'} step="04 / BRIEF THE WORKFLOW"/><div style={{position:'absolute',left:76,right:150,top:780,fontSize:33,lineHeight:1.3,background:'#35271ff0',border:'1px solid #7b5640',borderRadius:18,padding:'17px 22px',translate:`0 ${(1-ease((r-36.5)/.35))*30}px`}}>{r<40.1?'Read the skill and review my references':'Plan the script, then prepare the clip'}</div></>}
 {r>=44.2&&r<47.8&&<Stage><Label accented>05 / REVIEW THE RETURNED VIDEO</Label><div style={{marginTop:20}}><Heading>Check before<br/>another take</Heading></div><div style={{marginTop:38,background:'#27201d',padding:30,borderRadius:24}}>{['Your likeness','Pronunciation','Natural movement'].map((x,i)=><div key={x} style={{display:'flex',gap:22,alignItems:'center',fontSize:38,padding:'15px 16px',borderRadius:12,background:Math.min(2,Math.floor((r-44.2)/1.2))===i?'#493323':undefined,opacity:ease((r-44.2-i*.2)/.4)}}><span style={{color:accent}}>□</span>{x}</div>)}</div><div style={{marginTop:20}}><Label>Review the script before generating</Label></div></Stage>}
 {r>=47.8&&r<51.5&&<Stage><Label accented>06 / REVISE ONE THING</Label><div style={{marginTop:20}}><Heading>Be specific<br/>about the fix</Heading></div><div style={{marginTop:40,background:'#28211e',border:'1px solid #6b4d39',borderRadius:25,padding:30}}><Label>ILLUSTRATIVE REVISION PROMPT</Label><div style={{fontSize:39,lineHeight:1.3,marginTop:22}}>“Keep the script. Correct the pronunciation of Higgsfield.”</div></div><div style={{marginTop:30,color:accent,fontSize:34,fontWeight:700}}>Check credit cost before retrying</div></Stage>}
 {r>=51.5&&<><AbsoluteFill style={{background:'linear-gradient(#18100a88,transparent 50%,#140e09aa)'}}/><div style={{position:'absolute',left:76,right:150,top:1080,padding:30,borderRadius:23,background:'#f7efe6',color:'#241910',translate:`0 ${(1-ease((r-51.5)/.4))*50}px`}}><div style={{fontSize:29,marginBottom:14}}>Plan it · Check it</div><div style={{fontSize:65,fontWeight:850}}>Comment <span style={{color:'#9c4824'}}>CLONE</span></div><div style={{fontSize:25,marginTop:12}}>Follow + get the checklist</div></div></>}
 <div style={{position:'absolute',left:76,top:235,fontSize:22,fontWeight:800,letterSpacing:4,color:'#cbb8a9'}}>WITHHAMMAD</div>
 <Captions p={p}/>
 </AbsoluteFill>;
};
