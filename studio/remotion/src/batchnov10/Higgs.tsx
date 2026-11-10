import React from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import type {BatchProps} from './types';
import {Brand,Captions,ease,GuideCard,Media,Presenter,referenceClock} from './shared';

const orange='#ef944f';
export const Higgs:React.FC<BatchProps>=(p)=>{
  const f=useCurrentFrame();const t=f/30;const r=referenceClock(p,t);
  const seg=p.segments.find(s=>t>=s.start&&t<s.end);
  const end=r>=30.7;
  return <AbsoluteFill style={{background:'#111214',color:'#faf6ef',fontFamily:'Inter',overflow:'hidden'}}>
    {seg?.camera&&<Presenter p={p} style={end?{inset:0}:{left:0,right:0,top:850,height:1070}}/>}
    {r<5.4&&<>
      <div style={{position:'absolute',inset:'0 0 auto 0',height:860,overflow:'hidden',background:'#c7ad90'}}>
        <Media job={p.job} name="launch" at={r} length={2.6} style={{position:'absolute',left:0,top:330,height:530,objectFit:'cover'}}/>
        <div style={{position:'absolute',left:76,top:290,background:orange,padding:'10px 18px',borderRadius:20,color:'#2a2019',fontSize:28,fontWeight:800}}>JUST LAUNCHED</div>
        <div style={{position:'absolute',left:80,top:775,fontSize:38}}>Video inside Claude</div>
      </div>
    </>}
    {r>=5.4&&r<10.8&&<div style={{position:'absolute',left:76,right:76,top:430}}>
      <div style={{fontSize:46,color:orange,fontWeight:800,marginBottom:55}}>HIGGSFIELD × CLAUDE</div>
      <div style={{fontSize:104,lineHeight:1.04,fontWeight:800}}>A launch<br/>offer worth<br/><span style={{color:orange}}>checking</span></div>
      <div style={{marginTop:70,display:'flex',alignItems:'center',gap:35,fontSize:38}}>
        <div style={{height:76,width:150,borderRadius:50,background:orange,padding:8}}><div style={{width:60,height:60,borderRadius:'50%',background:'#fff',transform:`translateX(${ease((r-5.4)/.5)*74}px)`}}/></div> New users
      </div>
      <div style={{marginTop:45,fontSize:35,lineHeight:1.45,color:'#c6c5c2'}}>Check eligible models<br/>and current terms</div>
    </div>}
    {r>=10.8&&r<14.7&&<>
      <div style={{position:'absolute',left:72,right:72,top:370,height:seg?.camera?470:850,borderRadius:24,overflow:'hidden',boxShadow:'0 20px 90px #000'}}><Media job={p.job} name="prompt" at={(r-10.8)*.5} length={1.5} style={{objectFit:'contain',background:'#fff'}}/></div>
      <div style={{position:'absolute',left:76,top:seg?.camera?770:1280,fontSize:42,color:orange}}>Describe the shot</div>
    </>}
    {r>=14.7&&r<16.8&&<div style={{position:'absolute',left:170,top:540,width:650,height:650,display:'grid',placeItems:'center'}}>
      <svg width="650" height="650" viewBox="0 0 650 650"><circle cx="325" cy="325" r="270" fill="none" stroke="#35312b" strokeWidth="16"/><circle cx="325" cy="325" r="270" fill="none" stroke={orange} strokeWidth="16" strokeLinecap="round" strokeDasharray={1696} strokeDashoffset={1696*(1-ease((r-14.7)/2.1))} transform="rotate(-90 325 325)"/></svg>
      <div style={{position:'absolute',fontSize:70,fontWeight:800,textAlign:'center'}}>CONNECT<br/><span style={{fontSize:44,color:orange}}>ONCE</span></div>
    </div>}
    {r>=16.8&&r<20.9&&<>
      <div style={{position:'absolute',left:90,top:340,fontSize:62,fontWeight:800}}>Add the connector</div>
      <div style={{position:'absolute',left:90,right:90,top:490,height:700,borderRadius:30,overflow:'hidden',border:'1px solid #444'}}><Media job={p.job} name="settings" at={r-16.8} length={3.7} style={{objectFit:'contain'}}/></div>
      <div style={{position:'absolute',left:100,right:150,top:1250,padding:18,background:orange,borderRadius:35,color:'#17120d',fontSize:35,fontWeight:800,textAlign:'center'}}>Settings → Connectors → Higgsfield</div>
    </>}
    {r>=20.9&&r<26&&<>
      <div style={{position:'absolute',left:0,right:0,top:seg?.camera?220:400,height:seg?.camera?640:900,overflow:'hidden'}}>
        <Media job={p.job} name={r<23?'blueprint':'aircraft'} at={r<23?r-20.9:r-23} length={r<23?.9:2.7}/>
      </div>
      <div style={{position:'absolute',left:76,top:seg?.camera?800:1330,fontSize:40,color:orange,fontWeight:800}}>Prompt → image → video</div>
    </>}
    {r>=26&&r<30.7&&<div style={{position:'absolute',left:76,right:76,top:440}}>
      <div style={{fontSize:98,fontWeight:800,lineHeight:1.05}}>Check before<br/><span style={{color:orange}}>you generate</span></div>
      {['Eligible models','Your offer’s end date','Credit cost'].map((label,i)=><div key={label} style={{marginTop:42,background:'#202226',border:'1px solid #404044',padding:28,borderRadius:20,fontSize:40,opacity:ease((r-26-i*.3)/.5),transform:`translateY(${(1-ease((r-26-i*.3)/.5))*30}px)`}}>✓ {label}</div>)}
    </div>}
    {end&&<><div style={{position:'absolute',inset:0,background:'linear-gradient(transparent 45%,#000b 100%)'}}/><div style={{position:'absolute',left:76,right:150,top:1300}}><GuideCard keyword={p.keyword} accent={orange}/></div></>}
    <Brand dark/>
    <Captions p={p} y={end?1140:1390} dark/>
  </AbsoluteFill>;
};
