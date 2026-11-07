"""Split one HeyGen take per speaker (take/heygen_H.mp3, take/heygen_C.mp3) into take/lines/<line id>.wav.
Each take reads that speaker's script.json lines in order joined with ' ... '. Whisper word timings, aligned to the script
words, give each line's span; cuts sit in the pause between lines. Run with the studio venv."""
import json, re, subprocess, difflib, sys
from pathlib import Path
import numpy as np
from faster_whisper import WhisperModel
HERE = Path(__file__).resolve().parent; T = HERE / "take"
norm = lambda w: re.sub(r"[^a-z0-9]", "", w.lower().replace("3d", "threed"))
lines = json.loads((HERE / "script.json").read_text())["lines"]
m = WhisperModel("small.en", device="cpu", compute_type="int8")
for who in "HC":
    src = T / f"heygen_{who}.mp3"
    pcm = np.frombuffer(subprocess.check_output(["ffmpeg", "-v", "error", "-i", str(src), "-f", "f32le", "-ac", "1", "-ar", "16000", "-"]), dtype=np.float32)
    dur = len(pcm) / 16000
    segs, _ = m.transcribe(pcm, word_timestamps=True, language="en", initial_prompt="Claude, ElevenLabs, voxel, Blender, 3D")
    heard = [w for s in segs for w in s.words]
    mine = [l for l in lines if l["who"] == who]
    sw = [(li, norm(w)) for li, l in enumerate(mine) for w in l["text"].split()]
    hn = [norm(w.word).replace("3d", "threed") for w in heard]
    sm = difflib.SequenceMatcher(a=[x[1] for x in sw], b=hn, autojunk=False)
    span = {}
    for b in sm.get_matching_blocks():
        for k in range(b.size):
            li = sw[b.a + k][0]; w = heard[b.b + k]
            s, e = span.get(li, (w.start, w.end)); span[li] = (min(s, w.start), max(e, w.end))
    print(who, f"{dur:.2f}s", "heard:", " ".join(w.word.strip() for w in heard), file=sys.stderr)
    for li, l in enumerate(mine):
        s, e = span[li]
        prev_e = span[li - 1][1] if li else 0.0
        nxt_s = span[li + 1][0] if li + 1 < len(mine) else dur
        a = max(prev_e + (s - prev_e) * 0.5, s - 0.08); b = min(e + (nxt_s - e) * 0.5, e + 0.15)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-ar", "48000", "-ac", "1",
                        str(T / "lines" / f"{l['id']}.wav")], check=True)
        print(f"  {l['id']:8s} {a:6.2f}-{b:6.2f}  {l['text']}", file=sys.stderr)
