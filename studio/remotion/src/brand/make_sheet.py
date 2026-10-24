#!/usr/bin/env python3
"""Brand sample sheet + LinkedIn document PDF from the stills render.mjs wrote (stdlib + ffmpeg only).

    python3 src/brand/make_sheet.py [samples_dir]   (default studio/.local/brand-samples)

sample_sheet.png rows (left to right):
  1. Kimi source cover, Kimi <ReelCover>, Kimi crop guides, Skill source cover, Skill <ReelCover>, Skill crop guides
  2. Kimi ReelCover cropped 3:4, 4:5, 1:1, then Skill ReelCover cropped 3:4, 4:5, 1:1
  3-4. Instagram carousel slides 01-10, then the LinkedIn end slide.
carousel-linkedin.pdf: the LinkedIn slides as one 1080x1350 page each (JPEG inside, upload as a document post).
"""
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
STUDIO = HERE.parents[2]
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else STUDIO / '.local' / 'brand-samples'
JOBS = STUDIO / '.local' / 'jobs'
CELL_W, GAP, LABEL = 432, 16, 0   # this ffmpeg build has no drawtext, so cells are unlabelled (order in the docstring)
CROPS = {'3:4': (0, 240, 1080, 1440), '4:5': (0, 284, 1080, 1350), '1:1': (0, 420, 1080, 1080)}


def tile(path, label, crop=None):
    return {'path': str(path), 'label': label, 'crop': crop}


def rows():
    kimi_src, skill_src = JOBS / 'c6e60a58849b' / 'cover_1080x1920.jpg', JOBS / 'd61788123d13' / 'cover_1080x1920.jpg'
    covers = [tile(kimi_src, 'Kimi source'), tile(OUT / 'cover-kimi.png', 'Kimi ReelCover'), tile(OUT / 'cover-kimi-guides.png', 'Kimi crop guides'),
              tile(skill_src, 'Skill source'), tile(OUT / 'cover-skill.png', 'Skill ReelCover'), tile(OUT / 'cover-skill-guides.png', 'Skill crop guides')]
    crops = [tile(OUT / f'cover-{n}.png', f'{n} {k}', CROPS[k]) for n in ('kimi', 'skill') for k in CROPS]
    ig = sorted(OUT.glob('carousel-instagram-*.png'))
    li = sorted(OUT.glob('carousel-linkedin-*.png'))
    slides = [tile(p, f'IG {i + 1:02d}') for i, p in enumerate(ig)] + [tile(li[-1], 'LinkedIn end')]
    return [covers, crops] + [slides[i:i + 6] for i in range(0, len(slides), 6)]


def sheet():
    inputs, filters, layout, labels = [], [], [], []
    y = 0
    for row in rows():
        heights = []
        for t in row:
            x0, y0, w, h = t['crop'] or ((0, 0, 1080, 1920) if 'cover' in t['path'] else (0, 0, 1080, 1350))
            heights.append(round(CELL_W * h / w))
        cell_h = max(heights) + LABEL
        for i, t in enumerate(row):
            n = len(labels)
            inputs += ['-i', t['path']]
            x0, y0, w, h = t['crop'] or (0, 0, 0, 0)
            crop = f'crop={w}:{h}:{x0}:{y0},' if t['crop'] else ''
            filters.append(f'[{n}:v]{crop}scale={CELL_W}:-2:flags=lanczos,pad={CELL_W}:{cell_h}:0:{LABEL}:color=0x101214[t{n}]')
            layout.append(f'{i * (CELL_W + GAP)}_{y}')
            labels.append(f'[t{n}]')
        y += cell_h + GAP
    filters.append(f"{''.join(labels)}xstack=inputs={len(labels)}:layout={'|'.join(layout)}:fill=0x0B0C0D[out]")
    dst = OUT / 'sample_sheet.png'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', ';'.join(filters), '-map', '[out]', '-frames:v', '1', str(dst)], check=True)
    return dst


def pdf(pages, dst, w=1080, h=1350):
    """Minimal PDF: one page per JPEG (DCTDecode), page size = image size in points."""
    objs, jpgs = [], []
    for p in pages:
        jpg = p.with_suffix('.pdfpage.jpg')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(p), '-q:v', '2', str(jpg)], check=True)
        jpgs.append(jpg)
    n = len(jpgs)
    kids = ' '.join(f'{3 + 3 * i} 0 R' for i in range(n))
    objs.append(b'<< /Type /Catalog /Pages 2 0 R >>')
    objs.append(f'<< /Type /Pages /Kids [{kids}] /Count {n} >>'.encode())
    for i, jpg in enumerate(jpgs):
        page, img, content = 3 + 3 * i, 4 + 3 * i, 5 + 3 * i
        data = jpg.read_bytes()
        draw = f'q {w} 0 0 {h} 0 0 cm /Im0 Do Q'.encode()
        objs.append(f'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {w} {h}] /Resources << /XObject << /Im0 {img} 0 R >> >> /Contents {content} 0 R >>'.encode())
        objs.append(f'<< /Type /XObject /Subtype /Image /Width {w} /Height {h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length {len(data)} >>\nstream\n'.encode() + data + b'\nendstream')
        objs.append(f'<< /Length {len(draw)} >>\nstream\n'.encode() + draw + b'\nendstream')
        jpg.unlink()
    out, offsets = bytearray(b'%PDF-1.4\n%\xe2\xe3\xcf\xd3\n'), []
    for i, o in enumerate(objs, 1):
        offsets.append(len(out))
        out += f'{i} 0 obj\n'.encode() + o + b'\nendobj\n'
    xref = len(out)
    out += f'xref\n0 {len(objs) + 1}\n0000000000 65535 f \n'.encode() + b''.join(f'{o:010d} 00000 n \n'.encode() for o in offsets)
    out += f'trailer\n<< /Size {len(objs) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n'.encode()
    dst.write_bytes(bytes(out))
    return dst


if __name__ == '__main__':
    print(sheet())
    print(pdf(sorted(OUT.glob('carousel-linkedin-*.png')), OUT / 'carousel-linkedin.pdf'))
