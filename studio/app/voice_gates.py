"""Voice measurement gates, run after the master: pace, clipped words, top-end balance, sibilance.

    .venv/bin/python -m app.voice_gates <job_dir> [--strict]
    .venv/bin/python -m app.voice_gates --voice avatar_enhanced.mp4 [--master final.mp4] [--cuts cuts.json]
                                        [--source takes/v3.mp4] [--captions captions.json]

Prints a pass/fail table. It never raises unless --strict (or strict=True) and a gate fails, so a build always
finishes and the table tells the agent what to fix before the owner hears it.

Gates (targets from the voice brief and its critic review, job 09a9d211fff0):
- pause share 3-5 %: time in pauses of 150 ms or more over the speech span, measured on the voice stem with the
  brief's own VAD (audio.voice_activity: 10 ms RMS over -40 dBFS on the -19 LUFS stem, gaps under 100 ms bridged,
  spans under 60 ms dropped, so a lone release burst does not split a pause). The brief's numbers are in this
  metric: published REA reel 20.7 %, human reference 2-4 %. (The first gate used a looser VAD that read 0.55-0.6x
  of this one: a reel matching the reference would have failed its lower bound.) Longest pause and pace use it too.
- no clipped word endings, judged on what the listener hears, per jump cut:
  * on the voice stem: the 10 ms either side of the audio splice is inaudible (broadband under the line 30 dB below
    the stem's p95, 2.5-12 kHz under the line 48 dB below it: app.tighten's audibility lines, from the bed);
  * on the source take rendered through the same voice chain (with --source / cuts.json 'source'): nothing audible
    was removed in the 150 ms after the word end (broadband or 2.5-12 kHz, so weak fricatives and breath count),
    nothing at speech level was removed at all (raw take, 26 dB under its p95), and both splices are inaudible.
- 8-16 kHz within +-2 dB of the reference profile: speech-frame power 8-16 kHz re 250 Hz-4 kHz.
- 5-9 kHz p99 not above the reference: p99 of the 10 ms 5-9 kHz level (esses) re integrated loudness.
"""
import argparse
import json
import math
import sys
from pathlib import Path

import numpy as np

from . import audio, tighten

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
VAD_DBFS = -40.0          # audio.voice_activity default, on a stem at audio.VOICE_LUFS
VAD_MIN_GAP_MS = 100      # the brief's setting (voice_activity's default is 120)
HF_TOL_DB = 2.0
TAIL_WINDOW_MS = 150
SPLICE_MS = 10


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


def pause_stats(spans, min_pause_ms=PAUSE_MIN_MS):
    """Share of the speech span (first onset to last offset) spent in gaps of min_pause_ms or more."""
    spans = [tuple(s) for s in spans]
    if len(spans) < 2:
        return {'share': 0.0, 'count': 0, 'longest_ms': 0, 'span_s': 0.0, 'pauses_ms': [], 'spans': spans}
    gaps = [b[0] - a[1] for a, b in zip(spans, spans[1:])]
    span = spans[-1][1] - spans[0][0]
    big = [g for g in gaps if g >= min_pause_ms]
    return {'share': round(sum(big) / span, 4), 'count': len(big), 'longest_ms': max(gaps), 'span_s': round(span / 1000, 2),
            'pauses_ms': big, 'spans': spans}


def stem_pauses(path, min_pause_ms=PAUSE_MIN_MS):
    """Pauses exactly the way the voice brief measured them: audio.voice_activity at a fixed -40 dBFS, gaps under
    100 ms bridged, spans under 60 ms dropped. The threshold is not moved with the stem's loudness: on the REA job a
    0.2 dB shift turned the old reel's 20.6 % (longest 840 ms) into 19.2 % (640 ms). enhance_voice() leaves every
    stem at audio.VOICE_LUFS (-19, measured -19.0 / -19.2), which is what the metric was set at; run() flags a stem
    more than 1 dB away."""
    spans = audio.voice_activity(path, threshold_dbfs=VAD_DBFS, min_gap_ms=VAD_MIN_GAP_MS)
    return pause_stats(spans, min_pause_ms)


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


def _over(aud, a_ms, b_ms):
    """Loudest frame in [a_ms, b_ms) over the broadband and the 2.5-12 kHz audibility lines (dB; > 0 = audible)."""
    i, j = max(0, int(math.floor(a_ms / 5))), max(0, int(math.ceil(b_ms / 5)))
    if j <= i or i >= len(aud['lv']):
        return None, None
    return (round(float(aud['lv'][i:j].max()) - aud['bb_line'], 1), round(float(aud['hf'][i:j].max()) - aud['hf_line'], 1))


def _audible(*pairs):
    return any(v is not None and v > 0 for pair in pairs for v in pair)


def splice_checks(stem, cuts, source=None, source_chain=None):
    """Per jump cut: the stem's 10 ms either side of the audio splice (must be inaudible), and with the source take
    (raw mono on the video clock + the same take through the voice chain): the loudest removed audio in the
    TAIL_WINDOW_MS after the word end (must be inaudible), anywhere in the removed span (must not be speech-level),
    and the kept audio either side of the splice on the source (inaudible). Audibility is app.tighten's: broadband
    and 2.5-12 kHz lines relative to each signal's own p95, so the chain's gain and compression are accounted for.
    Values are dB over the line (> 0 = audible); the speech check is dB re the raw take's p95."""
    aud_stem = tighten.audibility(stem)
    aud_src = tighten.audibility(source_chain) if source_chain is not None else None
    lv_raw = tighten.levels_db(source, 5) if source is not None else None
    p95_raw = float(np.percentile(lv_raw, 95)) if lv_raw is not None else None
    rows = []
    for c in cuts:
        at = c.get('audio_at_ms', c['at_ms'])
        stem_bb, stem_hf = _over(aud_stem, at - SPLICE_MS, at + SPLICE_MS)
        row = {'at_ms': c['at_ms'], 'audio_at_ms': at, 'stem_splice_over_db': [stem_bb, stem_hf]}
        bad = _audible((stem_bb, stem_hf))
        if aud_src is not None:
            a, b = c.get('audio_src_ms', c.get('src_ms'))
            end = c.get('word_end_ms', a)
            t0, t1 = max(a, end), min(b, end + TAIL_WINDOW_MS)
            tail = _over(aud_src, t0, t1) if t1 > t0 else (None, None)
            splice = [_over(aud_src, a - SPLICE_MS, a), _over(aud_src, b, b + SPLICE_MS)]
            removed = lv_raw[int(a // 5):int(math.ceil(b / 5))]
            row.update(src_ms=[a, b], word_end_ms=end, removed_tail_over_db=list(tail),
                       src_splice_over_db=[list(s) for s in splice],
                       removed_speech_db=round(float(removed.max()) - p95_raw, 1) if len(removed) else None)
            bad = bad or _audible(tail, *splice) or (row['removed_speech_db'] is not None
                                                     and row['removed_speech_db'] > tighten.LOUD_REL_DB)
        row['ok'] = not bad
        rows.append(row)
    return rows


def reference_profile(path):
    """The REFERENCE constants, measured on a reference reel (voice + music bed)."""
    x = _mono(path)
    lufs = audio._ebur128(path)['lufs']
    return {'hf_8_16k_re_250_4k_db': hf_balance(x, bed_subtract=True), 'sib_5_9k_p99_re_lufs_db': sibilance_p99(x, lufs)}


# ----------------------------------------------------------------------------- gates

def run(voice, master=None, cuts=None, source=None, captions=None, reference=None, av_offset_ms=0.0):
    """Measure the voice stem (and the master, the cut list and the source take when given). Returns rows:
    [{'gate', 'value', 'target', 'pass'}] (pass None = information only). av_offset_ms: the lip-sync correction
    app.tighten applied (cuts.json "av_offset_ms"): its source times are on the corrected sound, so the source take
    is shifted the same way before the removed audio is measured (unshifted, a -100 ms HeyGen job compared every
    splice 100 ms off and flagged speech as removed tails)."""
    ref = {**REFERENCE, **(reference or {})}
    x = _mono(voice)
    lufs = audio._ebur128(str(voice))['lufs']
    rows = []
    p = stem_pauses(voice)
    lo, hi = PAUSE_SHARE
    off = f' [stem at {lufs:.1f} LUFS, metric set at {audio.VOICE_LUFS:g}]' if abs(lufs - audio.VOICE_LUFS) > 1 else ''
    rows.append({'gate': 'pause share (pauses >= 150 ms)', 'value': f"{p['share'] * 100:.1f} % ({p['count']} pauses){off}",
                 'target': f'{lo * 100:.0f}-{hi * 100:.0f} %', 'pass': lo <= p['share'] <= hi, 'detail': p['pauses_ms']})
    if cuts is not None:
        src = src_chain = None
        if source:
            v_start = tighten.probe(source)['v_start']
            src = tighten.decode_on_video_clock(source, v_start)
            src_chain = audio.voice_chain_pcm(source)[int(round(v_start * SR)):]
            if av_offset_ms:
                src, src_chain = tighten.shift_pcm(src, av_offset_ms), tighten.shift_pcm(src_chain, av_offset_ms)
        checks = splice_checks(x, cuts, src, src_chain)
        bad = [c for c in checks if not c['ok']]
        tails = [v for c in checks for v in (c.get('removed_tail_over_db') or []) if v is not None]
        splices = [v for c in checks for v in c['stem_splice_over_db'] if v is not None]
        value = f'{len(bad)} of {len(checks)} cuts'
        if splices:
            value += f', stem splices {max(splices):+.0f} dB'
        if tails:
            value += f', removed tails {max(tails):+.0f} dB'
        rows.append({'gate': 'no clipped word endings', 'value': value + (' (re audible line)' if splices else ''),
                     'target': '0 (all < 0 dB re line)' + ('' if source else ', stem only'), 'pass': not bad,
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
        rows.append({'gate': 'pace', 'value': f"{words / max(p['span_s'], 1e-3) * 60:.0f} wpm ({words} words / {p['span_s']} s)",
                     'target': 'ref 262 wpm', 'pass': None})
    if master:
        m = audio._ebur128(str(master))
        rows.append({'gate': 'master loudness', 'value': f"{m['lufs']:.1f} LUFS / {m['true_peak_dbtp']:.1f} dBTP / LRA {m['lra']:.1f}",
                     'target': '-14 LUFS / <= -1 dBTP', 'pass': None})
    return rows


def table(rows):
    w = max(len(r['gate']) for r in rows)
    wv = max(len(str(r['value'])) for r in rows)
    wt = max(len(r['target']) for r in rows)
    lines = [f"{'gate'.ljust(w)}  {'measured'.ljust(wv)}  {'target'.ljust(wt)}  result"]
    for r in rows:
        res = 'info' if r['pass'] is None else ('PASS' if r['pass'] else 'FAIL')
        lines.append(f"{r['gate'].ljust(w)}  {str(r['value']).ljust(wv)}  {r['target'].ljust(wt)}  {res}")
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
                 cuts=cuts['cuts'] if cuts else None, source=source, captions=caps,
                 av_offset_ms=float((cuts or {}).get('av_offset_ms') or 0.0))


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
                        source=a.source or (cuts or {}).get('source'), captions=caps,
                        av_offset_ms=float((cuts or {}).get('av_offset_ms') or 0.0))
    except GateFailure as e:
        print(e, file=sys.stderr)
        return 1
    return 0 if not (a.strict and res['failed']) else 1


if __name__ == '__main__':
    sys.exit(main())
