# TikTok + X: schedule queued posts natively through Chrome

Owner 2026-11-02 ("add them now"): TikTok @withhammad and X @HammadYousufAI get every reel never posted there,
2 a day. Neither has a free posting API, so each `tiktok` / `x` entry in outputs/video-pipeline/repost-queue.json
is scheduled ahead in TikTok Studio / X's own scheduler (posts go out even if the Mac sleeps), then recorded:

    cd studio
    .venv/bin/python -m app.repost_queue chrome                      # pending TikTok + X entries (video, caption, slot)
    .venv/bin/python -m app.repost_queue mark <id> <url> --scheduled  # after the platform confirms

Videos are `final_social.mp4` (python -m app.exports; the Chrome upload limit is 10 MB). run-due never touches
these lanes. TikTok schedules at most 10 days ahead; X allows more.

The Chrome window is often minimized (viewport 0x0): screenshots and coordinate clicks fail, so drive both sites
with javascript_tool, file_upload for the video, and one real `Delete` key press on TikTok.

Codex Chrome check (8 Nov): activate the task-owned tab and unminimize its window before interacting.
Background React pages can return stale/empty dialogs even after a successful click. Keep one platform visible
until its schedule is confirmed. Standard file inputs accept an explicitly supplied local File/DataTransfer;
scope X selectors to `[role=dialog]` so the home composer is not edited accidentally.
On TikTok, paste after the filename, then select only that filename prefix and send a real Delete key.
Do not use `execCommand('delete')` to clear Draft.js: it can leave the first paragraph missing from the DOM
while the preview still contains it. Compare the visible caption against the approved copy before scheduling.
The AI label follows the content: enabled for Hammad's synthetic presenter, off for HARNESS's diagram-only edit.
After submitting, reload the TikTok content list before treating a missing new row as a failure; do not resubmit.

## TikTok Studio (https://www.tiktok.com/tiktokstudio/upload?from=webapp)
1. find the video file input, file_upload the video; wait until the page text shows "Uploaded".
2. Caption: `.public-DraftEditor-content` is pre-filled with the file name. Paste the caption with a synthetic
   ClipboardEvent('paste') carrying a DataTransfer, then select the leading file name with a Range and press Delete.
3. AI label: the checkbox in the row of the text "AI-generated content" -> click until checked.
4. `input[value=schedule]`.click(); in the "When to post" box click the time input, then the hour and minute
   '00' items (two-digit leaves: first 24 hours, then minutes); set the date input from its calendar if needed.
5. Click the button "Schedule"; the content list must show the caption with e.g. "Nov 2, 2:00 PM (GMT+4) Dubai".

## X (https://x.com/compose/post)
1. `[data-testid="scheduleOption"]`.click(); set the six selects (SELECTOR_1..6_LABEL: month, day, year, hour 1-12,
   minute, am/pm) with the native value setter + change event; the dialog must read "Will send on ..." and
   "Gulf Standard Time"; click "Confirm".
2. Paste the caption into `[data-testid="tweetTextarea_0"]` (same paste event), file_upload the video to the
   dialog's "Add photos or video" input, wait for the <video> and an enabled `tweetButton` ("Schedule").
3. Click it; the toast must say "Your post will be sent on <date> at <time>".
