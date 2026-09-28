# Stack the view rows of several render.png files into one contact sheet.
#   python3 bench/overnight/sheet.py out.jpg width render1.png render2.png ...
import sys
from PIL import Image
out, width, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
rows = []
for f in files:
    im = Image.open(f).convert('RGB')
    if im.height > 600:
        im = im.crop((0, im.height - 512, im.width, im.height))
    h = round(im.height * width / im.width)
    rows.append(im.resize((width, h)))
s = Image.new('RGB', (width, sum(r.height for r in rows)), 'white')
y = 0
for r in rows:
    s.paste(r, (0, y)); y += r.height
s.save(out, quality=88)
