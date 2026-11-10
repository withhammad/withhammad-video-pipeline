"""Package ADVISOR for owner review only; no job-root media replacement or release."""
from pathlib import Path
import json,hashlib,shutil
ROOT=Path(__file__).resolve().parents[2];job=ROOT/'studio/.local/jobs/62eec03e1e93';src=job/'referral-v4'
chat=Path('/Users/hammad/Documents/Codex/2026-11-07/you-are-taking-over-the-withhammad/outputs/ADVISOR');date=Path('/Users/hammad/Downloads/11 November')
seo=json.loads((job/'seo/seo.json').read_text());tech=json.loads((src/'final-technical-validation.json').read_text());meter=json.loads((src/'final-audio-validation.json').read_text())
assert tech['technicalPass'] and meter['audioPass'];assert all(r['pass'] for r in json.loads((src/'platform-exports-validation.json').read_text()))
lines=['# ADVISOR — six-platform copy','','Exact current copy from seo/seo.json. Finished package is not approved, scheduled or published. Guide page and keyword routing must be live before release.','']
for platform in ['youtube','instagram','facebook','linkedin','tiktok','x']:
 lines+=['## '+platform.title(),''];d=seo[platform]
 for key in ['title','description','caption','text','alt_text']:
  if key in d:lines += ['**'+key.replace('_',' ').title()+'**','',str(d[key]),'']
 for key in ['tags','category_id','made_for_kids','weighted_length']:
  if key in d:lines += [key+': '+json.dumps(d[key],ensure_ascii=False),'']
lines+=['## Disclosure and routing','','Keep the “AI avatar of me” disclosure and use the platform synthetic-media label where supported. Instagram destination: @withhammad.ai, with Collab invitations to @with.hammad and @hammadagentic.ai.','', 'Guide: '+seo['resource_url'],'Keyword: ADVISOR','']
(src/'copy.md').write_text('\n'.join(lines))
a=meter['audio']
review=f'''# ADVISOR — final package review

Status: prepared for the owner’s finished-package review; not approved, scheduled or published.

The owner approved this exact narration on 11 November: “Both match—continue”. That approval covers the voice take, not the complete video, final mix, cover or copy. Agents cannot directly hear this audio and make no subjective sound or voice-likeness claim.

## Verified

- Final: 39.833 seconds, 1195 frames, 1080×1920, H.264, 30 fps, limited-range BT.709, yuv420p.
- Actual encoded final audio: {a['lufs']} LUFS, {a['true_peak_dbtp']} dBTP, {a['clipped_samples']} clipped samples. Procedural instrumental and three quiet UI ticks have recorded provenance; no paid music or external samples. Narration retains original words, speed and natural pauses.
- One avatar generation: Podcaster in white t-shirt, Pro Avatar 6, Expressive movement and Enthusiastic expression, native 720×1280 at 25 fps, 28.88 seconds. Root inspected the complete roughly 116-frame, 4 fps filmstrip: stable face, hands, microphone and background, with the whole head present.
- Avatar versus uploaded speech waveform correlation 0.99268. All six sampled windows have the same +23 ms delay; picture mapping includes it. No measured speed drift. This verifies the audio clock, not a subjective lip-shape or sound judgment.
- Caption alignment matches all 113 spoken script words across 111 displayed tokens; “five point two” displays as 5.2. No invalid/overlapping word intervals. Reference beat order retained; seven-build cost comparison is explicitly Charlie’s reported result, with usage variation qualified.
- Rehook title moved below the face. Split presenter uses contained full head/shoulders and a neutral background. Final contact sheet, opening strip, targeted frames and cover sheet are local review evidence; owner full playback remains required.
- Six covers use an actual open-eyed smiling avatar frame at 27 seconds, matte extraction, and the existing approved glow template. Recommended crop offsets are included.

## Credits

Authoritative Usage & History receipt: narration 2 credits (initial UI quote 3) + avatar 19 = 21. HIGGS used 10; combined use 31, balance 175. Receipt: work/reference-20261110-batch/credit-history-175.png. No new generation or charge during editing.

## Files

- final.mp4: full-quality master for review, YouTube and LinkedIn.
- final_ig.mp4: Instagram export, no edit lists, 128 kbps AAC.
- final_social.mp4: smaller Facebook, TikTok and X export.
- captions.srt, copy.md, covers/cover_sheet.jpg and six platform covers.

## Still required

Owner playback and finished-package approval, including the mixed audio; live guide and ADVISOR reply routing; release booking without changing existing posts. No publishing approval is implied.
'''
(src/'review.md').write_text(review)
for target in [chat,date/'ADVISOR']:
 target.mkdir(parents=True,exist_ok=True)
 for name in ['final.mp4','final_ig.mp4','final_social.mp4','captions.srt','copy.md','review.md']:shutil.copy2(src/name,target/name)
 (target/'covers').mkdir(exist_ok=True)
 for p in (src/'covers').iterdir():
  if p.is_file() and p.suffix in ['.jpg','.json']:shutil.copy2(p,target/'covers'/p.name)
 manifest={p.name:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in target.iterdir() if p.is_file() and p.name!='manifest.json'}
 (target/'manifest.json').write_text(json.dumps({'packageApproved':False,'files':manifest},indent=2)+'\n')
thumbs=date/'Thumbnails/ADVISOR';thumbs.mkdir(parents=True,exist_ok=True)
for p in (src/'covers').iterdir():
 if p.is_file() and p.suffix in ['.jpg','.json']:shutil.copy2(p,thumbs/p.name)
base='ADVISOR - Use Fable 5.2 as a Claude Code advisor'
shutil.copy2(src/'final.mp4',date/(base+'.mp4'));shutil.copy2(src/'captions.srt',date/(base+'.srt'))
print(chat);print(date/(base+'.mp4'))
