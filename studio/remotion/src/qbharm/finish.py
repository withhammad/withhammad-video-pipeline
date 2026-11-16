"""Finish the Quran Beat "Has harm touched you?" reel (QB-HARM): put public/audio.wav (1 s of silence, then Mishary Alafasy's
whole Yunus 10:107 from everyayah.com, untouched but for gain; no music) under the Remotion picture as PCM, through a safety
limiter (alimiter latency=true, so its lookahead is compensated and nothing shifts), padded with silence for the end card,
then app.audio.master(TP=-1.5) to H.264 + AAC, and cut the 720p review copy under 2.6 MB.
Run from studio/: .venv/bin/python remotion/src/qbharm/finish.py <render dir> <duration s>  (video.mp4 in, master.mp4 +
preview720.mp4 out). LIMIT (dBFS ceiling of the safety limiter) can be set in the environment; default -2.2."""
import json, os, subprocess, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
from app import audio  # noqa: E402

r, DUR = Path(sys.argv[1]), float(sys.argv[2])
pub = Path(__file__).resolve().parents[3] / '.local/jobs/qb-DfsFqEpxneY/qb/public'
lim = 10 ** (float(os.environ.get('LIMIT', '-2.2')) / 20)
run = lambda *a: subprocess.run(a, check=True, capture_output=True, text=True)
run('ffmpeg', '-y', '-v', 'error', '-i', str(r / 'video.mp4'), '-i', str(pub / 'audio.wav'), '-map', '0:v', '-map', '1:a',
    '-c:v', 'copy', '-af', f'alimiter=limit={lim:.4f}:level=false:latency=true:attack=1:release=50,apad=whole_dur={DUR}',
    '-c:a', 'pcm_s16le', '-ar', '44100', '-t', str(DUR), str(r / 'premaster.mov'))
m = audio.master(str(r / 'premaster.mov'), str(r / 'master.mp4'), TP=-1.5)
print(json.dumps(m, indent=1))
assert m['normalization_type'] == 'linear', 'loudnorm fell back to dynamic: lower the limiter ceiling (LIMIT)'
# 720p review copy: two-pass x264 to a 2.15 MB budget, AAC 64k
dur = float(run('ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(r / 'master.mp4')).stdout)
vk = int((2.15 * 8 * 1024 * 1024 / dur - 64000) / 1000)
common = ['-vf', 'scale=720:1280:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-b:v', f'{vk}k', '-pix_fmt', 'yuv420p',
          '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709']
run('ffmpeg', '-y', '-v', 'error', '-i', str(r / 'master.mp4'), *common, '-pass', '1', '-passlogfile', str(r / 'p720'), '-an', '-f', 'mp4', '/dev/null')
run('ffmpeg', '-y', '-v', 'error', '-i', str(r / 'master.mp4'), *common, '-pass', '2', '-passlogfile', str(r / 'p720'),
    '-c:a', 'aac', '-b:a', '64k', '-af', 'alimiter=limit=0.89:level=false:latency=true', '-movflags', '+faststart', str(r / 'preview720.mp4'))
print('preview', (r / 'preview720.mp4').stat().st_size / 1e6, 'MB')
