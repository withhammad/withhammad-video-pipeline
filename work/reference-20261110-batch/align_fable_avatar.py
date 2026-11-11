"""Measure FABLE avatar audio clock; stage only with a recorded visual inspection.
Run through studio/heavy.sh. Does not approve narration or the final package.
"""
import argparse,hashlib,json,subprocess,shutil
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'studio/.local/jobs/c5bc128a0a8d/referral-v4';SR=16000

def decode(path):
 return np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-f','f32le','-ar',str(SR),'-ac','1','-']),dtype=np.float32).astype(np.float64)
def compare(x,y):
 x=x-x.mean();y=y-y.mean();size=len(y)+len(x)-1;nfft=1<<(size-1).bit_length();c=np.fft.irfft(np.fft.rfft(y,nfft)*np.fft.rfft(x[::-1],nfft),nfft)[:size];lags=np.arange(1-len(x),len(y));mask=np.abs(lags)<=SR//2;lag=int(lags[mask][np.argmax(c[mask])]);a=max(0,-lag);b=max(0,lag);n=min(len(x)-a,len(y)-b);xx=x[a:a+n];yy=y[b:b+n];corr=float(np.dot(xx,yy)/np.sqrt(np.dot(xx,xx)*np.dot(yy,yy)))
 return {'lagMs':lag/SR*1000,'correlation':corr,'overlapSeconds':n/SR}
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--visual-report',type=Path);args=ap.parse_args()
 x=decode(OUT/'camera_upload.wav');y=decode(OUT/'avatar.mp4');full=compare(x,y);blocks=[]
 for a in np.arange(.2,len(x)/SR-1,5):
  b=min(a+4.6,len(x)/SR-.1);block=compare(x[round(a*SR):round(b*SR)],y[round(a*SR):round(b*SR)]);blocks.append({'window':[float(a),float(b)],**block})
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',str(OUT/'avatar.mp4')]));video=next(s for s in probe['streams'] if s['codec_type']=='video')
 good=full['correlation']>.98 and all(b['correlation']>.97 and abs(b['lagMs']-full['lagMs'])<=10 for b in blocks)
 report={'source':'camera_upload.wav','avatar':'avatar.mp4','sampleRate':SR,'full':full,'blocks':blocks,'waveformAlignmentPass':good,'speechSpeedChanged':False,'sourceDuration':len(x)/SR,'avatarAudioDuration':len(y)/SR,'nativeExport':{k:video.get(k) for k in ['width','height','r_frame_rate','duration','nb_frames']},'subjectiveAudioAuditionPerformed':False,'lipSyncScope':'Waveform clock verifies source timing and drift, not subjective mouth-shape or sound approval','avatarSha256':hashlib.sha256((OUT/'avatar.mp4').read_bytes()).hexdigest()}
 if args.visual_report:
  visual=json.loads(args.visual_report.read_text())
  if visual.get('status')!='approved' or not visual.get('filmstrip'):raise ValueError('Explicit visual inspection evidence required')
  if visual.get('avatarSha256')!=report['avatarSha256']:raise ValueError('Visual inspection hash does not match this avatar')
  report['visualEvidence']=visual
  if not good:raise ValueError('Waveform alignment failed; do not stage avatar')
  props_path=OUT/'recorded.props.json';p=json.loads(props_path.read_text());manifest=json.loads((OUT/'camera_manifest.json').read_text())
  for s,row in zip(p['segments'],manifest['segments']):
   if s['camera']:s['avatarStart']=row['visibleUploadStart']+full['lagMs']/1000
  target=ROOT/'studio/remotion/public/batchnov10/c5bc128a0a8d/referral-v4/avatar.mp4';target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(OUT/'avatar.mp4',target)
  p.update(avatar='batchnov10/c5bc128a0a8d/referral-v4/avatar.mp4',avatarVerified=True)
  props_path.write_text(json.dumps(p,indent=2)+'\n')
 (OUT/'avatar-alignment.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
 if not good:raise SystemExit(1)
if __name__=='__main__':main()
