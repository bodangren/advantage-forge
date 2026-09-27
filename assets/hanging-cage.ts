import { defineAsset, sdf, profile, noise, rgb, mixRgb } from '../src/index.js';

/**
 * Design note — small iron prison hanging-cage (dungeon/prop/hanging-cage).
 *
 * Role: hanging dungeon dressing; reads at 128 px as a dark birdcage
 *   silhouette with a gap of ajar door and a chain stub rising up.
 * Size: cage 0.5 m tall, 0.4 m wide; bottom at y = 1.0, chain to y = 1.98
 *   (inside the 2 m bound). Faces +Z. No rig, no animation.
 * The one idea: a rounded birdcage prison — fat belly bars pinched to a
 *   pointed crown, one little door swung open, chain vanishing upward.
 * Shape language: round dominant (bulged bars, ring bands, link chain),
 *   square secondary (door rails, bottom plate) for a sturdy read.
 * Palette: dark worn iron #3a4048 (dominant), rust #8a5a35 patches
 *   (secondary, heavier low down), pale worn edge #7a8ba0 (small),
 *   interior shadow #14171d (dark). No emissive: nothing burns here.
 * Materials: worn iron (roughness 0.55, metalness 0.8); interior
 *   (roughness 0.95, metalness 0). Rust + speckle in paintFn, tiny bump.
 * Detail: primary bars + bands + cap + ring + chain; secondary ajar door
 *   + rivets; tertiary rust paint. Focal point: open door gap.
 * Rig/animation: none (static hanging prop).
 */

const IRON = rgb('#3a4048');
const IRON_LIGHT = rgb('#7a8ba0');
const RUST = rgb('#8a5a35');
const RUST_DARK = rgb('#5a3a22');
const INTERIOR = '#14171d';

const BOT = 1.0; // cage bottom
const BAR_BOT = 1.05;
const BAR_TOP = 1.48;
const BELLY_R = 0.2;
const TOP_R = 0.075;

// Rust paint shared by all ironwork: patchy rust, heavier toward the base,
// pale worn edges catching light on top.
function rustPaint(x: number, y: number, z: number) {
  const patch = 0.5 + 0.5 * noise.fbm(x * 9, y * 9, z * 9, 3);
  const speckle = 0.5 + 0.5 * noise.fbm(x * 45, y * 45, z * 45, 2);
  const low = Math.min(1, Math.max(0, (1.35 - y) / 0.45)); // rustier low
  let c = mixRgb(IRON, IRON_LIGHT, 0.25 * speckle);
  c = mixRgb(c, RUST, Math.min(1, 0.25 + 0.75 * patch) * (0.25 + 0.55 * low));
  c = mixRgb(c, RUST_DARK, 0.4 * Math.max(0, speckle - 0.6));
  return c;
}
const ironBump = (x: number, y: number, z: number) =>
  0.0012 * noise.fbm(x * 40, y * 40, z * 40, 2);

// Bar centerline radius at height y: pinched foot, fat belly, tight crown.
// Control radii the bands below are matched to.
function barR(y: number) {
  const stops: [number, number][] = [
    [1.05, 0.175],
    [1.16, 0.193],
    [1.28, 0.2],
    [1.39, 0.165],
    [1.48, 0.075],
  ];
  if (y <= stops[0][0]) return stops[0][1];
  for (let i = 0; i < stops.length - 1; i++) {
    const [y0, r0] = stops[i];
    const [y1, r1] = stops[i + 1];
    if (y <= y1) {
      const t = (y - y0) / (y1 - y0);
      const s = t * t * (3 - 2 * t);
      return r0 + (r1 - r0) * s;
    }
  }
  return stops[stops.length - 1][1];
}

export default defineAsset({
  name: 'hanging-cage',
  description:
    'Small iron prison cage hanging from a chain: curved bars, ajar door, pointed crown ring.',
  detail: 0.005,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------ ironwork
    // Seven curved vertical bars (front gap left for the door keeps an
    // 8-around rhythm). Each is a smooth chain: foot -> belly -> crown.
    const bars = [];
    for (let i = 0; i < 8; i++) {
      if (i === 2) continue; // door gap at front (+Z)
      const a = (i / 8) * Math.PI * 2 + Math.PI / 2;
      const dir = [Math.cos(a), Math.sin(a)] as const;
      const pts: [number, number, number, number][] = [];
      for (let s = 0; s <= 4; s++) {
        const y = BAR_BOT + ((BAR_TOP - BAR_BOT) * s) / 4;
        const r = barR(y);
        pts.push([dir[0] * r, y, dir[1] * r, 0.013]);
      }
      bars.push(sdf.chain(pts, 0.02));
    }

    // Horizontal bands: bottom rim, belly band, crown rim (matched to barR).
    const bands = sdf.union(
      sdf.torus(0.175, 0.02).at(0, BAR_BOT, 0),
      sdf.torus(BELLY_R, 0.013).at(0, 1.28, 0),
      sdf.torus(TOP_R + 0.008, 0.016).at(0, BAR_TOP, 0),
    );

    // Bottom plate: shallow chunky disc the cage hangs from.
    const plate = sdf.smoothUnion(
      0.012,
      sdf.cylinder(0.19, 0.05, 0.015).at(0, BOT + 0.025, 0),
      sdf.sphere(0.035).at(0, BOT + 0.005, 0),
    );

    // Pointed crown: cone spike over the crown rim + hanging ring above it.
    // Wide base swallows the bar tips so they never poke through.
    const crown = sdf.smoothUnion(
      0.012,
      sdf.cone([0, BAR_TOP - 0.03, 0], [0, BAR_TOP + 0.1, 0], 0.095, 0.012),
      sdf.sphere(0.02).at(0, BAR_TOP + 0.1, 0),
    );
    const ring = sdf.torus(0.032, 0.01).rotateX(90).at(0, BAR_TOP + 0.16, 0);

    // Chain stub: five interlinked vertical links rising out of frame.
    // Torus starts in XZ (flat); rotateX makes a vertical XY link, rotateZ
    // a vertical ZY link; spacing is tighter than link height so they link.
    const links = [];
    for (let i = 0; i < 5; i++) {
      const y = 1.7 + i * 0.052;
      const link = sdf.torus(0.028, 0.01);
      links.push((i % 2 === 0 ? link.rotateX(90) : link.rotateZ(90)).at(0, y, 0));
    }

    // Little door, hinged at the bar on the +X side of the front gap and
    // swung 35 deg outward. Built in a hinge-local frame (hinge at origin,
    // leaf along -X at z = 0), rotated, then placed at the hinge line.
    const hinge: [number, number, number] = [0.134, 0, 0.134];
    const dx = [-0.125, -0.0725, -0.02];
    const doorLeaf = sdf.union(
      ...dx.map((x) => sdf.capsule([x, 1.09, 0], [x, 1.24, 0], 0.01)),
      sdf.box([0.15, 0.024, 0.024], 0.008).at(-0.0725, 1.1, 0),
      sdf.box([0.15, 0.024, 0.024], 0.008).at(-0.0725, 1.23, 0),
      sdf.sphere(0.014).at(-0.135, 1.165, 0.012), // knob
    );
    const door = doorLeaf.rotateY(45).at(...hinge);

    // Rivets studding the belly band, 8 around.
    const rivets = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      rivets.push(sdf.sphere(0.012).at(Math.cos(a) * BELLY_R, 1.28, Math.sin(a) * BELLY_R));
    }

    const iron = sdf
      .union(...bars, bands, plate, crown, ring, ...links, door, ...rivets)
      .paintFn(rustPaint);
    k.body('iron', iron, {
      color: '#3a4048',
      roughness: 0.55,
      metalness: 0.8,
      detail: 0.005,
      paintWeight: 2,
      bump: ironBump,
      maxTriangles: 3000,
    });

    // -------------------------------------------------------- dark interior
    // Solid shadow core ~0.03 inside the bars so gaps read as darkness.
    const coreProfile = profile.polygon(
      [
        [0.001, 1.06],
        [0.14, 1.06],
        [0.163, 1.16],
        [0.17, 1.28],
        [0.135, 1.39],
        [0.055, 1.46],
        [0.001, 1.47],
      ],
      { smooth: true, samples: 12 },
    );
    const core = sdf.revolve(coreProfile);
    k.body('shadow', core, {
      color: INTERIOR,
      roughness: 0.95,
      metalness: 0,
      detail: 0.008,
      maxTriangles: 400,
    });
  },
});
