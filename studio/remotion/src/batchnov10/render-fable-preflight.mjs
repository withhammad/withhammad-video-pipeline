import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill} from '@remotion/renderer';
const here=path.dirname(fileURLToPath(import.meta.url));
const project=path.resolve(here,'../..');
const repo=path.resolve(project,'../..');
const out=path.join(repo,'work/reference-20261110-batch/fable-preflight');
const pub=path.join(out,'public');
fs.mkdirSync(path.join(pub,'batchnov10'),{recursive:true});
fs.cpSync(path.join(project,'public/batchnov10/c5bc128a0a8d'),path.join(pub,'batchnov10/c5bc128a0a8d'),{recursive:true});
fs.cpSync(path.join(project,'public/fonts'),path.join(pub,'fonts'),{recursive:true});
const serveUrl=await bundle({entryPoint:path.join(here,'fable-entry.tsx'),publicDir:pub});
const p=JSON.parse(fs.readFileSync(process.argv[2]??path.join(here,'fable.preflight.json'),'utf8'));
const c=await selectComposition({serveUrl,id:'FABLE',inputProps:p});
const seconds=process.argv.find(x=>x.startsWith('--times='))?.split('=')[1].split(',').map(Number)??[0,3,5,7.5,9,11,14,19,22,27,32,36.5,38,44,48.5,50,52,55,57,59,61.5,64,68,71,73,74.8,76,80.5,86,90,94,97,101,104,107];
for(const r of seconds){
 const seg=p.segments.find(s=>r>=s.ref[0]&&r<s.ref[1])??p.segments[p.segments.length-1];
 const t=seg.start+(r-seg.ref[0])/(seg.ref[1]-seg.ref[0])*(seg.end-seg.start);
 await renderStill({serveUrl,composition:c,output:path.join(out,`${r.toFixed(1).padStart(5,'0')}.jpg`),imageFormat:'jpeg',frame:Math.min(c.durationInFrames-1,Math.round(t*30)),inputProps:p});
 console.log('FABLE',r);
}
fs.writeFileSync(path.join(out,'review-input.json'),JSON.stringify({kind:'layout_preflight',voice:p.voice?'generated; owner approval not inferred':'pending',avatar:p.avatar?'provided; verification not inferred':'pending',timings:p.timingSource,voiceVerified:p.voiceVerified??false,avatarVerified:p.avatarVerified??false,referenceSeconds:seconds},null,2));
