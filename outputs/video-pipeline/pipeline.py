"""Local intake and readiness checks. External execution is performed by Codex tools."""
import argparse
import hashlib
import json
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent


def blockers(config):
    pending = []
    if not config['heygen']['selected_look_id']:
        pending.append('Choose an avatar look in the HeyGen gallery')
    if not config['heygen']['voice_compatibility_verified']:
        pending.append('Verify assigned voice with the chosen avatar engine')
    for destination in config['publishing']['destinations']:
        if destination.get('connection_status') != 'identity_and_scopes_verified':
            pending.append(f"Verify direct API access for {destination['key']}")
    if not config['website']['write_connection_verified']:
        pending.append('Connect website repository or CMS')
    if not config['manychat']['connected']:
        pending.append('Connect ManyChat workspace and verify flow access')
    return pending


def enqueue(reference, config):
    parsed = urlparse(reference)
    if parsed.scheme not in ('https', 'http') or not parsed.netloc:
        raise ValueError('Supply a reference video URL with an http or https scheme')
    key = hashlib.sha256(reference.encode()).hexdigest()[:20]
    folder = ROOT / 'queue'
    folder.mkdir(exist_ok=True)
    path = folder / (key + '.json')
    job = {
        'id': key, 'reference_url': reference, 'stage': 'intake',
        'transcript': None, 'verified_sources': [], 'script': None,
        'avatar_look_id': None, 'voice_id': None,
        'heygen_video_id': None, 'render_path': None,
        'resource': {'title': None, 'steps': [], 'prompts': [], 'tool_links': [], 'published_url': None},
        'posts': {d['key']: {'caption': None, 'remote_id': None, 'status': 'pending'} for d in config['publishing']['destinations']},
        'manychat': {'keyword': None, 'flow_id': None, 'status': 'pending'},
        'events': []
    }
    try:
        with path.open('x') as file:
            json.dump(job, file, indent=2)
    except FileExistsError:
        return {'job': str(path), 'created': False}
    return {'job': str(path), 'created': True}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['status', 'enqueue'])
    parser.add_argument('--reference')
    args = parser.parse_args()
    config = json.loads((ROOT / 'config.json').read_text())
    if args.command == 'status':
        result = {'scheduler_enabled': config['scheduler_enabled'], 'blockers': blockers(config)}
    else:
        if not args.reference:
            parser.error('enqueue requires --reference')
        try:
            result = enqueue(args.reference, config)
        except ValueError as error:
            parser.error(str(error))
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
