"""Platform exports of a mastered reel (final.mp4), shared by every edit path: app.reel build, app.edit_deskreel
render and app.edit_explainer render (when it renders to final.mp4) write both; for a final.mp4 made any other way:

  python -m app.exports <job>/final.mp4            # writes final_ig.mp4 and final_social.mp4 next to it

final_ig.mp4: Instagram/Facebook spec: no edit lists, AAC 128 kbps 48 kHz, moov at the front. Re-encoded without
  B-frames so the first video pts is 0 (with -c:v copy, dropping the edit list exposed a 67 ms B-frame delay and the
  picture lagged the audio by ~45 ms). CRF 17.
final_social.mp4: the same container flags at a capped bit rate (1250k, max 1800k, buffer 3600k) for the uploads
  that go through the owner's Chrome (TikTok, Facebook, X): about 40 % smaller than final_ig.mp4. These are the
  exact flags the f7da978d101e (HARVEST) and 9d2d68af60d4 exports used.
"""
import argparse
import json
import sys
from pathlib import Path

from . import audio

IG_VIDEO = ['-c:v', 'libx264', '-crf', '17', '-preset', 'slow', '-bf', '0', '-pix_fmt', 'yuv420p']
SOCIAL_VIDEO = ['-c:v', 'libx264', '-preset', 'slow', '-b:v', '1250k', '-maxrate', '1800k', '-bufsize', '3600k',
                '-pix_fmt', 'yuv420p', '-bf', '0']
AUDIO_AND_CONTAINER = ['-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-movflags', '+faststart', '-use_editlist', '0']


def export_ig(final, out):
    """final.mp4 -> final_ig.mp4 (see the module docstring)."""
    audio.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(final), *IG_VIDEO, *AUDIO_AND_CONTAINER, str(out)])
    return Path(out)


def export_social(final, out):
    """final.mp4 -> final_social.mp4 (see the module docstring)."""
    audio.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(final), *SOCIAL_VIDEO, *AUDIO_AND_CONTAINER, str(out)])
    return Path(out)


def platform_exports(final):
    """Both exports next to final.mp4. Returns {'final_ig': path, 'final_social': path}."""
    final = Path(final)
    return {'final_ig': str(export_ig(final, final.with_name('final_ig.mp4'))),
            'final_social': str(export_social(final, final.with_name('final_social.mp4')))}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('final', help='the mastered final.mp4')
    args = parser.parse_args(argv)
    print(json.dumps(platform_exports(args.final), indent=1))
    return 0


if __name__ == '__main__':
    sys.exit(main())
