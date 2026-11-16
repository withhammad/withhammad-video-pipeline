#!/usr/bin/env bash
# GPT Image 2 parts for the private knitted "99 Names for a tired heart" reel (STRESS-KNIT, 2D motion graphics only, no Blender),
# for the owner's wife (@heal.ingthroughquran). Reference DfWnDR6T1YX (@lelahmenjauh): a dial walks through the 99 Names while a
# "tired" meter drains from 100 to calm, then "Tired? Come closer to Him."
#   studio/remotion/src/stressknit/gen.sh <job dir> <name> [<name> ...]
#     names: room doily lamp needle girl yarn
# A generic knitted person only (a young woman in hijab, seen from behind), never a prophet.
# Only through the session's tagged gen2.sh wrapper (GPT Image 2 via the Codex shim), never another image model.
set -u
JOB=$1; shift
G=$JOB/knit/gen; mkdir -p "$G"
GEN2=/private/tmp/claude-501/-Users-hammad-withhammad-video-pipeline/5fde070d-a498-45f3-88f9-d7769454f905/scratchpad/khair/gen2.sh
KNIT="a photograph of a handmade miniature diorama in which EVERYTHING is knitted, crocheted or felted from wool yarn: clearly visible knit stitches, stockinette and cable-knit textures, crochet details, felt, fuzzy wool fibres catching the light, like a stop-motion film set"
GREEN="Isolated on a perfectly flat solid pure green #00FF00 background, no shadow on the background, no floor, nothing else. No green anywhere on the subject. No text."
NOTEXT="No text, no letters, no writing, no numbers, no logos, no watermark"

p() {
  case $1 in
  room) echo "Vertical 9:16 portrait image. $KNIT, deep calm night, lit by one soft warm glow from the exact centre of the image. A cosy wall knitted in deep navy and midnight-blue cable-knit wool fills the whole frame, with subtle darker diamond cable patterns, a faint crocheted crescent moon and a few tiny felt stars stitched high in the upper corners, soft vignette to near-black at the edges. The centre of the image is a plain smooth navy knit area (it will be covered later). Very dark, low-key, peaceful. $NOTEXT.|" ;;
  doily) echo "Square image. $KNIT. One large round crocheted doily seen exactly from the front, flat, like a clock face: crocheted in deep navy-blue and slate wool with a thin cream outer rim, a ring of 99 tiny evenly spaced cream yarn stitches around the outer edge like clock ticks, a wide plain dark navy band inside it, and a plain round dark navy felt centre one third of its diameter. Perfectly circular, centred, filling 92 percent of the image. $GREEN|" ;;
  lamp) echo "Square image. $KNIT. One small old-fashioned oil lamp knitted from sage-green and cream wool with a crocheted brass-gold base and a looped handle on the RIGHT, a rounded felt glass chimney, and a small soft orange-gold felted flame on top, glowing warmly. Seen from the front at eye level, centred, filling 75 percent of the image height. $GREEN|" ;;
  needle) echo "Wide 4:1 landscape image. $KNIT. One long straight knitting needle lying perfectly horizontal, made of warm orange-amber felt with a small round gold bead knob on the LEFT end and a pointed tip on the RIGHT end, a few loops of glowing amber yarn wrapped around its middle. It fills 90 percent of the image width. $GREEN|" ;;
  girl) echo "Square image. $KNIT, warm lamp light from the front. One knitted amigurumi young woman doll in a soft dusty-rose knitted hijab and a long cream knitted abaya, sitting cross-legged on a small round crocheted prayer mat, seen from BEHIND (her back to the viewer, no face visible), head slightly bowed, a knitted wooden-bead tasbih hanging from her right hand. Full body visible with a margin, centred. $GREEN|" ;;
  yarn) echo "Square image. $KNIT. One loose ball of soft warm orange-amber wool yarn, slightly tangled, with one loose strand trailing out to the RIGHT, seen from the front, centred, filling 70 percent of the image. $GREEN|" ;;
  *) echo "" ;;
  esac
}

one() {
  local spec prompt ref out
  spec=$(p "$1"); [ -n "$spec" ] || { echo "unknown $1"; return 2; }
  prompt=${spec%|*}; ref=${spec##*|}; out=$G/$1.png
  [ -s "$out" ] && { echo "have $1"; return 0; }
  for try in 1 2; do
    if [ -n "$ref" ]; then bash "$GEN2" "$out" "$prompt" "$G/$ref.png" >/dev/null 2>&1; else bash "$GEN2" "$out" "$prompt" >/dev/null 2>&1; fi
    [ -s "$out" ] && { echo "ok $1"; return 0; }
    echo "retry $1 ($try)"
  done
  echo "FAIL $1"; return 1
}

for a in "$@"; do one "$a" & done
wait
