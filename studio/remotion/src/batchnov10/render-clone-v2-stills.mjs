// Pilot before/after stills: node render-clone-v2-stills.mjs <outDir> <t1,t2,...>
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill} from '@remotion/renderer';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../../..');
const job=path.join(repo,'studio/.local/jobs/0e375e205e9d/referral-v4');
const out=process.argv[2];fs.mkdirSync(out,{recursive:true});
const times=(process.argv[3]??'3,20,46').split(',').map(Number);
const p=JSON.parse(fs.readFileSync(path.join(job,'final-render.props.json'),'utf8'));
const serveUrl=await bundle({entryPoint:path.join(here,'clone-v2-entry.tsx'),publicDir:path.join(job,'render-public')});
for(const id of ['CLONE','CLONE2']){const c=await selectComposition({serveUrl,id,inputProps:p});
 for(const t of times){await renderStill({serveUrl,composition:c,output:path.join(out,`${id}_${t}.jpg`),imageFormat:'jpeg',frame:Math.round(t*30),inputProps:p});console.log(id,t);}}
