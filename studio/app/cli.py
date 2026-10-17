"""Run the pipeline from a terminal (the Claude Code path). No server needed.

  python -m app.cli run 'https://www.instagram.com/reel/…'   # create a job and run it to the end
  python -m app.cli run /path/to/clip.mp4
  python -m app.cli status [job_id]
  python -m app.cli rerun <job_id> [--from STAGE]            # resume a job; stages with artifacts are kept
  python -m app.cli heygen-looks                             # list avatar looks (to pick STUDIO_HEYGEN_LOOK_ID)
"""
import argparse
import json
import shutil
import sys
from pathlib import Path

from . import db, worker
from .main import IMAGE_TYPES, VIDEO_TYPES, UPLOADS


def create_from_arg(source):
    path = Path(source)
    if path.exists():
        suffix = path.suffix.lower()
        kind = 'video' if suffix in VIDEO_TYPES.values() else 'image' if suffix in IMAGE_TYPES.values() else None
        if not kind:
            sys.exit(f'Unsupported file type {suffix}')
        job_id = db.create_job(kind, 'pending')
        UPLOADS.mkdir(parents=True, exist_ok=True)
        target = UPLOADS / f'{job_id}{suffix}'
        shutil.copyfile(path, target)
        with db.connect() as conn:
            conn.execute('UPDATE jobs SET source=? WHERE id=?', (str(target), job_id))
        return job_id
    return db.create_job('url', source)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest='command', required=True)
    run = sub.add_parser('run')
    run.add_argument('source', help='reference URL, or a local video/image file')
    status = sub.add_parser('status')
    status.add_argument('job_id', nargs='?')
    rerun = sub.add_parser('rerun')
    rerun.add_argument('job_id')
    rerun.add_argument('--from', dest='from_stage', choices=db.STAGES, help='drop this stage and later ones first')
    sub.add_parser('heygen-looks')
    args = parser.parse_args()
    db.migrate()
    if args.command == 'heygen-looks':
        from . import heygen
        for look in heygen.HeyGen().list_looks():
            print(f"{look['id']}  {look.get('name')!s:28} voice={look.get('default_voice_id')}  "
                  f"{look.get('preferred_orientation')}  {look.get('status', '')}")
        return
    if args.command == 'rerun':
        job = db.get_job(args.job_id)
        if not job:
            sys.exit(f'No job {args.job_id}')
        if args.from_stage:
            keep = {k: v for k, v in job['artifacts'].items() if db.STAGES.index(k) < db.STAGES.index(args.from_stage)}
            with db.connect() as conn:
                conn.execute("UPDATE jobs SET artifacts=?, status='queued', error=NULL WHERE id=?",
                             (json.dumps(keep), args.job_id))
        else:
            with db.connect() as conn:
                conn.execute("UPDATE jobs SET status='queued', error=NULL WHERE id=?", (args.job_id,))
        job = db.get_job(args.job_id)
        with db.connect() as conn:
            conn.execute("UPDATE jobs SET status='running' WHERE id=?", (args.job_id,))
        outcome = worker.run_job(job, resume=True)
        result = db.get_job(args.job_id)
        print(json.dumps({'id': args.job_id, 'outcome': outcome, 'stage': result['stage'], 'error': result['error'],
                          'artifacts': result['artifacts']}, indent=2, ensure_ascii=False))
        sys.exit(0 if outcome in ('done', 'waiting') else 1)
    if args.command == 'run':
        job_id = create_from_arg(args.source)
        job = db.claim_next()
        while job and job['id'] != job_id:  # drain anything older first
            worker.run_job(job)
            job = db.claim_next()
        outcome = worker.run_job(job)
        result = db.get_job(job_id)
        print(json.dumps({'id': job_id, 'outcome': outcome, 'stage': result['stage'],
                          'error': result['error'], 'artifacts': result['artifacts']}, indent=2, ensure_ascii=False))
        sys.exit(0 if outcome in ('done', 'waiting') else 1)
    if args.job_id:
        print(json.dumps(db.get_job(args.job_id), indent=2, ensure_ascii=False))
    else:
        for j in db.list_jobs(limit=20):
            print(f"{j['created_at'][:16]}  {j['id']}  {j['status']:7}  {j['stage']:10}  {j['source'][:70]}")


if __name__ == '__main__':
    main()
