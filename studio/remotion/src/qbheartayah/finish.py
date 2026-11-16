"""Finish the Quran Beat "Heart and ayah" reel: put the reference's own stereo track (public/audio.wav: the phone tap and
the recitation of al-Hijr 15:97-98, one reciter, no music, untouched but for gain) under the Remotion picture as PCM, through
an idle safety limiter at -1.5 dBFS (alimiter latency=true, so its lookahead is compensated and nothing shifts), padded with
silence for the 3.3 s end card, then app.audio.master(TP=-1.5) to H.264 + AAC (the track is -14.1 LUFS / -4.6 dBTP, so the
master is a linear +0.1 dB), and cut the 720p review copy under 2.5 MB.
Run from studio/: .venv/bin/python remotion/src/qbheartayah/finish.py <render dir>  (video.mp4 in, master.mp4 + preview720.mp4 out)."""
import json, subprocess, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
from app import audio  # noqa: E402

r = Path(sys.argv[1])
pub = Path(__file__).resolve().parents[3] / '.local/jobs/qb-DfU-34WRzIF/qb/public'
DUR = 29.0
run = lambda *a: subprocess.run(a, check=True, capture_output=True, text=True)
run('ffmpeg', '-y', '-v', 'error', '-i', str(r / 'video.mp4'), '-i', str(pub / 'audio.wav'), '-map', '0:v', '-map', '1:a',
    '-c:v', 'copy', '-af', f'alimiter=limit=0.8414:level=false:latency=true:attack=1:release=50,apad=whole_dur={DUR}', '-c:a', 'pcm_s16le',
    '-ar', '44100', '-t', str(DUR), str(r / 'premaster.mov'))
print(json.dumps(audio.master(str(r / 'premaster.mov'), str(r / 'master.mp4'), TP=-1.5), indent=1))
# 720p review copy: two-pass x264 to a 2.15 MB budget, AAC 64k
dur = float(run('ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(r / 'master.mp4')).stdout)
vk = int((2.15 * 8 * 1024 * 1024 / dur - 64000) / 1000)
common = ['-vf', 'scale=720:1280:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-b:v', f'{vk}k', '-pix_fmt', 'yuv420p',
          '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709']
run('ffmpeg', '-y', '-v', 'error', '-i', str(r / 'master.mp4'), *common, '-pass', '1', '-passlogfile', str(r / 'p720'), '-an', '-f', 'mp4', '/dev/null')
run('ffmpeg', '-y', '-v', 'error', '-i', str(r / 'master.mp4'), *common, '-pass', '2', '-passlogfile', str(r / 'p720'),
    '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart', str(r / 'preview720.mp4'))
print('preview', (r / 'preview720.mp4').stat().st_size / 1e6, 'MB')
