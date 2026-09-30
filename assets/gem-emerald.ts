import { defineAsset, sdf, rgb } from '../src/index.js';

// Design note: emerald (step cut) pickup, 0.16 m tall, 0.14 m wide, flat bottom on y = 0, faces +Z.
// One idea: a chunky faceted oval gem that glows. Palette: #22c860 body, #147a3a lower third.
// Material: one opaque emissive body, flat shading, roughness 0.15.
const COLOR = '#22c860';
const DARK = '#147a3a';
const CENTER = 0.088;
const RX = 0.11, RY = 0.12, RZ = 0.11;
const SIDES = 4;
const OFFSET = 0.074;
const UP_TILT = 42;
const DOWN_TILT = 45;
const SIDE_ROT = 0; // degrees added to the side angles

const plane = (tiltDeg: number, azDeg: number, offset: number) => {
  const t = (tiltDeg * Math.PI) / 180;
  const a = (azDeg * Math.PI) / 180;
  return sdf.halfSpace([Math.cos(t) * Math.sin(a), Math.sin(t), Math.cos(t) * Math.cos(a)], offset);
};

export default defineAsset({
  name: 'gem-emerald',
  detail: 0.0045,
  reference: 'docs/item-mockups/gem-emerald-mock.jpg',
  texture: { size: 512 },
  build(k) {
    let g = sdf.ellipsoid([RX, RY, RZ]);
    for (let i = 0; i < SIDES; i++) {
      const az = SIDE_ROT + (i * 360) / SIDES;
      g = g.intersect(plane(UP_TILT, az, OFFSET));
      g = g.intersect(plane(-DOWN_TILT, az, OFFSET));
    }
    for (let i = 0; i < 4; i++) {
      g = g.intersect(plane(0, i * 90, i % 2 ? 0.05 : 0.058));
      g = g.intersect(plane(0, 45 + i * 90, 0.068));
    }
    g = g
      .intersect(sdf.halfSpace([0, 1, 0], 0.082))
      .intersect(sdf.halfSpace([0, -1, 0], CENTER))
      .round(0.004)
      .at(0, CENTER, 0);
    const lower = sdf.box([0.4, 0.116, 0.4]).at(0, 0.058 - 0.058, 0);
    g = g.paint(rgb(COLOR)).paintWhere(lower, rgb(DARK), 0.01);
    k.body('gem', g, { color: COLOR, roughness: 0.15, metalness: 0, emissive: COLOR, emissiveIntensity: 0.35, flat: true, detail: 0.0045 });
  },
});
