#!/bin/zsh
# Step 5b exact-copy check: reference vs our cut, 1 frame/s, side by side with timecodes -> qa/sidebyside_*.jpg
set -e; cd "$(dirname "$0")"; mkdir -p qa/sbs
ffmpeg -v error -y -i source.mp4 -vf "fps=1,scale=270:480,drawtext=text='REF %{pts\:hms}':x=6:y=6:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.6" qa/sbs/r_%03d.png
ffmpeg -v error -y -i "${1:-final.mp4}" -vf "fps=1,scale=270:480,drawtext=text='OURS %{pts\:hms}':x=6:y=6:fontsize=16:fontcolor=yellow:box=1:boxcolor=black@0.6" qa/sbs/o_%03d.png
n=$(ls qa/sbs/r_*.png | wc -l | tr -d ' '); m=$(ls qa/sbs/o_*.png | wc -l | tr -d ' ')
for i in $(seq 1 $(( n > m ? n : m ))); do
  r=qa/sbs/r_$(printf %03d $i).png; o=qa/sbs/o_$(printf %03d $i).png
  [ -f $r ] || ffmpeg -v error -y -f lavfi -i color=black:s=270x480 -frames:v 1 $r
  [ -f $o ] || ffmpeg -v error -y -f lavfi -i color=black:s=270x480 -frames:v 1 $o
  ffmpeg -v error -y -i $r -i $o -filter_complex hstack qa/sbs/p_$(printf %03d $i).png
done
ffmpeg -v error -y -pattern_type glob -i 'qa/sbs/p_0[0-3]?.png' -vf tile=8x4 qa/sidebyside_1.jpg
ffmpeg -v error -y -pattern_type glob -i 'qa/sbs/p_0[3-6]?.png' -vf tile=8x4 qa/sidebyside_2.jpg
echo "ref frames $n, ours $m"
