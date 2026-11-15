"""Finish the Quran Beat "Khalid's letter" reel: put the reference's own stereo track (public/audio.wav, untouched but
for gain) under the Remotion picture as PCM with an idle safety limiter at -1.5 dBFS, master it with
app.audio.master(TP=-1.5) to H.264 + AAC, and cut the 720p review copy under 2.5 MB.
Run from studio/: .venv/bin/python ../studio/remotion/src/qbkhalid/finish.py <render dir>  (video.mp4 in, master.mp4 +
preview720.mp4 out)."""
import json, subprocess, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
from app import audio  # noqa: E402

r = Path(sys.argv[1])
pub = Path(__file__).resolve().parents[3] / '.local/jobs/9c7bf4378ac0/qb/public'
run = lambda *a: subprocess.run(a, check=True, capture_output=True, text=True)
run('ffmpeg', '-y', '-v', 'error', '-i', str(r / 'video.mp4'), '-i', str(pub / 'audio.wav'), '-map', '0:v', '-map', '1:a',
    '-c:v', 'copy', '-af', 'alimiter=limit=0.8414:level=false:latency=true:attack=1:release=50,apad=whole_dur=35.6', '-c:a', 'pcm_s16le',
    '-ar', '48000', '-t', '35.6', str(r / 'premaster.mov'))
print(json.dumps(audio.master(str(r / 'premaster.mov'), str(r / 'master.mp4'), TP=-1.5), indent=1))
# 720p review copy: two-pass x264 to a 2.3 MB budget (35.6 s), AAC 64k
dur = float(run('ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(r / 'master.mp4')).stdout)
vk = int((2.3 * 8 * 1024 * 1024 / dur - 64000) / 1000)
common = ['-vf', 'scale=720:1280:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-b:v', f'{vk}k', '-pix_fmt', 'yuv420p',
          '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709']
run('ffmpeg', '-y', '-v', 'error', '-i', str(r / 'master.mp4'), *common, '-pass', '1', '-passlogfile', str(r / 'p720'), '-an', '-f', 'mp4', '/dev/null')
run('ffmpeg', '-y', '-v', 'error', '-i', str(r / 'master.mp4'), *common, '-pass', '2', '-passlogfile', str(r / 'p720'),
    '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart', str(r / 'preview720.mp4'))
print('preview', (r / 'preview720.mp4').stat().st_size / 1e6, 'MB')
