#!/usr/bin/env bash
# Render the HyperFrames "title-insert" composition as a transparent VP9 WebM, verify the alpha
# channel, and copy it to the job folder and to where the Remotion "Reel" reads it.
#
# Usage: studio/hyperframes/render.sh <job_dir> ['{"line1":"…","line2":"…","badge1":"…","badge2":"…","badge3":"…"}']
# Output: <job_dir>/inserts/title_insert.webm and studio/remotion/public/job/title_insert.webm
#
# Uses npx with a pinned CLI version; nothing is installed globally. Skills install, telemetry
# and update checks are switched off.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
JOB="${1:?usage: render.sh <job_dir> [variables-json]}"
VARS="${2:-}"
HF="hyperframes@0.8.155"
export HYPERFRAMES_SKIP_SKILLS=1 HYPERFRAMES_NO_TELEMETRY=1 HYPERFRAMES_NO_UPDATE_CHECK=1 DO_NOT_TRACK=1

OUT="$HERE/out/title_insert.webm"
REMOTION_JOB="$HERE/../remotion/public/job"
mkdir -p "$HERE/out" "$JOB/inserts" "$REMOTION_JOB"
cd "$HERE"

npx --yes "$HF" lint
args=(render --format webm --quality high --output "$OUT")
if [ -n "$VARS" ]; then args+=(--variables "$VARS" --strict-variables); fi
if ! npx --yes "$HF" "${args[@]}" >"$HERE/out/render.log" 2>&1; then
  tail -40 "$HERE/out/render.log" >&2
  exit 1
fi

# VP9 keeps alpha in a side channel: the default decoder reports yuv420p, the libvpx decoder
# reports yuva420p, and the stream carries the ALPHA_MODE=1 tag. Require both.
pix="$(ffprobe -v error -c:v libvpx-vp9 -i "$OUT" -select_streams v:0 -show_entries stream=pix_fmt -of csv=p=0)"
mode="$(ffprobe -v error -i "$OUT" -select_streams v:0 -show_entries stream_tags -of default=nw=1 | grep -i 'alpha_mode' | cut -d= -f2)"
if [ "$pix" != "yuva420p" ] || [ "$mode" != "1" ]; then
  echo "alpha check failed: pix_fmt=$pix alpha_mode=${mode:-missing}" >&2
  exit 1
fi

cp "$OUT" "$JOB/inserts/title_insert.webm"
cp "$OUT" "$REMOTION_JOB/title_insert.webm"
echo "ok: pix_fmt=$pix alpha_mode=$mode"
echo "  -> $JOB/inserts/title_insert.webm"
echo "  -> $REMOTION_JOB/title_insert.webm"
