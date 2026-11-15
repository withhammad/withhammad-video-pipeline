"""Prepare the GPT Image 2 stills for the Quran Beat "Pharaoh called it magic" reel: a LANCZOS upscale to 1296x2304 (1.2x the
frame, room for the Ken Burns zoom and the shake) and a light unsharp mask; colour kept as generated (the photoreal epic grade is applied in Magic.tsx).
python3 studio/remotion/src/qbmagic/prep.py <gen dir> <public dir>"""
import sys
from pathlib import Path
from PIL import Image, ImageFilter, ImageOps

gen, pub = Path(sys.argv[1]), Path(sys.argv[2])
for src in sorted(gen.glob('*.png')):
    sub = 'cover' if src.stem.startswith('cv-') else 'shots'
    out = pub / sub / f'{src.stem}.jpg'
    out.parent.mkdir(parents=True, exist_ok=True)
    im = ImageOps.fit(Image.open(src).convert('RGB'), (1296, 2304), Image.LANCZOS, centering=(0.5, 0.5))
    im.filter(ImageFilter.UnsharpMask(radius=1.4, percent=55, threshold=2)).save(out, quality=93)
    print(out)
