from pathlib import Path
import sys,json,subprocess,shutil
r=Path(__file__).resolve().parents[2];sys.path.insert(0,str(r/'studio'));from app import audio,reel
j=r/'studio/.local/jobs/motion20261020';pub=r/'studio/remotion/public/motion-library';out=Path(__file__).parent;raw=j/'avatar-voice-v3.mp4'
if not raw.exists(): raise SystemExit('Fresh 1.0x owner voice take is not downloaded yet; do not reuse the rejected take.')
chain=('highpass=f=70:poles=2','equalizer=f=180:t=q:w=0.8:g=-2','equalizer=f=2400:t=q:w=1:g=1.5','loudnorm=I=-16:TP=-2:LRA=9')
subprocess.run(['ffmpeg','-y','-v','error','-i',str(raw),'-vn','-af',','.join(chain),'-ar','48000',str(pub/'voice-natural.wav')],check=True)
(j/'new-words.json').write_text(json.dumps(reel.transcribe_words(raw,prompt='Claude. Prompt Motion. MOTION.'),indent=2)+'\n')
shutil.copy2(raw,pub/'avatar-natural.mp4');duration=audio.probe_duration(raw);audio.make_music('glow',duration_s=duration+.2,out_wav=pub/'music.wav')
(out/'reference-render-props.json').write_text(json.dumps({'avatar':'motion-library/avatar-natural.mp4','music':'motion-library/music.wav','duration':duration,'voice':'motion-library/voice-natural.wav','voiceReady':True,'ready':True},indent=2)+'\n')
report={'raw':audio.analyze(raw),'improved':audio.analyze(pub/'voice-natural.wav'),'filters':chain,'speed_change':False,'music_volume':0,'generation_speed':1.0}
(out/'voice-improvement.json').write_text(json.dumps(report,indent=2)+'\n')
subprocess.run(['ffmpeg','-y','-v','error','-i',str(pub/'voice-natural.wav'),'-t','12',str(out/'voice-preview.mp3')],check=True)
print(json.dumps(report,indent=2))
