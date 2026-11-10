"""Copy the reviewed HIGGS artifacts into chat and dated Downloads; never publish."""
from pathlib import Path
import hashlib,json,shutil
ROOT=Path(__file__).resolve().parents[2];job=ROOT/'studio/.local/jobs/ee41d72bf8cd';src=job/'referral-v4'
chat=Path('/Users/hammad/Documents/Codex/2026-11-07/you-are-taking-over-the-withhammad/outputs/HIGGS')
date=Path('/Users/hammad/Downloads/11 November');downloads=date/'HIGGS';thumbs=date/'Thumbnails/HIGGS'
seo=json.loads((job/'seo/seo.json').read_text())
lines=['# HIGGS — six-platform copy','', 'Exact current copy from the job’s seo/seo.json. Finished package is not approved, scheduled or published. Resource page and keyword routing remain prerequisites; the SEO source marks the guide draft/not live.','']
for platform in ['youtube','instagram','facebook','linkedin','tiktok','x']:
 d=seo[platform];lines+=['## '+platform.title(),'']
 for key in ['title','description','caption','text','alt_text']:
  if key in d:lines += [f'**{key.replace("_"," ").title()}**', '', str(d[key]),'']
 for key in ['tags','category_id','made_for_kids','weighted_length']:
  if key in d:lines += [f'{key}: '+json.dumps(d[key],ensure_ascii=False),'']
lines+=['## Disclosure and routing','','Keep the existing “AI avatar of me” caption disclosure and enable the platform’s synthetic-media label where supported. Instagram destination is @withhammad.ai, with Collab invitations to @with.hammad and @hammadagentic.ai.','',f'Guide: {seo["resource_url"]}', 'Keyword: HIGGS', '']
copy='\n'.join(lines)
review='''# HIGGS — final package review

Status: ready for the owner’s finished-package review; not approved, scheduled, or published.

The owner approved the exact narration on 11 November: “Both match—continue”. That approval covers the voice take, not this complete video, music mix, cover or post copy. The agents cannot directly hear this audio and do not claim a subjective sound or voice-likeness audition.

## Verified

- Final: 34.300 seconds, 1029 frames, H.264, 1080×1920, 30 fps, yuv420p, limited-range BT.709.
- Actual encoded final audio: −14.3 LUFS, −1.9 dBTP, no clipped samples. Original procedural instrumental and restrained UI ticks; no paid music or external samples. Source narration speed, words and natural pauses unchanged.
- Avatar: one completed take in the saved Professional in white shirt look. Native downloaded output was 1080×1920 at 25 fps, 12.32 seconds; no replacement generation was made. The primary agent inspected the complete 49-frame, 4 fps avatar filmstrip.
- Uploaded camera audio versus avatar audio: whole-track correlation 0.99156; consistent +23 ms offset across five windows with no detected speed drift. Picture mapping includes that offset. This verifies the audio clock, not a subjective mouth-shape or sound judgment.
- Corrected full-video contact sheet, opening filmstrip, targeted full-size frames and cover sheet inspected. Split panels preserve the whole head/shoulders; captions sit below the chin; full-screen ending unchanged. Source creator greeting and initial presenter transition removed from the prompt excerpt.
- All 89 spoken script words are covered by 87 displayed caption tokens: “five point two” appears as 5.2. No invalid or overlapping word timestamps. Reference length and beat order preserved.
- Six platform covers use an actual smiling frame from this avatar and the existing glow template. Recommended crop offsets are included to retain both headline lines and the whole head.

## Credits

Usage & History receipt: narration 2 + avatar 8 = 10 credits. Both reels together used 31 credits, leaving 175. Receipt: work/reference-20261110-batch/credit-history-175.png.

## Files

- final.mp4: mastered full-quality video for review, YouTube and LinkedIn.
- final_ig.mp4: Instagram export (128 kbps AAC, no edit lists).
- final_social.mp4: smaller TikTok/Facebook/X export.
- captions.srt: synchronized captions.
- copy.md: current six-platform titles, captions, tags and disclosures.
- covers/: platform covers, cover_sheet.jpg and crop recommendations.

## Still required

Owner playback and finished-package approval, including the final mixed sound; live guide page and HIGGS reply routing; release booking without overwriting existing posts. No claim of publishing approval is made here.
'''
(src/'copy.md').write_text(copy);(src/'review.md').write_text(review)
for target in [chat,downloads]:
 target.mkdir(parents=True,exist_ok=True)
 for name in ['final.mp4','final_ig.mp4','final_social.mp4','captions.srt','copy.md','review.md']:
  if (src/name).exists():shutil.copy2(src/name,target/name)
 target_covers=target/'covers';target_covers.mkdir(exist_ok=True)
 for p in (src/'covers').iterdir():
  if p.is_file() and p.suffix in ['.jpg','.json']:shutil.copy2(p,target_covers/p.name)
 manifest={p.name:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in target.iterdir() if p.is_file() and p.name!='manifest.json'}
 (target/'manifest.json').write_text(json.dumps({'packageApproved':False,'files':manifest},indent=2)+'\n')
thumbs.mkdir(parents=True,exist_ok=True)
for p in (src/'covers').iterdir():
 if p.is_file() and p.suffix in ['.jpg','.json']:shutil.copy2(p,thumbs/p.name)
shutil.copy2(src/'final.mp4',date/'HIGGS - Make AI videos inside Claude.mp4')
shutil.copy2(src/'captions.srt',date/'HIGGS - Make AI videos inside Claude.srt')
# Replace only this job's status document; preserve exact known credit facts.
(job/'STATUS.md').write_text('''# HIGGS status — 11 November 2026

- Intake/script/spec: complete; source facts corrected and live promotional terms qualified.
- Voice: fixed REFERRAL profile; owner approved the exact narration with “Both match—continue” on 11 November. One narration submission; 2 credits recorded. Voice source and approval hashes retained.
- Avatar: one completed Professional in white shirt take. Usage & History receipt confirms 8 avatar credits, plus 2 narration credits = 10 total. Native download 1080×1920 at 25 fps; no paid retry. Original submission ledger remains in referral-v4/avatar-submission.json.
- Alignment: consistent +23 ms avatar-audio offset, whole-track correlation 0.99156, no detected speed drift. Picture mapping corrected; native narration pace and pauses preserved.
- Edit: corrected 34.3-second final, platform exports, captions, six covers, current SEO copy and review report packaged in chat outputs/HIGGS and Downloads/11 November.
- Checks: final video/audio technical checks pass; primary agent reviewed avatar filmstrip and corrected contact/cover sheets. Agents did not subjectively audition the audio. Owner final playback remains required.
- Release: **package not approved, not scheduled, not posted**. Target 10–11 November; 10 November has elapsed. Finished-package approval and live guide/reply routing remain prerequisites before booking remaining 11 November slots.
''')
f=src/'final-technical-validation.json';d=json.loads(f.read_text());d['primaryAgentVisualReview']={'contactSheet':True,'coverSheet':True,'framingOkay':True,'ownerPackageApproved':False};f.write_text(json.dumps(d,indent=2)+'\n')
print(chat);print(date/'HIGGS - Make AI videos inside Claude.mp4')
