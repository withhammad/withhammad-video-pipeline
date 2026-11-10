import React from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import type {BatchProps} from './types';
import {Brand,Captions,clamp,ease,GuideCard,Media,Presenter,referenceClock} from './shared';

const blue='#087cb2';
const Paper:React.FC<React.PropsWithChildren<{style?:React.CSSProperties}>>=({children,style})=><div style={{position:'absolute',borderRadius:24,background:'#fff',boxShadow:'0 14px 45px #30435020',overflow:'hidden',...style}}>{children}</div>;
export const Advisor:React.FC<BatchProps>=(p)=>{
  const t=useCurrentFrame()/30;const r=referenceClock(p,t);
  const seg=p.segments.find(s=>t>=s.start&&t<s.end);
  const full=r>=14.6&&r<19.1;
  return <AbsoluteFill style={{background:'#fbfcfc',fontFamily:'Inter',color:'#15252c'}}>
    {seg?.camera&&<Presenter p={p} style={full?{inset:0}:{left:235,top:1130,width:610,height:640,borderRadius:24,boxShadow:'0 12px 30px #122b3824'}}/>}
    {r<5.8&&<>
      <div style={{position:'absolute',left:76,right:76,top:325,fontSize:61,lineHeight:1.15,fontWeight:800}}><span style={{color:blue}}>Fable 5.2</span><br/>Use it selectively</div>
      <Paper style={{left:60,right:60,top:520,height:440}}><Media job={p.job} name="collage" at={r} length={5.6} style={{objectFit:'contain'}}/></Paper>
    </>}
    {r>=5.8&&r<9.8&&<Paper style={{left:60,right:60,top:330,height:1030}}>
      <Media job={p.job} name={r<7.9?'comparison-a':'comparison-b'} at={r<7.9?r-5.8:r-7.9} length={r<7.9?2:1.6} style={{objectFit:'contain'}}/>
    </Paper>}
    {r>=9.8&&r<14.6&&<>
      <div style={{position:'absolute',left:76,right:76,top:320,fontSize:55,fontWeight:800}}>More quality,<br/><span style={{color:blue}}>more cost</span></div>
      <Paper style={{left:90,right:90,top:540,height:700}}><Media job={p.job} name={r<12.8?'costs':'usage'} at={r<12.8?r-9.8:r-12.8} length={r<12.8?4.7:1.4} style={{objectFit:'contain'}}/></Paper>
    </>}
    {full&&<div style={{position:'absolute',left:76,right:150,top:350,fontSize:66,fontWeight:800,background:'#ffffffee',padding:30,borderRadius:22,boxShadow:'0 16px 40px #0002'}}>
      Opus builds<br/><span style={{color:blue}}>Fable advises</span>
    </div>}
    {r>=19.1&&r<25.4&&<>
      <div style={{position:'absolute',left:76,right:76,top:320,fontSize:52,fontWeight:800}}>{r<22.9?'1. Select Opus':'2. Add Fable advisor'}</div>
      <Paper style={{left:76,right:76,top:455,height:530}}><Media job={p.job} name={r<22.9?'model':'advisor'} at={r<22.9?r-19.1:r-22.9} length={r<22.9?3.5:1.5} style={{objectFit:'contain'}}/></Paper>
      <div style={{position:'absolute',left:100,right:150,top:925,background:'#edf8fd',border:'2px solid #acd2e7',padding:23,borderRadius:18,fontFamily:'monospace',fontSize:43,color:'#075a83'}}>{r<22.9?'/model opus':'/advisor fable'}</div>
    </>}
    {r>=25.4&&r<29.8&&<>
      <div style={{position:'absolute',left:76,top:310,fontSize:48,fontWeight:800}}>Build → consult → review</div>
      <Paper style={{left:60,right:60,top:430,height:1050}}><Media job={p.job} name="comparison-c" at={r-25.4} length={3.7} style={{objectFit:'contain'}}/></Paper>
    </>}
    {r>=29.8&&r<34.9&&<>
      <div style={{position:'absolute',left:76,right:76,top:315,fontSize:52,fontWeight:800}}>Charlie’s seven-build test</div>
      <Paper style={{left:90,right:90,top:450,height:555,padding:35,display:'flex',gap:50,alignItems:'end',justifyContent:'center'}}>
        {[{value:39.29,label:'Fable alone',color:'#dca287'},{value:25.81,label:'Opus + Fable',color:blue}].map((v,i)=>{
          const n=ease((r-29.8-i*.35)/1.1);return <div key={v.label} style={{width:290,textAlign:'center'}}>
            <div style={{fontSize:55,fontWeight:800,marginBottom:18}}>${(v.value*n).toFixed(2)}</div>
            <div style={{height:290*(v.value/39.29)*n,background:v.color,borderRadius:'12px 12px 0 0'}}/>
            <div style={{fontSize:28,marginTop:20,whiteSpace:'nowrap'}}>{v.label}</div>
          </div>;
        })}
      </Paper>
      <div style={{position:'absolute',left:90,top:1015,fontSize:24,color:'#617480'}}>Reported results · Your usage will vary</div>
    </>}
    {r>=34.9&&r<39.5&&<>
      <div style={{position:'absolute',left:76,right:76,top:320,fontSize:50,fontWeight:800}}>Give it a substantial task</div>
      <Paper style={{left:76,right:76,top:455,height:550}}><Media job={p.job} name="advising" at={r-34.9} length={2.6} style={{objectFit:'contain'}}/></Paper>
    </>}
    {r>=39.5&&<>
      <Paper style={{left:76,right:76,top:320,height:470}}><Media job={p.job} name="result" at={clamp(r-39.5,0,.75)} length={.8} style={{objectFit:'contain'}}/></Paper>
      <div style={{position:'absolute',left:76,right:150,top:835}}><GuideCard keyword={p.keyword} accent={blue} light/></div>
    </>}
    {!full&&<Brand/>}
    <Captions p={p} y={full?1380:seg?.camera?1040:1490-70} dark={full}/>
  </AbsoluteFill>;
};
