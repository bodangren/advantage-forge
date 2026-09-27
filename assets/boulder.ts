import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf, type Vec3 } from '../src/index.js';

/**
 * nature/terrain/boulder — weathered granite boulder for the Chibi Quest landscape.
 *
 * Role: background terrain prop the player walks past; must read at the 128 px sprite size.
 * Size: about 1.2 m wide, 0.8 m tall, flat base on y = 0, facing +Z. No rig, no clips.
 * One idea: one chunky rounded stone lump with three soft facet planes and a bright moss patch
 *   on the crown — friendly and readable, not a featureless blob.
 * Shape language: round dominant (friendly), flat facets secondary (stone), one moss accent.
 * Palette: cool mid-gray granite #5a656d base, crevice #333c43, lit crown #8e99a0,
 *   warm flecks #6f675a, moss accent #47701f / light #6f9c34.
 * Materials: stone (roughness 0.9, grain + speckle in bump) and moss (roughness 0.98, fuzzy bump).
 * Detail list: one merged lumpy mass with a raised crown (big), three facet planes (medium),
 *   grain/speckle bump (small). Focal point: the moss patch.
 */

const stoneDark = rgb('#333c43');
const stoneLight = rgb('#8e99a0');
const fleck = rgb('#6f675a');
const mossDark = rgb('#2b4713');
const mossLight = rgb('#6f9c34');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const norm = (u: Vec3): Vec3 => {
  const l = Math.hypot(u[0], u[1], u[2]) || 1;
  return [u[0] / l, u[1] / l, u[2] / l];
};

/** Surface point hit by a ray aimed inward from `center + dir`; a reliable facet/moss anchor. */
function surfaceAim(shape: Sdf, center: Vec3, dir: Vec3): Vec3 {
  const u = norm(dir);
  const from: Vec3 = [center[0] + u[0] * 1.5, center[1] + u[1] * 1.5, center[2] + u[2] * 1.5];
  return sdf.raycast(shape, from, [-u[0], -u[1], -u[2]]) ?? sdf.surfacePoint(shape, from, 0);
}

/** A cutting plane facing `dir`, sunk `cut` meters into the surface at `point`. */
function facet(point: Vec3, dir: Vec3, cut: number): Sdf {
  const u = norm(dir);
  return sdf.halfSpace(u, u[0] * point[0] + u[1] * point[1] + u[2] * point[2] - cut);
}

export default defineAsset({
  name: 'boulder',
  description: 'Chunky weathered granite boulder with soft facet planes and a moss patch; 1.2 m wide.',
  detail: 0.01,
  reference: 'reference/boulder/boulder_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ blockout
    // One merged lumpy mass: a wide base lobe, a raised crown (the moss shelf), a low shoulder
    // on the left, and two low bulges at the base. The ground cut makes a flat contact patch.
    const main = sdf.ellipsoid([0.45, 0.4, 0.41]).at(-0.05, 0.37, 0);
    const crown = sdf.ellipsoid([0.33, 0.24, 0.29]).at(-0.02, 0.59, 0.02);
    const shoulder = sdf.ellipsoid([0.28, 0.25, 0.27]).at(0.37, 0.28, 0.02);
    const leftFoot = sdf.ellipsoid([0.2, 0.13, 0.24]).at(-0.44, 0.1, 0.08);
    const frontFoot = sdf.ellipsoid([0.24, 0.11, 0.22]).at(0.03, 0.08, 0.32);

    const mass = main
      .smoothUnion(0.1, crown)
      .smoothUnion(0.1, shoulder)
      .smoothUnion(0.1, leftFoot)
      .smoothUnion(0.1, frontFoot)
      .displace(0.018, (x, y, z) => noise.fbm(x * 2.2, y * 2.2, z * 2.2, 3, 4));

    // ------------------------------------------------------------------ facets
    // Three softer facet planes: a broad crown shelf, the left shoulder, and a front cheek.
    const crownF = surfaceAim(mass, [-0.04, 0.58, 0.04], [0.0, 1, 0.2]);
    const flankF = surfaceAim(mass, [0.42, 0.3, 0.04], [0.9, 0.25, 0.25]);
    const cheekF = surfaceAim(mass, [-0.1, 0.42, 0.26], [-0.3, 0.45, 0.85]);

    const rough = mass
      .smoothIntersect(0.035, facet(crownF, [0.0, 1, 0.2], 0.11))
      .smoothIntersect(0.035, facet(flankF, [0.9, 0.25, 0.25], 0.13))
      .smoothIntersect(0.035, facet(cheekF, [-0.3, 0.45, 0.85], 0.12));

    // Flat base where it meets the ground; a small round softens the facet edges.
    const stone = rough.round(0.009).intersect(sdf.halfSpace([0, -1, 0], 0));

    // ------------------------------------------------------------------ moss
    // A thin crust that follows the crown surface, on the front-left side.
    const mossAim = surfaceAim(stone, [-0.18, 0.6, 0.08], [-0.4, 1, 0.55]);
    const mask = sdf
      .ellipsoid([0.21, 0.12, 0.2])
      .at(mossAim[0], mossAim[1] + 0.01, mossAim[2])
      .displace(0.055, (x, y, z) => noise.fbm(x * 16, y * 16, z * 16, 4, 9));
    const shell = stone.round(0.014).subtract(stone.round(-0.008));
    const moss = shell.intersect(mask).round(0.004);

    // ------------------------------------------------------------------ paint
    const stonePaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const t = clamp01(y / 0.6);
      let c = mixRgb(stoneDark, base, clamp01(0.25 + t * 0.75));
      c = mixRgb(c, stoneLight, clamp01((t - 0.55) / 0.45) * 0.65);
      // Darker in the crevices and along the ground contact, so the mass is not one flat value.
      const ground = clamp01((0.16 - y) / 0.16);
      c = mixRgb(c, stoneDark, ground * 0.55);
      const patch = noise.fbm(x * 3.4, y * 3.4, z * 3.4, 3, 2);
      c = mixRgb(c, stoneDark, clamp01(-patch) * 0.5);
      c = mixRgb(c, stoneLight, clamp01(patch) * 0.16);
      const grain = noise.fbm(x * 55, y * 55, z * 55, 2, 13);
      c = mixRgb(c, stoneDark, clamp01(grain) * 0.32);
      const spots = noise.fbm(x * 42, y * 42, z * 42, 2, 27);
      c = mixRgb(c, fleck, clamp01((spots - 0.55) * 3) * 0.5);
      return c;
    };

    const mossPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const t = clamp01((y - (mossAim[1] - 0.14)) / 0.14);
      let c = mixRgb(mossDark, base, clamp01(0.35 + t * 0.65));
      const n = noise.fbm(x * 18, y * 18, z * 18, 3, 6);
      c = mixRgb(c, mossDark, clamp01(-n) * 0.5);
      c = mixRgb(c, mossLight, clamp01(n * 0.8 + 0.2) * t * 0.45);
      return c;
    };

    k.body('stone', stone.paintFn(stonePaint), {
      color: '#5a656d',
      roughness: 0.9,
      metalness: 0,
      detail: 0.01,
      maxTriangles: 11800,
      paintWeight: 2,
      bump: (x, y, z) =>
        0.0024 * noise.fbm(x * 36, y * 36, z * 36, 3, 11) +
        0.0008 * noise.noise3(x * 95, y * 95, z * 95, 5),
    });

    k.body('moss', moss.paintFn(mossPaint), {
      color: '#47701f',
      roughness: 0.98,
      metalness: 0,
      detail: 0.008,
      maxTriangles: 2600,
      bump: (x, y, z) => 0.0035 * noise.fbm(x * 70, y * 70, z * 70, 3, 3),
    });
  },
});
