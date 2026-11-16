#!/usr/bin/env bash
# GPT Image 2 parts for the private knitted "Needle and candle" Fajr reel (FAJR-KNIT, 2D motion graphics only, no Blender), for the
# owner's wife (@heal.ingthroughquran). Reference DfQMDFSufy_ (@kaynlkhir): long ago an old man pushed a needle into his candle;
# when the wax melted to it the needle dropped onto the brass plate and woke him for Fajr. Today four phones buzz and we sleep on.
#   studio/remotion/src/fajrknit/gen.sh <job dir> <name> [<name> ...]
#     names: room oldsit oldsleep oldpray candle plate bedroom phone
# oldsleep and oldpray are made from oldsit (image-to-image) so the doll stays the same. A generic old man, never a prophet.
# Only through the session's tagged gen2.sh wrapper (GPT Image 2 via the Codex shim), never another image model.
set -u
JOB=$1; shift
G=$JOB/knit/gen; mkdir -p "$G"
GEN2=/private/tmp/claude-501/-Users-hammad-withhammad-video-pipeline/5fde070d-a498-45f3-88f9-d7769454f905/scratchpad/khair/gen2.sh
KNIT="a photograph of a handmade miniature diorama in which EVERYTHING is knitted, crocheted or felted from wool yarn: clearly visible knit stitches, stockinette and cable-knit textures, crochet details, felt, fuzzy wool fibres catching the light, like a stop-motion film set"
GREEN="Isolated on a perfectly flat solid pure green #00FF00 background, no shadow on the background, no floor, nothing else. No green anywhere on the subject. No text."
OLD="the SAME knitted amigurumi old man doll as in the reference image (same cream-white knitted djellaba robe with a pointed hood hanging down his back, white crocheted skullcap, long fluffy white yarn beard, kind wrinkled felt face, bare felt feet)"
NOTEXT="No text, no letters, no writing, no numbers, no logos, no watermark"

p() {
  case $1 in
  room) echo "Vertical 9:16 portrait image. $KNIT, lit only by a warm candle glow from the lower left, deep night. The inside of a small old Moroccan mud-brick room seen at eye level: the back wall is knitted in earthy ochre, clay and brown yarn with a rough plaster texture, a small square window with closed wooden crocheted shutters high on the LEFT third (dark blue night showing through the gap), a woven straw prayer mat knitted in tan and honey stripes lying across the floor in the lower third, a knitted clay water jug in the far RIGHT corner. The middle and lower LEFT of the floor are empty. No people, no candle, no lamp. Dim, cosy, low-key light. $NOTEXT.|" ;;
  oldsit) echo "Square image. $KNIT, warm candle light from the LEFT. One knitted amigurumi old man doll, an ordinary elderly villager: cream-white knitted djellaba robe with a pointed hood hanging down his back, white crocheted skullcap, long fluffy white yarn beard, kind wrinkled felt face with gentle eyes, bare felt feet. He sits cross-legged on the floor, leaning forward to the LEFT, his right arm stretched out to the LEFT with thumb and finger pinched together as if holding a thin needle, his left hand on his knee. Seen from three-quarter front, facing LEFT, full body visible with a margin. $GREEN|" ;;
  oldsleep) echo "Square image. $KNIT, warm candle light from the LEFT. $OLD. He lies asleep on his side on the floor, head to the LEFT resting on a small knitted cream pillow, knees slightly bent, hands tucked under his cheek, eyes closed, peaceful. Seen from the side, the whole body lying horizontally across the frame with a margin. $GREEN|oldsit" ;;
  oldpray) echo "Square image. $KNIT, soft blue-and-peach dawn light. $OLD. He stands upright facing the viewer, three-quarter turned to the LEFT, starting his prayer: both open hands raised beside his ears with palms forward, eyes open and calm, a gentle peaceful face. Full body visible head to bare feet with a margin, centred. $GREEN|oldsit" ;;
  candle) echo "Portrait 2:3 image. $KNIT. One tall thick pillar candle made of creamy ivory felted wool, seen exactly from the side at eye level, a short black yarn wick on top with NO flame, small felted wax drips running down the top third of its sides, straight sides, flat bottom. It stands alone, centred, filling 80 percent of the image height. No holder, no plate. $GREEN|" ;;
  plate) echo "Wide 3:1 landscape image. $KNIT. One round shallow candle dish crocheted in shiny gold-brass metallic yarn with a small ring handle on the LEFT side, seen from the side at a slightly high angle so it reads as a wide flat ellipse, empty, filling the frame width. $GREEN|" ;;
  bedroom) echo "Vertical 9:16 portrait image. $KNIT, cold blue night light and one small warm bedside lamp. A messy modern bedroom seen from above at a steep angle: in the upper half a single bed with a chunky cable-knit navy blanket and a pale blue knitted pillow, a young man doll in a black knitted hoodie with messy dark yarn hair fast asleep on his back, mouth slightly open, arm across the blanket; a bedside table on the upper LEFT with a glowing knitted lamp; the lower half is the floor with a crocheted rug, knitted clothes piles and a tangle of white yarn charging cables. The blanket surface across the middle is broad and EMPTY (no phones, no objects on it). Blue-teal moody night. $NOTEXT.|" ;;
  phone) echo "Square image. $KNIT. One modern smartphone made of black felt with a slightly rounded knitted rim, lying flat, seen exactly from above, portrait orientation, its screen a plain smooth pale grey-white felt panel with nothing on it, centred, filling 70 percent of the image height. $GREEN|" ;;
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
