from pathlib import Path
import sys,json,subprocess,shutil
r=Path(__file__).resolve().parents[2];sys.path.insert(0,str(r/'studio'));from app import audio,reel
j=r/'studio/.local/jobs/motion20261020';pub=r/'studio/remotion/public/motion-library';out=Path(__file__).parent;raw=j/'avatar-reference-raw.mp4'
chain=('highpass=f=95:poles=2','equalizer=f=180:t=q:w=0.7:g=-5','equalizer=f=380:t=q:w=0.8:g=-3','equalizer=f=1600:t=q:w=0.9:g=4','equalizer=f=3200:t=q:w=1:g=3','deesser=i=0.25:m=0.5:f=0.5','acompressor=threshold=0.12:ratio=2:attack=18:release=130:knee=2','loudnorm=I=-16:TP=-2:LRA=7')
subprocess.run(['ffmpeg','-y','-v','error','-i',str(raw),'-vn','-af',','.join(chain),'-ar','48000',str(pub/'voice-natural.wav')],check=True)
shutil.copy2(raw,pub/'avatar-natural.mp4');duration=audio.probe_duration(raw);audio.make_music('glow',duration_s=duration+.2,out_wav=pub/'music.wav')
(out/'reference-render-props.json').write_text(json.dumps({'avatar':'motion-library/avatar-natural.mp4','music':'motion-library/music.wav','duration':duration,'ready':True},indent=2)+'\n')
report={'raw':audio.analyze(raw),'improved':audio.analyze(pub/'voice-natural.wav'),'filters':chain,'speed_change':False,'music_volume':0.025}
(out/'voice-improvement.json').write_text(json.dumps(report,indent=2)+'\n')
subprocess.run(['ffmpeg','-y','-v','error','-i',str(pub/'voice-natural.wav'),'-t','12',str(out/'voice-preview.mp3')],check=True)
print(json.dumps(report,indent=2))
