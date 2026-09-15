#!/usr/bin/env python3
"""Render Clearwren Instagram slides from a post spec, and refuse anything unfit to publish.

One spec drives both halves: this renders each slide (label, headline, body, optional
chips) to the basename of its `url`, and tools/ig_publish.py posts those same URLs with
each slide's `alt`.

Mechanical checks, all of which must pass: JPEG 1080x1350 RGB (the tallest ratio the
Instagram API accepts, and JPEG is the only format it takes), text contrast against the
brand blue, body text that neither ends on a lone word nor runs into the footer, and
every visible word of a slide present in its alt text.

    python3 tools/ig_slides.py docs/outreach/instagram-NN.json [--out DIR]
"""
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
W, H = 1080, 1350
BLUE, WHITE, SOFT = (28, 93, 153), (255, 255, 255), (198, 219, 238)
FONT = '/System/Library/Fonts/Supplemental/Arial%s.ttf'
FOOTER_TOP = H - 220


def font(size, bold=False):
    return ImageFont.truetype(FONT % (' Bold' if bold else ''), size)


def contrast(a, b):
    def lum(c):
        s = [v / 255 for v in c]
        s = [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in s]
        return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2]
    x, y = lum(a), lum(b)
    return (max(x, y) + 0.05) / (min(x, y) + 0.05)


def wrap(draw, text, f, maxw):
    lines, line = [], ''
    for word in text.split():
        trial = (line + ' ' + word).strip()
        if draw.textbbox((0, 0), trial, font=f)[2] <= maxw:
            line = trial
        else:
            lines.append(line)
            line = word
    lines.append(line)
    return lines


def mark(img, x, y, size):
    s = 4
    c = Image.new('RGBA', (size * s, size * s), (0, 0, 0, 0))
    d = ImageDraw.Draw(c)
    r, cx = int(size * s * 0.43), size * s // 2
    d.ellipse([cx - r, cx - r, cx + r, cx + r], outline=WHITE + (255,), width=int(size * s * 0.085))
    d.line([(cx - r * 0.48, cx + r * 0.03), (cx - r * 0.13, cx + r * 0.40), (cx + r * 0.55, cx - r * 0.42)],
           fill=WHITE + (255,), width=int(size * s * 0.095), joint='curve')
    c = c.resize((size, size), Image.LANCZOS)
    img.paste(c, (x, y), c)


def render(slide, path):
    img = Image.new('RGB', (W, H), BLUE)
    dr = ImageDraw.Draw(img)
    m, maxw, y = 96, W - 2 * 96, 150
    dr.text((m, y), slide['label'].upper(), font=font(34, True), fill=SOFT)
    y += 110
    fh = font(92, True)
    for ln in wrap(dr, slide['headline'], fh, maxw):
        dr.text((m, y), ln, font=fh, fill=WHITE)
        y += 108
    y += 50
    if slide.get('chips'):
        fc, x = font(44, True), m
        for chip in slide['chips']:
            tw = dr.textbbox((0, 0), chip, font=fc)[2]
            if x + tw + 56 > W - m:
                x, y = m, y + 96
            dr.rounded_rectangle([x, y, x + tw + 48, y + 76], radius=38, outline=SOFT, width=3)
            dr.text((x + 24, y + 12), chip, font=fc, fill=WHITE)
            x += tw + 72
        y += 130
    fb = font(46)
    body = wrap(dr, slide['body'], fb, maxw)
    for ln in body:
        dr.text((m, y), ln, font=fb, fill=SOFT)
        y += 64
    mark(img, m, H - 170, 64)
    dr.text((m + 88, H - 157), 'clearwren.com', font=font(40, True), fill=WHITE)
    img.save(path, 'JPEG', quality=92, subsampling=0, optimize=True)
    return body, y


def norm(s):
    s = s.lower()
    for a, b in (('“', '"'), ('”', '"'), ('‘', "'"), ('’', "'")):
        s = s.replace(a, b)
    return re.sub(r'\s+', ' ', s).strip().rstrip('.')


def main(argv):
    spec_path = argv[1]
    out = ROOT / (argv[argv.index('--out') + 1] if '--out' in argv else 'site/assets/social')
    out.mkdir(parents=True, exist_ok=True)
    spec = json.loads(Path(spec_path).read_text())
    problems = []
    for name, fg in (('headline', WHITE), ('body', SOFT)):
        if contrast(fg, BLUE) < 4.5:
            problems.append(f'{name} colour fails contrast: {contrast(fg, BLUE):.2f}:1')
    for s in spec['slides']:
        name = Path(s['url']).name
        body, bottom = render(s, out / name)
        if len(body) > 1 and len(body[-1].split()) < 2:
            problems.append(f'{name}: body ends on a lone word ("{body[-1]}")')
        if bottom > FOOTER_TOP:
            problems.append(f'{name}: text runs into the footer')
        alt = norm(s.get('alt', ''))
        missing = [p for p in [s['headline'], s['body']] + s.get('chips', []) if norm(p) not in alt]
        if missing:
            problems.append(f'{name}: alt text is missing visible words: {missing}')
        im = Image.open(out / name)
        if (im.format, im.size, im.mode) != ('JPEG', (W, H), 'RGB'):
            problems.append(f'{name}: {im.format} {im.size} {im.mode}, need JPEG 1080x1350 RGB')
        print(f'rendered {out.relative_to(ROOT)}/{name}')
    if problems:
        print('NOT FIT TO PUBLISH:')
        for p in problems:
            print('  ' + p)
        return 1
    print(f"{len(spec['slides'])} slides fit to publish")
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
