#!/usr/bin/env bash
# Render the ALLAH-KNIT plate in chunks through the shared heavy lock, with a pause between chunks so other sessions can take it.
#   studio/blender/allahknit/render_chunks.sh <out dir> [chunk] [first] [last]
set -u
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="$1"; CH="${2:-75}"; A="${3:-0}"; B="${4:-299}"
for ((s = A; s <= B; s += CH)); do
  e=$((s + CH - 1)); [ "$e" -gt "$B" ] && e="$B"
  echo "CHUNK $s-$e $(date +%T)"
  "$ROOT/studio/heavy.sh" /Applications/Blender.app/Contents/MacOS/Blender -b -P "$ROOT/studio/blender/allahknit/build.py" -- "$OUT" anim "$s" "$e" --samples 16 \
    2>&1 | grep -E "FRAME|DONE|Error|Traceback" | tail -n 3
  sleep 20
done
echo "ALL DONE $(date +%T)"
