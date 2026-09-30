import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note - pirate-ship (vehicles/water/pirate-ship).
 * Role: harbor and sea prop, read at 128 px as a chunky galleon with two black sails and a skull.
 * Size: 8.0 m long (Z, bow +Z), 2.6 m wide, 5.6 m to the flag top; keel strip on y = 0.
 * One idea: a dark round hull under two big bellied black sails, the main sail with a white skull.
 * Shape language: round hull, square stern castle and sails, thin ropes only as accents.
 * Palette: dark walnut #4a3020 (dominant), black band #1c1a1c, gold trim #d9a04c (accent),
 * sail black #2a2a2e, skull white #f0ece0, amber windows #ffb43a, iron #4a4f55.
 * Materials: hull wood, castle, rails, spars, sails, jib, flag, figurehead, windows, iron, rope.
 * Focal point: the main sail skull. Rig: none.
 */
const OAK = rgb('#b5814a');
const BROWN = rgb('#8a5a35');
const WALNUT = rgb('#6b4226');
const DARKWOOD = rgb('#4a3020');
const DARKWOOD2 = rgb('#5a3c26');
const PALE = rgb('#c9a06a');
const GOLD = rgb('#d9a04c');
const BLACK = rgb('#1c1a1c');
const SAIL = rgb('#2a2a2e');
const BONE = rgb('#f0ece0');

const DECK = 1.2; // main deck floor
const RIM = 1.55; // gunwale top
const FORE_TOP = 1.8; // raised fore deck
const CASTLE_TOP = 2.85;
const HRX = 1.3, HRY = 1.2, HRZ = 3.7, HCY = 0.9; // hull ellipsoid
const MAIN_Z = 0.5, FORE_Z = 2.2;
const CANNON_Y = 0.78;
const CANNON_Z = [-1.1, -0.2, 0.7, 1.6];

export default defineAsset({
  name: 'pirate-ship',
  description: 'A chunky pirate galleon: dark walnut hull with black band and gold trim, tall stern castle with amber windows, two masts with black sails and a white skull-and-crossbones, crow nest, bowsprit and jib, side cannons, flag, anchor and a serpent figurehead.',
  reference: 'docs/vehicle-mockups/pirate-ship-mock.jpg',
  detail: 0.008,
  texture: { size: 1024 },
  build(k) {
    const slab = (top: number) => sdf.box([6, top, 14], 0).at(0, top / 2, 0);

    // ---------------------------------------------------------------- hull
    const sternFill = sdf.ellipsoid([1.05, 0.95, 1.3]).at(0, 1.1, -2.55);
    const outerFull = sdf.smoothUnion(0.15, sdf.ellipsoid([HRX, HRY, HRZ]).at(0, HCY, 0), sternFill);
    const foreBlock = sdf.cylinder(1, FORE_TOP - 0.7, 0.02).scale([1.03, 1, 3.15]).at(0, (FORE_TOP + 0.7) / 2, 0)
      .smoothIntersect(0.04, sdf.box([4, 5, 1.5], 0.02).at(0, 1.5, 2.55));
    const outer = sdf.smoothUnion(0.04, outerFull.intersect(slab(RIM)), foreBlock);
    const well = outerFull.round(-0.1).intersect(sdf.box([6, 2, 14], 0).at(0, DECK + 1, 0));
    const hullShape = outer.subtract(well);

    const row = 0.12;
    const hullPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 6, y * 30, z * 6, 2);
      // gun ports
      if (y < DECK - 0.05 && Math.abs(x) > 0.5) {
        for (const zi of CANNON_Z) {
          const d = Math.max(Math.abs(z - zi), Math.abs(y - CANNON_Y));
          if (d < 0.2) return BLACK;
          if (d < 0.27) return mixRgb(GOLD, rgb('#b8853a'), 0.4 * grain);
        }
      }
      const planked = (Math.abs(y - DECK) < 0.012 && Math.abs(z) < 3.5) || (Math.abs(y - FORE_TOP) < 0.02 && z > 1.6);
      if (planked) {
        const u = (x + 1.5) / 0.16;
        let c = mixRgb((Math.floor(u) & 1) ? mixRgb(BROWN, OAK, 0.35) : mixRgb(BROWN, WALNUT, 0.4), OAK, 0.2 * grain);
        if (Math.abs((u % 1) - 0.5) > 0.46) c = mixRgb(c, DARKWOOD, 0.7);
        return c;
      }
      if (y > RIM - 0.07 && y < RIM + 0.02) return mixRgb(GOLD, rgb('#e6b45c'), 0.5 * grain);
      if (y > 1.13 && y < 1.27 && y < RIM - 0.05) return mixRgb(GOLD, rgb('#e6b45c'), 0.4 + 0.4 * grain); // gold trim line
      if (y > 0.96 && y <= 1.13) return mixRgb(BLACK, rgb('#2a2426'), 0.5 * grain); // black band
      // plank rows are a smooth wave (soft color, no hard seams); the seams live in bump
      const wave = 0.5 + 0.5 * Math.sin(y * (y > 1.24 ? 70 : 52));
      const c = mixRgb(mixRgb(DARKWOOD, DARKWOOD2, wave), WALNUT, 0.25 * grain);
      return mixRgb(c, BLACK, y < 0.1 ? 0.4 : 0);
    };
    k.body('hull', hullShape.round(0.006).paintFn(hullPaint), {
      color: '#4a3020', roughness: 0.8, metalness: 0, detail: 0.01,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 10, y * 40, z * 10, 2) + 0.003 * (Math.floor(y / row) & 1),
      maxTriangles: 7500,
    });

    // -------------------------------------------------------- stern castle
    const CX = 1.0, CZ0 = -3.45, CZ1 = -1.65;
    const cz = (CZ0 + CZ1) / 2;
    const castle = sdf.box([2 * CX, CASTLE_TOP - 0.95, CZ1 - CZ0], 0.08).at(0, (CASTLE_TOP + 0.95) / 2, cz);
    k.body('castle', castle.paintFn((x, y, z) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 6, y * 30, z * 6, 2);
      if (y > CASTLE_TOP - 0.16) return mixRgb(GOLD, rgb('#e6b45c'), 0.5 * grain);
      if (y > CASTLE_TOP - 0.3) return mixRgb(BLACK, rgb('#2a2426'), 0.5 * grain);
      if (y > CASTLE_TOP - 0.38) return mixRgb(GOLD, rgb('#e6b45c'), 0.4 + 0.4 * grain);
      // dark door on the front face
      if (z > CZ1 - 0.05 && Math.abs(x) < 0.3 && y < 2.3 && y > 1.2) return BLACK;
      if (z > CZ1 - 0.05 && Math.abs(x) < 0.4 && y < 2.4 && y > 1.15) return mixRgb(GOLD, rgb('#b8853a'), 0.3);
      const r = Math.floor(y / 0.1);
      let c = mixRgb((r & 1) ? DARKWOOD2 : DARKWOOD, WALNUT, 0.25 * grain);
      if (Math.abs(((y / 0.1) % 1) - 0.5) > 0.46) c = mixRgb(c, BLACK, 0.5);
      return c;
    }), {
      color: '#4a3020', roughness: 0.8, metalness: 0, detail: 0.008,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 10, y * 40, z * 10, 2) + 0.003 * (Math.floor(y / 0.1) & 1),
      maxTriangles: 1500,
    });

    // three amber windows on the stern face (frame in gold, glass emissive)
    const winY = 2.2;
    const wx = [-0.58, 0, 0.58];
    const frames = sdf.union(...wx.map((x) => sdf.box([0.5, 0.5, 0.1], 0.03).at(x, winY, CZ0 - 0.02)));
    k.body('frames', frames.paintFn((x, y, z) => mixRgb(GOLD, rgb('#e6b45c'), 0.5 + 0.5 * noise.fbm(x * 8, y * 8, z * 8, 2))), {
      color: '#d9a04c', roughness: 0.55, metalness: 0.2, detail: 0.005, maxTriangles: 400,
    });
    const panes = sdf.union(...wx.map((x) => sdf.box([0.34, 0.34, 0.1], 0.02).at(x, winY, CZ0 - 0.06)));
    k.body('windows', panes, {
      color: '#ffb43a', roughness: 0.3, metalness: 0, detail: 0.004, emissive: '#ffb43a', emissiveIntensity: 0.55, maxTriangles: 300,
    });

    // ------------------------------------------------------------- rails
    const post = (x: number, y: number, z: number, h: number) => sdf.capsule([x, y - 0.05, z], [x, y + h, z], 0.05);
    const railPts: Array<[number, number, number]> = [
      [-CX + 0.1, CASTLE_TOP, CZ1 - 0.1], [-CX + 0.1, CASTLE_TOP, -2.55], [-CX + 0.1, CASTLE_TOP, CZ0 + 0.1],
      [-0.45, CASTLE_TOP, CZ0 + 0.1], [0.45, CASTLE_TOP, CZ0 + 0.1],
      [CX - 0.1, CASTLE_TOP, CZ0 + 0.1], [CX - 0.1, CASTLE_TOP, -2.55], [CX - 0.1, CASTLE_TOP, CZ1 - 0.1],
    ];
    const RH = 0.4;
    const railChain = sdf.chain(railPts.map((p) => [p[0], p[1] + RH, p[2], 0.04] as [number, number, number, number]), 0.01);
    // fore deck rail: posts along each side of the fore deck
    const forePosts: Array<[number, number, number]> = [];
    for (const s of [-1, 1]) for (const zz of [1.9, 2.5, 3.1]) forePosts.push([s * (0.94 * Math.sqrt(1 - (zz / 3.15) ** 2) + 0.02), FORE_TOP, zz]);
    const foreRail = (s: number) => sdf.chain([1.9, 2.5, 3.1].map((zz) =>
      [s * (0.94 * Math.sqrt(1 - (zz / 3.15) ** 2) + 0.02), FORE_TOP + 0.32, zz, 0.04] as [number, number, number, number]), 0.01);
    const railsAft = sdf.union(...railPts.map((p) => post(p[0], p[1], p[2], RH)), railChain);
    const railsFore = sdf.union(...forePosts.map((p) => post(p[0], p[1], p[2], 0.32)), foreRail(1), foreRail(-1));
    const railPaint = (x: number, y: number, z: number) => mixRgb(GOLD, PALE, 0.15 + 0.3 * noise.fbm(x * 9, y * 9, z * 9, 2));
    k.body('rails-fore', railsFore.paintFn(railPaint), {
      color: '#d9a04c', roughness: 0.75, metalness: 0, detail: 0.008, maxTriangles: 1200,
    });
    k.body('rails', railsAft.paintFn((x, y, z) => mixRgb(GOLD, PALE, 0.15 + 0.3 * noise.fbm(x * 9, y * 9, z * 9, 2))), {
      color: '#d9a04c', roughness: 0.75, metalness: 0, detail: 0.008, maxTriangles: 1500,
    });

    // --------------------------------------------------------------- spars
    const MAIN_TOP = 5.6, FORE_MTOP = 4.4;
    const MAIN_YARD = 4.78, FORE_YARD = 3.5;
    const SZ = 0.18; // sail corners sit this far in front of the mast
    const mastMain = sdf.capsule([0, DECK - 0.1, MAIN_Z], [0, MAIN_TOP, MAIN_Z], 0.1);
    const mastFore = sdf.capsule([0, FORE_TOP - 0.1, FORE_Z], [0, FORE_MTOP, FORE_Z], 0.1);
    const yard = (y: number, z: number, hw: number) => sdf.union(
      sdf.capsule([-hw, y, z + SZ - 0.05], [hw, y, z + SZ - 0.05], 0.08),
      sdf.sphere(0.13).paintWhere(sdf.sphere(1), GOLD).at(-hw, y, z + SZ - 0.05),
      sdf.sphere(0.13).at(hw, y, z + SZ - 0.05));
    const nestWall = sdf.cylinder(0.5, 0.42, 0.03).subtract(sdf.cylinder(0.4, 0.42, 0).at(0, 0.08, 0));
    const nest = nestWall.at(0, 5.15, MAIN_Z);
    const capMain = sdf.sphere(0.15).at(0, MAIN_TOP + 0.05, MAIN_Z);
    const capFore = sdf.sphere(0.14).at(0, FORE_MTOP + 0.05, FORE_Z);
    const sprit = sdf.cone([0, 1.7, 2.5], [0, 3.15, 4.0], 0.16, 0.08);
    const sparPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 7, y * 12, z * 7, 2);
      return mixRgb(mixRgb(WALNUT, DARKWOOD2, 0.4), BROWN, 0.35 * grain);
    };
    const sparOpts = {
      color: '#6b4226', roughness: 0.8, metalness: 0,
      bump: (x: number, y: number, z: number) => 0.002 * noise.fbm(x * 12, y * 12, z * 12, 2),
      detail: 0.008, maxTriangles: 1400,
    };
    const mastPaint = (x: number, y: number, z: number) => {
      if (Math.abs(x) > 1.6 && y > 3.5 && y < 4.8) return GOLD; // yard end knobs
      if (Math.abs(x) > 1.25 && Math.abs(x) < 1.6 && y > 3.7 && y < 4.0) return GOLD;
      if (y > 4.9 && y < 5.5 && Math.hypot(x, z - MAIN_Z) > 0.3) return mixRgb(GOLD, PALE, 0.2); // nest
      if (y > MAIN_TOP - 0.02 || (y > FORE_MTOP - 0.02 && z > 1.5 && z < 3)) return GOLD;
      return sparPaint(x, y, z);
    };
    k.body('mainmast', sdf.smoothUnion(0.03, mastMain, yard(MAIN_YARD, MAIN_Z, 1.75), nest, capMain).paintFn(mastPaint), sparOpts);
    k.body('foremast', sdf.smoothUnion(0.03, mastFore, yard(FORE_YARD, FORE_Z, 1.4), capFore).paintFn(mastPaint), sparOpts);
    k.body('bowsprit', sprit.paintFn(sparPaint), sparOpts);

    // ---------------------------------------------------------------- sails
    const sailSpec = (zm: number, ycen: number, hw: number, hh: number, R: number) => {
      const zc0 = zm + SZ - Math.sqrt(R * R - hw * hw - hh * hh);
      const sph = (r: number) => sdf.sphere(r).at(0, ycen, zc0);
      const shell = sph(R + 0.03).subtract(sph(R - 0.03));
      const shape = shell.intersect(sdf.box([2 * hw, 2 * hh, 1.6], 0.03).at(0, ycen, zm + SZ + 0.4));
      const zAt = (x: number, y: number) => zc0 + Math.sqrt(R * R - x * x - (y - ycen) ** 2);
      return { shape, zAt };
    };
    const mainSail = sailSpec(MAIN_Z, 3.6, 1.55, 1.2, 5.0);
    const foreSail = sailSpec(FORE_Z, 2.7, 1.2, 0.72, 4.2);

    // skull and crossbones as paint stencils (deep in Z so they cross the curved sail)
    const zS = mainSail.zAt(0, 4.0);
    const band = (x0: number, y0: number, x1: number, y1: number, r: number) => {
      const len = Math.hypot(x1 - x0, y1 - y0);
      const ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
      return sdf.box([len, r * 2, 1.4], r * 0.95).rotateZ(ang).at((x0 + x1) / 2, (y0 + y1) / 2, zS);
    };
    const zcol = (x: number, y: number, r: number) => sdf.capsule([x, y, zS - 0.7], [x, y, zS + 0.7], r);
    const bones = sdf.union(
      band(-0.95, 3.3, 0.95, 4.6, 0.09), band(-0.95, 4.6, 0.95, 3.3, 0.09),
      zcol(-1.0, 3.25, 0.15), zcol(-0.88, 3.21, 0.13), zcol(1.0, 3.25, 0.15), zcol(0.88, 3.21, 0.13),
      zcol(-1.0, 4.55, 0.15), zcol(-0.88, 4.59, 0.13), zcol(1.0, 4.55, 0.15), zcol(0.88, 4.59, 0.13));
    const skullShape = sdf.union(
      sdf.ellipsoid([0.66, 0.6, 1.4]).at(0, 4.3, zS),
      sdf.box([0.62, 0.42, 1.4], 0.12).at(0, 3.78, zS));
    const dark = rgb('#1c1a1e');
    const eyes = sdf.union(zcol(-0.24, 4.3, 0.17), zcol(0.24, 4.3, 0.17));
    const nose = sdf.box([0.12, 0.2, 1.4], 0.03).at(0, 4.04, zS);
    const teeth = sdf.union(...[-0.2, -0.07, 0.07, 0.2].map((x) => sdf.box([0.045, 0.24, 1.4], 0.01).at(x, 3.72, zS)));
    const sailPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 9, y * 9, z * 9, 2);
      let c = mixRgb(SAIL, rgb('#34343a'), 0.4 * grain);
      const hh = z > 1.5 ? 0.72 : 1.2;
      const ycen = z > 1.5 ? 2.7 : 3.6;
      const u = (y - (ycen - hh)) / 0.4;
      if (Math.abs((u % 1) - 0.5) > 0.47) c = mixRgb(c, rgb('#45454c'), 0.7);
      if (Math.abs(y - (ycen + hh)) < 0.05 || Math.abs(y - (ycen - hh)) < 0.05) c = mixRgb(c, rgb('#8a5a35'), 0.4);
      return c;
    };
    const sailOpts = {
      color: '#2a2a2e', roughness: 0.9, metalness: 0, detail: 0.008,
      bump: (x: number, y: number, z: number) => 0.003 * noise.fbm(x * 6, y * 6, z * 6, 3),
      textureDensity: 2, maxTriangles: 2500,
    };
    k.body('sail-main', mainSail.shape.paintFn(sailPaint)
      .paintWhere(bones, BONE).paintWhere(skullShape, BONE)
      .paintWhere(eyes, dark).paintWhere(nose, dark).paintWhere(teeth, dark), sailOpts);
    k.body('sail-fore', foreSail.shape.paintFn(sailPaint), sailOpts);

    // ------------------------------------------------------- jib and flag
    const jibProfile = profile.polygon([[2.5, 4.07], [3.9, 3.2], [2.7, 2.3]]);
    const jib = sdf.extrude(jibProfile, 0.06, 0.015).rotateY(-90);
    k.body('jib', jib.paintFn((x, y, z) => mixRgb(rgb('#3a2c30'), rgb('#4a3a3c'), 0.5 + 0.5 * noise.fbm(x * 8, y * 8, z * 8, 2))), {
      color: '#3a2c30', roughness: 0.9, metalness: 0, detail: 0.006, maxTriangles: 400,
    });
    const flagProfile = profile.polygon([[0.1, 0], [1.1, 0.05], [0.8, 0.28], [1.1, 0.52], [0.1, 0.56]]);
    const flag = sdf.extrude(flagProfile, 0.06, 0.015).rotateY(90).at(0, 4.95, MAIN_Z);
    k.body('flag', flag, {
      color: '#1c1a1e', roughness: 0.9, metalness: 0, detail: 0.006, maxTriangles: 400,
    });

    // --------------------------------------------------------------- ropes
    const rope = (a: [number, number, number], b: [number, number, number]) => sdf.capsule(a, b, 0.04);
    const ropePaint = (x: number, y: number, z: number) =>
      mixRgb(rgb('#c9a86a'), rgb('#a4834c'), 0.5 + 0.5 * noise.fbm(x * 20, y * 20, z * 20, 2));
    const ropeOpts = { color: '#c9a86a', roughness: 0.95, metalness: 0, detail: 0.008, maxTriangles: 800 };
    const shroud = (s: number, zz: number) => rope([0, 4.6, MAIN_Z - 0.2 + (zz - 0.3)], [s * 1.02, RIM + 0.02, zz]);
    k.body('stays', sdf.union(
      rope([0, MAIN_TOP - 0.1, MAIN_Z], [0, FORE_MTOP - 0.05, FORE_Z]),
      rope([0, FORE_MTOP - 0.05, FORE_Z], [0, 3.17, 3.98]),
      rope([0, MAIN_TOP - 0.1, MAIN_Z], [0, CASTLE_TOP + RH, CZ0 + 0.15])).paintFn(ropePaint), ropeOpts);
    k.body('shrouds', sdf.union(shroud(1, 0.25), shroud(-1, 0.25), shroud(1, 0.9), shroud(-1, 0.9)).paintFn(ropePaint), ropeOpts);

    // -------------------------------------------------------- figurehead
    const fh = sdf.smoothUnion(0.1,
      sdf.chain([[0, 1.15, 3.2, 0.22], [0, 1.3, 3.55, 0.21], [0, 1.65, 3.78, 0.2], [0, 2.0, 3.8, 0.22]], 0.08),
      sdf.ellipsoid([0.26, 0.28, 0.34]).at(0, 2.2, 3.9),
      sdf.ellipsoid([0.15, 0.13, 0.24]).at(0, 2.1, 4.18),
      sdf.cone([-0.2, 2.35, 3.82], [-0.34, 2.68, 3.68], 0.08, 0.03),
      sdf.cone([0.2, 2.35, 3.82], [0.34, 2.68, 3.68], 0.08, 0.03));
    const eyeR = (s: number) => sdf.sphere(0.075).at(s * 0.2, 2.3, 4.06);
    k.body('figurehead', fh.paintFn((x, y, z) => {
      const e = Math.min(Math.hypot(x - 0.2, y - 2.3, z - 4.06), Math.hypot(x + 0.2, y - 2.3, z - 4.06));
      if (e < 0.1) return rgb('#1c1a1e');
      const scale = 0.5 + 0.5 * Math.sin(y * 28 + z * 10);
      return mixRgb(GOLD, rgb('#b8853a'), 0.35 * scale);
    }), {
      color: '#d9a04c', roughness: 0.55, metalness: 0.15, detail: 0.006,
      bump: (x, y, z) => 0.002 * Math.sin(y * 28 + z * 10), maxTriangles: 1800,
    });

    // -------------------------------------------------------------- rudder
    const rudder = sdf.box([0.16, 1.4, 0.45], 0.04).at(0, 0.85, -3.6);
    k.body('rudder', rudder.paintFn(sparPaint), sparOpts);

    // ---------------------------------------------------------------- iron
    const ironOpts = { color: '#4a4f55', roughness: 0.5, metalness: 0.8, detail: 0.007, maxTriangles: 1800 };
    const cannons: sdf.Shape[] = [];
    for (const s of [1, -1]) {
      for (const zi of CANNON_Z) {
        const hit = sdf.raycast(hullShape, [s * 3, CANNON_Y, zi], [-s, 0, 0]);
        const x0 = hit ? Math.abs(hit[0]) : 1.25;
        cannons.push(sdf.cylinder(0.13, 0.5, 0.03).rotateZ(90).at(s * (x0 + 0.03), CANNON_Y, zi));
        cannons.push(sdf.cylinder(0.17, 0.09, 0.03).rotateZ(90).at(s * (x0 + 0.26), CANNON_Y, zi));
      }
    }
    k.body('cannons', sdf.union(...cannons).paintFn((x, y, z) => {
      const hole = Math.hypot(y - CANNON_Y, 0) ;
      const grain = 0.5 + 0.5 * noise.fbm(x * 12, y * 12, z * 12, 2);
      return mixRgb(rgb('#4a4f55'), rgb('#5d636a'), grain);
    }), ironOpts);

    const ax = sdf.raycast(hullShape, [3, 1.35, 1.9], [-1, 0, 0]);
    const AX = (ax ? ax[0] : 1.15) + 0.06, AZ = 1.6;
    const anchor = sdf.smoothUnion(0.02,
      sdf.capsule([AX, 0.8, AZ], [AX, 1.5, AZ], 0.05),
      sdf.capsule([AX, 1.36, AZ - 0.3], [AX, 1.36, AZ + 0.3], 0.05),
      sdf.torus(0.08, 0.035).rotateY(90).at(AX, 1.58, AZ),
      sdf.chain([[AX, 1.0, AZ - 0.34, 0.05], [AX, 0.8, AZ - 0.15, 0.05], [AX, 0.8, AZ + 0.15, 0.05], [AX, 1.0, AZ + 0.34, 0.05]], 0.02),
      sdf.cone([AX, 1.0, AZ - 0.3], [AX, 1.18, AZ - 0.4], 0.02, 0.09),
      sdf.cone([AX, 1.0, AZ + 0.3], [AX, 1.18, AZ + 0.4], 0.02, 0.09));
    k.body('anchor', anchor, ironOpts);
  },
});
