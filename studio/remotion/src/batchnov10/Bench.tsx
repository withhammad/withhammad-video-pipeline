import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';

type Word = {text:string;startMs:number;endMs:number};
type Segment = {start:number;end:number;ref:[number,number];camera:boolean;avatarStart:number};
export type BenchProps = {job:string;keyword:'BENCH';duration:number;draft:boolean;words:Word[];segments:Segment[];voice?:string;timingSource?:string;voiceVerified?:boolean;durationExceptionApproved?:boolean;durationApprovedSeconds?:number;approvedNarrationSha256?:string};
const blue='#4788e9', ink='#17272e', cream='#f1f7f6', gray='#c9d4d8', purple='#7652de';
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const ease=(v:number)=>1-Math.pow(1-clamp(v),3);
const clean=(s:string)=>{const n=s.toLowerCase().replace(/[^a-z0-9]/g,'');const aliases:Record<string,string>={sixtyfive:'65',fortyone:'41',seventysix:'76'};return aliases[n]??n;};
const Panel:React.FC<React.PropsWithChildren<{style?:React.CSSProperties}>>=({children,style})=><div style={{background:'white',border:'2px solid #e5edec',borderRadius:28,boxShadow:'0 22px 55px #173b4510',...style}}>{children}</div>;
const Label:React.FC<React.PropsWithChildren<{color?:string}>>=({children,color=ink})=><div style={{fontSize:30,lineHeight:1.22,fontWeight:650,color}}>{children}</div>;
const Count:React.FC<{value:number;progress:number;color?:string;size?:number}>=({value,progress,color=blue,size=92})=><div style={{fontSize:size,fontWeight:760,letterSpacing:-5,color,fontVariantNumeric:'tabular-nums'}}>{(value*progress).toFixed(1)}<span style={{fontSize:size*.43,letterSpacing:-2}}>%</span></div>;
const Head:React.FC<{title:string;sub:string}>=({title,sub})=><div style={{position:'absolute',top:302,left:78,right:148}}><div style={{fontSize:64,lineHeight:1.08,fontWeight:740,letterSpacing:-2.8}}>{title}</div><div style={{fontSize:30,lineHeight:1.3,color:blue,marginTop:18}}>{sub}</div></div>;
const Source:React.FC<{children?:React.ReactNode}>=({children})=><div style={{position:'absolute',left:80,right:150,top:1260,fontSize:22,lineHeight:1.35,color:'#536970'}}>Anthropic · 9 November 2026<br/>{children??'Reported evaluation results · Not a universal ranking'}</div>;

function phraseTime(p:BenchProps,segment:number,word:string,fallback:number){
 const s=p.segments[segment];
 const wordMatch=p.words.find(w=>w.startMs>=s.start*1000-100&&w.startMs<s.end*1000&&clean(w.text)===clean(word));
 return wordMatch?wordMatch.startMs/1000:fallback;
}
function progressFor(p:BenchProps,t:number,si:number,word:string,delay=.9){
 const s=p.segments[si];const target=phraseTime(p,si,word,s.start+delay);
 return ease((t-Math.max(s.start,target-.8))/Math.max(.12,target-Math.max(s.start,target-.8)));
}
function ChartBars({rows,progress,kind='bars'}:{rows:{name:string;v:number;color:string}[];progress:number;kind?:'bars'|'tasks'|'claw'|'tubes'}){
 return <Panel style={{position:'absolute',left:78,top:535,width:854,height:700,padding:'48px 30px',display:'flex',gap:25,alignItems:'end',justifyContent:'center'}}>
  {rows.map(row=><div key={row.name} style={{width:rows.length===3?242:342,textAlign:'center'}}>
   <Count value={row.v} progress={progress} color={row.color===gray?'#657f8d':row.color} size={rows.length===3?78:100}/>
   <div style={{height:390,position:'relative',marginTop:25,display:'flex',alignItems:'end',justifyContent:'center'}}>
    {kind==='claw'&&<svg style={{position:'absolute',top:-5,left:'50%',transform:`translate(-50%,${(1-progress)*80}px)`}} width="105" height="150"><path d="M52 0 V110 M22 146 V110 H82 V146" stroke={ink} strokeWidth="8" fill="none"/></svg>}
    {kind==='tasks'?<div style={{width:180,display:'flex',flexDirection:'column-reverse',gap:7}}>{Array.from({length:10},(_,i)=><div key={i} style={{height:24,borderRadius:6,border:`2px solid ${row.color}`,background:i<Math.round(row.v*progress/5)?row.color:'#f5f9f9',opacity:i<Math.round(row.v*progress/5)?1:.28,fontSize:17,textAlign:'right',paddingRight:8,color:'white'}}>✓</div>)}</div>:
     kind==='claw'?<div style={{width:190,display:'flex',flexDirection:'column-reverse',gap:7}}>{Array.from({length:14},(_,i)=><div key={i} style={{height:20,borderRadius:5,background:row.color,opacity:i<Math.round(row.v*progress/5)?1:.08}}/>)}</div>:
     kind==='tubes'?<div style={{width:170,height:365,border:`3px solid ${row.color}`,borderRadius:'14px 14px 75px 75px',overflow:'hidden',background:'#f4f8fa',position:'relative'}}><div style={{position:'absolute',bottom:0,width:'100%',height:`${row.v*progress}%`,background:row.color,borderTop:'5px solid #ffffff60'}}/></div>:
     <div style={{width:190,height:365*row.v/100*progress,background:row.color,borderRadius:'14px 14px 0 0'}}/>}
   </div><div style={{height:70,paddingTop:24}}><Label>{row.name}</Label></div>
  </div>)}
 </Panel>;
}

export const Bench:React.FC<BenchProps>=(p)=>{
 const t=useCurrentFrame()/30;
 const found=p.segments.findIndex(s=>t>=s.start&&t<s.end);
 const index=found>=0?found:t>=p.segments[p.segments.length-1].end?p.segments.length-1:0;
 const s=p.segments[index]??p.segments[p.segments.length-1];
 const local=t-s.start;
 const codingAt=phraseTime(p,3,'Real',p.segments[3].start+(p.segments[3].end-p.segments[3].start)*.52);
 const scienceAt=phraseTime(p,4,'Scientific',p.segments[4].start+(p.segments[4].end-p.segments[4].start)*.47);
 const scene=index===3?(t<codingAt?'exam':'coding'):index===4?(t<scienceAt?'computer':'science'):['hook','robotics','work','','','cyber','growth','fermat','fermat','setup','cta'][index];
 const dark=scene==='hook';
 const sceneStart=scene==='coding'?codingAt:scene==='science'?scienceAt:s.start;
 const u=ease((t-sceneStart)/1.05);
 const blueRows=(a:number,b:number,other='GPT-6 Astra')=>[{name:'Fable 5.2',v:a,color:blue},{name:other,v:b,color:gray}];
 const active=p.words.findIndex(w=>t*1000>=w.startMs&&t*1000<w.endMs);
 const ca=Math.floor(active/4)*4;
 return <AbsoluteFill style={{background:dark?'#080c0e':cream,fontFamily:'Inter',color:ink}}>
  <div style={{position:'absolute',left:78,top:225,color:dark?'#bac9ca':'#536970',fontSize:23,fontWeight:780,letterSpacing:4}}>WITHHAMMAD</div>
  <div style={{position:'absolute',right:148,top:225,fontSize:23,color:dark?'#bac9ca':'#536970'}}>THE BENCHMARKS</div>
  {scene==='hook'&&<>
   <div style={{position:'absolute',left:78,right:148,top:330,fontSize:80,fontWeight:720,lineHeight:1.06,letterSpacing:-4,color:'white'}}>More than<br/><span style={{color:'#75a8ff'}}>double.</span></div>
   <div style={{position:'absolute',left:106,top:700,width:700,height:405,border:'1px solid #34434b',borderRadius:35,background:'linear-gradient(140deg,#182631,#0d141a)',opacity:.65,transform:'rotate(-7deg)'}}><div style={{fontSize:48,color:'#9cabb3',padding:55}}>GPT-6 Astra</div></div>
   <Panel style={{position:'absolute',left:183,top:650,width:620,height:480,padding:60,transform:`translateY(${45*(1-ease(local/.9))}px) rotate(${3*(1-ease(local/1.2))}deg) scale(${.88+.12*ease(local/.9)})`}}><div style={{fontSize:95,color:'#cf7555'}}>✳</div><div style={{fontSize:69,letterSpacing:-4,fontWeight:700}}>Fable 5.2</div><div style={{fontSize:30,color:blue,marginTop:32}}>RoboDojo Sim</div><div style={{fontSize:28,color:'#536970',marginTop:12}}>64.9% vs 29.8%</div></Panel>
   <div style={{position:'absolute',left:80,right:148,top:1250,fontSize:29,color:'#b7c5cc'}}>On a specific robotics benchmark.<br/>Anthropic’s reported results.</div>
  </>}
  {scene==='robotics'&&<><Head title="Robotics" sub="RoboDojo Sim · success rate"/><ChartBars rows={blueRows(64.9,29.8)} kind="claw" progress={progressFor(p,t,1,'sixty-five')}/><Source>Each block ≈ 5 percentage points · Exact score above<br/>Internal simulation · Highest available effort</Source></>}
  {scene==='work'&&<><Head title="Remote work tasks" sub="Remote Labor Index · task score"/><ChartBars rows={[{name:'Fable 5.2',v:41.3,color:blue},{name:'Opus 5.5',v:21.3,color:gray},{name:'GPT-6 Astra',v:20.8,color:gray}]} kind="tasks" progress={progressFor(p,t,2,'forty-one')}/><Source>Each block ≈ 5 percentage points · Exact score above<br/>Fable: High effort · Task benchmark, not jobs replaced</Source></>}
  {scene==='exam'&&<>
   <Head title="Humanity’s Last Exam" sub="With tools · 74.2% vs 57.2%"/>
   {blueRows(74.2,57.2).map((row,i)=><Panel key={row.name} style={{position:'absolute',top:575,left:86+i*429,width:400,height:620,padding:38,transform:`rotate(${i===0?-3:3}deg) translateY(${35*(1-u)}px)`}}><Label>{row.name}</Label><div style={{height:260,marginTop:40}}>{Array.from({length:6},(_,n)=><div key={n} style={{height:21,marginBottom:18,borderRadius:3,background:'#e7edef',width:`${85-n%3*13}%`,position:'relative'}}><span style={{position:'absolute',right:-24,top:-8,fontSize:27,color:i===0?blue:'#738891'}}>✓</span></div>)}</div><Count value={row.v} progress={u} color={i===0?blue:'#7b9099'} size={100}/><div style={{fontSize:25,color:'#74848b',marginTop:18}}>Correct answers · with tools</div></Panel>)}<Source>Same evaluation category · Tool-assisted results</Source>
  </>}
  {scene==='coding'&&<><Head title="Real coding projects" sub="FrontierSWE v2"/><Panel style={{position:'absolute',left:78,top:555,width:854,height:630,padding:48}}>{blueRows(69.9,61.2,'Gemini 4 Carbon').map((row,i)=><div key={row.name} style={{marginBottom:58}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><Label>{row.name}</Label><Count value={row.v} progress={u} color={i===0?blue:'#7b9099'} size={75}/></div><div style={{height:58,background:'#edf3f4',borderRadius:13,overflow:'hidden',marginTop:18}}><div style={{height:'100%',width:`${row.v*u}%`,background:row.color,borderRadius:13}}/></div></div>)}<div style={{fontSize:24,color:'#647982'}}>Scale: 0–100% · Selected comparison</div></Panel><Source>GPT-6 Astra scored 65.5%; this chart compares Gemini.</Source></>}
  {scene==='computer'&&<><Head title="Computer use" sub="OSWorld 2.1 · offline partial set"/>{blueRows(89.3,79.5).map((row,i)=><Panel key={row.name} style={{position:'absolute',left:78+i*438,top:565,width:416,height:630,padding:28}}><Label>{row.name}</Label><div style={{display:'grid',gridTemplateColumns:'repeat(10,1fr)',gap:7,marginTop:45}}>{Array.from({length:100},(_,n)=><div key={n} style={{height:27,borderRadius:4,background:n<Math.floor(row.v*u)?(i===0?blue:'#90a8b8'):'#ecf1f2'}}/>)}</div><div style={{marginTop:30}}><Count value={row.v} progress={u} color={i===0?blue:'#718b9b'} size={90}/></div></Panel>)}<Source>Each square ≈ 1 percentage point · Decimal score retained</Source></>}
  {scene==='science'&&<><Head title="Scientific research" sub="Terminal-Bench-Science 0.1"/><ChartBars rows={blueRows(74.6,64.8,'Gemini 4 Carbon')} kind="tubes" progress={u}/><Source>Selected comparison · GPT-6 Astra: 68.1%</Source></>}
  {scene==='cyber'&&<><Head title="Cybersecurity" sub="CyScenarioBench · separately reported scores"/><ChartBars rows={[{name:'Mythos 5.2',v:76.3,color:purple},{name:'GPT-6 Cyber',v:61,color:gray}]} progress={progressFor(p,t,5,'seventy-six')}/><div style={{position:'absolute',left:100,right:170,top:1192,padding:'17px 23px',borderRadius:14,background:'#ede6ff',fontSize:28,fontWeight:750,color:'#6038b5',textAlign:'center'}}>Different tasks for each lab</div><Source>Not a like-for-like comparison. Specific tests do not prove<br/>that one model wins everything.</Source></>}
  {scene==='cyber'&&local>=4&&(()=>{const phase=local<8?1:2;return <Panel style={{position:'absolute',left:120,top:805,width:770,padding:35,background:'#f6f1ff',border:'2px solid #d3c4f7',transform:`translateY(${20*(1-ease((local-(phase===1?4:8))/.35))}px)`}}><div style={{fontSize:45,fontWeight:780,color:purple}}>{phase===1?'Different task sets':'Specific tests'}</div><div style={{fontSize:31,marginTop:18,color:ink}}>{phase===1?'Scores reported separately':'No universal winner'}</div></Panel>;})()}
  {scene==='growth'&&<>
   <Head title="Against the last Fable" sub="5.1 → 5.2 · more than doubled"/>
   <Panel style={{position:'absolute',left:78,top:545,width:854,height:685,padding:25}}><svg viewBox="0 0 800 610" width="800" height="610">
    {[0,20,40,60,80].map(v=><g key={v}><line x1="105" x2="680" y1={490-v*5} y2={490-v*5} stroke="#e5eeee"/><text x="50" y={499-v*5} fontSize="25" fill="#71878f">{v}</text></g>)}
    <text x="78" y="555" fontSize="31" fill={ink}>Fable 5.1</text><text x="565" y="555" fontSize="31" fill={ink}>Fable 5.2</text>
    {[{a:27.6,b:64.9,c:blue,tag:'Robotics · 2.35×'},{a:17.9,b:41.3,c:purple,tag:'Remote work · 2.31×'}].map(row=><g key={row.tag}><path d={`M150 ${490-row.a*5} L${150+460*u} ${490-(row.a+(row.b-row.a)*u)*5}`} stroke={row.c} strokeWidth="7" fill="none"/><circle cx="150" cy={490-row.a*5} r="9" fill={row.c}/><circle cx={150+460*u} cy={490-(row.a+(row.b-row.a)*u)*5} r="11" fill={row.c}/><text x="106" y={470-row.a*5} fill={row.c} fontSize="27">{row.a}</text><text x="625" y={500-row.b*5} fill={row.c} fontSize="32">{row.b}</text><text x="330" y={455-row.b*5} fill={row.c} fontSize="29" fontWeight="700">{row.tag}</text></g>)}
   </svg></Panel><Source>RoboDojo Sim: 27.6 → 64.9 · RLI: 17.9 → 41.3</Source>
  </>}
  {scene==='fermat'&&<>
   <Head title="1,000 agents. One proof." sub="Fermat’s Last Theorem · formalized in Lean"/>
   <Panel style={{position:'absolute',left:78,top:525,width:854,height:715,padding:34}}>
    <div style={{display:'grid',gridTemplateColumns:'repeat(50,1fr)',gap:4,height:155}}>{Array.from({length:1000},(_,i)=><div key={i} style={{borderRadius:2,background:i<1000*ease((t-p.segments[7].start)/1.4)?blue:'#e5eef0'}}/>)}</div>
    <div style={{display:'flex',justifyContent:'space-between',marginTop:23,fontSize:23,color:'#617980'}}><span>1,000 agent nodes</span><span>Single reported run per model</span></div>
    <svg viewBox="0 0 780 380" width="780" height="380" style={{marginTop:20}}>
     {[0,50,100].map(v=><g key={v}><line x1="75" x2="695" y1={305-v*2.3} y2={305-v*2.3} stroke="#dfebed"/><text x="10" y={313-v*2.3} fontSize="25" fill="#71878f">{v}%</text></g>)}
     {[0,10,20,30].map(v=><text key={v} x={65+v*20} y="350" fontSize="25" fill="#71878f">{v}h</text>)}
     <line x1="75" y1="305" x2="675" y2="75" stroke={blue} strokeWidth="4" strokeDasharray="7 9" opacity=".3"/>
     <circle cx="675" cy="75" r={14*ease((t-p.segments[7].start-.8)/.8)} fill={blue}/>
     <text x="350" y="45" fontSize="32" fontWeight="750" fill={blue}>Fable 5.2 · 100%</text>
     <text x="365" y="105" fontSize="28" fill={blue}>30 hours</text>
     <g opacity={index===8?1:.65}><circle cx="435" cy={305-26*2.3} r="12" fill="#8298a5"/><text x="300" y="202" fontSize="30" fontWeight="700" fill="#607985">Opus 5.5 · 26% at 18h</text></g>
    </svg><div style={{fontSize:24,color:'#60777f'}}>Endpoints only · Opus made little later progress</div>
   </Panel><Source>Machine-checkable formalization · Not a new theorem<br/>Dashed line guides the eye; it is not a measured trajectory</Source>
  </>}
  {scene==='fermat'&&index===7&&t>=55.1&&(()=>{const caveat=t>=58.87;return <Panel style={{position:'absolute',left:112,top:550,width:786,height:170,padding:'25px 34px',background:'#edf4ff',border:`2px solid ${blue}`,transform:`translateY(${15*(1-ease((t-(caveat?58.87:55.1))/.3))}px)`}}><div style={{fontSize:48,fontWeight:780,color:blue}}>{caveat?'A known theorem':'30 hours'}</div><div style={{fontSize:29,marginTop:15}}>{caveat?'Formalized, not newly discovered':'A machine-checkable proof'}</div></Panel>;})()}
  {scene==='setup'&&<>
   <Head title="Use it for demanding work" sub="Claude Code · version 2.1.321 or newer"/>
   <Panel style={{position:'absolute',left:78,top:540,width:854,height:640,padding:40}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><Label>Claude Code</Label><span style={{fontSize:21,color:'#768b91'}}>SETUP ILLUSTRATION</span></div>
    <div style={{fontSize:25,color:'#617981',marginTop:36}}>Confirm your selected model</div>
    <div style={{marginTop:15,padding:25,border:`2px solid ${blue}`,background:'#edf4ff',borderRadius:16,fontSize:43,fontWeight:690}}>✳ Fable 5.2 <span style={{float:'right',color:blue}}>✓</span></div>
    <div style={{fontFamily:'monospace',fontSize:33,background:'#182b35',color:'#e5eff7',padding:25,borderRadius:14,marginTop:25}}>/model claude-fable-5-2</div>
    <div style={{fontSize:27,lineHeight:1.45,color:'#526b76',marginTop:25}}>Account and provider access required.<br/>Gateway aliases can resolve differently.</div>
    <div style={{marginTop:27,fontSize:29,fontWeight:720,color:blue}}>Choose → check costs → review</div>
   </Panel><Source>Source: code.claude.com/docs/en/model-config<br/>Illustration of documented controls · Not a live test</Source>
  </>}
  {scene==='cta'&&<>
   <div style={{position:'absolute',left:78,right:148,top:360,fontSize:76,lineHeight:1.06,fontWeight:720,letterSpacing:-3}}>Know what<br/>the numbers mean.</div>
   <Panel style={{position:'absolute',left:78,top:650,width:854,padding:58,transform:`translateY(${25*(1-u)}px)`}}><div style={{fontSize:35,color:'#6a7f86'}}>Benchmarks + setup guide</div><div style={{fontSize:75,fontWeight:760,marginTop:35}}>Comment</div><div style={{display:'inline-block',background:blue,color:'white',fontSize:102,fontWeight:780,padding:'12px 30px',borderRadius:18,marginTop:22,letterSpacing:-3}}>BENCH</div><div style={{fontSize:31,lineHeight:1.5,marginTop:30}}>Exact scores · important caveats<br/>Claude Code setup checklist</div></Panel>
   <div style={{position:'absolute',left:80,top:1230,fontSize:30,color:'#627981'}}>Follow WITHHAMMAD for practical AI.</div>
  </>}
  {active>=0&&<div style={{position:'absolute',left:78,right:148,top:1370,textAlign:'center'}}><div style={{display:'inline-block',maxWidth:854,boxSizing:'border-box',fontSize:38,lineHeight:1.15,fontWeight:780,padding:'13px 24px',borderRadius:20,background:dark?'#1b2933':'white',color:dark?'white':ink,boxShadow:'0 10px 25px #173b4510'}}>{p.words.slice(ca,ca+4).map((w,i)=><React.Fragment key={w.startMs}><span style={{color:ca+i===active?(dark?'#91baff':blue):undefined}}>{w.text}</span>{i<3?' ':''}</React.Fragment>)}</div></div>}
 </AbsoluteFill>;
};
