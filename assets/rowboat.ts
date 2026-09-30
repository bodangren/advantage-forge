import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note - rowboat (vehicles/water/rowboat).
 * Role: dock/lake prop, read at 128 px as a chunky oak boat with a white band.
 * Size: 2.4 m long (Z), 1.0 m wide, 0.6 m at the raised bow; keel on y = 0, bow +Z.
 * One idea: a fat rounded hull with a lifted bow, white gunwale band, oars angled out.
 * Shape language: round hull, square thwarts. Palette: oak #b5814a, brown #8a5a35,
 * walnut #6b4226, pale #c9a06a, white band #f0ece0, iron #4a4f55, rope #c8a86b.
 * Materials: wood, white paint, iron, rope. Focal point: bow with ring and rope.
 * Rig: none.
 */
const OAK = rgb('#b5814a');
const BROWN = rgb('#8a5a35');
const WALNUT = rgb('#6b4226');
const PALE = rgb('#c9a06a');
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export default defineAsset({
  name: 'rowboat',
  description: 'A chunky oak rowboat with a raised bow, white gunwale band, two thwarts, two oars, coiled rope and an iron bow ring.',
  detail: 0.008,
  texture: { size: 1024 },
  build(k) {
    const cut = (top: number) => sdf.box([3, top, 4], 0).at(0, top / 2, 0);
    const outerMain = sdf.ellipsoid([0.55, 0.42, 1.25]).at(0, 0.38, 0);
    const outerBow = sdf.ellipsoid([0.3, 0.3, 0.5]).at(0, 0.55, 1.05);
    const outer = sdf.smoothUnion(0.08, outerMain, outerBow).intersect(cut(0.62));
    const inner = sdf.smoothUnion(0.05,
      sdf.ellipsoid([0.47, 0.36, 1.17]).at(0, 0.5, 0),
      sdf.ellipsoid([0.24, 0.24, 0.44]).at(0, 0.6, 1.0));
    const keel = sdf.box([0.08, 0.1, 2.2], 0.02).at(0, 0.04, 0).intersect(outerMain.round(0.05));
    const deck = sdf.box([0.5, 0.05, 0.4], 0.02).at(0, 0.4, 0.98).intersect(outer.round(0.02));
    const hullShell = sdf.smoothUnion(0.05, outer.subtract(inner), keel)
      .union(deck).intersect(cut(0.62)).round(0.008);
    const thwart = (z: number) => sdf.box([0.9, 0.05, 0.16], 0.015).at(0, 0.4, z).intersect(outer.round(0.02));
    const wood = sdf.smoothUnion(0.02, hullShell, thwart(0.3), thwart(-0.4));

    const bandTop = 0.62, bandBot = 0.56;
    const A = rgb('#b5814a'), B2 = rgb('#a06e3e');
    const woodPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 8, y * 30, z * 8, 2);
      const row = Math.floor((y + 0.02) / 0.09);
      let c = mixRgb((row & 1) ? B2 : A, PALE, 0.12 * grain);
      const seam = Math.abs((((y + 0.02) / 0.09) % 1) - 0.5);
      if (seam > 0.47) c = mixRgb(c, WALNUT, 0.6);
      c = mixRgb(c, WALNUT, 0.4 * clamp01(1 - y / 0.1));
      if (y > 0.3 && Math.abs(x) < 0.5 && y < 0.45) c = mixRgb(c, PALE, 0.15);
      return c;
    };
    k.body('hull', wood.paintFn(woodPaint), {
      color: '#b5814a', roughness: 0.8, metalness: 0, detail: 0.008,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 10, y * 40, z * 10, 2) + 0.003 * (Math.floor((y + 0.02) / 0.09) & 1),
      maxTriangles: 5800,
    });

    // white painted band along the gunwale (thin shell of the hull top)
    const band = hullShell.round(0.006).intersect(sdf.box([2, bandTop - bandBot, 4], 0).at(0, (bandTop + bandBot) / 2, 0));
    k.body('band', band.paintFn(() => rgb('#efe6d2')), {
      color: '#efe6d2', roughness: 0.7, metalness: 0, detail: 0.008, maxTriangles: 2000,
    });

    // oars
    const oar = (s: number) => {
      // oars shipped inside the boat: lying along Z on the thwarts, blades toward the stern
      const yawD = 6 * Math.PI / 180, pitD = -3 * Math.PI / 180;
      const d = [s * Math.sin(yawD), -Math.sin(pitD), -Math.cos(yawD) * Math.cos(pitD)];
      const P = [s * 0.18, 0.5, 0.95];
      const pt = (t: number): [number, number, number] => [P[0] + d[0] * t, P[1] + d[1] * t, P[2] + d[2] * t];
      const shaft = sdf.capsule(pt(0), pt(1.9), 0.045);
      const yaw = Math.atan2(d[0], d[2]) * 180 / Math.PI;
      const pitch = Math.asin(d[1]) * 180 / Math.PI;
      const c = pt(1.7);
      const bl = sdf.box([0.14, 0.035, 0.4], 0.015).rotateX(pitch).rotateY(yaw).at(c[0], c[1], c[2]);
      return sdf.smoothUnion(0.02, shaft, bl);
    };
    const oars = sdf.union(oar(1), oar(-1));
    k.body('oars', oars.paintFn((x, y, z) => mixRgb(PALE, OAK, 0.3 + 0.3 * noise.fbm(x * 9, y * 9, z * 9, 2))), {
      color: '#c9a06a', roughness: 0.8, metalness: 0, detail: 0.007, maxTriangles: 1500,
    });

    // rope coil on the bow deck
    const rope = sdf.torus(0.14, 0.04).at(0, 0.48, 0.98);
    k.body('rope', rope.paintFn((x, y, z) => mixRgb(rgb('#c8a86b'), rgb('#9a7c4a'), 0.5 + 0.5 * Math.sin(Math.atan2(z - 0.98, x) * 14))), {
      color: '#c8a86b', roughness: 0.9, metalness: 0, detail: 0.005, maxTriangles: 1200,
    });

    // iron ring at bow tip
    const ring = sdf.torus(0.05, 0.02).rotateX(90).at(0, 0.42, 1.27);
    const plate = sdf.box([0.08, 0.08, 0.06], 0.01).at(0, 0.42, 1.22);
    k.body('iron', sdf.union(ring, plate), {
      color: '#4a4f55', roughness: 0.5, metalness: 0.8, detail: 0.004, maxTriangles: 800,
    });
  },
});
