import { HAND_FIT, defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — graveyard staff (avatar reward piece; the app emblem "Graveyard Staff").
 *
 * Role: a reward piece the student wears in the main hand, and its shop-style icon. It must read
 * at 128 px and on the avatar at phone size. Rated G: cozy and friendly, never scary.
 * Size: 1.24 m tall like `staff`, stands on y = 0, faces +Z; the grip centre is at y = 0.47.
 * One idea: a thick pale driftwood shepherd's crook, curled like a scroll, with a little round
 *   lantern that glows mint green.
 * Shape language: round and soft (the scroll curl, the round globe); the iron bail is the one thin
 *   dark accent.
 * Palette: driftwood #e0dac6 / #a99c7a, leather #a8806c / #7a5644, iron #3a4048, glow #9ff2c8,
 *   ribbon lavender #9a6cc8, bone gold #e8b84e, moon teal #8cc6d0, small moon white #f2efe8.
 *   The mint glow is the accent.
 * Materials: driftwood, leather grip, iron lantern, emissive glass, ribbon, bone charm, moon charms.
 * Detail: a twisted grain, a wrapped knot near the foot, a branch nub, the scroll curl, a round
 *   lantern in an iron bail with a coiled cap, a gold bone and a teal moon on a chain, a long
 *   grip with a ribbon band, ribbon tails, and a white moon charm. No rig.
 */

const WOOD = '#e0dac6';
const WOOD_DARK = '#a99c7a';
const LEATHER = '#a8806c';
const LEATHER_DARK = '#7a5644';
const IRON = '#3a4048';
const GLOW = '#9ff2c8';
const RIBBON = '#9a6cc8';
const BONE = '#e8b84e';
const MOON = '#8cc6d0';
const MOON_WHITE = '#f2efe8';

/** Lantern centre: it hangs from the bottom of the scroll curl. */
const LANTERN: [number, number, number] = [-0.075, 0.912, 0];
/** The grip runs from GRIP_Y0 to GRIP_Y1 along the shaft. */
const GRIP_Y0 = 0.31;
const GRIP_Y1 = 0.6;
/** The centre of the crook arc; the grain follows the arc above y = 1. */
const CROOK = [0.0, 1.115] as const;

/**
 * The wood grain value at a point: twisted streaks along the shaft, and along the arc in the
 * crook. Positive values are grooves (they push the surface in).
 */
function grain(x: number, y: number, z: number): number {
  const twist = (along: number, u: number, v: number) => {
    const a = along * 7;
    const c = Math.cos(a);
    const s = Math.sin(a);
    return noise.fbm((u * c - v * s) * 42, along * 3.2, (u * s + v * c) * 42, 2);
  };
  const shaft = twist(y, x, z);
  const w = Math.min(1, Math.max(0, (y - 1.0) / 0.08));
  if (w === 0) return shaft;
  const dx = x - CROOK[0];
  const dy = y - CROOK[1];
  const crook = twist(Math.atan2(dx, dy) * 0.1 + 1.2, Math.hypot(dx, dy) - 0.1, z);
  return shaft * (1 - w) + crook * w;
}

export default defineAsset({
  name: 'graveyard-staff',
  description: "A thick pale driftwood shepherd's crook with a scroll curl, a round mint-glowing lantern, a gold bone charm, and a teal moon charm; a reward piece.",
  detail: 0.006,
  reference: 'docs/item-mockups/graveyard-staff-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'mainhand', fitScale: HAND_FIT, origin: [0, 0.47, 0], twoHanded: true },

  build(k) {
    // The shaft: nearly straight through the grip, a lean to +X above it, then the crook over to
    // -X and a scroll curl whose tip turns up.
    const shaft = sdf.chain(
      [
        [0.0, 0.03, 0.0, 0.03],
        [-0.006, 0.17, 0.004, 0.031],
        [0.0, GRIP_Y0, 0.0, 0.029],
        [0.004, 0.46, 0.0, 0.029],
        [0.008, GRIP_Y1, 0.0, 0.03],
        [0.02, 0.7, -0.004, 0.032],
        [0.045, 0.82, 0.004, 0.033],
        [0.072, 0.935, 0.0, 0.034],
        [0.092, 1.045, 0.0, 0.034],
        [0.086, 1.145, 0.0, 0.034],
        [0.045, 1.208, 0.0, 0.033],
        [-0.03, 1.212, 0.0, 0.032],
        [-0.088, 1.172, 0.0, 0.03],
        [-0.104, 1.115, 0.0, 0.027],
        [-0.086, 1.074, 0.0, 0.024],
        [-0.052, 1.07, 0.0, 0.021],
        [-0.032, 1.096, 0.0, 0.018],
      ],
      0.02,
    );
    // A loop of vine wrapped around the shaft near the foot, and a cut branch nub high up.
    const knot = sdf.smoothUnion(
      0.01,
      sdf.torus(0.034, 0.016).rotateZ(40).rotateY(25).at(-0.008, 0.19, 0.002),
      sdf.sphere(0.02).at(-0.04, 0.17, 0.006),
    );
    const nub = sdf.cone([0.07, 0.95, 0.0], [0.118, 0.978, 0.012], 0.017, 0.012);
    const wood = sdf
      .smoothUnion(0.008, shaft, knot)
      .smoothUnion(0.012, nub)
      .displace(0.0035, grain, 1.5)
      .paintFn((x, y, z, base) => {
        const g = grain(x, y, z);
        let c = mixRgb(rgb(base), rgb(WOOD_DARK), Math.min(1, Math.max(0, g + 0.05) * 1.6));
        if (y < 0.1) c = mixRgb(c, rgb(WOOD_DARK), (0.1 - y) * 3);
        return c;
      })
      .paintWhere(sdf.sphere(0.012).at(0.119, 0.979, 0.012), WOOD_DARK, 0.004);
    k.body('wood', wood, {
      color: WOOD,
      roughness: 0.86,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 9000,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 90, y * 12, z * 90, 2),
    });

    // The long leather grip follows the shaft (a thin shell of it), with darker bands at both ends.
    const band = (y: number, h: number) => sdf.box([0.3, h, 0.3]).at(0, y, 0);
    const wrap = shaft.round(0.006).smoothIntersect(0.003, band((GRIP_Y0 + GRIP_Y1) / 2, GRIP_Y1 - GRIP_Y0));
    const cuffs = shaft.round(0.0095).intersect(sdf.union(band(GRIP_Y0 + 0.012, 0.024), band(GRIP_Y1 - 0.012, 0.024)));
    const grip = sdf.union(wrap, cuffs).paintFn((x, y, z) => {
      if (y < GRIP_Y0 + 0.026 || y > GRIP_Y1 - 0.026) return rgb(LEATHER_DARK);
      const spiral = Math.sin(Math.atan2(z, x - 0.004) + (y - GRIP_Y0) * 120);
      return spiral > 0.6 ? mixRgb(rgb(LEATHER), rgb(LEATHER_DARK), 0.38) : rgb(LEATHER);
    });
    k.body('grip', grip, { color: LEATHER, roughness: 0.66, metalness: 0, detail: 0.004, maxTriangles: 2400, textureDensity: 2 });

    // A lavender ribbon band over the top of the grip, with five pointed tails that hang over
    // the leather on the front and the +X side.
    const ribbonY = GRIP_Y1 + 0.016;
    const tail = sdf
      .extrude(profile.polygon([[-0.011, 0], [0.011, 0], [0.013, -0.06], [0, -0.048], [-0.012, -0.064]], { smooth: false }), 0.005, 0.0018)
      .rotateX(-16);
    const tails = [-35, -5, 25, 55, 85].map((a, i) => tail.rotateZ(i % 2 ? 6 : -6).at(0, 0.004, 0.039).rotateY(a).at(0.009, ribbonY - 0.004, 0));
    const ribbon = sdf.union(shaft.round(0.0085).intersect(band(ribbonY, 0.02)), ...tails);
    k.body('ribbon', ribbon, { color: RIBBON, roughness: 0.8, metalness: 0, detail: 0.004, maxTriangles: 2000 });

    // A small white moon charm hangs from the ribbon band on the +X side.
    const smallMoon = sdf.subtract(sdf.cylinder(0.028, 0.011, 0.003).rotateX(90), sdf.cylinder(0.024, 0.03).rotateX(90).at(0, 0.016, 0));
    k.body('moon-white', smallMoon.at(0.06, ribbonY - 0.05, 0.014), { color: MOON_WHITE, roughness: 0.4, metalness: 0.2, detail: 0.003, maxTriangles: 700 });

    // The lantern: a round glass globe, a coiled cap, a flat base, and an iron bail that rises
    // from the base around the globe to the curl. A chain under the base holds the charms.
    const [lx, ly, lz] = LANTERN;
    const boneY = ly - 0.108;
    const moonY = boneY - 0.137;
    const bailSide = sdf.chain(
      [
        [0.048, -0.052, 0, 0.0055],
        [0.061, -0.01, 0, 0.0055],
        [0.06, 0.045, 0, 0.0055],
        [0.047, 0.092, 0, 0.0055],
        [0.024, 0.126, 0, 0.0055],
        [0.0, 0.136, 0, 0.0055],
      ],
      0.003,
    );
    const iron = sdf.union(
      bailSide.mirror('x', 0.004).at(lx, ly, lz),
      sdf.capsule([lx, ly + 0.066, lz], [lx, ly + 0.136, lz], 0.0045),
      sdf.torus(0.03, 0.0075).at(lx, ly + 0.046, lz),
      sdf.torus(0.027, 0.0075).at(lx, ly + 0.058, lz),
      sdf.torus(0.022, 0.007).at(lx, ly + 0.069, lz),
      sdf.cylinder(0.025, 0.032).at(lx, ly + 0.058, lz),
      sdf.cylinder(0.05, 0.012, 0.004).at(lx, ly - 0.05, lz),
      sdf.cylinder(0.038, 0.012, 0.004).at(lx, ly - 0.06, lz),
      // The chain to the bone charm and from the bone to the moon charm.
      sdf.capsule([lx, ly - 0.066, lz], [lx, boneY + 0.012, lz], 0.0045),
      sdf.capsule([lx, boneY - 0.012, lz], [lx, moonY + 0.03, lz], 0.0045),
    );
    k.body('iron', iron, { color: IRON, roughness: 0.45, metalness: 0.8, detail: 0.0035, maxTriangles: 3600 });

    k.body('glow', sdf.sphere(0.048).at(lx, ly, lz), {
      color: GLOW,
      roughness: 0.2,
      metalness: 0,
      emissive: GLOW,
      emissiveIntensity: 0.9,
      detail: 0.004,
      maxTriangles: 1000,
    });

    // A gold cartoon bone, then a teal crescent moon that opens up and to +X.
    const bone = sdf.union(
      sdf.capsule([-0.022, 0, 0], [0.022, 0, 0], 0.01),
      ...[-1, 1].flatMap((sx) => [-1, 1].map((sy) => sdf.sphere(0.013).at(sx * 0.027, sy * 0.009, 0))),
    );
    k.body('bone', bone.at(lx, boneY, lz + 0.004), { color: BONE, roughness: 0.55, metalness: 0, detail: 0.003, maxTriangles: 900 });
    const crescent = sdf.subtract(sdf.cylinder(0.032, 0.013, 0.004).rotateX(90), sdf.cylinder(0.027, 0.04).rotateX(90).at(0.016, 0.012, 0));
    k.body('moon', crescent.at(lx, moonY, lz + 0.004), {
      color: MOON,
      roughness: 0.3,
      metalness: 0.3,
      emissive: MOON,
      emissiveIntensity: 0.2,
      detail: 0.003,
      maxTriangles: 900,
    });
  },
});
