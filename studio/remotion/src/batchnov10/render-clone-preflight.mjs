import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill,renderMedia} from '@remotion/renderer';
const here=path.dirname(fileURLToPath(import.meta.url)),project=path.resolve(here,'../..'),repo=path.resolve(project,'../..');
const out=path.join(repo,'work/reference-20261110-batch/clone-preflight');
const pub=path.join(out,'public');fs.mkdirSync(pub,{recursive:true});
fs.cpSync(path.join(project,'public/batchnov10/0e375e205e9d'),path.join(pub,'batchnov10/0e375e205e9d'),{recursive:true});
fs.cpSync(path.join(project,'public/fonts'),path.join(pub,'fonts'),{recursive:true});
const arg=process.argv.slice(2).find(x=>!x.startsWith('--'));
const original=JSON.parse(fs.readFileSync(arg??path.join(here,'clone.preflight.json'),'utf8'));
const p={...original,draft:true};
for(const asset of [p.voice,p.avatar,p.referenceImage])if(asset){const target=path.join(pub,asset);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(project,'public',asset),target);}
const serveUrl=await bundle({entryPoint:path.join(here,'clone-entry.tsx'),publicDir:pub});
const c=await selectComposition({serveUrl,id:'CLONE',inputProps:p});
const seconds=[0,2,4.5,7,9,12,15,17,19,22,24,26,28,30,32.2,33.8,35.5,37.5,41,45,49,52,54.7];
for(const r of seconds){const s=p.segments.find(x=>r>=x.ref[0]&&r<x.ref[1])??p.segments[p.segments.length-1];const t=s.start+(r-s.ref[0])/(s.ref[1]-s.ref[0])*(s.end-s.start);await renderStill({serveUrl,composition:c,output:path.join(out,`${r.toFixed(1).padStart(5,'0')}.jpg`),imageFormat:'jpeg',frame:Math.min(c.durationInFrames-1,Math.round(t*30)),inputProps:p});console.log('CLONE still',r);}
if(process.argv.includes('--video')){let last=-1;await renderMedia({serveUrl,composition:c,inputProps:p,codec:'h264',outputLocation:path.join(out,'layout-draft.mp4'),scale:.5,crf:22,pixelFormat:'yuv420p',concurrency:2,onProgress:({progress})=>{const now=Math.floor(progress*10);if(now!==last){console.log('CLONE draft',now*10+'%');last=now;}}});
 const result=spawnSync('ffmpeg',['-v','error','-y','-i',path.join(out,'layout-draft.mp4'),'-vf','fps=1,scale=216:384,tile=10x6','-frames:v','1',path.join(out,'contact-sheet.jpg')],{encoding:'utf8'});if(result.status!==0)throw Error(result.stderr);
}
fs.writeFileSync(path.join(out,'review-input.json'),JSON.stringify({kind:'labelled_internal_layout',voice:p.voice?'actual recording; approval not inferred':'pending',avatar:p.avatar?'new take provided; approval not inferred':'pending',timings:p.timingSource,referenceSeconds:seconds,duration:p.duration,packageApproved:false},null,2)+'\n');
