"""Jump-cut HeyGen's dead air: shorten every pause, cutting picture and sound together, in one ffmpeg pass.

HeyGen's TTS leaves a 250-640 ms silence at almost every full stop, and the edit used to keep all of them: 13-20 % of
the reel was dead air (the human reference: 2-4 %) and the pace fell to 196 wpm (reference: 262). This step runs on
the HeyGen take before the voice chain, captions and speech.json, so everything downstream sees the tightened clip.

    from app import tighten
    cut = tighten.tighten('takes/v3.mp4', 'avatar.mp4', captions)   # Whisper words on the take's own timeline
    cut['cuts']      # [{'at_ms': 4960, 'removed_ms': 160, 'kind': 'end', 'src_ms': [5160, 5320], ...}, ...]
    cut['time_map']  # [[src_start_ms, src_end_ms, dst_start_ms], ...] kept spans; remap_ms() moves any take time
    cut['captions']  # the captions remapped onto the tightened clip

Rules (critic-reviewed on job 09a9d211fff0; every decision is logged per pause in result['pauses']):
- A pause is a gap between measured speech spans (10 ms RMS within 28 dB of the take's p95 level). The pause length
  counts from that VAD end, the same way the voice gates measure it (a lone release burst does not end a pause).
- After a sentence end ('.', '!' or '?' on the Whisper word before the gap) a pause keeps at most end_cap_ms (220);
  any other pause at most mid_cap_ms (120). Without captions every pause counts as a sentence end (conservative).
- "Audible" is judged on what the listener will hear: the take rendered through the voice chain (audio.VOICE_CHAIN,
  whose compression lifts a quiet tail ~10 dB relative to the loud frames), broadband within 30 dB of its p95 (the
  bed sits 22-25 dB under the voice p95 and masks anything lower) or 2.5-12 kHz within 48 dB of the broadband p95
  and 8 dB over that band's floor (weak fricatives /f/ /s/ /h/ and breath: the bed has almost no top end there).
- Word endings: everything audible that starts within tail_keep_ms (150) of the VAD end is kept until it has
  decayed (15 ms hold) + 10 ms: the vowel's decay, a late /t/ /p/ release (HeyGen holds the closure 120-170 ms),
  a breath. After a sentence end the full 150 ms is kept as well, plus 60 ms of silence after a late release (80-100
  ms with the next word's lead), so the release still ends the sentence instead of running into the next one;
  mid-sentence a release runs into the next word as in connected speech. The cap counts from the VAD end, so the
  closure silence before a release is part of the pause (the first version counted it from the release: 'app,'
  kept 330 ms mid-sentence). On the REA take 80 ms instead of 60 left 'product.' at 290 ms instead of 250 (one more
  frame) and moved the pause share from 4.2 to 5.6 %: the share hangs on single pauses, read the per-pause rows. Mid-sentence the 150 ms is a window, not a
  minimum: a literal 150 ms keep would leave every cut mid pause at 170-190 ms (over the 120 ms cap and the 3-5 %
  pause share), so silence inside it may be cut. This is the one deliberate departure from the critic's
  "tail keep >= 150 ms" wording; its purpose (no clipped word ending) is measured by voice_gates on the chain.
- Before the next word, its audible rise (broadband or 2.5-12 kHz) + 10 ms is kept, at least lead_ms / 2.
- No cut is shorter than min_cut_ms (120 = 3 frames at 25 fps): a 1-2 frame jump reads as a glitch. A pause less
  than min_cut_ms / 2 over its cap is left alone (a 120 ms cut would turn a 150 ms mid pause into 30 ms).
- Both splice points must be inaudible (+-10 ms), and nothing at speech level on the raw take (a word the VAD
  missed, a release burst) is ever removed: the cut moves beside it or is dropped.
- Picture is cut on whole frames; sound is cut on the same number of frames but may sit up to half a frame (20 ms)
  away from the picture cut, so the audio splice lands at the quietest point instead of the nearest frame edge.
  Removed lengths are identical, so every kept segment stays in sync (measure_sync() checks each one by frame
  matching and audio cross-correlation: 0.0 ms on the REA take); only the 0-20 ms of silence around a cut plays
  next to the other side's picture. 5 ms fades at each splice. The lead-in before the first word is trimmed to its
  audible rise (at least lead_ms); the tail after the last word stays.
- Audio of any sample rate or start offset is resampled to 48 kHz on the presentation clock before trimming.
- speed (default 1.0 = off) is an optional synced speed-up: setpts + atempo, 1.04-1.06 keeps the voice natural.
- av_offset_ms (default 0) corrects a provider's own lip-sync error before anything else: the sound is moved by that
  many ms against the picture (negative = the audio plays earlier). HeyGen takes come with the voice 85-125 ms
  behind the lips (bilabial closures on job 9d2d68af60d4, both looks: the acoustic /p/ closure and burst land
  ~100 ms after the frames where the lips seal and open), so PROVIDER_AV_OFFSET_MS['heygen'] = -100. Every
  measurement (VAD, audibility, captions) runs on the corrected sound, so the cuts, captions and speech spans are
  on the corrected clock; the result and cuts.json record av_offset_ms, and measure_sync() checks the residual
  against it (0 = exactly the requested correction).
Audio is written as FLAC inside the MP4, so tightening adds no lossy generation.

CLI:  .venv/bin/python -m app.tighten <in.mp4> <out.mp4> [--captions captions.json] [--speed 1.05]
                                      [--av-offset-ms -100 | --provider heygen]
"""
import argparse
import json
import math
import re
import subprocess
import sys
import time
from pathlib import Path

import numpy as np

from . import audio

SR = 48000
END_CAP_MS = 220
MID_CAP_MS = 120
TAIL_KEEP_MS = 150
MIN_CUT_MS = 120
LEAD_MS = 40
GUARD_MS = 10           # kept after a decay / before an onset, and the inaudible margin around a splice
RELEASE_GAP_END_MS = 60   # silence kept after a late release at a sentence end (+ the next word's lead: 80-100 ms)
HOLD_MS = 15            # a sound has decayed once it stays inaudible this long
FADE_MS = 5
VAD_REL_DB = -28.0      # speech = 10 ms RMS within 28 dB of the take's p95 (-40 dBFS on a -18 LUFS HeyGen take)
LOUD_REL_DB = -26.0     # raw take, re its p95: speech-level sound (a release burst, a quiet word): never removed
# Audibility, on the take through the voice chain, calibrated on the REA job's bed (music_glow at volume 0.12, 10 ms
# levels re the voice stem's p95): broadband p10 -25 / p50 -22 dB, but 2.5-12 kHz only p50 -57 dB (a pad has little
# top end). So broadband sound 30 dB under the voice p95 (5 dB under the bed's quietest decile) is masked, while a
# breath or fricative in 2.5-12 kHz is heard from about 48 dB under the p95 (9 dB over the bed in that band).
# With the -32 dB line of the first version, low-level murmur the bed masks blocked the 'app,' cut (pause share 7.0 %
# instead of 4.2 % on the REA take).
AUDIBLE_REL_DB = -30.0
HF_BAND = (2500.0, 12000.0)
HF_AUDIBLE_REL_DB = -48.0   # 2.5-12 kHz level re the broadband p95: the /f/ of "free" rises through it 15-20 ms
HF_FLOOR_MARGIN_DB = 8.0    # ... and at least this far over the band's own floor (hiss never counts)
SYNC_SEARCH_MS = 250.0      # lip-sync search range (video and audio): a large error is reported as large
SPEED_SYNC_MS = 20.0        # with a speed-up the picture is quantised to whole source frames (<= half a frame)
SENTENCE_END = re.compile(r'[.!?]["\'”’)\]]*$')
# Per-provider lip-sync correction (ms the sound moves against the picture; negative = earlier). Measured on
# bilabial closures of both HeyGen looks of job 9d2d68af60d4 (Avatar V, 2026-10-18): the voice lags the lips by
# 85-125 ms (median ~105); -100 leaves it a few ms late, the side viewers tolerate (audio leading is noticed first).
PROVIDER_AV_OFFSET_MS = {'heygen': -100}


# ----------------------------------------------------------------------------- measurement

def probe(path):
    """fps, frame count, start times (s) of the first video and audio streams, and the audio sample rate."""
    out = subprocess.run(['ffprobe', '-v', 'error', '-count_packets', '-show_entries',
                          'stream=codec_type,r_frame_rate,nb_read_packets,start_time,sample_rate', '-of', 'json',
                          str(path)], capture_output=True, text=True, check=True).stdout
    streams = json.loads(out)['streams']
    v = next(s for s in streams if s['codec_type'] == 'video')
    a = next((s for s in streams if s['codec_type'] == 'audio'), {})
    num, den = (int(n) for n in v['r_frame_rate'].split('/'))

    def start(s):
        try:
            return float(s.get('start_time', 0) or 0)
        except ValueError:
            return 0.0
    return {'fps': num / den, 'frames': int(v['nb_read_packets']), 'v_start': start(v), 'a_start': start(a),
            'a_sr': int(a.get('sample_rate') or SR)}


def probe_video(path):
    """(fps, frame_count) of the first video stream."""
    p = probe(path)
    return p['fps'], p['frames']


def decode_on_video_clock(path, v_start=0.0, sr=SR):
    """Mono float of the first audio stream with sample 0 on video frame 0: aresample first_pts=0 puts sample 0 on
    pts 0 (a late audio start is padded with silence), then the time before the first video frame is dropped."""
    process = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-map', '0:a:0', '-af',
                              f'aresample={sr}:first_pts=0', '-ac', '1', '-f', 'f32le', '-'], capture_output=True,
                             timeout=300)
    if process.returncode:
        raise RuntimeError('ffmpeg decode failed: ' + process.stderr.decode(errors='replace')[-300:])
    return np.frombuffer(process.stdout, '<f4').astype(np.float64)[int(round(v_start * sr)):]


def audio_clock_ms(path, n_video_clock, pr=None, sr=SR):
    """Where the first decoded audio sample sits on the video clock (ms). Whisper and the VAD time words from that
    sample. ffprobe's start_time counts the AAC priming packet the decoder drops (78 ms for a stream really starting
    at 100 ms), so when it says the streams start apart, the shift is measured from the decoded lengths instead."""
    pr = pr or probe(path)
    if abs(pr['a_start'] - pr['v_start']) < 5e-4:
        return 0.0
    raw = len(audio.decode(path, sr=sr, channels=1))
    return (n_video_clock - raw) / sr * 1000


def levels_db(x, frame_ms, sr=SR):
    """RMS level in dBFS of consecutive frame_ms frames of a mono signal."""
    hop = int(round(sr * frame_ms / 1000))
    n = len(x) // hop
    return 10 * np.log10(np.mean(x[:n * hop].reshape(n, hop) ** 2, axis=1) + 1e-20)


def shift_pcm(x, offset_ms, sr=SR):
    """x moved by offset_ms on its own clock, same length: negative drops the head and pads silence at the end
    (the sound plays earlier), positive delays it."""
    n = int(round(abs(offset_ms) * sr / 1000))
    if not n:
        return x
    pad = np.zeros(min(n, len(x)), x.dtype)
    return np.concatenate([x[n:], pad]) if offset_ms < 0 else np.concatenate([pad, x[:len(x) - n]])


def band_levels(x, lo, hi, frame_ms, sr=SR, order=4):
    """levels_db() of x band-passed lo-hi Hz (zero-phase, 4th-order Butterworth magnitude: no brick-wall ringing)."""
    f = np.fft.rfftfreq(len(x), 1 / sr)
    g = 1 / np.sqrt((1 + (lo / np.maximum(f, 1e-6)) ** (2 * order)) * (1 + (f / hi) ** (2 * order)))
    return levels_db(np.fft.irfft(np.fft.rfft(x) * g, len(x)), frame_ms, sr)


def audibility(xc, frame_ms=5, sr=SR):
    """Per frame_ms frame of the voice chain's output: broadband and 2.5-12 kHz levels, the two audibility lines
    and the mask (audible = over either line). Lines are relative to the broadband p95, so the gain does not matter."""
    lv, hf = levels_db(xc, frame_ms, sr), band_levels(xc, *HF_BAND, frame_ms, sr)
    n = min(len(lv), len(hf))
    lv, hf = lv[:n], hf[:n]
    if not n:
        return {'lv': lv, 'hf': hf, 'p95': -120.0, 'bb_line': 0.0, 'hf_line': 0.0, 'mask': np.zeros(0, bool)}
    p95 = float(np.percentile(lv, 95))
    bb_line = max(p95 + AUDIBLE_REL_DB, float(np.percentile(lv, 3)) + 4.0)
    hf_line = max(p95 + HF_AUDIBLE_REL_DB, float(np.percentile(hf, 3)) + HF_FLOOR_MARGIN_DB)
    return {'lv': lv, 'hf': hf, 'p95': p95, 'bb_line': bb_line, 'hf_line': hf_line,
            'mask': (lv > bb_line) | (hf > hf_line)}


def speech_spans(lv10, threshold_db, frame_ms=10, min_gap_ms=120, min_span_ms=60):
    """[(start_ms, end_ms)] where the 10 ms level is over threshold; gaps under min_gap_ms are bridged,
    spans under min_span_ms dropped (same rules as audio.voice_activity, but on a given level track)."""
    active = lv10 > threshold_db
    spans, start = [], None
    for i, a in enumerate(active):
        if a and start is None:
            start = i
        elif not a and start is not None:
            spans.append([start * frame_ms, i * frame_ms])
            start = None
    if start is not None:
        spans.append([start * frame_ms, len(active) * frame_ms])
    merged = []
    for s0, s1 in spans:
        if merged and s0 - merged[-1][1] < min_gap_ms:
            merged[-1][1] = s1
        else:
            merged.append([s0, s1])
    return [(a, b) for a, b in merged if b - a >= min_span_ms]


def _is_captions(items):
    return bool(items) and isinstance(items[0], dict)


def gap_kinds(spans, captions):
    """'end' for a gap that follows a sentence-final word, else 'mid'. The word before a gap is the last caption
    word that started at least 40 ms before the gap (Whisper often starts the next word inside the pause)."""
    if not captions:
        return ['end'] * max(0, len(spans) - 1)
    kinds = []
    for (_, e0), _ in zip(spans, spans[1:]):
        before = [c for c in captions if c['startMs'] <= e0 - 40]
        word = max(before, key=lambda c: c['startMs'])['text'].strip() if before else ''
        kinds.append('end' if SENTENCE_END.search(word) else 'mid')
    return kinds


# ----------------------------------------------------------------------------- cut planning

def _decay_end(sound, i, hold=3):
    """First 5 ms frame index >= i after which `sound` stays False for hold frames."""
    while i < len(sound) and np.any(sound[i:i + hold]):
        i += 1
    return i


def plan_cuts(lv5, aud5, spans, kinds, frame_ms, n_frames, *, end_cap_ms=END_CAP_MS, mid_cap_ms=MID_CAP_MS,
              tail_keep_ms=TAIL_KEEP_MS, min_cut_ms=MIN_CUT_MS, lead_ms=LEAD_MS, loud_db=-38.0, guard_ms=GUARD_MS,
              hold_ms=HOLD_MS):
    """lv5: the raw take's 5 ms level (dBFS: speech-level check); aud5: per 5 ms frame, audible after the chain.
    Returns (lead-in frames to trim, cuts [{'frames': (first, end), 'audio_ms': (a, b), 'kind', 'gap'}], one
    decision row per pause). A cut removes the same whole number of frames from picture and sound; the audio run
    may sit up to half a frame from the picture run."""
    n5 = min(len(lv5), len(aud5))
    loud = np.asarray(lv5[:n5]) > loud_db
    sound = np.asarray(aud5[:n5], bool) | loud
    hold = max(1, int(hold_ms // 5))

    def frame_ceil(ms):
        return int(math.ceil(ms / frame_ms - 1e-9))

    def quiet_at(t):
        """A splice at t ms is inaudible: no sound within guard_ms of it."""
        a, b = int(math.floor((t - guard_ms) / 5 + 1e-9)), int(math.ceil((t + guard_ms) / 5 - 1e-9))
        return not sound[max(0, a):max(0, b)].any()

    def onset_lead(s1, floor_ms):
        """ms before the VAD onset s1 from which the next word is audible (its rise, broadband or HF), + guard."""
        j, stop = int(s1 // 5), max(0, int(math.ceil(floor_ms / 5)))
        while j > stop and sound[max(stop, j - hold):j].any():
            j -= 1
        return s1 - j * 5 + guard_ms

    min_cut_f = frame_ceil(min_cut_ms)
    lead_f = 0
    if spans:
        lead0 = max(lead_ms, onset_lead(spans[0][0], 0))
        lead_f = max(0, int(math.floor((spans[0][0] - lead0) / frame_ms + 1e-9)))
    cuts, pauses = [], []
    for ((_, e0), (s1, _)), kind in zip(zip(spans, spans[1:]), kinds):
        gap = s1 - e0
        cap = end_cap_ms if kind == 'end' else mid_cap_ms
        i0, i1 = int(e0 // 5), int(s1 // 5)
        win = min(i1, i0 + int(tail_keep_ms // 5))
        burst = np.nonzero(loud[i0:win])[0]
        hit = np.nonzero(sound[i0:win])[0]
        # 1. the word's ending: whatever is audible within tail_keep_ms of the VAD end, followed until it decays
        tail = (_decay_end(sound, i0 + int(hit[-1]) + 1, hold) - i0) * 5 + guard_ms if len(hit) else guard_ms
        if kind == 'end':
            if cap - lead_ms >= tail_keep_ms:
                tail = max(tail, tail_keep_ms)      # sentence ends: the whole 150 ms, audible or not
            if len(burst):                          # ... and a beat of silence after a late release
                release_end = (_decay_end(loud, i0 + int(burst[-1]) + 1, hold) - i0) * 5
                tail = max(tail, release_end + RELEASE_GAP_END_MS)
        tail = min(tail, gap)
        # 2. the next word's audible rise
        lead = min(max(lead_ms // 2, onset_lead(s1, e0 + tail)), gap - tail)
        keep = max(cap, tail + lead)
        row = {'src_ms': [e0, s1], 'kind': kind, 'gap_ms': gap, 'release_ms': int(burst[0]) * 5 if len(burst) else None,
               'tail_ms': tail, 'lead_ms': lead, 'keep_ms': keep, 'removed_ms': 0}
        pauses.append(row)
        if gap <= keep:
            row['why'] = 'within cap'
            continue
        if gap - keep < min_cut_ms / 2:    # rounding up to a min cut would leave the pause far under its cap
            row['why'] = f'within cap + min cut / 2 (excess {round(gap - keep)} ms)'
            continue
        lo, hi = e0 + tail, s1 - lead
        n_max = int(math.floor((hi - lo) / frame_ms + 1e-9))
        if n_max < min_cut_f:
            row['why'] = f'protected (room {round(hi - lo)} ms < min cut)'
            continue
        # 3. the audio run: n whole frames (n_target leaves the pause at the cap), placed as late as possible with
        #    both splices inaudible and nothing speech-level inside; fewer frames, then more, if that fails
        n_target = min(n_max, max(min_cut_f, frame_ceil(gap - keep)))
        found = None
        for n in [*range(n_target, min_cut_f - 1, -1), *range(n_target + 1, n_max + 1)]:
            length = n * frame_ms
            b = hi
            while b - length >= lo - 1e-9:
                a = b - length
                if quiet_at(a) and quiet_at(b) and not loud[int(a // 5):int(math.ceil(b / 5 - 1e-9))].any():
                    found = (a, n)
                    break
                b -= 5
            if found:
                break
        if not found:
            row['why'] = 'protected (no inaudible splice)'
            continue
        a, n = found
        vf0 = int(math.floor(a / frame_ms + 0.5))          # the picture cut: the frame edge nearest the audio splice
        if vf0 < lead_f or vf0 + n > n_frames:
            row['why'] = 'outside the clip'
            continue
        cuts.append({'frames': (vf0, vf0 + n), 'audio_ms': (round(a, 3), round(a + n * frame_ms, 3)), 'kind': kind,
                     'gap': gap, 'word_end': e0})
        row.update(removed_ms=round(n * frame_ms), why='cut', audio_cut_ms=[round(a, 1), round(a + n * frame_ms, 1)],
                   delta_ms=round(a - vf0 * frame_ms, 1))
    return lead_f, cuts, pauses


def segments_from_cuts(lead_f, cuts, n_frames, frame_ms):
    """Kept runs [(first_frame, end_frame, audio_start_ms, audio_end_ms)] between the lead-in trim and the cuts.
    Audio runs differ from their frames by the cuts' sub-frame offsets; their total length is the picture's."""
    segs, cur_f, cur_ms = [], lead_f, lead_f * frame_ms
    for c in cuts:
        f0, f1 = c['frames']
        a0, a1 = c['audio_ms']
        if f0 > cur_f:
            segs.append((cur_f, f0, cur_ms, a0))
        cur_f, cur_ms = f1, a1
    if n_frames > cur_f:
        segs.append((cur_f, n_frames, cur_ms, n_frames * frame_ms))
    return segs


# ----------------------------------------------------------------------------- time map

def remap_ms(t, time_map, speed=1.0):
    """A time on the take's timeline -> the tightened clip's timeline. Times inside a removed span land on the cut."""
    if not time_map:
        return t
    for a, b, d in time_map:
        if t < a:
            return round(d / speed)
        if t < b:
            return round((d + t - a) / speed)
    a, b, d = time_map[-1]
    return round((d + b - a) / speed)


def remap_overrides(words, cut, timeline='trimmed'):
    """plan.json caption_overrides words -> the tightened clip. timeline: 'tight' (measured on it already),
    'take' (on the raw take) or 'trimmed' (on the old trim_lead_in avatar.mp4: plans written before tighten)."""
    if timeline == 'tight':
        return [dict(w) for w in words]
    offset = cut.get('legacy_lead_ms', 0) if timeline == 'trimmed' else 0
    out = []
    for w in words:
        w = dict(w)
        for k in ('startMs', 'endMs'):
            if k in w:
                w[k] = remap_ms(w[k] + offset, cut['time_map'], cut.get('speed', 1.0))
        out.append(w)
    return out


def _legacy_lead_ms(path, keep_ms=40):
    """Where the old trim_lead_in started the clip (first voice onset - keep_ms), to remap old overrides."""
    spans = audio.voice_activity(path)
    return int(max(0, spans[0][0] - keep_ms)) if spans else 0


def remap_captions(captions, time_map, speed=1.0):
    out = []
    for c in captions:
        c = dict(c)
        c['startMs'] = remap_ms(c['startMs'], time_map, speed)
        c['endMs'] = max(c['startMs'] + 1, remap_ms(c['endMs'], time_map, speed))
        if 'timestampMs' in c:
            c['timestampMs'] = (c['startMs'] + c['endMs']) // 2
        out.append(c)
    return out


def remap_spans(spans, time_map, speed=1.0):
    out = []
    for a, b in spans:
        a2, b2 = remap_ms(a, time_map, speed), remap_ms(b, time_map, speed)
        if b2 > a2:
            out.append((a2, b2))
    return out


# ----------------------------------------------------------------------------- render

def out_frames(segs, speed=1.0):
    """Frames in the tightened clip (after an optional speed-up)."""
    return int(round(sum(s[1] - s[0] for s in segs) / speed))


def _shift_filter(av_offset_ms, sr=SR):
    """ffmpeg filters (after aresample first_pts=0) that move the sound by av_offset_ms, keeping it long enough."""
    n = int(round(abs(av_offset_ms) * sr / 1000))
    if not n:
        return ''
    if av_offset_ms < 0:
        return f',atrim=start_sample={n},asetpts=PTS-STARTPTS,apad=pad_len={n}'
    return f',adelay=delays={n}S:all=1'


def filter_graph(segs, fps, sr=SR, speed=1.0, fade_ms=FADE_MS, v_start=0.0, av_offset_ms=0.0):
    """One pass: the audio resampled to sr on the presentation clock (any input rate or start offset), moved by
    av_offset_ms against the picture, split into the kept runs by sample, the picture into the same runs by frame;
    each stream concatenated on its own (audio runs may be a few ms longer or shorter than their frames; the totals
    match), 5 ms fades at the splices, optional synced speed-up. segs: segments_from_cuts() rows."""
    n = len(segs)
    parts = [f'[0:a:0]aresample={sr}:first_pts=0' + _shift_filter(av_offset_ms, sr) + (f',asplit={n}' if n > 1 else '')
             + ''.join(f'[s{i}]' for i in range(n))]
    vl = al = ''
    fade = fade_ms / 1000
    for i, (a, b, ta, tb) in enumerate(segs):
        sa, sb = int(round((v_start + ta / 1000) * sr)), int(round((v_start + tb / 1000) * sr))
        dur = (sb - sa) / sr
        fades = ([f'afade=t=in:d={fade}'] if i > 0 else []) + \
                ([f'afade=t=out:st={max(0.0, dur - fade):.6f}:d={fade}'] if i < n - 1 else [])
        parts.append(f'[0:v:0]trim=start_frame={a}:end_frame={b},setpts=PTS-STARTPTS[v{i}]')
        parts.append(f'[s{i}]atrim=start_sample={sa}:end_sample={sb},asetpts=PTS-STARTPTS'
                     + ''.join(',' + f for f in fades) + f'[a{i}]')
        vl += f'[v{i}]'
        al += f'[a{i}]'
    graph = ';'.join(parts)
    if abs(speed - 1.0) > 1e-6:   # both streams end on the same whole frame (audio padded if atempo runs short)
        n_out = out_frames(segs, speed)
        n_samples = int(round(n_out * sr / fps))
        graph += (f';{vl}concat=n={n}:v=1:a=0[vc];{al}concat=n={n}:v=0:a=1[ac]'
                  f';[vc]setpts=PTS/{speed},fps={fps:g},trim=end_frame={n_out}[v]'
                  f';[ac]atempo={speed},apad=whole_len={n_samples},atrim=end_sample={n_samples}[a]')
    else:
        graph += f';{vl}concat=n={n}:v=1:a=0[v];{al}concat=n={n}:v=0:a=1[a]'
    return graph


def tighten(in_video, out_video, captions_or_vad=None, end_cap_ms=END_CAP_MS, mid_cap_ms=MID_CAP_MS,
            tail_keep_ms=TAIL_KEEP_MS, min_cut_ms=MIN_CUT_MS, *, lead_ms=LEAD_MS, speed=1.0, measure=True,
            crf=15, preset='medium', chain=audio.VOICE_CHAIN, av_offset_ms=0.0):
    """Write a jump-cut copy of in_video (video H.264, audio FLAC 48 kHz: no extra lossy generation) and return
    {'cuts': [{'at_ms', 'removed_ms', 'kind', 'src_ms', 'audio_src_ms', ...}], 'time_map': [[src_a, src_b, dst_a]],
    'captions', 'pauses', 'sync', ...}.

    captions_or_vad: Whisper words on in_video's audio timeline ([{'text', 'startMs', 'endMs'}], classify sentence
    ends and get remapped), or speech spans [(start_ms, end_ms)] to use instead of the built-in VAD, or None.
    chain: the voice chain audibility is judged through (None: the raw take, with the same relative lines).
    av_offset_ms: the provider's lip-sync correction (PROVIDER_AV_OFFSET_MS; negative = the sound plays earlier).
    Captions and spans are given on the take's own audio clock and come back on the corrected one."""
    t0 = time.time()
    in_video, out_video = Path(in_video), Path(out_video)
    pr = probe(in_video)
    fps, n_frames, v_start = pr['fps'], pr['frames'], pr['v_start']
    frame_ms = 1000.0 / fps
    x = decode_on_video_clock(in_video, v_start)
    clock_ms = audio_clock_ms(in_video, len(x), pr)   # Whisper/VAD times (decoded from the first sample) -> video clock
    n_frames = min(n_frames, int(len(x) / SR * fps + 1e-6))   # never ask atrim for audio past the end
    xc = x if chain is None else audio.voice_chain_pcm(in_video, chain)[int(round(v_start * SR)):]
    av_offset_ms = float(av_offset_ms or 0.0)
    if av_offset_ms:     # every measurement below runs on the corrected sound
        x, xc = shift_pcm(x, av_offset_ms), shift_pcm(xc, av_offset_ms)
    word_shift = clock_ms + av_offset_ms     # caption / span times -> the corrected sound on the video clock
    aud = audibility(xc)
    lv5, lv10 = levels_db(x, 5), levels_db(x, 10)
    p95 = float(np.percentile(lv5, 95))
    silence_db = max(p95 + AUDIBLE_REL_DB, float(np.percentile(lv5, 10)) + 4.0)
    loud_db = max(p95 + LOUD_REL_DB, silence_db + 3.0)
    captions = captions_or_vad if _is_captions(captions_or_vad) else None
    if captions and abs(word_shift) > 0.5:
        captions = [{**c, 'startMs': round(c['startMs'] + word_shift), 'endMs': round(c['endMs'] + word_shift)} for c in captions]
    if captions_or_vad and not captions:
        spans = [(round(a + word_shift), round(b + word_shift)) for a, b in captions_or_vad]
    else:
        spans = speech_spans(lv10, max(-48.0, min(-34.0, float(np.percentile(lv10, 95)) + VAD_REL_DB)))
    kinds = gap_kinds(spans, captions)
    lead_f, cuts, pauses = plan_cuts(lv5, aud['mask'], spans, kinds, frame_ms, n_frames, end_cap_ms=end_cap_ms,
                                     mid_cap_ms=mid_cap_ms, tail_keep_ms=tail_keep_ms, min_cut_ms=min_cut_ms,
                                     lead_ms=lead_ms, loud_db=loud_db)
    segs = segments_from_cuts(lead_f, cuts, n_frames, frame_ms)
    time_map, dst = [], 0.0
    for a, b, *_ in segs:
        time_map.append([round(a * frame_ms, 3), round(b * frame_ms, 3), round(dst, 3)])
        dst += (b - a) * frame_ms
    out_video.parent.mkdir(parents=True, exist_ok=True)
    audio.run(['ffmpeg', '-y', '-hide_banner', '-nostats', '-loglevel', 'error', '-i', in_video,
               '-filter_complex', filter_graph(segs, fps, speed=speed, v_start=v_start, av_offset_ms=av_offset_ms),
               '-map', '[v]', '-map', '[a]',
               '-r', f'{fps:g}', '-c:v', 'libx264', '-crf', str(crf), '-preset', preset, '-pix_fmt', 'yuv420p',
               '-c:a', 'flac', '-ar', str(SR), '-ac', '2', '-movflags', '+faststart', out_video])
    cut_list = []
    for c in cuts:
        (a, b), (ta, tb) = c['frames'], c['audio_ms']
        at = remap_ms(a * frame_ms, time_map, speed)
        cut_list.append({'at_ms': at, 'removed_ms': round((b - a) * frame_ms), 'kind': c['kind'], 'gap_ms': int(c['gap']),
                         'kept_ms': int(round(c['gap'] - (b - a) * frame_ms)),
                         'src_ms': [round(a * frame_ms), round(b * frame_ms)], 'audio_src_ms': [ta, tb],
                         'audio_at_ms': round(at + (ta - a * frame_ms) / speed, 1), 'word_end_ms': c['word_end']})
    result = {
        'source': str(in_video), 'cuts': cut_list, 'time_map': time_map, 'speed': speed, 'fps': fps,
        'lead_trim_ms': round(lead_f * frame_ms), 'legacy_lead_ms': _legacy_lead_ms(in_video),
        'duration_in_ms': round(n_frames * frame_ms),
        'duration_out_ms': round(out_frames(segs, speed) * frame_ms), 'removed_ms': round(n_frames * frame_ms - dst),
        'pauses': pauses, 'speech_src': [list(s) for s in spans], 'speech': [list(s) for s in remap_spans(spans, time_map, speed)],
        'av_offset_ms': av_offset_ms,
        'clock': {'v_start_s': v_start, 'a_start_s': pr['a_start'], 'a_sr': pr['a_sr'], 'shift_ms': round(clock_ms, 2),
                  'av_offset_ms': av_offset_ms},
        'thresholds_db': {'p95': round(p95, 1), 'loud': round(loud_db, 1), 'chain_p95': round(aud['p95'], 1),
                          'audible_bb': round(aud['bb_line'], 1), 'audible_hf': round(aud['hf_line'], 1)},
        'params': {'end_cap_ms': end_cap_ms, 'mid_cap_ms': mid_cap_ms, 'tail_keep_ms': tail_keep_ms,
                   'min_cut_ms': min_cut_ms, 'lead_ms': lead_ms, 'chain': chain is not None},
    }
    if captions:
        result['captions'] = remap_captions(captions, time_map, speed)
    result['render_s'] = round(time.time() - t0, 2)
    if measure:
        result['sync'] = measure_sync(in_video, out_video, time_map, fps, speed, v_start=v_start, av_offset_ms=av_offset_ms)
    return result


# ----------------------------------------------------------------------------- verification

def _gray_frames(path, w=36, h=64):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-map', '0:v:0', '-vf', f'scale={w}:{h},format=gray',
                          '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)


def _best_lag(ref_ext, seg, max_lag):
    """Lag k in [-max_lag, max_lag] maximising the normalised correlation of seg[n] with ref_ext[max_lag + k + n]."""
    n = len(ref_ext) + len(seg)
    xc = np.fft.irfft(np.fft.rfft(ref_ext, n) * np.conj(np.fft.rfft(seg, n)), n)[:2 * max_lag + 1]
    c = np.concatenate([[0.0], np.cumsum(ref_ext ** 2)])
    energy = c[len(seg):len(seg) + 2 * max_lag + 1] - c[:2 * max_lag + 1]
    return int(np.argmax(xc / np.sqrt(np.maximum(energy, 1e-20)))) - max_lag


def measure_sync(src, out, time_map, fps=25.0, speed=1.0, sr=SR, search_ms=SYNC_SEARCH_MS, v_start=0.0, av_offset_ms=0.0):
    """Lip-sync check of a tightened clip against its source, per kept segment (+-search_ms both ways):
    video = which source frame the output really shows (frame matching), audio = where the output audio really
    comes from in the source (normalised cross-correlation; the segment interior at speed 1, 20 ms windows at the
    frame centres with a speed-up, where atempo copies short source chunks). A/V offset = audio position - picture
    position, in output ms; 0 means sound and picture still come from the same instant. With a speed-up the picture
    is quantised to whole source frames (up to half a frame), and that error is included. av_offset_ms: the
    correction tighten applied; the source sound is compared moved by it, so 0 still means "exactly as asked"."""
    frame_ms = 1000.0 / fps
    fs, fo = _gray_frames(src), _gray_frames(out)
    xs, xo = shift_pcm(decode_on_video_clock(src, v_start, sr), av_offset_ms or 0.0, sr), decode_on_video_clock(out, 0.0, sr)
    max_f, lag = int(math.ceil(search_ms / frame_ms)), int(sr * search_ms / 1000)
    win, trim = int(0.02 * sr), 60.0
    rows = []
    for a, b, d in time_map:
        if b - a < 200:
            continue
        samples = []
        for frac in (0.3, 0.5, 0.7):
            k = int(round((d + frac * (b - a)) / speed / frame_ms))     # output frame
            if k >= len(fo):
                continue
            t_src = a + (k * frame_ms * speed - d)                      # source ms the time map says it shows
            j = int(round(t_src / frame_ms))
            cand = [(float(np.mean((fo[k] - fs[j + o]) ** 2)), o) for o in range(-max_f, max_f + 1) if 0 <= j + o < len(fs)]
            if not cand:
                continue
            video_pos = (j + min(cand)[1]) * frame_ms
            audio_pos = None
            if abs(speed - 1.0) > 1e-6:
                o0 = int(round(k * frame_ms * sr / 1000)) - win // 2
                s0 = int(round(t_src * sr / 1000)) - win // 2
                seg, ref = xo[max(0, o0):o0 + win], xs[max(0, s0 - lag):s0 + win + lag]
                if o0 >= 0 and s0 >= lag and len(seg) == win and len(ref) == win + 2 * lag and np.std(seg) > 1e-4:
                    audio_pos = t_src + _best_lag(ref, seg, lag) * 1000.0 / sr
            samples.append((video_pos, audio_pos, t_src))
        alag = None
        if abs(speed - 1.0) <= 1e-6:
            o0, o1 = int((d + trim) * sr / 1000), int((d + b - a - trim) * sr / 1000)
            s0 = int((a + trim) * sr / 1000)
            seg = xo[o0:o1]
            ref = xs[s0 - lag:s0 + len(seg) + lag] if s0 >= lag else np.zeros(0)
            if len(seg) > sr // 20 and len(ref) == len(seg) + 2 * lag and float(np.std(seg)) > 1e-5:
                alag = _best_lag(ref, seg, lag) * 1000.0 / sr
        if not samples:
            continue
        vlag = float(np.median([v - t for v, _, t in samples]))        # picture vs the time map, source ms
        if alag is None:
            offs = [(au - v) / speed for v, au, _ in samples if au is not None]
            offset = round(float(np.median(offs)), 2) if offs else None
            alag = round(float(np.median([au - t for _, au, t in samples if au is not None])), 2) if offs else None
        else:
            offset = round(alag - vlag, 2)
        rows.append({'src_ms': [a, b], 'video_lag_ms': vlag, 'audio_lag_ms': alag, 'offset_ms': offset})
    offsets = [abs(r['offset_ms']) for r in rows if r['offset_ms'] is not None]
    probe_out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,start_time,duration',
                                '-of', 'json', str(out)], capture_output=True, text=True, check=True).stdout
    streams = {s['codec_type']: s for s in json.loads(probe_out)['streams']}
    dv, da = (float(streams[k].get('duration', 'nan')) for k in ('video', 'audio'))
    return {'max_offset_ms': round(max(offsets), 2) if offsets else None, 'segments_measured': len(offsets),
            'av_offset_ms': av_offset_ms or 0.0,
            'video_s': round(dv, 3), 'audio_s': round(da, 3), 'duration_diff_ms': round(abs(dv - da) * 1000, 1),
            'start_time_s': {k: float(v.get('start_time', 0)) for k, v in streams.items()}, 'rows': rows}


def sync_problem(sync, fps=25.0, limit_ms=10.0):
    """None when the measured sync is good, else why not (reel.build stops on it)."""
    if not sync:
        return 'lip sync was not measured'
    if sync.get('max_offset_ms') is None:
        return 'lip sync could not be measured on any segment'
    if sync['max_offset_ms'] >= limit_ms:
        return f"lip-sync offset {sync['max_offset_ms']} ms >= {limit_ms:g} ms"
    if sync.get('duration_diff_ms', 0) > 1000.0 / fps:
        return f"audio and video lengths differ by {sync['duration_diff_ms']} ms (> one frame)"
    return None


def write_cuts(job_dir, result):
    """cuts.json for the edit: where every jump cut sits on the tightened timeline (cutaways go over these first)."""
    keep = {k: v for k, v in result.items() if k not in ('captions',)}
    Path(job_dir, 'cuts.json').write_text(json.dumps(keep, indent=1))
    return Path(job_dir, 'cuts.json')


def main(argv=None):
    p = argparse.ArgumentParser(prog='python -m app.tighten', description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('src')
    p.add_argument('dst')
    p.add_argument('--captions', help='Whisper words (captions.json format) on the source timeline')
    p.add_argument('--end-cap-ms', type=int, default=END_CAP_MS)
    p.add_argument('--mid-cap-ms', type=int, default=MID_CAP_MS)
    p.add_argument('--tail-keep-ms', type=int, default=TAIL_KEEP_MS)
    p.add_argument('--min-cut-ms', type=int, default=MIN_CUT_MS)
    p.add_argument('--speed', type=float, default=1.0)
    p.add_argument('--av-offset-ms', type=float, help='move the sound against the picture (negative = earlier)')
    p.add_argument('--provider', choices=sorted(PROVIDER_AV_OFFSET_MS), help='use that provider\'s measured A/V offset')
    p.add_argument('--json', help='write the full result here')
    a = p.parse_args(argv)
    caps = json.loads(Path(a.captions).read_text()) if a.captions else None
    offset = a.av_offset_ms if a.av_offset_ms is not None else PROVIDER_AV_OFFSET_MS.get(a.provider, 0.0)
    r = tighten(a.src, a.dst, caps, a.end_cap_ms, a.mid_cap_ms, a.tail_keep_ms, a.min_cut_ms, speed=a.speed,
                av_offset_ms=offset)
    if a.json:
        Path(a.json).write_text(json.dumps(r, indent=1))
    print(json.dumps({k: r[k] for k in ('cuts', 'duration_in_ms', 'duration_out_ms', 'removed_ms', 'av_offset_ms', 'render_s')}
                     | {'sync': {k: v for k, v in r['sync'].items() if k != 'rows'}}, indent=1))


if __name__ == '__main__':
    sys.exit(main())
