"""Package CLONE only after exact source/avatar gates and root's final visual review."""
from pathlib import Path
import hashlib,json,shutil
ROOT=Path(__file__).resolve().parents[2];job=ROOT/'studio/.local/jobs/0e375e205e9d';src=job/'referral-v4'
chat=Path('/Users/hammad/Documents/Codex/2026-11-07/you-are-taking-over-the-withhammad/outputs/CLONE');date=Path('/Users/hammad/Downloads/11 November')
def read(name):return json.loads((src/name).read_text())
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
source_hash=sha(src/'narration_original.mp3');approval=read('owner-voice-approval.json');props=read('recorded.props.json');alignment=read('avatar-alignment.json');avatar_review=read('avatar-visual-review.json')
assert source_hash=='9f6df9b3d778d5b268ee43fbe76ae89f9307886ca5050a71aee8e2bc82c8d8d7'
assert approval['approved'] and approval['sourceSha256']==source_hash and props['voiceVerified'] and props['avatarVerified']
assert alignment['waveformAlignmentPass'] and avatar_review['status']=='approved' and avatar_review['reviewer']=='root'
assert alignment['avatarSha256']==avatar_review['avatarSha256']==sha(src/'avatar.mp4')
assert 49.41<=props['duration']<=60.39
tech=read('final-technical-validation.json');meter=read('final-audio-validation.json');visual=read('final-visual-review.json');mix=read('audio-mix-report.json')
assert tech['technicalPass'] and meter['audioPass'] and visual['visualReviewPass'] and mix['musicContinuityPass'] and mix['originalSha256']==source_hash
final_hash=sha(src/'final.mp4');assert visual['finalSha256']==meter['sha256']==final_hash
# A local editor check is insufficient: root must inspect the exact final master and cover evidence.
root_review=(visual.get('reviewer')=='root' and bool(visual.get('rootInspected'))) or (visual.get('rootReview',{}).get('pass') is True and visual['rootReview'].get('finalSha256')==final_hash)
assert root_review,'Root exact-master visual review required before packaging'
assert all(r['pass'] for r in read('platform-exports-validation.json'))
assert read('covers/crop-recommendations.json')['visuallyInspected']
seo=json.loads((job/'seo/seo.json').read_text());lines=['# CLONE — six-platform copy','','Prepared for finished-package review. Not approved, scheduled or published. Live guide and reply routing are release gates.','']
for platform in ['youtube','instagram','facebook','linkedin','tiktok','x']:
 lines+=['## '+platform.title(),''];d=seo[platform]
 for key in ['title','description','caption','text','alt_text']:
  if key in d:lines+=['**'+key.replace('_',' ').title()+'**','',str(d[key]),'']
 for key in ['tags','category_id','made_for_kids','weighted_length']:
  if key in d:lines+=[key+': '+json.dumps(d[key],ensure_ascii=False),'']
lines+=['## Disclosure and routing','','Keep the “AI avatar of me” own-voice-clone disclosure and applicable synthetic-media labels. Instagram: @withhammad.ai with Collab invitations to @with.hammad and @hammadagentic.ai.','','Guide: '+seo['resource_url'],'Keyword: CLONE','']
(src/'copy.md').write_text('\n'.join(lines))
a=meter['audio'];v=next(s for s in tech['probe']['streams'] if s['codec_type']=='video');clock=alignment.get('gainInvariantClock',{})
(src/'review.md').write_text(f'''# CLONE — finished package review

Prepared for owner review. Not approved, scheduled or published.

The owner approved the exact narration: “Voice matches—continue”, SHA256 {source_hash}. Native narration is {props['duration']:.6f}s; final is 1629 frames / 54.3s, within the 54.9s reference's ±10% window. No words, pitch, speed or pauses changed. Final mixed sound, visuals, covers and copy require separate approval.

## Verified evidence

- Master: 1080×1920, H.264, limited-range BT.709, yuv420p, 30fps, {v['nb_frames']} frames. Encoded final audio {a['lufs']} LUFS / {a['true_peak_dbtp']} dBTP, zero clipped samples.
- Quiet original synthesized music with four restrained ticks. Whole-mix mastering and a measured +0.2dB whole-mix trim are recorded. Original narration source is unaltered and the bed continues through the last frame.
- New 720×1280/25fps black-polo avatar; root inspected all 217 four-fps samples and opening. Saved-look image is the matching black-polo/bookcase asset, explicitly labelled Saved avatar look; moving take is labelled Generated motion.
- Raw global audio correlation {alignment['full']['correlation']:.5f} missed the initial .98 threshold. Root's separate diagnostic found time-varying provider gain, exact independently transcribed speech and consistent +23ms lag. Gain-invariant clock correlation {clock.get('correlation',0):.5f}, maximum residual {clock.get('maxResidualLagMs',0):.4f}ms and fitted drift {clock.get('fittedDriftMs',0):.4f}ms across {clock.get('activeWindows',0)} active windows justify the recorded clock pass. Production audio was not modified by the diagnostic. This checks clock/content, not subjective lip shapes or voice quality.
- 146 actual aligned display tokens from 148 spoken script tokens; no invalid or overlapping timings. All-camera upload PCM equals original narration PCM. +23ms picture mapping preserves the narration clock and speech tail.
- Reference UI excerpts are muted, tightly cropped and attributed. Creator results are not presented as Hammad's. Three photos/about25 seconds are the source creator's example, not universal requirements. Claude plans; connected tools generate. Revision prompt is labelled illustrative.
- Full decoded contact/opening, reference comparison, caption/head framing and final CTA reviewed by editor and root. Six covers use an actual smiling/open-eyed frame from the new take; whole head retained in crop previews.

## Review limits and release gates

Agents did not directly audition the sound. Owner full playback must assess mixed sound, conversational pace and subjective lip sync before final package approval. Root must verify the live guide and CLONE reply routing and decide release timing. No scheduling or publishing was performed. Root's paid-generation receipts remain authoritative; local editing uses no additional generation credits.

## Files

final.mp4: full-quality review / YouTube / LinkedIn. final_ig.mp4: Instagram. final_social.mp4: Facebook / TikTok / X. captions.srt, copy.md, virality.md, guide-draft.md, setup-checklist.md, cover-sheet.jpg and covers/.
''')
shutil.copy2(job/'guide-draft.md',src/'guide-draft.md')
(src/'setup-checklist.md').write_text('''# Plan and review an AI clone video

A practical checklist accompanying the CLONE reel. This is a preparation/review workflow, not a guarantee of any provider's output or training requirements.

1. Define the topic, audience, format and script. Choose the model available to your account.
2. Supply your own authorized reference photos and a clear voice recording. Follow the selected provider's current requirements; the creator's three-photo/25-second example is not a universal minimum.
3. Add the intended workflow skill. Review what it instructs the tools to do.
4. Connect the needed generation service through Claude's available Connectors flow and review its consent screen.
5. Ask Claude to study the skill and references, then prepare a script and generation plan.
6. Review the script, pronunciation, look, output settings and displayed credit cost before generating.
7. Inspect the returned video for likeness, word pronunciation, lip sync, expressions, hands and framing.
8. If needed, request one specific correction and check the next generation cost first. Recheck the corrected output.
9. Review the finished edit, captions, sound, cover and platform copy before publishing.

Claude coordinates connected tools; it does not independently train the face or voice. This reel's source demonstrations are credited to Arshman Khalid and are not Hammad's own end-to-end tests.

Sources: https://higgsfield.ai/mcp and https://higgsfield.ai/creator-hub/changelog. Source workflow reference: https://www.instagram.com/reel/DfjiRwPOxa3/ .
''')
for target in [chat,date/'CLONE']:
 target.mkdir(parents=True,exist_ok=True)
 for name in ['final.mp4','final_ig.mp4','final_social.mp4','captions.srt','copy.md','review.md','virality.md','guide-draft.md','setup-checklist.md']:shutil.copy2(src/name,target/name)
 shutil.copy2(src/'covers/cover_sheet.jpg',target/'cover-sheet.jpg');(target/'covers').mkdir(exist_ok=True)
 for p in (src/'covers').iterdir():
  if p.is_file() and p.suffix in ['.jpg','.json']:shutil.copy2(p,target/'covers'/p.name)
 manifest={str(p.relative_to(target)):{'bytes':p.stat().st_size,'sha256':sha(p)} for p in target.rglob('*') if p.is_file() and p.name!='manifest.json'}
 (target/'manifest.json').write_text(json.dumps({'packageApproved':False,'files':manifest},indent=2)+'\n')
thumbs=date/'Thumbnails/CLONE';thumbs.mkdir(parents=True,exist_ok=True)
for p in (src/'covers').iterdir():
 if p.is_file() and p.suffix in ['.jpg','.json']:shutil.copy2(p,thumbs/p.name)
base='CLONE - Plan an AI clone video with Claude and Higgsfield';shutil.copy2(src/'final.mp4',date/(base+'.mp4'));shutil.copy2(src/'captions.srt',date/(base+'.srt'))
print(chat);print(date/(base+'.mp4'))
