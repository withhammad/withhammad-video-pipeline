"""The cut without the music bed, for the four sound platforms (owner red line 2026-11-11).

Instagram, Facebook, YouTube Shorts and TikTok get a sound from the platform's own library, added in the platform's
uploader. Our own background music would fight it, so every job also exports the same picture with the voice and the
sound effects only. X and LinkedIn keep final.mp4 with its music.

    python -m app.nomusic build <job> [--from DIR]    # final_nomusic.mp4, final_social_nomusic.mp4, final_ig_nomusic.mp4
    python -m app.nomusic status                        # queued sound-platform jobs and whether they have the cut

Stems come from the job's mix folder (default: the newest of referral-v4, v4-revision, mix, the job root): the
narration (narration_original.mp3, narration_pcm.wav, narration.wav, voice.wav) and, when present, sfx*.wav.
The voice is not retimed, cut or filtered. Voice + SFX are mastered as one mix to -14 LUFS / -2 dBTP with the same
two-pass chain as the music master, then muxed onto the UNCHANGED video stream of each export (-c:v copy), so the
picture the owner approved is bit-identical. A job whose music is baked in (no separate narration stem) cannot be
built here; build() says so instead of guessing.
"""
import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

from app import audio

ROOT = Path(__file__).resolve().parents[2]
JOBS = ROOT / 'studio' / '.local' / 'jobs'
QUEUE = ROOT / 'outputs' / 'video-pipeline' / 'repost-queue.json'
MIX_DIRS = ('referral-v4', 'v4-revision', 'mix', '.')
NARRATION = ('narration_original.mp3', 'narration_pcm.wav', 'narration.wav', 'voice.wav', 'voice.mp3')
EXPORTS = {'final.mp4': 'final_nomusic.mp4', 'final_social.mp4': 'final_social_nomusic.mp4',
           'final_ig.mp4': 'final_ig_nomusic.mp4'}
TARGET = {'I': -14, 'TP': -2.0, 'LRA': 11}
SR = 48000


class NoStems(RuntimeError):
    """The job has no separate narration stem, so the music cannot be left out by remixing."""


def find_stems(job_dir, mix_dir=None):
    """(narration path, [sfx paths], mix folder) from the first mix folder that holds a narration stem."""
    for name in ([mix_dir] if mix_dir else MIX_DIRS):
        folder = (Path(job_dir) / name).resolve()
        voice = next((folder / n for n in NARRATION if (folder / n).exists()), None)
        if voice:
            return voice, sorted(folder.glob('sfx*.wav')), folder
    raise NoStems(f'{Path(job_dir).name}: no narration stem in {", ".join([mix_dir] if mix_dir else MIX_DIRS)}; '
                  'the music is baked in and needs a stem separation first')


def _video_md5(path):
    out = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-map', '0:v:0', '-c', 'copy', '-f', 'md5', '-'],
                         capture_output=True, text=True, check=True).stdout
    return out.strip().split('=')[-1]


def _sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def _fit(x, n):
    return x[:n] if len(x) >= n else np.pad(x, ((0, n - len(x)), (0, 0)))


def build(job, mix_dir=None, jobs=None):
    """Write the no-music exports of one job and a report; returns the report. Raises NoStems when it cannot."""
    job_dir = Path(jobs or JOBS) / job
    master_cut = job_dir / 'final.mp4'
    if not master_cut.exists():
        raise FileNotFoundError(f'{job}: final.mp4 is missing')
    voice_path, sfx_paths, folder = find_stems(job_dir, mix_dir)
    n = int(round(audio.probe_duration(str(master_cut)) * SR))
    voice = audio.decode(str(voice_path), sr=SR, channels=2)
    if len(voice) > n + SR // 2:
        raise ValueError(f'{job}: the narration ({len(voice) / SR:.2f} s) is longer than final.mp4 ({n / SR:.2f} s)')
    mix = _fit(voice, n).astype(np.float64)
    for p in sfx_paths:
        mix = mix + _fit(audio.decode(str(p), sr=SR, channels=2), n)
    work = job_dir / 'nomusic'
    work.mkdir(exist_ok=True)
    audio.write_wav(work / 'voice_sfx_unmastered.wav', mix, SR, seed=2011)
    mastering = audio.master(str(work / 'voice_sfx_unmastered.wav'), str(work / 'voice_sfx_master.wav'), **TARGET)
    report = {'job': job, 'rule': 'owner 2026-11-11: platform sound over the cut with no music bed',
              'stems': {'folder': str(folder), 'narration': voice_path.name, 'narration_sha256': _sha(voice_path),
                        'sfx': [p.name for p in sfx_paths], 'music': 'left out'},
              'narration': {'retimed': False, 'filtered': False, 'gain': 'whole-mix master only'},
              'mastering': mastering, 'exports': {}}
    for source, target in EXPORTS.items():
        src = job_dir / source
        if not src.exists():
            continue
        out = job_dir / target
        # apad + -shortest: the audio is padded with silence to the END OF THIS EXPORT'S VIDEO, so no frame is dropped
        # when an export's video stream runs a few milliseconds past the master (final_social / final_ig do)
        audio.run(['ffmpeg', '-y', '-hide_banner', '-nostats', '-i', str(src), '-i', str(work / 'voice_sfx_master.wav'),
                   '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-af', 'apad', '-c:a', 'aac', '-b:a', '192k',
                   '-ar', str(SR), '-shortest', '-movflags', '+faststart', str(out)])
        stats = audio.analyze(str(out))
        same_picture = _video_md5(src) == _video_md5(out)
        ok = same_picture and -14.7 <= stats['lufs'] <= -13.3 and stats['true_peak_dbtp'] <= -1.5 and not stats['clipped_samples']
        report['exports'][target] = {'from': source, 'bytes': out.stat().st_size, 'picture_identical': same_picture,
                                     'lufs': stats['lufs'], 'true_peak_dbtp': stats['true_peak_dbtp'],
                                     'duration_s': stats['duration_s'], 'pass': ok}
    report['pass'] = bool(report['exports']) and all(e['pass'] for e in report['exports'].values())
    (work / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
    return report


def status(queue=None, jobs=None):
    """Each queued (pending or scheduled) reel job on a sound platform: has the cut, can build it, or needs separation."""
    jobs = Path(jobs or JOBS)
    rows, seen = [], set()
    for e in json.loads(Path(queue or QUEUE).read_text())['entries']:
        job = e.get('job')
        if not job or job in seen or e.get('status') not in ('pending', 'scheduled'):
            continue
        if e['platform'] not in ('instagram', 'facebook', 'youtube', 'tiktok'):
            continue
        seen.add(job)
        job_dir = jobs / job
        if (job_dir / 'final_nomusic.mp4').exists():
            state = 'ready'
        else:
            try:
                find_stems(job_dir)
                state = 'buildable'
            except NoStems:
                state = 'needs_separation'
        rows.append({'job': job, 'keyword': e.get('keyword'), 'title': (e.get('title') or '')[:60], 'nomusic': state})
    return rows


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest='cmd', required=True)
    b = sub.add_parser('build')
    b.add_argument('job')
    b.add_argument('--from', dest='mix_dir', help='mix folder inside the job that holds the stems')
    sub.add_parser('status')
    args = parser.parse_args(argv)
    if args.cmd == 'status':
        json.dump(status(), sys.stdout, indent=2)
        print()
        return 0
    try:
        report = build(args.job, args.mix_dir)
    except NoStems as error:
        print(json.dumps({'job': args.job, 'error': str(error)}))
        return 2
    print(json.dumps({'job': report['job'], 'pass': report['pass'], 'exports': report['exports']}, indent=2))
    return 0 if report['pass'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
