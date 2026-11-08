import json,subprocess,shutil,sys,hashlib,re
from pathlib import Path
R=Path('/Users/hammad/withhammad-video-pipeline');sys.path.insert(0,str(R/'studio'))
from app import audio
J=R/'studio/.local/jobs/dfa218634321';V=J/'v4-revision';Q=V/'qa';Q.mkdir(exist_ok=True)
O=Path('/Users/hammad/Documents/Codex/2026-11-07/you-are-taking-over-the-withhammad/outputs/Five-Open-Repos')
timing=json.loads((V/'retime.json').read_text());caps=json.loads((V/'captions.json').read_text());duration=timing['durationSeconds']
report={'job':J.name,'revision':'REFERRAL voice correction','release_status':'AWAITING_OWNER_APPROVAL',
 'reference_seconds':48.533333,'duration_seconds':duration,'difference_percent':round((duration/48.533333-1)*100,2),
 'voice_id':'4b02b874862049f69b6034bbdc0fb282','voice_model':'ElevenLabs v4','speed':1.1,'stability':50,
 'voice_asset':'cad2bdeda9b54597a380ce7790187400','voice_review':json.loads((V/'voice-review.json').read_text()),
 'credits':{'authorized':3,'actual':3,'before':211,'after':208,'additional_avatar_credits':0,'job_total_including_rejected_attempts':33},
 'presenter':'Reuse existing matching-look avatar through word-constrained acoustic retiming. Same script; no new avatar generation.',
 'lip_sync_review':{'source_picture_delay_ms':100,'opening_paid_acoustic_closure_s':[2.50,2.61],
    'opening_paid_vowel_rise_s':2.69,'opening_paid_visual_vowel_s':2.70,'vowel_residual_ms':10,
    'precision':'30fps source; reviewed 12fps filmstrip and source word mapping; this is a spot check, not a claim of perfect sync throughout.'},
 'gates':{'reference_edit':'Same 16 visual beats and order; existing assets reused; length within 10%',
   'voice':'Verified fixed REFERRAL clone/settings. Identity and energy remain subject to owner listening approval.',
   'avatar':'Existing matching white-shirt/microphone look; frame mapping and opening bilabial inspected',
   'video':'Measured below; all 121 words captioned; full filmstrip reviewed',
   'virality':'Updated editorial scorecard; no claim of guaranteed views',
   'covers_and_copy':'Same six covers and platform copy, carried forward into corrected package'},
 'limitations':['Legacy 3–5% pause target reads 6.8%; natural word pace and audible endings retained under latest owner instruction. No pitch shift or speech speed-up used.',
                'New median pitch differs from REFERRAL’s question-based skit; matching settings alone does not prove the owner will perceive an exact match.'],
 'files':{}}
for name,render,mix in [('final.mp4','render-main.mp4','mix.wav'),('final_linkedin.mp4','render-linkedin.mp4','mix-linkedin-balanced.wav')]:
 out=V/name
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(V/render),'-i',str(V/mix),'-map','0:v:0','-map','1:a:0','-c:v','copy','-bsf:v','h264_metadata=video_full_range_flag=0:colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1','-c:a','aac','-b:a','192k','-ar','48000','-t',str(duration),'-movflags','+faststart',str(out)],check=True)
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=codec_name,width,height,pix_fmt,color_range,color_space,color_transfer,color_primaries,nb_frames,r_frame_rate:format=duration','-of','json',str(out)],text=True))
 video=probe['streams'][0];meter=audio._ebur128(str(out));target=-12 if 'linkedin' in name else -14
 assert video['codec_name']=='h264' and video['width']==1080 and video['height']==1920 and video['pix_fmt']=='yuv420p'
 assert video['color_range']=='tv' and video['color_space']=='bt709' and int(video['nb_frames'])==timing['durationFrames']
 assert abs(meter['lufs']-target)<.5 and meter['true_peak_dbtp']<=-1.5,(name,meter)
 report['files'][name]={'audio':meter,'probe':probe,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'bytes':out.stat().st_size}

def timestamp(ms):
 ms=round(ms);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
def srt(words):
 pages=[];p=[]
 for w in words:
  if p and (len(p)>=4 or len(' '.join(x['text'].strip() for x in p+[w]))>28 or w['startMs']-p[0]['startMs']>1100):pages.append(p);p=[]
  p.append(w)
 if p:pages.append(p)
 return '\n\n'.join(f"{i+1}\n{timestamp(p[0]['startMs'])} --> {timestamp(p[-1]['endMs'])}\n"+' '.join(w['text'].strip() for w in p) for i,p in enumerate(pages))+'\n'
assert len(caps)==121 and all(x['endMs']>x['startMs'] for x in caps)
assert re.sub(r'\W','',(V/'script.txt').read_text()).lower()==re.sub(r'\W','',''.join(x['text'] for x in caps)).lower()
(V/'captions.srt').write_text(srt(caps));(V/'captions_linkedin.srt').write_text(srt([w for w in caps if w['startMs']<timing['ctaStart']*1000]))
(V/'quality-report.json').write_text(json.dumps(report,indent=2)+'\n')
for src,dst in [('final.mp4','Five-Open-Repos-REFERRAL-voice.mp4'),('final_linkedin.mp4','Five-Open-Repos-REFERRAL-voice-LinkedIn.mp4'),('captions.srt','captions-v4.srt'),('captions_linkedin.srt','captions-v4-linkedin.srt'),('quality-report.json','quality-report-v4.json'),('qa/filmstrip.jpg','filmstrip-v4.jpg')]:shutil.copyfile(V/src,O/dst)
# Preserve the rejected media before making the corrected cut the current job export.
archive=J/'rejected-v3';archive.mkdir(exist_ok=True)
for name in ['final.mp4','final_linkedin.mp4','captions.srt','captions_linkedin.srt']:
 if (J/name).exists() and not (archive/name).exists():shutil.copyfile(J/name,archive/name)
 shutil.copyfile(V/name,J/name)
credit_note='Exactly 3 additional HeyGen credits (211 → 208). No new avatar render. Existing animations, reference inserts, captions and original music retained and retimed.'
review=f'''# REPO — corrected REFERRAL voice cut

Finished cut: 45.567 seconds, 1080×1920, 30fps. {credit_note}

Verified clone `4b02b874862049f69b6034bbdc0fb282`, ElevenLabs v4, 1.1×, stability 50, volume 100%, English Original. Spoken-word speed and pitch remain unchanged after generation; silent gaps were trimmed and a measured 1.5dB sibilance correction applied. Main mix −14.2 LUFS; LinkedIn −12.3 LUFS; final encoded peak measurements are in quality-report-v4.json.

The new take uses the exact saved REFERRAL identity and controls. Its natural median pitch is lower than REFERRAL's question-based skit. The older 3–5% pause metric reads 6.8%; retained breaths and endings were not cut to force it. Your listening judgment is needed before release. No claim that matching controls alone proves an audible match.

Full filmstrip and one opening bilabial spot-check inspected; same 16 reference beats, product inserts, captions on all 121 words, music to the last frame, and six existing glow-grid covers. The existing avatar is retimed to the same words; no extra paid generation. Source length 48.533 seconds, adaptation −6.1%.

Status: awaiting approval of this corrected cut. Earlier narration remains rejected. Guide and REPO rule are drafts; nothing scheduled or published.
'''
(O/'review-v4.md').write_text(review);(R/'docs/videos/2026-11-09-repo-corrected-voice-review.md').write_text(review)
print(json.dumps({'duration':duration,'files':{k:v['audio'] for k,v in report['files'].items()},'out':str(O)},indent=2))
