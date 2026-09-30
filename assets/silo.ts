import { Sdf, defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note — grain silo (architecture/structure/silo).
 *
 * Role: hamlet farm structure on the village map; must read at 128 px sprite.
 * Size: 2.4 m wide (X), 6.0 m tall to the finial, stands on y = 0, centred on Y, hatch faces +Z.
 * One idea: a tall round honey-oak plank tower hugged by dark iron bands, wearing a steep
 *   conical shingle roof with a curled eave and a little arched hatch door at the base.
 * Shape language: round dominant (cylinder tower, cone roof, ball finial), square secondary
 *   (iron band straps give a sturdy read).
 * Palette: honey oak #b5814a (dominant wood), warm brown #8a5a35 (shingles), pale cut wood
 *   #c9a06a (door frame, finial), dark walnut #6b4226 (seams, door leaf), iron #4a4f55 with
 *   #a8acb1 highlights. Value plan: mid wood tower, dark iron bands + door, pale frame accent.
 * Materials: wood (roughness 0.82), shingle wood (roughness 0.85), pale trim wood (0.8),
 *   walnut door (0.8), worn iron (roughness 0.5, metalness 0.7).
 * Detail list: (1) bulged plank tower, (2) conical shingle roof with curled eave + ball finial,
 *   (3) three iron bands, (4) arched hatch door with pale frame + iron straps. Focal: hatch door.
 * Rig/animation: none (static structure).
 */

const HONEY = rgb('#b5814a');
const HONEY_LIGHT = rgb('#c9a06a');
const BROWN = rgb('#8a5a35');
const WALNUT = rgb('#6b4226');
const SEAM = rgb('#4e3018');
const IRON = rgb('#4a4f55');
const IRON_DARK = rgb('#363a3f');
const IRON_HI = rgb('#a8acb1');

const R = 1.2; // tower radius (2.4 m wide)
const EAVE_Y = 4.78; // where the roof springs
const APEX_Y = 6.04; // roof tip
const STAVES = 14;

const line = (v: number, p: number) => Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * v), p);

/** Vertical plank paint around the tower: per-stave tint, grain, soft dark seams. */
const plankPaint = (x: number, y: number, z: number) => {
  const a = Math.atan2(z, x);
  const u = ((a + Math.PI) / (Math.PI * 2)) * STAVES;
  const idx = Math.floor(u);
  const f = u - idx;
  const edge = line(f, 3);
  const tint = noise.random(idx, 5, 2);
  const grain = 0.5 + 0.5 * noise.fbm(x * 9, y * 3.2, z * 9, 2);
  const patch = 0.5 + 0.5 * noise.fbm(x * 3.2, y * 3.2, z * 3.2, 2);
  let c = mixRgb(HONEY, HONEY_LIGHT, 0.1 + 0.28 * tint);
  c = mixRgb(c, BROWN, 0.28 * patch);
  c = mixRgb(c, HONEY_LIGHT, 0.12 * grain);
  // Damp shaded foot, soft shadow ring where the roof overhangs.
  const t = Math.min(1, Math.max(0, y / EAVE_Y));
  c = mixRgb(c, WALNUT, 0.42 * Math.max(0, 1 - t / 0.14));
  const eaveShade = Math.max(0, (y - 4.05) / 0.75);
  c = mixRgb(c, WALNUT, 0.26 * eaveShade * eaveShade);
  c = mixRgb(c, SEAM, 0.5 * edge);
  return c;
};

const plankBump = (x: number, y: number, z: number) => {
  const a = Math.atan2(z, x);
  const u = ((a + Math.PI) / (Math.PI * 2)) * STAVES;
  const f = u - Math.floor(u);
  return -0.004 * line(f, 6) + 0.0018 * noise.fbm(x * 24, y * 7, z * 24, 2);
};

/** Arched outline in XY: rectangle with a half-round top of radius `halfW`. */
const archProfile = (halfW: number, bot: number, spring: number) => {
  const pts: [number, number][] = [
    [-halfW, bot],
    [halfW, bot],
  ];
  const n = 12;
  for (let i = 0; i <= n; i++) {
    const ang = (Math.PI * i) / n;
    pts.push([halfW * Math.cos(ang), spring + halfW * Math.sin(ang)]);
  }
  return profile.polygon(pts);
};

export default defineAsset({
  name: 'silo',
  description:
    'Tall round honey-oak plank grain silo with three dark iron bands, a steep conical shingle roof with a curled eave and wooden finial, and a small arched hatch door with a pale frame.',
  detail: 0.02,
  texture: { size: 1024 },
  reference: 'bench/overnight/refs/p1-village/silo-mock.jpg',

  build(k) {
    // ---------------------------------------------------------------- tower
    // Slightly bulged plank tower, flat on the ground, capped under the roof.
    const towerProfile = profile.polygon(
      [
        [0, 0.02],
        [1.06, 0.02],
        [1.13, 0.1],
        [1.17, 1.2],
        [1.2, 2.4],
        [1.17, 3.7],
        [1.14, 4.6],
        [1.14, 4.92],
        [0, 4.92],
      ],
      { smooth: true, samples: 14 },
    );
    const tower = sdf.revolve(towerProfile).intersect(sdf.halfSpace([0, -1, 0], 0));
    k.body('tower', tower.paintFn(plankPaint), {
      color: HONEY,
      roughness: 0.82,
      detail: 0.02,
      maxError: 0.015,
      maxTriangles: 2000,
      bump: plankBump,
    });

    // ---------------------------------------------------------------- iron bands
    // Three strap tori hugging the plank wall, embedded slightly into the wood.
    const bandAt = (y: number, wallR: number) => sdf.torus(wallR + 0.01, 0.06).at(0, y, 0);
    const wideBand = (y: number, wallR: number) =>
      sdf.cylinder(wallR + 0.07, 0.26, 0.05).subtract(sdf.cylinder(wallR - 0.05, 1)).at(0, y, 0);
    const buckle = (y: number, wallR: number) =>
      sdf.box([0.2, 0.15, 0.06], 0.02).at(0, y, wallR + 0.05);
    const RUNGS = 8;
    const ladder = [
      sdf.capsule([0.2, 1.5, -1.27], [0.2, 4.6, -1.27], 0.03),
      sdf.capsule([-0.2, 1.5, -1.27], [-0.2, 4.6, -1.27], 0.03),
      ...Array.from({ length: RUNGS }, (_, i) =>
        sdf.capsule([-0.2, 1.5 + (3.1 * i) / (RUNGS - 1), -1.27], [0.2, 1.5 + (3.1 * i) / (RUNGS - 1), -1.27], 0.03),
      ),
      ...[1.7, 3.05, 4.4].flatMap((y) => [
        sdf.capsule([0.2, y, -1.12], [0.2, y, -1.27], 0.03),
        sdf.capsule([-0.2, y, -1.12], [-0.2, y, -1.27], 0.03),
      ]),
    ];
    const bands = sdf
      .union(
        wideBand(1.2, 1.175), bandAt(2.7, 1.195), wideBand(4.2, 1.155),
        buckle(1.2, 1.2), buckle(2.7, 1.22), buckle(4.2, 1.18),
        ...ladder,
      )
      .paintFn((x, y, z, base) => {
        const wear = 0.5 + 0.5 * noise.fbm(x * 6, y * 6, z * 6, 2);
        let c = mixRgb(base, IRON_DARK, 0.45 * wear);
        c = mixRgb(c, IRON_HI, 0.22 * Math.pow(0.5 + 0.5 * noise.fbm(x * 14, y * 14, z * 14, 2), 3));
        return c;
      });
    k.body('bands', bands, {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.012,
      maxError: 0.006,
      maxTriangles: 1500,
    });

    // ---------------------------------------------------------------- roof
    // Conical shingle roof: triangle profile revolved, flat underside at the eave.
    const core = sdf.revolve(
      profile.polygon(
        [
          [0, APEX_Y],
          [1.42, 4.72],
          [1.44, 4.64],
          [1.4, 4.58],
          [0, 4.58],
        ],
        { smooth: true, samples: 6 },
      ),
    );
    // Six stepped rows of rounded shingle tabs; each row sits proud of the one below.
    const TH = Math.atan2(APEX_Y - 4.7, 1.46); // slope angle from horizontal
    const SLOPE_DEG = (TH * 180) / Math.PI;
    const ROWS = 6;
    const STEP = 0.3;
    const tabs = [core];
    for (let i = 0; i < ROWS; i++) {
      const sc = i * STEP + 0.2;
      const off = 0.02 + 0.014 * i;
      const rr = 1.46 - sc * Math.cos(TH) + Math.sin(TH) * off;
      const yy = 4.7 + sc * Math.sin(TH) + Math.cos(TH) * off;
      const w = Math.min(0.4, ((2 * Math.PI * rr) / 14) * 1.05);
      const tab = sdf.box([w, 0.06, 0.4], 0.028).rotateX(SLOPE_DEG).at(0, yy, rr);
      const SECT = (2 * Math.PI) / 14;
      const shift = (i % 2) * 0.5 * SECT;
      // Polar repeat: fold the angle into one sector, so one tab stands for the whole ring.
      tabs.push(
        new Sdf(
          (x, y, z) => {
            const r = Math.hypot(x, z);
            const phi = Math.atan2(x, z) - shift;
            const f = ((((phi + SECT / 2) % SECT) + SECT) % SECT) - SECT / 2;
            return tab.dist(r * Math.sin(f), y, r * Math.cos(f));
          },
          { min: [-1.7, 4.4, -1.7], max: [1.7, 6.1, 1.7] } as never,
        ),
      );
    }
    const roof = sdf.smoothUnion(0.02, ...tabs);
    const LIT = rgb('#a9713c');
    const shinglePaint = (x: number, y: number, z: number) => {
      const r = Math.hypot(x, z);
      if (y < 4.62) return mixRgb(BROWN, WALNUT, 0.5);
      const s = (1.46 - r) / Math.cos(TH);
      const f = (((s % STEP) + STEP) % STEP) / STEP;
      const tint = 0.5 + 0.5 * noise.fbm(x * 4, y * 4, z * 4, 2);
      let c = mixRgb(BROWN, WALNUT, 0.12 + 0.18 * tint);
      c = mixRgb(c, LIT, 0.85 * Math.max(0, 1 - f / 0.22));
      c = mixRgb(c, WALNUT, 0.35 * Math.max(0, (f - 0.85) / 0.15));
      return c;
    };
    k.body('roof', roof.paintFn(shinglePaint), {
      color: BROWN,
      roughness: 0.85,
      metalness: 0,
      detail: 0.02,
      maxError: 0.012,
      maxTriangles: 2600,
    });

    // ---------------------------------------------------------------- hatch door (front, +Z)
    const DOOR_Z = 1.13; // extrusion centre; the frame crosses the curved wall
    // Pale arched frame, hollowed to hug the leaf.
    const frame = sdf
      .extrude(archProfile(0.525, 0.0, 0.875), 0.3, 0.025)
      .subtract(sdf.extrude(archProfile(0.425, 0.0, 0.875), 0.6))
      .at(0, 0, 1.1)
      .paintFn((x, y, z, base) => mixRgb(base, rgb('#e8cf9a'), 0.55 + 0.2 * noise.fbm(x * 8, y * 8, z * 8, 2)));
    const plinth = sdf
      .cylinder(1.32, 0.18, 0.05)
      .at(0, 0.09, 0)
      .subtract(sdf.cylinder(1.08, 1).at(0, 0.09, 0), sdf.box([1.05, 0.5, 0.6]).at(0, 0.1, 1.25))
      .paintFn((x, y, z, base) => mixRgb(base, rgb('#e8cf9a'), 0.3));
    const step = sdf.cylinder(0.3, 0.09, 0.035).at(0, 0.045, 1.38);
    // Wooden ball finial crowns the roof; same pale cut wood.
    const finial = sdf.sphere(0.13).at(0, APEX_Y + 0.1, 0);
    k.body('trim', sdf.union(frame, finial), {
      color: HONEY_LIGHT,
      roughness: 0.8,
      detail: 0.012,
      maxError: 0.006,
      maxTriangles: 900,
    });

    k.body('plinth', sdf.union(plinth, step), {
      color: HONEY_LIGHT,
      roughness: 0.8,
      detail: 0.02,
      maxError: 0.008,
      maxTriangles: 900,
    });

    // Dark walnut arched leaf, plank-painted, sitting proud of the wall.
    const leaf = sdf
      .extrude(archProfile(0.425, 0.0, 0.875), 0.16, 0.015)
      .at(0, 0, 1.15)
      .paintFn((x, y, z) => {
        const f = x / 0.2125 - Math.floor(x / 0.2125);
        const edge = line(f, 5);
        const grain = 0.5 + 0.5 * noise.fbm(x * 20, y * 7, z * 20, 2);
        let c = mixRgb(WALNUT, BROWN, 0.25 * grain);
        c = mixRgb(c, SEAM, 0.65 * edge);
        return c;
      });
    // Two small iron straps and a ring handle on the leaf.
    const leafIron = sdf.union(
      sdf.box([0.8, 0.07, 0.03], 0.012).at(0, 0.42, 1.24),
      sdf.box([0.8, 0.07, 0.03], 0.012).at(0, 0.98, 1.24),
      sdf.torus(0.06, 0.016).rotateX(90).at(0.2, 0.7, 1.245),
    );
    k.body('door', sdf.union(leaf, leafIron), {
      color: WALNUT,
      roughness: 0.72,
      metalness: 0.15,
      detail: 0.012,
      maxError: 0.005,
      maxTriangles: 800,
      textureDensity: 2,
    });
  },
});
