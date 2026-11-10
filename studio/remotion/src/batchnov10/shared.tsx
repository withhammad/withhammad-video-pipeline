import React from 'react';
import {AbsoluteFill, Freeze, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import type {BatchProps} from './types';

export const clamp = (n:number,a=0,b=1)=>Math.min(b,Math.max(a,n));
export const ease = (n:number)=>1-Math.pow(1-clamp(n),3);
export const referenceClock = (props:BatchProps,t:number)=>{
  const s=props.segments.find(s=>t>=s.start&&t<s.end)??props.segments[props.segments.length-1];
  return s.ref[0]+clamp((t-s.start)/(s.end-s.start))*(s.ref[1]-s.ref[0]);
};
export const Media:React.FC<{job:string;name:string;at:number;length:number;style?:React.CSSProperties}>=({job,name,at,length,style})=>(
  <Freeze frame={Math.max(0,Math.min(Math.floor(length*30)-2,Math.floor(at*30)))}>
    <OffthreadVideo src={staticFile(`batchnov10/${job}/${name}.mp4`)} muted style={{width:'100%',height:'100%',objectFit:'cover',...style}} />
  </Freeze>
);
export const Presenter:React.FC<{p:BatchProps;style:React.CSSProperties}>=({p,style})=>{
  const t=useCurrentFrame()/30;
  const s=p.segments.find(s=>t>=s.start&&t<s.end);
  const cameraTime=s&&s.camera?s.avatarStart+(t-s.start):0;
  const split=style?.inset!==0;
  return <div style={{position:'absolute',overflow:'hidden',background:split?(p.keyword==='ADVISOR'?'#767a79':'linear-gradient(120deg,#c7b397,#8d775f)'):undefined,...style}}>
    {p.avatar&&s?.camera?<Freeze frame={Math.round(cameraTime*30)}><OffthreadVideo src={staticFile(p.avatar)} muted style={{width:'100%',height:'100%',objectFit:split?'contain':'cover'}}/></Freeze>:
      <AbsoluteFill style={{background:'linear-gradient(130deg,#c5b39b,#66574d)',alignItems:'center',justifyContent:'center'}}>
        <div style={{width:'70%',fontSize:32,textAlign:'center',color:'#fff',lineHeight:1.5}}>INTERNAL LAYOUT CHECK<br/>Verified presenter take pending</div>
      </AbsoluteFill>}
  </div>;
};
export const Captions:React.FC<{p:BatchProps;y:number;dark?:boolean}>=({p,y,dark=false})=>{
  const ms=useCurrentFrame()/30*1000;
  const index=p.words.findIndex(w=>ms>=w.startMs&&ms<w.endMs);
  if(index<0)return null;
  const a=Math.floor(index/4)*4;
  const words=p.words.slice(a,a+4);
  return <div style={{position:'absolute',left:76,right:150,top:y,display:'flex',justifyContent:'center'}}>
    <div style={{fontSize:43,fontWeight:800,lineHeight:1.2,padding:'13px 23px',maxWidth:850,textAlign:'center',borderRadius:dark?8:28,
      color:dark?'white':'#17242a',background:dark?'rgba(0,0,0,.82)':'white',boxShadow:dark?'none':'0 5px 22px #00000012'}}>
      {words.map((w,i)=><React.Fragment key={w.startMs}><span style={{color:a+i===index?(dark?'#ffa45b':'#0878b7'):undefined}}>{w.text.trim()}</span>{i<words.length-1?' ':''}</React.Fragment>)}
    </div>
  </div>;
};
export const Brand:React.FC<{dark?:boolean}>=({dark=false})=><div style={{position:'absolute',left:76,top:230,fontWeight:800,fontSize:23,letterSpacing:4,color:dark?'#e7ddd0':'#46545f',opacity:.8}}>WITHHAMMAD</div>;
export const DraftFlag:React.FC=()=> <div style={{position:'absolute',left:0,right:0,top:0,padding:18,background:'#aa2828',color:'white',fontSize:29,textAlign:'center',fontWeight:800}}>INTERNAL PREFLIGHT • NOT FOR RELEASE</div>;
export const GuideCard:React.FC<{keyword:string;accent:string;light?:boolean}>=({keyword,accent,light=false})=>(
  <div style={{border:`2px solid ${accent}`,borderRadius:25,background:light?'#fff':'#17191c',padding:'25px 38px',boxShadow:'0 18px 40px #00000015'}}>
    <div style={{fontSize:25,color:light?'#546775':'#c6c9cf',marginBottom:12}}>Your setup guide</div>
    <div style={{fontSize:58,fontWeight:800,color:light?'#13262e':'white'}}>Comment <span style={{color:accent}}>{keyword}</span></div>
  </div>
);
