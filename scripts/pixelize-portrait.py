# Turns any illustration of Liora into the game's pixel-art portrait.
#
#   python3 scripts/pixelize-portrait.py base.png [blink.png talk.png] [--size 72x90] [--colors 32] [--saturation 1.3] [--contrast 1.15]
#
# The inputs can come from anywhere: the vector source in art/liora (rendered
# with rsvg-convert), a commission, an AI image. Each frame is cropped to the
# portrait's aspect (centred, top-aligned), averaged down to the target size,
# reduced to one shared palette without dithering, and cleaned up: alpha snaps
# to on/off, and an outline is added where the figure meets the background.
# Output: src/assets/liora-portrait.png, the frames side by side.
# Missing blink/talk frames reuse the base frame.
import argparse
import pathlib
from PIL import Image, ImageEnhance, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'src' / 'assets' / 'liora-portrait.png'
OUTLINE = (18, 10, 20, 255)

ap = argparse.ArgumentParser()
ap.add_argument('frames', nargs='+', help='base [blink [talk]] images')
ap.add_argument('--size', default='144x180')
ap.add_argument('--colors', type=int, default=48)
ap.add_argument('--saturation', type=float, default=1.1)
ap.add_argument('--contrast', type=float, default=1.0)
ap.add_argument('--crop', help='x,y,w,h of the source to use (default: whole image)')
ap.add_argument('--smooth', type=int, default=0, help='median filter size on the source before shrinking (flattens fine texture)')
ap.add_argument('--despeckle', type=int, default=0, help='passes of stray-pixel clean-up after reducing colours')
ap.add_argument('--lines', type=float, default=0.0,
                help='keep line art: a block whose darkest part is this much darker (0-255) picks the dark tone (0 = plain averaging)')
ap.add_argument('--no-outline', action='store_true')
ap.add_argument('--out', default=str(OUT))
a = ap.parse_args()
W, H = map(int, a.size.split('x'))


def lum(c):
    return 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]


def shrink(im):
    """
    Downscale that keeps line art. Plain averaging dissolves thin dark lines
    (lashes, lips, outlines) into mush at low resolution; here each output
    pixel looks at its block, and if a clearly darker group takes up enough of
    it, the pixel takes that group's colour instead of the average.
    """
    B = 12
    big = im.resize((W * B, H * B), Image.LANCZOS)
    if a.smooth:
        rgb = big.convert('RGB').filter(ImageFilter.MedianFilter(a.smooth))
        rgb.putalpha(big.getchannel('A'))
        big = rgb
    src = big.load()
    out = Image.new('RGBA', (W, H))
    op = out.load()
    for oy in range(H):
        for ox in range(W):
            px = [src[ox * B + x, oy * B + y] for y in range(B) for x in range(B)]
            solid = [p for p in px if p[3] >= 128]
            if len(solid) < len(px) // 2:
                op[ox, oy] = (0, 0, 0, 0)
                continue
            ls = sorted(solid, key=lum)
            k = max(1, len(ls) * 3 // 10)
            dark, rest = ls[:k], ls[k:]
            mean = lambda g: tuple(sum(p[i] for p in g) // len(g) for i in range(3))
            md, mr = mean(dark), mean(rest) if rest else mean(dark)
            op[ox, oy] = (md if lum(mr) - lum(md) > a.lines else mean(solid)) + (255,)
    return out


def fit(path):
    im = Image.open(path).convert('RGBA')
    if a.crop:
        x, y, w, h = map(int, a.crop.split(','))
        im = im.crop((x, y, x + w, y + h))
    # crop to the target aspect: centred horizontally, keep the top (the face)
    if im.width / im.height > W / H:
        cw = round(im.height * W / H)
        im = im.crop(((im.width - cw) // 2, 0, (im.width - cw) // 2 + cw, im.height))
    else:
        im = im.crop((0, 0, im.width, round(im.width * H / W)))
    small = shrink(im) if a.lines else im.resize((W, H), Image.BOX)
    rgb = ImageEnhance.Color(small.convert('RGB')).enhance(a.saturation)
    rgb = ImageEnhance.Contrast(rgb).enhance(a.contrast)
    alpha = small.getchannel('A').point(lambda v: 255 if v >= 128 else 0)
    return rgb, alpha


frames = [fit(p) for p in a.frames]
while len(frames) < 3:
    frames.append(frames[0])

# one palette for every frame, so blinking never shifts a colour
sheet_rgb = Image.new('RGB', (W * len(frames), H))
for i, (rgb, _) in enumerate(frames):
    sheet_rgb.paste(rgb, (i * W, 0))
# Median cut favours large areas, so small saturated accents (eyes, lips,
# gems, rim light) get their own share: a second palette from vivid pixels only.
ACCENTS = max(8, a.colors // 3)
base_pal = sheet_rgb.quantize(colors=a.colors - ACCENTS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
vivid = [c for c in sheet_rgb.getdata() if max(c) - min(c) > 0.42 * max(1, max(c)) and max(c) > 70]
colours = [tuple(base_pal.getpalette()[i * 3:i * 3 + 3]) for i in range(a.colors - ACCENTS)]
if vivid:
    strip = Image.new('RGB', (len(vivid), 1))
    strip.putdata(vivid)
    acc = strip.quantize(colors=ACCENTS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    colours += [tuple(acc.getpalette()[i * 3:i * 3 + 3]) for i in range(ACCENTS)]
pal = Image.new('P', (1, 1))
flat = [v for c in colours for v in c]
pal.putpalette(flat + flat[:3] * (256 - len(colours)))
indexed = sheet_rgb.quantize(palette=pal, dither=Image.Dither.NONE).convert('RGBA')

out = Image.new('RGBA', (W * len(frames), H), (0, 0, 0, 0))
for i, (_, alpha) in enumerate(frames):
    frame = indexed.crop((i * W, 0, (i + 1) * W, H))
    frame.putalpha(alpha)
    # Clean-up: a lone pixel that matches none of its neighbours, while most
    # of them agree, takes their colour (hand pixel artists do the same).
    for _ in range(a.despeckle):
        fp = frame.load()
        fix = []
        for y in range(1, H - 1):
            for x in range(1, W - 1):
                c = fp[x, y]
                if not c[3]:
                    continue
                nb = [fp[x + dx, y + dy] for dx in (-1, 0, 1) for dy in (-1, 0, 1) if dx or dy]
                if c in nb:
                    continue
                best = max(set(nb), key=nb.count)
                if best[3] and nb.count(best) >= 4:
                    fix.append((x, y, best))
        for x, y, c in fix:
            fp[x, y] = c
    if not a.no_outline:
        px = frame.load()
        edge = [(x, y) for y in range(H) for x in range(W)
                if px[x, y][3] == 0 and any(0 <= x + dx < W and 0 <= y + dy < H and px[x + dx, y + dy][3] and px[x + dx, y + dy] != OUTLINE
                                            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))]
        for x, y in edge:
            px[x, y] = OUTLINE
    out.paste(frame, (i * W, 0))

pathlib.Path(a.out).parent.mkdir(parents=True, exist_ok=True)
out.save(a.out, optimize=True)
print(f'{a.out}: {len(frames)} frames of {W}x{H}, {a.colors} colours')
