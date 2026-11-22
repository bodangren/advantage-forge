#!/usr/bin/env bash
# Faces r2 likeness compare sheets (Step 4): one sheet per character.
#   bench/sonnet/sprouts/faces-r2.sh
# Each sheet is reference | 3D render sheet | Muse output, side by side,
# with the character name in the label bar. Built with sharp, no paid call.
set -eu
cd "$(dirname "$0")/../../.."
mkdir -p out/chibi-sprouts/faces-r2/sheets
node -e "
const sharp = require('sharp');
const H = 900;
const names = ['lily', 'mom', 'tom', 'grandma', 'grandpa'];
const cap = (n) => n[0].toUpperCase() + n.slice(1);
(async () => {
  for (const n of names) {
    const ref = await sharp('docs/sprout-mockups/' + n + '.jpg').resize({ height: H }).toBuffer();
    const sheet = await sharp('out/chibi-sprouts/faces-r2/muse/elements/' + n + '-ref-render.png').resize({ height: H }).toBuffer();
    const muse = await sharp('out/chibi-sprouts/faces-r2/muse/faces-r2-' + n + '-m1-color.png').resize({ height: H }).toBuffer();
    const metas = await Promise.all([sharp(ref).metadata(), sharp(sheet).metadata(), sharp(muse).metadata()]);
    const gap = 8;
    const bar = 72;
    const W = metas[0].width + metas[1].width + metas[2].width + gap * 4;
    const label = Buffer.from('<svg width=\"' + W + '\" height=\"' + bar + '\"><rect width=\"100%\" height=\"100%\" fill=\"#1c1c22\"/><text x=\"24\" y=\"47\" font-family=\"sans-serif\" font-size=\"36\" fill=\"#ffffff\">' + cap(n) + ' — reference | 3D render sheet | Muse output</text></svg>');
    const left = [gap, gap + metas[0].width + gap, gap + metas[0].width + gap + metas[1].width + gap];
    await sharp({ create: { width: W, height: bar + H + gap * 2, channels: 3, background: '#2a2a30' } })
      .composite([
        { input: label, top: 0, left: 0 },
        { input: ref, top: bar + gap, left: left[0] },
        { input: sheet, top: bar + gap, left: left[1] },
        { input: muse, top: bar + gap, left: left[2] },
      ])
      .png()
      .toFile('out/chibi-sprouts/faces-r2/sheets/' + n + '-compare.png');
    console.log(n + ' ok');
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
"
ls out/chibi-sprouts/faces-r2/sheets/
