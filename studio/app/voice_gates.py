"""Voice measurement gates, run after the master: pace, clipped words, top-end balance, sibilance.

    .venv/bin/python -m app.voice_gates <job_dir> [--strict]
    .venv/bin/python -m app.voice_gates --voice avatar_enhanced.mp4 [--master final.mp4] [--cuts cuts.json]
                                        [--source takes/v3.mp4] [--captions captions.json]

Prints a pass/fail table. It never raises unless --strict (or strict=True) and a gate fails, so a build always
finishes and the table tells the agent what to fix before the owner hears it.

Gates (targets from the voice brief and its critic review, job 09a9d211fff0):
- pause share 3-5 %: time in pauses of 150 ms or more over the speech span, on the voice stem. A pause is a stretch
  under the audibility line (32 dB under the stem's p95 10 ms level; the bed masks anything lower). Short sounds
  (a /t/ release) count as sound. Published reel: 12-21 %; human reference: 2-4 %.
- no clipped word endings: for every jump cut (on the source take), nothing audible was removed in the 150 ms after
  the word before it, nothing speech-level was removed at all, and the kept audio is inaudible in the 10 ms before
  the splice. Without the source, the stem must not be at speech level just before a splice.
- 8-16 kHz within +-2 dB of the reference profile: speech-frame power 8-16 kHz re 250 Hz-4 kHz.
- 5-9 kHz p99 not above the reference: p99 of the 10 ms 5-9 kHz level (esses) re integrated loudness.
"""
import argparse
import json
import math
import sys
from pathlib import Path

import numpy as np

from . import audio

SR = 48000

# Reference profile: the human reference reel (job 09a9d211fff0 source.mp4), measured 2026-10-17 with
# reference_profile() below (python -m app.voice_gates --reference <reel>). hf: its music bed (quietest 8 % of
# frames) subtracted first; sib: on the mix (the 5-9 kHz p99 frames are esses, the bed barely moves them).
# For scale on the same metrics: published C1 voice hf -23.8 / sib -6.6, chain C2 hf -18.8 / sib -2.9.
REFERENCE = {
    'hf_8_16k_re_250_4k_db': -22.36,
    'sib_5_9k_p99_re_lufs_db': -3.55,
}
PAUSE_SHARE = (0.03, 0.05)
PAUSE_MIN_MS = 150
HF_TOL_DB = 2.0
AUDIBLE_REL_DB = -32.0   # under the p95 level: masked by the bed (bed ~22 dB under the voice p95)
SPEECH_REL_DB = -26.0    # speech-level sound (a release burst, a quiet word)
TAIL_WINDOW_MS = 150


# ----------------------------------------------------------------------------- measurements

def _mono(path):
    return audio.decode(path, sr=SR, channels=1).reshape(-1)


def _levels(x, frame_ms):
    hop = int(SR * frame_ms / 1000)
    n = len(x) // hop
    return 10 * np.log10(np.mean(x[:n * hop].reshape(n, hop) ** 2, axis=1) + 1e-20)


def _bandpass(x, lo, hi):
    """FFT band-pass with 20 % linear skirts (zero phase, whole signal)."""
    spec = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    g = np.clip((f - lo * 0.9) / (lo * 0.2), 0, 1) * np.clip((hi * 1.1 - f) / (hi * 0.2), 0, 1)
    return np.fft.irfft(spec * g, len(x))


def pauses(x, rel_db=AUDIBLE_REL_DB, min_gap_ms=100, min_span_ms=20, min_pause_ms=PAUSE_MIN_MS):
    """Speech spans on 10 ms frames (threshold rel_db under the p95), the pauses between them, and their share."""
    from .tighten import speech_spans
    lv = _levels(x, 10)
    spans = speech_spans(lv, float(np.percentile(lv, 95)) + rel_db, min_gap_ms=min_gap_ms, min_span_ms=min_span_ms)
    if len(spans) < 2:
        return {'share': 0.0, 'count': 0, 'longest_ms': 0, 'span_s': 0.0, 'pauses_ms': [], 'spans': spans}
    gaps = [b[0] - a[1] for a, b in zip(spans, spans[1:])]
    span = spans[-1][1] - spans[0][0]
    big = [g for g in gaps if g >= min_pause_ms]
    return {'share': round(sum(big) / span, 4), 'count': len(big), 'longest_ms': max(gaps), 'span_s': round(span / 1000, 2),
            'pauses_ms': big, 'spans': spans}


def hf_balance(x, bed_subtract=False, nfft=4096, speech_rel_db=-20.0):
    """Speech-frame power in 8-16 kHz re 250 Hz-4 kHz, dB. Speech frames: within 20 dB of the p95 frame energy
    (a fixed distance from the loud level, so the answer does not move with the share of pauses; a top-40 %
    rule swung 6 dB between a take and its tightened copy). bed_subtract: remove the mean spectrum of the
    quietest 8 % of frames first (a music bed under a voice)."""
    hop = nfft // 4
    if len(x) < nfft:
        x = np.pad(x, (0, nfft - len(x)))
    frames = np.lib.stride_tricks.sliding_window_view(x, nfft)[::hop] * np.hanning(nfft)
    p = np.abs(np.fft.rfft(frames, axis=1)) ** 2
    e = 10 * np.log10(p.sum(axis=1) + 1e-20)
    sp = p[e > np.percentile(e, 95) + speech_rel_db].mean(axis=0)
    if bed_subtract:
        sp = np.maximum(sp - p[e < np.percentile(e, 8)].mean(axis=0), sp * 0.05)
    f = np.fft.rfftfreq(nfft, 1 / SR)
    band = lambda a, b: float(sp[(f >= a) & (f < b)].sum()) + 1e-30
    return round(10 * math.log10(band(8000, 16000) / band(250, 4000)), 2)


def sibilance_p99(x, lufs):
    """p99 of the 10 ms 5-9 kHz level over active frames (within 25 dB of the p90 broadband level), re the
    integrated loudness: how far the loudest esses stick out of the voice."""
    lb, ls = _levels(x, 10), _levels(_bandpass(x, 5000, 9000), 10)
    active = lb > np.percentile(lb, 90) - 25
    return round(float(np.percentile(ls[active], 99)) - lufs, 2)


def splice_checks(stem, cuts, source=None, speech_src=None):
    """Per jump cut, in dB re the p95 level. With the source take (the real test): the loudest removed audio in the
    TAIL_WINDOW_MS after the preceding word end (must be inaudible), anywhere in the removed span (must not be
    speech-level), and in the 10 ms of kept audio before the splice (the cut must not land mid-sound). Without
    it, only the stem's 10 ms before the splice (must not be speech-level). The audio after a splice is the next
    word's kept onset and is not judged. Levels are compared within one file: the voice chain compresses the stem,
    so stem-relative and take-relative dB are not interchangeable."""
    rows = []
    if source is None:
        lv = _levels(stem, 5)
        p95 = float(np.percentile(lv, 95))
        for c in cuts:
            at = c['at_ms']
            before = lv[max(0, (at - 10) // 5):max(0, at // 5)]
            db = round(float(before.max()) - p95, 1) if len(before) else None
            rows.append({'at_ms': at, 'splice_db': db, 'ok': db is None or db < SPEECH_REL_DB})
        return rows
    lv = _levels(source, 5)
    p95 = float(np.percentile(lv, 95))
    if speech_src is None:
        speech_src = pauses(source)['spans']
    for c in cuts:
        a, b = c['src_ms']
        ends = [e for _, e in speech_src if e <= a + 1]
        word_end = max(ends) if ends else a
        removed = lv[a // 5:b // 5]
        tail = lv[max(a, word_end) // 5:min(b, word_end + TAIL_WINDOW_MS) // 5]
        before = lv[max(0, (a - 10) // 5):a // 5]
        row = {'at_ms': c['at_ms'], 'src_ms': [a, b],
               'removed_db': round(float(removed.max()) - p95, 1) if len(removed) else None,
               'removed_tail_db': round(float(tail.max()) - p95, 1) if len(tail) else None,
               'splice_db': round(float(before.max()) - p95, 1) if len(before) else None}
        row['ok'] = ((row['removed_tail_db'] is None or row['removed_tail_db'] < AUDIBLE_REL_DB)
                     and (row['removed_db'] is None or row['removed_db'] < SPEECH_REL_DB)
                     and (row['splice_db'] is None or row['splice_db'] < AUDIBLE_REL_DB))
        rows.append(row)
    return rows


def reference_profile(path):
    """The REFERENCE constants, measured on a reference reel (voice + music bed)."""
    x = _mono(path)
    lufs = audio._ebur128(path)['lufs']
    return {'hf_8_16k_re_250_4k_db': hf_balance(x, bed_subtract=True), 'sib_5_9k_p99_re_lufs_db': sibilance_p99(x, lufs)}


# ----------------------------------------------------------------------------- gates

def run(voice, master=None, cuts=None, source=None, captions=None, speech_src=None, reference=None):
    """Measure the voice stem (and the master, the cut list and the source take when given). Returns rows:
    [{'gate', 'value', 'target', 'pass'}] (pass None = information only)."""
    ref = {**REFERENCE, **(reference or {})}
    x = _mono(voice)
    lufs = audio._ebur128(voice)['lufs']
    rows = []
    p = pauses(x)
    lo, hi = PAUSE_SHARE
    rows.append({'gate': 'pause share (pauses >= 150 ms)', 'value': f"{p['share'] * 100:.1f} % ({p['count']} pauses)",
                 'target': f'{lo * 100:.0f}-{hi * 100:.0f} %', 'pass': lo <= p['share'] <= hi})
    if cuts is not None:
        checks = splice_checks(x, cuts, _mono(source) if source else None, speech_src)
        bad = [c for c in checks if not c['ok']]
        worst = max((c.get('removed_tail_db') or -99 for c in checks), default=None)
        rows.append({'gate': 'no clipped word endings', 'value': f'{len(bad)} of {len(checks)} cuts'
                     + (f', loudest removed tail {worst:+.0f} dB' if worst not in (None, -99) else ''),
                     'target': f'0 (removed tail < {AUDIBLE_REL_DB:.0f} dB re p95)', 'pass': not bad,
                     'detail': checks})
    hf = hf_balance(x)
    if ref['hf_8_16k_re_250_4k_db'] is not None:
        d = hf - ref['hf_8_16k_re_250_4k_db']
        rows.append({'gate': '8-16 kHz vs reference', 'value': f'{d:+.1f} dB ({hf:.1f})', 'target': f'+-{HF_TOL_DB:.0f} dB',
                     'pass': abs(d) <= HF_TOL_DB})
    sib = sibilance_p99(x, lufs)
    if ref['sib_5_9k_p99_re_lufs_db'] is not None:
        d = sib - ref['sib_5_9k_p99_re_lufs_db']
        rows.append({'gate': '5-9 kHz p99 vs reference', 'value': f'{d:+.1f} dB ({sib:.1f} re LUFS)', 'target': '<= 0 dB',
                     'pass': d <= 0.0})
    rows.append({'gate': 'longest pause', 'value': f"{p['longest_ms']} ms", 'target': 'ref 340-360 ms', 'pass': None})
    if captions:
        words = sum(1 for c in captions if c.get('text', '').strip())
        rows.append({'gate': 'pace', 'value': f"{words / max(p['span_s'], 1e-3) * 60:.0f} wpm", 'target': 'ref 262 wpm',
                     'pass': None})
    if master:
        m = audio._ebur128(master)
        rows.append({'gate': 'master loudness', 'value': f"{m['lufs']:.1f} LUFS / {m['true_peak_dbtp']:.1f} dBTP / LRA {m['lra']:.1f}",
                     'target': '-14 LUFS / <= -1 dBTP', 'pass': None})
    return rows


def table(rows):
    w = max(len(r['gate']) for r in rows)
    wv = max(len(str(r['value'])) for r in rows)
    lines = [f"{'gate'.ljust(w)}  {'measured'.ljust(wv)}  {'target'.ljust(24)}  result"]
    for r in rows:
        res = 'info' if r['pass'] is None else ('PASS' if r['pass'] else 'FAIL')
        lines.append(f"{r['gate'].ljust(w)}  {str(r['value']).ljust(wv)}  {r['target'].ljust(24)}  {res}")
    return '\n'.join(lines)


class GateFailure(RuntimeError):
    pass


def check(voice, strict=False, out=sys.stderr, **kw):
    rows = run(voice, **kw)
    print(table(rows), file=out)
    failed = [r['gate'] for r in rows if r['pass'] is False]
    if strict and failed:
        raise GateFailure('voice gates failed: ' + ', '.join(failed))
    return {'rows': rows, 'failed': failed}


def check_job(job_dir, strict=False, out=sys.stderr):
    """Gates for a built job: avatar_enhanced.mp4 (voice stem), final.mp4, cuts.json, captions.json."""
    job = Path(job_dir)
    cuts = json.loads((job / 'cuts.json').read_text()) if (job / 'cuts.json').exists() else None
    source = None
    if cuts and cuts.get('source') and Path(cuts['source']).exists():
        source = cuts['source']
    caps = json.loads((job / 'captions.json').read_text()) if (job / 'captions.json').exists() else None
    master = job / 'final.mp4' if (job / 'final.mp4').exists() else None
    return check(job / 'avatar_enhanced.mp4', strict=strict, out=out, master=master,
                 cuts=cuts['cuts'] if cuts else None, source=source, captions=caps)


def main(argv=None):
    ap = argparse.ArgumentParser(prog='python -m app.voice_gates', description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('job', nargs='?')
    ap.add_argument('--voice')
    ap.add_argument('--master')
    ap.add_argument('--cuts', help='cuts.json written by app.tighten')
    ap.add_argument('--source', help='the untightened take (for the removed-audio check)')
    ap.add_argument('--captions')
    ap.add_argument('--strict', action='store_true', help='exit 1 when a gate fails')
    ap.add_argument('--reference', help='print the reference profile of this reel and exit')
    a = ap.parse_args(argv)
    if a.reference:
        print(json.dumps(reference_profile(a.reference), indent=1))
        return 0
    try:
        if a.job and not a.voice:
            res = check_job(a.job, strict=a.strict, out=sys.stdout)
        else:
            cuts = json.loads(Path(a.cuts).read_text()) if a.cuts else None
            caps = json.loads(Path(a.captions).read_text()) if a.captions else None
            res = check(a.voice, strict=a.strict, out=sys.stdout, master=a.master, cuts=cuts['cuts'] if cuts else None,
                        source=a.source or (cuts or {}).get('source'), captions=caps)
    except GateFailure as e:
        print(e, file=sys.stderr)
        return 1
    return 0 if not (a.strict and res['failed']) else 1


if __name__ == '__main__':
    sys.exit(main())
