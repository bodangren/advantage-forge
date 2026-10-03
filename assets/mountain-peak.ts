import { defineAsset, noise, rgb, sdf, profile, type Sdf } from '../src/index.js';

/**
 * Design note - mountain peak (nature/terrain/mountain-peak).
 * Role: distant landmark, readable from far away. Size: 6 m wide, 7 m tall, on y = 0, facing +Z.
 * One idea: a chunky clay cone of stacked layered tiers with a thick soft snow cap dripping down ridges.
 * Shape language: round and heavy; ledges between tiers; a small shoulder peak at +X.
 * Palette: rock #8a8478, #77706a, #9a9387; snow #f4f8fb; moss #4f7a3a.
 * Materials: stone (rough 0.92, bump), snow (rough 0.8), moss (rough 0.9).
 */
const ang = (x: number, z: number): number => Math.atan2(x, z);

// Layered tier: rounded frustum with ridge lumps around it.
function tier(r0: number, r1: number, y0: number, y1: number, seed: number): Sdf {
  const p = profile.polygon(
    [[0, y0], [r0, y0], [r0 * 1.03, (y0 + y1) / 2], [r1, y1], [0, y1]],
    { smooth: false },
  );
  return sdf
    .revolve(p)
    .round(0.12)
    .displace(0.16, (x, y, z) => {
      const a = ang(x, z);
      return Math.sin(a * 5 + seed) * 0.5 + Math.sin(a * 9 + seed * 2) * 0.25 + noise.fbm(x * 1.2, y * 1.2, z * 1.2, 2) * 0.4;
    });
}

const main: Sdf = sdf.smoothUnion(
  0.2,
  tier(3.0, 2.2, 0, 1.9, 1),
  tier(2.3, 1.45, 1.7, 3.6, 2),
  tier(1.6, 0.8, 3.4, 5.4, 3),
  tier(1.0, 0.28, 5.2, 6.85, 4),
);
const shoulder = sdf.smoothUnion(
  0.15,
  tier(1.2, 0.9, 0, 1.7, 5),
  tier(0.95, 0.25, 1.5, 3.4, 6),
).at(2.3, 0, 0.3);
const ridges = sdf.union(
  ...[0, 72, 150, 215, 290].map((d, i) =>
    sdf.capsule([0, 1.5, 2.3 - i * 0.1], [0, 5.2, 0.9], 0.2 + 0.03 * (i % 2)).rotateY(d),
  ),
);
const rock: Sdf = main.smoothUnion(0.25, shoulder).smoothUnion(0.2, ridges.intersect(sdf.box([8, 7, 8]).at(0, 3.5, 0)));
const ground = sdf.box([8, 8, 8]).at(0, 4, 0);
const stone = rock.intersect(ground);

// Snow: thickened skin above a wavy line that drips down the ridges.
const drip = (a: number, ph: number): number =>
  Math.max(0, Math.sin(a * 5 + ph)) * 1.0 + Math.max(0, Math.sin(a * 8 + ph * 2)) * 0.45;
const snowS = stone.round(0.09).displace(0.03, (x, y, z) => noise.fbm(x * 3, y * 3, z * 3, 2, 9));
const capMain = sdf.box([12, 6, 12]).at(0, 5.2 + 3, 0).displace(1, (x, _y, z) => -drip(ang(x, z), 1.2)).round(0.1);
const capShoulder = sdf.box([6, 4, 6]).at(2.3, 2.6 + 2, 0.3).displace(1, (x, _y, z) => -0.5 * drip(ang(x - 2.3, z - 0.3), 0.5)).round(0.1);
const snow: Sdf = snowS.intersect(sdf.union(capMain, capShoulder));

const moss = sdf
  .union(
    sdf.ellipsoid([0.5, 0.18, 0.4]).at(-1.6, 0.18, 2.3),
    sdf.ellipsoid([0.4, 0.15, 0.35]).at(-0.6, 0.15, 2.9),
    sdf.ellipsoid([0.45, 0.16, 0.35]).at(2.3, 0.15, 1.9),
    sdf.ellipsoid([0.35, 0.14, 0.3]).at(-2.4, 0.15, 1.2),
  )
  .intersect(sdf.box([8, 1, 8]).at(0, 0.5, 0));

export default defineAsset({
  name: 'mountain-peak',
  description: 'Chunky chibi mountain peak: layered warm-grey rock tiers, thick snow cap, small shoulder peak, moss at the base; 6 m wide, 7 m tall.',
  detail: 0.05,
  texture: { size: 1024 },
  build(k) {
    const c1 = rgb('#8a8478');
    const c2 = rgb('#77706a');
    const c3 = rgb('#9a9387');
    const painted = stone.paintFn((x, y, z, base) => {
      const band = Math.floor(y / 0.9 + noise.fbm(x, y, z, 2) * 0.4) % 3;
      return band === 0 ? c1 : band === 1 ? c2 : c3;
    });
    k.body('stone', painted, {
      color: c1, roughness: 0.92, metalness: 0, detail: 0.05, maxTriangles: 25000, textureDensity: 2,
      bump: (x, y, z) => 0.01 * noise.fbm(x * 5, y * 5, z * 5, 3, 17),
    });
    k.body('snow', snow.paint(rgb('#f4f8fb')), {
      color: rgb('#f4f8fb'), roughness: 0.8, metalness: 0, detail: 0.05, maxTriangles: 12000,
    });
    k.body('moss', moss.paint(rgb('#4f7a3a')), { color: rgb('#4f7a3a'), roughness: 0.9, detail: 0.03 });
  },
});
