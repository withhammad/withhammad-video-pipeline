#!/bin/bash
# Screen-record one run: opens a Terminal window at fixed bounds, runs run_side.sh in it,
# records that window region with FFmpeg until the run finishes.
#   tools/arena/record.sh fable landing
set -uo pipefail
SIDE=$1; TASK=$2
REPO=$(cd "$(dirname "$0")/../.." && pwd)
ARENA=${ARENA:-$REPO/studio/.local/astra-fable}
mkdir -p "$ARENA/rec" "$ARENA/logs"
rm -f "$ARENA/logs/$SIDE-$TASK.done"
# Window in points (Retina = x2 pixels): x 40..1000, y 40..1000
osascript <<EOF
tell application "Terminal"
  activate
  set w to do script "bash '$REPO/tools/arena/run_side.sh' $SIDE $TASK; exit"
  delay 0.5
  set bounds of front window to {40, 40, 1000, 1000}
  set font size of current settings of selected tab of front window to 15
end tell
EOF
sleep 1
ffmpeg -hide_banner -loglevel error -y -f avfoundation -capture_cursor 0 -framerate 30 -pixel_format nv12 -i "1:none" \
  -vf "crop=1920:1920:80:80,scale=1080:1080" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p \
  "$ARENA/rec/$SIDE-$TASK.mp4" </dev/null &
FF=$!
while [ ! -f "$ARENA/logs/$SIDE-$TASK.done" ]; do sleep 1; done
sleep 4
kill -INT $FF; wait $FF 2>/dev/null
echo "recorded $ARENA/rec/$SIDE-$TASK.mp4"
