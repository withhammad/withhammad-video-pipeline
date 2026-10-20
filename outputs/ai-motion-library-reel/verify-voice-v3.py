from pathlib import Path
import json,sys,subprocess,hashlib,shutil
r=Path(__file__).resolve().parents[2];sys.path.insert(0,str(r/'studio'));from app import audio
out=Path(__file__).parent;final=out/'final-motion-voice-v3.mp4'
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(final)],text=True))
report=audio.analyze(final)
assert report['clipped_samples']==0
assert report['true_peak_dbtp'] <= -.5
assert 36.7<float(probe['format']['duration'])<37.1
assert any(x['codec_type']=='audio' for x in probe['streams'])
scan=json.loads((out/'final-face-scan-v3.json').read_text())
# Vision coordinates originate at lower left. Every detected face must lie inside the approved inset.
unexpected=[x for x in scan['faces'] if x['x']<.67 or x['y']>.30 or x['x']+x['w']>.97]
assert not unexpected,unexpected
v={'status':'ready_for_owner_review','duration_seconds':float(probe['format']['duration']),'video':'final-motion-voice-v3.mp4','audio':report,'face_scan':{'frames':scan['frames'],'detected_faces':len(scan['faces']),'outside_approved_avatar':len(unexpected)},'voice_generation_speed':1.0,'post_speed_change':False,'music':{'volume':0.14,'fade_seconds':0.8,'voice_remains_unsped':True},'original_audio':False,'avatar_box':{'x':774,'y':1500,'width':260,'height':390},'sha256':hashlib.sha256(final.read_bytes()).hexdigest(),'upload_status':'not_uploaded_not_scheduled'}
(out/'verification-v3.json').write_text(json.dumps(v,indent=2)+'\n')
(out/'verification.json').write_text(json.dumps(v,indent=2)+'\n')
(out/'final-audio-report.json').write_text(json.dumps(report,indent=2)+'\n')
p=out/'production.json';d=json.loads(p.read_text());d.update(status='final_voice_v3_ready_for_owner_review',duration_seconds=v['duration_seconds'],final_sha256=v['sha256']);p.write_text(json.dumps(d,indent=2)+'\n')
shutil.copy2(out/'final-reference-match.mp4',r/'studio/.local/jobs/motion20261020/superseded-reference-match.mp4')
shutil.copy2(final,out/'final-reference-match.mp4')
(out/'REVIEW.txt').write_text('FINAL VOICE V3 — OWNER REVIEW REQUIRED\nVideo: final-motion-voice-v3.mp4 (also final-reference-match.mp4).\nFresh owner voice at generation speed 1.0x; no post-speed change, light EQ and loudness normalization; quiet music with gentle fades. 36.9 seconds, English. Original presenter source regions removed before retiming. Approved avatar stays in small 260x390 inset.\nNo upload or schedule. Resource and MOTION automation remain drafts.\n')
print(json.dumps(v,indent=2))
