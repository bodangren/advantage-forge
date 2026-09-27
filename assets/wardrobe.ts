import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Sdf } from '../src/index.js';

/**
 * Design note — tavern wardrobe (props/furniture/wardrobe).
 *
 * Role: a tall closed cupboard in the warm tavern. It must read at 128 px.
 * Size: 1.1 m wide, 0.55 m deep, 1.8 m tall. It stands on y = 0 and faces +Z.
 * One idea: two tall carved doors under an arched crown, with iron rings as the accent.
 * Shape language: a square body, round bevels, turned feet, and an arched crest.
 * Palette: honey oak #b5814a, warm brown #8a5a35, pale cut wood #c9a06a,
 *   dark walnut #6b4226. Pewter rings #9aa3ad are the cool accent.
 * Materials: wood (roughness 0.82), pewter (roughness 0.42, metalness 0.8).
 * Detail: carcass, crown, feet, two doors, carved panels, ring pulls, hinges.
 * The iron rings are the focal point. No rig.
 */

const HONEY = rgb('#b5814a');
const PALE = rgb('#c9a06a');
const BROWN = rgb('#8a5a35');
const WALNUT = rgb('#6b4226');
const SHADOW = rgb('#3d2414');
const PEWTER = rgb('#9aa3ad');
const PEWTER_DARK = rgb('#5c656e');
const PEWTER_LIGHT = rgb('#d4dce3');

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

// Envelope: crown is the widest and deepest mass. The crest peak is the top.
const BODY_W = 0.94;
const BODY_D = 0.38;
const BODY_BOTTOM = 0.13;
const BODY_TOP = 1.55;
const BODY_H = BODY_TOP - BODY_BOTTOM;
const BODY_Y = (BODY_TOP + BODY_BOTTOM) / 2;

const PLINTH_W = 0.96;
const PLINTH_D = 0.4;
const PLINTH_H = 0.052;
const PLINTH_Y = 0.114; // spans 0.088..0.140, overlaps the carcass

const DOOR_W = 0.4;
const DOOR_H = 1.22;
const DOOR_T = 0.038;
const DOOR_X = 0.21;
const DOOR_Y = 0.84;
const DOOR_Z = 0.203; // front face at 0.222
const DOOR_FRONT = DOOR_Z + DOOR_T / 2;

const PANEL_W = 0.3;
const PANEL_H = 0.98;
const PANEL_BORDER = 0.032;

const FOOT_X = 0.42;
const FOOT_Z = 0.15;

/** Tombstone outline, counterclockwise, centered on the origin. */
function archPoints(w: number, h: number): [number, number][] {
  const r = w * 0.5;
  const y0 = -h * 0.5;
  const yArc = h * 0.5 - r;
  const pts: [number, number][] = [
    [-r, y0],
    [r, y0],
  ];
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const theta = (Math.PI * i) / steps;
    pts.push([r * Math.cos(theta), yArc + r * Math.sin(theta)]);
  }
  return pts;
}

function archedPlate(w: number, h: number, depth: number, edge: number): Sdf {
  return sdf.extrude(profile.polygon(archPoints(w, h)), depth, edge);
}

/** Raised arched border. The cutter opens the middle so the field shows through. */
function panelFrame(): Sdf {
  const outer = archedPlate(PANEL_W, PANEL_H, 0.024, 0.006);
  const inner = archedPlate(PANEL_W - PANEL_BORDER * 2, PANEL_H - PANEL_BORDER * 2, 0.05, 0.004);
  return outer.subtract(inner);
}

/** Short lathe-turned foot: wide pad, narrow neck, visible bulb. */
function turnedFoot(): Sdf {
  const pad = sdf.cylinder(0.1, 0.022, 0.005).at(0, 0.011, 0);
  const spindle = sdf.revolve(
    profile.polygon(
      [
        [0.0, 0.018],
        [0.055, 0.022],
        [0.038, 0.036],
        [0.062, 0.054],
        [0.036, 0.072],
        [0.048, 0.098],
        [0.0, 0.104],
      ],
      { smooth: true, samples: 8 },
    ),
  );
  return pad.smoothUnion(0.008, spindle);
}

function woodBase(x: number, y: number, z: number) {
  const patch = 0.5 + 0.5 * noise.fbm(x * 3.2, y * 3.2, z * 3.2, 2);
  const grain = 0.5 + 0.5 * noise.fbm(x * 16, y * 2.4, z * 16, 2);
  let c = mixRgb(HONEY, PALE, 0.06 + 0.18 * patch);
  c = mixRgb(c, BROWN, 0.16 * grain);
  c = mixRgb(c, WALNUT, 0.12 * (0.5 + 0.5 * noise.fbm(x * 8, y * 1.5, z * 8, 2)));
  return c;
}

const grainBump = (x: number, y: number, z: number) => 0.0018 * noise.fbm(x * 18, y * 2.6, z * 18, 2);

export default defineAsset({
  name: 'wardrobe',
  description:
    'Tall honey-oak wardrobe with two carved doors, iron ring pulls, an arched crown, and short turned feet.',
  detail: 0.01,
  reference: 'docs/item-mockups/wardrobe-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ carcass
    const carcassBox = sdf.box([BODY_W, BODY_H, BODY_D], 0.016).at(0, BODY_Y, 0);
    const sideRecess = sdf.box([0.06, 1.08, 0.18], 0.014).at(BODY_W / 2, 0.86, 0);
    const plinth = sdf.box([PLINTH_W, PLINTH_H, PLINTH_D], 0.012).at(0, PLINTH_Y, 0);
    // Dark stop behind the door gap so the seam does not show through.
    const seam = sdf.box([0.028, 1.2, 0.03], 0.004).at(0, DOOR_Y, 0.175).paint(SHADOW);
    const carcass = carcassBox
      .subtract(sideRecess, sideRecess.mirror('x', 0))
      .smoothUnion(0.01, plinth)
      .union(seam);

    const carcassPaint = (x: number, y: number, z: number) => {
      let c = mixRgb(BROWN, HONEY, 0.35);
      const grain = 0.5 + 0.5 * noise.fbm(x * 16, y * 2.4, z * 16, 2);
      c = mixRgb(c, WALNUT, 0.22 * grain);
      // Dark kickboard and plinth so the base is the dark value.
      c = mixRgb(c, rgb('#3a2212'), 0.86 * clamp01((0.155 - y) / 0.045));
      // Front stiles stay darker than the honey doors.
      if (z > 0.1 && y > 0.16 && y < 1.5) {
        c = mixRgb(c, WALNUT, 0.42 * clamp01((Math.abs(x) - 0.34) / 0.1));
      }
      // Side-panel recess is a shaded well.
      if (Math.abs(x) > 0.44 && Math.abs(z) < 0.1 && y > 0.35 && y < 1.35) {
        c = mixRgb(c, rgb('#3a2212'), 0.35);
      }
      if (Math.abs(x) > 0.42) {
        const fy = (y - 0.16) / 0.26 - Math.floor((y - 0.16) / 0.26);
        const line = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * fy), 16);
        c = mixRgb(c, rgb('#3a2212'), 0.55 * line);
      }
      if (z < -0.14) {
        const fx = (x + 0.4) / 0.18 - Math.floor((x + 0.4) / 0.18);
        const line = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * fx), 16);
        c = mixRgb(c, rgb('#3a2212'), 0.5 * line);
        c = mixRgb(c, WALNUT, 0.25);
      }
      return c;
    };

    k.body('carcass', carcass.paintFn(carcassPaint), {
      color: '#8a5a35',
      roughness: 0.82,
      metalness: 0,
      detail: 0.012,
      paintWeight: 1,
      bump: grainBump,
      maxTriangles: 1800,
    });

    // ------------------------------------------------------------------ crown
    // Crown is the 1.10 x 0.55 envelope. The arch base sits in the slab front.
    const slab = sdf.box([1.1, 0.056, 0.55], 0.014).at(0, 1.6, 0);
    const lip = sdf.box([1.04, 0.03, 0.5], 0.01).at(0, 1.552, 0);
    const arch = sdf
      .extrude(
        profile.polygon(
          Array.from({ length: 13 }, (_, i) => {
            const t = i / 12;
            const u = (t - 0.5) * 2;
            const y = 0.202 * Math.cos(u * Math.PI * 0.5) ** 2;
            return [-0.26 + t * 0.52, y] as [number, number];
          }),
        ),
        0.058,
        0.008,
      )
      .at(0, 1.6, 0.246);
    const holeY = 1.745;
    const hole = sdf.cylinder(0.026, 0.04, 0.004).rotateX(90).at(0, holeY, 0.26);
    const crest = arch.subtract(hole);
    const crown = slab.smoothUnion(0.014, lip, crest).paintWhere(
      sdf.sphere(0.028).at(0, holeY, 0.21),
      SHADOW,
      0.008,
    );

    const crownPaint = (x: number, y: number, z: number) => {
      let c = woodBase(x, y, z);
      c = mixRgb(c, PALE, 0.7 * clamp01((y - 1.61) / 0.02));
      c = mixRgb(c, rgb('#e6d4aa'), 0.45 * clamp01((y - 1.62) / 0.012));
      c = mixRgb(c, rgb('#3a2212'), 0.6 * clamp01((1.54 - y) / 0.02));
      const holeD = Math.hypot(x, y - holeY);
      if (z > 0.2 && holeD < 0.034) c = mixRgb(c, SHADOW, 0.9 * clamp01((0.032 - holeD) / 0.012));
      return c;
    };

    k.body('crown', crown.paintFn(crownPaint), {
      color: '#b5814a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.01,
      paintWeight: 1,
      bump: grainBump,
      maxTriangles: 1400,
    });

    // ------------------------------------------------------------------ feet
    const foot = turnedFoot();
    const feet = foot.at(FOOT_X, 0, FOOT_Z).mirror('x', 0).mirror('z', 0);
    const feetPaint = (x: number, y: number, z: number) => {
      let c = rgb('#3a2212');
      const grain = 0.5 + 0.5 * noise.fbm(x * 14, y * 6, z * 14, 2);
      c = mixRgb(c, WALNUT, 0.35 + 0.3 * grain);
      c = mixRgb(c, rgb('#24160c'), 0.45 * clamp01((0.03 - y) / 0.03));
      c = mixRgb(c, BROWN, 0.25 * clamp01((y - 0.06) / 0.03));
      return c;
    };
    k.body('feet', feet.paintFn(feetPaint), {
      color: '#3a2212',
      roughness: 0.84,
      metalness: 0,
      detail: 0.008,
      paintWeight: 1,
      bump: grainBump,
      maxTriangles: 1400,
    });

    // ------------------------------------------------------------------ doors
    const door = sdf.box([DOOR_W, DOOR_H, DOOR_T], 0.012).at(-DOOR_X, DOOR_Y, DOOR_Z);
    const doorPaint = (x: number, y: number, z: number) => {
      let c = woodBase(x, y, z);
      c = mixRgb(c, x < 0 ? BROWN : PALE, 0.06);
      const lx = Math.abs(Math.abs(x) - DOOR_X);
      // Dark meeting stile and outer edge so the two doors separate.
      c = mixRgb(c, rgb('#3a2212'), 0.62 * clamp01((lx - 0.155) / 0.035));
      const edgeY = Math.min(y - (DOOR_Y - DOOR_H / 2), DOOR_Y + DOOR_H / 2 - y);
      c = mixRgb(c, WALNUT, 0.4 * clamp01((0.022 - edgeY) / 0.022));
      if (x > 0) {
        const wear = Math.hypot(x - 0.07, y - 0.9);
        c = mixRgb(c, PALE, 0.22 * clamp01(1 - wear / 0.07));
      }
      return c;
    };
    k.body('doors', door.mirror('x', 0).paintFn(doorPaint), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.01,
      paintWeight: 1,
      bump: grainBump,
      maxTriangles: 900,
    });

    // ------------------------------------------------------------------ carved panels
    const frame = panelFrame().at(0, 0, 0.006);
    const field = archedPlate(PANEL_W - 0.07, PANEL_H - 0.08, 0.016, 0.005);
    // Crisp diamond medallion. A smoothed blob here read as a figure.
    const diamond = sdf
      .extrude(
        profile.polygon([
          [0, 0.07],
          [-0.052, 0],
          [0, -0.07],
          [0.052, 0],
        ]),
        0.016,
        0.003,
      )
      .at(0, 0.0, 0.014);
    const roundel = sdf.ellipsoid([0.028, 0.028, 0.009]).at(0, 0.34, 0.011);
    const panel = frame.union(field).smoothUnion(0.004, diamond, roundel);
    const panelPaint = (x: number, y: number, z: number) => {
      let c = mixRgb(PALE, HONEY, 0.35);
      const grain = 0.5 + 0.5 * noise.fbm(x * 18, y * 3, z * 18, 2);
      c = mixRgb(c, BROWN, 0.14 * grain);
      c = mixRgb(c, rgb('#e6d4aa'), 0.35 * clamp01((z - 0.22) / 0.02));
      c = mixRgb(c, WALNUT, 0.3 * clamp01((0.218 - z) / 0.012));
      return c;
    };
    k.body(
      'panels',
      panel.at(-DOOR_X, DOOR_Y + 0.02, DOOR_FRONT).mirror('x', 0).paintFn(panelPaint),
      {
        color: '#c9a06a',
        roughness: 0.78,
        metalness: 0,
        detail: 0.008,
        paintWeight: 1,
        bump: grainBump,
        maxTriangles: 1300,
      },
    );

    // ------------------------------------------------------------------ iron
    const pull = (sx: number) => {
      const x = sx * 0.062;
      const y = 0.9;
      const plate = sdf.cylinder(0.024, 0.012, 0.004).rotateX(90).at(x, y, DOOR_FRONT + 0.008);
      const peg = sdf.cylinder(0.008, 0.022, 0.003).rotateX(90).at(x, y, DOOR_FRONT + 0.018);
      const ring = sdf.torus(0.034, 0.008).rotateX(90).at(x, y - 0.026, DOOR_FRONT + 0.026);
      return plate.smoothUnion(0.004, peg, ring);
    };
    const hinge = (sx: number, y: number) => {
      const x = sx * 0.4;
      const barrel = sdf.cylinder(0.013, 0.07, 0.004).at(x, y, DOOR_FRONT - 0.004);
      const strap = sdf.box([0.058, 0.034, 0.012], 0.004).at(x - sx * 0.02, y, DOOR_FRONT + 0.006);
      return barrel.smoothUnion(0.004, strap);
    };
    const iron = sdf.union(
      pull(-1),
      pull(1),
      hinge(-1, 0.4),
      hinge(-1, 0.84),
      hinge(-1, 1.26),
      hinge(1, 0.4),
      hinge(1, 0.84),
      hinge(1, 1.26),
    );
    const ironPaint = (x: number, y: number, z: number) => {
      const wear = 0.5 + 0.5 * noise.fbm(x * 14, y * 14, z * 14, 2);
      let c = mixRgb(PEWTER_DARK, PEWTER, 0.3 + 0.55 * wear);
      c = mixRgb(c, PEWTER_LIGHT, 0.28 * wear * clamp01((z - 0.23) / 0.03));
      c = mixRgb(c, PEWTER_DARK, 0.35 * clamp01((0.22 - z) / 0.02));
      return c;
    };
    k.body('iron', iron.paintFn(ironPaint), {
      color: '#9aa3ad',
      roughness: 0.42,
      metalness: 0.8,
      detail: 0.005,
      paintWeight: 1,
      maxTriangles: 900,
    });
  },
});
