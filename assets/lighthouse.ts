import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Chibi coastal lighthouse, ~7 m tall, 2.4 m wide at the base (catalog `architecture/structure/lighthouse`).
 *
 * Role: coastal landmark on harbor and beach maps; must read at 128 px. No rig, no clips.
 * Size: base diameter 2.4 m, apex of finial ~7.1 m, on y = 0, door toward +Z.
 * One idea: a gently tapered tower in bold red and white bands, crowned by a glowing lantern.
 * Shape language: round and soft (tapered cylinder, cone cap), square door and window trim.
 * Palette: white plaster #ece6d8, red #c0392b / dark #8f2a1f, oak #b5814a / walnut #6b4226,
 *   iron #3f444a, stone #a39a8c, glow #ffc65a.
 * Materials: plaster bands (0.85), stone footing (0.92), red cap (0.7), oak door (0.8),
 *   iron gallery and railing (0.5, metal 0.7), glass lantern (emissive, opacity), dark window glass.
 * Detail list: (1) striped body, (2) rock footing, (3) door, arch and step, (4) windows,
 *   (5) gallery + railing, (6) lantern glass and posts, (7) cap and finial.
 * Focal point: the glowing lantern; accent: the warm window glass.
 */

const C = {
  white: rgb('#ece6d8'),
  whiteShade: rgb('#cfc7b4'),
  red: rgb('#c0392b'),
  redDark: rgb('#8f2a1f'),
  oak: rgb('#b5814a'),
  oakDark: rgb('#8a5a35'),
  walnut: rgb('#6b4226'),
  iron: rgb('#3f444a'),
  stone: rgb('#a39a8c'),
  stoneTan: rgb('#b5a37f'),
  void: rgb('#241410'),
  glow: rgb('#ffc65a'),
  glass: rgb('#ffe9a8'),
  trim: rgb('#d9cdb2'),
};

const BASE_Y = 0.25;
const TOP_Y = 4.9;
const R0 = 1.2;
const R1 = 0.82;
/** Tower radius at height y. */
const rAt = (y: number) => R0 + (R1 - R0) * Math.min(1, Math.max(0, (y - BASE_Y) / (TOP_Y - BASE_Y)));

const archProfile = (halfW: number, bot: number, spring: number) => {
  const pts: [number, number][] = [
    [-halfW, bot],
    [halfW, bot],
  ];
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const a = (Math.PI * i) / n;
    pts.push([halfW * Math.cos(a), spring + halfW * Math.sin(a)]);
  }
  return profile.polygon(pts);
};

export default defineAsset({
  name: 'lighthouse',
  description:
    'A chibi red-and-white striped lighthouse with a rock footing, oak door, two windows, an iron gallery with railing, a glowing glass lantern, and a red cone cap with finial.',
  detail: 0.016,
  texture: { size: 1024 },

  build(k) {
    // ---------------------------------------------------------------- rock footing
    const stones = [sdf.cylinder(1.38, 0.24, 0.06).at(0, 0.12, 0)];
    const n = 11;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + noise.random(i, 4) * 0.3;
      const r = 0.26 + 0.08 * noise.random(i, 5);
      const d = 1.25 + 0.1 * noise.random(i, 6);
      stones.push(
        sdf
          .ellipsoid([r * 1.15, r * 0.9, r])
          .rotateY((a * 180) / Math.PI)
          .at(Math.sin(a) * d, 0.15 + 0.08 * noise.random(i, 8), Math.cos(a) * d),
      );
    }
    k.body(
      'footing',
      sdf.smoothUnion(0.06, ...stones).paintFn((x, y, z, base) => {
        const t = noise.fbm(x * 5, y * 5, z * 5, 2);
        return mixRgb(mixRgb(C.stone, C.stoneTan, 0.5 + 0.5 * t), base, 0.2);
      }),
      {
        color: C.stone,
        roughness: 0.92,
        detail: 0.03,
        maxError: 0.01,
        maxTriangles: 30000,
        bump: (x, y, z) => 0.005 * noise.fbm(x * 14, y * 14, z * 14, 2),
      },
    );

    // ---------------------------------------------------------------- striped tower
    const pts: [number, number][] = [[0, BASE_Y - 0.02]];
    for (let i = 0; i <= 10; i++) {
      const y = BASE_Y + ((TOP_Y - BASE_Y) * i) / 10;
      pts.push([rAt(y), y]);
    }
    pts.push([0, TOP_Y]);
    const BAND = 0.775;
    const tower = sdf.revolve(profile.polygon(pts)).round(0.02).paintFn((x, y, z) => {
      const band = Math.floor((y - BASE_Y) / BAND);
      const f = (y - BASE_Y) / BAND - band;
      const red = band % 2 === 0;
      let c = red ? C.red : C.white;
      const grime = 0.5 + 0.5 * noise.fbm(x * 4, y * 3, z * 4, 2);
      c = mixRgb(c, red ? C.redDark : C.whiteShade, 0.35 * grime);
      return mixRgb(c, red ? C.redDark : C.whiteShade, 0.5 * Math.pow(1 - f, 12));
    });
    k.body('tower', tower, {
      color: C.white,
      roughness: 0.85,
      detail: 0.02,
      maxError: 0.006,
      maxTriangles: 2800,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 12, y * 8, z * 12, 2),
    });

    // ---------------------------------------------------------------- gallery + railing
    const GY = TOP_Y;
    const deck = sdf
      .revolve(
        profile.polygon([
          [0, GY - 0.22],
          [0.8, GY - 0.22],
          [1.08, GY - 0.05],
          [1.12, GY + 0.04],
          [0, GY + 0.04],
        ]),
      )
      .round(0.015);
    const railR = 1.04;
    const iron = { color: C.iron, roughness: 0.5, metalness: 0.7 };
    k.body('gallery-deck', deck, { ...iron, detail: 0.02, maxTriangles: 3000 });
    k.body('gallery-rail', sdf.torus(railR, 0.04).at(0, GY + 0.52, 0), { ...iron, detail: 0.014, flat: true, maxTriangles: 3000 });
    const railPosts = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      railPosts.push(sdf.cylinder(0.05, 0.5, 0.01).at(Math.sin(a) * railR, GY + 0.27, Math.cos(a) * railR));
    }
    k.body('gallery-posts', sdf.union(...railPosts), { ...iron, detail: 0.014, flat: true, maxTriangles: 3000 });

    // ---------------------------------------------------------------- lantern room
    const LY = GY + 0.04;
    const LH = 0.9;
    const LR = 0.52;
    k.body(
      'lantern-glass',
      sdf.cylinder(LR - 0.02, LH, 0.02).at(0, LY + LH / 2, 0),
      {
        color: C.glass,
        roughness: 0.15,
        emissive: C.glow,
        emissiveIntensity: 1.2,
        opacity: 0.85,
        detail: 0.014,
        maxTriangles: 600,
      },
    );
    k.body('lantern-base', sdf.union(sdf.cylinder(LR + 0.05, 0.1, 0.02).at(0, LY + 0.05, 0), sdf.cylinder(LR + 0.06, 0.1, 0.02).at(0, LY + LH, 0)), { ...iron, detail: 0.014, flat: true, maxTriangles: 3000 });
    const posts = [];
    for (let i = 0; i < 8; i++) {
      const a = ((i + 0.5) / 8) * Math.PI * 2;
      posts.push(sdf.cylinder(0.05, LH, 0.01).at(Math.sin(a) * LR, LY + LH / 2, Math.cos(a) * LR));
    }
    k.body('lantern-posts', sdf.union(...posts), { ...iron, detail: 0.014, flat: true, maxTriangles: 3000 });

    // ---------------------------------------------------------------- red cap + finial
    const CY = LY + LH;
    const cap = sdf
      .revolve(
        profile.polygon(
          [
            [0, CY + 0.7],
            [0.1, CY + 0.6],
            [0.3, CY + 0.38],
            [0.58, CY + 0.12],
            [0.76, CY - 0.0],
            [0.78, CY - 0.06],
            [0.0, CY - 0.06],
          ],
          { smooth: true },
        ),
      )
      .round(0.02)
      .paintFn((x, y, z, base) => mixRgb(C.red, C.redDark, 0.35 * (0.5 + 0.5 * noise.fbm(x * 6, y * 6, z * 6, 2))));
    k.body('cap', cap, { color: C.red, roughness: 0.7, detail: 0.015, maxTriangles: 1400 });
    k.body(
      'finial',
      sdf.smoothUnion(0.02, sdf.sphere(0.07).at(0, CY + 0.74, 0), sdf.capsule([0, CY + 0.6, 0], [0, CY + 0.95, 0], 0.025)),
      { color: C.iron, roughness: 0.4, metalness: 0.8, detail: 0.008, maxTriangles: 300 },
    );

    // ---------------------------------------------------------------- door
    const DH = 0.34;
    const DB = 0.25;
    const DS = 1.1;
    const dz = rAt(0.8) - 0.04;
    k.body('door-reveal', sdf.extrude(archProfile(DH + 0.012, DB - 0.01, DS), 0.14, 0.008).at(0, 0, dz), {
      color: C.void,
      roughness: 0.95,
      detail: 0.014,
      maxTriangles: 150,
    });
    k.body(
      'door',
      sdf
        .extrude(archProfile(DH - 0.008, DB + 0.01, DS), 0.1, 0.014)
        .at(0, 0, dz + 0.03)
        .paintFn((x, y) => {
          const f = x / 0.115 - Math.floor(x / 0.115);
          const g = Math.pow(0.5 + 0.5 * Math.cos(f * Math.PI * 2), 4);
          return mixRgb(mixRgb(C.oak, C.oakDark, 0.2 + 0.2 * noise.random(Math.floor(x / 0.115 + 9), 2)), C.walnut, 0.55 * g);
        }),
      {
        color: C.oak,
        roughness: 0.8,
        detail: 0.01,
        maxTriangles: 600,
        paintWeight: 2,
        textureDensity: 2,
        bump: (x) => -0.003 * Math.pow(0.5 + 0.5 * Math.cos((x / 0.115) * Math.PI * 2), 4),
      },
    );

    // ---------------------------------------------------------------- windows + trim
    const win = (cy: number, zs: 1 | -1) => {
      const wz = (rAt(cy) - 0.04) * zs;
      const reveal = sdf.extrude(archProfile(0.12, cy - 0.15, cy + 0.02), 0.14, 0.006).at(0, 0, wz);
      const glass = sdf.extrude(archProfile(0.1, cy - 0.13, cy + 0.025), 0.06, 0.004).at(0, 0, wz + 0.05 * zs);
      const frame = sdf
        .extrude(archProfile(0.17, cy - 0.2, cy + 0.02), 0.2, 0.012)
        .at(0, 0, wz - 0.02 * zs)
        .subtract(sdf.extrude(archProfile(0.12, cy - 0.15, cy + 0.022), 0.7).at(0, 0, wz));
      return { reveal, glass, frame };
    };
    const w1 = win(2.35, 1);
    const w2 = win(3.6, -1);
    k.body('window-reveals', sdf.union(w1.reveal, w2.reveal), { color: C.void, roughness: 0.95, detail: 0.014, maxTriangles: 160 });
    k.body('window-glass', sdf.union(w1.glass, w2.glass), {
      color: C.void,
      roughness: 0.2,
      emissive: C.glow,
      emissiveIntensity: 0.55,
      detail: 0.012,
      maxTriangles: 160,
    });

    const doorFrame = sdf
      .extrude(archProfile(DH + 0.09, DB - 0.03, DS), 0.24, 0.016)
      .at(0, 0, dz - 0.1)
      .subtract(sdf.extrude(archProfile(DH + 0.004, DB, DS), 0.8).at(0, 0, dz));
    const step = sdf.box([0.95, 0.15, 0.44], 0.03).at(0, 0.075, 1.3);
    k.body('trim', sdf.union(w1.frame, w2.frame, doorFrame, step), {
      color: C.trim,
      roughness: 0.88,
      detail: 0.011,
      maxTriangles: 800,
      textureDensity: 2,
    });

    // ---------------------------------------------------------------- iron door straps
    const ironZ = dz + 0.085;
    const strap = (y: number) => sdf.box([0.6, 0.05, 0.026], 0.012).at(0, y, ironZ);
    k.body(
      'iron',
      sdf.union(strap(0.55), strap(1.0), sdf.sphere(0.03).at(0.17, 0.8, ironZ)),
      { color: C.iron, roughness: 0.5, metalness: 0.7, detail: 0.008, maxTriangles: 250 },
    );
  },
});
