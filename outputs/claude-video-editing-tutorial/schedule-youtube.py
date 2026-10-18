"""Idempotent upload of the approved full tutorial; defaults to read-only preflight."""
import json, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'studio'))
from app import publish_youtube as yt
OUT=Path(__file__).resolve().parent
meta=json.loads((OUT/'publication.json').read_text())
live='--live' in sys.argv
result=yt.publish(OUT/'full-tutorial-corrected.mp4',meta,dry_run=not live,
    state_path=ROOT/'work/.secrets/claude-edit-youtube-corrected-upload.json',
    privacy_status='private',publish_at=meta['schedule']['youtube_utc'],
    category_id='27',contains_synthetic_media=True,made_for_kids=False,
    thumbnail_path=OUT/meta['thumbnail'])
(OUT/('youtube-upload.json' if live else 'youtube-preflight.json')).write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({k:result.get(k) for k in ['status','dry_run','channel','video_id','watch_url','privacy_status','thumbnail','warnings']}))
