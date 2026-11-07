#!/bin/zsh
# Master for the Rubber World reel: voice levelled to -16 LUFS, original bed (bed.wav) at -29 LUFS (13 dB under), mixed,
# then a two-pass linear loudnorm to -14 LUFS / -1.8 dBTP target (true peak must read <= -1.5). H.264 limited range bt709, AAC 48 kHz.
# Usage: master.sh render.mp4 final.mp4      (needs bed.wav: python3 sound-bed.py <seconds>)
set -e
cd "$(dirname "$0")"
MIX="[0:a]aformat=sample_rates=48000:channel_layouts=stereo,loudnorm=I=-16:TP=-3:LRA=7[v];[1:a]loudnorm=I=-29:TP=-9:LRA=5[m];[v][m]amix=inputs=2:duration=first:normalize=0"
J=$(ffmpeg -nostats -i "$1" -i bed.wav -filter_complex "$MIX,loudnorm=I=-14:TP=-1.8:LRA=7:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$J" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i "$1" -i bed.wav -filter_complex \
 "$MIX,loudnorm=I=-14:TP=-1.8:LRA=7:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000[a];[0:v]scale=1080:1920:out_range=tv,format=yuv420p[vo]" \
 -map "[vo]" -map "[a]" -c:v libx264 -preset slow -crf 20 -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
 -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$2"
ffmpeg -nostats -i "$2" -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
