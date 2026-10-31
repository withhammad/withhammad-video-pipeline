"""Retime the coding-comedy review edit to the take in avatar-source.mp4.

Every cut, reaction hold, round boundary, overlay window and caption is measured on this take
(Whisper word timings, refined on the voice's own energy), so a new take never inherits another
take's seconds. v1-original-voice/build-timing.py holds the hand-timed version for the old take.

  python build-timing.py transcribe          # word timings -> transcript.json (faster-whisper medium)
  python build-timing.py build [--av 0.10]   # cuts, holds, captions, comedy-data.json, voice wav
--av moves the sound earlier by that many seconds (measured lip lead, see qa/lipsync-*.jpg).
"""
import json, re, subprocess, sys, wave
from difflib import SequenceMatcher
from pathlib import Path
import numpy as np

R = Path(__file__).resolve().parents[2]
O = R / 'outputs/coding-comedy-review'
P = R / 'studio/remotion/public/review-20261023'
S = R / 'studio/remotion/src/review-20261023'
FPS, SR = 30, 48000
SPF = SR // FPS

# Dialogue turns: who speaks, and which illustrated prop the AI side shows while it is on screen.
LINES = [
    ('Rename this button to Start, please.', 'human', 'button'),
    ('Already building.', 'ai', 'button'),
    ('Twenty-four files? I asked for one word.', 'human', 'files'),
    ('I added translation support.', 'ai', 'translation'),
    ('For one word?', 'human', 'translation'),
    ('Every button, in thirty languages.', 'ai', 'languages'),
    ('This is a one-page demo.', 'human', 'languages'),
    ('You can expand now.', 'ai', 'languages'),
    ('And this customer database?', 'human', 'database'),
    ('It saves their preferred language.', 'ai', 'database'),
    ('Fine. Show me Start.', 'human', 'button'),
    ("You'll need a profile first.", 'ai', 'profile'),
    ('A profile, just to read my button?', 'human', 'profile'),
    ('And a verified email.', 'ai', 'verify'),
    ('Ah. Nobody connected the mail service.', 'ai', 'error'),
    ("I'll handle that.", 'ai', 'cascade2'),
    ('Stop renovating the internet!', 'human', 'ending'),
]
# Reaction holds: (first word of the phrase the hold comes BEFORE, seconds, kind). None = after the last word.
PADS = [('Twenty-four', 3.0, 'cascade'), ('This', 1.2, 'languages'), ('Fine.', 1.3, 'database'),
        ('A', 1.3, 'profile'), ('Nobody', 1.8, 'error'), ('Stop', 2.0, 'cascade2'), (None, 2.0, 'ending')]
# Caption phrases, in script order; together they cover every script word once.
PHRASES = ['Rename this button to Start, please.', 'Already building.', 'Twenty-four files?', 'I asked for one word.',
           'I added translation support.', 'For one word?', 'Every button,', 'in thirty languages.',
           'This is a one-page demo.', 'You can expand now.', 'And this customer database?',
           'It saves their preferred language.', 'Fine. Show me Start.', "You'll need a profile first.", 'A profile,',
           'just to read my button?', 'And a verified email.', 'Ah.', 'Nobody connected the mail service.',
           "I'll handle that.", 'Stop renovating the internet!']
NUMBERS = {'24': 'twenty four', '30': 'thirty', '1': 'one'}
# Effect renders from the reel skills pack, made on a fixed slice of the take (video-effects run.cjs --from/--to/--at).
# grid-dive: run.cjs grid-dive avatar-source.mp4 fx/grid-dive-files.mp4 --from 4.00 --to 7.11 --at 0.55 --keep, then the
# even 60 fps frames encoded at 30 fps (fx/grid-dive-files-crisp.mp4: the engine's 2-frame blend doubled the face).
EFFECTS = [{'src': 'grid-dive-files.mp4', 'from_s': 4.00, 'frames': 94, 'round': 'files', 'busy_s': (0.55, 1.58)}]


def norm(word):
    w = word.lower().replace('’', "'").replace('-', ' ')
    w = re.sub(r"[^a-z0-9' ]", '', w)
    return [NUMBERS.get(t, t) for t in w.split()]


def tokens(text):
    """Script words with the index of the token each one starts at (hyphenated words are two tokens)."""
    out = []
    for word in text.split():
        for t in ' '.join(norm(word)).split():
            out.append((word, t))
    return out


def transcribe():
    from faster_whisper import WhisperModel
    script = (O / 'script.txt').read_text().strip()
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(O / 'avatar-source.mp4'), '-vn', '-ac', '1', '-ar', '16000',
                    str(O / 'audio16k.wav')], check=True)
    model = WhisperModel('medium', device='cpu', compute_type='int8')
    with wave.open(str(O / 'audio16k.wav')) as w:  # decoded here: the venv's PyAV rejects faster-whisper's open() call
        pcm = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    segs, info = model.transcribe(pcm, language='en', word_timestamps=True, initial_prompt=script,
                                  vad_filter=False, beam_size=5)
    segs = [{'start': s.start, 'end': s.end, 'text': s.text,
             'words': [{'word': w.word, 'start': w.start, 'end': w.end, 'probability': w.probability} for w in s.words]}
            for s in segs]
    (O / 'transcript.json').write_text(json.dumps({'text': ''.join(s['text'] for s in segs), 'segments': segs,
                                                   'language': info.language}, indent=1) + '\n')
    print(''.join(s['text'] for s in segs))


def envelope(a):
    """Level per 10 ms hop in dB relative to the take's 95th-percentile hop."""
    hop = SR // 100
    n = len(a) // hop
    rms = np.sqrt(np.mean(((a[:n * hop].astype(np.float64) / 32768) ** 2).reshape(n, hop), axis=1)) + 1e-9
    db = 20 * np.log10(rms)
    return db - np.percentile(db, 95)


def build(av):
    src = O / 'avatar-source.mp4'
    probe = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(src)],
                                      capture_output=True, text=True, check=True).stdout)
    video = next(s for s in probe['streams'] if s['codec_type'] == 'video')
    src_frames = int(float(video['duration']) * FPS)  # output (30 fps) frames the take covers; HeyGen delivers 25 fps
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-vn', '-ac', '1', '-ar', str(SR), '-c:a', 'pcm_s16le',
                    str(O / 'voice-source.wav')], check=True)
    with wave.open(str(O / 'voice-source.wav')) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
    # Sound moved earlier by av seconds: the sample heard with source frame f starts at f/FPS + av.
    shift = round(av * SR)
    a = np.concatenate([a[shift:], np.zeros(max(shift, 0), np.int16)]) if shift >= 0 else np.concatenate([np.zeros(-shift, np.int16), a])
    a = a[:src_frames * SPF] if len(a) >= src_frames * SPF else np.concatenate([a, np.zeros(src_frames * SPF - len(a), np.int16)])
    env = envelope(a)
    speech = env > -38  # 10 ms hops at speech level

    # Align script words to Whisper words.
    raw = json.loads((O / 'transcript.json').read_text())
    hw = [w for s in raw['segments'] for w in s['words']]
    htoks = [(i, t) for i, w in enumerate(hw) for t in norm(w['word'])]
    script = ' '.join(t for t, _, _ in LINES)
    stoks = tokens(script)
    sm = SequenceMatcher(a=[t for _, t in stoks], b=[t for _, t in htoks], autojunk=False)
    tok_time = [None] * len(stoks)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            w = hw[htoks[blk.b + k][0]]
            tok_time[blk.a + k] = (w['start'] - av, w['end'] - av)
    missing = [stoks[i][1] for i, t in enumerate(tok_time) if t is None]
    if missing:
        print('WARNING: script tokens not heard by Whisper:', missing)
    for i, t in enumerate(tok_time):  # bridge any unmatched token between its neighbours
        if t is None:
            prev = next((tok_time[j][1] for j in range(i - 1, -1, -1) if tok_time[j]), 0.0)
            nxt = next((tok_time[j][0] for j in range(i + 1, len(stoks)) if tok_time[j]), prev)
            tok_time[i] = (prev, nxt)
    words = []  # (script word, start, end) per script word
    k = 0
    for word in script.split():
        n = len(norm(word))
        words.append((word, tok_time[k][0], tok_time[k + n - 1][1]))
        k += n

    def refine_start(t, floor):
        """Onset of the speech run that Whisper's start falls in or just before (never before floor)."""
        i = max(int(floor * 100), min(int(t * 100), len(speech) - 1))
        lo = int(max(floor, t - 0.6) * 100)
        while i > lo and speech[i - 1]:
            i -= 1
        if not speech[i]:  # Whisper start inside silence: walk forward to the onset
            hi = min(len(speech) - 1, int((t + 0.6) * 100))
            while i < hi and not speech[i]:
                i += 1
        return i / 100

    def refine_end(t, ceil):
        i = min(int(t * 100), len(speech) - 1)
        hi = int(min(ceil, t + 0.6) * 100)
        while i < hi and speech[i]:
            i += 1
        if i > 0 and not speech[i - 1]:  # Whisper end inside silence: walk back to the decay
            lo = max(0, int((t - 0.6) * 100))
            while i > lo and not speech[i - 1]:
                i -= 1
        return i / 100 + 0.01

    # Phrase spans in script words, refined to the audio at phrase edges.
    spans, k = [], 0
    for ph in PHRASES:
        n = len(ph.split())
        assert ' '.join(w for w, _, _ in words[k:k + n]) == ph, (ph, words[k:k + n])
        spans.append([k, k + n, words[k][1], words[k + n - 1][2]])
        k += n
    assert k == len(words)
    for j, sp in enumerate(spans):
        floor = spans[j - 1][3] if j else 0.0
        sp[2] = refine_start(sp[2], floor)
        ceil = spans[j + 1][2] if j + 1 < len(spans) else len(a) / SR
        sp[3] = refine_end(sp[3], ceil)
    # Cuts: the quietest whole frame inside the silence before each held phrase.
    take_end = min(src_frames, round((spans[-1][3] + 0.45) * FPS))
    cuts = []
    for first, pad, kind in PADS:
        if first is None:
            cut = take_end
        else:
            j = next(i for i, ph in enumerate(PHRASES) if ph.split()[0] == first)
            g0, g1 = spans[j - 1][3], spans[j][2]
            frames = range(int(np.ceil(g0 * FPS)) + 1, int(np.floor(g1 * FPS)))
            if not frames:
                raise SystemExit(f'No silent frame between {PHRASES[j-1]!r} and {PHRASES[j]!r}: {g0:.2f}-{g1:.2f}')
            level = {f: env[max(0, f * 100 // FPS - 2):f * 100 // FPS + 3].max() for f in frames}
            cut = min(frames, key=lambda f: (level[f], abs(f - (g0 + g1) / 2 * FPS)))
            print(f'cut {kind:10s} {cut / FPS:6.2f}s  silence {g0:.2f}-{g1:.2f}  peak {level[cut]:.1f} dB re p95')
        cuts.append((cut, round(pad * FPS), kind))

    clips, chunks, src0, out = [], [], 0, 0
    fade = np.linspace(0, 1, SR * 30 // 1000)  # 30 ms each side of every join (cuts sit in silence anyway)
    for cut, pad, kind in cuts:
        piece = a[src0 * SPF:cut * SPF].astype(np.float64)
        if len(piece) > 2 * len(fade):
            if src0:
                piece[:len(fade)] *= fade
            piece[-len(fade):] *= fade[::-1]
        clips.append({'from': out, 'duration': cut - src0, 'start': src0 / FPS, 'end': cut / FPS, 'kind': 'take'})
        chunks.append(piece.astype(np.int16))
        out += cut - src0
        clips.append({'from': out, 'duration': pad, 'start': cut / FPS, 'end': cut / FPS, 'kind': kind})
        chunks.append(np.zeros(pad * SPF, np.int16))
        out += pad
        src0 = cut
    full = np.concatenate(chunks)
    with wave.open(str(P / 'comedy-voice.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(full.tobytes())

    def timeline(t):
        return t + sum(p for c, p, _ in cuts if t * FPS >= c) / FPS

    # Rounds switch the picture in the middle of the silence between turns.
    line_spans, k = [], 0
    for text, role, prop in LINES:
        n = len(text.split())
        first = next(sp for sp in spans if sp[0] == k)
        last = next(sp for sp in spans if sp[1] == k + n)
        line_spans.append((first[2], last[3], role, prop))
        k += n
    rounds = []
    for i, (s0, e0, role, prop) in enumerate(line_spans):
        a_ = 0.0 if i == 0 else round((line_spans[i - 1][1] + s0) / 2, 3)
        b_ = round((e0 + line_spans[i + 1][0]) / 2, 3) if i + 1 < len(line_spans) else round(src_frames / FPS + 10, 3)
        rounds.append({'a': a_, 'b': b_, 'role': role, 'prop': prop})
    captions = []
    for j, (sp, ph) in enumerate(zip(spans, PHRASES)):
        start, end = timeline(sp[2]), timeline(sp[3])
        nxt = timeline(spans[j + 1][2]) if j + 1 < len(spans) else end + 1
        end = min(end + 0.12, nxt - 0.04)
        captions.append({'startMs': round(start * 1000), 'endMs': round(end * 1000), 'text': ph})
    # Effect clips cover the take from their slice start to the end of their round (the layout change hides the
    # return to the take's framing); a take clip must start exactly where the slice starts, or the effect is re-rendered.
    effects = []
    for e in EFFECTS:
        clip = next((c for c in clips if c['kind'] == 'take' and round(c['start'] * FPS) == round(e['from_s'] * FPS)), None)
        if clip is None:
            raise SystemExit(f"{e['src']}: no take clip starts at {e['from_s']}s; re-render the effect on the new cut")
        end = next(r['b'] for r in rounds if r['prop'] == e['round'])
        dur = min(e['frames'], clip['duration'], round((end - e['from_s']) * FPS))
        effects.append({'src': e['src'], 'from': clip['from'], 'duration': dur,
                        'busyFrom': clip['from'] + round(e['busy_s'][0] * FPS), 'busyTo': clip['from'] + round(e['busy_s'][1] * FPS)})
    # animated-numbers: each count lands on its moment (output seconds) and holds after it.
    hold = {c['kind']: c for c in clips if c['kind'] != 'take'}
    thirty = next(st for w, st, _ in words if w == 'thirty')
    counts = {'cascade': (hold['cascade']['from'] + hold['cascade']['duration']) / FPS, 'thirty': round(timeline(thirty), 3),
              'cascade2': hold['cascade2']['from'] / FPS}
    data = {'fps': FPS, 'frames': out, 'duration': out / FPS, 'av_offset_s': av, 'clips': clips, 'captions': captions,
            'rounds': rounds, 'hookEnd': rounds[1]['a'],
            'languagesFrom': next(r['a'] for r in rounds if r['prop'] == 'languages'), 'effects': effects, 'counts': counts}
    (O / 'timing.json').write_text(json.dumps(data, indent=2) + '\n')
    (S / 'comedy-data.json').write_text(json.dumps(data, indent=2) + '\n')

    def stamp(t, sep=','):
        ms = round(t * 1000)
        return f'{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02}{sep}{ms % 1000:03}'
    (O / 'captions.srt').write_text('\n\n'.join(f'{i + 1}\n{stamp(c["startMs"] / 1000)} --> {stamp(c["endMs"] / 1000)}\n{c["text"]}'
                                               for i, c in enumerate(captions)) + '\n')
    (O / 'captions.vtt').write_text('WEBVTT\n\n' + '\n\n'.join(f'{stamp(c["startMs"] / 1000, ".")} --> {stamp(c["endMs"] / 1000, ".")}\n{c["text"]}'
                                                              for c in captions) + '\n')
    for cut, _, kind in cuts:  # the hold freezes on the picture shown in the last output frame before the cut
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-ss', f'{max(cut - 1, 0) / FPS:.4f}',
                        '-frames:v', '1', '-q:v', '2', str(P / f'{kind}-hold.jpg')], check=True)
    subprocess.run(['cp', str(src), str(P / 'comedy.mp4')], check=True)
    print(f'Comedy {out} frames = {out / FPS:.2f}s from {src_frames} source frames; {len(clips)} clips; '
          f'{len(captions)} captions; av {av:+.3f}s')


if __name__ == '__main__':
    if sys.argv[1:2] == ['transcribe']:
        transcribe()
    else:
        av = float(sys.argv[sys.argv.index('--av') + 1]) if '--av' in sys.argv else 0.0
        build(av)
