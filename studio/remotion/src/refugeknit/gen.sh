#!/usr/bin/env bash
# GPT Image 2 parts for the private knitted "Make prayer your refuge" reel (REFUGE-KNIT, 2D motion graphics only, NO Blender),
# for the owner's wife (@heal.ingthroughquran). Reference DepKWqLtlcH (@hous_semai2719): a tired figure with a red low battery
# walks down a night street into a mosque and comes back out calm, the battery full and green.
#   studio/remotion/src/refugeknit/gen.sh <job dir> round1 | round2 | <name> [<name> ...]
# Only through the session's tagged gen2.sh wrapper (GPT Image 2 via the Codex shim), never another image model.
# The figure is ONE generic knitted doll with a simple embroidered face: nobody here is a prophet or a named person.
# Every later pose is image-to-image from the first pose (doll_tired) so it stays the same doll.
set -u
JOB=$1; shift
G=$JOB/knit/gen; mkdir -p "$G"
GEN2=/private/tmp/claude-501/-Users-hammad-withhammad-video-pipeline/5fde070d-a498-45f3-88f9-d7769454f905/scratchpad/khair/gen2.sh
KNIT="a photograph of a handmade miniature in which EVERYTHING is knitted, crocheted or felted from wool yarn: clearly visible knit stitches, stockinette and cable-knit textures, crochet details, felt, fuzzy wool fibres catching the light, like a stop-motion film set; soft cinematic light"
DOLL="a small amigurumi doll knitted entirely in soft cream-white wool: a big round head, a slim body, thin arms and legs, rounded feet, plain cream wool all over (no clothes, no hair), a very simple face embroidered in dark brown yarn"
GREEN="Full body, the whole figure inside the frame with a wide margin, centred, on a perfectly flat solid pure green #00FF00 background with no shadow, no floor, no other objects. No green anywhere on the figure. No text"
PROP="isolated on a perfectly flat solid pure green #00FF00 background, no shadow, no floor, no people. No green anywhere on the object. No text, no letters, no logos"
NOTEXT="No text, no letters, no numbers, no writing, no calligraphy, no logos, no watermark, no people"
PORT="Vertical 9:16 portrait image."
SAME="the SAME cream-white knitted doll as in the reference image (same big round head, same slim body, same embroidered brown-yarn face style)"

p() {   # name -> "prompt|ref"
  case $1 in
  street) echo "$PORT $KNIT. A knitted night street for a stage set, straight-on side camera at child height: the top 45 percent is a deep navy-blue knitted night sky with a few tiny cream crocheted stars and a thin crescent moon of pale yellow felt in the upper left. Behind, a row of dark slate-blue knitted houses with a few small warm amber felt windows, and on the far right a small knitted mosque with a dome and a minaret whose doorway glows warm gold. The bottom 35 percent is a cobbled knitted pavement in charcoal and grey wool, fading to dark at the bottom edge. The middle of the pavement is empty. Cold blue night mood with one warm glow on the right. $NOTEXT.|" ;;
  door) echo "$PORT $KNIT. A knitted mosque entrance at night, straight-on front view: a pale cream cable-knit stone facade with two knitted pillars, a wide arched doorway in the centre with two carved honey-brown felt wooden doors swung OPEN, and through the doorway a glowing warm golden knitted interior with arches and small crocheted lanterns. Above the arch a plain empty smooth cream felt band (blank, no writing). Three wide cream knitted steps lead up to the door across the bottom of the image. Navy knitted night sky with tiny stars at the very top. $NOTEXT.|" ;;
  inside) echo "$PORT $KNIT. Inside a calm knitted mosque, straight-on view: warm cream and honey wool walls, a tall pointed mihrab arch in the centre back wall with fine gold crochet trim, two rows of knitted arches on the sides, small glowing crocheted brass lanterns hanging from the top, soft golden light pouring down from above. The floor in the lower 40 percent is a wide soft deep-green and burgundy knitted carpet with simple stripes (no figures). The middle of the floor is empty. Peaceful, warm, luminous. $NOTEXT.|" ;;
  mat) echo "$PORT $KNIT. One knitted prayer rug lying FLAT on the ground, seen from a low three-quarter side angle so it looks like a long low shape (about four times wider than tall): deep burgundy wool with a cream crocheted border, a simple pointed arch shape knitted in gold at the right end, short cream fringes at both ends. No figures. $PROP.|" ;;
  doll_tired) echo "$PORT $KNIT. $DOLL. The face: two tired half-closed drooping eyes and a small sad downturned mouth. Pose: walking slowly in a clean SIDE VIEW facing the RIGHT of the image, exhausted: shoulders slumped, back bent, the big head hanging low and forward, arms dangling, one foot stepping forward. $GREEN.|" ;;
  doll_tired2) echo "$PORT Show $SAME with the same tired drooping eyes and sad mouth, walking slowly in a clean SIDE VIEW facing the RIGHT of the image, exhausted, shoulders slumped, head hanging low, arms dangling, but now mid-stride with the OTHER leg forward (feet passing). $GREEN.|doll_tired" ;;
  doll_sujood) echo "$PORT Show $SAME, now in a clean SIDE VIEW facing the RIGHT of the image, in SUJOOD, the Islamic prostration of prayer: knees and toes on the ground, both palms flat on the ground beside the head, the forehead and nose touching the ground, hips raised, back sloping down to the head, elbows lifted off the ground. Face not visible. $GREEN.|doll_tired" ;;
  doll_sit) echo "$PORT Show $SAME, now in a clean SIDE VIEW facing the RIGHT of the image, sitting calmly on his heels in prayer (knees and shins on the ground, back straight), both hands resting on his thighs, eyes gently closed and a small peaceful smile. $GREEN.|doll_tired" ;;
  doll_calm) echo "$PORT Show $SAME, now walking in a clean SIDE VIEW facing the RIGHT of the image, upright and light: back straight, head held up, chest open, arms swinging gently, eyes closed in a peaceful content smile, one foot stepping forward. $GREEN.|doll_tired" ;;
  doll_calm2) echo "$PORT Show $SAME, walking upright in a clean SIDE VIEW facing the RIGHT of the image, back straight, head up, eyes closed with a peaceful smile, but now mid-stride with the OTHER leg forward (feet passing). $GREEN.|doll_calm" ;;
  *) echo "" ;;
  esac
}

one() {
  local spec prompt ref out refimg
  spec=$(p "$1"); [ -n "$spec" ] || { echo "unknown $1"; return 2; }
  prompt=${spec%|*}; ref=${spec##*|}; out=$G/$1.png
  [ -s "$out" ] && { echo "have $1"; return 0; }
  refimg=""; [ -n "$ref" ] && refimg=$G/$ref.png
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
    round1) batch doll_tired street door inside mat ;;
    round2) batch doll_tired2 doll_sujood doll_sit doll_calm ;;
    round3) batch doll_calm2 ;;
    *) one "$a" ;;
  esac
done
