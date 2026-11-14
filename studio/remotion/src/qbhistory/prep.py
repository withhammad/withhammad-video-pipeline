"""Prepare the GPT Image 2 stills for the Quran Beat "Great history" reel: grayscale, a gentle film S-curve, a LANCZOS
upscale to 1296x2304 (1.2x the frame, room for the Ken Burns zoom) and a light unsharp mask.
python3 studio/remotion/src/qbhistory/prep.py <gen dir> <public dir>"""
import sys
from pathlib import Path
from PIL import Image, ImageFilter, ImageOps

gen, pub = Path(sys.argv[1]), Path(sys.argv[2])
curve = [min(255, max(0, round(255 * (x / 255) ** 1.04 * (1 + 0.10 * (x / 255 - 0.5))))) for x in range(256)]
for src in sorted(gen.glob('*.png')):
    sub = 'cover' if src.stem.startswith('cv-') else 'shots'
    out = pub / sub / f'{src.stem}.jpg'
    out.parent.mkdir(parents=True, exist_ok=True)
    im = ImageOps.grayscale(Image.open(src).convert('RGB')).point(curve)
    im = ImageOps.fit(im, (1296, 2304), Image.LANCZOS, centering=(0.5, 0.5))
    im.filter(ImageFilter.UnsharpMask(radius=1.6, percent=60, threshold=2)).convert('RGB').save(out, quality=93)
    print(out)
