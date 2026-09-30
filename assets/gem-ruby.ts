import { defineAsset, sdf, rgb } from '../src/index.js';

// Design note: ruby pickup, 0.16 m tall, 0.14 m wide, flat bottom on y = 0, faces +Z.
// One idea: a chunky faceted oval gem that glows. Palette: #e01838 body, #9a1028 lower third.
// Material: one opaque emissive body, flat shading, roughness 0.15.
const COLOR = '#e01838';
const DARK = '#9a1028';
const CENTER = 0.08;
const RX = 0.07, RY = 0.085, RZ = 0.07;
const SIDES = 5;
const OFFSET = 0.062;
const UP_TILT = 38;
const DOWN_TILT = 42;
const SIDE_ROT = 0; // degrees added to the side angles

const plane = (tiltDeg: number, azDeg: number, offset: number) => {
  const t = (tiltDeg * Math.PI) / 180;
  const a = (azDeg * Math.PI) / 180;
  return sdf.halfSpace([Math.cos(t) * Math.sin(a), Math.sin(t), Math.cos(t) * Math.cos(a)], offset);
};

export default defineAsset({
  name: 'gem-ruby',
  detail: 0.0045,
  reference: 'docs/item-mockups/gem-ruby-mock.jpg',
  texture: { size: 512 },
  build(k) {
    let g = sdf.ellipsoid([RX, RY, RZ]);
    for (let i = 0; i < SIDES; i++) {
      const az = SIDE_ROT + (i * 360) / SIDES;
      g = g.intersect(plane(UP_TILT, az, OFFSET));
      g = g.intersect(plane(-DOWN_TILT, az + 180 / SIDES, OFFSET));
    }
    g = g
      .intersect(sdf.halfSpace([0, 1, 0], 0.072))
      .intersect(sdf.halfSpace([0, -1, 0], CENTER))
      .round(0.004)
      .at(0, CENTER, 0);
    const lower = sdf.box([0.4, 0.106, 0.4]).at(0, 0.053 - 0.053, 0);
    g = g.paint(rgb(COLOR)).paintWhere(lower, rgb(DARK), 0.01);
    k.body('gem', g, { color: COLOR, roughness: 0.15, metalness: 0, emissive: COLOR, emissiveIntensity: 0.35, flat: true, detail: 0.0045 });
  },
});
