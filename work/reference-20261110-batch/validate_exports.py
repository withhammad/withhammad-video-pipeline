"""Meter the actual platform exports after app.exports, without changing them."""
from pathlib import Path
import json,sys,subprocess
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'studio'))
from app import audio
keyword=sys.argv[1];job={'HIGGS':'ee41d72bf8cd','ADVISOR':'62eec03e1e93','FABLE':'c5bc128a0a8d','CLONE':'0e375e205e9d','BENCH':'e25d352a1b20'}[keyword]
p=ROOT/'studio/.local/jobs'/job/'referral-v4'
frames=json.loads((p/'render-preflight.json').read_text())['frames'];reports=[]
for name in ['final_ig.mp4','final_social.mp4']:
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p/name)]))
 v=next(s for s in probe['streams'] if s['codec_type']=='video');a=next(s for s in probe['streams'] if s['codec_type']=='audio');stats=audio.analyze(str(p/name))
 checks={'h264':v['codec_name']=='h264','size':v['width']==1080 and v['height']==1920,'frames':int(v['nb_frames'])==frames,'fps':v['r_frame_rate']=='30/1','limitedRange':v.get('color_range')=='tv','audio':a['codec_name']=='aac' and a['sample_rate']=='48000','videoStart':abs(float(v.get('start_time',0)))<.001,'audioStart':abs(float(a.get('start_time',0)))<.001}
 good=all(checks.values()) and -14.5<=stats['lufs']<=-13.5 and stats['true_peak_dbtp']<=-1.5 and stats['clipped_samples']==0
 reports.append({'file':name,'checks':checks,'audio':stats,'duration':float(probe['format']['duration']),'pass':good})
(p/'platform-exports-validation.json').write_text(json.dumps(reports,indent=2)+'\n')
print(json.dumps([{'file':r['file'],'pass':r['pass'],'lufs':r['audio']['lufs'],'truePeak':r['audio']['true_peak_dbtp']} for r in reports],indent=2))
assert all(r['pass'] for r in reports)
