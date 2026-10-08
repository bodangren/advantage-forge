#!/usr/bin/env python3
"""Review cards for an independent reviewer: one PNG per asset.

Row 1: the mockup (the reference panel of out/<name>/render.png) and the four turnaround views.
Row 2: the 8-direction sprite preview at 128 px, and the three-quarter row of one motion strip
(sit, then walk, swim, fly, hop, idle, or the first strip found; strips older than the GLB are skipped).
An asset with a `sit` clip has a sitting mockup and a standing rest pose; the card shows the sit.
An asset whose mockup shows an action (owner decision of 2026-10-08) names the matching clip with
`<name>=<clip>`, for example `squirrel=run`; the card shows that strip.

Usage: python3 scripts/review-cards.py <out-dir> <name>[=<clip>] [<name>[=<clip>] ...]
Run `./forge all <name>` first, so the render, the sprites, and the strips are the final ones.
"""
import os
import sys

from PIL import Image, ImageDraw

H = 360  # the height of one view panel


def card(name: str, out_dir: str, pose_clip: str | None = None) -> str:
    render = Image.open(f'out/{name}/render.png').convert('RGB')
    w, h = render.size
    views = render.crop((0, h // 2, w, h))
    ref = render.crop((w * 3 // 8, 0, w * 5 // 8, h // 2))
    ref = ref.resize((H, H))
    views = views.resize((int(views.width * H / views.height), H))
    row1 = Image.new('RGB', (H + views.width, H), (30, 30, 34))
    row1.paste(ref, (0, 0))
    row1.paste(views, (H, 0))

    sprites = Image.open(f'out/{name}/sprites/preview.png').convert('RGB')
    sprites = sprites.resize((int(sprites.width * 300 / sprites.height), 300))
    clip = None
    anim_dir = f'out/{name}/anim'
    strips = sorted(f for f in os.listdir(anim_dir) if f.endswith('.png')) if os.path.isdir(anim_dir) else []
    # Only strips from the current build: a strip older than the GLB is left over from an earlier clip set.
    glb = f'out/{name}/{name}.glb'
    if os.path.exists(glb):
        built = os.path.getmtime(glb) - 600
        if strips and not any(os.path.getmtime(f'{anim_dir}/{f}') >= built for f in strips):
            # A `--fast` build after `forge all` replaces the final GLB and the views (vertex colors).
            print(f'warning: {name}: every clip strip is older than the GLB; run ./forge all {name} again', file=sys.stderr)
        strips = [f for f in strips if os.path.getmtime(f'{anim_dir}/{f}') >= built]
    if pose_clip and f'{pose_clip}.png' not in strips:
        sys.exit(f'{name}: no current strip for the clip {pose_clip}; run ./forge all {name}')
    for c in ((pose_clip,) if pose_clip else ('sit', 'walk', 'swim', 'fly', 'hop', 'idle')):
        if f'{c}.png' in strips:
            clip = c
            break
    if clip is None and strips:
        clip = strips[0][:-4]
    row2_w = row1.width
    row2 = Image.new('RGB', (row2_w, 300), (30, 30, 34))
    row2.paste(sprites, (0, 0))
    if clip:
        strip = Image.open(f'{anim_dir}/{clip}.png').convert('RGB')
        strip = strip.crop((0, 0, strip.width, strip.height // 2))
        room = row2_w - sprites.width
        strip = strip.resize((room, int(strip.height * room / strip.width)))
        row2.paste(strip, (sprites.width, (300 - strip.height) // 2))

    out = Image.new('RGB', (row1.width, H + 300 + 28), (20, 20, 22))
    ImageDraw.Draw(out).text((8, 8), f'{name}   (row 2: sprites 128 px, clip: {clip or "none"})', fill=(235, 235, 235))
    out.paste(row1, (0, 28))
    out.paste(row2, (0, 28 + H))
    path = os.path.join(out_dir, f'{name}.png')
    out.save(path)
    return path


def main() -> None:
    out_dir, names = sys.argv[1], sys.argv[2:]
    os.makedirs(out_dir, exist_ok=True)
    for n in names:
        name, _, clip = n.partition('=')
        print(card(name, out_dir, clip or None))


if __name__ == '__main__':
    main()
