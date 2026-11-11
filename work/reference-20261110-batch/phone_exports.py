"""Optional narration-only phone copies of the two approved packages. Run through studio/heavy.sh.
Never modifies masters, approvals, scheduler, publishing state, or voice source files.
"""
import hashlib,json,math,shutil,subprocess,sys
from datetime import datetime,timezone
from fractions import Fraction
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'studio'))
from app import audio
JOBS={'HIGGS':('ee41d72bf8cd','claude-higgsfield-video-setup'),'ADVISOR':('62eec03e1e93','claude-fable-advisor-setup')}
OUTROOT=Path('/Users/hammad/Downloads/11 November')
APPROVALS=Path(__file__).with_name('owner-approvals-20261111.json')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def run(args):return subprocess.check_output(args,text=True)
def probe(p):return json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]))
def video_hash(p):return run(['ffmpeg','-v','error','-i',str(p),'-map','0:v:0','-c:v','copy','-f','hash','-hash','sha256','-']).strip().split('=',1)[1]
def stream(p,kind):return next(s for s in p['streams'] if s['codec_type']==kind)
def export(keyword):
 job,slug=JOBS[keyword];folder=ROOT/'studio/.local/jobs'/job;source=folder/'referral-v4';master=source/'final.mp4';voice=source/'narration_pcm.wav'
 approval=next(x for x in json.loads(APPROVALS.read_text())['packages'] if x['keyword']==keyword)
 protected=[master,voice,source/'narration_original.mp3',source/'copy.md',APPROVALS,folder/'STATUS.md']
 before={str(p):sha(p) for p in protected}
 assert before[str(master)]==approval['video_sha256'],'Master differs from exact approved package'
 assert before[str(source/'copy.md')]==approval['copy_sha256'],'Copy differs from exact approved package'
 out=OUTROOT/f'{keyword} - Manual Upload';out.mkdir(parents=True,exist_ok=True)
 dest=out/f'{keyword} - add your app sound.mp4'
 assert dest.resolve()!=master.resolve()
 original_probe=probe(master);v=stream(original_probe,'video');fps=float(Fraction(v['r_frame_rate']))
 duration=int(v['nb_frames'])/fps;vp=probe(voice);channels=stream(vp,'audio')['channels']
 meter=audio._ebur128(str(voice));assert all(math.isfinite(meter[k]) for k in ['lufs','true_peak_dbtp'])
 # One static gain only. Peak headroom takes precedence over the loudness target.
 gain=min(-14.5-meter['lufs'],-2.5-meter['true_peak_dbtp']);attempts=[]
 for attempt in range(3):
  subprocess.run(['ffmpeg','-v','error','-y','-i',str(master),'-i',str(voice),'-map','0:v:0','-map','1:a:0','-c:v','copy','-af',f'volume={gain:.9f}dB','-c:a','aac','-b:a','192k','-ar','48000','-ac',str(channels),'-t',str(duration),'-map_metadata','0','-movflags','+faststart',str(dest)],check=True)
  final_meter=audio._ebur128(str(dest));attempts.append({'staticGainDb':gain,**final_meter})
  if final_meter['true_peak_dbtp']<=-2:break
  gain+=-2.1-final_meter['true_peak_dbtp']
 after=probe(dest);av=stream(after,'video');picture_hash=video_hash(master)
 checks={'exactApprovedMaster':sha(master)==approval['video_sha256'],'identicalVideoBitstream':picture_hash==video_hash(dest),'sameFrameCount':av['nb_frames']==v['nb_frames'],'sameVideoDuration':abs(float(av['duration'])-float(v['duration']))<1e-6,'samePictureFormat':all(av[k]==v[k] for k in ['codec_name','width','height','pix_fmt','r_frame_rate','color_range']),'containerDurationWithinOneFrame':abs(float(after['format']['duration'])-float(original_probe['format']['duration']))<1/fps,'narrationGainOnly':abs(final_meter['lufs']-(meter['lufs']+gain))<.35,'truePeakHeadroom':final_meter['true_peak_dbtp']<=-2,'allProtectedFilesUnchanged':all(sha(Path(p))==h for p,h in before.items())}
 assert all(checks.values()),checks
 copy=(source/'copy.md').read_text()
 platforms={'Instagram':'Instagram caption.txt','Youtube':'YouTube title and description.txt','Tiktok':'TikTok caption.txt','Facebook':'Facebook caption.txt','Linkedin':'LinkedIn caption.txt','X':'X post.txt'}
 for section,name in platforms.items():
  content=copy.split(f'## {section}\n\n',1)[1].split('\n## ',1)[0].strip()
  if section=='Instagram':
   caption=content.split('**Caption**\n\n',1)[1].split('\n\n**Alt Text**',1)[0].strip()
   alt=content.split('**Alt Text**\n\n',1)[1].strip();(out/'Instagram alt text.txt').write_text(alt+'\n');content=caption
  (out/name).write_text(content.replace('**','')+'\n')
 covers=out/'Covers';covers.mkdir(exist_ok=True)
 copied={}
 for platform,expected in approval['platform_cover_sha256'].items():
  src=source/'covers'/f'{platform}.jpg';assert sha(src)==expected,f'{platform} cover differs from approval'
  target=covers/f'{platform}.jpg';shutil.copy2(src,target);copied[str(target.relative_to(out))]=sha(target)
 shutil.copy2(source/'covers/instagram.jpg',out/f'{keyword} - cover.jpg')
 shutil.copy2(source/'captions.srt',out/f'{keyword} - captions.srt')
 (out/'START HERE.txt').write_text(f'''{keyword} — optional native-sound phone copy

WAIT: DO NOT POST UNTIL CODEX CONFIRMS GUIDE/RULE DEPLOYMENT AND RELEASE BOOKING.
Website PR #21: https://github.com/withhammad/withhammad-rebuild/pull/21
Expected guide: https://withhammad.com/resources/{slug}
The package is approved, but this folder is preparation, not a booked posting slot.

Use: {keyword} - add your app sound.mp4
The approved picture and burned-in captions are bit-for-bit unchanged. This copy
uses the original narration alone, with one constant gain and peak headroom for
native app music. Existing mixed masters remain untouched. No speech retiming,
pitch changes, removed pauses, new generation or credits.

After Codex confirms the live guide/rule and release booking:
1. Transfer this MP4, its cover, SRT and the platform copy to your phone.
2. For Instagram/YouTube, use the coordinated two-hour native-sound window.
   Choose a sound licensed for the destination account/use in that app. Keep the
   original narration clear; preview the entire clip and lower added music if
   it obscures any word. Keep the full edit length and original audio enabled.
3. Use the supplied platform copy, captions and cover where supported. Retain
   the AI disclosure and enable the platform synthetic-media label.
   Instagram destination: @withhammad.ai; invite @with.hammad and
   @hammadagentic.ai as collaborators. Keyword: {keyword}.
4. Send Codex the final post URL promptly so the queue can be reconciled and
   duplicate uploads avoided. Codex verifies the actual keyword-reply flow.

This optional folder does not change automatic scheduling or disable the
existing fallback. Codex coordinates the phone window and fallback after release
booking; do not assume these files authorize an immediate post.
Choose native music separately in each destination app. Do not carry a platform's
licensed audio into other apps. Verification.json describes this voice-only
handoff, not the final loudness after your selected app music is added.
''')
 report={'checkedAt':datetime.now(timezone.utc).isoformat(),'keyword':keyword,'job':job,'phoneExport':str(dest),'sourceMaster':str(master),'originalNarration':str(voice),'approvedMasterSha256':approval['video_sha256'],'phoneExportSha256':sha(dest),'videoBitstreamSha256':picture_hash,'voicePcmSha256':before[str(voice)],'durationSeconds':duration,'frames':int(v['nb_frames']),'width':av['width'],'height':av['height'],'fps':fps,'sourceNarrationMeter':meter,'voiceOnlyMeter':final_meter,'staticGainDb':gain,'audioChannels':channels,'audioGainAttempts':attempts,'checks':checks,'copiedApprovedCovers':copied,'captionsSha256':sha(out/f'{keyword} - captions.srt'),'approvedCopySha256':approval['copy_sha256'],'newCredits':0,'retimed':False,'normalizerOrCompressor':False,'releaseState':'WAIT for PR21 guide/rule deployment verification and release booking','schedulerChanged':False,'posted':False}
 (out/'verification.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'keyword':keyword,'duration':duration,'gainDb':round(gain,3),'voiceOnlyMeter':final_meter,'checks':checks}),flush=True)
 return report
if __name__=='__main__':
 keywords=sys.argv[1:] or list(JOBS)
 if not keywords or any(k not in JOBS for k in keywords):raise SystemExit('Only approved HIGGS and ADVISOR supported')
 reports=[export(k) for k in keywords]
 Path(__file__).with_name('phone-exports-proof.json').write_text(json.dumps({'kind':'optional_native_sound_handoff','packages':reports},indent=2)+'\n')
