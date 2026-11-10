"""Prepare a separate REPO phone export without replacing the approved master."""
import hashlib
import json
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path('/Users/hammad/withhammad-video-pipeline')
sys.path.insert(0, str(ROOT / 'studio'))
from app import audio

JOB = ROOT / 'studio/.local/jobs/dfa218634321'
SOURCE = JOB / 'v4-revision/final.mp4'
VOICE = JOB / 'v4-revision/voice.wav'
OUT = Path('/Users/hammad/Downloads/10 November/REPO - Manual Upload')
OUT.mkdir(parents=True, exist_ok=True)
DEST = OUT / 'REPO - add your app sound.mp4'

def probe(path):
    return json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-show_entries',
        'stream=codec_name,width,height,pix_fmt,color_range,nb_frames,r_frame_rate,start_time:format=duration',
        '-of', 'json', str(path)], text=True))

def video_hash(path):
    return subprocess.check_output([
        'ffmpeg', '-v', 'error', '-i', str(path), '-map', '0:v:0',
        '-c:v', 'copy', '-f', 'hash', '-hash', 'sha256', '-'], text=True).strip()

source_probe = probe(SOURCE)
duration = float(source_probe['format']['duration'])
meter = audio._ebur128(str(VOICE))
# One constant gain, with headroom for the low-level native music selected on phone.
# No regenerated speech, pitch change, timing change or source separation.
gain = min(-14.5 - meter['lufs'], -2.0 - meter['true_peak_dbtp'])
subprocess.run([
    'ffmpeg', '-v', 'error', '-y', '-i', str(SOURCE), '-i', str(VOICE),
    '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy',
    '-af', f'volume={gain:.6f}dB', '-c:a', 'aac', '-b:a', '192k',
    '-ar', '48000', '-ac', '2', '-t', str(duration), '-movflags', '+faststart',
    str(DEST)], check=True)
after = probe(DEST)
final_meter = audio._ebur128(str(DEST))
picture_hash = video_hash(SOURCE)
assert picture_hash == video_hash(DEST), 'The approved video bitstream changed'
assert source_probe['streams'][0] == after['streams'][0]
assert abs(float(after['format']['duration']) - duration) < 1 / 30
assert abs(final_meter['lufs'] - (meter['lufs'] + gain)) < .3, final_meter
assert final_meter['true_peak_dbtp'] <= -1.5, final_meter

shutil.copy2(JOB / 'cover_1080x1920.jpg', OUT / 'REPO - cover.jpg')
shutil.copy2(JOB / 'v4-revision/captions.srt', OUT / 'REPO - captions.srt')
copy_path = Path('/Users/hammad/Downloads/10 November/Business/REPO/copy.md')
copy = copy_path.read_text()
instagram = copy.split('## Instagram\n\n', 1)[1].split('\n## ', 1)[0].strip()
instagram = instagram.replace(
    'Comment REPO for the five links and setup guide. Follow @withhammad.ai so the DM reaches you.',
    'Comment REPO for the five links and setup guide. Check your DM, follow @withhammad.ai, then tap "I followed" to receive the guide.')
(OUT / 'Instagram caption.txt').write_text(instagram + '\n')
youtube = copy.split('## Youtube\n\n', 1)[1].split('\n## ', 1)[0].strip()
(OUT / 'YouTube title and description.txt').write_text(youtube + '\n')
tiktok = copy.split('## Tiktok\n\n', 1)[1].split('\n## ', 1)[0].strip()
(OUT / 'TikTok caption.txt').write_text(tiktok + '\n')
(OUT / 'START HERE.txt').write_text('''REPO — manual phone upload

WAIT FOR THE GUIDE AND REPO RULE TO BE DEPLOYED BEFORE PUBLISHING.
PR #20: https://github.com/withhammad/withhammad-rebuild/pull/20
Expected guide: https://withhammad.com/resources/five-open-source-ai-repos

Use: REPO - add your app sound.mp4
This is the approved 45.567-second edit and corrected REFERRAL narration, with
the old background music omitted so you can select one native platform sound.
The original approved master is preserved in 10 November/Business/REPO.
Zero new HeyGen credits. No new voice, speed change, pitch shift or visual edits.

INSTAGRAM — start here after Codex confirms deployment
1. Transfer this folder's MP4, cover and caption to your phone.
2. In @withhammad.ai, create a Reel and select the MP4.
3. Choose a suitable currently trending sound available to this account.
   Keep original audio at 100; start the added sound around 5–10, then preview
   the whole reel and lower it if any word is obscured. Do not use text-to-speech
   or replace the corrected voice. Use music cleared for the account/use.
4. Keep the full video length and use the supplied cover. Paste Instagram caption.
   Invite @with.hammad and @hammadagentic.ai as collaborators. Enable the platform
   AI disclosure for the synthetic presenter and leave comments enabled.
5. Share, then send Codex the reel URL. Codex will record this manual post,
   prevent a duplicate upload, and verify comments and the actual DM flow.

INSTAGRAM BOT FLOW
Comment REPO -> DM asks to follow -> viewer follows and taps "I followed"
-> Instagram confirms the follow -> bot sends the guide link.
A follow alone is not the trigger: the person must comment or DM REPO.
If the follow check is unavailable, the updated bot asks them to retry; no link.
The rule matches manual uploads on @withhammad.ai without a media-ID binding.
First live proof still requires a real comment and confirmation in the DM.

YOUTUBE SHORTS
On HAMMAD YOUSUF (@with.hammad), create/upload a Short in the phone app,
select this MP4, add a permitted sound from YouTube's library, and keep your
original narration clear. Use the supplied title/description and AI disclosure.
Send Codex the Short URL afterward. The channel-wide API bot can detect its
keyword comments automatically. It gives a PUBLIC reply, not an Instagram DM.
Subscriptions may be private, so it cannot reliably require every commenter to
subscribe first. URLs in Shorts comments/descriptions are not clickable; a
verified channel-profile guide link is the preferred clickable path.

TIKTOK
Upload this MP4 in @withhammad. Choose a suitable current sound permitted for
this account/use, preserve the voice, paste the TikTok caption and use the cover.
Enable the platform AI disclosure. Send Codex the URL for the reply watchlist.
The existing routine replies publicly with the resource path; it does not verify
follows or send the same follow-gated Instagram DM flow.

Codex will not automatically upload this REPO package after a two-hour timeout.
Platform sounds are selected inside each platform. Do not export one platform's
licensed track into the other apps. A trending sound does not guarantee reach.

Official YouTube references:
https://support.google.com/youtube/answer/16215842
https://support.google.com/youtube/answer/7280190
https://support.google.com/youtube/answer/13748639
''')
report = {
    'checked_at': datetime.now(timezone.utc).isoformat(),
    'job': 'dfa218634321', 'keyword': 'REPO',
    'source': str(SOURCE), 'voice_stem': str(VOICE), 'phone_export': str(DEST),
    'source_sha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'phone_export_sha256': hashlib.sha256(DEST.read_bytes()).hexdigest(),
    'video_bitstream_sha256': picture_hash, 'identical_picture_bitstream': True,
    'probe': after, 'voice_only_loudness': final_meter, 'static_gain_db': gain,
    'audio_status': 'Voice-only handoff, not a mastered music mix. Static gain is peak-limited; check the full mix in the phone app after selecting its sound.',
    'voice_speed': 1, 'pitch_shift': 0, 'heygen_credits': 0,
    'music': 'Owner selects native platform music on phone before publication',
    'automatic_upload': False, 'release_blocker': 'PR #20 must be deployed and verified',
}
(OUT / 'verification.json').write_text(json.dumps(report, indent=2) + '\n')
(ROOT / 'work/manual-repo/export-proof.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({k: report[k] for k in ['phone_export', 'identical_picture_bitstream', 'voice_only_loudness', 'static_gain_db', 'heygen_credits']}, indent=2))
