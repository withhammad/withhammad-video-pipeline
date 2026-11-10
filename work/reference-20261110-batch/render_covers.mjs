// Uses existing GlowCover/GlowWide compositions and default logo styles, without editing shared brand files.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';
const here=path.dirname(fileURLToPath(import.meta.url));const repo=path.resolve(here,'../..');const project=path.join(repo,'studio/remotion');
const req=createRequire(path.join(project,'package.json'));const {bundle}=req('@remotion/bundler');const {getCompositions,selectComposition,renderStill}=req('@remotion/renderer');
const keyword=process.argv[2]||'HIGGS';const job={HIGGS:'ee41d72bf8cd',ADVISOR:'62eec03e1e93'}[keyword];if(!job)throw new Error('Unknown keyword');const out=path.join(repo,'studio/.local/jobs',job,'referral-v4/covers');const pub=path.join(out,'public');fs.mkdirSync(pub,{recursive:true});
for(const name of ['fonts','glow'])fs.cpSync(path.join(project,'public',name),path.join(pub,name),{recursive:true});
fs.copyFileSync(path.join(out,'pose-cutout.png'),path.join(pub,'glow/higgs-current-pose.png'));
const serveUrl=await bundle({entryPoint:path.join(project,'src/brand/index.tsx'),publicDir:pub});const cs=await getCompositions(serveUrl);
const base=cs.find(c=>c.id==='GlowCover-3f33678db749');if(!base)throw new Error('Approved glow template missing');
const src=base.defaultProps.leftLogo.mask.replace(/glow\/[^/]+$/,'glow/higgs-current-pose.png');
const props={...base.defaultProps,line1:keyword==='HIGGS'?'Make AI Videos':'Let Opus Build',line2:keyword==='HIGGS'?'Inside Claude':'Fable Advises',leftLogo:base.defaultProps.leftLogo,rightLogo:{text:keyword==='HIGGS'?'HF':'5.2',color:'#fff',bg:'linear-gradient(160deg,#ef944f,#a44822)',glow:'#FF8A5B'},pose:{src,scale:.72,top:582}};
for(const [prefix,file] of [['GlowCover-','cover.png'],['GlowCoverGuides-','guides.png'],['GlowWide-','wide.png']]){
 const inputProps={...props,guides:prefix==='GlowCoverGuides-'};const c=await selectComposition({serveUrl,id:prefix+'3f33678db749',inputProps});await renderStill({serveUrl,composition:c,output:path.join(out,file),imageFormat:'png',inputProps});console.log(file);
}
fs.writeFileSync(path.join(out,'cover.props.json'),JSON.stringify(props,null,2)+'\n');
