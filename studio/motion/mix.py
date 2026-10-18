"""Sound for a motion reel (no voice): an original music bed plus SFX cues, muxed onto the silent render and mastered
to -14 LUFS / -1 dBTP. Everything is synthesized by app.audio (no samples), so the track is ours to publish.

  cd studio && .venv/bin/python motion/mix.py motion/<project>/sound.json <silent.mp4> <out.mp4>

sound.json: {"duration_s": 29.25, "music": {"style": "glow", "bpm": 80, "seed": 11, "gain": 1.0},
             "sfx": [{"kind": "whoosh", "at": 2.6, "gain": 0.5}, {"kind": "tick", "at": [3.55, 4.3], "gain": 0.25}]}
A cue's "at" may be a list: the same sound at each time.
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app import audio  # noqa: E402


def build(spec, silent, out):
    duration = float(spec['duration_s'])
    m = spec['music']
    bed = audio.make_music(m['style'], duration, bpm=m.get('bpm'), seed=m.get('seed', 7)) * float(m.get('gain', 1.0))
    mix = np.zeros((max(len(bed), int(round(duration * audio.SR))), 2))
    mix[:len(bed)] += bed
    sounds = {}
    for cue in spec.get('sfx', []):
        kind = cue['kind']
        if kind not in sounds:
            sounds[kind] = audio.make_sfx(kind)
        for at in cue['at'] if isinstance(cue['at'], list) else [cue['at']]:
            audio.place(mix, sounds[kind], float(at), gain=float(cue.get('gain', 0.4)), pan=float(cue.get('pan', 0.0)))
    peak = float(np.max(np.abs(mix))) or 1.0
    if peak > 0.98:
        mix *= 0.98 / peak
    with tempfile.TemporaryDirectory() as tmp:
        wav, muxed = Path(tmp) / 'mix.wav', Path(tmp) / 'muxed.mp4'
        audio.write_wav(wav, mix)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(silent), '-i', str(wav), '-map', '0:v:0', '-map', '1:a:0',
                        '-c:v', 'copy', '-c:a', 'pcm_s16le', '-t', f'{duration:.3f}', str(muxed).replace('.mp4', '.mov')],
                       check=True)
        return audio.master(str(muxed).replace('.mp4', '.mov'), str(out))


if __name__ == '__main__':
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    spec_path, silent, out = sys.argv[1:]
    print(json.dumps(build(json.loads(Path(spec_path).read_text()), silent, out)['output']))
