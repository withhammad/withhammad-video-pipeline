import React from 'react';
import {AbsoluteFill, Img, Still, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
loadFont({family:'Inter',url:staticFile('fonts/inter-latin-800-normal.woff2'),weight:'800'});
type Props={kind:'projects'|'jobsearch'};
const Cover:React.FC<Props>=({kind})=>{const projects=kind==='projects';const accent=projects?'#d3ff57':'#ffbb57';return <AbsoluteFill style={{background:'#101b22',color:'#fff',fontFamily:'Inter',fontWeight:800,padding:80}}>
<div style={{position:'absolute',top:410,fontSize:28,color:'#afbec8',letterSpacing:3}}>WITH HAMMAD · PRACTICAL AI</div>
<div style={{position:'absolute',top:500,left:80,right:80,fontSize:projects?170:115,lineHeight:1,letterSpacing:-7}}>{projects?<><span style={{color:accent}}>85</span><br/>AI PROJECTS</>:<>JOB SEARCH<br/><span style={{color:accent}}>WITH CLAUDE</span></>}</div>
<div style={{position:'absolute',top:projects?1115:940,left:80,width:520,fontSize:40,lineHeight:1.25}}>{projects?'Pick one. Build it. Show your work.':'Research. Shortlist. Review.'}</div>
<Img src={staticFile('approved-covers/olive.jpg')} style={{position:'absolute',left:640,top:1210,width:360,height:203,objectFit:'contain',borderRadius:24,border:'2px solid #52616a'}}/>
<div style={{position:'absolute',left:80,top:1330,fontSize:25,color:accent}}>{projects?'REPO + BUILD CHECKLIST':'SETUP + COPYABLE PROMPT'}</div>
<div style={{position:'absolute',left:80,top:1450,fontSize:27,color:'#afbec8'}}>withhammad.com</div>
<div style={{position:'absolute',right:80,top:1450,fontSize:20,color:'#afbec8'}}>AI avatar</div>
</AbsoluteFill>};
registerRoot(()=> <><Still id="ProjectsCover" component={Cover} width={1080} height={1920} defaultProps={{kind:'projects'}}/><Still id="JobSearchCover" component={Cover} width={1080} height={1920} defaultProps={{kind:'jobsearch'}}/></>);
