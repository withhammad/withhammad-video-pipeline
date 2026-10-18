"""Normalize each measured segment, preserving its original playback speed."""
import json,subprocess,wave
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];OUT=Path(__file__).resolve().parent;JOB=ROOT/'studio/.local/claude-edit-final';A=JOB/'audio-master';A.mkdir(exist_ok=True)
p=json.loads((OUT/'full-props.json').read_text());files=[]
for i,c in enumerate(p['clips']):
 source=JOB/c.get('audio',c['source']);start=c.get('audioTrim',c['trim'])/30;duration=c['frames']/30;dest=A/f'{i:02}.wav'
 args=['ffmpeg','-y','-v','error','-ss',str(start),'-i',str(source),'-t',str(duration),'-vn','-af',f'loudnorm=I=-17:TP=-1.5:LRA=11,apad,atrim=duration={duration}','-ar','48000','-ac','2',str(dest)]
 subprocess.run(args,check=True)
 with wave.open(str(dest),'rb') as w: params=w.getparams();data=w.readframes(w.getnframes())
 size=round(duration*params.framerate)*params.nchannels*params.sampwidth
 data=data[:size]+b'\x00'*max(0,size-len(data))
 with wave.open(str(dest),'wb') as w: w.setparams(params);w.writeframes(data)
 files.append(dest);print('Level matched:',c['title'],flush=True)
concat=A/'concat.txt';concat.write_text('\n'.join("file '"+str(x)+"'" for x in files))
subprocess.run(['ffmpeg','-y','-v','error','-f','concat','-safe','0','-i',str(concat),'-c:a','pcm_s24le',str(JOB/'matched-audio.wav')],check=True)
print('Matched audio ready',flush=True)
# This is an existing original procedural bed from app.audio.make_music, not a reference-song rip.
music=ROOT/'studio/.local/jobs/09a9d211fff0/audio/music_lofi.wav'
subprocess.run(['ffmpeg','-y','-v','error','-stream_loop','-1','-i',str(music),'-t',str(p['frames']/30),'-af','loudnorm=I=-36:TP=-9:LRA=7,lowpass=f=5000,afade=t=in:d=3,afade=t=out:st=248:d=3.333','-ar','48000','-ac','2',str(JOB/'quiet-music.wav')],check=True)
subprocess.run(['ffmpeg','-y','-v','error','-i',str(JOB/'matched-audio.wav'),'-i',str(JOB/'quiet-music.wav'),'-filter_complex','[0:a][1:a]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.84:level=0:latency=1[a]','-map','[a]','-c:a','pcm_s24le',str(JOB/'final-audio.wav')],check=True)
print('Final audio with quiet original music ready',flush=True)
