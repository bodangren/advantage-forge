import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note - balloon-basket (vehicles/air/balloon-basket).
 * Role: hot-air balloon vehicle prop; reads at 128 px as a red/cream striped ball over a small basket.
 * Size: about 5.4 m tall, basket 1.0 x 0.8 x 0.9 m on y = 0, envelope skirt bottom at y 2.0, faces +Z.
 * One idea: a huge striped envelope (8 gores, clay-scalloped) on a tiny chunky wicker basket.
 * Shape language: round envelope, square basket, thick cream ropes.
 * Palette: red #c8302a, cream #efe6d2, wicker #b07a48, leather walnut #6b4226, brass, flame orange.
 * Materials: envelope cloth, skirt band, wicker, leather rim, rope, sandbags, brass, flame.
 * Detail: gore paint + scallop, weave bump on basket, four ropes, two sandbags, glowing burner.
 */
const RED = rgb('#c8302a');
const RED_DARK = rgb('#a82620');
const CREAM = rgb('#efe6d2');
const CREAM_DARK = rgb('#d9cdb0');

const SKIRT_Y = 2.0;
const BW = 1.0, BH = 0.8, BD = 0.9;

export default defineAsset({
  name: 'balloon-basket',
  description: 'A hot-air balloon with a red and cream gored envelope, wicker basket, ropes, brass burner, and sandbags.',
  reference: 'docs/vehicle-mockups/balloon-basket-mock.jpg',
  detail: 0.008,
  texture: { size: 1024 },

  build(k) {
    // Envelope: sphere r 1.4 (top at y 5.4) blended into a cone from r 1.2 down to r 0.5 at the skirt.
    const ball = sdf.sphere(1.4).at(0, 4.0, 0);
    const cone = sdf.cone([0, SKIRT_Y, 0], [0, 3.6, 0], 0.5, 1.2);
    const theta = (x: number, z: number) => Math.atan2(x, z);
    const envelope = ball
      .smoothUnion(0.3, cone)
      .displace(0.03, (x, _y, z) => Math.cos(8 * theta(x, z)) * Math.min(1, Math.hypot(x, z) / 0.45))
      .paintFn((x, y, z) => {
        const a = theta(x, z);
        const sector = ((Math.floor(((a + Math.PI) / (2 * Math.PI)) * 8) % 8) + 8) % 8;
        const red = sector % 2 === 0;
        const n = 0.5 + 0.5 * noise.fbm(x * 3, y * 3, z * 3, 2);
        let c = red ? mixRgb(RED, RED_DARK, 0.35 * n) : mixRgb(CREAM, CREAM_DARK, 0.35 * n);
        // dark seam line between gores
        const f = ((a + Math.PI) / (2 * Math.PI)) * 8;
        const d = Math.abs(f - Math.round(f));
        if (d < 0.05) c = mixRgb(c, RED_DARK, 0.7);
        return c;
      });
    k.body('envelope', envelope, {
      color: '#c8302a', roughness: 0.7, metalness: 0, detail: 0.01,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 14, y * 14, z * 14, 2), maxTriangles: 9000,
    });

    // Skirt band: leather ring where the ropes attach.
    const skirt = sdf.torus(0.5, 0.11).at(0, SKIRT_Y + 0.03, 0).scale([1, 1, 1]);
    k.body('skirt', skirt.paint(rgb('#8a5a35')), {
      color: '#8a5a35', roughness: 0.8, metalness: 0, detail: 0.006, maxTriangles: 2500,
    });

    // Wicker basket: hollow rounded box with weave in bump.
    const outer = sdf.box([BW, BH, BD], 0.07).at(0, BH / 2, 0);
    const inner = sdf.box([BW - 0.16, BH, BD - 0.16], 0.04).at(0, BH / 2 + 0.1, 0);
    const basket = sdf.subtract(outer, inner).paintFn((x, y, z) => {
      const n = noise.fbm(x * 10, y * 10, z * 10, 2);
      return mixRgb(rgb('#b07a48'), rgb('#8a5a35'), 0.3 * (0.5 + 0.5 * n));
    });
    const weave = (x: number, y: number, z: number) => {
      const u = Math.abs(x) / (BW / 2) > Math.abs(z) / (BD / 2) ? z : x;
      const cell = 0.09;
      const i = Math.floor(u / cell), j = Math.floor(y / cell);
      const fu = u / cell - i, fy = y / cell - j;
      const horiz = (i + j) % 2 === 0;
      const prof = horiz ? Math.sin(Math.PI * fy) : Math.sin(Math.PI * fu);
      return 0.012 * prof;
    };
    k.body('basket', basket, {
      color: '#b07a48', roughness: 0.8, metalness: 0, detail: 0.008, bump: weave, maxTriangles: 7000,
    });

    // Leather rim band, darker walnut.
    const rimOuter = sdf.box([BW + 0.08, 0.14, BD + 0.08], 0.06).at(0, BH - 0.03, 0);
    const rimInner = sdf.box([BW - 0.12, 0.3, BD - 0.12], 0.04).at(0, BH - 0.03, 0);
    k.body('rim', sdf.subtract(rimOuter, rimInner).paint(rgb('#6b4226')), {
      color: '#6b4226', roughness: 0.75, metalness: 0, detail: 0.006,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 30, y * 30, z * 30, 2), maxTriangles: 3000,
    });

    // Four ropes from basket corners to the skirt band.
    const ropes: ReturnType<typeof sdf.capsule>[] = [];
    for (const sx of [1, -1]) for (const sz of [1, -1]) {
      ropes.push(sdf.capsule([sx * 0.44, BH - 0.02, sz * 0.4], [sx * 0.36, SKIRT_Y, sz * 0.36], 0.03));
    }
    k.body('ropes', sdf.union(...ropes).paint(rgb('#e8d9a8')), {
      color: '#e8d9a8', roughness: 0.85, metalness: 0, detail: 0.005, maxTriangles: 4000,
      bump: (x, y, z) => 0.004 * Math.sin((y + 0.2 * Math.atan2(x, z)) * 90),
    });

    // Two sandbags hanging from the rim, front-left and front-right.
    const bags = [1, -1].map((s) =>
      sdf.ellipsoid([0.13, 0.17, 0.12]).at(s * 0.4, 0.52, 0.55)
        .smoothUnion(0.05, sdf.sphere(0.06).at(s * 0.4, 0.72, 0.53)),
    );
    const bagCord = [1, -1].map((s) => sdf.capsule([s * 0.4, 0.78, 0.46], [s * 0.4, 0.64, 0.54], 0.025));
    k.body('sandbags', sdf.union(...bags, ...bagCord).paint(rgb('#efe0a0')), {
      color: '#efe0a0', roughness: 0.9, metalness: 0, detail: 0.006,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 20, y * 20, z * 20, 2), maxTriangles: 3000,
    });

    // Brass burner on a post between the ropes.
    const burner = sdf.union(
      sdf.cylinder(0.11, 0.16, 0.03).at(0, 1.4, 0),
      sdf.cylinder(0.05, 0.1, 0.01).at(0, 1.5, 0),
      sdf.cylinder(0.04, 0.66).at(0, 1.02, 0),
      sdf.torus(0.13, 0.025).at(0, 1.4, 0),
    );
    k.body('burner', burner.paint(rgb('#c9a24a')), {
      color: '#c9a24a', roughness: 0.35, metalness: 0.9, detail: 0.004, maxTriangles: 3500,
    });

    // Flame: orange teardrop, full brightness, emissive 0.5.
    const flame = sdf.chain([[0, 1.55, 0, 0.075], [0, 1.72, 0, 0.06], [0, 1.9, 0, 0.02]], 0.05);
    k.body('flame', flame.paint(rgb('#ff8a1e')), {
      color: '#ff8a1e', emissive: '#ff8a1e', emissiveIntensity: 0.5, roughness: 0.5, metalness: 0,
      detail: 0.004, maxTriangles: 1500,
    });
  },
});
