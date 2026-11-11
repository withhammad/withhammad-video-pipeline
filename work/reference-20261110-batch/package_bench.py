"""Package the locally verified BENCH cut for owner review; never approve or publish."""
from pathlib import Path
import hashlib,json,shutil
ROOT=Path(__file__).resolve().parents[2];job=ROOT/'studio/.local/jobs/e25d352a1b20';src=job/'referral-v4'
chat=Path('/Users/hammad/Documents/Codex/2026-11-07/you-are-taking-over-the-withhammad/outputs/BENCH');date=Path('/Users/hammad/Downloads/11 November')
def read(name):return json.loads((src/name).read_text())
sha=hashlib.sha256((src/'narration_original.mp3').read_bytes()).hexdigest();approval=read('owner-voice-approval.json');exception=read('duration-exception.json');props=read('recorded.props.json')
assert sha=='429724519a16571fe8701cec16e8670b6bb0c9f4bd6c1aeb67646b6bc71be130'
assert approval['approved'] and approval['sourceSha256']==sha
assert exception['approved'] and exception['sourceSha256']==sha and exception['approvedDurationSeconds']==props['duration']==75.2326530612245
assert props['voiceVerified'] and props['durationExceptionApproved'] and not any(s['camera'] for s in props['segments'])
tech=read('final-technical-validation.json');meter=read('final-audio-validation.json');visual=read('final-visual-review.json');mix=read('audio-mix-report.json')
assert tech['technicalPass'] and meter['audioPass'] and visual['visualReviewPass'] and mix['musicContinuityPass']
final_hash=hashlib.sha256((src/'final.mp4').read_bytes()).hexdigest();assert visual['finalSha256']==meter['sha256']==final_hash
assert all(r['pass'] for r in read('platform-exports-validation.json'))
assert read('covers/crop-recommendations.json')['visuallyInspected']
seo=json.loads((job/'seo/seo.json').read_text());lines=['# BENCH — six-platform copy','','Prepared for finished-package review. Not approved, scheduled or published. Live guide and reply routing are release gates.','']
for platform in ['youtube','instagram','facebook','linkedin','tiktok','x']:
 lines+=['## '+platform.title(),''];d=seo[platform]
 for key in ['title','description','caption','text','alt_text']:
  if key in d:lines+=['**'+key.replace('_',' ').title()+'**','',str(d[key]),'']
 for key in ['tags','category_id','made_for_kids','weighted_length']:
  if key in d:lines+=[key+': '+json.dumps(d[key],ensure_ascii=False),'']
lines+=['## Disclosure and routing','','Keep the accurate own-voice-clone disclosure and applicable synthetic-media labels. The video is faceless; the cover reuses the approved brand pose. Instagram: @withhammad.ai with Collab invitations to @with.hammad and @hammadagentic.ai.','','Guide: '+seo['resource_url'],'Keyword: BENCH','']
(src/'copy.md').write_text('\n'.join(lines))
a=meter['audio'];v=next(s for s in tech['probe']['streams'] if s['codec_type']=='video')
(src/'review.md').write_text(f'''# BENCH — finished package review

Prepared for owner review. Not approved, scheduled or published.

The owner approved the exact voice and natural length: “Voice matches—keep75.2 seconds”. Both records are tied to SHA256 {sha}. The 75.232653-second narration is 1.532653 seconds above the reference's 10% ceiling, explicitly accepted by the owner. No speed, pitch, words or pauses changed. Video rounds only the final fraction to 2257 frames / 75.233333 seconds.

## Verified evidence

- Master: 1080×1920, H.264, yuv420p, limited-range BT.709, 30fps, {v['nb_frames']} frames. Encoded final audio {a['lufs']} LUFS / {a['true_peak_dbtp']} dBTP, zero clipped samples.
- Quiet original synthesized music and five restrained ticks. Continuous bed to the last frame. Whole-mix loudness mastering is recorded in audio-mix-report.json. The original narration source is unaltered.
- 170 actual aligned display tokens from the 175-word spoken script; no invalid or overlapping timings. All visuals are original CSS/SVG charts, with published data/provenance in assets.json. No source video/audio and no avatar render.
- Cybersecurity scores are explicitly different-task reports, not like-for-like. Fermat is machine-checkable formalization of a known theorem. Model setup is labelled an illustration with account/provider qualifications.
- Full contact sheet, opening, reference comparison, selected full-size frames and safe-zone/CTA tail reviewed. Long cybersecurity and Fermat passages now add word-related visual emphasis without changing the voice clock.
- Six GlowCover platform sizes reuse the approved brand pose. Both headline lines and the whole head remain in portrait, 3:4, 4:5, square and wide previews. No new face generation.
- Platform exports, cover crop evidence, six-platform copy and editorial scorecard included. Benchmarks remain selected comparisons, not universal performance promises.

## Review limits and release gates

Agents did not directly audition the audio. Owner full playback and approval of final sound, visuals, cover and copy remain required. The exact narration approval does not approve this mixed package. Root must verify the live guide and BENCH reply routing and decide release timing. No publishing or scheduling was performed. Narration cost 4 credits in the existing receipt; this faceless final integration used no generation credits.

## Files

final.mp4: full-quality review / YouTube / LinkedIn. final_ig.mp4: Instagram. final_social.mp4: Facebook / TikTok / X. captions.srt, copy.md, virality.md, guide-draft.md, benchmark-guide.md, cover-sheet.jpg and covers/.
''')
shutil.copy2(job/'guide-draft.md',src/'guide-draft.md');shutil.copy2(ROOT/'work/reference-20261110-batch/resources/BENCH.md',src/'benchmark-guide.md')
for target in [chat,date/'BENCH']:
 target.mkdir(parents=True,exist_ok=True)
 for name in ['final.mp4','final_ig.mp4','final_social.mp4','captions.srt','copy.md','review.md','virality.md','guide-draft.md','benchmark-guide.md']:shutil.copy2(src/name,target/name)
 shutil.copy2(src/'covers/cover_sheet.jpg',target/'cover-sheet.jpg');(target/'covers').mkdir(exist_ok=True)
 for p in (src/'covers').iterdir():
  if p.is_file() and p.suffix in ['.jpg','.json']:shutil.copy2(p,target/'covers'/p.name)
 manifest={str(p.relative_to(target)):{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in target.rglob('*') if p.is_file() and p.name!='manifest.json'}
 (target/'manifest.json').write_text(json.dumps({'packageApproved':False,'files':manifest},indent=2)+'\n')
thumbs=date/'Thumbnails/BENCH';thumbs.mkdir(parents=True,exist_ok=True)
for p in (src/'covers').iterdir():
 if p.is_file() and p.suffix in ['.jpg','.json']:shutil.copy2(p,thumbs/p.name)
base='BENCH - Fable 5.2 benchmarks explained';shutil.copy2(src/'final.mp4',date/(base+'.mp4'));shutil.copy2(src/'captions.srt',date/(base+'.srt'))
print(chat);print(date/(base+'.mp4'))
