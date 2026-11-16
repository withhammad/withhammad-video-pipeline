#!/usr/bin/env bash
# GPT Image 2 parts for the private knitted "Istighfar x100" reel (ISTIGHFAR-KNIT, 2D motion graphics only, no Blender), for the
# owner's wife (@heal.ingthroughquran). Reference Dft1ZqUtnGS (@roadtojannahfirdaus): a man carries a bowl of sins on his back,
# every istighfar knocks one out, he stands straighter every 20, and at 100 he lets it go.
#   studio/remotion/src/istighfarknit/gen.sh <job dir> <name> [<name> ...]     (names: plate front man1 man2 man3 man4 man5 free bowl pebbles)
# man2..man5, free and bowl are made from man1 (image-to-image) so the doll stays the same. A generic doll, never a prophet.
# Only through the session's tagged gen2.sh wrapper (GPT Image 2 via the Codex shim), never another image model.
set -u
JOB=$1; shift
G=$JOB/knit/gen; mkdir -p "$G"
GEN2=/private/tmp/claude-501/-Users-hammad-withhammad-video-pipeline/5fde070d-a498-45f3-88f9-d7769454f905/scratchpad/khair/gen2.sh
KNIT="a photograph of a handmade miniature diorama in which EVERYTHING is knitted, crocheted or felted from wool yarn: clearly visible knit stitches, stockinette and cable-knit textures, crochet details, felt, fuzzy wool fibres catching the light, like a stop-motion film set; soft cinematic light"
GREEN="Isolated on a perfectly flat solid pure green #00FF00 background, no shadow on the background, no floor, nothing else. No green anywhere on the subject. No text."
DOLL="the SAME knitted amigurumi man doll as in the reference image (same teal cable-knit jumper, mustard knitted trousers, brown felt shoes, short brown yarn hair and short brown yarn beard, simple face with two black bead eyes), and the SAME big wide shallow crocheted bowl in warm walnut-brown yarn"
SIDE="seen exactly from the side, facing RIGHT, full body visible head to shoes with a margin, centred"
NOTEXT="No text, no letters, no writing, no logos, no watermark"

p() {
  case $1 in
  plate) echo "Vertical 9:16 portrait image. $KNIT, warm golden dawn light. A calm knitted desert at sunrise seen from a low camera: the TOP 60 percent of the image is an open, empty, softly graded knitted sky in pale cream, honey and peach stripes of stockinette stitches with a small felt crescent moon in the upper RIGHT corner and a few tiny cream felt clouds; low on the horizon, rolling knitted sand dunes in apricot, honey, caramel and soft rose, with a pale sun glow just behind them; the BOTTOM 25 percent is a flat smooth path of knitted sand in warm caramel with a few felt pebbles at the edges, empty in the middle. No people, no animals, no buildings. $NOTEXT.|" ;;
  front) echo "Wide 3:2 landscape image. $KNIT. A long low foreground strip of knitted desert ground seen from the front at eye level: a gentle knitted sand ridge in caramel and honey yarn with a few small felt stones, two tiny crocheted desert shrubs in sage green and dried yarn grass tufts at the LEFT and RIGHT ends; the strip fills the full width and only the bottom 40 percent of the image; the top 60 percent is solid pure green #00FF00 with nothing in it. No green yarn on the strip except the small sage shrubs. $NOTEXT.|" ;;
  man1) echo "Square image. $KNIT. One knitted amigurumi man doll, an ordinary modern man: teal cable-knit jumper, mustard knitted trousers, brown felt shoes, short brown yarn hair and a short brown yarn beard, simple face with two black bead eyes and a stitched frown, a felt sweat drop on his brow. He walks to the RIGHT bent over under a heavy load: his upper body bent forward almost horizontal like a table, back flat, knees deeply bent, both arms reaching back up to hold the rim of a big wide shallow crocheted bowl in warm walnut-brown yarn that rests on his flat back. The bowl is EMPTY, its opening facing up, its rim level. $SIDE. $GREEN|" ;;
  man2) echo "Square image. $KNIT. $DOLL. Same bowl on his back, EMPTY, opening up, rim level. He walks to the RIGHT still bent forward but less than before: upper body tilted about 55 degrees from upright, knees a little bent, both hands holding the bowl rim behind him, tired but steadier face. $SIDE. $GREEN|man1" ;;
  man3) echo "Square image. $KNIT. $DOLL. Same bowl on his back, EMPTY, opening up, rim level. He walks to the RIGHT, upper body tilted about 40 degrees from upright, knees slightly bent, both hands holding the bowl rim behind his shoulders, calmer face. $SIDE. $GREEN|man1" ;;
  man4) echo "Square image. $KNIT. $DOLL. Same bowl, EMPTY, opening up, rim level, now sitting high on his upper back and shoulders. He walks to the RIGHT almost upright, upper body tilted only about 25 degrees, legs nearly straight, both hands holding the bowl rim behind his shoulders, a small hopeful smile. $SIDE. $GREEN|man1" ;;
  man5) echo "Square image. $KNIT. $DOLL. Same bowl, EMPTY, opening up, rim level, held on top of his shoulders behind his head. He walks to the RIGHT nearly upright, upper body tilted only about 10 degrees, legs straight, light step, both hands lightly holding the bowl rim, a gentle smile. $SIDE. $GREEN|man1" ;;
  free) echo "Square image. $KNIT. The SAME knitted amigurumi man doll as in the reference image (same teal cable-knit jumper, mustard knitted trousers, brown felt shoes, short brown yarn hair and beard, two black bead eyes), now WITHOUT any bowl and carrying nothing: he stands tall and upright, walking lightly to the RIGHT mid-step, arms relaxed and swinging, chest open, a peaceful happy smile. $SIDE. $GREEN|man1" ;;
  bowl) echo "Square image. $KNIT. Only the SAME big wide shallow crocheted bowl in warm walnut-brown yarn as in the reference image, alone, EMPTY, seen exactly from the side at eye level so it reads as a wide shallow half-ellipse with its rim level and opening up, filling most of the frame width. No doll, nothing inside. $GREEN|man1" ;;
  pebbles) echo "Square image. $KNIT. Nine separate round felted wool balls, each the same size, arranged in a neat 3 by 3 grid with wide even gaps between them, none touching: dark charcoal, near-black, deep slate grey and dark brown-black felt, fuzzy fibres and a soft highlight on each. $GREEN|" ;;
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
