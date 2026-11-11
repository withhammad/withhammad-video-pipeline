"""The no-music cut for the sound platforms (owner red line 2026-11-11): same picture, voice + SFX only, mastered."""
import json
import subprocess

import pytest

from app import nomusic


def ff(*args):
    subprocess.run(['ffmpeg', '-y', '-v', 'error', *args], check=True)


@pytest.fixture
def job(tmp_path):
    """A 3 s job: final.mp4 (voice + loud music baked in), a slightly longer final_social.mp4, and separate stems."""
    jdir = tmp_path / 'jobs' / 'j1'
    mix = jdir / 'referral-v4'
    mix.mkdir(parents=True)
    # narration stem: a 300 Hz tone that pauses (stands in for speech); sfx: a short click
    ff('-f', 'lavfi', '-i', 'sine=frequency=300:duration=2.6:sample_rate=48000', '-af', 'volume=0.25', '-ac', '2',
       str(mix / 'narration_pcm.wav'))
    ff('-f', 'lavfi', '-i', 'sine=frequency=2000:duration=0.05:sample_rate=48000', '-af', 'adelay=1000|1000,volume=0.1',
       '-ac', '2', str(mix / 'sfx_ticks.wav'))
    # the "music" baked into the master is an 80 Hz drone, so its absence is measurable
    for name, seconds in (('final.mp4', 3.0), ('final_social.mp4', 3.04)):
        ff('-f', 'lavfi', '-i', f'testsrc=size=180x320:rate=30:duration={seconds}',
           '-f', 'lavfi', '-i', f'sine=frequency=80:duration={seconds}:sample_rate=48000',
           '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', str(jdir / name))
    return jdir


def band_db(path, hz):
    """Level of a narrow band around hz in the file's audio (dB), to tell the drone from the voice."""
    out = subprocess.run(['ffmpeg', '-v', 'info', '-i', str(path), '-map', '0:a:0',
                          '-af', f'bandpass=f={hz}:width_type=h:w=20,volumedetect', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    return float(out.split('mean_volume:')[1].split('dB')[0])


def test_build_keeps_the_picture_and_leaves_the_music_out(job):
    report = nomusic.build('j1', jobs=job.parent)
    assert report['pass'] and set(report['exports']) == {'final_nomusic.mp4', 'final_social_nomusic.mp4'}
    for name, export in report['exports'].items():
        assert export['picture_identical'], name                    # -c:v copy: not one frame dropped or re-encoded
        assert -14.7 <= export['lufs'] <= -13.3 and export['true_peak_dbtp'] <= -1.5
    # 15 dB, not more: the measuring band-pass is wide enough to let a little of the loud 300 Hz voice through
    assert band_db(job / 'final.mp4', 80) > band_db(job / 'final_nomusic.mp4', 80) + 15      # the drone is gone
    assert band_db(job / 'final_nomusic.mp4', 300) > band_db(job / 'final_nomusic.mp4', 80) + 15   # the voice is there
    saved = json.loads((job / 'nomusic' / 'report.json').read_text())
    assert saved['stems']['narration'] == 'narration_pcm.wav' and saved['stems']['sfx'] == ['sfx_ticks.wav']
    assert saved['narration'] == {'retimed': False, 'filtered': False, 'gain': 'whole-mix master only'}


def test_a_job_with_baked_music_only_is_refused_not_guessed(tmp_path):
    jdir = tmp_path / 'jobs' / 'old'
    jdir.mkdir(parents=True)
    ff('-f', 'lavfi', '-i', 'testsrc=size=180x320:rate=30:duration=1', '-f', 'lavfi', '-i',
       'sine=frequency=80:duration=1:sample_rate=48000', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
       '-shortest', str(jdir / 'final.mp4'))
    with pytest.raises(nomusic.NoStems, match='stem separation'):
        nomusic.build('old', jobs=jdir.parent)
    assert not (jdir / 'final_nomusic.mp4').exists()


def test_status_lists_queued_sound_platform_jobs(job, tmp_path):
    queue = tmp_path / 'q.json'
    rows = [{'job': 'j1', 'platform': 'instagram', 'status': 'pending', 'keyword': 'A', 'title': 't'},
            {'job': 'j1', 'platform': 'facebook', 'status': 'pending', 'keyword': 'A', 'title': 't'},      # same job once
            {'job': 'old', 'platform': 'tiktok', 'status': 'scheduled', 'keyword': 'B', 'title': 't'},
            {'job': 'li', 'platform': 'linkedin', 'status': 'pending', 'keyword': 'C', 'title': 't'},        # keeps its music
            {'job': 'done', 'platform': 'youtube', 'status': 'posted', 'keyword': 'D', 'title': 't'}]
    queue.write_text(json.dumps({'entries': rows}))
    (job.parent / 'old').mkdir()
    out = {r['job']: r['nomusic'] for r in nomusic.status(queue, job.parent)}
    assert out == {'j1': 'buildable', 'old': 'needs_separation'}
    nomusic.build('j1', jobs=job.parent)
    assert {r['job']: r['nomusic'] for r in nomusic.status(queue, job.parent)}['j1'] == 'ready'
