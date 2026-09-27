import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note — heavy dungeon door in a canon-block masonry jamb (architecture/structure/door).
 *
 * Role: focal doorway for a dungeon wall set; reads at 128 px as a dark warm door in cold blue
 *   stone. Background/structure prop, so detail is chunky and economical.
 * Size: opening 1.0 m wide, 1.6 m tall; jamb + round arch built on the canon 0.60 m course.
 *   Total about 2.1 m wide (X), 2.25 m tall (Y), 0.26 m deep (Z). Stands on y = 0, faces +Z.
 * One idea: a warm plank door sunk deep in a cold blue canon-block arch, keystone proud.
 * Shape language: square canon blocks (sturdy) with deep rounded pillow bevels (soft, hand-laid);
 *   the only curves are the round arch ring and the small iron ring handle.
 * Palette (canon overrides mood): stone face #4a5d75, worn tops #7a8ba0, joints #2a3547,
 *   moss #3fae9a at the base only; door wood #8a5a35; black iron #2b2e33. Accent: moss + ring.
 * Materials: stone (0.9 / metal 0), mortar (0.9), wood door (0.8), black iron (0.5 / metal 0.8),
 *   moss (0.85).
 * Detail list: (1) jamb + radial voussoir arch, (2) proud keystone, (3) recessed navy joints,
 *   (4) plank door + two iron hinge bands with studs, (5) iron ring handle, (6) base moss.
 *   Focal point: the ring handle and the keystone.
 * Rig/animation: none (static architecture).
 */

// ------------------------------------------------------------------ canon constants
const COURSE = 0.6; // canon course height (2 per 1.2 m)
const BLOCK_L = 0.55; // canon block length
const BEVEL = 0.04; // deep rounded pillow bevel
const GAP = 0.018; // recessed joint width
const OPEN_HALF = 0.5; // half the 1.0 m opening
const SPRING_Y = COURSE * 2; // 1.2 m: arch springs after two whole courses
const R_IN = OPEN_HALF; // arch intrados
const R_OUT = R_IN + BLOCK_L; // 1.05 m: arch extrados = jamb outer edge
const WALL_D = 0.26; // masonry depth
const WALL_FRONT = WALL_D / 2; // 0.13
const BACK_FRONT = WALL_FRONT - 0.034; // joints sit 0.034 m behind the block faces

const C = {
  stone: rgb('#4a5d75'),
  stoneTop: rgb('#7a8ba0'),
  stoneDark: rgb('#33445a'),
  joint: rgb('#2a3547'),
  moss: rgb('#3fae9a'),
  mossDark: rgb('#2c7a6d'),
  wood: rgb('#8a5a35'),
  woodLight: rgb('#a56f42'),
  woodDark: rgb('#5c3a20'),
  woodDeep: rgb('#33200f'),
  iron: rgb('#2b2e33'),
  ironDark: rgb('#191b1e'),
};

const sstep = (e0: number, e1: number, v: number): number => {
  const t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** A canon block: full footprint minus the joint gap, deep rounded pillow bevel. */
const blockAt = (cx: number, cy: number, w: number, h: number, zc = 0, d = WALL_D) =>
  sdf.box([w - GAP, h - GAP, d], BEVEL).at(cx, cy, zc);

/** Wedge profile between radii ri..ro and angles a0..a1 (radians), for arch voussoirs. */
const wedgeProfile = (ri: number, ro: number, a0: number, a1: number, n = 14): ReturnType<typeof profile.polygon> => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push([ro * Math.cos(a), ro * Math.sin(a)]);
  }
  for (let i = n; i >= 0; i--) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push([ri * Math.cos(a), ri * Math.sin(a)]);
  }
  return profile.polygon(pts);
};

/** Half-annulus profile (0..180 deg) between ri and ro, local to the arch centre. */
const annulusProfile = (ri: number, ro: number, n = 30): ReturnType<typeof profile.polygon> => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const a = (Math.PI * i) / n;
    pts.push([ro * Math.cos(a), ro * Math.sin(a)]);
  }
  for (let i = n; i >= 0; i--) {
    const a = (Math.PI * i) / n;
    pts.push([ri * Math.cos(a), ri * Math.sin(a)]);
  }
  return profile.polygon(pts);
};

/** Arched door outline: rectangle of half-width `halfW` with a half-round top at `spring`. */
const archOutline = (halfW: number, spring: number, n = 20): ReturnType<typeof profile.polygon> => {
  const pts: [number, number][] = [
    [-halfW, 0],
    [halfW, 0],
  ];
  for (let i = 0; i <= n; i++) {
    const a = (Math.PI * i) / n;
    pts.push([halfW * Math.cos(a), spring + halfW * Math.sin(a)]);
  }
  return profile.polygon(pts);
};

/** Canon stone paint: per-course worn top highlight, shaded foot, weathering, base moss only. */
const stonePaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  const f = y / COURSE - Math.floor(y / COURSE); // 0 at a course foot, 1 at its top
  let c = mixRgb(base, C.stoneTop, 0.5 * sstep(0.62, 1.0, f)); // worn top
  c = mixRgb(c, C.stoneDark, 0.24 * (1 - sstep(0.02, 0.5, f))); // shaded foot
  // Broad weathering patches, then finer speckle.
  const patch = 0.5 + 0.5 * noise.fbm(x * 3.2, y * 3.2, z * 3.2, 3);
  c = mixRgb(c, C.stoneDark, 0.18 * patch);
  const spec = 0.5 + 0.5 * noise.fbm(x * 17, y * 17, z * 17, 2);
  c = mixRgb(c, spec > 0.5 ? C.stoneTop : C.stoneDark, 0.07 * Math.abs(spec - 0.5) * 2);
  // Moss clumps at the base only: a few distinct tufts, not a gradient wash.
  const baseW = 1 - sstep(0.02, 0.34, y);
  const clump = 0.5 + 0.5 * noise.fbm(x * 11, y * 14, z * 11, 3);
  const moss = baseW * sstep(0.5, 0.72, clump);
  c = mixRgb(c, C.moss, 0.92 * moss);
  c = mixRgb(c, C.mossDark, 0.55 * moss * sstep(0.72, 0.95, clump));
  return c;
};

const PLANK = 0.14; // door plank width

export default defineAsset({
  name: 'door',
  description:
    'Heavy warm-brown plank dungeon door in a canon-block masonry jamb with a radial voussoir round arch, proud keystone, iron hinge bands with studs, and an iron ring handle.',
  detail: 0.02,
  texture: { size: 1024 },
  reference: 'docs/dungeon-mockups/masonry-canon.png',

  build(k) {
    // ---------------------------------------------------------------- jamb (one block course wide)
    const jambRight = sdf.union(
      blockAt(OPEN_HALF + BLOCK_L / 2, COURSE * 0.5, BLOCK_L, COURSE),
      blockAt(OPEN_HALF + BLOCK_L / 2, COURSE * 1.5, BLOCK_L, COURSE),
    );
    const jamb = sdf.union(jambRight, jambRight.mirror('x', 0));

    // ---------------------------------------------------------------- round arch, radial voussoirs
    const N_VOUS = 5;
    const SPAN = 180 / N_VOUS; // 36 deg per segment
    const INSET = 1.0; // degrees each side, for the joint gap
    const D2R = Math.PI / 180;
    const voussoirs: ReturnType<typeof sdf.box>[] = [];
    for (let i = 0; i < N_VOUS; i++) {
      const a0 = (i * SPAN + INSET) * D2R;
      const a1 = ((i + 1) * SPAN - INSET) * D2R;
      const keystone = i === Math.floor(N_VOUS / 2);
      const ro = keystone ? R_OUT + 0.03 : R_OUT;
      // The keystone sits proud of the wall face.
      const shape = sdf.extrude(wedgeProfile(R_IN, ro, a0, a1), WALL_D + (keystone ? 0.06 : 0), BEVEL);
      voussoirs.push(shape.at(0, SPRING_Y, keystone ? 0.045 : 0));
    }
    const arch = sdf.union(...voussoirs);

    const stone = sdf.union(jamb, arch);
    k.body('stone', stone.paintFn(stonePaint), {
      color: C.stone,
      roughness: 0.9,
      metalness: 0,
      detail: 0.026,
      maxError: 0.008,
      maxTriangles: 2700,
      paintWeight: 1,
      bump: (x, y, z) => 0.0022 * noise.fbm(x * 26, y * 26, z * 26, 3) - 0.001 * noise.fbm(x * 7, y * 7, z * 7, 2),
    });

    // ---------------------------------------------------------------- recessed joints (navy backing)
    const jambBack = sdf.box([BLOCK_L, SPRING_Y, 0.2], 0).at(OPEN_HALF + BLOCK_L / 2, SPRING_Y / 2, BACK_FRONT - 0.1);
    const ringBack = sdf.extrude(annulusProfile(R_IN, R_OUT), 0.2).at(0, SPRING_Y, BACK_FRONT - 0.1);
    const backing = sdf.union(jambBack, jambBack.mirror('x', 0), ringBack);
    k.body('joints', backing, {
      color: C.joint,
      roughness: 0.9,
      metalness: 0,
      detail: 0.045,
      maxError: 0.014,
      maxTriangles: 360,
    });

    // ---------------------------------------------------------------- plank door
    const DOOR_HALF = OPEN_HALF - 0.012;
    const door = sdf.extrude(archOutline(DOOR_HALF, SPRING_Y), 0.07, 0.006).at(0, 0, -0.005);
    const doorPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const u = x / PLANK + 4;
      const f = u - Math.floor(u);
      const g = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 5);
      const idx = Math.floor(u);
      const tint = noise.random(idx, 3);
      const grain = 0.5 + 0.5 * noise.fbm(x * 42, y * 3.2, 0, 2);
      let c = mixRgb(base, C.woodLight, 0.05 + 0.16 * tint);
      c = mixRgb(c, C.woodDark, 0.15 * grain);
      c = mixRgb(c, C.woodDeep, 0.78 * g);
      // Shade the recessed depth and the arch head.
      c = mixRgb(c, C.woodDeep, 0.16 * sstep(0.9, 1.55, y));
      return c;
    };
    k.body('door', door.paintFn(doorPaint), {
      color: C.wood,
      roughness: 0.8,
      metalness: 0,
      detail: 0.012,
      maxError: 0.006,
      maxTriangles: 1100,
      paintWeight: 2,
      bump: (x, _y, _z) => {
        const u = x / PLANK + 4;
        const f = u - Math.floor(u);
        const g = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 5);
        return -0.0028 * g + 0.0012 * noise.fbm(x * 45, 0, 0, 2);
      },
    });

    // ---------------------------------------------------------------- iron hinges + studs
    const bandY = [0.34, 0.98];
    const bandX = -0.17;
    const parts: ReturnType<typeof sdf.box>[] = [];
    const studs: ReturnType<typeof sdf.sphere>[] = [];
    for (const by of bandY) {
      parts.push(sdf.box([0.6, 0.09, 0.04], 0.016).at(bandX, by, 0.05));
      // hinge knuckle at the left door edge, over a vertical pin
      parts.push(sdf.cylinder(0.024, 0.14, 0.008).at(-0.462, by, 0.05));
      for (const sx of [-0.42, -0.26, -0.1, 0.06]) {
        studs.push(sdf.sphere(0.016).at(sx, by, 0.064));
      }
    }
    const hinge = sdf.union(...parts, ...studs);
    k.body('hinges', hinge, {
      color: C.iron,
      roughness: 0.5,
      metalness: 0.8,
      detail: 0.008,
      maxError: 0.004,
      maxTriangles: 850,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 40, y * 40, z * 40, 2),
    });

    // ---------------------------------------------------------------- iron ring handle
    const RX = 0.29;
    const RY = 0.72;
    const plate = sdf.box([0.075, 0.16, 0.03], 0.009).at(RX, RY, 0.042);
    const loop = sdf.torus(0.036, 0.011).rotateX(90).at(RX, RY - 0.045, 0.075);
    const ring = sdf.torus(0.062, 0.014).rotateX(90).at(RX, RY - 0.115, 0.062).paint(C.ironDark);
    k.body('ring', sdf.union(plate, loop, ring), {
      color: C.iron,
      roughness: 0.5,
      metalness: 0.8,
      detail: 0.007,
      maxError: 0.003,
      maxTriangles: 900,
    });

    // ---------------------------------------------------------------- moss tufts at the base
    const tufts: ReturnType<typeof sdf.ellipsoid>[] = [];
    const tuftAt = (x: number, z: number, s: number) =>
      sdf.ellipsoid([0.06 * s, 0.04 * s, 0.05 * s]).at(x, 0.045 * s, z);
    for (let i = 0; i < 5; i++) {
      const n = i + 1;
      tufts.push(tuftAt(0.58 + 0.4 * noise.random(n, 1), 0.11, 0.85 + 0.5 * noise.random(n, 2)));
      tufts.push(tuftAt(-0.58 - 0.4 * noise.random(n, 3), 0.11, 0.85 + 0.5 * noise.random(n, 4)));
    }
    k.body('moss', sdf.union(...tufts), {
      color: C.moss,
      roughness: 0.85,
      metalness: 0,
      detail: 0.012,
      maxError: 0.006,
      maxTriangles: 400,
    });
  },
});
