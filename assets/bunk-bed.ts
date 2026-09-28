import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Bunk bed (props/furniture/bunk-bed), matched to docs/item-mockups/bunk-bed-mock.jpg.
 * Size: 1.0 m wide, 2.0 m long (along Z), 1.72 m tall, on y = 0. One idea: two honey-oak bunks on
 * four corner posts, cream mattresses, red blankets, white pillows, a ladder at the foot, and a
 * guard rail on the top bunk. Palette: oak #c08a50 / #9a6a38, mattress #efe6d2, blanket #b8402a /
 * #8a2a1e, pillow #f7f3ea.
 */

const OAK = rgb('#c08a50');
const OAK_DARK = rgb('#9a6a38');
const W = 1.0;
const L = 2.0;
const DECKS = [0.3, 1.2];

const wood = (x: number, y: number, z: number) => mixRgb(OAK, OAK_DARK, 0.15 + 0.35 * (0.5 + 0.5 * noise.fbm(x * 5, y * 25, z * 5, 3)));

export default defineAsset({
  name: 'bunk-bed',
  description: 'A honey-oak bunk bed with cream mattresses, red blankets, white pillows, a ladder, and a guard rail.',
  detail: 0.008,
  reference: 'docs/item-mockups/bunk-bed-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const frame = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) frame.push(sdf.box([0.08, 1.72, 0.08], 0.015).at(sx * (W / 2 - 0.04), 0.86, sz * (L / 2 - 0.04)));
    for (const y of DECKS) {
      for (const sx of [-1, 1]) frame.push(sdf.box([0.05, 0.1, L - 0.08], 0.01).at(sx * (W / 2 - 0.04), y, 0));
      for (const sz of [-1, 1]) frame.push(sdf.box([W - 0.08, 0.1, 0.05], 0.01).at(0, y, sz * (L / 2 - 0.04)));
    }
    // Head boards at -Z, a guard rail on the top bunk (+X side), ladder at the foot on +X.
    frame.push(sdf.box([W - 0.08, 0.3, 0.04], 0.012).at(0, DECKS[0]! + 0.25, -L / 2 + 0.04));
    frame.push(sdf.box([W - 0.08, 0.3, 0.04], 0.012).at(0, DECKS[1]! + 0.25, -L / 2 + 0.04));
    frame.push(sdf.box([0.04, 0.05, L * 0.6], 0.01).at(W / 2 - 0.04, DECKS[1]! + 0.3, -0.3));
    for (const z of [L / 2 - 0.14, L / 2 - 0.44]) frame.push(sdf.box([0.05, 1.4, 0.05], 0.01).at(W / 2 + 0.05, 0.7, z));
    for (let i = 0; i < 5; i++) frame.push(sdf.cylinder(0.018, 0.34, 0.004).rotateX(90).at(W / 2 + 0.05, 0.25 + i * 0.27, L / 2 - 0.29));
    k.body('frame', sdf.union(...frame).paintFn(wood), { color: '#c08a50', roughness: 0.65, metalness: 0 });

    const mattresses = DECKS.map((y) => sdf.box([W - 0.12, 0.12, L - 0.12], 0.04).at(0, y + 0.09, 0));
    k.body('mattress', sdf.union(...mattresses), { color: '#efe6d2', roughness: 0.85, metalness: 0 });
    const blankets = DECKS.map((y) => sdf.box([W - 0.08, 0.13, L * 0.62], 0.045).at(0, y + 0.1, L * 0.17));
    k.body(
      'blankets',
      sdf.union(...blankets).paintFn((x, y, z) => mixRgb(rgb('#b8402a'), rgb('#8a2a1e'), Math.abs(Math.sin(x * 18)) > 0.9 ? 0.6 : 0.1 + 0.2 * (0.5 + 0.5 * noise.fbm(x * 10, y * 10, z * 10, 2)))),
      { color: '#b8402a', roughness: 0.85, metalness: 0 },
    );
    const pillows = DECKS.map((y) => sdf.box([W * 0.55, 0.1, 0.3], 0.045).at(0, y + 0.2, -L / 2 + 0.26));
    k.body('pillows', sdf.union(...pillows), { color: '#f7f3ea', roughness: 0.85, metalness: 0 });
  },
});
