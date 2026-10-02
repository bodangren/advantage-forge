import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — bear trap (props/world/bear-trap).
 *
 * Role: forest hazard prop in the Forest Quest clearing; must read at 128 px as
 *   an open iron trap with a mouth of pale teeth waiting on the grass.
 * Size: 0.5 m wide ring lying flat on y = 0 (teeth tips at y = 0.10); front
 *   faces +Z; a short chain trails to a wooden stake at the left-back.
 * One idea: an open bear trap lying flat, two serrated iron jaws hinged at the
 *   front and back rims with big cream teeth pointing up, a round pressure
 *   plate in the middle, and a chain with a stake — the "open mouth" of the
 *   mock, flattened into a ground prop.
 * Shape language: round dominant (ring, plate, links), triangular secondary
 *   (the teeth).
 * Palette: worn iron #3d4047 with rust #6e4830 patches (dominant); steel
 *   plate #6a6e78 with dark ring (secondary); ivory teeth #efe4c9 and cut-wood
 *   stake #8a5a35 (accents).
 * Materials: one iron body (ring, jaws, hinges, chain; roughness 0.55,
 *   metalness 0.75), one ivory teeth body, one steel plate body, one wood
 *   stake body.
 * Detail: primary ring + two jaw plates + plate; secondary teeth, hinges,
 *   chain links, stake; tertiary rust patches and iron wear.
 * Focal point: the ring of ivory teeth around the steel pressure plate.
 * Rig/animation: none (static prop).
 */

const IRON = rgb('#3d4047');
const IRON_DARK = rgb('#2e3138');
const RUST = rgb('#6e4830');
const STEEL = rgb('#7b8089');
const STEEL_DARK = rgb('#3d4047');
const IVORY = rgb('#efe4c9');
const IVORY_TIP = rgb('#f7efdd');
const WOOD = rgb('#8a5a35');
const WOOD_DARK = rgb('#5f3d22');

const R = 0.2; // jaw arc radius (matches the ring tube center)
const TOOTH_ANGLES = [200, 220, 240, 260, 280, 300, 320, 340]; // degrees, jaw arc
const JAW_T = 0.02; // jaw plate thickness
const JAW_Y = 0.03; // jaw plate mid height

/** Half-disc jaw plate with a sawtooth arc, in profile space (+Y maps to +Z). */
function jawProfile(): [number, number][] {
  const pts: [number, number][] = [[-R, 0], [R, 0]];
  // Walk the arc from 180 deg to 360 deg (bulging toward -Y) with triangular teeth.
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const a = Math.PI + (Math.PI * i) / steps;
    // Sawtooth radius: smooth valleys, sharp tips near each tooth angle.
    let r = R;
    for (const ta of TOOTH_ANGLES) {
      const d = Math.abs(a - (ta * Math.PI) / 180);
      const w = (9 * Math.PI) / 180; // tooth half-width in radians
      if (d < w) r = R + 0.028 * (1 - d / w);
    }
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return pts;
}

export default defineAsset({
  name: 'bear-trap',
  description: 'Open iron bear trap lying flat: two serrated jaws with ivory teeth, a round pressure plate, and a chain to a wooden stake.',
  detail: 0.007,
  reference: 'docs/item-mockups/bear-trap-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- iron: ring, jaws, hinges, chain
    const ring = sdf.torus(0.21, 0.033).scale([1, 0.62, 1]).at(0, 0.021, 0);

    const jawSolid = sdf.extrude(profile.polygon(jawProfile()), JAW_T, 0.006).rotateX(90).at(0, JAW_Y, 0);
    const jawBack = jawSolid; // arc toward -Z
    const jawFront = jawSolid.mirror('z', 0); // arc toward +Z

    const hinge = sdf.cylinder(0.021, 0.3, 0.008).rotateZ(90).at(0, 0.026, -0.205);
    const hingeFront = hinge.mirror('z', 0);

    // Chain: flattened alternating torus links trailing toward the stake.
    const chainDir: [number, number] = [0.7, -0.55]; // normalized-ish in XZ
    const chainStart: [number, number] = [0.24, 0.055];
    const links = sdf.union(
      ...Array.from({ length: 7 }, (_, i) => {
        const t = i * 0.026;
        const x = chainStart[0] + chainDir[0] * t;
        const z = chainStart[1] + chainDir[1] * t;
        const link = sdf
          .torus(0.019, 0.0068)
          .scale([1, 0.62, 1])
          .rotateX(i % 2 === 0 ? 0 : 90)
          .rotateY((i % 2 === 0 ? 18 : -12) + i * 6)
          .at(x, 0.012, z);
        return link;
      }),
    );
    k.body('chain', links, { color: '#3d4047', roughness: 0.5, metalness: 0.75, detail: 0.006, maxError: 0.0018 });

    const iron = sdf
      .union(ring, jawBack, jawFront, hinge, hingeFront)
      .paintFn((x, y, z) => {
        // Rust patches in the crevices and on the ring, worn iron on the jaws.
        const patch = noise.fbm(x * 9 + 3, y * 9, z * 9, 3);
        const wear = 0.5 + 0.5 * noise.noise3(x * 40, y * 40, z * 40);
        const c = mixRgb(IRON, IRON_DARK, 0.25 + 0.3 * wear);
        const rust = Math.max(0, patch - 0.2) * (y < 0.03 ? 1.2 : 0.7);
        return mixRgb(c, RUST, Math.min(0.65, rust));
      });
    k.body('iron', iron, { color: '#3d4047', roughness: 0.55, metalness: 0.75, bump: (x, y, z) => 0.0011 * noise.fbm(x * 90, y * 90, z * 90, 2), detail: 0.009, maxError: 0.0025 });

    // ------------------------------------------------------------- teeth: ivory cones on each jaw arc
    const teethOf = (sign: 1 | -1) =>
      sdf.union(
        ...TOOTH_ANGLES.map((ta) => {
          const a = (ta * Math.PI) / 180;
          const x = Math.cos(a) * (R - 0.004);
          const z = Math.sin(a) * (R - 0.004) * sign;
          // Lean inward so the mouth reads closed at the tips.
          return sdf
            .cone([x, JAW_Y, z], [x * 0.78, 0.098, z * 0.78], 0.0165, 0.0025)
            .paintFn((px, py) => mixRgb(IVORY, IVORY_TIP, Math.min(1, Math.max(0, (py - 0.05) / 0.05))));
        }),
      );
    k.body('teeth', sdf.union(teethOf(-1), teethOf(1)), { color: '#efe4c9', roughness: 0.42, metalness: 0.05, detail: 0.01, maxError: 0.0035 });

    // ------------------------------------------------------------- pressure plate: steel disc + dome
    const plateDisc = sdf.cylinder(0.098, 0.028, 0.009).at(0, 0.036, 0);
    const plateDome = sdf.sphere(0.03).scale([1, 0.62, 1]).at(0, 0.052, 0);
    const plate = sdf
      .smoothUnion(0.006, plateDisc, plateDome)
      .paintFn((x, y, z) => {
        const r = Math.hypot(x, z);
        // Dark concentric groove ring on the plate face.
        const groove = r > 0.058 && r < 0.074 && y > 0.03 ? 0.85 : 0;
        return mixRgb(STEEL, STEEL_DARK, groove + 0.08 * (0.5 + 0.5 * noise.noise3(x * 50, 0, z * 50)));
      });
    k.body('plate', plate, { color: '#7b8089', roughness: 0.35, metalness: 0.9, detail: 0.007, maxError: 0.002 });

    // ------------------------------------------------------------- stake: wooden peg at the chain end
    const stakeBase: [number, number, number] = [0.425, 0, -0.1];
    const stakeTop: [number, number, number] = [0.385, 0.15, -0.065];
    const stake = sdf
      .cone(stakeBase, stakeTop, 0.02, 0.012)
      .smoothUnion(0.004, sdf.sphere(0.014).at(stakeTop[0], stakeTop[1], stakeTop[2]))
      .paintFn((x, y, z) => {
        const grain = 0.5 + 0.5 * noise.noise3(x * 60, y * 12, z * 60);
        return mixRgb(WOOD, WOOD_DARK, 0.2 + 0.4 * grain + (y < 0.02 ? 0.25 : 0));
      });
    // Iron eye ring around the stake shaft for the last chain link.
    const eye = sdf.torus(0.013, 0.0045).rotateX(90).at(0.392, 0.018, -0.078);
    k.body('stake', stake, { color: '#8a5a35', roughness: 0.85, metalness: 0, bump: (x, y, z) => 0.0018 * noise.fbm(x * 40, y * 10, z * 40, 2) });
    k.body('stake-eye', eye, { color: '#3d4047', roughness: 0.5, metalness: 0.75 });
  },
});
