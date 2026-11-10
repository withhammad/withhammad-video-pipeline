"""Download and transcribe owner references; no generation or publication."""
import json
import os
import sys
from pathlib import Path

ROOT = Path('/Users/hammad/withhammad-video-pipeline')
os.environ['STUDIO_DB'] = str(ROOT / 'studio/.local/studio.sqlite')
os.environ['STUDIO_UPLOADS'] = str(ROOT / 'studio/.local/uploads')
os.environ['STUDIO_JOBS'] = str(ROOT / 'studio/.local/jobs')
os.environ['STUDIO_COOKIES_FILE'] = str(ROOT / 'work/.secrets/instagram-cookies.txt')
sys.path.insert(0, str(ROOT / 'studio'))
from app import db, worker, media, lesson, refill

db.migrate()
for shortcode in (sys.argv[1:] or ('DfjGcIczq-V', 'DfiuRiRBE2i')):
    url = f'https://www.instagram.com/reel/{shortcode}/'
    with db.connect() as connection:
        existing = connection.execute(
            'SELECT id FROM jobs WHERE source=? ORDER BY created_at DESC LIMIT 1', (url,)
        ).fetchone()
    job_id = existing['id'] if existing else db.create_job('url', url)
    job = db.get_job(job_id)
    folder = media.job_dir(job_id)
    print(json.dumps({'reference': shortcode, 'job': job_id, 'folder': str(folder)}), flush=True)
    active = shortcode in ('DfjGcIczq-V', 'DfiuRiRBE2i')
    refill.mark(url, 'in_progress' if active else 'pending', job=job_id)
    if 'intake' not in job['artifacts']:
        db.record(job_id, 'intake', 'started', status='running')
        item = worker.stage_intake(job)
        db.record(job_id, 'intake', 'done', artifact=item)
    item = db.get_job(job_id)['artifacts']['intake']
    print(json.dumps({'reference': shortcode, 'duration_s': item.get('duration_s'),
                      'uploader': item.get('uploader'), 'description': item.get('description')},
                     ensure_ascii=False), flush=True)
    if not (folder / 'transcript.json').exists():
        result = media.transcribe_local(Path(item['audio']))
        (folder / 'transcript.json').write_text(json.dumps(result, indent=2))
        (folder / 'transcript.txt').write_text(result['text'])
    else:
        result = json.loads((folder / 'transcript.json').read_text())
    db.record(job_id, 'transcribe', 'done', artifact={
        'path': str(folder / 'transcript.json'), 'engine': result['engine'],
        'text_preview': result['text'][:400],
    }, status='waiting')
    lesson.write_brief(item, result['text'], folder)
    print(json.dumps({'reference': shortcode, 'job': job_id, 'transcript': result['text']},
                     ensure_ascii=False), flush=True)
