#!/usr/bin/env bash
# Post whatever the repost queue says is due, with no AI model in the loop (launchd runs this; see
# docs/routines/README.md). One run at a time; the queue file is committed and pushed after any post.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG="$ROOT/work/logs/run-due.log"
LOCK="$ROOT/work/.run-due.lock"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
mkdir "$LOCK" 2>/dev/null || { echo "$(date -u +%FT%TZ) another run holds the lock" >> "$LOG"; exit 0; }
trap 'rmdir "$LOCK"' EXIT
cd "$ROOT/studio"
OUT="$(.venv/bin/python -m app.repost_queue run-due --live 2>&1)"; CODE=$?
{ echo "=== $(date -u +%FT%TZ) exit $CODE"; echo "$OUT"; } >> "$LOG"
if ! git -C "$ROOT" diff --quiet -- outputs/video-pipeline/repost-queue.json; then
  IDS="$(printf '%s' "$OUT" | /usr/bin/python3 -c 'import json,sys
try: d=json.load(sys.stdin); print(" ".join(p["id"] for p in d["posted"]+d["failed"]))
except Exception: print("run")' )"
  # The index is shared with editing sessions; commit only this timer's queue path.
  git -C "$ROOT" commit -q -m "Record repost queue posts $IDS" -- outputs/video-pipeline/repost-queue.json >> "$LOG" 2>&1
  git -C "$ROOT" push -q >> "$LOG" 2>&1 || echo "push failed" >> "$LOG"
fi
exit 0
