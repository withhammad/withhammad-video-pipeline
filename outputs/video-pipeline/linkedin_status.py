"""Verify the direct LinkedIn connection without exposing credentials or publishing."""
import json
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
credential = ROOT / 'work/.secrets/linkedin-oauth.json'


def main():
    if not credential.exists():
        raise SystemExit('LinkedIn credential missing; authorize the new developer app.')
    data = json.loads(credential.read_text())
    if data.get('expires_at_unix', 0) <= time.time():
        raise SystemExit('LinkedIn authorization expired; renew it in Chrome.')
    result = subprocess.run(
        ['/usr/bin/curl', '--silent', '--show-error', '--fail', '--max-time', '30',
         '--config', '-', 'https://api.linkedin.com/v2/userinfo'],
        input='header = "Authorization: Bearer ' + data['access_token'] + '"\n',
        capture_output=True, text=True,
    )
    if result.returncode:
        raise SystemExit('LinkedIn identity check failed; curl exit ' + str(result.returncode))
    identity = json.loads(result.stdout)
    if identity.get('sub') != data['member_sub']:
        raise SystemExit('LinkedIn account differs from the configured owner.')
    print(json.dumps({'connected': True, 'name': identity.get('name'),
                      'author_urn': 'urn:li:person:' + identity['sub'],
                      'scopes': data['scopes'], 'video_publish_tested': False}, indent=2))


if __name__ == '__main__':
    main()
