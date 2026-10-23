from pathlib import Path
import json,subprocess,hashlib
R=Path(__file__).resolve().parents[2]
for name in ['coding-comedy-review','ai-returns-review']:
 p=R/'outputs'/name;q=p/'qa';q.mkdir(exist_ok=True);v=p/'final.mp4'
 d=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=codec_name,codec_type,width,height,pix_fmt,color_range,r_frame_rate,nb_frames,sample_rate:format=duration','-of','json',str(v)]));vs=next(x for x in d['streams'] if x['codec_type']=='video')
 assert (vs['codec_name'],vs['width'],vs['height'],vs['pix_fmt'],vs['color_range'])==('h264',1080,1920,'yuv420p','tv')
 assert abs(int(vs['nb_frames'])/30-float(d['format']['duration']))<.08
 duration=float(d['format']['duration']);timing=json.loads((p/'timing.json').read_text());assert all(0<=c['startMs']<c['endMs']<=duration*1000 for c in timing['captions'])
 for start,end in [(0,min(40,duration)),(40,duration)]:
  if end<=start:continue
  subprocess.run(['ffmpeg','-v','error','-y','-ss',str(start),'-i',str(v),'-t',str(end-start),'-vf','fps=1,scale=216:384,tile=10x4','-frames:v','1',str(q/f'sheet-{start}.jpg')],check=True)
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(v),'-t','3','-vf','fps=4,scale=270:480,tile=6x2','-frames:v','1',str(q/'opening.jpg')],check=True)
 for sec in [0,4,18,32,45,int(vs['nb_frames'])/30-.1]:
  subprocess.run(['ffmpeg','-v','error','-y','-ss',str(sec),'-i',str(v),'-frames:v','1',str(q/f'frame-{sec:.2f}.png')],check=True)
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(v),'-vn','-ar','16000','-ac','1',str(q/'audio.wav')],check=True)
 with open(q/'loudness.log','w') as log:subprocess.run(['ffmpeg','-hide_banner','-i',str(v),'-af','loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json','-f','null','-'],stdout=subprocess.DEVNULL,stderr=log,check=True)
 log=(q/'loudness.log').read_text(); loud=json.loads(log[log.rfind('{'):log.rfind('}')+1]);assert float(loud['input_tp'])<=-1.4
 report={'status':'technical_checks_passed_owner_review_pending','file':v.name,'sha256':hashlib.sha256(v.read_bytes()).hexdigest(),'probe':d,'loudness':loud,'captions':len(timing['captions']),'voice_speed':1.0,'publication_authorized':False,'requires_owner_review':['Delivery and pacing','Visual treatment','Post copy and companion guide'],'notes':['Source voice retained without time stretching.','Added visual reading/reaction holds are explicit in timing.json.','Source references used for analysis; new owner narration and original graphics.']}
 if name=='ai-returns-review':report['notes']+=['Captioned HeyGen source used after clean UI download failed. Original captions below the safe zone are covered by lower-edge design; source SRT is restyled in the safe zone.','Example workflow, not a completed return.']
 (p/'verification.json').write_text(json.dumps(report,indent=2)+'\n');print(name,duration,loud['input_i'],loud['input_tp'])
