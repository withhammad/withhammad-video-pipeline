"""Reuse the existing edit and presenter assets with the approved corrected audio."""
import json, shutil, sys, subprocess, re, math
from pathlib import Path
import numpy as np
R=Path('/Users/hammad/withhammad-video-pipeline');sys.path.insert(0,str(R/'studio'))
from app import audio
J=R/'studio/.local/jobs/dfa218634321';V=J/'v4-revision';S=R/'studio/remotion/src/fiverepos-v4';P=R/'studio/remotion/public/fiverepos-v4'
S.mkdir(exist_ok=True);P.mkdir(exist_ok=True)
retime=json.loads((V/'retime.json').read_text());duration=retime['durationSeconds'];n=round(duration*48000)
for file in ['captions.json','retime.json']:shutil.copyfile(V/file,S/file)
shutil.copyfile(R/'studio/remotion/src/fiverepos/avatar-map.json',S/'avatar-map.json')
src=(R/'studio/remotion/src/fiverepos/reel.tsx').read_text()
src=src.replace("import avatarMap from './avatar-map.json';","import avatarMap from './avatar-map.json';\nimport retime from './retime.json';")
src=src.replace('const captions = rawCaptions as Caption[];', '''const captions = rawCaptions as Caption[];
const oldTime = (seconds: number) => {
  const points = retime.anchors;
  let i = 0;
  while (i < points.length - 2 && points[i + 1][0] < seconds) i++;
  const a = points[i], b = points[i + 1];
  return a[1] + clamp((seconds - a[0]) / Math.max(.001, b[0] - a[0]), 0, 1) * (b[1] - a[1]);
};''')
src=src.replace('// All boundaries are on the edited ElevenLabs take, not a new synthesised track.',
                '// Existing reference edit clock; speech-aligned mapping retimes it to the approved REFERRAL v4 take.')
src=src.replace('w.startMs / 1000 >= x.at && w.startMs / 1000 < x.end','oldTime(w.startMs / 1000) >= x.at && oldTime(w.startMs / 1000) < x.end')
src=src.replace('page[0].startMs / 1000 >= x.at && page[0].startMs / 1000 < x.end','oldTime(page[0].startMs / 1000) >= x.at && oldTime(page[0].startMs / 1000) < x.end')
src=src.replace('ms >= 45400','ms >= retime.ctaStart * 1000').replace('?? 49000','?? retime.durationSeconds * 1000')
src=src.replace('const t = useCurrentFrame() / 30;', 'const t = oldTime(useCurrentFrame() / 30);')
presenter='''  const frame = useCurrentFrame();
  const t = retime.pictureOldSeconds[Math.min(frame, retime.pictureOldSeconds.length - 1)];'''
src=src.replace("const Presenter: React.FC<{full?: boolean; hold?: number}> = ({full, hold}) => {\n  const t = oldTime(useCurrentFrame() / 30);", "const Presenter: React.FC<{full?: boolean; hold?: number}> = ({full, hold}) => {\n"+presenter)
src=src.replace("<Audio src={asset(linkedin ? 'mix-linkedin.wav' : 'mix.wav')}/>","<Audio src={staticFile(`fiverepos-v4/${linkedin ? 'mix-linkedin.wav' : 'mix.wav'}`)}/>")
src=src.replace('export const FiveRepos:', 'export const FiveReposV4:')
(S/'reel.tsx').write_text(src)
(S/'index.tsx').write_text('''import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {FiveReposV4} from './reel';
import retime from './retime.json';
registerRoot(() => <>
  <Composition id="FiveReposV4" component={FiveReposV4} durationInFrames={retime.durationFrames} fps={30} width={1080} height={1920}/>
  <Composition id="FiveReposV4LinkedIn" component={FiveReposV4} defaultProps={{linkedin: true}} durationInFrames={retime.durationFrames} fps={30} width={1080} height={1920}/>
</>);
''')
voice=audio.decode(V/'voice.wav');voice=np.pad(voice,((0,max(0,n-len(voice))),(0,0)))[:n]
bed=audio.decode(J/'music-bed.wav')[:n];assert len(bed)==n
audio.write_wav(V/'music-bed.wav',bed)
report={'music':'Reuse original 112bpm seed29 composition; constant bed to final frame','voice_processing':'Original v4 pace and pitch; silent-pause trims, static gain and measured 1.5dB sibilance correction','linkedin_voice_end_s':retime['ctaStart']}
for name,target in [('mix',-14),('mix-linkedin',-12)]:
    v=voice.copy()
    if name.endswith('linkedin'):v[round(retime['ctaStart']*48000):]=0
    source=V/f'{name}-unmastered.wav';audio.write_wav(source,v+bed)
    first=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',str(source),'-af',f'loudnorm=I={target}:TP=-1.8:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
    m=audio._loudnorm_json(first.stderr)
    filt=f"loudnorm=I={target}:TP=-1.8:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(source),'-af',filt,'-ar','48000','-c:a','pcm_s24le',str(V/f'{name}.wav')],check=True)
    shutil.copyfile(V/f'{name}.wav',P/f'{name}.wav');report[name]=audio._ebur128(str(V/f'{name}.wav'))
(V/'mix-report.json').write_text(json.dumps(report,indent=2)+'\n')
render=(R/'work/reference-DfeW3F8PIsk/render.mjs').read_text().replace('/src/fiverepos/index.tsx','/src/fiverepos-v4/index.tsx').replace("'FiveRepos'","'FiveReposV4'").replace("'FiveReposLinkedIn'","'FiveReposV4LinkedIn'").replace("/studio/.local/jobs/dfa218634321/'+file","/studio/.local/jobs/dfa218634321/v4-revision/'+file")
(V/'render.mjs').write_text(render)
print(json.dumps({'duration':duration,'frames':retime['durationFrames'],'mix':report},indent=2))
