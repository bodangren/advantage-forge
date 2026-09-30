import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note - riverboat (vehicles/water/riverboat).
 * Role: river/dock prop, read at 128 px as a chunky paddle steamer with a red-roofed cabin.
 * Size: 4.55 m long (Z, bow +Z), 1.6 m wide, 2.6 m to the smokestack top; keel on y = 0.
 * One idea: a fat flat-bottomed hull, a red peaked cabin, a big stern paddle wheel and a tall bow post.
 * Shape language: round hull, square cabin, radial wheel. Palette: oak #b5814a, brown #8a5a35,
 * walnut #6b4226, pale #c9a06a, roof red #b03a2a, iron #4a4f55.
 * Materials: wood, roof paint, glass, iron. Focal point: the red roof and the paddle wheel.
 * Rig: none.
 */
const OAK = rgb('#b5814a');
const BROWN = rgb('#8a5a35');
const WALNUT = rgb('#6b4226');
const PALE = rgb('#c9a06a');
const BAND = rgb('#d9a04c');
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

const DECK = 0.66; // deck floor height
const RIM = 0.8; // gunwale top
const CAB_Z = -0.35; // cabin center
const WHEEL_Z = -1.75;
const WHEEL_Y = 0.35;
const WHEEL_R = 0.55;

export default defineAsset({
  name: 'riverboat',
  description: 'A chunky flat-bottomed riverboat with a red-roofed cabin, stern paddle wheel, iron smokestack, steering oar and stacked cargo.',
  reference: 'docs/vehicle-mockups/riverboat-mock.jpg',
  detail: 0.008,
  texture: { size: 1024 },
  build(k) {
    const slab = (top: number) => sdf.box([4, top, 8], 0).at(0, top / 2, 0);

    // ---------------------------------------------------------------- hull
    const outerFull = sdf.smoothUnion(0.2,
      sdf.box([1.6, 1.1, 2.3], 0.3).at(0, 0.55, 0),
      sdf.ellipsoid([0.8, 0.75, 1.25]).at(0, 0.5, 1.0));
    const outer = outerFull.intersect(slab(RIM));
    const well = outerFull.round(-0.1).intersect(sdf.box([4, 1, 8], 0).at(0, DECK + 0.5, 0));
    // tall bow post (leaning forward), part of the hull
    const prow = sdf.ellipsoid([0.1, 0.7, 0.28]).rotateX(14).at(0, 1.1, 2.02);
    const hullShape = sdf.smoothUnion(0.05, outer.subtract(well), prow);

    const row = 0.1;
    const hullPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 6, y * 30, z * 6, 2);
      if (y > DECK - 0.004 && y < DECK + 0.01 && Math.abs(x) < 0.7 && z < 2.0) {
        const plank = Math.floor((x + 1) / 0.16);
        let c = mixRgb((plank & 1) ? PALE : mixRgb(PALE, OAK, 0.5), OAK, 0.25 * grain);
        const seam = Math.abs((((x + 1) / 0.16) % 1) - 0.5);
        if (seam > 0.46) c = mixRgb(c, WALNUT, 0.6);
        return c;
      }
      if (y > DECK + 0.012 && y < RIM + 0.02) return mixRgb(BAND, rgb('#e0ae5c'), 0.5 + 0.5 * noise.fbm(x * 5, y * 5, z * 5, 2));
      if (z > 1.85 && y > 0.85) return mixRgb(BROWN, WALNUT, 0.25 * grain);
      const r = Math.floor(y / row);
      let c = mixRgb((r & 1) ? BROWN : mixRgb(BROWN, OAK, 0.5), PALE, 0.1 * grain);
      const seam = Math.abs(((y / row) % 1) - 0.5);
      if (seam > 0.46) c = mixRgb(c, WALNUT, 0.6);
      return mixRgb(c, WALNUT, 0.45 * clamp01(1 - y / 0.1));
    };
    k.body('hull', hullShape.round(0.006).paintFn(hullPaint), {
      color: '#8a5a35', roughness: 0.8, metalness: 0, detail: 0.008,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 10, y * 40, z * 10, 2) + 0.003 * (Math.floor(y / row) & 1),
      maxTriangles: 5000,
    });

    // --------------------------------------------------------------- cabin
    const cabin = sdf.box([1.5, 1.2, 1.3], 0.03).at(0, DECK + 0.6, CAB_Z);
    k.body('cabin', cabin.paintFn((x, y, z) => {
      const plank = Math.floor((x + 1) / 0.125 + (Math.abs(z + 0.35) > 0.6 ? 0.5 : 0));
      const grain = 0.5 + 0.5 * noise.fbm(x * 4, y * 25, z * 4, 2);
      let c = mixRgb((plank & 1) ? mixRgb(PALE, OAK, 0.3) : mixRgb(PALE, OAK, 0.6), OAK, 0.2 * grain);
      const seam = Math.abs((((x + 1) / 0.125) % 1) - 0.5);
      if (seam > 0.46) c = mixRgb(c, WALNUT, 0.5);
      return c;
    }), {
      color: '#c9a06a', roughness: 0.8, metalness: 0, detail: 0.008,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 8, y * 30, z * 8, 2) + 0.002 * (Math.floor((x + 1) / 0.125) & 1),
      maxTriangles: 2500,
    });

    const roofY = DECK + 1.2;
    const roofProfile = profile.polygon([[-0.92, 0], [-0.92, 0.06], [0, 0.34], [0.92, 0.06], [0.92, 0]]);
    const roof = sdf.extrude(roofProfile, 1.6, 0.03).at(0, roofY + 0.03, CAB_Z);
    k.body('roof', roof.paintFn((x, y, z) => {
      const rr = Math.floor((z + 2) / 0.12);
      const grain = 0.5 + 0.5 * noise.fbm(x * 5, y * 5, z * 5, 2);
      return mixRgb(rgb('#b03a2a'), rgb('#c94a36'), (rr & 1) ? 0.35 : 0.05 + 0.15 * grain);
    }), {
      color: '#b03a2a', roughness: 0.75, metalness: 0, detail: 0.008,
      bump: (x, y, z) => 0.003 * (Math.floor((z + 2) / 0.12) & 1) + 0.0015 * noise.fbm(x * 12, y * 12, z * 12, 2),
      maxTriangles: 2500,
    });

    // windows (glass), frames and doors, one set per side
    const sideSet = (s: number) => {
      const frame = sdf.box([0.08, 0.44, 0.5], 0.015).at(s * 0.77, DECK + 0.72, CAB_Z + 0.32);
      const door = sdf.box([0.08, 0.92, 0.46], 0.02).at(s * 0.77, DECK + 0.46, CAB_Z - 0.34);
      return { frame, door };
    };
    const S1 = sideSet(1), S2 = sideSet(-1);
    k.body('doors', sdf.union(S1.frame, S1.door, S2.frame, S2.door).paintFn((x, y, z) =>
      mixRgb(WALNUT, BROWN, 0.4 + 0.4 * noise.fbm(x * 9, y * 9, z * 9, 2))), {
      color: '#6b4226', roughness: 0.8, metalness: 0, detail: 0.005, maxTriangles: 1000,
    });
    const pane = (s: number) => sdf.box([0.06, 0.32, 0.38], 0.01).at(s * 0.79, DECK + 0.72, CAB_Z + 0.32);
    k.body('glass', sdf.union(pane(1), pane(-1)), {
      color: '#3a5a72', roughness: 0.15, metalness: 0, detail: 0.004, opacity: 0.8, maxTriangles: 600,
    });

    // -------------------------------------------------------------- iron
    const stack = sdf.smoothUnion(0.02,
      sdf.cylinder(0.11, 0.8, 0.02).at(0, roofY + 0.36 + 0.4 - 0.05, CAB_Z + 0.25),
      sdf.cylinder(0.16, 0.1, 0.03).at(0, roofY + 0.36 + 0.8 - 0.05, CAB_Z + 0.25));
    const post = sdf.capsule([0.74, RIM - 0.05, -1.0], [1.0, 1.2, -1.0], 0.06);
    const hoop = (bx: number, bz: number, y: number) =>
      sdf.cylinder(0.262, 0.05, 0.015).at(bx, y, bz);
    const barrelPos: Array<[number, number, number]> = [[-0.42, 0.68, DECK], [0.05, 0.68, DECK], [-0.2, 1.12, DECK]];
    const hoops = sdf.union(...barrelPos.flatMap(([bx, bz, by]) => [hoop(bx, bz, by + 0.14), hoop(bx, bz, by + 0.42)]));
    const ironOpts = { color: '#5a6068', roughness: 0.5, metalness: 0.8, detail: 0.005, maxTriangles: 1000 };
    k.body('stack', stack, ironOpts);
    k.body('oarlock', post, ironOpts);
    k.body('hoops', hoops, { ...ironOpts, detail: 0.006 });

    // --------------------------------------------------------- paddle wheel
    const wheelCenter = (s: sdf.Shape) => s.at(0, WHEEL_Y, WHEEL_Z);
    const paddle = (a: number) =>
      wheelCenter(sdf.box([1.1, 0.09, 0.55], 0.015).at(0, 0, 0.275).rotateX(a));
    const paddles = sdf.union(...[0, 45, 90, 135, 180, 225, 270, 315].map(paddle));
    const hub = wheelCenter(sdf.cylinder(0.1, 1.4, 0.02).rotateZ(90));
    const rim = (s: number) => wheelCenter(sdf.torus(0.42, 0.05).rotateZ(90).at(s * 0.5, 0, 0));
    const arm = (s: number) => sdf.capsule([s * 0.62, 0.52, -1.08], [s * 0.66, WHEEL_Y, WHEEL_Z], 0.06);
    const wheel = sdf.union(paddles, hub, rim(1), rim(-1), arm(1), arm(-1)).intersect(slab(1.2));
    k.body('wheel', wheel.paintFn((x, y, z) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 7, y * 20, z * 7, 2);
      return mixRgb(mixRgb(BROWN, OAK, 0.35), WALNUT, 0.5 * grain);
    }), {
      color: '#8a5a35', roughness: 0.8, metalness: 0, detail: 0.006,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 12, y * 12, z * 12, 2),
      maxTriangles: 4000,
    });

    // ---------------------------------------------------------- steering oar
    const p0: [number, number, number] = [1.0, 1.45, -0.5];
    const p1: [number, number, number] = [1.25, 0.2, -2.6];
    const at = (t: number): [number, number, number] =>
      [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t, p0[2] + (p1[2] - p0[2]) * t];
    const oar = sdf.smoothUnion(0.03,
      sdf.capsule(p0, at(0.85), 0.05),
      sdf.capsule(at(0.72), p1, 0.1));
    k.body('oar', oar.paintFn((x, y, z) => mixRgb(PALE, OAK, 0.35 + 0.3 * noise.fbm(x * 9, y * 9, z * 9, 2))), {
      color: '#c9a06a', roughness: 0.8, metalness: 0, detail: 0.006, maxTriangles: 1200,
    });

    // ----------------------------------------------------------------- cargo
    const barrel = profile.polygon([[0, 0], [0.21, 0], [0.245, 0.15], [0.26, 0.28], [0.245, 0.42], [0.21, 0.56], [0, 0.56]], { smooth: true, samples: 8 });
    const oneBarrel = (bx: number, bz: number, by: number) => sdf.revolve(barrel).at(bx, by, bz);
    const barrels = sdf.union(...barrelPos.map(([bx, bz, by]) => oneBarrel(bx, bz, by)));
    k.body('barrels', barrels.paintFn((x, y, z) => {
      const ang = Math.atan2(z, x);
      const grain = 0.5 + 0.5 * noise.fbm(x * 6, y * 25, z * 6, 2);
      const stave = Math.abs(Math.sin((x + z) * 40));
      return mixRgb(mixRgb(OAK, BROWN, 0.4 + 0.3 * grain), WALNUT, stave > 0.96 ? 0.4 : 0);
    }), {
      color: '#a06e3e', roughness: 0.82, metalness: 0, detail: 0.007,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 10, y * 30, z * 10, 2),
      maxTriangles: 2200,
    });

    const crate1 = sdf.box([0.46, 0.42, 0.46], 0.03).at(0.5, DECK + 0.21, 0.72);
    const crate2 = sdf.box([0.4, 0.38, 0.4], 0.03).rotateY(22).at(0.5, DECK + 0.42 + 0.19, 0.72);
    const crates = sdf.union(crate1, crate2);
    k.body('crates', crates.paintFn((x, y, z) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 7, y * 25, z * 7, 2);
      const r = Math.floor(y / 0.09);
      return mixRgb((r & 1) ? PALE : mixRgb(PALE, OAK, 0.5), WALNUT, 0.25 * grain);
    }), {
      color: '#c9a06a', roughness: 0.8, metalness: 0, detail: 0.007,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 10, y * 30, z * 10, 2) + 0.0025 * (Math.floor(y / 0.09) & 1),
      maxTriangles: 2500,
    });
  },
});
