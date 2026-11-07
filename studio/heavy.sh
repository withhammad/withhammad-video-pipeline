#!/usr/bin/env bash
# Run one heavy job (Remotion bundle/render, Blender, Whisper, long ffmpeg) at a time across all reel sessions, so a
# dozen parallel sessions do not push the Mac into swap. Usage: studio/heavy.sh <command...>
# Waits for the shared lock (stale after 3 h), then runs the command and releases it.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; LOCK="$ROOT/work/.heavy.lock"; mkdir -p "$ROOT/work"
while ! mkdir "$LOCK" 2>/dev/null; do
  if [ -n "$(find "$LOCK" -maxdepth 0 -mmin +180 2>/dev/null)" ]; then rm -rf "$LOCK"; continue; fi
  sleep 15
done
echo "$$ $(date -u +%FT%TZ) $*" > "$LOCK/owner"
trap 'rm -rf "$LOCK"' EXIT
"$@"
