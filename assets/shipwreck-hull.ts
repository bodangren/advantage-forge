import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note - shipwreck-hull (map prop, shipwreck/beach maps).
 * Role: background set piece, about 5.2 m long (Z), 2 m wide, lying on its side tilted 30 degrees.
 * Bow +Z. The low (-X) side is buried slightly below y = 0; the high (+X) side is torn open.
 * One idea: a ship silhouette (upswept pointed bow, high flat transom, keel line) with a big
 * torn gap showing chunky ribs, and a tall snapped mast with a ragged sail.
 * Shape language: lofted hull, jagged tears. Palette: oak #8a5a35, dark #5e3d24,
 * grey driftwood #8d7a63, sail #cdbf9c, rope #c8a86b, barnacle #b9b4a4.
 * Materials: hull wood, ribs, spars, sail, loose planks, rope, barnacles.
 */
const TILT = 30;
const LIFT = 0.62;
const tilt = <T extends { rotateZ(d: number): T; at(x: number, y: number, z: number): T }>(s: T): T =>
  s.rotateZ(TILT).at(0, LIFT, 0);
const BROWN = rgb('#8a5a35');
const DARK = rgb('#5e3d24');
const GREY = rgb('#8d7a63');

export default defineAsset({
  name: 'shipwreck-hull',
  description: 'A broken small wooden ship on its side: pointed bow, flat transom, torn planking with ribs, snapped mast, ragged sail, loose planks.',
  detail: 0.01,
  texture: { size: 1024 },
  build(k) {
    // side profile (u = z, v = y): keel line, upswept bow, high transom, curved sheer
    const side = sdf.extrude(profile.polygon([
      [-2.55, 0.95], [-2.55, -0.15], [-2.2, -0.45], [-1.2, -0.6], [0.8, -0.6], [1.7, -0.3],
      [2.35, 0.2], [2.85, 0.85], [2.2, 0.55], [1.0, 0.38], [-0.4, 0.34], [-1.6, 0.52],
    ], { smooth: false }), 4).rotateY(-90);
    // plan profile (u = z, v = x): beam narrows to the bow, nearly square stern
    const plan = sdf.extrude(profile.polygon([
      [-2.55, -0.85], [-1.5, -1.02], [0, -1.05], [1.2, -0.85], [2.2, -0.4], [2.9, 0],
      [2.2, 0.4], [1.2, 0.85], [0, 1.05], [-1.5, 1.02], [-2.55, 0.85],
    ], { smooth: true }), 4).rotateY(-90).rotateZ(90);
    const bilge = sdf.ellipsoid([1.08, 0.95, 4.2]).at(0, 0.3, 0.2);
    const solid = side.smoothIntersect(0.12, plan).smoothIntersect(0.12, bilge);
    const innerCore = solid.round(-0.1);
    const cavity = sdf.union(innerCore, innerCore.at(0, 0.5, 0));
    const shellRaw = solid.subtract(cavity);

    // torn gap: 3 to 4 planks missing on the high (+X) side
    const tear = sdf.ellipsoid([0.7, 0.6, 1.3]).at(1.0, 0.1, -0.2)
      .displace(0.12, (x, y, z) => noise.fbm(x * 4, y * 4, z * 4, 3));
    const tear2 = sdf.ellipsoid([0.4, 0.3, 0.5]).at(0.9, 0.35, 1.5)
      .displace(0.08, (x, y, z) => noise.fbm(x * 6 + 3, y * 6, z * 6, 2));
    const shell = shellRaw.subtract(tear, tear2);

    const ROW = 0.17;
    const seamAt = (y: number) => {
      const f = Math.abs((((y + 1) / ROW) % 1) - 0.5);
      return f > 0.42 ? 1 : 0;
    };
    const woodPaint = (x: number, y: number, z: number) => {
      const row = Math.floor((y + 1) / ROW);
      const grain = 0.5 + 0.5 * noise.fbm(x * 6, y * 24, z * 3, 2);
      let c = mixRgb((row & 1) ? BROWN : rgb('#7b4f2e'), GREY, 0.2 + 0.35 * grain);
      if (seamAt(y)) c = mixRgb(c, DARK, 0.7);
      return c;
    };
    const keel = sdf.box([0.16, 0.16, 4.4], 0.04).at(0, -0.6, -0.2).intersect(solid.round(0.07));
    const hullBody = sdf.smoothUnion(0.04, shell, keel)
      .displace(0.012, (x, y) => 1 - seamAt(y) * 2);
    k.body('hull', tilt(hullBody).paintFn(woodPaint), {
      color: '#8a5a35', roughness: 0.9, metalness: 0, detail: 0.01,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 10, y * 30, z * 10, 2), maxTriangles: 17000,
    });

    // chunky ribs inside the cavity
    const ribShell = innerCore.subtract(solid.round(-0.3));
    const ribZ = [-1.9, -1.2, -0.5, 0.2, 0.9, 1.6];
    const ribs = sdf.union(...ribZ.map((z) => ribShell.intersect(sdf.box([4, 3, 0.14], 0.03).at(0, 0, z))));
    const beam = sdf.box([1.6, 0.1, 0.12], 0.02).at(0, 0.15, -0.5);
    k.body('ribs', tilt(sdf.union(ribs, beam)).paintFn((x, y, z) => mixRgb(DARK, GREY, 0.3 + 0.3 * noise.fbm(x * 8, y * 8, z * 8, 2))), {
      color: '#5e3d24', roughness: 0.9, metalness: 0, detail: 0.012, maxTriangles: 12000, maxError: 0.02,
    });

    // stern rail stub on the transom
    const rail = sdf.box([1.5, 0.1, 0.1], 0.03).at(0, 1.0, -2.45)
      .subtract(sdf.box([0.5, 0.3, 0.3], 0).rotateZ(20).at(0.55, 1.0, -2.45));

    // snapped mast stub (about 2 m), jagged top
    const mastRaw = sdf.cylinder(0.13, 2.0, 0.02).at(0, 0.7, 0.4);
    const snap = sdf.box([0.6, 0.25, 0.6], 0).rotateZ(25).rotateX(-15).at(0, 1.62, 0.4);
    const mast = mastRaw.subtract(snap).displace(0.012, (x, y, z) => noise.fbm(x * 15, y * 15, z * 15, 2));
    const spr = sdf.capsule([0, 0.5, 2.3], [0, 0.9, 3.4], 0.08)
      .subtract(sdf.box([0.3, 0.2, 0.3], 0).rotateX(40).at(0.02, 0.88, 3.4));
    const sparMat = (x: number, y: number, z: number) => mixRgb(GREY, BROWN, 0.4 + 0.4 * noise.fbm(x * 9, y * 9, z * 9, 2));
    k.body('spars', tilt(sdf.union(mast, spr, rail)).paintFn(sparMat), {
      color: '#8d7a63', roughness: 0.9, metalness: 0, detail: 0.01, maxTriangles: 4000,
    });

    // leaning broken yard (world space) and ragged sail with torn tails
    const mtx = -0.82, mty = 2.0 + 0.0, mtz = 0.4;
    const yard = sdf.capsule([mtx, mty + 0.05, mtz - 1.2], [mtx - 0.15, mty - 0.25, mtz + 1.3], 0.06)
      .subtract(sdf.box([0.3, 0.3, 0.2], 0).rotateY(30).at(mtx - 0.15, mty - 0.25, mtz + 1.3));
    k.body('yard', yard.paintFn(sparMat), {
      color: '#8d7a63', roughness: 0.9, metalness: 0, detail: 0.01, maxTriangles: 1200,
    });
    const topY = mty - 0.1;
    const panel = sdf.box([0.07, 0.6, 2.0], 0.02).at(mtx - 0.05, topY - 0.3, mtz).rotateZ(-6);
    const tail = (z: number, len: number, w: number, bendDeg: number, dx: number) =>
      sdf.box([0.06, len, w], 0.02).at(0, -len / 2, 0).rotateZ(bendDeg).rotateX(dx * 6).at(mtx - 0.08 + dx * 0.02, topY - 0.55, z);
    const tails = sdf.union(tail(mtz - 0.75, 0.85, 0.4, -10, 1), tail(mtz - 0.2, 0.55, 0.38, -20, -1),
      tail(mtz + 0.35, 1.0, 0.42, -8, 1), tail(mtz + 0.85, 0.65, 0.34, -24, -1));
    const sail = sdf.smoothUnion(0.03, panel, tails)
      .displace(0.025, (x, y, z) => noise.fbm(x * 3, y * 3, z * 3, 2));
    k.body('sail', sail.paintFn((x, y, z) => mixRgb(rgb('#cdbf9c'), rgb('#9c8a68'), 0.4 * (0.5 + 0.5 * noise.fbm(x * 6, y * 6, z * 6, 3)) + 0.5 * Math.max(0, 1.4 - y))), {
      color: '#cdbf9c', roughness: 0.95, metalness: 0, detail: 0.01, maxTriangles: 4500,
    });

    // loose planks beside the wreck
    const plank = (x: number, y: number, z: number, len: number, ry: number, rz: number) =>
      sdf.box([0.2, 0.07, len], 0.02).rotateZ(rz).rotateY(ry).at(x, y, z);
    const planks = sdf.union(
      plank(2.0, 0.05, 0.6, 1.6, 15, 0),
      plank(2.3, 0.07, -0.6, 1.2, -25, 4),
      plank(-2.0, 0.05, 1.0, 1.4, 70, 0),
      plank(1.9, 0.16, -1.9, 1.1, 40, 12));
    k.body('planks', planks.paintFn((x, y, z) => mixRgb(BROWN, GREY, 0.3 + 0.4 * (0.5 + 0.5 * noise.fbm(x * 8, y * 8, z * 8, 2)))), {
      color: '#8a5a35', roughness: 0.9, metalness: 0, detail: 0.01, maxTriangles: 2500,
    });

    // rope coil and trailing line
    const coil = sdf.torus(0.17, 0.045).at(2.1, 0.05, 1.9);
    const trail = sdf.chain([[0, 0.5, 2.3, 0.03], [0.3, 0.8, 2.7, 0.03], [0.6, 0.5, 3.0, 0.03], [0.9, 0.2, 3.2, 0.03]], 0.02);
    k.body('rope', sdf.union(coil, tilt(trail)), {
      color: '#c8a86b', roughness: 0.95, metalness: 0, detail: 0.012, maxTriangles: 1500,
    });

    // barnacles on the low side, placed on the hull surface
    const bn = [];
    for (let i = 0; i < 34; i++) {
      const a = (1.05 + noise.random(i, 1, 2) * 0.75) * Math.PI;
      const z = -2.0 + noise.random(i, 3, 4) * 3.6;
      const p = sdf.surfacePoint(solid, [Math.cos(a) * 1.4, Math.sin(a) * 1.2 + 0.2, z], -0.01);
      bn.push(sdf.sphere(0.035 + 0.03 * noise.random(i, 5, 6)).at(p[0], p[1], p[2]));
    }
    k.body('barnacles', tilt(sdf.union(...bn)).paintFn(() => rgb('#b9b4a4')), {
      color: '#b9b4a4', roughness: 0.95, metalness: 0, detail: 0.013, maxTriangles: 2500,
    });
  },
});
