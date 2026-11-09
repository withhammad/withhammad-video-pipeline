"""Copy the current BLENDER review materials into Downloads and verify hashes.

Does not change approvals, finished-media counts, posting slots or prior packages.
"""
import hashlib
import json
import shutil
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[2]
JOB = ROOT / 'studio/.local/jobs/3f33678db749'
V = JOB / 'referral-v4'
DEST = Path.home() / 'Downloads/10 November'
PACKAGE = DEST / 'Business/BLENDER'
PACKAGE.mkdir(parents=True, exist_ok=True)
copies = {
    V/'voice.wav':'BLENDER - narration review.wav',
    V/'voice-review.json':'voice-review.json',
    V/'script.txt':'script.txt',
    V/'edit-preview.mp4':'Review/BLENDER - edit preview - avatar pending.mp4',
    V/'captions.srt':'Review/captions.srt',
    V/'copy.md':'Review/copy.md',
    V/'audio-review.json':'Review/audio-review.json',
    V/'seo-check.json':'Review/seo-check.json',
    ROOT/'work/blender-resume/edit-sheet.jpg':'Review/edit-sheet.jpg',
}
digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
entries = []
for src, name in copies.items():
    dst = PACKAGE / name
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)
    expected = digest(src)
    assert digest(dst) == expected, dst
    entries.append({'path':str(dst.relative_to(DEST)), 'bytes':dst.stat().st_size,
        'sha256':expected,'source':str(src),'status':'review_only'})
status = PACKAGE / 'STATUS.md'
status.write_text('''# BLENDER — review in progress

The local edit preview is 37.77 seconds with animations, real Blender footage,
all-word captions and music. It intentionally labels the missing presenter.
It is not the finished package and is not approved for publication.

Please review the narration before the one matching-avatar render. It uses
the saved REFERRAL settings: HAMMAD YOUSUF -- 1, ElevenLabs v4, 1.1x, stability 50,
English Original. One take cost 2 credits (208 → 206). Natural pitch and word pace
were preserved; 2.633 seconds of silence removed, no clipped endings measured.

Median pitch 154.17 Hz versus 187.36 Hz in REFERRAL, pitch range 12.51 semitones,
pause share 8.1%, HF difference +2.6 dB. The older voice gates do not all pass;
settings and measurements alone cannot establish audible identity.

Matching saved white T-shirt look prepared in HeyGen, 16.33 seconds of camera
lines uploaded. No avatar generation submitted. Final lip-sync/filmstrip,
covers, package approval, guide/rule deployment and publication still remain.
''')
entries.append({'path':str(status.relative_to(DEST)),'bytes':status.stat().st_size,
    'sha256':digest(status),'source':'generated status note','status':'review_only'})
manifest_path = DEST / 'delivery-manifest.json'
manifest = json.loads(manifest_path.read_text())
index = {e['path']:e for e in manifest['files']}
index.update({e['path']:e for e in entries})
manifest['files'] = list(index.values())
manifest['verified_files'] = len(index)
manifest['review_files'] = sum(e.get('status') == 'review_only' for e in index.values())
manifest['updated_at'] = datetime.now(ZoneInfo('Asia/Dubai')).isoformat()
manifest_path.write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n')
readme = DEST/'START-HERE.md'
section = '''\n## Work in progress\n\n[BLENDER — narration and edit review](Business/BLENDER/STATUS.md). The presenter
render is pending; this folder is separate from the finished packages above.\n'''
current = readme.read_text()
if '## Work in progress' not in current:
    readme.write_text(current+section)
print(json.dumps({'review_files_verified':len(entries),'total_verified_files':len(index),
    'finished_business_video_count_unchanged':manifest['current_main_business_videos'],
    'review_folder':str(PACKAGE/'Review')},indent=2))
