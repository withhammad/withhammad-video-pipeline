#!/usr/bin/env bash
# GPT Image 2 parts for the private knitted "Don't be proud" reel (PROUD-KNIT, 2D motion graphics only, NO Blender), for the
# owner's wife (@heal.ingthroughquran). Reference De6-fTIo_S0 (@abduvaseeq): a silhouette figure loses wealth, beauty, body,
# children, mansions, cars and the city, then walks into a beam of light and ends in sujood.
#   studio/remotion/src/proudknit/gen.sh <job dir> round1 | round2 | <name> [<name> ...]
# Only through the session's tagged gen2.sh wrapper (GPT Image 2 via the Codex shim), never another image model.
# The figure is ONE generic faceless knitted doll (a wool silhouette, like the reference's stick figure): nobody here is a
# prophet or a named person. Every later pose is image-to-image from the first pose (man_stand) so it stays the same doll.
set -u
JOB=$1; shift
G=$JOB/knit/gen; mkdir -p "$G"
GEN2=/private/tmp/claude-501/-Users-hammad-withhammad-video-pipeline/5fde070d-a498-45f3-88f9-d7769454f905/scratchpad/khair/gen2.sh
KNIT="a photograph of a handmade miniature in which EVERYTHING is knitted, crocheted or felted from wool yarn: clearly visible knit stitches, stockinette and cable-knit textures, crochet details, felt, fuzzy wool fibres catching the light, like a stop-motion film set; soft warm cinematic light"
DOLL="a slim amigurumi man doll knitted entirely in dark charcoal-black wool, like a silhouette made of yarn: a round plain head with NO face at all (no eyes, no mouth), a slim body, thin arms and legs, a few fine gold stitches along the seams"
GREEN="Full body, the whole figure inside the frame with a wide margin, centred, on a perfectly flat solid pure green #00FF00 background with no shadow, no floor, no other objects. No green anywhere on the figure. No text"
PROP="isolated on a perfectly flat solid pure green #00FF00 background, no shadow, no floor, no people. No green anywhere on the object. No text, no letters, no logos"
NOTEXT="No text, no letters, no numbers, no writing, no logos, no watermark, no people"
PORT="Vertical 9:16 portrait image."
SAME="the SAME faceless charcoal-black knitted doll as in the reference image (same plain round head with no face, same slim body and gold seam stitches)"

p() {   # name -> "prompt|ref"
  case $1 in
  dusk) echo "$PORT $KNIT. A knitted dusk landscape for a stage set, straight-on camera: the top half is a deep warm umber-brown knitted sky with a soft amber haze along the horizon, and ONE round glowing golden felt sun in the upper left at about 18 percent from the top and 20 percent from the left. The horizon is a straight level line at 50 percent from the top: low, gently rolling dark brown knitted dunes with a few thin gold yarn lines tracing the ridges. The bottom half is very dark umber knitted ground fading to almost black at the bottom edge. The whole middle is empty: nothing standing, no buildings, no plants. $NOTEXT.|" ;;
  night) echo "$PORT $KNIT. A knitted night landscape for a stage set, straight-on camera: the top half is a deep dark slate-blue-grey knitted night sky with a subtle stockinette texture and sparse tiny cream and gold crocheted stars. The horizon is a straight level line at 50 percent from the top: flat dark charcoal knitted ground with a few thin pale grey yarn lines running across it like gentle waves, fading to almost black at the bottom edge. No moon, no sun. The whole image is empty: nothing standing, no buildings, no plants. $NOTEXT.|" ;;
  man_stand) echo "$PORT $KNIT. $DOLL. Pose: standing upright in a clean SIDE VIEW facing the RIGHT of the image, arms relaxed at his sides. $GREEN.|" ;;
  coins) echo "$PORT $KNIT. A wide low mound of knitted and felted GOLD coins: dozens of round mustard-gold felt coins with stitched rims piled into a gentle hill about three times wider than tall, a few coins standing on edge, shiny metallic gold yarn highlights. Side view, $PROP.|" ;;
  mirror) echo "$PORT $KNIT. A tall oval standing mirror: a thick golden cable-knit frame with crocheted gold scrolls at the top, standing on two small gold knitted legs; the glass is a smooth dark silvery-grey felt, blank, reflecting nothing. Front view, $PROP.|" ;;
  car) echo "$PORT $KNIT. A shiny mustard-gold knitted luxury sedan car, clean SIDE VIEW with its front pointing to the LEFT of the image, felt windows in dark amber, black crocheted tyres with gold hubcaps, round cream felt headlights. $PROP.|" ;;
  mansion) echo "$PORT $KNIT. A grand golden knitted palace mansion, front view, flat elevation: mustard-gold and honey wool walls, two floors of tall arched windows glowing warm cream, two small towers at the sides, a crocheted balustrade on the roof, a big arched door in the middle. Wider than tall. $PROP.|" ;;
  city) echo "$PORT $KNIT. A skyline of golden knitted skyscrapers, straight-on front view: seven towers of different heights in mustard-gold and honey wool with rows of small glowing cream felt windows; the tallest tower in the middle-left wears a small gold crocheted crown on its top. At the foot of the towers: one big faceted gold felt diamond and one short stack of gold felt coins. Wider than tall. $PROP.|" ;;
  hand) echo "$PORT $KNIT. One large knitted forearm and open hand made of dark charcoal-black wool with fine gold seam stitches, reaching UP diagonally from the bottom-left corner toward the upper right, palm open and facing up, fingers relaxed. Only the forearm and hand. $PROP.|" ;;
  man_proud) echo "$PORT Show $SAME, now standing in a clean SIDE VIEW facing the RIGHT of the image, chest pushed out and head tilted back proudly, his right arm raised high holding up one small round gold felt coin. $GREEN.|man_stand" ;;
  man_admire) echo "$PORT Show $SAME, now standing in a clean SIDE VIEW facing the RIGHT of the image, posing vainly: one hand touching the top of his head as if fixing his hair, the other hand on his hip. $GREEN.|man_stand" ;;
  man_flex) echo "$PORT Show the same faceless doll as in the reference image (same plain round charcoal head with NO face), but now with a huge muscular bodybuilder body knitted in glowing mustard-gold wool: wide shoulders, big chest, FRONT VIEW, both arms raised and flexed showing big biceps, legs apart, thin charcoal-black legs. $GREEN.|man_stand" ;;
  man_front) echo "$PORT Show $SAME, now standing FACING the viewer, both arms held slightly out and down to his sides as if holding the hands of two small children beside him (the children are NOT shown). $GREEN.|man_stand" ;;
  child) echo "$PORT Show a small CHILD version of $SAME (the same faceless charcoal-black knitted style, half the height, a bigger round head for the body), standing FACING the viewer with his RIGHT arm (on the left of the image) raised up and out to the side as if holding a grown-up's hand. $GREEN.|man_stand" ;;
  man_reach) echo "$PORT Show $SAME, now in a clean SIDE VIEW facing the RIGHT of the image, stretching up on tiptoe and reaching both arms high above his head toward something out of reach. $GREEN.|man_stand" ;;
  man_bow) echo "$PORT Show $SAME, now standing in a clean SIDE VIEW facing the RIGHT of the image, head bowed down low and shoulders slumped, arms hanging, humbled. $GREEN.|man_stand" ;;
  man_heart) echo "$PORT Show $SAME, now standing in a clean SIDE VIEW facing the RIGHT of the image, head slightly raised, his right hand placed flat on the centre of his chest over a small glowing gold felt heart stitched there. $GREEN.|man_stand" ;;
  man_kneel) echo "$PORT Show $SAME, now in a clean SIDE VIEW facing the RIGHT of the image, KNEELING: sitting back on his heels with his knees and shins on the ground, back straight, both hands resting on his thighs, head slightly lowered. $GREEN.|man_stand" ;;
  man_sujood) echo "$PORT Show $SAME, now in a clean SIDE VIEW facing the RIGHT of the image, in SUJOOD, the Islamic prostration of prayer: knees and toes on the ground, both palms flat on the ground beside the head, the forehead and nose touching the ground, hips raised, back sloping down to the head, elbows lifted off the ground and away from the sides. $GREEN.|man_stand" ;;
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
    round1) batch man_stand dusk night coins mirror car mansion city hand ;;
    round2) batch man_proud man_admire man_flex man_front child man_reach man_bow man_heart man_kneel man_sujood ;;
    *) one "$a" ;;
  esac
done
