#!/usr/bin/env bash
# GPT Image 2 parts for the private knitted "Halal always wins" reel (HALAL-KNIT, 2D motion graphics only, NO Blender), for the
# owner's wife (@heal.ingthroughquran). Reference DfGSMztq49_ (@muzbuild): a haram elevator "shortcut" against the halal stairs.
#   studio/remotion/src/halalknit/gen.sh <job dir> round1 | round2 | <name> [<name> ...]
# Only through the session's tagged gen2.sh wrapper (GPT Image 2 via the Codex shim), never another image model.
# The tower is image-to-image from a crop of the reference's own building (<job>/knit/refs/bld.png) so the layout (shaft left,
# zigzag stairs right, door on the roof) is the reference's. Every later doll pose is image-to-image from that doll's first pose.
# Generic knitted people only; nobody here is a prophet or a named person.
set -u
JOB=$1; shift
G=$JOB/knit/gen; mkdir -p "$G"
GEN2=/private/tmp/claude-501/-Users-hammad-withhammad-video-pipeline/5fde070d-a498-45f3-88f9-d7769454f905/scratchpad/khair/gen2.sh
KNIT="a photograph of a handmade miniature diorama in which EVERYTHING is knitted, crocheted or felted from wool yarn: clearly visible knit stitches, stockinette and cable-knit textures, crochet details, felt, fuzzy wool fibres catching the light, like a stop-motion film set; soft cinematic light, rich colours"
DOLL="an amigurumi doll (crocheted wool, round soft head, embroidered eyes, eyebrows and mouth, rosy felt cheeks, short black yarn hair)"
GREEN="Full body, the whole figure inside the frame with a wide margin, centred, on a perfectly flat solid pure green #00FF00 background with no shadow, no floor, no other objects. No green anywhere on the figure. No text"
NOTEXT="No text, no letters, no numbers, no writing, no logos, no watermark, no people"
PORT="Vertical 9:16 portrait image."
HAL="the SAME amigurumi young man doll as in the reference image (same face, black hair, mustard-gold cable-knit sweater, cream knitted trousers, brown felt shoes)"
HAR="the SAME amigurumi young man doll as in the reference image (same face, black slicked hair, shiny crimson knitted suit jacket and trousers, gold felt tie, black felt shoes)"

p() {   # name -> "prompt|ref"
  case $1 in
  night) echo "$PORT $KNIT. A knitted night scene for a stage set, straight-on camera: the top 72 percent is a deep navy-blue knitted night sky with a subtle Fair Isle pattern, tiny cream and gold crocheted stars scattered sparsely, and ONE small cream felt crescent moon in the upper right at about 20 percent from the top and 80 percent from the left. The bottom 28 percent is flat knitted ground in charcoal and warm grey stockinette wool, its horizon a straight level line, with a few tiny felt grass tufts along that line at the far left and far right. The whole middle of the image is empty sky and empty ground: no building, no trees, nothing standing. $NOTEXT.|" ;;
  tower) echo "$PORT $KNIT. Remake the building in the reference image as a knitted miniature: the SAME layout seen straight from the front, flat elevation, no perspective. A four-storey building knitted in charcoal and slate wool with darker cable-knit edges, flat roof. On the LEFT: one tall narrow vertical elevator shaft running from the ground to the roof, dark and EMPTY inside (no cabin), with one thin silver-grey yarn cable hanging down its middle from a small grey felt winch box sitting on the roof above the shaft. In the middle: columns of small tall crochet windows, a few of them glowing warm mustard. On the RIGHT half: an open exterior zigzag staircase in light grey knitted yarn, four straight diagonal flights, one per storey, alternating direction exactly like the reference (bottom flight rises from the middle to the right, the next back to the middle, and so on up to the roof), with a thin horizontal grey knitted floor slab at each storey across the whole width. On the roof, a little left of the centre, one small closed brown knitted wooden door in a felt frame, the stairs ending beside it. The whole building fills the frame with a margin, isolated on a perfectly flat solid pure green #00FF00 background, no ground, no sky. No people, no text, no numbers, no signs.|bldref" ;;
  cabin) echo "$PORT $KNIT. One knitted elevator cabin, front view, straight on: an open cage taller than wide (about 2 to 3), its frame of silver-grey knitted yarn tubes, open front with no door so the inside is visible and empty, a crimson felt floor and a crimson felt roof with a small silver yarn ring on top where a cable attaches. Isolated on a perfectly flat solid pure green #00FF00 background, no shadow. No green on the cabin. No text.|" ;;
  halal1) echo "$PORT $KNIT. $DOLL: a slim young man with a kind smile, wearing a warm MUSTARD-GOLD (honey yellow) cable-knit sweater, cream knitted trousers and brown felt shoes. Pose: standing upright in a clean SIDE VIEW facing the RIGHT of the image, arms relaxed. $GREEN.|" ;;
  halal2) echo "$PORT Show $HAL, now CLIMBING STAIRS in a clean SIDE VIEW facing the RIGHT of the image: his right knee raised high in front as if stepping up onto a stair, the left leg straight behind, arms swinging, leaning slightly forward, determined calm face. $GREEN.|halal1" ;;
  halal3) echo "$PORT Show $HAL, now WALKING in a clean SIDE VIEW facing the RIGHT of the image, mid-stride with the LEFT leg forward and the right leg back, arms swinging the other way, calm face. $GREEN.|halal1" ;;
  halal4) echo "$PORT Show $HAL, now standing FACING the viewer, looking up with a peaceful grateful smile, his right hand on his heart. $GREEN.|halal1" ;;
  haram1) echo "$PORT $KNIT. $DOLL: a young man with black slicked yarn hair and a smug grin, wearing a shiny crimson knitted suit jacket and trousers, a gold felt tie and black felt shoes. Pose: standing upright FACING the viewer, arms crossed over his chest, impatient. $GREEN.|" ;;
  haram2) echo "$PORT Show $HAR, now WALKING briskly in a clean SIDE VIEW facing the RIGHT of the image, mid-stride, smug face. $GREEN.|haram1" ;;
  haram3) echo "$PORT Show $HAR, now SITTING slumped on the ground after a fall, legs splayed out in front, dazed and dizzy, his hair messy, one hand on his head, jacket crumpled, front view. $GREEN.|haram1" ;;
  *) echo "" ;;
  esac
}

one() {
  local spec prompt ref out refimg
  spec=$(p "$1"); [ -n "$spec" ] || { echo "unknown $1"; return 2; }
  prompt=${spec%|*}; ref=${spec##*|}; out=$G/$1.png
  [ -s "$out" ] && { echo "have $1"; return 0; }
  refimg=""; [ "$ref" = bldref ] && refimg=$JOB/knit/refs/bld.png; [ -n "$ref" ] && [ "$ref" != bldref ] && refimg=$G/$ref.png
  for try in 1 2; do
    if [ -n "$refimg" ]; then bash "$GEN2" "$out" "$prompt" "$refimg" >/dev/null 2>&1; else bash "$GEN2" "$out" "$prompt" >/dev/null 2>&1; fi
    [ -s "$out" ] && { echo "ok $1"; return 0; }
    echo "retry $1 ($try)"
  done
  echo "FAIL $1"; return 1
}

batch() { local n=0; for x in "$@"; do one "$x" & n=$((n + 1)); if [ $((n % 4)) -eq 0 ]; then wait; fi; done; wait; }

for a in "$@"; do
  case $a in
    round1) batch night tower cabin halal1 haram1 ;;
    round2) batch halal2 halal3 halal4 haram2 haram3 ;;
    *) one "$a" ;;
  esac
done
