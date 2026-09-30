import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note - merchant-ship (vehicles/water/merchant-ship).
 * Role: harbor and sea prop, read at 128 px as a chunky cog with one big cream sail.
 * Size: 7.1 m long (Z, bow +Z), 2.4 m wide, 5.25 m to the mast top; keel strip on y = 0.
 * One idea: a deep round-bellied brown hull under one huge bellied cream sail with a blue band.
 * Shape language: round hull, square castles and sail, thin ropes only as accents.
 * Palette: oak #b5814a, brown #8a5a35, walnut #6b4226, gunwale gold #d9a04c, sail #efe6d2,
 * sail band #2f6aa8, iron #4a4f55. Focal point: the sail and its blue band.
 * Materials: hull wood, rails, spars, sail cloth, iron, rope, barrels, crates.
 * Rig: none.
 */
const OAK = rgb('#b5814a');
const BROWN = rgb('#8a5a35');
const WALNUT = rgb('#6b4226');
const PALE = rgb('#c9a06a');
const GOLD = rgb('#d9a04c');
const SAIL = rgb('#efe6d2');
const BLUE = rgb('#2f6aa8');
const DARK = rgb('#1f1a1a');

const DECK = 1.2; // main deck floor
const RIM = 1.5; // gunwale top
const STERN_TOP = 2.1;
const FORE_TOP = 1.85;
const HRX = 1.2, HRY = 1.1, HRZ = 3.0, HCY = 0.9; // hull ellipsoid
const FX = 1.0, FZ = 2.45; // castle footprint (hull section at the rim)
const MAST_Z = 0.45;
const SAIL_Y = 3.2;
const SW = 1.7, SH = 1.3; // sail half width and half height

export default defineAsset({
  name: 'merchant-ship',
  description: 'A chunky cog-style merchant ship: deep round hull, stern and fore castles, one tall mast with a big cream sail and blue band, crow nest, bowsprit, rudder, anchor and lashed cargo.',
  reference: 'docs/vehicle-mockups/merchant-ship-mock.jpg',
  detail: 0.008,
  texture: { size: 1024 },
  build(k) {
    const slab = (top: number) => sdf.box([6, top, 12], 0).at(0, top / 2, 0);

    // ---------------------------------------------------------------- hull
    const outerFull = sdf.ellipsoid([HRX, HRY, HRZ]).at(0, HCY, 0);
    const outer = outerFull.intersect(slab(RIM));
    const well = outerFull.round(-0.1).intersect(sdf.box([6, 2, 12], 0).at(0, DECK + 1, 0));
    const footprint = (h: number, cy: number) => sdf.cylinder(1, h, 0.02).scale([FX, 1, FZ]).at(0, cy, 0);
    const sternCastle = footprint(STERN_TOP - 0.7, (STERN_TOP + 0.7) / 2)
      .smoothIntersect(0.04, sdf.box([4, 5, 2.0], 0.02).at(0, 1.5, -2.1));
    const foreCastle = footprint(FORE_TOP - 0.7, (FORE_TOP + 0.7) / 2)
      .smoothIntersect(0.04, sdf.box([4, 5, 1.6], 0.02).at(0, 1.5, 2.3));
    const step = sdf.box([1.2, 0.5, 0.4], 0.04).at(0, DECK + 0.25, -0.95);
    const hullShape = sdf.smoothUnion(0.03, outer.subtract(well), sternCastle, foreCastle, step);

    const row = 0.12;
    const portY = 0.68;
    const portZ = [-2.0, -1.2, -0.4, 0.4, 1.2, 2.0];
    const hullPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 6, y * 30, z * 6, 2);
      if (y < DECK && Math.abs(x) > 0.5) {
        for (const zi of portZ) {
          const d = Math.hypot(z - zi, y - portY);
          if (d < 0.11) return DARK;
          if (d < 0.2) return mixRgb(WALNUT, BROWN, 0.3 * grain);
        }
      }
      const planked = (Math.abs(y - DECK) < 0.012 && Math.abs(z) < 3) ||
        (Math.abs(y - STERN_TOP) < 0.02 && z < -1.0) || (Math.abs(y - FORE_TOP) < 0.02 && z > 1.4);
      if (planked) {
        const u = (x + 1.5) / 0.16;
        let c = mixRgb((Math.floor(u) & 1) ? PALE : mixRgb(PALE, OAK, 0.5), OAK, 0.25 * grain);
        if (Math.abs((u % 1) - 0.5) > 0.46) c = mixRgb(c, WALNUT, 0.6);
        return c;
      }
      if (Math.abs(y - RIM) < 0.012) return mixRgb(PALE, GOLD, 0.4 + 0.3 * grain);
      if (y > DECK + 0.012) {
        let c = mixRgb(GOLD, rgb('#e0ae5c'), 0.3 + 0.5 * noise.fbm(x * 5, y * 5, z * 5, 2));
        if (Math.abs(((y / row) % 1) - 0.5) > 0.47) c = mixRgb(c, BROWN, 0.5);
        return c;
      }
      if (y > DECK - 0.1) return mixRgb(WALNUT, BROWN, 0.3 * grain);
      const r = Math.floor(y / row);
      let c = mixRgb((r & 1) ? BROWN : mixRgb(BROWN, WALNUT, 0.35), OAK, 0.15 * grain);
      if (Math.abs(((y / row) % 1) - 0.5) > 0.46) c = mixRgb(c, WALNUT, 0.6);
      return mixRgb(c, WALNUT, y < 0.1 ? 0.45 : 0);
    };
    k.body('hull', hullShape.round(0.006).paintFn(hullPaint), {
      color: '#8a5a35', roughness: 0.8, metalness: 0, detail: 0.01,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 10, y * 40, z * 10, 2) +
        (y < DECK ? 0.003 * (Math.floor(y / row) & 1) : 0.002 * (Math.floor(y / row) & 1)),
      maxTriangles: 9000,
    });

    // ------------------------------------------------------------- rails
    const postH = 0.4;
    const rimPts = (top: number, angles: number[], zSign: number): Array<[number, number, number]> =>
      angles.map((a) => {
        const r = a * Math.PI / 180;
        return [0.88 * FX * Math.sin(r), top, zSign * 0.88 * FZ * Math.cos(r)];
      });
    const sternPts = rimPts(STERN_TOP, [-58, -36, -12, 12, 36, 58], -1);
    const forePts = rimPts(FORE_TOP, [-62, -38, -12, 12, 38, 62], 1).filter((p) => p[2] > 1.6);
    const post = (p: [number, number, number], h: number) => sdf.capsule([p[0], p[1] - 0.05, p[2]], [p[0], p[1] + h, p[2]], 0.05);
    const railChain = (pts: Array<[number, number, number]>, h: number) =>
      sdf.chain(pts.map((p) => [p[0], p[1] + h, p[2], 0.04] as [number, number, number, number]), 0.01);
    const rails = sdf.union(
      ...sternPts.map((p) => post(p, postH)), railChain(sternPts, postH),
      ...forePts.map((p) => post(p, 0.35)), railChain(forePts, 0.35));
    k.body('rails', rails.paintFn((x, y, z) => mixRgb(PALE, OAK, 0.35 + 0.3 * noise.fbm(x * 9, y * 9, z * 9, 2))), {
      color: '#c9a06a', roughness: 0.8, metalness: 0, detail: 0.005, maxTriangles: 2200,
    });

    // --------------------------------------------------------------- spars
    const mast = sdf.capsule([0, DECK - 0.1, MAST_Z], [0, 5.3, MAST_Z], 0.1);
    const yard = sdf.union(sdf.capsule([-2.0, 4.55, MAST_Z], [2.0, 4.55, MAST_Z], 0.08),
      sdf.sphere(0.11).at(-2.0, 4.55, MAST_Z), sdf.sphere(0.11).at(2.0, 4.55, MAST_Z));
    const nestWall = sdf.cylinder(0.44, 0.4, 0.02).subtract(sdf.cylinder(0.33, 0.4, 0).at(0, 0.09, 0));
    const nest = nestWall.at(0, 4.95, MAST_Z);
    const cap = sdf.sphere(0.14).at(0, 5.35, MAST_Z);
    const bowsprit = sdf.cone([0, 1.75, 2.6], [0, 2.55, 3.75], 0.14, 0.07);
    const rudder = sdf.box([0.14, 1.5, 0.6], 0.03).at(0, 1.1, -3.05);
    const tiller = sdf.capsule([0, 1.85, -3.05], [0, 2.35, -2.3], 0.06);
    const sparPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 7, y * 12, z * 7, 2);
      return mixRgb(mixRgb(BROWN, OAK, 0.3), WALNUT, 0.5 * grain);
    };
    const sparOpts = {
      color: '#8a5a35', roughness: 0.8, metalness: 0, detail: 0.008,
      bump: (x: number, y: number, z: number) => 0.002 * noise.fbm(x * 12, y * 12, z * 12, 2),
      maxTriangles: 2200,
    };
    k.body('mast', sdf.smoothUnion(0.03, mast, yard, nest, cap).paintFn(sparPaint), sparOpts);
    k.body('bowsprit', bowsprit.paintFn(sparPaint), sparOpts);
    k.body('rudder', sdf.smoothUnion(0.03, rudder, tiller).paintFn(sparPaint), sparOpts);

    // ---------------------------------------------------------------- sail
    const R = 4;
    const zc = 0.3 - (Math.sqrt(R * R - SW * SW - SH * SH) - 0);
    const sphereAt = (r: number) => sdf.sphere(r).at(0, SAIL_Y, zc);
    const shell = sphereAt(R + 0.03).subtract(sphereAt(R - 0.03));
    const sail = shell.intersect(sdf.box([2 * SW, 2 * SH, 1.6], 0.03).at(0, SAIL_Y, 0.7));
    k.body('sail', sail.paintFn((x, y, z) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 9, y * 9, z * 9, 2);
      let c = mixRgb(SAIL, rgb('#e2d6bb'), 0.35 * grain);
      if (Math.abs(((x + SW) / 0.5) % 1 - 0.5) > 0.485) c = mixRgb(c, rgb('#cdbf9f'), 0.6);
      const d = Math.abs(y - SAIL_Y);
      if (d < 0.36) return mixRgb(BLUE, rgb('#24558f'), 0.4 * grain);
      if (d < 0.4) return mixRgb(c, rgb('#8f8a80'), 0.4);
      if (y < SAIL_Y - SH + 0.07 || y > SAIL_Y + SH - 0.07) c = mixRgb(c, rgb('#c9b990'), 0.5);
      return c;
    }), {
      color: '#efe6d2', roughness: 0.9, metalness: 0, detail: 0.008,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 6, y * 6, z * 6, 3),
      maxTriangles: 3500,
    });

    // ------------------------------------------------------ flag (blue)
    const flag = sdf.box([0.05, 0.3, 0.7], 0.02).at(0, 5.3, MAST_Z - 0.4);
    k.body('flag', flag, {
      color: '#2f6aa8', roughness: 0.9, metalness: 0, detail: 0.005, maxTriangles: 400,
    });

    // --------------------------------------------------------------- ropes
    const rope = (a: [number, number, number], b: [number, number, number]) => sdf.capsule(a, b, 0.04);
    const barrelBases: Array<[number, number, number]> = [[-0.31, 1.0, DECK], [0.31, 1.0, DECK], [0, 1.0, DECK + 0.5], [0.55, -0.6, DECK + 0.5]];
    const lashings = barrelBases.map(([bx, bz, by]) => sdf.torus(0.3, 0.04).at(bx, by + 0.33, bz));
    const ropePaint = (x: number, y: number, z: number) =>
      mixRgb(rgb('#c9a86a'), rgb('#a4834c'), 0.5 + 0.5 * noise.fbm(x * 20, y * 20, z * 20, 2));
    const ropeOpts = { color: '#c9a86a', roughness: 0.95, metalness: 0, detail: 0.008, maxTriangles: 800 };
    k.body('stays', sdf.union(
      rope([0, 5.2, MAST_Z], [0, 2.5, 3.75]),
      rope([0, 5.2, MAST_Z], [0, 2.45, -2.4])).paintFn(ropePaint), ropeOpts);
    k.body('shrouds', sdf.union(
      rope([0, 4.3, MAST_Z], [1.0, 1.5, -0.2]),
      rope([0, 4.3, MAST_Z], [-1.0, 1.5, -0.2]),
      rope([1.65, 1.95, 0.35], [0.95, 1.5, 0.95]),
      rope([-1.65, 1.95, 0.35], [-0.95, 1.5, 0.95])).paintFn(ropePaint), ropeOpts);
    k.body('lashings', sdf.union(
      rope([0.7, FORE_TOP, 1.8], [0.98, 1.5, 1.8]),
      ...lashings).paintFn(ropePaint), { ...ropeOpts, detail: 0.005 });

    // ---------------------------------------------------------------- iron
    const A: [number, number, number] = [0.99, 0, 1.8];
    const anchor = sdf.smoothUnion(0.02,
      sdf.capsule([A[0], 0.75, A[2]], [A[0], 1.5, A[2]], 0.05),
      sdf.capsule([A[0], 1.36, A[2] - 0.3], [A[0], 1.36, A[2] + 0.3], 0.045),
      sdf.torus(0.08, 0.035).rotateY(90).at(A[0], 1.56, A[2]),
      sdf.chain([[A[0], 0.95, A[2] - 0.36, 0.05], [A[0], 0.76, A[2] - 0.15, 0.05], [A[0], 0.76, A[2] + 0.15, 0.05], [A[0], 0.95, A[2] + 0.36, 0.05]], 0.02),
      sdf.cone([A[0], 0.95, A[2] - 0.3], [A[0], 1.12, A[2] - 0.4], 0.02, 0.09),
      sdf.cone([A[0], 0.95, A[2] + 0.3], [A[0], 1.12, A[2] + 0.4], 0.02, 0.09));
    const hoop = (bx: number, bz: number, y: number) => sdf.cylinder(0.3, 0.05, 0.012).at(bx, y, bz);
    const hoops = sdf.union(...barrelBases.flatMap(([bx, bz, by]) => [hoop(bx, bz, by + 0.12), hoop(bx, bz, by + 0.53)]));
    const straps = sdf.union(
      sdf.box([0.2, 0.09, 0.3], 0.02).at(0, 0.7, -3.0),
      sdf.box([0.2, 0.09, 0.3], 0.02).at(0, 1.45, -3.0));
    const ironOpts = { color: '#4a4f55', roughness: 0.5, metalness: 0.8, detail: 0.005, maxTriangles: 1200 };
    k.body('anchor', anchor, ironOpts);
    k.body('hoops', hoops, ironOpts);
    k.body('straps', straps, ironOpts);

    // --------------------------------------------------------------- cargo
    const barrelProfile = profile.polygon([[0, 0], [0.25, 0], [0.29, 0.15], [0.3, 0.325], [0.29, 0.5], [0.25, 0.65], [0, 0.65]], { smooth: true, samples: 8 });
    const barrels = sdf.union(...barrelBases.map(([bx, bz, by]) => sdf.revolve(barrelProfile).at(bx, by, bz)));
    k.body('barrels', barrels.paintFn((x, y, z) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 6, y * 25, z * 6, 2);
      const stave = Math.abs(Math.sin((x + z) * 40));
      return mixRgb(mixRgb(OAK, BROWN, 0.4 + 0.3 * grain), WALNUT, stave > 0.96 ? 0.4 : 0);
    }), {
      color: '#a06e3e', roughness: 0.82, metalness: 0, detail: 0.007,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 10, y * 30, z * 10, 2),
      maxTriangles: 2200,
    });
    const crates = sdf.union(
      sdf.box([0.55, 0.5, 0.55], 0.03).at(-0.55, DECK + 0.25, -0.6),
      sdf.box([0.5, 0.5, 0.5], 0.03).at(0.55, DECK + 0.25, -0.6),
      sdf.box([0.4, 0.4, 0.4], 0.03).rotateY(22).at(-0.55, DECK + 0.5 + 0.2, -0.6));
    k.body('crates', crates.paintFn((x, y, z) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 7, y * 25, z * 7, 2);
      const r = Math.floor(y / 0.1);
      return mixRgb((r & 1) ? PALE : mixRgb(PALE, OAK, 0.5), WALNUT, 0.25 * grain);
    }), {
      color: '#c9a06a', roughness: 0.8, metalness: 0, detail: 0.007,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 10, y * 30, z * 10, 2) + 0.0025 * (Math.floor(y / 0.1) & 1),
      maxTriangles: 1500,
    });
  },
});
