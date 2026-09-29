import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Felt yurt, 4.3 m wide and 3.1 m tall, on y = 0, door toward +Z.
 * Role: village landmark that must read at 128 px. No rig.
 * One idea: a puffy cream felt dome with fat coral bands and a small brown arched door.
 * Shape language: round and soft; one pointed finial.
 * Palette: felt #efe4cc, shadow #dccfb2, band #e8766a, fold #c5524a, door #8a5a35, knob #c8423a, crown #c9a06a.
 * Materials: felt (wall + roof), red rope bands, door wood, crown wood, knob.
 */
const C = {
  felt: rgb('#efe4cc'),
  feltDark: rgb('#dccfb2'),
  band: rgb('#e8766a'),
  bandDark: rgb('#c5524a'),
  door: rgb('#8a5a35'),
  doorDark: rgb('#6b4226'),
  knob: rgb('#c8423a'),
  crown: rgb('#c9a06a'),
  void: rgb('#3a2418'),
};

const DOOR_Z = 2.0;
const archProfile = (halfW: number, bot: number, spring: number) => {
  const pts: [number, number][] = [[-halfW, bot], [halfW, bot]];
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const a = (Math.PI * i) / n;
    pts.push([halfW * Math.cos(a), spring + halfW * Math.sin(a)]);
  }
  return profile.polygon(pts);
};
const doorShape = (hw: number, bot: number, d: number, z: number) =>
  sdf.extrude(archProfile(hw, bot, 0.98), d, 0.02).at(0, 0, z);

const feltPaint = (x: number, y: number, z: number) => {
  const n = 0.5 + 0.5 * noise.fbm(x * 1.5, y * 1.5, z * 1.5, 2);
  return mixRgb(C.felt, C.feltDark, 0.15 + 0.5 * n * (1 - Math.min(1, y / 2)));
};
const bandPaint = (x: number, y: number, z: number) =>
  mixRgb(C.band, C.bandDark, 0.55 * (0.5 + 0.5 * noise.fbm(x * 3, y * 6, z * 3, 2)));

export default defineAsset({
  name: 'yurt',
  description: 'A felt yurt with a puffy cream wall, coral rope bands, a scalloped conical roof, a crown ring, and an arched brown door.',
  detail: 0.012,
  texture: { size: 1024 },
  reference: 'bench/overnight/refs/p1-village/yurt-mock.jpg',

  build(k) {
    const puff = (x: number, y: number, z: number) => noise.fbm(x * 1.2, y * 1.2, z * 1.2, 2);

    // One convex revolve: bulging wall flowing into a domed roof, with a door recess.
    const body = sdf
      .revolve(
        profile.polygon(
          [[0, 0], [1.5, 0], [1.85, 0.05], [2.1, 0.8], [1.95, 1.6], [1.75, 1.9], [1.2, 2.4], [0.4, 2.8], [0, 2.9]],
          { smooth: true },
        ),
      )
      .round(0.04)
      .displace(0.035, puff)
      .subtract(doorShape(0.5, 0.0, 0.5, DOOR_Z + 0.16));
    k.body(
      'felt',
      body.paintFn((x, y, z) => {
        if (Math.abs(x) < 0.53 && z > 1.7 && y < 1.5) return C.doorDark;
        return feltPaint(x, y, z);
      }),
      {
        color: C.felt,
        roughness: 1,
        detail: 0.014,
        maxTriangles: 2300,
        bump: (x, y, z) => 0.004 * noise.fbm(x * 8, y * 8, z * 8, 2),
      },
    );

    // Scalloped skirt, proud of the roof.
    const bites = [];
    for (let i = 0; i < 12; i++) {
      const a = ((i + 0.5) / 12) * Math.PI * 2;
      bites.push(sdf.sphere(0.2).at(Math.sin(a) * 2.2, 1.76, Math.cos(a) * 2.1));
    }
    const skirt = sdf
      .revolve(profile.polygon([[1.5, 1.72], [2.16, 1.72], [1.86, 2.12], [1.4, 2.1]], { smooth: false }))
      .round(0.05)
      .subtract(...bites);
    k.body('skirt', skirt.paintFn(feltPaint), {
      color: C.felt,
      roughness: 1,
      detail: 0.014,
      maxTriangles: 800,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 8, y * 8, z * 8, 2),
    });

    // Bands ride proud of the lumpy surface.
    const roofBand = sdf
      .revolve(profile.polygon([[1.8, 1.48], [2.1, 1.48], [2.1, 1.74], [1.8, 1.74]], { smooth: false }))
      .round(0.05);
    const wallBand = sdf
      .revolve(profile.polygon([[1.9, 0.53], [2.24, 0.53], [2.24, 0.87], [1.9, 0.87]], { smooth: false }))
      .round(0.05)
      .subtract(doorShape(0.53, -0.1, 1.2, DOOR_Z + 0.2));
    k.body('bands', sdf.union(roofBand, wallBand).paintFn(bandPaint), {
      color: C.band,
      roughness: 0.95,
      detail: 0.012,
      maxTriangles: 900,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 8, y * 8, z * 8, 2),
    });

    // Door.
    const planks = [-0.15, 0.15].map((x) => sdf.box([0.02, 2, 0.05]).at(x, 0.9, DOOR_Z + 0.09));
    k.body('door', doorShape(0.45, 0.0, 0.24, DOOR_Z + 0.02).subtract(...planks).paintFn((x, y) => {
      const f = Math.abs(((x + 0.45) / 0.3) % 1 - 0.5);
      return mixRgb(C.door, C.doorDark, 0.3 + 0.4 * (f < 0.06 ? 1 : 0) + 0.2 * noise.fbm(x * 6, y * 3, 0, 2));
    }), {
      color: C.door,
      roughness: 0.8,
      detail: 0.008,
      maxTriangles: 700,
    });
    k.body('knob', sdf.sphere(0.06).at(0.28, 0.75, DOOR_Z + 0.15), {
      color: C.knob, roughness: 0.4, detail: 0.008, maxTriangles: 200,
    });

    // Crown.
    k.body('crown', sdf.torus(0.3, 0.06).at(0, 2.88, 0), {
      color: C.crown, roughness: 0.8, detail: 0.008, maxTriangles: 600,
    });
    k.body('finial', sdf.cone([0, 2.88, 0], [0, 3.2, 0], 0.11, 0.01).round(0.01), {
      color: C.knob, roughness: 0.6, detail: 0.008, maxTriangles: 300,
    });
  },
});
