"""Original instrumental + restrained UI ticks; approved narration never retimed.
Use through studio/heavy.sh. mix_audio.py HIGGS|ADVISOR|FABLE [--check-final VIDEO]
Outputs are confined to the job's referral-v4 directory. No credit/state ledgers are changed.
"""
import argparse, hashlib, json, math, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'studio'))
import numpy as np
from app import audio
SR=48000

def write(p,v):p.write_text(json.dumps(v,indent=2)+'\n')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def measure(p):return audio.analyze(str(p))
def check(stats):return -14.5<=stats['lufs']<=-13.5 and stats['true_peak_dbtp']<=-1.5 and stats['clipped_samples']==0

def main():
 ap=argparse.ArgumentParser();ap.add_argument('keyword',choices=['HIGGS','ADVISOR','FABLE']);ap.add_argument('--check-final',type=Path);args=ap.parse_args()
 batch=json.loads(Path(__file__).with_name('batch.json').read_text());j=next(x for x in batch['jobs'] if x['keyword']==args.keyword)
 out=ROOT/'studio/.local/jobs'/j['job']/'referral-v4';props_path=out/'recorded.props.json';props=json.loads(props_path.read_text())
 if args.check_final:
  stats=measure(args.check_final);report={'file':str(args.check_final),'sha256':sha(args.check_final),'audio':stats,'audioPass':check(stats),'subjectiveListeningPerformed':False}
  write(out/'final-audio-validation.json',report);print(json.dumps(report,indent=2));return 0 if report['audioPass'] else 1
 original=out/'narration_original.mp3';original_hash=sha(original)
 # A mixer must never manufacture owner approval or transfer it to another audio file.
 approval_path=out/'owner-voice-approval.json'
 approval=json.loads(approval_path.read_text()) if approval_path.exists() else {}
 if not props.get('voiceVerified') or approval.get('approved') is not True or approval.get('sourceSha256')!=original_hash:
  raise ValueError('Exact narration owner approval is missing; mixing does not grant approval')
 frames=math.ceil(props['duration']*30);duration=frames/30;n=frames*(SR//30)
 voice=audio.decode(original,sr=SR,channels=2);source_n=len(voice)
 assert source_n<=n
 voice=np.pad(voice,((0,n-source_n),(0,0)))
 t=np.arange(n)/SR
 # One original sustained instrumental: Dmaj9/Gmaj9 colors, no sampled recordings.
 # A static bed level is retained through the final frame. Frequencies avoid the voice's main presence band.
 base=[146.8324,220.0,293.6648,369.9944,440.0]
 if args.keyword=='ADVISOR':base=[130.8128,196.0,261.6256,329.6276,391.9954]
 if args.keyword=='FABLE':base=[164.8138,246.9417,329.6276,391.9954,493.8833]
 bed=np.zeros((n,2),dtype=np.float64)
 for k,hz in enumerate(base):
  amp=[.44,.28,.20,.16,.12][k]
  for ch in range(2):
   phase=.7*k+.3*ch
   bed[:,ch]+=amp*np.sin(2*np.pi*hz*t+phase+.018*np.sin(2*np.pi*.13*t+ch))
 # Gentle octave pulse, no kick/whoosh/pop and no level automation on the voice.
 pulse=(.90+.10*np.sin(2*np.pi*(92/60)*t))[:,None];bed*=pulse
 # Only a 5ms anti-click ramp at the exact file edges, no audible early fade.
 edge=min(240,n//2);bed[:edge]*=np.linspace(0,1,edge)[:,None];bed[-edge:]*=np.linspace(1,0,edge)[:,None]
 original_lufs=measure(original)['lufs']
 audio.write_wav(out/'music_original_unscaled.wav',bed*.06,SR,seed=1111)
 music_before=measure(out/'music_original_unscaled.wav')['lufs'];music_target=original_lufs-12
 music_gain_db=music_target-music_before;bed*=.06*10**(music_gain_db/20)
 audio.write_wav(out/'music_bed.wav',bed,SR,seed=1112)
 def recorded_time(ref):
  s=next(s for s in props['segments'] if s['ref'][0]<=ref<s['ref'][1])
  return s['start']+(ref-s['ref'][0])/(s['ref'][1]-s['ref'][0])*(s['end']-s['start'])
 cue_refs=[(5.4,'Offer toggle'),(16.8,'Connector settings')] if args.keyword=='HIGGS' else [(19.1,'Select Opus'),(22.9,'Enable Fable advisor'),(29.8,'Reported cost comparison')]
 if args.keyword=='FABLE':
  # Fable.visualClock extends chapter 3 to 1.5s and retains three .31s montage shots.
  # Mirror its corrected chapter onset; all other cues use recorded segment mapping.
  build=next(s for s in props['segments'] if s['ref'][0]==72)
  rate=(build['end']-build['start'])/(build['ref'][1]-build['ref'][0])
  chapter3_ref=72+(7*rate-1.5-.93-.3)/rate if 1.5*rate<1.5 else 74
  cue_refs=sorted([(10,'Use cases chapter'),(60.7,'Pricing chapter'),(66.5,'Standard API price reveal'),(chapter3_ref,'Build chapter'),(99,'Starter skill reveal')])
 tick_peak_db=-37 if args.keyword=='FABLE' else -34
 sfx=np.zeros_like(voice);cues=[]
 for i,(ref,purpose) in enumerate(cue_refs):
  at=recorded_time(ref);tick=audio.make_sfx('tick',seed=110+i)
  tick*=10**(tick_peak_db/20)/max(1e-10,float(np.max(np.abs(tick))))
  start=round(at*SR);count=min(len(tick),n-start);sfx[start:start+count]+=tick[:count]
  cues.append({'referenceTime':ref,'recordedTime':at,'kind':'original procedural tick','purpose':purpose,'premasterPeakDbfs':tick_peak_db})
 audio.write_wav(out/'sfx_ticks.wav',sfx,SR,seed=1113)
 audio.write_wav(out/'mix_unmastered.wav',voice+bed+sfx,SR,seed=1114)
 # Two-pass whole-mix loudness/true-peak mastering; source voice remains an unfiltered unity-gain stem.
 mastering=audio.master(out/'mix_unmastered.wav',out/'mix_master.wav',I=-14,TP=-2.0,LRA=11)
 stats=measure(out/'mix_master.wav')
 # Check actual AAC delivery encoding, not only the WAV meter.
 preview=out/'mix_delivery_check.m4a'
 subprocess.run(['ffmpeg','-y','-v','error','-i',str(out/'mix_master.wav'),'-c:a','aac','-b:a','192k','-ar','48000',str(preview)],check=True)
 delivery=measure(preview)
 levels=[]
 for start in range(0,n,SR):
  block=bed[start:min(start+SR,n)];levels.append(20*math.log10(max(1e-12,float(np.sqrt(np.mean(block*block))))))
 med=float(np.median(levels));dropouts=[i for i,x in enumerate(levels) if x<med-3]
 assert sha(original)==original_hash
 report={'keyword':args.keyword,'originalSha256':original_hash,'renderFrames':frames,'renderDuration':duration,'sourceDuration':props['duration'],'paddingSamplesAtEnd':n-source_n,'sampleRate':SR,'narration':{'gainDbBeforeMaster':0,'speed':1,'pitchChanged':False,'pausesRemoved':False,'wordsRemoved':False,'filterApplied':False},'music':{'origin':'New deterministic instrumental synthesized from sine oscillators in mix_audio.py; no samples, external track, model or paid license','frequenciesHz':base,'targetLufsBeforeMaster':music_target,'staticGainDb':music_gain_db,'levelPerSecondDbfs':levels,'secondsBelowMedianMinus3Db':dropouts,'continuesThroughLastFrame':True},'sfx':cues,'mastering':mastering,'wav':stats,'aacDelivery':delivery,'wavPass':check(stats),'aacPass':check(delivery),'musicContinuityPass':not dropouts,'subjectiveListeningPerformed':False,'finalVideoChecked':False}
 write(out/'audio-mix-report.json',report)
 print(json.dumps({k:report[k] for k in ['keyword','renderDuration','wavPass','aacPass','musicContinuityPass','mastering']},indent=2))
 return 0 if report['wavPass'] and report['aacPass'] and report['musicContinuityPass'] else 1
if __name__=='__main__':raise SystemExit(main())
