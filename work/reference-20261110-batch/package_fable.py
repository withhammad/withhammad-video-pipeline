"""Package the verified FABLE local cut for owner review; never publish or approve it."""
from pathlib import Path
import hashlib,json,shutil
ROOT=Path(__file__).resolve().parents[2];job=ROOT/'studio/.local/jobs/c5bc128a0a8d';src=job/'referral-v4'
chat=Path('/Users/hammad/Documents/Codex/2026-11-07/you-are-taking-over-the-withhammad/outputs/FABLE');date=Path('/Users/hammad/Downloads/11 November')
seo=json.loads((job/'seo/seo.json').read_text());tech=json.loads((src/'final-technical-validation.json').read_text());meter=json.loads((src/'final-audio-validation.json').read_text());alignment=json.loads((src/'avatar-alignment.json').read_text());approval=json.loads((src/'owner-voice-approval.json').read_text());visual=json.loads((src/'final-visual-review.json').read_text());props=json.loads((src/'recorded.props.json').read_text())
assert tech['technicalPass'] and meter['audioPass'] and alignment['waveformAlignmentPass'] and visual['visualReviewPass']
assert approval['approved'] and approval['sourceSha256']==hashlib.sha256((src/'narration_original.mp3').read_bytes()).hexdigest()
assert all(r['pass'] for r in json.loads((src/'platform-exports-validation.json').read_text()))
assert json.loads((src/'covers/crop-recommendations.json').read_text())['visuallyInspected']
lines=['# FABLE — six-platform copy','','Prepared for finished-package review. Not approved, scheduled or published. Guide and keyword routing must be live before release.','']
for platform in ['youtube','instagram','facebook','linkedin','tiktok','x']:
 lines+=['## '+platform.title(),''];d=seo[platform]
 for key in ['title','description','caption','text','alt_text']:
  if key in d:lines += ['**'+key.replace('_',' ').title()+'**','',str(d[key]),'']
 for key in ['tags','category_id','made_for_kids','weighted_length']:
  if key in d:lines += [key+': '+json.dumps(d[key],ensure_ascii=False),'']
lines+=['## Disclosure and routing','','Keep the “AI avatar of me” disclosure and platform synthetic-media labels. Instagram: @withhammad.ai with Collab invitations to @with.hammad and @hammadagentic.ai.','', 'Guide: '+seo['resource_url'],'Keyword: FABLE','']
(src/'copy.md').write_text('\n'.join(lines))
a=meter['audio'];duration=tech['probe']['format']['duration'];v=next(s for s in tech['probe']['streams'] if s['codec_type']=='video');av=alignment['nativeExport']
review=f'''# FABLE — final package review

Prepared for the owner's finished-package review. Not approved, scheduled or published.

Owner narration approval: “Voice matches—continue”. This covers the exact original narration SHA in owner-voice-approval.json; it does not approve the complete video, mixed audio, covers or copy. Agents did not directly audition the sound and make no subjective voice or mixed-audio claim.

## Verified

- Master: {duration} seconds, {v['nb_frames']} frames, 1080×1920, 30 fps, H.264, limited-range BT.709, yuv420p. Source reference 108.7s; target 97.83–119.57s.
- Encoded final audio: {a['lufs']} LUFS / {a['true_peak_dbtp']} dBTP; {a['clipped_samples']} clipped samples. Quiet original procedural instrumental and five restrained UI ticks; no external samples or paid music. Narration retains words, speed and natural pauses. Whole-mix loudness mastering is recorded separately.
- Avatar: {av['width']}×{av['height']}, native {av['r_frame_rate']} fps. Four-fps visual inspection evidence is in avatar-alignment.json.
- Avatar/upload waveform correlation: {alignment['full']['correlation']:.5f}; measured avatar delay {alignment['full']['lagMs']}ms included in picture timing. Sampled windows confirm no measured speed drift. This checks the audio clock, not a subjective lip-shape or sound judgment.
- Recorded captions: {len(props['words'])} displayed tokens, from the actual 281-word narration. No fabricated preflight timings. Original narration length 99.239s; only video tail padded to a full frame.
- Source demonstrations retain attribution. Future history is labelled speculative; speed is “up to 30%”; 20% price reduction applies to standard API token rates; no personal-test or one-click guarantee is claimed.
- Three reference chapters and demo sequence retained. Chapters 1/3 hold 1.5s each; project montage shots 0.31s each; the longer brief passage has three scene/camera/review cards.
- Full contact sheet, opening strip, targeted framing frames, six covers and crop sheet reviewed locally. Detailed evidence is in final-visual-review.json and covers/.

## Deliverables

final.mp4 for full-quality review, YouTube and LinkedIn; final_ig.mp4 for Instagram; final_social.mp4 for Facebook, TikTok and X; captions.srt, copy.md, virality.md and six platform covers.

## Still required

Owner full playback and finished-package approval including mixed audio; live guide and FABLE reply routing; release booking without overwriting existing posts. No publication or package approval is implied. Root's usage receipts record 35 FABLE generation credits (5 narration + 30 avatar); this local edit used no generation credits.
'''
(src/'review.md').write_text(review)
shutil.copy2(job/'guide-draft.md',src/'guide-draft.md')
shutil.copy2(ROOT/'work/reference-20261110-batch/resources/fable-starter/SKILL.md',src/'starter-skill.md')
for target in [chat,date/'FABLE']:
 target.mkdir(parents=True,exist_ok=True)
 for name in ['final.mp4','final_ig.mp4','final_social.mp4','captions.srt','copy.md','review.md','virality.md','guide-draft.md','starter-skill.md']:shutil.copy2(src/name,target/name)
 shutil.copy2(src/'covers/cover_sheet.jpg',target/'cover-sheet.jpg')
 (target/'covers').mkdir(exist_ok=True)
 for p in (src/'covers').iterdir():
  if p.is_file() and p.suffix in ['.jpg','.json']:shutil.copy2(p,target/'covers'/p.name)
 manifest={str(p.relative_to(target)):{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in target.rglob('*') if p.is_file() and p.name!='manifest.json'}
 (target/'manifest.json').write_text(json.dumps({'packageApproved':False,'files':manifest},indent=2)+'\n')
thumbs=date/'Thumbnails/FABLE';thumbs.mkdir(parents=True,exist_ok=True)
for p in (src/'covers').iterdir():
 if p.is_file() and p.suffix in ['.jpg','.json']:shutil.copy2(p,thumbs/p.name)
base='FABLE - Creative projects, pricing and starter skill'
shutil.copy2(src/'final.mp4',date/(base+'.mp4'));shutil.copy2(src/'captions.srt',date/(base+'.srt'))
print(chat);print(date/(base+'.mp4'))
