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
from PIL import Image, ImageEnhance

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'src' / 'assets' / 'liora-portrait.png'
OUTLINE = (18, 10, 20, 255)

ap = argparse.ArgumentParser()
ap.add_argument('frames', nargs='+', help='base [blink [talk]] images')
ap.add_argument('--size', default='144x180')
ap.add_argument('--colors', type=int, default=48)
ap.add_argument('--saturation', type=float, default=1.1)
ap.add_argument('--contrast', type=float, default=1.0)
ap.add_argument('--no-outline', action='store_true')
ap.add_argument('--out', default=str(OUT))
a = ap.parse_args()
W, H = map(int, a.size.split('x'))


def fit(path):
    im = Image.open(path).convert('RGBA')
    # crop to the target aspect: centred horizontally, keep the top (the face)
    if im.width / im.height > W / H:
        cw = round(im.height * W / H)
        im = im.crop(((im.width - cw) // 2, 0, (im.width - cw) // 2 + cw, im.height))
    else:
        im = im.crop((0, 0, im.width, round(im.width * H / W)))
    # premultiply so transparent edges don't bleed dark fringes, then area-average
    small = im.resize((W, H), Image.BOX)
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
