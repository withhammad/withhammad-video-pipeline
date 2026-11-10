import React from 'react';
import {AbsoluteFill, Freeze, Img, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import type {BatchProps} from './types';

export type FableProps = Omit<BatchProps,'keyword'> & {keyword:'FABLE'};
const CLIP_LENGTHS:Record<string,number>={'launch':1.8,'dot':1.8,'dot-day':1.6,'dot-night':1.9,'history':3.2,'future':5.2,'pattern-intro':1.9,'pattern':3.8,'project-a':.5,'project-b':.6,'project-c':.9,'cyber-a':2.7,'cyber-b':4.2};
const blue='#1749ed', ink='#262321', rust='#b85e48', cream='#f7f2e9';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const ease=(n:number)=>1-Math.pow(1-clamp(n),3);
const clock=(p:FableProps,t:number)=>{const s=p.segments.find(s=>t>=s.start&&t<s.end)??p.segments[p.segments.length-1];return s.ref[0]+clamp((t-s.start)/(s.end-s.start))*(s.ref[1]-s.ref[0]);};
// Redistribute only visual sub-beats; source narration, words and camera chunks stay on their recorded clocks.
const visualClock=(p:FableProps,r:number)=>{
 const scaleAt=(at:number)=>{const s=p.segments.find(x=>at>=x.ref[0]&&at<x.ref[1])!;return (s.end-s.start)/(s.ref[1]-s.ref[0]);};
 const warp=(x:number,from:number[],to:number[])=>{const i=Math.min(from.length-2,Math.max(0,from.findIndex((v,k)=>k<from.length-1&&x>=v&&x<from[k+1])));return to[i]+clamp((x-from[i])/(from[i+1]-from[i]))*(to[i+1]-to[i]);};
 if(r>=10&&r<17){const rate=scaleAt(10);if(2*rate<1.5)return warp(r,[10,10+1.5/rate,17],[10,12,17]);}
 if(r>=72&&r<79){const rate=scaleAt(72);if(1.5*rate<1.5){
  const total=7*rate;const intro=total-1.5-.93-.3;
  const seconds=[0,intro,intro+1.5,intro+1.81,intro+2.12,intro+2.43,total];
  return warp(r,seconds.map(n=>72+n/rate),[72,74,75.5,76.3,77.1,78,79]);
 }}
 return r;
};
const Clip:React.FC<{name:string;at:number;duration:number;contain?:boolean}>=({name,at,duration,contain})=>name==='project-a'?<Img src={staticFile('batchnov10/c5bc128a0a8d/project-a.jpg')} style={{width:'100%',height:'100%',objectFit:contain?'contain':'cover'}}/>:<Freeze frame={Math.max(0,Math.min(Math.floor((CLIP_LENGTHS[name]??duration)*30)-2,Math.floor(at/duration*(CLIP_LENGTHS[name]??duration)*30)))}><OffthreadVideo src={staticFile(`batchnov10/c5bc128a0a8d/${name}.mp4`)} muted style={{width:'100%',height:'100%',objectFit:contain?'contain':'cover'}}/></Freeze>;
const Card:React.FC<React.PropsWithChildren<{style?:React.CSSProperties}>>=({children,style})=><div style={{background:'#fffaf4',border:'1px solid #e4d8cf',borderRadius:30,boxShadow:'0 16px 45px #754d3520',padding:38,...style}}>{children}</div>;
const Label:React.FC<React.PropsWithChildren<{dark?:boolean}>>=({children,dark})=><div style={{fontSize:25,fontWeight:650,letterSpacing:.5,lineHeight:1.4,color:dark?'#d3d8e5':'#645b56'}}>{children}</div>;
const Title:React.FC<React.PropsWithChildren<{style?:React.CSSProperties}>>=({children,style})=><div style={{fontSize:70,fontWeight:800,lineHeight:1.07,letterSpacing:-2,...style}}>{children}</div>;
const Chapter:React.FC<{number:string;name:string;progress:number}>=({number,name,progress})=><AbsoluteFill style={{background:'radial-gradient(at 12% 8%,#4e91ff,#1749ed 50%,#0827bc)',padding:'350px 95px',color:'#fff',justifyContent:'center'}}><div style={{fontSize:390,fontWeight:600,lineHeight:.9,textShadow:'0 0 50px #ffffff55',transform:`translateY(${(1-ease(progress))*70}px)`}}>{number}</div><div style={{fontSize:76,fontWeight:550,marginTop:35}}>{name}</div></AbsoluteFill>;
const Presenter:React.FC<{p:FableProps;full:boolean}>=({p,full})=>{const t=useCurrentFrame()/30;const s=p.segments.find(s=>t>=s.start&&t<s.end);if(!s?.camera)return null;return <div style={{position:'absolute',...(full?{inset:0}:{left:0,right:0,top:880,height:1040}),overflow:'hidden',background:'#8d857b'}}>{p.avatar?<Freeze frame={Math.round((s.avatarStart+t-s.start)*30)}><OffthreadVideo src={staticFile(p.avatar)} muted style={{width:'100%',height:'100%',objectFit:full?'cover':'contain'}}/></Freeze>:<AbsoluteFill style={{background:'linear-gradient(125deg,#c0b59e,#626a59)',justifyContent:'center',alignItems:'center',color:'white',fontSize:32,textAlign:'center',padding:80}}>INTERNAL LAYOUT ONLY<br/>Verified Hammad presenter pending</AbsoluteFill>}</div>;};
const Captions:React.FC<{p:FableProps}>=({p})=>{const ms=useCurrentFrame()/30*1000;const i=p.words.findIndex(w=>ms>=w.startMs&&ms<w.endMs);if(i<0)return null;const a=Math.floor(i/3)*3;return <div style={{position:'absolute',left:72,right:150,top:1325,textAlign:'center'}}><span style={{display:'inline-block',background:'#111d',borderRadius:12,padding:'12px 22px',fontSize:48,fontWeight:800,lineHeight:1.2,color:'#fff'}}>{p.words.slice(a,a+3).map((w,k)=><React.Fragment key={w.startMs}><span style={{color:a+k===i?'#ffce96':'#fff'}}>{w.text.trim()}</span>{k<2?' ':''}</React.Fragment>)}</span></div>;};

const Demo:React.FC<{name:string;at:number;duration:number;title:string;credit:string;split?:boolean;note?:string}>=({name,at,duration,title,credit,split,note})=><>
 <div style={{position:'absolute',left:76,right:150,top:310}}><Title style={{fontSize:56,color:'#fff'}}>{title}</Title><div style={{marginTop:19}}><Label dark>{credit}</Label></div></div>
 <div style={{position:'absolute',left:50,right:50,top:split?485:580,height:split?365:570,borderRadius:20,overflow:'hidden',background:'#08090b'}}><Clip name={name} at={at} duration={duration} contain/></div>
 {note&&<div style={{position:'absolute',left:76,right:150,top:split?815:1210,color:'#e1dfd9',fontSize:30,fontWeight:650,padding:'12px 18px',background:'#141721e8',borderRadius:15}}>{note}</div>}
</>;

const Official:React.FC<{r:number}>=({r})=>{
 const stage=r<51?0:r<54?1:r<56.5?2:r<58.5?3:4;
 return <AbsoluteFill style={{background:'radial-gradient(at 85% 10%,#e9dcf5,transparent 55%),radial-gradient(at 5% 80%,#f6d3bc,transparent 55%),#f8f4ed',padding:'335px 76px 0',color:ink}}>
  <Label>ANTHROPIC’S PUBLISHED CHANGES</Label>
  {stage===0&&<><Title style={{marginTop:45}}>Meet<br/><span style={{color:rust}}>Fable 5.2</span></Title><Card style={{marginTop:70}}><div style={{fontSize:39,color:'#8b837d',padding:18}}>Fable 5.1</div><div style={{fontSize:57,fontWeight:750,padding:18,background:'#eee9df',borderRadius:16}}>Fable 5.2 <span style={{fontSize:28,color:rust}}>NEW</span></div></Card></>}
  {stage===1&&<><div style={{marginTop:45,color:rust,fontWeight:800,fontSize:150,lineHeight:1}}>Up to 30%</div><Title style={{fontSize:66,marginTop:20}}>faster output</Title><Card style={{marginTop:70}}>{['Fable 5.1','Fable 5.2'].map((s,i)=><div key={s} style={{margin:'22px 0',fontSize:33,fontWeight:650}}>{s}<div style={{height:25,marginTop:18,background:i?rust:'#b8b3ae',borderRadius:12,width:`${(i?100:77)*ease((r-51)/.7)}%`}}/></div>)}</Card><div style={{marginTop:25}}><Label>Versus Fable 5.1 · Output speed</Label></div></>}
  {stage===2&&<><Title style={{marginTop:45}}>Stronger on<br/>demanding work</Title><Card style={{marginTop:60}}>{['Coding','Reasoning','Vision'].map((s,i)=><div key={s} style={{fontSize:46,fontWeight:650,marginBottom:32,opacity:ease((r-54-i*.18)/.4)}}><span style={{color:rust,marginRight:22}}>✓</span>{s}</div>)}</Card></>}
  {stage===3&&<><Title style={{marginTop:45}}>Adaptive<br/>thinking</Title><Card style={{marginTop:100,display:'flex',alignItems:'center',justifyContent:'space-between'}}><div style={{fontSize:43,fontWeight:750}}>Always enabled</div><div style={{height:70,width:130,background:rust,borderRadius:60,padding:8}}><div style={{width:54,height:54,borderRadius:50,background:'white',marginLeft:60}}/></div></Card><div style={{marginTop:35}}><Label>Thinking depth adapts to each step.</Label></div></>}
  {stage===4&&<><Title style={{marginTop:45}}>More effort<br/>for hard tasks</Title><Card style={{marginTop:95}}><Label>EFFORT CONTROL · ILLUSTRATION</Label><div style={{display:'flex',alignItems:'end',gap:24,marginTop:50}}>{[.35,.55,.75,1].map((h,i)=><div key={h} style={{height:200*h,width:150,background:i===3?rust:'#d7cdc2',borderRadius:'16px 16px 0 0'}}/>)}</div><div style={{fontSize:35,marginTop:30,color:rust,fontWeight:700}}>Choose for the task</div></Card></>}
 </AbsoluteFill>;
};
const Pricing:React.FC<{r:number}>=({r})=>{const n=ease((r-66.5)/1.4);return <AbsoluteFill style={{background:'radial-gradient(at 10% 50%,#ffd6bf,transparent 60%),radial-gradient(at 100% 15%,#e4def7,transparent 70%),#f7f3eb',padding:'330px 76px 0'}}>
 <Label>STANDARD API TOKEN RATES</Label><Title style={{marginTop:38}}>The price<br/><span style={{color:rust}}>drops 20%</span></Title>
 <Card style={{marginTop:65}}><div style={{display:'flex',justifyContent:'space-between',fontSize:28,fontWeight:750,marginBottom:40}}><span>ANTHROPIC</span><span>Fable 5.1 → 5.2</span></div><div style={{display:'flex',gap:28}}>{[{old:10,next:8,label:'INPUT'},{old:50,next:40,label:'OUTPUT'}].map(v=><div key={v.label} style={{flex:1,textAlign:'center'}}><Label>{v.label}</Label><div style={{fontSize:39,color:'#99877c',textDecoration:n>0?'line-through':'none',marginTop:25}}>${v.old}</div><div style={{fontSize:107,fontWeight:800,color:rust,marginTop:10}}>${Math.round(v.old+(v.next-v.old)*n)}</div></div>)}</div><div style={{marginTop:35,textAlign:'center'}}><Label>per million tokens</Label></div></Card>
 <div style={{marginTop:36,fontSize:29,lineHeight:1.5,color:'#716158'}}>Fast mode costs extra.<br/>Subscription usage limits still apply.</div>
 </AbsoluteFill>;};

export const Fable:React.FC<FableProps>=(p)=>{
 const t=useCurrentFrame()/30,r=visualClock(p,clock(p,t));const s=p.segments.find(s=>t>=s.start&&t<s.end);
 const full=(r>=4.7&&r<6)||(r>=8.7&&r<10)||(r>=36&&r<37)||(r>=48&&r<49)||(r>=72&&r<74)||(r>=78&&r<79)||(r>=92.7&&r<93.4666667)||(r>=94.2333333&&r<95)||r>=105.3;
 const dark=r<49||r>=72;
 return <AbsoluteFill style={{background:dark?'#0d1019':cream,color:ink,fontFamily:'Inter',overflow:'hidden'}}>
 <Presenter p={p} full={full}/>
 {r<4.7&&<><div style={{position:'absolute',top:0,left:0,right:0,height:880,background:'#c9b992'}}><Clip name="launch" at={r/4.7*1.8} duration={1.8}/><div style={{position:'absolute',inset:0,background:'linear-gradient(#090c1766,transparent 45%,#090c17bb)'}}/></div><div style={{position:'absolute',left:76,right:150,top:330,color:'white'}}><Title>Fable 5.2</Title><div style={{fontSize:43,marginTop:24,fontWeight:600}}>The demos are wild</div></div></>}
 {(r>=4.7&&r<6||r>=8.7&&r<10)&&<div style={{position:'absolute',left:76,right:150,top:360,background:'#113bdce8',padding:35,borderRadius:25,color:'white'}}><Title style={{fontSize:67}}>{r<6?'Worth the hype?':'Let’s break it down'}</Title></div>}
 {r>=6&&r<8.7&&<><AbsoluteFill style={{background:blue}}/><div style={{position:'absolute',left:0,right:0,top:270,height:970}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:22,padding:40}}>{["project-a","project-b","project-c","dot-day"].map((name,i)=><div key={name} style={{height:390,overflow:"hidden",borderRadius:24,transform:`translateY(${(1-ease((r-6-i*.12)/.6))*65}px)`}}><Clip name={name} at={(r-6)%0.8} duration={name==="dot-day"?1.9:.9}/></div>)}</div></div><div style={{position:'absolute',left:76,top:1210,color:'white',fontSize:50,fontWeight:800}}>And the cost?</div></>}
 {r>=10&&r<12&&<Chapter number="1" name="Use cases" progress={(r-10)/.5}/>}
 {r>=12&&r<24&&<Demo name={r<17?'dot':r<21?'dot-day':'dot-night'} at={r<17?(r-12)/5*1.8:r<21?(r-17)/4*1.9:r-21} duration={r<17?1.8:r<21?1.9:2.6} title={r<17?'A dot becomes a story':r<21?'An animated short':'Motion, colour and music'} credit="Creator demo · Tak / @cherry_mx_reds" note="Demonstration excerpt · Not our test"/>}
 {r>=24&&r<36&&<Demo name={r<30?'history':'future'} at={r<30?(r-24)/6*3.7:r-30} duration={r<30?3.7:5.2} title={r<30?'Human progress, visualized':'An imagined future'} credit="Creator demo · @imjustnewati" note={r<30?'From early inventions to modern life':'SPECULATIVE FICTION · Not a prediction'}/>}
 {r>=36&&r<37&&<div style={{position:'absolute',left:76,top:380,color:'white',fontSize:65,fontWeight:800}}>A self-portrait…</div>}
 {r>=37&&r<48&&<Demo name={r<42?'pattern-intro':'pattern'} at={r<42?(r-37)/5*2.6:(r-42)/6*4.7} duration={r<42?2.6:4.7} title={r<42?'A self-portrait in code':'A moving pattern'} credit="Creator demo · VOID / @SolidStateKate" split={s?.camera} note="An example, not a one-prompt guarantee"/>}
 {r>=48&&r<49&&<div style={{position:'absolute',left:76,top:370,fontSize:65,fontWeight:800,color:'white'}}>What actually changed?</div>}
 {r>=49&&r<60.7&&<Official r={r}/>}
 {r>=60.7&&r<62.3&&<Chapter number="2" name="Pricing" progress={(r-60.7)/.5}/>}
 {r>=62.3&&r<72&&<Pricing r={r}/>}
 {p.timingSource==='preflight'&&r>=72&&r<74&&<div style={{position:'absolute',left:76,right:150,top:360,color:'white',background:'#111b',padding:35,borderRadius:20}}><Title style={{fontSize:67}}>Now, build<br/>something</Title></div>}
 {r>=74&&r<75.5&&<Chapter number="3" name="Build" progress={(r-74)/.5}/>}
 {r>=75.5&&r<78&&<Demo name={r<76.3?'project-a':r<77.1?'project-b':'project-c'} at={(r-75.5)%0.8} duration={.9} title="Start with a concrete scene" credit="Demonstrations · Sanjar Nai-Chien reference" split/>}
 {p.timingSource==='preflight'&&r>=78&&r<79&&<div style={{position:'absolute',left:76,top:380,fontSize:65,fontWeight:800,color:'white'}}>The useful part?</div>}
 {r>=79&&r<84&&<div style={{position:'absolute',left:76,right:76,top:330}}><Label dark>SOURCE DEMO · SANJAR NAI-CHIEN</Label><Title style={{color:'white',fontSize:58,marginTop:30}}>A precise scene brief</Title><Card style={{marginTop:40,background:'#24211f',color:'#eee6dd',borderColor:'#51463d'}}><div style={{fontSize:42,lineHeight:1.35}}>Build an interactive<br/><span style={{color:'#f6b18b'}}>cyberpunk Tokyo street</span></div><div style={{display:'flex',gap:13,marginTop:30}}>{['Scene','Camera','Sound'].map(x=><div key={x} style={{fontSize:25,border:'1px solid #65564d',padding:'10px 18px',borderRadius:15}}>{x}</div>)}</div></Card><div style={{marginTop:20}}><Label dark>Recreated prompt card · Reference demonstration</Label></div></div>}
 {r>=84&&r<92.7&&<Demo name={r<88?'cyber-a':'cyber-b'} at={r<88?(r-84)/4*2.7:r-88} duration={r<88?2.7:4.7} title={r<88?'Neon, lighting and motion':'Inspect the result'} credit="Creator demonstration · Sanjar Nai-Chien" split={s?.camera} note="Review the actual output"/>}
 {r>=92.7&&r<95&&(()=>{const phase=Math.min(2,Math.floor((r-92.7)/2.3*3));const cards=[{title:'Scene + setting',lines:['Define the subject','Set the mood and place']},{title:'Camera + interaction',lines:['Describe the movement','Define what the viewer controls']},{title:'Output + review',lines:['Specify the format','Inspect what it produces']}];const card=cards[phase];return <div style={{position:'absolute',left:76,right:150,top:340,background:'#143ce8f2',color:'white',padding:36,borderRadius:25}}><Label dark>THE BRIEF · {phase+1} OF 3</Label><Title style={{fontSize:59,marginTop:25}}>{card.title}</Title><div style={{marginTop:30,fontSize:33,lineHeight:1.5}}>{card.lines.map(line=><div key={line}>✓ {line}</div>)}</div></div>;})()}

 {r>=95&&r<99&&<div style={{position:'absolute',left:76,right:150,top:330,color:'white'}}><Label dark>A CLEAR BRIEF BEATS GUESSWORK</Label><Title style={{fontSize:67,marginTop:30}}>Give the build<br/>a direction</Title>{['Scene + setting','Camera + interaction','Output + review'].map((x,i)=><div key={x} style={{padding:'28px 30px',marginTop:25,borderRadius:20,background:'#1c263e',fontSize:40,borderLeft:'5px solid #487aff',opacity:ease((r-95-i*.3)/.5)}}>{x}</div>)}</div>}
 {r>=99&&r<105.3&&<div style={{position:'absolute',left:76,right:150,top:330,color:'white'}}><Label dark>WITHHAMMAD · ORIGINAL STARTER</Label><Title style={{fontSize:64,marginTop:30}}>Creative scene<br/>starter skill</Title><div style={{marginTop:45,borderRadius:25,background:'#f7f4ec',padding:35,color:ink}}><div style={{fontSize:30,fontFamily:'monospace',color:rust}}>SKILL.md</div>{['01   Write scene-plan.md','02   Build one small scene','03   Check performance','04   Review and refine'].map((x,i)=><div key={x} style={{fontSize:32,padding:'25px 0',borderBottom:i<3?'1px solid #ddd4c8':undefined,opacity:ease((r-99-i*.18)/.4)}}>{x}</div>)}</div><div style={{marginTop:30,fontSize:29,color:'#ccd6ea'}}>A reusable workflow, not one-click perfection.</div></div>}
 {r>=105.3&&<><AbsoluteFill style={{background:'linear-gradient(transparent 35%,#000b)'}}/><div style={{position:'absolute',left:76,right:150,top:1130,background:blue,borderRadius:25,padding:35,color:'white'}}><div style={{fontSize:33,marginBottom:10}}>Get the starter skill</div><Title style={{fontSize:65}}>Comment FABLE</Title></div></>}
 <div style={{position:'absolute',left:76,top:235,fontSize:22,letterSpacing:4,fontWeight:800,color:dark?'#fff':'#675a50',opacity:.8}}>WITHHAMMAD</div>
 <Captions p={p}/>
 </AbsoluteFill>;
};
