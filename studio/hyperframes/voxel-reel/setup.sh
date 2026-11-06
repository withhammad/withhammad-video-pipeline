#!/usr/bin/env bash
# Make a job's hf/ folder for the voxel reel from this source: setup.sh <job_dir>
# Vendors three@0.170.0 (MIT) and gsap 3.14.2, copies the fonts (OFL) from studio/remotion/public/fonts.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; JOB="${1:?usage: setup.sh <job_dir>}"; F="$HERE/../../remotion/public/fonts"
mkdir -p "$JOB/hf/vendor" "$JOB/hf/fonts"
cp "$HERE"/{index.html,hyperframes.json,meta.json} "$JOB/hf/"; cp "$HERE"/{script.json,make_voice.py,sfx.py,sound-bed.py,master.sh} "$JOB/"
cp "$F"/inter-latin-{600,700,800,900}-normal.woff2 "$F"/jetbrains-mono-latin-{500,700}-normal.woff2 "$F"/OFL-Inter.txt "$F"/OFL-JetBrainsMono.txt "$JOB/hf/fonts/"
cd "$JOB/hf/vendor"
[ -f three.module.min.js ] || { npm pack three@0.170.0 --silent >/dev/null && tar xzf three-0.170.0.tgz && cp package/build/three.module.min.js . && rm -rf package three-0.170.0.tgz; }
[ -f gsap.min.js ] || curl -sf -o gsap.min.js https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js
echo "ok: $JOB/hf"
