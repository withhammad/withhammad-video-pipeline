#!/bin/zsh
# Master for the voxel reel: voice (<dir>/voice.wav) levelled to -16 LUFS, SFX (<dir>/sfx.wav) under it, original bed (bed.wav)
# at -29 LUFS, mixed, then two-pass linear loudnorm to -14 LUFS / -1.8 dBTP. H.264 limited range bt709, AAC 48 kHz.
# Usage: master.sh <dir> final.mp4    (<dir>/render.mp4 from hf, python3 sound-bed.py <s>, python3 sfx.py <dir> <s>)
set -e
cd "$(dirname "$0")"
D=$1
MIX="[1:a]aformat=sample_rates=48000:channel_layouts=stereo,loudnorm=I=-16:TP=-3:LRA=7[v];[3:a]volume=1.0[s];[2:a]loudnorm=I=-29:TP=-9:LRA=5[m];[v][s][m]amix=inputs=3:duration=first:normalize=0"
IN=(-i $D/render.mp4 -i $D/voice.wav -i bed.wav -i $D/sfx.wav)
J=$(ffmpeg -nostats $IN -filter_complex "$MIX,loudnorm=I=-14:TP=-1.8:LRA=7:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$J" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y $IN -filter_complex \
 "$MIX,loudnorm=I=-14:TP=-1.8:LRA=7:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000[a];[0:v]scale=1080:1920:out_range=tv,format=yuv420p[vo]" \
 -map "[vo]" -map "[a]" -c:v libx264 -preset slow -crf 20 -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
 -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$2"
ffmpeg -nostats -i "$2" -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
