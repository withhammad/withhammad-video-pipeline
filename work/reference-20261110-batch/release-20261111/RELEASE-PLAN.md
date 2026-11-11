# Business batch release — 11 November 2026

Updated 13:10 GST. Queue booking authorized by root and owner; future-date extension below is PLAN ONLY. No manual live poster, queue rebuild, paid generation, or commits by this agent.

## Applied today

| Platform | HIGGS | ADVISOR | State |
|---|---|---|---|
| Instagram @withhammad.ai |13:00–15:00 phone; fallback15:03|18:15–20:15 phone; fallback21:03|Pending queue, full windows booked12:57:54 |
| YouTube |13:00–15:00 phone; fallback15:03|18:15–20:15 phone; fallback21:03|Pending queue |
| Facebook |15:00 slot →15:03 runner|19:00 slot →19:03 runner|Pending queue |
| LinkedIn |15:00 slot →15:03 runner|19:00 slot →19:03 runner|Pending queue |
| TikTok @withhammad |14:00|20:15|Pending **native upload not completed** |
| X @HammadYousufAI |14:00|18:00|Pending **native upload not completed** |

Actual Facebook/LinkedIn HARNESS carousel records today are11:03:06GST. Four-hour gaps to HIGGS15:03 give room for normal publication latency;15:03→19:03 gives another four hours. The13:03 automated run completed with no posts/failures/missed entries. Historical REFERRAL rows with11Nov slot labels were actually posted7Nov and were preserved.

For IG/YT, owner must mark an actual manual post before fallback under the same queue lock. Do not post ADVISOR before18:15. Check HIGGS actual publication timestamp first; if it published after15:15 due a delayed runner, shift ADVISOR start to at least that timestamp+3h. A materially delayed/failed runner invalidates any fixed-clock spacing assumption; do not retry blindly.

Native upload blocker: extension chooser reports file-URL upload permission disabled. Native Chrome fallback reports Mac locked and automatic unlock failed. Owner must unlock the Mac to use the existing native picker; no extension setting change is required for that fallback. Four native new rows remain pending, not falsely marked scheduled. No files uploaded in this attempt.

## Older rows already moved

Exact two urgent moves: `urgent-older-moves.json`. Remaining11 pending rows: `first-two-booking-proof.json`. Each retains original slot/local and reason in append-only `schedule_history`. All113 previously posted/held rows are byte-for-byte equal as parsed objects (`queue-write-validation.json`).

- IG LINES11Nov11 →17Nov17; YT VOXEL11Nov12 →15Nov09.
- IG VOXEL→18Nov09; EDIT→18Nov15; HARNESS carousel→19Nov09.
- YT LINES→18Nov09; EDIT→18Nov15.
- FB VOXEL→18Nov09; LINES→18Nov13; EDIT→18Nov17.
- LI LINES→18Nov09; TikTok LINES→18Nov09; X LINES→18Nov09.
- **X EDIT native rescheduled in place11Nov14→15Nov14**, observed saved list text “Will send on Sun, Nov15,2026 at2:00PM”; caption and38sec media retained. Local scheduled row reconciled under lock. Native list URL: https://x.com/compose/post/unsent/scheduled . The service reprocessed media on Save; no delete/repost was requested.
- **TikTok EDIT remains11Nov17**: https://www.tiktok.com/@withhammad/video/7705478342039932161 . Visible native menu offers Download/Delete only, no date edit; no deletion was performed. Therefore ADVISOR TikTok moves to20:15.
- PLANE unchanged: TikTok12Nov14 https://www.tiktok.com/@withhammad/video/7705382432094178612 ; X12Nov18.
- PROMPT unchanged: TikTok14Nov14 https://www.tiktok.com/@withhammad/video/7705478708181699892 ; X14Nov14.

## Smallest guaranteed date extension

**Through13 November.** Maximum guaranteed complete six-platform packages today is two. With full2h app windows, hourly :03 fallback, ≥3h actual gaps, and runner ending21:03, three guaranteed phone releases tomorrow do not fit:08–10→10:03, next safe13:15–15:15→16:03, next safe19:15–21:15→22:03 (no runner). Owner-confirmed early manual posts could enable an adaptive12Nov finish, but cannot be assumed.

| Package | IG/YT phone (fallback) | Facebook/LinkedIn runner | TikTok | X |
|---|---|---|---|---|
| FABLE12Nov |08:00–10:00 (10:03)|09:03|10:45|10:45|
| CLONE12Nov |13:15–15:15 (16:03)|13:03|17:15|14:00|
| BENCH13Nov |08:00–10:00 (10:03)|09:03|09:00|09:00|

No further native edits needed: PLANE TikTok14 sits3h15 after FABLE10:45 and3h15 before CLONE17:15; X PLANE18 is4h after CLONE14. The exact16 additional pending older rows and proposed later times are in `extension-plan-only.json`; none applied. FABLE needs live production guide/rule; CLONE/BENCH need exact finished-package approvals and production guide/rules; all three need owner date extension. No unapproved batch row was added.

## Execution and locking

Do not rerun `book_first_two.py`, `move_urgent_older.py`, or `reconcile_native_edit.py`; these are one-shot audit scripts, not idempotent planners. `propose_extension.py` only writes the plan JSON and is safe to refresh against a fresh queue.

1. Native booking: unlock Mac, use task-owned Chrome tabs; upload exact job `final_social.mp4`, copy exact validated per-platform queue caption, use approved cover if platform exposes a supported control, synthetic-content label on. Inspect date/time/Gulf Standard Time/account/caption before Schedule. Verify saved list/toast. Recheck current time before attempting14:00; never save a past schedule.
2. After native success only, use guarded recorder. Example:

```sh
python3 work/reference-20261110-batch/release-20261111/record_native_receipt.py --id tt-ee41d72bf8cd --url 'https://www.tiktok.com/@withhammad/video/OBSERVED_ID' --expected-local '2026-11-11 14:00 GST' --evidence 'Observed saved HIGGS card at Nov11 2:00PM GMT+4; AI label on; exact approved caption/video.'
```

Substitute a real observed receipt; the placeholder is not executable evidence. Repeat for other native rows with exact local values above. Script acquires `work/.run-due.lock` atomically, reads fresh, asserts pending/id/time, writes atomically, saves receipt, releases in finally. If lock exists, stop and wait for its owner; never delete it.

3. For future extension, once authorized: acquire same lock, fresh read, assert each plan `old_slot_utc` and pending status, append `schedule_history`, update only listed16 older rows, add18 new rows with `rq.seo_caption`, approved hashes and live resource URL. Keep native rows pending until browser success. Release lock. Never invoke `run-due --live`, never use `build` to reconstruct the queue.
4. Owner manual IG/YT post: capture exact public URL/time, then guarded `rq.mark` before fallback. Check scheduled runner queue snapshot afterward; avoid duplicate posting.

Evidence: `first-two-booking-proof.json`, `native-edit-reconciliation.json`, `queue-write-validation.json`, `release-audit-summary.json`, `queue-current-snapshot.json`, `extension-plan-only.json`. Six refreshed derived dashboard tables are under `dashboard-snapshot/` only. Dashboard rules are local-source derived, not a live-rule guarantee; production rule proof is separately `pr21-live-rules-proof.json` and `production-http-webhook.json` from website agent.
