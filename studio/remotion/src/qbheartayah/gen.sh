#!/usr/bin/env bash
# Quran Beat "heart / ayah" stills, GPT Image 2 via the tagged Codex wrapper (gen2.sh). Usage: gen.sh <lane>
set -u
S=/private/tmp/claude-501/-Users-hammad-withhammad-video-pipeline/5fde070d-a498-45f3-88f9-d7769454f905/scratchpad
Q=/Users/hammad/withhammad-video-pipeline/studio/.local/jobs/qb-DfU-34WRzIF/qb
G=$Q/gen
FACE=/Users/hammad/withhammad-video-pipeline/work/site/hairline-resource/public/hammad-headshot-v3.jpg
SREF=$Q/src/style_ref.png
BASE=$G/s1-sad.png
STYLE="Art style: a still from a soft, high-end 3D animated short film: smooth matte clay-like 3D render, soft global illumination, gentle film grain. The scene is lit only by cold blue moonlight from the window on the right and the warm glow of the phone screen on the left; the rest of the room is dark. Vertical 9:16 frame, camera looking straight down from the ceiling (exact top-down view). No text, no letters, no watermark, no border."
SCENE="Exact top-down view of a single wooden bed with a dark wooden frame and slatted head and foot boards, filling the frame from top to bottom; dark wooden floorboards on the left; on the right a tall window with a dark wooden frame showing a night sky with light falling snow. Pale blue-grey sheets and a pillow, and a heavy grey woollen blanket pulled up to his waist. On the mattress beside his left hand (on the left of the frame) lies a smartphone face up, its screen glowing warm white. He wears a plain white crew-neck t-shirt; on the middle of his chest sits a glossy red 3D heart, like a soft clay heart sticker, about the size of his palm."
LIKE="He is a stylised 3D animated-film character who clearly keeps the exact likeness of the man in the first attached photo: the same face shape, eyes, nose, eyebrows, short dark hair, full dark beard and skin tone."
shot() { local name=$1 p=$2; shift 2; [ -s "$G/$name.png" ] && { echo "skip $name"; return; }
  "$S/khair/gen2.sh" "$G/$name.png" "$p" "$@" && echo "done $name $(date +%T)" || echo "FAIL $name $(date +%T)"; }
if [ "$1" = base ]; then
shot s1-sad "A young man lies on his back in bed at night, seen exactly from above. $LIKE His eyes are open, looking straight up at the camera, his eyebrows drawn up in quiet sadness, mouth turned slightly down, heartbroken. The red heart on his chest is BROKEN: split down the middle by a jagged crack into two halves. His right arm lies along his side on the blanket; his left arm reaches down by his side so his fingertips rest on the glowing phone screen. Use the second attached image as the exact reference for the composition, camera angle, bed, room, window, lighting and colours: copy it closely, but the stick figure becomes this man. $SCENE $STYLE" "$FACE" "$SREF"
fi
EDIT="Use the second attached image as the base: keep EVERYTHING identical (same camera, same framing, same bed, blanket, pillow, window, phone, lighting, same position and size of his head and body, same man) and change only what is described here."
if [ "$1" = a ]; then
shot s2-hands "$EDIT Now his eyes are gently closed and his face is calm, and both his hands are folded together over the middle of his chest, just below the red heart, fingers interlaced. The heart is still broken, split by a jagged crack. The phone still glows on the mattress by his side. $LIKE $STYLE" "$FACE" "$BASE"
shot s3-mended "$EDIT Now his eyes are gently closed with a soft, peaceful expression, and both his hands are folded together over the middle of his chest, just below the red heart, fingers interlaced. The red heart is whole again, mended: the crack is closed and a small beige fabric sticking plaster is stuck diagonally across it. The phone still glows on the mattress by his side. $LIKE $STYLE" "$FACE" "$BASE"
fi
if [ "$1" = b ]; then
shot s4-peace "$EDIT Now his eyes are gently closed and he has a soft, content smile, completely at peace, as if listening to something beautiful. Both arms rest relaxed along his sides on the blanket, palms down, his left hand near the glowing phone. The red heart on his chest is whole again, mended: the crack is closed and a small beige fabric sticking plaster is stuck diagonally across it. $LIKE $STYLE" "$FACE" "$BASE"
shot cv-face "Close top-down portrait of the same man lying in bed at night, seen exactly from above, head and chest filling the frame. $LIKE His eyes are open and glistening, one tear running from the corner of his eye toward the pillow, eyebrows drawn up in deep sadness, heartbroken. On his white t-shirt the glossy red 3D clay heart is BROKEN, split by a jagged crack into two halves. The warm glow of a phone screen lights his face from the lower left, cold blue moonlight from the right. Use the third attached image only for the look, room, sheets and lighting. Head in the upper-middle of the frame, the broken heart in the middle. $STYLE" "$FACE" "$BASE" "$SREF"
fi
if [ "$1" = c ]; then
shot cv-face2 "$EDIT Pull the camera back a little so the framing is wider: the top of his head sits about 14 percent down from the top of the frame, his eyes at about 27 percent, the broken red heart on his chest at about 52 percent of the frame height, and the grey blanket covers the bottom 30 percent of the frame as plain, calm, dark texture. Same tear, same sad glistening eyes, same broken heart, same lighting. $LIKE $STYLE" "$FACE" "$G/cv-face.png"
fi
