"""Job worker: claims queued jobs and runs the stage chain. Each milestone adds one stage
function to STAGE_RUNNERS; stages read earlier artifacts from the job record."""
import json
import logging
import os
import signal
import time
from pathlib import Path
from urllib.parse import urlparse

from . import db, media

log = logging.getLogger('studio.worker')
POLL_SECONDS = float(os.environ.get('STUDIO_POLL_SECONDS', '3'))
_stop = False


def stage_intake(job):
    """Get the source media into the job folder: download a URL, or register an upload."""
    folder = media.job_dir(job['id'])
    if job['source_type'] == 'url':
        parsed = urlparse(job['source'])
        host = parsed.netloc.lower().removeprefix('www.')
        video, info = media.download(job['source'], folder)
        audio = media.extract_audio(video, folder)
        return {'kind': 'url', 'host': host, 'url': job['source'],
                'platform': 'instagram' if host == 'instagram.com' else host.split('.')[0],
                'video': str(video), 'audio': str(audio),
                'duration_s': info.get('duration') or media.probe_duration(video),
                'title': info.get('title'), 'uploader': info.get('uploader'),
                'description': (info.get('description') or '')[:2000], 'upload_date': info.get('upload_date')}
    path = Path(job['source'])
    if not path.exists():
        raise RuntimeError('uploaded file is missing')
    if job['source_type'] == 'video':
        audio = media.extract_audio(path, folder)
        return {'kind': 'video', 'video': str(path), 'audio': str(audio),
                'duration_s': media.probe_duration(path), 'bytes': path.stat().st_size}
    return {'kind': 'image', 'path': str(path), 'bytes': path.stat().st_size}


def stage_transcribe(job):
    intake = db.get_job(job['id'])['artifacts'].get('intake', {})
    if intake.get('kind') == 'image':
        return {'skipped': 'image source has no audio'}
    result = media.transcribe(Path(intake['audio']))
    folder = media.job_dir(job['id'])
    (folder / 'transcript.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
    (folder / 'transcript.txt').write_text(result['text'])
    return {'engine': result['engine'], 'language': result.get('language'),
            'words': len(result['text'].split()), 'segments': len(result['segments']),
            'fallback_reason': result.get('fallback_reason'), 'text_preview': result['text'][:400],
            'path': str(folder / 'transcript.json')}


# Later milestones append here in order; a missing stage ends the chain as done.
STAGE_RUNNERS = {'intake': stage_intake, 'transcribe': stage_transcribe}


def run_job(job, path=None):
    for stage in db.STAGES:
        runner = STAGE_RUNNERS.get(stage)
        if runner is None:
            break
        db.record(job['id'], stage, 'started', path=path)
        try:
            result = runner(job)
        except Exception as error:  # noqa: BLE001 - recorded on the job, worker keeps running
            log.exception('job %s failed at %s', job['id'], stage)
            db.record(job['id'], stage, f'failed: {error}', status='failed', error=str(error), path=path)
            return 'failed'
        db.record(job['id'], stage, 'completed', artifact=result, path=path)
    last = next((s for s in reversed(db.STAGES) if s in STAGE_RUNNERS), 'intake')
    db.record(job['id'], last, 'done (remaining stages not yet implemented)', status='done', path=path)
    return 'done'


def _handle_stop(*_):
    global _stop
    _stop = True


def main():
    logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(name)s: %(message)s')
    signal.signal(signal.SIGTERM, _handle_stop)
    signal.signal(signal.SIGINT, _handle_stop)
    db.migrate()
    log.info('worker started, polling every %ss', POLL_SECONDS)
    while not _stop:
        job = db.claim_next()
        if job is None:
            time.sleep(POLL_SECONDS)
            continue
        log.info('job %s claimed (%s)', job['id'], job['source_type'])
        outcome = run_job(job)
        log.info('job %s %s', job['id'], outcome)


if __name__ == '__main__':
    main()
