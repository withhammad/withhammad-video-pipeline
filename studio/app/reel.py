"""One command from a HeyGen take to a rendered, mastered reel.

  python -m app.reel build <job_dir> [--take <file>] [--no-render]

Reads <job_dir>/plan.json (written per video by the agent session):
  {"take": "takes/<file>.mp4", "templates": [...edit_plan templates...], "emphasis": [...],
   "music": {...}, "title_insert": "job/title_insert.webm", "whisper_prompt": "...", "music_preset": "glow"}
Steps: transcribe the take → tighten (jump-cut the dead air in picture and sound, cuts.json) → enhance voice →
measure voice activity → snap word onsets → build edit.json + captions.srt → copy assets into
studio/remotion/public/job → render → master to -14 LUFS → platform exports (final.mp4, final_ig.mp4 without edit
lists, 128 kbps AAC) → voice gates table. plan.json "tighten": {...} passes options to app.tighten (e.g.
{"speed": 1.05}); "strict_gates": true makes a failed voice gate stop the build.
"""
import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

from . import audio, edit_plan, media, tighten, voice_gates

STUDIO = Path(__file__).resolve().parents[1]
REMOTION = STUDIO / 'remotion'


def transcribe_words(video, prompt=''):
    from faster_whisper import WhisperModel
    model = WhisperModel('small', device='cpu', compute_type='int8')
    segments, _ = model.transcribe(media.decode_pcm(video), word_timestamps=True, initial_prompt=prompt or None)
    caps = []
    for seg in segments:
        for w in seg.words:
            caps.append({'text': (' ' if caps else '') + w.word.strip(), 'startMs': round(w.start * 1000),
                         'endMs': round(w.end * 1000), 'timestampMs': 0, 'confidence': round(float(w.probability), 3)})
    return caps


def build(job, take=None, render=True):
    job = Path(job).resolve()
    plan = json.loads((job / 'plan.json').read_text())
    take = Path(take) if take else job / plan['take']
    # -- tighten: Whisper once on the take, then jump-cut HeyGen's pauses (audio + video on the same frames) into
    #    avatar.mp4; everything below (voice chain, captions, speech.json, edit) runs on the tightened clip.
    cut = tighten.tighten(take, job / 'avatar.mp4', transcribe_words(take, plan.get('whisper_prompt', '')),
                          **plan.get('tighten', {}))
    tighten.write_cuts(job, cut)
    # --
    audio.enhance_voice(job / 'avatar.mp4', job / 'avatar_enhanced.mp4')
    speech = audio.voice_activity(job / 'avatar_enhanced.mp4')
    caps = edit_plan.snap_onsets(cut['captions'], speech)
    (job / 'captions.json').write_text(json.dumps(caps, indent=1))
    (job / 'speech.json').write_text(json.dumps(speech))
    dur_ms = round(audio.probe_duration(job / 'avatar.mp4') * 1000)
    preset = plan.get('music_preset', 'glow')
    music_src = job / 'audio' / f'music_{preset}.wav'
    if not music_src.exists() or audio.probe_duration(music_src) * 1000 < dur_ms + 500:
        audio.make_music(preset, duration_s=dur_ms / 1000 + 1.0, out_wav=music_src)
    for kind in ('whoosh', 'pop', 'tick', 'riser'):
        if not (job / 'audio' / f'sfx_{kind}.wav').exists():
            audio.make_sfx(kind, out_wav=job / 'audio' / f'sfx_{kind}.wav')
    ov = plan.get('caption_overrides') or {}
    if ov.get('take') and Path(ov['take']).name == take.name:   # timings are only valid for the take they were measured on
        caps = edit_plan.apply_overrides(caps, tighten.remap_overrides(ov.get('words', []), cut, ov.get('timeline', 'trimmed')))
        (job / 'captions.json').write_text(json.dumps(caps, indent=1))
    edit = edit_plan.build(caps, plan['templates'], dur_ms, emphasis=plan.get('emphasis', []), music=plan.get('music'),
                           title_insert=plan.get('title_insert'), speech=speech, fps=25, cuts=cut['cuts'])
    if edit['inserts'] and len(edit['scenes']) > 1:
        edit['inserts'][0]['endMs'] = min(edit['inserts'][0]['endMs'], edit['scenes'][1]['startMs'])
    edit_plan.write(job, edit)
    pub = REMOTION / 'public' / 'job'
    pub.mkdir(parents=True, exist_ok=True)
    for name in ('avatar.mp4', 'avatar_enhanced.mp4'):
        shutil.copy2(job / name, pub / name)
    shutil.copy2(music_src, pub / 'music.wav')
    for kind in ('whoosh', 'pop', 'tick', 'riser'):
        shutil.copy2(job / 'audio' / f'sfx_{kind}.wav', pub / f'sfx_{kind}.wav')
    for shot in (job / 'shots').glob('*.png'):
        shutil.copy2(shot, pub / shot.name)
    if (job / 'inserts' / 'title_insert.webm').exists():
        shutil.copy2(job / 'inserts' / 'title_insert.webm', pub / 'title_insert.webm')
    result = {'durationMs': dur_ms, 'scenes': len(edit['scenes']), 'words': len(caps), 'cuts': len(cut['cuts']),
              'removed_ms': cut['removed_ms'], 'lip_sync_ms': (cut.get('sync') or {}).get('max_offset_ms')}
    if not render:
        return result
    raw = REMOTION / 'out' / f'{job.name}_raw.mp4'
    subprocess.run(['npx', 'remotion', 'render', 'Reel', str(raw), f'--props={job / "edit.json"}', '--codec=h264', '--crf=18'],
                   cwd=REMOTION, check=True, capture_output=True, text=True)
    audio.master(raw, job / 'final.mp4')
    # Instagram/Facebook spec: no edit lists, AAC <= 128 kbps, moov at the front.
    # Re-encode without B-frames so the first video pts is 0 (with -c:v copy, dropping the edit list exposed a
    # 67 ms B-frame delay and the picture lagged the audio by ~45 ms).
    audio.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(job / 'final.mp4'), '-c:v', 'libx264', '-crf', '17', '-preset', 'slow',
               '-bf', '0', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-movflags', '+faststart',
               '-use_editlist', '0', str(job / 'final_ig.mp4')])
    result.update({'final': str(job / 'final.mp4'), 'final_ig': str(job / 'final_ig.mp4'), 'analysis': audio.analyze(job / 'final.mp4')})
    # -- voice gates: measured on the finished job; prints a pass/fail table, stops the build only if strict
    result['voice_gates_failed'] = voice_gates.check_job(job, strict=plan.get('strict_gates', False))['failed']
    # --
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest='cmd', required=True)
    b = sub.add_parser('build')
    b.add_argument('job')
    b.add_argument('--take')
    b.add_argument('--no-render', action='store_true')
    args = parser.parse_args()
    print(json.dumps(build(args.job, args.take, render=not args.no_render), indent=2, default=str))


if __name__ == '__main__':
    sys.exit(main())
