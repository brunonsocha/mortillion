# Cuts a figure out of a plain light background.
#
#   python3 scripts/cutout.py in.jpg out.png [--crop x,y,w,h] [--white 236] [--grey 16]
#
# Flood-fills the background from the image border through near-white,
# low-saturation pixels (so light hair touching the edge isn't eaten unless
# it is truly white), then keeps only the largest remaining shape, which
# drops stray decorations such as frame lines. Edge pixels next to the
# background are softened by how light they are, for a clean fringe.
import argparse
from collections import deque
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('src')
ap.add_argument('out')
ap.add_argument('--crop')
ap.add_argument('--white', type=int, default=236, help='min channel value counted as background')
ap.add_argument('--grey', type=int, default=16, help='max channel spread counted as background')
a = ap.parse_args()

im = Image.open(a.src).convert('RGB')
if a.crop:
    x, y, w, h = map(int, a.crop.split(','))
    im = im.crop((x, y, x + w, y + h))
W, H = im.size
px = im.load()


def bgish(x, y):
    r, g, b = px[x, y]
    return min(r, g, b) >= a.white and max(r, g, b) - min(r, g, b) <= a.grey


bg = bytearray(W * H)
q = deque()
for x in range(W):
    for y in (0, H - 1):
        if bgish(x, y) and not bg[y * W + x]:
            bg[y * W + x] = 1
            q.append((x, y))
for y in range(H):
    for x in (0, W - 1):
        if bgish(x, y) and not bg[y * W + x]:
            bg[y * W + x] = 1
            q.append((x, y))
while q:
    x, y = q.popleft()
    for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
        if 0 <= nx < W and 0 <= ny < H and not bg[ny * W + nx] and bgish(nx, ny):
            bg[ny * W + nx] = 1
            q.append((nx, ny))

# keep the largest foreground shape
label = [0] * (W * H)
best, best_size, n = 0, 0, 0
for start in range(W * H):
    if bg[start] or label[start]:
        continue
    n += 1
    label[start] = n
    size = 0
    q.append(start)
    while q:
        i = q.popleft()
        size += 1
        x, y = i % W, i // W
        for j in (i + 1 if x + 1 < W else -1, i - 1 if x > 0 else -1, i + W if y + 1 < H else -1, i - W if y > 0 else -1):
            if j >= 0 and not bg[j] and not label[j]:
                label[j] = n
                q.append(j)
    if size > best_size:
        best, best_size = n, size

out = Image.new('RGBA', (W, H))
op = out.load()
for y in range(H):
    for x in range(W):
        i = y * W + x
        if label[i] != best:
            continue
        r, g, b = px[x, y]
        alpha = 255
        # soften the fringe: a light pixel touching the background fades out
        if any(0 <= x + dx < W and 0 <= y + dy < H and bg[(y + dy) * W + x + dx] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            alpha = max(60, min(255, int((255 - min(r, g, b)) * 4)))
        op[x, y] = (r, g, b, alpha)
out.save(a.out)
print(f'{a.out}: {W}x{H}, kept {best_size} px of {W * H}')
