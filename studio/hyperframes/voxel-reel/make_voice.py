#!/usr/bin/env python3
"""Build the two-character voice track + word timings for the voxel reel.

    python3 make_voice.py standin            # macOS `say` stand-in (Rishi = Hammad, Samantha = Claude)
    python3 make_voice.py take --lines DIR    # real voices: DIR/<line id>.wav (ElevenLabs, one file per line)

Writes <out>/voice.wav (48 kHz mono), <out>/words.json [{w,s,e,who,line}], <out>/lines.json and
hf/data.js (window.REEL) so the HyperFrames scene re-times itself on the new words. Run with the studio venv.
"""
import argparse, json, re, subprocess, sys, difflib
from pathlib import Path

HERE = Path(__file__).resolve().parent
SR = 48000
STANDIN = {"H": ("Rishi", 205), "C": ("Samantha", 215)}
GAP_SAME, GAP_SWAP, LEAD, TAIL = 0.10, 0.16, 0.12, 2.6  # TAIL: CTA hold after the last word


def sh(*a):
    subprocess.run(a, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def norm(w):
    w = w.lower().replace("3d", "three d").replace("elevenlabs", "eleven labs")
    return re.sub(r"[^a-z0-9 ]", "", w)


def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                          "-of", "csv=p=0", str(p)]).decode())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--lines", help="dir with <id>.wav per line (real voices)")
    a = ap.parse_args()
    out = HERE / a.out
    (out / "lines").mkdir(parents=True, exist_ok=True)
    script = json.loads((HERE / "script.json").read_text())

    from faster_whisper import WhisperModel
    model = WhisperModel("small.en", device="cpu", compute_type="int8")

    words, lines, parts, t, prev = [], [], [], LEAD, None
    for ln in script["lines"]:
        wav = out / "lines" / f"{ln['id']}.wav"
        if a.lines:
            src = Path(a.lines) / f"{ln['id']}.wav"
        else:
            voice, rate = STANDIN[ln["who"]]
            src = out / "lines" / f"{ln['id']}.aiff"
            sh("say", "-v", voice, "-r", str(rate), "-o", str(src), ln["text"].replace("VOXEL", "voxel"))
        # trim leading/trailing silence, 48k mono
        sh("ffmpeg", "-y", "-i", str(src), "-af",
           "silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
           "silenceremove=start_periods=1:start_threshold=-45dB,areverse,apad=pad_dur=0.02",
           "-ar", str(SR), "-ac", "1", str(wav))
        if prev is not None:
            t += GAP_SAME if prev == ln["who"] else GAP_SWAP
        d = dur(wav)
        import numpy as np
        pcm = np.frombuffer(subprocess.check_output(["ffmpeg","-v","error","-i",str(wav),"-f","f32le","-ac","1","-ar","16000","-"]), dtype=np.float32)
        segs, _ = model.transcribe(pcm, word_timestamps=True, language="en",
                                   initial_prompt="Claude, ElevenLabs, voxel, Blender, 3D")
        heard = [w for s in segs for w in s.words]
        disp = ln["text"].split()
        # align display words to heard words on normalised tokens
        hn = [norm(w.word).strip() for w in heard]
        dn = [norm(w).strip() for w in disp]
        times = [None] * len(disp)
        sm = difflib.SequenceMatcher(a=dn, b=hn, autojunk=False)
        for blk in sm.get_matching_blocks():
            for k in range(blk.size):
                times[blk.a + k] = (heard[blk.b + k].start, heard[blk.b + k].end)
        # "3D" -> "three d" etc.: fall back to char-length interpolation between anchors
        n = len(disp)
        for i in range(n):
            if times[i] is None:
                lo = next((times[j][1] for j in range(i - 1, -1, -1) if times[j]), 0.0)
                hi_i = next((j for j in range(i + 1, n) if times[j]), None)
                hi = times[hi_i][0] if hi_i is not None else d
                gap = [k for k in range(i, hi_i if hi_i is not None else n) if times[k] is None]
                tot = sum(len(disp[k]) for k in gap) or 1
                c = lo
                for k in gap:
                    step = (hi - lo) * len(disp[k]) / tot
                    times[k] = (c, c + step)
                    c += step
        for w, (s, e) in zip(disp, times):
            words.append({"w": w, "s": round(t + s, 3), "e": round(t + e, 3), "who": ln["who"], "line": ln["id"]})
        lines.append({"id": ln["id"], "who": ln["who"], "s": round(t, 3), "e": round(t + d, 3), "text": ln["text"]})
        parts.append((t, wav))
        t += d
        prev = ln["who"]
        print(f"{ln['id']:8s} {ln['who']} {d:5.2f}s  heard: {' '.join(w.word.strip() for w in heard)}", file=sys.stderr)

    for i, x in enumerate(words):  # a clipped last-word timing (e.g. 0.02 s) would flash its caption
        if x["e"] - x["s"] < 0.08:
            nxt = words[i + 1]["s"] if i + 1 < len(words) and words[i + 1]["line"] == x["line"] else x["s"] + 0.35
            x["e"] = round(min(nxt, x["s"] + 0.35), 3)
    total = round(t + TAIL, 3)
    # mix lines at their offsets
    inputs, filt = [], []
    for i, (off, wav) in enumerate(parts):
        inputs += ["-i", str(wav)]
        filt.append(f"[{i}]adelay={int(off*1000)}:all=1[a{i}]")
    filt.append("".join(f"[a{i}]" for i in range(len(parts))) + f"amix=inputs={len(parts)}:normalize=0,apad=whole_dur={total}[o]")
    subprocess.run(["ffmpeg", "-y", *inputs, "-filter_complex", ";".join(filt), "-map", "[o]",
                    "-ar", str(SR), "-ac", "1", "-t", str(total), str(out / "voice.wav")],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    (out / "words.json").write_text(json.dumps(words, indent=1))
    (out / "lines.json").write_text(json.dumps(lines, indent=1))
    reel = {"duration": total, "fps": 30, "standin": not a.lines, "keyword": script["keyword"],
            "words": words, "lines": lines}
    (HERE / "hf" / "data.js").write_text("window.REEL = " + json.dumps(reel) + ";\n")
    html = HERE / "hf" / "index.html"
    html.write_text(re.sub(r'data-duration="[0-9.]+"', f'data-duration="{total}"', html.read_text(), count=1))
    print(json.dumps({"duration": total, "words": len(words), "lines": len(lines)}))


if __name__ == "__main__":
    main()
