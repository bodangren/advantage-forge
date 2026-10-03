import { defineAsset, mixRgb, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note - dome-pavilion (palace pavilion, background landmark, no rig).
 * Size: about 4 m wide (dome 3.6 m), 6 m tall, on y = 0, door toward +Z.
 * One idea: a chunky cream clay cube wearing a big gold-ribbed onion dome.
 * Shape language: round and soft, one square base. Palette: cream #efe6d2, mortar #c9bda3,
 *   teal #2f8f8a, gold #d9a93a, door #5a3a28.
 * Materials: stone base, teal trim, gold trim, cream dome with gold ribs, door wood.
 */
const C = {
  cream: rgb('#efe6d2'), mortar: rgb('#c9bda3'), teal: rgb('#2f8f8a'), gold: rgb('#d9a93a'), door: rgb('#5a3a28'),
};
const W = 3.4;
const H = 2.4;
const HALF = W / 2;
const DRUM_TOP = 2.8;

const arch = (halfW: number, bot: number, spring: number) => {
  const pts: [number, number][] = [[-halfW, bot], [halfW, bot]];
  for (let i = 0; i <= 10; i++) {
    const a = (Math.PI * i) / 10;
    pts.push([halfW * Math.cos(a), spring + halfW * Math.sin(a)]);
  }
  return profile.polygon(pts);
};
const cut = (halfW: number, bot: number, spring: number, x: number) =>
  sdf.extrude(arch(halfW, bot, spring), 0.6, 0.01).at(x, 0, HALF);
const frame = (halfW: number, bot: number, spring: number, x: number, t: number) =>
  sdf.extrude(arch(halfW + t, bot - t, spring), 0.12, 0.02).at(x, 0, HALF)
    .subtract(sdf.extrude(arch(halfW, bot, spring), 0.7).at(x, 0, HALF));

export default defineAsset({
  name: 'dome-pavilion',
  description: 'Chibi palace pavilion: cream stone cube with arched door and windows, teal and gold band, gold-ribbed onion dome, finial and pennant.',
  detail: 0.012,
  texture: { size: 1024 },

  build(k) {
    const body = sdf.box([W, H, W], 0.08).at(0, H / 2, 0)
      .subtract(cut(0.5, 0, 1.2, 0), cut(0.32, 0.9, 1.35, -1.05), cut(0.32, 0.9, 1.35, 1.05));
    k.body('base', body, { color: C.cream, roughness: 0.9, detail: 0.012, maxTriangles: 9000 });
    k.body('door', sdf.extrude(arch(0.48, 0, 1.2), 0.1, 0.01).at(0, 0, HALF - 0.28), { color: C.door, roughness: 0.8, detail: 0.01, maxTriangles: 800 });

    const bands = sdf.union(
      sdf.box([W + 0.1, 0.16, W + 0.1], 0.05).at(0, 1.95, 0).paint(C.teal),
      sdf.box([W + 0.1, 0.1, W + 0.1], 0.04).at(0, 2.13, 0).paint(C.gold),
      sdf.box([W + 0.2, 0.2, W + 0.2], 0.06).at(0, 2.42, 0).paint(C.cream),
    );
    k.body('bands', bands, { color: C.teal, roughness: 0.6, detail: 0.012, maxTriangles: 3000 });

    k.body('frames', sdf.union(frame(0.5, 0, 1.2, 0, 0.1), frame(0.32, 0.9, 1.35, -1.05, 0.08), frame(0.32, 0.9, 1.35, 1.05, 0.08)),
      { color: C.teal, roughness: 0.55, detail: 0.01, maxTriangles: 4000 });

    const cols = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = sx * (HALF + 0.02), z = sz * (HALF + 0.02);
      cols.push(sdf.cylinder(0.14, 2.2, 0.03).at(x, 1.2, z), sdf.sphere(0.2).at(x, 0.15, z), sdf.sphere(0.2).at(x, 2.3, z).paint(C.gold));
    }
    k.body('columns', sdf.smoothUnion(0.03, ...cols), { color: C.cream, roughness: 0.8, detail: 0.01, maxTriangles: 4000 });

    k.body('drum', sdf.cylinder(1.5, 0.5, 0.06).at(0, DRUM_TOP - 0.2, 0).paint(C.cream), { color: C.cream, roughness: 0.8, detail: 0.012, maxTriangles: 1500 });
    k.body('drumBand', sdf.torus(1.5, 0.07).at(0, DRUM_TOP - 0.1, 0), { color: C.gold, roughness: 0.4, metalness: 0.6, detail: 0.01, maxTriangles: 1500 });

    const pts: [number, number][] = [[0, 0], [1.5, 0], [1.8, 0.45], [1.75, 0.9], [1.3, 1.4], [0.7, 1.8], [0.25, 2.15], [0.1, 2.4], [0, 2.5]];
    const dome = sdf.revolve(profile.polygon(pts, { smooth: true })).at(0, DRUM_TOP - 0.05, 0)
      .paintFn((x, y, z, base) => {
        const rib = Math.abs(Math.sin(Math.atan2(x, z) * 6)) > 0.93 ? 1 : 0;
        const ring = Math.abs(y - (DRUM_TOP + 0.5)) < 0.05 ? 1 : 0;
        return mixRgb(base, C.gold, Math.max(rib, ring));
      });
    k.body('dome', dome, { color: C.cream, roughness: 0.5, metalness: 0.15, detail: 0.012, maxTriangles: 9000 });

    const top = DRUM_TOP + 2.4;
    k.body('finial', sdf.smoothUnion(0.03, sdf.sphere(0.12).at(0, top, 0), sdf.cone([0, top, 0], [0, 6.0, 0], 0.07, 0.015), sdf.sphere(0.06).at(0, 5.55, 0)),
      { color: C.gold, roughness: 0.35, metalness: 0.7, detail: 0.008, maxTriangles: 1500 });
    k.body('pennant', sdf.extrude(profile.polygon([[0, 0], [0.5, -0.1], [0, -0.22]]), 0.04, 0.01).at(0.02, 5.98, 0), { color: C.teal, roughness: 0.85, detail: 0.008, maxTriangles: 600 });
  },
});
