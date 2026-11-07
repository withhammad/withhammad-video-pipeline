"""56-video wall texture from our own renders (7 x 8 tiles, varied crops and grades)."""
from PIL import Image, ImageEnhance, ImageDraw
import random, os
H = os.path.dirname(os.path.abspath(__file__)); S = os.path.join(H, 'stills')
src = [Image.open(os.path.join(S, f)).convert('RGB') for f in sorted(os.listdir(S)) if f.endswith('.jpg') and f != 'grid.jpg']
W, Ht = 720, 1280; cols, rows = 7, 8; gap = 8
tw = (W - gap * (cols + 1)) // cols; th = (Ht - gap * (rows + 1)) // rows
out = Image.new('RGB', (W, Ht), (8, 10, 22)); rnd = random.Random(3); d = ImageDraw.Draw(out)
for r in range(rows):
    for c in range(cols):
        im = rnd.choice(src); z = rnd.uniform(1.0, 1.8)
        cw, ch = int(im.width / z), int(im.height / z)
        x0 = rnd.randint(0, im.width - cw); y0 = rnd.randint(0, im.height - ch)
        t = im.crop((x0, y0, x0 + cw, y0 + ch)).resize((tw, th), Image.LANCZOS)
        t = ImageEnhance.Color(t).enhance(rnd.uniform(0.8, 1.4)); t = ImageEnhance.Brightness(t).enhance(rnd.uniform(0.85, 1.15))
        x = gap + c * (tw + gap); y = gap + r * (th + gap)
        out.paste(t, (x, y)); d.rectangle([x, y, x + tw - 1, y + th - 1], outline=(255, 255, 255), width=1)
        d.polygon([(x + 6, y + th - 18), (x + 6, y + th - 8), (x + 14, y + th - 13)], fill=(255, 255, 255))
out.save(os.path.join(S, 'grid.jpg'), quality=92)
print('grid', tw, th)
