#!/usr/bin/env bash
# GPT Image 2 parts for the private knitted "Light upon light" reel (NUR-KNIT, 2D motion graphics only, NO Blender), for the
# owner's wife (@heal.ingthroughquran). Reference DfrckxNMKVN (@ruwaq.co): Ayat an-Nur 24:35 recited, each image of the ayah
# drawn in turn (heavens, niche, lamp, glass, star, olive tree, oil, light upon light, people guided), "light comes to you, and
# you can pass it on".
#   studio/remotion/src/nurknit/gen.sh <job dir> round1 | round2 | <name> [<name> ...]
# Only through the session's tagged gen2.sh wrapper (GPT Image 2 via the Codex shim), never another image model.
# The people are generic knitted amigurumi dolls with simple embroidered faces: nobody is a prophet or a named person.
set -u
JOB=$1; shift
G=$JOB/knit/gen; mkdir -p "$G"
GEN2=/private/tmp/claude-501/-Users-hammad-withhammad-video-pipeline/5fde070d-a498-45f3-88f9-d7769454f905/scratchpad/khair/gen2.sh
KNIT="a photograph of a handmade miniature in which EVERYTHING is knitted, crocheted or felted from wool yarn: clearly visible knit stitches, stockinette and cable-knit textures, crochet details, felt, fuzzy wool fibres catching the light, like a stop-motion film set; soft cinematic light"
GREEN="Full body, the whole figure inside the frame with a wide margin, centred, on a perfectly flat solid pure green #00FF00 background with no shadow, no floor, no other objects. No green anywhere on the figure. No text"
PROP="isolated and centred with a wide margin on a perfectly flat solid pure green #00FF00 background, no shadow, no floor, no people. No green anywhere on the object. No text, no letters, no logos"
NOTEXT="No text, no letters, no numbers, no writing, no calligraphy, no logos, no watermark"
PORT="Vertical 9:16 portrait image."
POSE="in a clean SIDE VIEW facing the RIGHT of the image, standing upright, BOTH arms stretched straight forward at chest height with the hands open and close together, palms up, as if gently handing a small lantern to someone; the hands are EMPTY"
DOLLA="a small amigurumi doll knitted entirely in soft wool: a big round head with a simple face embroidered in dark brown yarn (two small eyes, a gentle smile), wearing a soft burgundy knitted hijab that covers the hair and neck and a long plain cream knitted dress to the feet"

p() {   # name -> "prompt|ref"
  case $1 in
  sky) echo "$PORT $KNIT. A knitted night landscape, straight-on view: the top 65 percent is a deep navy-blue and charcoal knitted night sky, completely EMPTY and dark (no moon, only five or six tiny cream crocheted stars near the edges). Below, a low line of dark rolling knitted hills in deep green-black wool with a few tiny sleeping knitted houses with dark windows. The bottom 15 percent is a dark knitted meadow. Quiet, dark, waiting for light. No people. $NOTEXT.|" ;;
  niche) echo "$PORT $KNIT. A dark knitted stone wall seen straight-on, filling the whole image: big rectangular cable-knit blocks in dark slate-green and charcoal wool with felt mortar lines. Exactly in the centre of the image, a deep tall arched NICHE recessed into the wall (a mihrab-shaped alcove about a third of the image wide, with a pointed arch top and a flat sill at the bottom), its inside a dark felt cavity, EMPTY, trimmed with a thin honey-gold crocheted border. Dim night mood, the wall barely lit. No lamp, no people. $NOTEXT.|" ;;
  olive) echo "$PORT $KNIT. A single knitted OLIVE TREE standing alone on a gentle knitted hill at dusk, straight-on view: a gnarled twisted trunk in brown cable-knit wool, a wide silvery sage-green crochet canopy with many tiny dark felt olives. The tree stands in the lower middle of the image, its canopy between 40 and 65 percent of the height. A dark green knitted meadow below. Behind it a calm knitted twilight sky shading from deep navy at the top to soft amber at the horizon, with a few tiny crocheted stars at the top. Peaceful and still. No people. $NOTEXT.|" ;;
  room) echo "$PORT $KNIT. Inside a DARK simple knitted room at night, straight-on side camera at child height: plain dark plum and charcoal knitted walls with a subtle cable texture, a small arched window on the upper left showing a navy knitted night sky with two tiny stars, a low dark wooden-brown knitted floor across the bottom 30 percent with a long dark wool rug. The room is very dimly lit, almost dark, cosy. The middle of the floor is EMPTY and wide (space for figures). No people, no lamps. $NOTEXT.|" ;;
  lamp) echo "$PORT $KNIT. One traditional oil LAMP inside a clear round GLASS globe: a small felted brass oil-lamp base with a short wick and a single small warm flame of orange-gold felt, enclosed in a clear round glass chimney globe (real transparent glass with soft highlights) that sits on a round felted brass stand. Front view, upright. $PROP.|" ;;
  bowl) echo "$PORT $KNIT. One small round shallow bowl of felted honey-brown clay, seen from a slight high front angle, filled to the rim with glossy golden-amber OLIVE OIL (shiny liquid surface catching light), two tiny felted olives and a small sage-green crochet olive leaf beside it. No flame. $PROP.|" ;;
  lantern) echo "$PORT $KNIT. One small handheld LANTERN: a felted brass frame with a little domed top and a round ring handle on top, four clear glass panes, inside a single small warm glowing candle flame of orange-gold felt. Front view, upright, the whole lantern visible. $PROP.|" ;;
  doll_a) echo "$PORT $KNIT. $DOLLA. Pose: $POSE. $GREEN.|" ;;
  doll_b) echo "$PORT $KNIT. A small amigurumi doll in exactly the same knitted style, size and proportions as the doll in the reference image (same big round head, same simple embroidered dark brown yarn face), but this one is a man: a short dark brown yarn beard, a small cream crocheted kufi cap, a long navy-blue knitted thobe robe to the feet. Pose: $POSE. $GREEN.|doll_a" ;;
  doll_c) echo "$PORT $KNIT. A small amigurumi doll in exactly the same knitted style as the doll in the reference image (same big round head, same simple embroidered dark brown yarn face) but SMALLER, a child: short dark brown yarn hair, a mustard-yellow knitted jumper and cream knitted trousers. Pose: $POSE. $GREEN.|doll_a" ;;
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
    round1) batch doll_a sky niche olive room lamp bowl lantern ;;
    round2) batch doll_b doll_c ;;
    *) one "$a" ;;
  esac
done
