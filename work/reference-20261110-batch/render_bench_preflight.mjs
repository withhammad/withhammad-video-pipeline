// Isolated, silent BENCH visual QA. Run via studio/heavy.sh; never changes approval flags.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const here=path.dirname(fileURLToPath(import.meta.url));const repo=path.resolve(here,'../..');
const project=path.join(repo,'studio/remotion');const job=path.join(repo,'studio/.local/jobs/e25d352a1b20');
const require=createRequire(path.join(project,'package.json'));
const {bundle}=require('@remotion/bundler');const {selectComposition,renderStill,renderMedia}=require('@remotion/renderer');
const recorded=path.join(job,'referral-v4/recorded.props.json');
const input=fs.existsSync(recorded)?recorded:path.join(project,'src/batchnov10/bench.preflight.json');
const props={...JSON.parse(fs.readFileSync(input,'utf8')),draft:true};delete props.voice;
const out=path.join(job,'bench-preflight');fs.mkdirSync(out,{recursive:true});
const publicDir=path.join(out,'render-public');fs.mkdirSync(publicDir,{recursive:true});
if(!fs.existsSync(path.join(publicDir,'fonts')))fs.cpSync(path.join(project,'public/fonts'),path.join(publicDir,'fonts'),{recursive:true});
const serveUrl=await bundle({entryPoint:path.join(project,'src/batchnov10/bench-entry.tsx'),publicDir});
const composition=await selectComposition({serveUrl,id:'BENCH',inputProps:props});
const frames=Math.ceil(props.duration*30);
const word=(i,match,fallback)=>props.words.find(w=>w.startMs>=props.segments[i].start*1000&&w.startMs<props.segments[i].end*1000&&w.text.toLowerCase().replace(/[^a-z]/g,'')===match)?.startMs/1000||fallback;
const samples=props.segments.map((s,i)=>({name:`${String(i).padStart(2,'0')}-segment`,t:s.start+(s.end-s.start)*.65}));
samples.push({name:'03b-coding',t:word(3,'real',props.segments[3].start+2)+2});
samples.push({name:'03a-exam',t:props.segments[3].start+2});
samples.push({name:'04b-science',t:word(4,'scientific',props.segments[4].start+2)+2});
samples.push({name:'04a-computer',t:props.segments[4].start+2});
samples.push({name:'hook-start',t:.6});
samples.push({name:'caption-longest',t:7.1});
samples.push({name:'final-cta',t:props.duration-.02});
for(const sample of samples)await renderStill({serveUrl,composition,inputProps:props,output:path.join(out,`${sample.name}.jpg`),imageFormat:'jpeg',frame:Math.min(frames-1,Math.round(sample.t*30))});
await renderStill({serveUrl,composition:{...composition,durationInFrames:frames+4},inputProps:props,output:path.join(out,'after-narration-cta.jpg'),imageFormat:'jpeg',frame:frames+2});
fs.writeFileSync(path.join(out,'samples.json'),JSON.stringify({input,timingSource:props.timingSource,duration:props.duration,frames,samples,silent:true,draft:true,finalApproved:false},null,2)+'\n');
console.log(`BENCH: ${samples.length} stills; ${frames} frames; ${props.duration}s; ${props.timingSource} timings`);
if(process.argv.includes('--video')){
 await renderMedia({serveUrl,composition,inputProps:props,outputLocation:path.join(out,'BENCH-silent-preflight.mp4'),codec:'h264',pixelFormat:'yuv420p',crf:22,scale:.5,concurrency:2,muted:true,onProgress:({progress})=>{if(Math.floor(progress*100)%20===0)process.stdout.write('.');}});
 console.log('\nSilent visual draft complete (540 × 960).');
}
