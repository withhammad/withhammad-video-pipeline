"""Package the short preview with untouched original AAC, then verify the files."""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[3]
WORK = ROOT / 'work/personal-iqbal-3d'
OUT = Path('/Users/hammad/Documents/Codex/2026-11-07/you-are-taking-over-the-withhammad/outputs/Personal-Iqbal')
SOURCE = ROOT / 'work/reference-DfgtetEsqUB/reference.mp4'
NAME = 'Valley-Blender-walk-sample.mp4'


def run(*args):
    return subprocess.run(args, check=True, capture_output=True, text=True).stdout


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def audio_packets(path):
    return json.loads(run('ffprobe', '-v', 'error', '-select_streams', 'a:0',
                          '-show_packets', '-show_data_hash', 'sha256',
                          '-show_entries', 'packet=pts_time,duration_time,data_hash',
                          '-of', 'json', str(path)))['packets']


OUT.mkdir(parents=True, exist_ok=True)
target = OUT / NAME
run('ffmpeg', '-v', 'error', '-y', '-i', str(WORK / 'picture.mp4'), '-i', str(SOURCE),
    '-map', '0:v:0', '-map', '1:a:0', '-t', '5.76', '-c', 'copy',
    '-movflags', '+faststart', str(target))
probe = json.loads(run('ffprobe', '-v', 'error', '-show_streams', '-show_format',
                       '-of', 'json', str(target)))
video = next(s for s in probe['streams'] if s['codec_type'] == 'video')
assert (video['codec_name'], video['width'], video['height'], video['pix_fmt']) == ('h264', 1920, 1080, 'yuv420p')
assert int(video['nb_frames']) == 144 and video['r_frame_rate'] == '25/1'
assert video['color_range'] == 'tv'
original, final = audio_packets(SOURCE), audio_packets(target)
assert final and len(final) < len(original)
assert [p['data_hash'] for p in final] == [p['data_hash'] for p in original[:len(final)]]
assert abs(float(final[0]['pts_time']) - float(original[0]['pts_time'])) < .001
for label, time in [('first', '0'), ('middle', '2.88'), ('last', '5.68')]:
    run('ffmpeg', '-v', 'error', '-y', '-ss', time, '-i', str(target),
        '-frames:v', '1', '-q:v', '2', str(WORK / f'{label}.jpg'))
run('ffmpeg', '-v', 'error', '-y', '-i', str(target), '-vf',
    'fps=6,scale=480:270,tile=6x6', '-frames:v', '1', '-q:v', '2', str(WORK / 'motion-sheet.jpg'))
shutil.copy2(WORK / 'Hammad-valley-sample.blend', OUT / 'Hammad-valley-sample.blend')
readme = (ROOT / 'studio/blender/personal-iqbal-valley/README.md').read_text()
(OUT / 'Valley-sample-README.md').write_text(readme)
downloads = Path.home() / 'Downloads/9 November/Personal'
downloads.mkdir(parents=True, exist_ok=True)
for name in [NAME, 'Hammad-valley-sample.blend', 'Valley-sample-README.md']:
    shutil.copy2(OUT / name, downloads / name)
report = {
    'status': 'short_sample_awaiting_owner_review',
    'scope': 'Personal only; never business publishing',
    'file': str(target), 'sha256': sha(target), 'size_bytes': target.stat().st_size,
    'picture_seconds': 5.76, 'frames': 144, 'fps': 25,
    'probe': probe, 'unchanged_audio_packets': len(final),
    'audio_packet_hashes_match_source_prefix': True,
    'audio_first_pts_matches_source': True,
    'audio_note': 'Original AAC copied without encoding or gain change. Container may end on a complete AAC packet after the last picture frame.',
    'blend_file': str(OUT / 'Hammad-valley-sample.blend'),
    'blend_sha256': sha(OUT / 'Hammad-valley-sample.blend'),
    'heygen_credits': 0, 'paid_generation_credits': 0,
    'full_film_authorized': False,
    'visual_review': 'Owner review of motion and likeness required; file validation is not aesthetic approval.',
}
(WORK / 'sample-proof.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({k: report[k] for k in ('file', 'size_bytes', 'sha256', 'unchanged_audio_packets', 'status')}, indent=2))
