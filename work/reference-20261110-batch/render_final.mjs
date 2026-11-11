// Run through studio/heavy.sh node work/reference-20261110-batch/render_final.mjs HIGGS|ADVISOR|FABLE|BENCH|CLONE [--check] [--replace]
// Requires verified owner voice + verified avatar in recorded.props.json. Never sets approval flags.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
const here=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(here,'../..');const studio=path.join(repo,'studio');const project=path.join(studio,'remotion');
const require=createRequire(path.join(project,'package.json'));
const {bundle}=require('@remotion/bundler');const {selectComposition,renderMedia,renderStill}=require('@remotion/renderer');
const keyword=process.argv[2];
if(!['HIGGS','ADVISOR','FABLE','BENCH','CLONE'].includes(keyword))throw new Error('Usage: render_final.mjs HIGGS|ADVISOR|FABLE|BENCH|CLONE [--check] [--replace]');
const job=JSON.parse(fs.readFileSync(path.join(here,'batch.json'),'utf8')).jobs.find(j=>j.keyword===keyword);
const out=path.join(studio,'.local/jobs',job.job,'referral-v4');
const p=JSON.parse(fs.readFileSync(path.join(out,'recorded.props.json'),'utf8'));
const audioReport=JSON.parse(fs.readFileSync(path.join(out,'audio-mix-report.json'),'utf8'));
const issues=[];
if(['FABLE','BENCH','CLONE'].includes(keyword)){
 const original=fs.readFileSync(path.join(out,'narration_original.mp3'));
 const hash=createHash('sha256').update(original).digest('hex');
 const approvalPath=path.join(out,'owner-voice-approval.json');
 const approval=fs.existsSync(approvalPath)?JSON.parse(fs.readFileSync(approvalPath,'utf8')):{};
 if(!approval.approved||approval.sourceSha256!==hash||audioReport.originalSha256!==hash)issues.push(`Exact ${keyword} narration approval/mix hash mismatch`);
 if(keyword==='BENCH'){
  const d=JSON.parse(fs.readFileSync(path.join(out,'duration-exception.json'),'utf8'));
  if(d.approved!==true||d.sourceSha256!==hash||d.approvedDurationSeconds!==p.duration||!p.durationExceptionApproved||hash!=='429724519a16571fe8701cec16e8670b6bb0c9f4bd6c1aeb67646b6bc71be130'||Math.abs(p.duration-75.2326530612245)>1e-6)issues.push('Exact BENCH voice/length exception mismatch');
  if(p.avatar||p.segments.some(s=>s.camera))issues.push('BENCH must remain faceless');
 }else if(p.duration<job.reference_seconds*.9||p.duration>job.reference_seconds*1.1)issues.push(`${keyword} duration outside reference tolerance`);
}
if(p.timingSource!=='recorded')issues.push('Recorded word timing missing');
if(!p.voiceVerified)issues.push('Owner voice approval missing');
if(keyword!=='BENCH'&&!p.avatarVerified)issues.push('Avatar filmstrip and sync verification missing');
if(keyword!=='BENCH'&&(!p.avatar||!fs.existsSync(path.join(project,'public',p.avatar))))issues.push('Staged avatar media missing');
if(!p.words?.length)issues.push('Caption words missing');
if(!audioReport.wavPass||!audioReport.aacPass||!audioReport.musicContinuityPass)issues.push('Audio validation failed');
for(const [i,w] of (p.words??[]).entries())if(w.startMs<0||w.endMs<=w.startMs||w.endMs>p.duration*1000)issues.push(`Invalid caption ${i}`);
const frames=Math.ceil(p.duration*30);const duration=frames/30;
if(audioReport.renderFrames!==frames)issues.push('Mixed audio and render frame counts differ');
const preflight={keyword,job:job.job,frames,duration,ready:issues.length===0,issues,ownerPackageApproved:false};
fs.writeFileSync(path.join(out,'render-preflight.json'),JSON.stringify(preflight,null,2)+'\n');
console.log(JSON.stringify(preflight,null,2));
if(process.argv.includes('--check'))process.exit(issues.length?2:0);
if(issues.length)throw new Error(issues.join('; '));
const final=path.join(out,'final.mp4');
if(fs.existsSync(final)&&!process.argv.includes('--replace'))throw new Error('final.mp4 exists; use --replace only after reviewing changes');
const pub=path.join(out,'render-public');fs.mkdirSync(path.join(pub,'batchnov10'),{recursive:true});
fs.cpSync(path.join(project,'public/fonts'),path.join(pub,'fonts'),{recursive:true});
fs.cpSync(path.join(project,'public/batchnov10',job.job),path.join(pub,'batchnov10',job.job),{recursive:true});
// Support a verified avatar staged outside this job's public subfolder.
for(const asset of [p.voice,p.avatar])if(asset){const target=path.join(pub,asset);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(project,'public',asset),target);}
const props={...p,draft:false};
fs.writeFileSync(path.join(out,'final-render.props.json'),JSON.stringify(props,null,2)+'\n');
const serveUrl=await bundle({entryPoint:path.join(project,keyword==='CLONE'?'src/batchnov10/clone-entry.tsx':keyword==='BENCH'?'src/batchnov10/bench-entry.tsx':keyword==='FABLE'?'src/batchnov10/fable-entry.tsx':'src/batchnov10/index.tsx'),publicDir:pub});
const composition=await selectComposition({serveUrl,id:keyword,inputProps:props});
if(composition.durationInFrames!==frames||composition.fps!==30)throw new Error('Unexpected composition clock');
if(process.argv.includes('--stills')){
 const qa=path.join(out,'qa');fs.mkdirSync(qa,{recursive:true});
 const refs=keyword==='CLONE'?[0,2,5,9,12,14.5,17,20,22.5,25,29,32,34,36,38,42,45,47,49,51,52,54.8]:keyword==='BENCH'?[0,2,5.5,10,16,20.5,25,30,35,39,42,46,47,48.8,50,54,61,64,66.9]:keyword==='FABLE'?[0,3,5,7.5,10.2,12.7,19,32,38,44,52,59,61.5,68,73.2,76.2,76.7,80.5,86,90,93.1,93.8,94.6,101,107,108.5]:null;
 const samples=refs?refs.map(r=>{const s=p.segments.find(s=>r>=s.ref[0]&&r<s.ref[1])??p.segments[p.segments.length-1];return {r,t:s.start+(r-s.ref[0])/(s.ref[1]-s.ref[0])*(s.end-s.start)};}):[0,2,12,22.4,32].map(t=>({r:null,t}));
 for(const {r,t} of samples)if(t<duration)await renderStill({serveUrl,composition,inputProps:props,output:path.join(qa,r===null?`corrected-${t}.jpg`:`reference-${r}.jpg`),imageFormat:'jpeg',frame:Math.min(frames-1,Math.round(t*30))});
 fs.writeFileSync(path.join(qa,'framing-samples.json'),JSON.stringify(samples,null,2)+'\n');
 console.log('Corrected framing stills rendered');process.exit(0);
}

let last=-1;
const silent=path.join(out,'picture_silent.mp4');
await renderMedia({serveUrl,composition,inputProps:props,codec:'h264',outputLocation:silent,muted:true,pixelFormat:'yuv420p',crf:18,concurrency:2,onProgress:({progress})=>{const now=Math.floor(progress*10);if(now!==last){console.log(`Picture ${now*10}%`);last=now;}}});
function run(cmd,args){const r=spawnSync(cmd,args,{encoding:'utf8',maxBuffer:12*1024*1024});if(r.status!==0)throw new Error(`${cmd}: ${r.stderr||r.stdout}`);return r.stdout;}
run('ffmpeg',['-y','-v','error','-i',silent,'-i',path.join(out,'mix_master.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-bsf:v','h264_metadata=video_full_range_flag=0:colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-c:a','aac','-b:a','192k','-ar','48000','-t',String(duration),'-map_metadata','-1','-movflags','+faststart',final]);
const probe=JSON.parse(run('ffprobe',['-v','error','-show_streams','-show_format','-of','json',final]));
const v=probe.streams.find(s=>s.codec_type==='video');const a=probe.streams.find(s=>s.codec_type==='audio');
const checks={h264:v.codec_name==='h264',portrait:v.width===1080&&v.height===1920,pixelFormat:v.pix_fmt==='yuv420p',limitedRange:v.color_range==='tv',fps:v.r_frame_rate==='30/1',frameCount:Number(v.nb_frames)===frames,duration:Math.abs(Number(probe.format.duration)-duration)<1/30,aac:a.codec_name==='aac',sampleRate:a.sample_rate==='48000'};
const audioResult=spawnSync(path.join(studio,'.venv/bin/python'),[path.join(here,'mix_audio.py'),keyword,'--check-final',final],{cwd:studio,encoding:'utf8',maxBuffer:5*1024*1024});
checks.finalAudio=audioResult.status===0;
const qa=path.join(out,'qa');fs.mkdirSync(qa,{recursive:true});
run('ffmpeg',['-y','-v','error','-i',final,'-vf',`fps=1,scale=216:384,tile=10x${Math.ceil(duration/10)}`,'-frames:v','1',path.join(qa,'contact-sheet.jpg')]);
run('ffmpeg',['-y','-v','error','-i',final,'-t','3','-vf','fps=4,scale=270:480,tile=12x1','-frames:v','1',path.join(qa,'opening.jpg')]);
const report={keyword,file:final,checks,technicalPass:Object.values(checks).every(Boolean),probe,visualReviewComplete:false,subjectiveSoundReviewComplete:false,ownerPackageApproved:false,requiredRemaining:['Inspect full contact sheet and opening','Review safe zones, caption readability and camera sync','Review reference beat match','Owner finished-package approval']};
fs.writeFileSync(path.join(out,'final-technical-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({file:final,checks},null,2));
if(!report.technicalPass)throw new Error('Final technical validation failed; inspect final-technical-validation.json');
