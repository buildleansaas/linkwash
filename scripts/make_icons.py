"""Draws the LinkWash icon (a chain link with sparkles) at 512px and exports the sizes Chrome needs."""
from PIL import Image, ImageDraw
import os, sys

S = 1024
out = sys.argv[1] if len(sys.argv) > 1 else "icons"

img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
# Background: rounded square, top-to-bottom blue gradient.
grad = Image.new("RGBA", (S, S))
gd = ImageDraw.Draw(grad)
for y in range(S):
    t = y / S
    c = (int(14 + (2 - 14) * t), int(165 + (132 - 165) * t), int(233 + (199 - 233) * t), 255)
    gd.line([(0, y), (S, y)], fill=c)
mask = Image.new("L", (S, S), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=230, fill=255)
img.paste(grad, (0, 0), mask)

# Chain link: two rounded-rect outlines, drawn upright then rotated 45 degrees.
link = Image.new("RGBA", (S, S), (0, 0, 0, 0))
ld = ImageDraw.Draw(link)
w, h, r, stroke = 230, 420, 115, 70
cx = S // 2
ld.rounded_rectangle([cx - w // 2, 150, cx + w // 2, 150 + h], radius=r, outline="white", width=stroke)
ld.rounded_rectangle([cx - w // 2, S - 150 - h, cx + w // 2, S - 150], radius=r, outline="white", width=stroke)
link = link.rotate(-45, resample=Image.BICUBIC, center=(S // 2, S // 2))
img.alpha_composite(link)

# Sparkles (four-point stars) top-right and bottom-left.
def star(x, y, size):
    k = size // 4
    d.polygon([(x, y - size), (x + k, y - k), (x + size, y), (x + k, y + k),
               (x, y + size), (x - k, y + k), (x - size, y), (x - k, y - k)], fill="white")
d = ImageDraw.Draw(img)
star(800, 215, 95)
star(225, 800, 70)

os.makedirs(out, exist_ok=True)
for size in (16, 32, 48, 128):
    img.resize((size, size), Image.LANCZOS).save(f"{out}/{size}.png")
img.resize((512, 512), Image.LANCZOS).save(f"{out}/512.png")
