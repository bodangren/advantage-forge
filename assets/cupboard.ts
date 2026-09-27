import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — kitchen cupboard (props/furniture/cupboard).
 *
 * Role: background furniture in a cozy chibi tavern; must read at 128 px sprite.
 * Size: 1.0 m wide, 0.45 m deep, 1.4 m tall, stands on y = 0, faces +Z.
 * One idea: a honey-oak cupboard — chunky closed cabinet with two round-edged
 *   doors and iron ring pulls below, an open plate rack above where cream
 *   plates stand on edge behind a scalloped rail and pewter mugs hang on hooks.
 * Shape language: square dominant (cabinet box, posts, shelves), round
 *   secondary (ring pulls, plates, mugs, scallops).
 * Palette: honey oak #b5814a dominant, warm brown #8a5a35 + walnut #6b4226
 *   secondary, pale cut wood #c9a06a light; pewter #9aa3ad metal accent,
 *   cream plaster #f0e4cc ceramic, one fabric-red #9a4a3a plate band.
 * Materials: wood (rough 0.8), worn iron (rough 0.5, metal 0.7),
 *   pewter (rough 0.45, metal 0.8), ceramic (rough 0.35).
 * Detail: primary = carcass + doors + countertop + open rack; secondary =
 *   ring pulls, hooks, mugs, plates, scalloped rail, plank seams; tertiary =
 *   grain in bump. Focal point: the open rack (light plates vs warm wood).
 * Rig/animation: none (static prop).
 */

const HONEY = rgb('#b5814a');
const BROWN = rgb('#8a5a35');
const PALE = rgb('#c9a06a');
const WALNUT = rgb('#6b4226');
const PLASTER = rgb('#f0e4cc');
const CREAM_SHADOW = rgb('#d9c9a8');
const RED = rgb('#9a4a3a');
const IRON = '#3d4047';
const PEWTER = '#9aa3ad';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export default defineAsset({
  name: 'cupboard',
  description:
    'Honey-oak kitchen cupboard: two-door cabinet with iron ring pulls below, open rack above with cream plates standing on edge behind a scalloped rail and pewter mugs hanging on hooks.',
  detail: 0.007,
  reference: 'docs/item-mockups/cupboard-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const grainBump = (amp = 0.0016) => (x: number, y: number, z: number) =>
      amp * noise.fbm(x * 24, y * 4, z * 24, 2);

    // ------------------------------------------------------------- cabinet
    // Plinth + carcass: one wood body, dark base, grain in bump.
    const cabinetShape = sdf.union(
      sdf.box([0.94, 0.06, 0.42], 0.012).at(0, 0.03, 0),
      sdf.box([0.92, 0.64, 0.4], 0.014).at(0, 0.38, 0),
    );
    const cabinetPaint = (x: number, y: number, z: number) => {
      const board = 0.5 + 0.5 * noise.fbm(x * 7, y * 7, z * 7, 2);
      const grain = 0.5 + 0.5 * noise.fbm(x * 23, y * 4, z * 23, 2);
      let c = mixRgb(HONEY, PALE, 0.08 + 0.16 * board);
      c = mixRgb(c, WALNUT, 0.12 * grain);
      c = mixRgb(c, WALNUT, 0.5 * clamp01((0.14 - y) / 0.14)); // grounded base
      // Horizontal plank seams on the side faces.
      if (Math.abs(x) > 0.43) {
        const fy = (y - 0.06) / 0.21 - Math.floor((y - 0.06) / 0.21);
        const seam = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * fy), 24);
        c = mixRgb(c, WALNUT, 0.3 * seam);
      }
      return c;
    };
    k.body('cabinet', cabinetShape.paintFn(cabinetPaint), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.011,
      bump: grainBump(),
      maxTriangles: 1500,
    });

    // ------------------------------------------------------------- countertop
    const counterShape = sdf.box([1.0, 0.06, 0.45], 0.014).at(0, 0.73, 0);
    const counterPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 23, y * 4, z * 23, 2);
      let c = mixRgb(HONEY, PALE, 0.28);
      c = mixRgb(c, WALNUT, 0.1 * grain);
      if (y > 0.745) {
        c = mixRgb(c, PALE, 0.55); // sun-lit worktop
        const fx = (x + 0.5) / 0.2 - Math.floor((x + 0.5) / 0.2);
        const seam = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * fx), 24);
        c = mixRgb(c, WALNUT, 0.4 * seam); // boards run front to back
      }
      c = mixRgb(c, WALNUT, 0.3 * clamp01((0.705 - y) / 0.02)); // shaded underside line
      return c;
    };
    k.body('counter', counterShape.paintFn(counterPaint), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.008,
      bump: grainBump(),
      maxTriangles: 600,
    });

    // ------------------------------------------------------------- upper rack
    // Side panels, back panel, middle shelf, top cap: one wood body.
    const sidePanel = sdf.box([0.06, 0.595, 0.4], 0.01).at(-0.45, 1.0775, 0);
    const upperShape = sdf.union(
      sidePanel.mirror('x', 0),
      sdf.box([0.84, 0.595, 0.045], 0.008).at(0, 1.0775, -0.1775), // back
      sdf.box([0.84, 0.04, 0.4], 0.008).at(0, 1.08, 0), // middle shelf
      sdf.box([1.0, 0.045, 0.44], 0.012).at(0, 1.3775, 0), // top cap
    );
    const upperPaint = (x: number, y: number, z: number) => {
      const board = 0.5 + 0.5 * noise.fbm(x * 7, y * 7, z * 7, 2);
      const grain = 0.5 + 0.5 * noise.fbm(x * 23, y * 4, z * 23, 2);
      let c = mixRgb(HONEY, PALE, 0.08 + 0.16 * board);
      c = mixRgb(c, WALNUT, 0.12 * grain);
      // Shaded niche interior: deeper toward the back and sides.
      if (y > 0.77) {
        c = mixRgb(c, BROWN, 0.5 * clamp01((-0.11 - z) / 0.08));
        c = mixRgb(c, BROWN, 0.32 * clamp01((Math.abs(x) - 0.4) / 0.05));
      }
      // Pale top cap.
      if (y > 1.36) c = mixRgb(c, PALE, 0.55);
      // Side panel horizontal board seams.
      if (Math.abs(x) > 0.415 && y > 0.77) {
        const fy = (y - 0.76) / 0.19 - Math.floor((y - 0.76) / 0.19);
        const seam = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * fy), 24);
        c = mixRgb(c, WALNUT, 0.34 * seam);
      }
      // Back panel vertical board seams.
      if (y > 0.77 && z > -0.17 && Math.abs(x) < 0.415) {
        const bx = (x + 0.42) / 0.21 - Math.floor((x + 0.42) / 0.21);
        const seam = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * bx), 24);
        c = mixRgb(c, WALNUT, 0.3 * seam);
      }
      return c;
    };
    k.body('upper', upperShape.paintFn(upperPaint), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.011,
      bump: grainBump(),
      maxTriangles: 1600,
    });

    // ------------------------------------------------------------- scalloped rail
    let railShape = sdf.box([0.84, 0.12, 0.035], 0.008).at(0, 1.16, 0.1825);
    for (const px of [-0.26, 0, 0.26]) {
      railShape = railShape.subtract(sdf.cylinder(0.03, 0.08).rotateX(90).at(px, 1.21, 0.1825));
    }
    k.body('rail', railShape.paintFn((x, y, z) => mixRgb(HONEY, PALE, 0.15 + 0.1 * (0.5 + 0.5 * noise.fbm(x * 20, y * 6, z * 20, 2)))), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.008,
      bump: grainBump(),
      maxTriangles: 450,
    });

    // ------------------------------------------------------------- doors
    const door = sdf.box([0.43, 0.56, 0.03], 0.012).at(-0.225, 0.37, 0.21);
    const doorPaint = (x: number, y: number, z: number) => {
      const board = 0.5 + 0.5 * noise.fbm(x * 9, y * 9, z * 9, 2);
      const grain = 0.5 + 0.5 * noise.fbm(x * 25, y * 4, z * 25, 2);
      let c = mixRgb(HONEY, PALE, 0.1 + 0.12 * board);
      c = mixRgb(c, WALNUT, 0.1 * grain);
      const lx = Math.abs(x) - 0.225; // distance from door centre
      const dxp = 0.145 - Math.abs(lx); // >0 inside panel rectangle
      const dyp = Math.min(y - 0.16, 0.58 - y);
      if (z > 0.216 && dxp > -0.006 && dyp > -0.006) {
        const nearEdge = Math.min(dxp, dyp);
        if (nearEdge < 0.016) {
          c = mixRgb(c, WALNUT, 0.55); // routed groove around the panel
        } else {
          c = mixRgb(c, PALE, 0.24); // raised panel face
        }
      }
      c = mixRgb(c, WALNUT, 0.3 * clamp01((Math.abs(lx) - 0.185) / 0.03)); // door edge
      return c;
    };
    k.body('doors', door.mirror('x', 0).paintFn(doorPaint), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.008,
      paintWeight: 2,
      bump: (x, y, z) => 0.0014 * noise.fbm(x * 26, y * 4, z * 26, 2),
      maxTriangles: 900,
    });

    // ------------------------------------------------------------- iron
    // Ring pulls (peg + hanging ring) on the doors, hooks under the shelf.
    const pegZ = (x: number, y: number, z: number) =>
      sdf.cylinder(0.009, 0.03).rotateX(90).at(x, y, z);
    const ring = (x: number, y: number, z: number) =>
      sdf.torus(0.03, 0.007).rotateX(90).at(x, y, z);
    const pull = sdf.union(pegZ(-0.075, 0.54, 0.234), ring(-0.075, 0.512, 0.246));
    const hook = (px: number) => sdf.cylinder(0.011, 0.08).at(px, 1.02, 0.13);
    k.body('iron', sdf.union(pull.mirror('x', 0), hook(-0.26), hook(0), hook(0.26)), {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.0045,
      maxTriangles: 1000,
    });

    // ------------------------------------------------------------- pewter mugs
    // Each mug hangs by its handle loop over an iron hook; centre mug swings.
    const mug = (tilt: number) =>
      sdf
        .union(
          sdf.cylinder(0.043, 0.1, 0.006).at(0.028, -0.05, 0),
          sdf.torus(0.026, 0.0075).rotateX(90),
        )
        .rotateZ(tilt);
    const mugs = sdf.union(
      mug(0).at(-0.26, 0.985, 0.13),
      mug(4).at(0, 0.985, 0.13),
      mug(0).at(0.26, 0.985, 0.13),
    );
    k.body('pewter-mugs', mugs, {
      color: PEWTER,
      roughness: 0.45,
      metalness: 0.8,
      detail: 0.005,
      maxTriangles: 1300,
    });

    // ------------------------------------------------------------- plates
    // Three plates standing on edge behind the rail (faces toward +Z, leaning
    // back), plus a small stack lying on the countertop in the lower niche.
    const PLATE_R = 0.11;
    const PLATE_Y = 1.209; // rests on the middle shelf (top y = 1.10)
    const standing = (px: number) =>
      sdf.cylinder(PLATE_R, 0.024).rotateX(82).at(px, PLATE_Y, 0.13);
    const platesShape = sdf.union(standing(-0.26), standing(0), standing(0.26));
    const platePaint = (x: number, y: number, z: number) => {
      let c = PLASTER;
      c = mixRgb(c, CREAM_SHADOW, 0.4 * clamp01((1.16 - y) / 0.12)); // soft lower shade
      const rC = Math.hypot(x, y - PLATE_Y); // centre plate, faces +Z
      const rS = Math.hypot(Math.abs(x) - 0.26, y - PLATE_Y); // side plates
      if (Math.abs(x) < 0.13) {
        if (rC > 0.074 && rC < 0.103) c = RED; // fabric-red band
      } else if (rS < 0.115 && rS > 0.09) {
        c = mixRgb(c, CREAM_SHADOW, 0.35); // side plate rim ring
      }
      return c;
    };
    k.body('plates', platesShape.paintFn(platePaint), {
      color: '#f0e4cc',
      roughness: 0.35,
      metalness: 0,
      detail: 0.007,
      textureDensity: 2,
      maxTriangles: 1300,
    });

    // A small stack of plates lying on the countertop in the lower niche.
    const stackShape = sdf.union(
      sdf.cylinder(0.09, 0.012, 0.004).at(0.216, 0.7665, -0.02),
      sdf.cylinder(0.09, 0.012, 0.004).rotateY(14).at(0.226, 0.7905, -0.014),
      sdf.cylinder(0.09, 0.012, 0.004).rotateY(-12).at(0.218, 0.8145, -0.024),
      sdf.cylinder(0.09, 0.012, 0.004).rotateY(24).at(0.224, 0.8385, -0.018),
    );
    k.body('plate-stack', stackShape.paintFn((x, y, z) => mixRgb(PLASTER, CREAM_SHADOW, 0.3)), {
      color: '#f0e4cc',
      roughness: 0.35,
      metalness: 0,
      detail: 0.006,
      maxTriangles: 700,
    });
  },
});
