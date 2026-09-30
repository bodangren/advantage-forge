import { defineAsset, sdf, rgb } from '../src/index.js';

// Design note: sapphire pickup, 0.16 m tall, 0.14 m wide, flat bottom on y = 0, faces +Z.
// One idea: a chunky faceted oval gem that glows. Palette: #2f7ae8 body, #1c4fb0 lower third.
// Material: one opaque emissive body, flat shading, roughness 0.15.
const COLOR = '#2f7ae8';
const DARK = '#1c4fb0';
const CENTER = 0.085;

const plane = (tiltDeg: number, azDeg: number, offset: number) => {
  const t = (tiltDeg * Math.PI) / 180;
  const a = (azDeg * Math.PI) / 180;
  return sdf.halfSpace([Math.cos(t) * Math.sin(a), Math.sin(t), Math.cos(t) * Math.cos(a)], offset);
};

export default defineAsset({
  name: 'gem-sapphire',
  detail: 0.0045,
  reference: 'docs/item-mockups/gem-sapphire-mock.jpg',
  texture: { size: 512 },
  build(k) {
    let g = sdf.sphere(0.085);
    for (let i = 0; i < 6; i++) g = g.intersect(plane(20, i * 60 + 30, 0.062));
    for (let i = 0; i < 5; i++) g = g.intersect(plane(-55, i * 72, 0.066));
    g = g
      .intersect(sdf.halfSpace([0, 1, 0], 0.065))
      .intersect(sdf.halfSpace([0, -1, 0], 0.075))
      .round(0.002)
      .at(0, CENTER, 0);
    const lower = sdf.box([0.4, 0.106, 0.4]).at(0, 0.053 - 0.053, 0);
    g = g.paint(rgb(COLOR)).paintWhere(lower, rgb(DARK), 0.01);
    k.body('gem', g, { color: COLOR, roughness: 0.15, metalness: 0, emissive: COLOR, emissiveIntensity: 0.35, flat: true, detail: 0.0045 });
  },
});
