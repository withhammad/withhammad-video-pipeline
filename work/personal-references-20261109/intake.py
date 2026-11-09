"""Download owner-supplied personal references; never create business jobs or spend credits."""
from pathlib import Path
import hashlib
import json
import os
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'studio'))
os.environ['STUDIO_COOKIES_FILE'] = str(ROOT / 'work/.secrets/instagram-cookies.txt')
from app.media import download

WORK = Path(__file__).resolve().parent
MANIFEST = ROOT / 'outputs/personal/reference-inbox.json'
items = json.loads(MANIFEST.read_text())['links']
for item in items:
    if item.get('batch') != '2026-11-09-poetry':
        continue
    folder = WORK / item['id']
    folder.mkdir(parents=True, exist_ok=True)
    try:
        video = folder / 'source.mp4'
        info_file = folder / 'source.info.json'
        if video.exists() and info_file.exists():
            info = json.loads(info_file.read_text())
        else:
            video, info = download(item['url'], folder)
        source = {k: info.get(k) for k in ('id', 'uploader', 'uploader_id', 'duration', 'upload_date')}
        source['local_file'] = str(video.relative_to(ROOT))
        source['sha256'] = hashlib.sha256(video.read_bytes()).hexdigest()
        probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(video)]))
        stream = next(s for s in probe['streams'] if s['codec_type'] == 'video')
        source.update(duration=float(probe['format']['duration']), width=stream['width'], height=stream['height'], fps=stream['r_frame_rate'])
        # Re-read before each write so later reference additions are preserved.
        state = json.loads(MANIFEST.read_text())
        match = next(x for x in state['links'] if x['id'] == item['id'])
        match['source'] = source
        if not match.get('status', '').startswith(('finished', 'delivered')) and not match.get('deliverables'):
            match['status'] = 'source_saved_ready_for_personal_edit'
        MANIFEST.write_text(json.dumps(state, ensure_ascii=False, indent=2) + '\n')
        print(json.dumps({'id': item['id'], 'uploader': source['uploader'], 'duration': source['duration'], 'status': match['status']}), flush=True)
    except Exception as error:
        (folder / 'intake-error.log').write_text(str(error))
        print(json.dumps({'id': item['id'], 'status': 'download_failed', 'error_type': type(error).__name__}), flush=True)
