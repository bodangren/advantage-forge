import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note - fishing-boat (vehicles/water/fishing-boat).
 * Role: harbor prop, reads at 128 px as a fat blue boat with a white band and a furled sail.
 * Size: 3.2 m long (Z), 1.3 m wide, gunwale 0.75 m, mast 1.9 m; keel on y = 0, bow +Z.
 * One idea: a chunky blue hull with a white band, a lifted bow and a fat furled sail.
 * Shape: round hull, square thwarts and crates. Palette: blue #2f6aa8, white #efe6d2,
 * oak #b5814a, brown #8a5a35, walnut #6b4226, iron #4a4f55, rope #c8a86b, fish #c9d3da.
 * Materials: wood, paint (blue/white), sail cloth, rope net, fish, iron, lantern glow.
 * Focal point: sail on the boom and the lantern. Rig: none.
 */
const OAK = rgb('#b5814a');
const BROWN = rgb('#8a5a35');
const WALNUT = rgb('#6b4226');
const PALE = rgb('#c9a06a');
const BLUE = rgb('#2f6aa8');
const WHITE = rgb('#efe6d2');
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const MAST_Z = 0.45;

export default defineAsset({
  name: 'fishing-boat',
  description: 'A chunky blue fishing boat with a white band, furled sail on a boom, net, fish crates, cork floats and a lantern.',
  reference: 'docs/vehicle-mockups/fishing-boat-mock.jpg',
  detail: 0.008,
  texture: { size: 1024 },
  build(k) {
    const cut = (top: number) => sdf.box([4, top, 6], 0).at(0, top / 2, 0);
    const main = sdf.ellipsoid([0.65, 0.5, 1.6]).at(0, 0.45, 0).intersect(cut(0.75));
    const outer = main;
    const innerMain = sdf.ellipsoid([0.57, 0.44, 1.52]).at(0, 0.55, 0);
    const inner = innerMain;
    const keel = sdf.box([0.2, 0.1, 1.8], 0.03).at(0, 0.03, 0);
    const shell = sdf.smoothUnion(0.05, outer.subtract(inner), keel).intersect(cut(0.95)).intersect(sdf.box([4, 3, 6]).at(0, 1.5 + 0, 0));
    const thwart = (z: number) => sdf.box([1.1, 0.07, 0.22], 0.02).at(0, 0.5, z).intersect(outer.round(0.02));
    const sternSeat = sdf.box([1.0, 0.1, 0.3], 0.02).at(0, 0.5, -1.3).intersect(outer.round(0.02));
    const prow = sdf.box([0.34, 0.24, 0.24], 0.04).rotateX(-12).at(0, 0.8, 1.2);
    const sternBlock = sdf.box([0.7, 0.2, 0.16], 0.03).at(0, 0.83, -1.2);
    const hull = sdf.smoothUnion(0.02, shell, thwart(MAST_Z), thwart(-0.55), sternSeat, prow, sternBlock).round(0.006);

    const inside = (x: number, y: number, z: number) =>
      (x / 0.57) ** 2 + ((y - 0.55) / 0.44) ** 2 + (z / 1.52) ** 2 < 1.03;
    const R = 0.09;
    const hullPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 8, y * 30, z * 8, 2);
      const row = Math.floor((y + 0.02) / 0.09);
      if (!inside(x, y, z) && y > 0.54 && y < 0.7 && Math.abs(x) > 0.25) return WHITE;
      if (!inside(x, y, z) && y < 0.54) {
        return mixRgb(BLUE, rgb('#1f4f88'), 0.2 * grain + 0.4 * clamp01(1 - y / 0.15));
      }
      let c = mixRgb((row & 1) ? rgb('#a06e3e') : OAK, PALE, 0.12 * grain);
      const seam = Math.abs((((y + 0.02) / R) % 1) - 0.5);
      if (seam > 0.46) c = mixRgb(c, WALNUT, 0.6);
      if (y > 0.71) c = mixRgb(BROWN, PALE, 0.15 * grain);
      if (inside(x, y, z)) c = mixRgb(c, WALNUT, 0.35 * clamp01(1 - (y - 0.1) / 0.2));
      return c;
    };
    k.body('hull', hull.paintFn(hullPaint), {
      color: '#b5814a', roughness: 0.8, metalness: 0, detail: 0.014, maxError: 0.004,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 10, y * 40, z * 10, 2) + 0.003 * (Math.floor((y + 0.02) / R) & 1),
      maxTriangles: 5500,
    });

    // mast and boom
    const mast = sdf.capsule([0, 0.3, MAST_Z], [0, 1.9, MAST_Z], 0.06);
    const boom = sdf.capsule([0, 1.25, MAST_Z - 0.75], [0, 1.25, MAST_Z + 0.75], 0.05);
    const crossbar = sdf.capsule([-0.25, 1.25, MAST_Z], [0.25, 1.25, MAST_Z], 0.055);
    k.body('mast', sdf.smoothUnion(0.02, mast, boom, crossbar), {
      color: '#8a5a35', roughness: 0.8, metalness: 0, detail: 0.006, maxTriangles: 900,
    });
    // furled sail wrapped on the boom
    const sail = sdf.cylinder(0.14, 1.1, 0.05).rotateX(90).at(0, 1.25, MAST_Z);
    k.body('sail', sail.paintFn((x, y, z) => mixRgb(rgb('#efe3c8'), rgb('#cdbf9f'), 0.5 + 0.5 * Math.sin(z * 30 + Math.atan2(y - 1.25, x) * 3))), {
      color: '#efe3c8', roughness: 0.9, metalness: 0, detail: 0.008, maxTriangles: 1200,
      bump: (x, y, z) => 0.004 * Math.sin(z * 40),
    });

    // lantern on the mast (bracket + glass glow)
    const bracket = sdf.capsule([0, 1.8, MAST_Z], [0, 1.8, MAST_Z + 0.16], 0.04);
    const cap = sdf.cylinder(0.075, 0.04, 0.01).at(0, 1.62, MAST_Z + 0.2);
    k.body('lantern-iron', sdf.smoothUnion(0.01, bracket, cap, sdf.cylinder(0.075, 0.03, 0.01).at(0, 1.4, MAST_Z + 0.2)), {
      color: '#4a4f55', roughness: 0.5, metalness: 0.8, detail: 0.004, maxTriangles: 600,
    });
    k.body('lantern', sdf.capsule([0, 1.44, MAST_Z + 0.2], [0, 1.58, MAST_Z + 0.2], 0.06), {
      color: '#ffd27a', emissive: '#ffb84a', emissiveIntensity: 0.6, roughness: 0.3, metalness: 0, detail: 0.004, maxTriangles: 500,
    });

    // net heap in the stern: rounded box with cross lines
    const net = sdf.box([0.85, 0.3, 0.6], 0.12).at(0, 0.4, -1.0);
    k.body('net', net.paintFn((x, y, z) => {
      const a = Math.abs(((x * 11 + y * 4) % 1)), b = Math.abs(((z * 11 - y * 4) % 1));
      const line = Math.min(Math.abs(a - 0.5), Math.abs(b - 0.5)) < 0.09 ? 0 : 1;
      return line ? mixRgb(rgb('#c8a86b'), rgb('#9a7c4a'), 0.6) : rgb('#d8bc80');
    }), { color: '#c8a86b', roughness: 0.9, metalness: 0, detail: 0.006, maxTriangles: 1200 });

    // fish crates
    const crate = (x: number, z: number) => sdf.box([0.4, 0.22, 0.5], 0.02).subtract(sdf.box([0.32, 0.2, 0.42], 0.01).at(0, 0.06, 0)).at(x, 0.27, z);
    k.body('crates', sdf.union(crate(0.25, 0), crate(-0.25, 0)).paintFn((x, y, z) => mixRgb(PALE, OAK, 0.3 + 0.3 * noise.fbm(x * 9, y * 20, z * 9, 2))), {
      color: '#c9a06a', roughness: 0.8, metalness: 0, detail: 0.006, maxTriangles: 1400,
    });
    const fish = (x: number, z: number) => sdf.union(
      sdf.ellipsoid([0.06, 0.04, 0.16]).at(x - 0.08, 0.34, z + 0.02).rotateY(15),
      sdf.ellipsoid([0.06, 0.04, 0.16]).at(x + 0.07, 0.34, z - 0.03).rotateY(-20));
    k.body('fish', sdf.union(fish(0.25, 0), fish(-0.25, 0)), {
      color: '#c9d3da', roughness: 0.35, metalness: 0.3, detail: 0.005, maxTriangles: 800,
    });

    // cork floats on the +X gunwale
    const floatAt = (z: number) => sdf.sphere(0.085).at(0.55, 0.82, z);
    k.body('floats', sdf.union(floatAt(-0.55), floatAt(0), floatAt(0.55)), {
      color: '#d9a35c', roughness: 0.9, metalness: 0, detail: 0.005, maxTriangles: 700,
    });
  },
});
