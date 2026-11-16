#!/usr/bin/env bash
# GPT Image 2 parts for the private knitted "Tadbeer" reel (TADBEER-KNIT, 2D motion graphics only, no Blender), for the owner's
# wife (@heal.ingthroughquran). Reference DfsTrK5or6t (@taddbeer_fx).
#   studio/remotion/src/tadbeerknit/gen.sh <job dir> reuse | <name> [<name> ...]
# "reuse" copies the knitted dolls, props and plates already made for the earlier build of the same reference (job
# 82bcabef818a, lutfknit/gen.sh) into <job>/knit/gen, so stories 2-5 keep the same characters. The only new parts are the
# ones the 3D Blender plate used to cover in story 1: the meadow plate with its fence post, and one knitted hay bale.
# Only through the session's tagged gen2.sh wrapper (GPT Image 2 via the Codex shim), never another image model.
set -u
JOB=$1; shift
G=$JOB/knit/gen; mkdir -p "$G"
HERE=$(cd "$(dirname "$0")" && pwd)
OLD=$HERE/../../../.local/jobs/82bcabef818a/knit/gen
GEN2=/private/tmp/claude-501/-Users-hammad-withhammad-video-pipeline/5fde070d-a498-45f3-88f9-d7769454f905/scratchpad/khair/gen2.sh
KNIT="a photograph of a handmade miniature diorama in which EVERYTHING is knitted, crocheted or felted from wool yarn: clearly visible knit stitches, stockinette and cable-knit textures, crochet details, felt, fuzzy wool fibres catching the light, like a stop-motion film set; soft cinematic light, gentle depth of field, rich saturated and varied colours"
NOTEXT="No text, no letters, no writing, no logos, no watermark, no people"
PORT="Vertical 9:16 portrait image."

p() {
  case $1 in
  farm) echo "$PORT $KNIT. A knitted countryside meadow in warm late-afternoon golden light, seen from a low camera close to the ground. Background: rolling hills of patchwork knitted fields in sage, olive, mustard, lavender and rust stripes, small round knitted trees and hedgerows, fluffy cream felt clouds, a peach-to-soft-blue knitted sky. Foreground, the bottom third of the image: a flat strip of knitted green grass with a few felt daisies and a worn patch of tan felt earth. On the RIGHT side of the image one single thick knitted wooden fence post stands upright, its flat top at about 55 percent of the image height from the top, with two strands of grey yarn wire running from it to the right edge. The whole LEFT half of the foreground and middle ground is open empty grass with nothing standing on it. No hay, no hay bales, no animals. $NOTEXT.|" ;;
  bale) echo "Square image. $KNIT. One single rectangular hay bale knitted from golden straw-coloured wool (mustard, honey and pale gold strands, chunky textured stitches like straw), seen STRAIGHT FROM THE FRONT, flat-on, its long side facing the viewer, a little wider than it is tall (about 3 to 2), with two thin red yarn twine bands wrapped vertically around it. The bale fills most of the frame with a margin. Isolated on a perfectly flat solid pure green #00FF00 background, no shadow, no floor, nothing else. No green on the bale. No text.|" ;;
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

for a in "$@"; do
  case $a in
    reuse) for n in living livingafter garage kitchen kitchenafter street boyclose fan props car stands beams boy1b \
                    farmer1 farmer2 farmer3 farmer4 man1 man2 man3 man4 mech1 mech2 mech3 mech4 woman1 woman2 woman3 woman4 boy1 boy2 boy3 boy4; do
             cp -n "$OLD/$n.png" "$G/$n.png" && echo "reused $n"; done ;;
    new) one farm & one bale & wait ;;
    *) one "$a" ;;
  esac
done
