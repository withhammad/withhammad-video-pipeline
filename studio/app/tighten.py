"""Jump-cut HeyGen's dead air: shorten every pause, cutting picture and sound on the same frames, in one ffmpeg pass.

HeyGen's TTS leaves a 250-640 ms silence at almost every full stop, and the edit used to keep all of them: 13-20 % of
the reel was dead air (the human reference: 2-4 %) and the pace fell to 196 wpm (reference: 262). This step runs on
the HeyGen take before the voice chain, captions and speech.json, so everything downstream sees the tightened clip.

    from app import tighten
    cut = tighten.tighten('takes/v3.mp4', 'avatar.mp4', captions)   # Whisper words on the take's own timeline
    cut['cuts']      # [{'at_ms': 4960, 'removed_ms': 160, 'kind': 'end', 'src_ms': [5160, 5320]}, ...]
    cut['time_map']  # [[src_start_ms, src_end_ms, dst_start_ms], ...] kept spans; remap_ms() moves any take time
    cut['captions']  # the captions remapped onto the tightened clip

Rules (critic-reviewed on job 09a9d211fff0; every decision is logged per pause in result['pauses']):
- A pause is a gap between measured speech spans (10 ms RMS within 28 dB of the take's p95 level).
- After a sentence end ('.', '!' or '?' on the Whisper word before the gap) a pause keeps at most end_cap_ms (220);
  any other pause at most mid_cap_ms (120). Without captions every pause counts as a sentence end (conservative).
- A late release inside tail_keep_ms of the word (HeyGen holds a final /t/ or /p/ closure 130-160 ms, then bursts)
  is the real end of the word: it is kept and the cap counts from where it has decayed.
- tail_keep_ms (150) after the word is protected whenever the cap leaves room for it (always at sentence ends).
  Mid-sentence the tail keeps everything audible until it has decayed (+10 ms), and at least mid_cap - lead_ms.
  "Audible" = within 32 dB of the take's p95: the music bed sits ~22 dB under the voice's p95, so quieter tails
  are masked anyway.
- Before the next word, its audible rise + 10 ms is kept, at least lead_ms / 2 (soft onsets, /h/ /f/).
- No cut is shorter than min_cut_ms (120 = 3 frames at 25 fps): a 1-2 frame jump reads as a glitch.
- Never cut through speech-level sound the VAD missed (a quiet word): the cut moves beside it or is dropped.
- Cuts are whole video frames, so picture and sound lose exactly the same time (measure_sync() checks every kept
  segment by frame matching and audio cross-correlation: 0.0 ms on the REA take); 5 ms fades at each splice. The
  lead-in before the first word is trimmed to lead_ms (what trim_lead_in did); the tail after the last word stays.
- speed (default 1.0 = off) is an optional synced speed-up: setpts + atempo, 1.04-1.06 keeps the voice natural.
Audio is written as FLAC inside the MP4, so tightening adds no lossy generation.

CLI:  .venv/bin/python -m app.tighten <in.mp4> <out.mp4> [--captions captions.json] [--speed 1.05]
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
FADE_MS = 5
VAD_REL_DB = -28.0      # speech = 10 ms RMS within 28 dB of the take's p95 (-40 dBFS on a -18 LUFS HeyGen take)
# Audibility, measured on job 09a9d211fff0: the music bed sits ~15 LU under the voice, i.e. ~22 dB under the voice's
# p95 frames, so anything 32 dB under the p95 is ~10 dB under the bed and masked. Tails above that are kept.
SILENCE_REL_DB = -32.0  # "silent" = 5 ms RMS more than 32 dB under the take's p95 (-43.6 dBFS on a -18 LUFS take)
LOUD_REL_DB = -26.0     # a release burst / speech-level sound (-37.6 dBFS there): never cut, a pause starts after it
SENTENCE_END = re.compile(r'[.!?]["\'”’)\]]*$')


# ----------------------------------------------------------------------------- measurement

def probe_video(path):
    """(fps, frame_count) of the first video stream."""
    out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-count_packets', '-show_entries',
                          'stream=r_frame_rate,nb_read_packets', '-of', 'json', str(path)],
                         capture_output=True, text=True, check=True).stdout
    s = json.loads(out)['streams'][0]
    num, den = (int(v) for v in s['r_frame_rate'].split('/'))
    return num / den, int(s['nb_read_packets'])


def levels_db(x, frame_ms, sr=SR):
    """RMS level in dBFS of consecutive frame_ms frames of a mono signal."""
    hop = int(round(sr * frame_ms / 1000))
    n = len(x) // hop
    return 10 * np.log10(np.mean(x[:n * hop].reshape(n, hop) ** 2, axis=1) + 1e-20)


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

def plan_cuts(lv5, spans, kinds, frame_ms, n_frames, *, end_cap_ms=END_CAP_MS, mid_cap_ms=MID_CAP_MS,
              tail_keep_ms=TAIL_KEEP_MS, min_cut_ms=MIN_CUT_MS, lead_ms=LEAD_MS, silence_db=-50.0, loud_db=-38.0):
    """(lead-in frames to trim, frame ranges to remove [(first, end, kind, gap_ms)], one decision row per pause)."""
    def frame_ceil(ms):
        return int(math.ceil(ms / frame_ms - 1e-9))

    def frame_floor(ms):
        return int(math.floor(ms / frame_ms + 1e-9))

    def frame_round(ms):
        return int(math.floor(ms / frame_ms + 0.5))

    def level_slice(a_ms, b_ms):
        return lv5[max(0, int(a_ms // 5)):max(0, int(b_ms // 5))]

    min_cut_f = frame_ceil(min_cut_ms)
    lead_f = max(0, frame_floor(spans[0][0] - lead_ms)) if spans else 0
    cuts, pauses = [], []
    for ((_, e0), (s1, _)), kind in zip(zip(spans, spans[1:]), kinds):
        gap = s1 - e0
        cap = end_cap_ms if kind == 'end' else mid_cap_ms
        lv = level_slice(e0, s1)
        win = max(0, min(tail_keep_ms, gap - lead_ms)) // 5
        # 1. a late release (/t/ /p/ /k/ burst after a long TTS closure) inside tail_keep_ms is the real end of the
        #    word: the pause is measured from where it has decayed
        burst = np.nonzero(lv[:win] > loud_db)[0]
        word_end = _decay_end(lv, int(burst[-1]) + 1, silence_db) * 5 if len(burst) else 0
        # 2. protected tail after the word: whatever is still audible (followed until it decays), and the whole
        #    tail_keep_ms whenever the cap leaves room for it (sentence ends)
        sound = np.nonzero(lv[word_end // 5:win] > silence_db)[0]
        decay = _decay_end(lv, word_end // 5 + int(sound[-1]) + 1, silence_db) * 5 + 10 - word_end if len(sound) else 0
        tail = word_end + max(decay, min(tail_keep_ms, cap - lead_ms))
        # 3. the next word's onset: from where its rise is first audible (scanning back from the VAD onset), plus
        #    10 ms, never less than half of lead_ms; at most lead_ms * 2 (a breath-in before it is dead air)
        hard_lead = _decay_end(lv[::-1], 0, silence_db) * 5 + 10
        lead = int(min(2 * lead_ms, max(lead_ms // 2, hard_lead)))
        keep = max(word_end + cap, tail + lead)
        row = {'src_ms': [e0, s1], 'kind': kind, 'gap_ms': gap, 'word_end_ms': word_end, 'tail_ms': tail,
               'lead_ms': lead, 'keep_ms': keep, 'removed_ms': 0}
        pauses.append(row)
        if gap <= keep:
            row['why'] = 'within cap'
            continue
        # whole frames only: the full tail_keep_ms rounds up; the softer minimums may round to the nearest frame,
        # but never into audible sound (hard_tail / hard_lead)
        hard_tail = word_end + decay
        if min(tail_keep_ms, cap - lead_ms) >= tail_keep_ms:
            lo = frame_ceil(e0 + tail)
        else:
            lo = max(frame_ceil(e0 + hard_tail), frame_round(e0 + tail))
        hi = min(frame_floor(s1 - hard_lead), frame_round(s1 - lead))
        loud = np.nonzero(level_slice(lo * frame_ms, hi * frame_ms) > loud_db)[0]
        if len(loud):   # speech-level sound inside the pause (a word the VAD missed): cut only beside it
            first = lo * frame_ms + int(loud[0]) * 5
            last = lo * frame_ms + (int(loud[-1]) + 1) * 5
            before, after = (lo, frame_floor(first - 20)), (frame_ceil(last + 20), hi)
            lo, hi = max(before, after, key=lambda r: r[1] - r[0])
        room = hi - lo
        if room < min_cut_f:
            row['why'] = f'protected (room {round(max(0, room) * frame_ms)} ms < min cut)'
            continue
        n = min(room, max(frame_ceil(gap - keep), min_cut_f))
        cuts.append((hi - n, hi, kind, gap))   # the removed run sits against the next word's lead
        row.update(removed_ms=round(n * frame_ms), why='cut')
    cuts = [c for c in cuts if c[0] >= lead_f and c[1] <= n_frames]
    return lead_f, cuts, pauses


def _decay_end(lv, i, silence_db, hold=3):
    """First 5 ms frame index >= i after which the level stays under silence_db for hold frames."""
    while i < len(lv) and np.any(lv[i:i + hold] > silence_db):
        i += 1
    return i


def segments_from_cuts(lead_f, cuts, n_frames):
    """Kept frame ranges [(a, b)] between the lead-in trim and the cuts."""
    segs, cursor = [], lead_f
    for a, b, *_ in cuts:
        if a > cursor:
            segs.append((cursor, a))
        cursor = b
    if n_frames > cursor:
        segs.append((cursor, n_frames))
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
    return int(round(sum(b - a for a, b in segs) / speed))


def filter_graph(segs, fps, sr=SR, speed=1.0, fade_ms=FADE_MS):
    """trim/atrim per kept frame range, 5 ms fades at internal splices, concat; optional synced speed-up."""
    parts, labels = [], ''
    fade = fade_ms / 1000
    for i, (a, b) in enumerate(segs):
        sa, sb = int(round(a * sr / fps)), int(round(b * sr / fps))
        dur = (sb - sa) / sr
        fades = []
        if i > 0:
            fades.append(f'afade=t=in:d={fade}')
        if i < len(segs) - 1:
            fades.append(f'afade=t=out:st={max(0.0, dur - fade):.6f}:d={fade}')
        parts.append(f'[0:v:0]trim=start_frame={a}:end_frame={b},setpts=PTS-STARTPTS[v{i}]')
        parts.append(f'[0:a:0]atrim=start_sample={sa}:end_sample={sb},asetpts=PTS-STARTPTS'
                     + ''.join(',' + f for f in fades) + f'[a{i}]')
        labels += f'[v{i}][a{i}]'
    graph = ';'.join(parts) + f';{labels}concat=n={len(segs)}:v=1:a=1'
    if abs(speed - 1.0) > 1e-6:   # both streams end on the same whole frame
        n_out = out_frames(segs, speed)
        graph += (f'[vc][ac];[vc]setpts=PTS/{speed},fps={fps:g},trim=end_frame={n_out}[v];'
                  f'[ac]atempo={speed},atrim=end_sample={int(round(n_out * sr / fps))}[a]')
    else:
        graph += '[v][a]'
    return graph


def tighten(in_video, out_video, captions_or_vad=None, end_cap_ms=END_CAP_MS, mid_cap_ms=MID_CAP_MS,
            tail_keep_ms=TAIL_KEEP_MS, min_cut_ms=MIN_CUT_MS, *, lead_ms=LEAD_MS, speed=1.0, measure=True,
            crf=15, preset='medium'):
    """Write a jump-cut copy of in_video (video H.264, audio FLAC 48 kHz: no extra lossy generation) and return
    {'cuts': [{'at_ms', 'removed_ms', 'kind', 'src_ms'}], 'time_map': [[src_a, src_b, dst_a]], 'captions', ...}.

    captions_or_vad: Whisper words on in_video's timeline ([{'text', 'startMs', 'endMs'}], classify sentence ends
    and get remapped), or speech spans [(start_ms, end_ms)] to use instead of the built-in VAD, or None."""
    t0 = time.time()
    in_video, out_video = Path(in_video), Path(out_video)
    fps, n_frames = probe_video(in_video)
    frame_ms = 1000.0 / fps
    x = audio.decode(in_video, sr=SR, channels=1).reshape(-1)
    n_frames = min(n_frames, int(len(x) / SR * fps + 1e-6))   # never ask atrim for audio past the end
    lv5, lv10 = levels_db(x, 5), levels_db(x, 10)
    p95 = float(np.percentile(lv5, 95))
    floor = float(np.percentile(lv5, 10))
    silence_db = max(p95 + SILENCE_REL_DB, floor + 4.0)
    loud_db = max(p95 + LOUD_REL_DB, silence_db + 3.0)
    captions = captions_or_vad if _is_captions(captions_or_vad) else None
    if captions_or_vad and not captions:
        spans = [tuple(s) for s in captions_or_vad]
    else:
        spans = speech_spans(lv10, max(-48.0, min(-34.0, float(np.percentile(lv10, 95)) + VAD_REL_DB)))
    kinds = gap_kinds(spans, captions)
    lead_f, cuts, pauses = plan_cuts(lv5, spans, kinds, frame_ms, n_frames, end_cap_ms=end_cap_ms, mid_cap_ms=mid_cap_ms,
                             tail_keep_ms=tail_keep_ms, min_cut_ms=min_cut_ms, lead_ms=lead_ms,
                             silence_db=silence_db, loud_db=loud_db)
    segs = segments_from_cuts(lead_f, cuts, n_frames)
    time_map, dst = [], 0.0
    for a, b in segs:
        time_map.append([round(a * frame_ms, 3), round(b * frame_ms, 3), round(dst, 3)])
        dst += (b - a) * frame_ms
    out_video.parent.mkdir(parents=True, exist_ok=True)
    audio.run(['ffmpeg', '-y', '-hide_banner', '-nostats', '-loglevel', 'error', '-i', in_video,
               '-filter_complex', filter_graph(segs, fps, speed=speed), '-map', '[v]', '-map', '[a]',
               '-r', f'{fps:g}', '-c:v', 'libx264', '-crf', str(crf), '-preset', preset, '-pix_fmt', 'yuv420p',
               '-c:a', 'flac', '-ar', str(SR), '-ac', '2', '-movflags', '+faststart', out_video])
    cut_list = []
    for a, b, kind, gap in cuts:
        cut_list.append({'at_ms': remap_ms(a * frame_ms, time_map, speed), 'removed_ms': round((b - a) * frame_ms),
                         'kind': kind, 'gap_ms': int(gap), 'kept_ms': int(round(gap - (b - a) * frame_ms)),
                         'src_ms': [round(a * frame_ms), round(b * frame_ms)]})
    result = {
        'source': str(in_video), 'cuts': cut_list, 'time_map': time_map, 'speed': speed, 'fps': fps,
        'lead_trim_ms': round(lead_f * frame_ms), 'legacy_lead_ms': _legacy_lead_ms(in_video),
        'duration_in_ms': round(n_frames * frame_ms),
        'duration_out_ms': round(out_frames(segs, speed) * frame_ms), 'removed_ms': round(n_frames * frame_ms - dst),
        'pauses': pauses, 'speech_src': [list(s) for s in spans], 'speech': [list(s) for s in remap_spans(spans, time_map, speed)],
        'thresholds_db': {'p95': round(p95, 1), 'silence': round(silence_db, 1), 'loud': round(loud_db, 1)},
        'params': {'end_cap_ms': end_cap_ms, 'mid_cap_ms': mid_cap_ms, 'tail_keep_ms': tail_keep_ms,
                   'min_cut_ms': min_cut_ms, 'lead_ms': lead_ms},
    }
    if captions:
        result['captions'] = remap_captions(captions, time_map, speed)
    result['render_s'] = round(time.time() - t0, 2)
    if measure:
        result['sync'] = measure_sync(in_video, out_video, time_map, fps, speed)
    return result


# ----------------------------------------------------------------------------- verification

def _gray_frames(path, w=36, h=64):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-map', '0:v:0', '-vf', f'scale={w}:{h},format=gray',
                          '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)


def _best_lag(ref_ext, seg, max_lag):
    """Lag k in [-max_lag, max_lag] maximising sum(seg[n] * ref_ext[max_lag + k + n]) (FFT cross-correlation)."""
    n = len(ref_ext) + len(seg)
    xc = np.fft.irfft(np.fft.rfft(ref_ext, n) * np.conj(np.fft.rfft(seg, n)), n)[:2 * max_lag + 1]
    return int(np.argmax(xc)) - max_lag


def measure_sync(src, out, time_map, fps=25.0, speed=1.0, max_lag_ms=15.0, sr=SR):
    """Lip-sync check of a tightened clip against its source, per kept segment:
    video lag = which source frame the output frame really shows (frame matching, +-3 frames), audio lag =
    cross-correlation of the output audio with the source audio at the mapped time (sample accurate).
    A/V offset = audio lag - video lag; both 0 means sound and picture still come from the same instant."""
    frame_ms = 1000.0 / fps
    fs, fo = _gray_frames(src), _gray_frames(out)
    xs = audio.decode(src, sr=sr, channels=1).reshape(-1)
    xo = audio.decode(out, sr=sr, channels=1).reshape(-1)
    max_lag = int(sr * max_lag_ms / 1000)
    rows = []
    for a, b, d in time_map:
        if b - a < 200:
            continue
        # video: frames from the middle of the segment
        vlags = []
        for frac in (0.3, 0.5, 0.7):
            t_dst = (d + frac * (b - a)) / speed
            k = int(round(t_dst / frame_ms))
            if k >= len(fo):
                continue
            t_src = a + (k * frame_ms * speed - d)
            j = int(round(t_src / frame_ms))
            cand = [(float(np.mean((fo[k] - fs[j + o]) ** 2)), o) for o in range(-3, 4) if 0 <= j + o < len(fs)]
            if cand:
                vlags.append(min(cand)[1] * frame_ms)
        # audio: the segment minus 40 ms at both ends (fades), against the source around the mapped position
        alag = None
        if speed == 1.0:
            o0, o1 = int((d + 40) * sr / 1000), int((d + b - a - 40) * sr / 1000)
            s0 = int((a + 40) * sr / 1000)
            seg_o = xo[o0:o1]
            ref = xs[s0 - max_lag:s0 + len(seg_o) + max_lag] if s0 >= max_lag else np.zeros(0)
            if len(seg_o) > sr // 20 and len(ref) == len(seg_o) + 2 * max_lag and float(np.std(seg_o)) > 1e-5:
                alag = _best_lag(ref, seg_o, max_lag) * 1000.0 / sr
        vlag = float(np.median(vlags)) if vlags else None
        rows.append({'src_ms': [a, b], 'video_lag_ms': vlag, 'audio_lag_ms': alag,
                     'offset_ms': None if alag is None or vlag is None else round(alag - vlag, 2)})
    offsets = [abs(r['offset_ms']) for r in rows if r['offset_ms'] is not None]
    probe = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,start_time,duration',
                            '-of', 'json', str(out)], capture_output=True, text=True, check=True).stdout
    streams = {s['codec_type']: s for s in json.loads(probe)['streams']}
    dv, da = (float(streams[k].get('duration', 'nan')) for k in ('video', 'audio'))
    return {'max_offset_ms': round(max(offsets), 2) if offsets else None, 'segments_measured': len(offsets),
            'video_s': round(dv, 3), 'audio_s': round(da, 3), 'duration_diff_ms': round(abs(dv - da) * 1000, 1),
            'start_time_s': {k: float(v.get('start_time', 0)) for k, v in streams.items()}, 'rows': rows}


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
    p.add_argument('--json', help='write the full result here')
    a = p.parse_args(argv)
    caps = json.loads(Path(a.captions).read_text()) if a.captions else None
    r = tighten(a.src, a.dst, caps, a.end_cap_ms, a.mid_cap_ms, a.tail_keep_ms, a.min_cut_ms, speed=a.speed)
    if a.json:
        Path(a.json).write_text(json.dumps(r, indent=1))
    print(json.dumps({k: r[k] for k in ('cuts', 'duration_in_ms', 'duration_out_ms', 'removed_ms', 'render_s')}
                     | {'sync': {k: v for k, v in r['sync'].items() if k != 'rows'}}, indent=1))


if __name__ == '__main__':
    sys.exit(main())
