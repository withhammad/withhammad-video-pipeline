import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {getCompositions,renderStill} from '@remotion/renderer';

const here=path.dirname(fileURLToPath(import.meta.url));
const project=path.resolve(here,'../..');
const repo=path.resolve(project,'../..');
const out=path.join(repo,'work/reference-20261110-batch/preflight');
const pub=path.join(out,'public');
fs.mkdirSync(pub,{recursive:true});
for(const p of ['batchnov10','fonts'])fs.cpSync(path.join(project,'public',p),path.join(pub,p),{recursive:true});
const serveUrl=await bundle({entryPoint:path.join(here,'index.tsx'),publicDir:pub});
const comps=await getCompositions(serveUrl);
for(const c of comps){
  const p=c.defaultProps;
  const seconds=process.argv.includes('--crop-fixes')?(p.keyword==='HIGGS'?[18.8,23.8]:[27]):
    p.keyword==='HIGGS'?[.5,4,7,11.4,13,15.6,18.8,21.3,23.8,27.6,32]:[1,6.8,10.8,14,16.8,20.5,24,27,32,37,40.5];
  fs.mkdirSync(path.join(out,c.id),{recursive:true});
  for(const r of seconds){
    const s=p.segments.find(s=>r>=s.ref[0]&&r<s.ref[1])??p.segments[p.segments.length-1];
    const t=s.start+(r-s.ref[0])/(s.ref[1]-s.ref[0])*(s.end-s.start);
    const file=path.join(out,c.id,`${r.toFixed(1).padStart(5,'0')}.jpg`);
    await renderStill({serveUrl,composition:c,output:file,imageFormat:'jpeg',frame:Math.round(t*30),inputProps:p});
  }
  console.log(c.id,seconds.length,'labelled internal layout frames rendered');
}
