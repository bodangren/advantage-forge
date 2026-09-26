import { defineAsset, motion, noise, profile, rgb, sdf, THREE } from '../src/index.js';

/**
 * Skeleton mage — Chibi Quest dungeon enemy (catalog `enemies/undead/skeleton-mage`), about 1.02 m
 * to the tip of its candle flame, faces +Z. Target: docs/enemy-mockups/skeleton-mage_001.png
 * (cropped from docs/character-mockups/chibi-quest-enemies.png). Built on the skeleton's skull and
 * the rogue's skeleton, with the wizard's palm flame and the druid's lantern staff.
 *
 * Role: a dungeon caster enemy, seen in 3D and as a 128 px sprite; the candle, the glowing eyes,
 *   and the two purple flames must read.
 * One idea: a grinning skull that is also a melting candle, lit on top, in a torn purple robe,
 *   holding a ghostly purple flame in one bony hand and a lantern staff in the other.
 * Proportions: the rogue's head height (skull center 0.675, eye sockets 0.63), the candle from
 *   0.8 to 0.95 with its flame to 1.03, the robe to the ground, the staff to 0.98.
 * Shape language: round and blocky (skull, candle, lantern) with sharp, ragged edges (robe hem,
 *   sleeve ends) and curling flames.
 * Palette (60/30/10): dark purple robe #3e2e52; cream bone and wax #efe4c8; brown leather and
 *   wood; glowing purple #b060ff and orange #ffae3a as the accents.
 * Value plan: the glowing orange eyes in the dark sockets and the candle flame are the focal
 *   point; the two purple flames at the sides are the second accents.
 * Bodies: bone, wax, wick, candle-fire, eyes, robe, sash, satchel, staff, lantern-frame,
 *   lantern-light, palm-fire.
 * Rig: the rogue's skeleton plus `weapon` (the staff, rigid under `hand.L`), `lantern` (under it),
 *   the two flames `candle` (under `head`) and `palmfire` (under `hand.R`), so clips can drop the
 *   staff and put the flames out. Clips: idle, walk (a gliding shuffle), run, attack (a spell
 *   cast), hit, death (the robe crumples into a heap, the staff falls, the skull rolls off).
 */

const C = {
  bone: '#efe4c8',
  boneShade: '#c9b58e',
  socket: '#1a1416',
  wax: '#f8f2e2',
  waxShade: '#e0d4b4',
  wick: '#2a2020',
  eye: '#ff8c10',
  robe: '#3e2e52',
  robeDark: '#2a1e3a',
  sash: '#7a4a9a',
  leather: '#7a4a2c',
  leatherDark: '#503020',
  brass: '#b8893a',
  wood: '#5a3a26',
  woodDark: '#3a2418',
  iron: '#3a3238',
  purple: '#8a2aff',
  purpleCore: '#d8a8ff',
  fire: '#ff7a0a',
  fireCore: '#ffd040',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Joints. The right hand (-X) is open, palm up, with a purple flame; the left hand (+X) holds
// the staff upright.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.2, 0.345, 0.03];
const WRIST_R: V3 = [-0.245, 0.335, 0.1];
const ELBOW_L: V3 = [0.2, 0.33, 0.02];
const WRIST_L: V3 = [0.235, 0.3, 0.09];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const GRIP: V3 = [WRIST_L[0] + 0.012, WRIST_L[1] - 0.038, WRIST_L[2] + 0.014];

/** A bony hand wrapped around a vertical staff at `g`: a small palm and four curled finger bones. */
const boneGrip = (g: V3) =>
  sdf.smoothUnion(
    0.006,
    sdf.ellipsoid([0.03, 0.04, 0.03]).at(g[0] + 0.012, g[1], g[2] - 0.004),
    ...[0, 1, 2, 3].map((i) => {
      const y = g[1] + 0.024 - i * 0.017;
      return sdf.chain(
        [
          [g[0] + 0.022, y, g[2] + 0.01, 0.0095],
          [g[0] + 0.004, y - 0.002, g[2] + 0.026, 0.0088],
          [g[0] - 0.018, y - 0.004, g[2] + 0.014, 0.008],
        ],
        0.004,
      );
    }),
    sdf.chain(
      [
        [g[0] + 0.03, g[1] + 0.02, g[2] + 0.004, 0.01],
        [g[0] + 0.01, g[1] + 0.034, g[2] + 0.018, 0.0085],
      ],
      0.004,
    ),
  );

/** An open bony hand, palm up, pointing along -X from the wrist at `w`. */
const boneOpenHand = (w: V3) =>
  sdf.smoothUnion(
    0.006,
    sdf.ellipsoid([0.036, 0.016, 0.032]).at(w[0] - 0.034, w[1], w[2] + 0.006),
    ...[-0.02, -0.007, 0.007, 0.02].map((dz, i) =>
      sdf.chain(
        [
          [w[0] - 0.06, w[1], w[2] + 0.006 + dz, 0.0085],
          [w[0] - 0.084 + Math.abs(i - 1.5) * 0.004, w[1] + 0.008, w[2] + 0.006 + dz * 1.1, 0.0078],
          [w[0] - 0.098 + Math.abs(i - 1.5) * 0.006, w[1] + 0.022, w[2] + 0.006 + dz * 1.15, 0.007],
        ],
        0.004,
      ),
    ),
    sdf.chain(
      [
        [w[0] - 0.026, w[1] + 0.004, w[2] + 0.034, 0.0095],
        [w[0] - 0.048, w[1] + 0.02, w[2] + 0.048, 0.008],
      ],
      0.004,
    ),
  );

/** A flame: a round base that rises into three curling tongues. `h` is its height. */
const flame = (h: number) =>
  sdf.smoothUnion(
    h * 0.08,
    sdf.sphere(h * 0.3).at(0, h * 0.3, 0),
    sdf.chain(
      [
        [0, h * 0.35, 0, h * 0.28],
        [h * 0.05, h * 0.7, 0, h * 0.16],
        [-h * 0.04, h, 0, h * 0.03],
      ],
      h * 0.1,
    ),
    sdf.chain(
      [
        [h * 0.14, h * 0.4, 0.0, h * 0.13],
        [h * 0.3, h * 0.66, 0, h * 0.07],
        [h * 0.26, h * 0.86, 0, h * 0.018],
      ],
      h * 0.06,
    ),
    sdf.chain(
      [
        [-h * 0.15, h * 0.36, 0, h * 0.12],
        [-h * 0.3, h * 0.58, 0.02 * h, h * 0.06],
        [-h * 0.3, h * 0.76, 0, h * 0.016],
      ],
      h * 0.06,
    ),
  );
/** Flame color: a light core low in the flame, the outer color toward the tips. */
const flamePaint = (base: V3, h: number, coreHex: string, outerHex: string) => {
  const core = rgb(coreHex);
  const outer = rgb(outerHex);
  return (x: number, y: number, z: number) => {
    const t = Math.min(1, Math.max(0, (y - base[1]) / h));
    const r = Math.hypot(x - base[0], z - base[2]) / (h * 0.3);
    const k = Math.min(1, Math.max(0, t * 0.9 + r * 0.5 - 0.15));
    return [core[0] + (outer[0] - core[0]) * k, core[1] + (outer[1] - core[1]) * k, core[2] + (outer[2] - core[2]) * k] as const;
  };
};

export default defineAsset({
  name: 'skeleton-mage',
  description: 'Chibi skeleton mage dungeon enemy: a skull topped by a melting candle, glowing eyes, a torn purple robe, a skull necklace, a purple flame in one hand, and a lantern staff.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/skeleton-mage_001.png',

  build(k) {
    // ------------------------------------------------------------------ the staff line
    const STAFF_TOP = 0.9;
    const HOOK: V3 = [GRIP[0] + 0.11, STAFF_TOP + 0.02, GRIP[2]];
    const LANTERN: V3 = [HOOK[0], HOOK[1] - 0.14, HOOK[2]];
    const WICK_TOP: V3 = [0, 0.975, -0.01];
    const CANDLE_FIRE: V3 = [WICK_TOP[0], WICK_TOP[1] - 0.016, WICK_TOP[2]]; // the candle flame's base
    const PALM: V3 = [WRIST_R[0] - 0.05, WRIST_R[1] + 0.02, WRIST_R[2] + 0.006]; // the palm flame's base

    // ------------------------------------------------------------------ skeleton (rig)
    const RIG: Record<string, { parent?: string; at: V3; tail?: V3 }> = {
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW_L },
      'hand.L': { parent: 'forearm.L', at: WRIST_L },
      weapon: { parent: 'hand.L', at: GRIP },
      lantern: { parent: 'weapon', at: HOOK, tail: LANTERN },
      candle: { parent: 'head', at: CANDLE_FIRE },
      palmfire: { parent: 'hand.R', at: PALM },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
      'leg.L': { parent: 'hips', at: HIP },
      'foot.L': { parent: 'leg.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'foot.R': { parent: 'leg.R', at: mx(ANKLE) },
    };
    k.skeleton(RIG);

    // ------------------------------------------------------------------ skull
    // A boxy cranium (it carries a candle), wide cheekbones, and a narrower block of teeth.
    const skullSolid = sdf.smoothUnion(
      0.04,
      sdf.box([0.36, 0.28, 0.33], 0.12).at(0, HEAD_Y + 0.03, -0.005),
      pair(sdf.sphere(0.08).at(0.11, 0.59, 0.08)), // cheekbones
      sdf.box([0.16, 0.085, 0.13], 0.035).at(0, 0.53, 0.075), // the teeth block
    );
    const faceZ = (x: number, y: number) => sdf.raycast(skullSolid, [x, y, 1], [0, 0, -1])![2];
    // Big round eye sockets and a nose hole shaped like an upside-down heart.
    const EYE: V3 = [0.09, 0.64, 0];
    const sockets = pair(sdf.ellipsoid([0.058, 0.056, 0.07]).at(EYE[0], EYE[1], faceZ(EYE[0], EYE[1]) + 0.006));
    const noseZ = faceZ(0, 0.572);
    const noseHole = pair(sdf.ellipsoid([0.013, 0.022, 0.03]).rotateZ(-24).at(0.011, 0.572, noseZ + 0.01));
    const skull = skullSolid.smoothSubtract(0.01, sockets).smoothSubtract(0.004, noseHole);
    const TEETH_Y = 0.535;
    const mouthLine = sdf.extrude(profile.rect([0.15, 0.009], 0.004), 0.4).at(0, TEETH_Y, 0.2);
    const gap = (x: number, y: number) => sdf.extrude(profile.rect([0.007, 0.03], 0.002), 0.4).at(x, y, 0.2);
    const gaps = sdf.union(...[-0.054, -0.018, 0.018, 0.054].map((x) => gap(x, TEETH_Y + 0.018)), ...[-0.036, 0, 0.036].map((x) => gap(x, TEETH_Y - 0.017)));
    // Bony feet peek out under the hem.
    const foot = sdf
      .smoothUnion(0.008, sdf.ellipsoid([0.04, 0.024, 0.05]).at(0, 0.024, 0.03), ...[-0.022, 0, 0.022].map((x) => sdf.sphere(0.014).at(x, 0.016, 0.08)))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(10)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    // Necklace: three small skulls hang from a cord of beads across the chest.
    const miniSkull = (x: number, y: number, z: number) =>
      sdf.smoothUnion(0.006, sdf.sphere(0.03).at(x, y + 0.006, z), sdf.box([0.034, 0.02, 0.03], 0.008).at(x, y - 0.018, z + 0.004));
    const necklaceSkulls = sdf.union(miniSkull(-0.045, 0.44, 0.13), miniSkull(0.0, 0.43, 0.14), miniSkull(0.045, 0.44, 0.13));
    const miniEyes = sdf.union(
      ...[-0.045, 0, 0.045].flatMap((x) => [-1, 1].map((s) => sdf.sphere(0.009).at(x + s * 0.011, x === 0 ? 0.438 : 0.448, x === 0 ? 0.168 : 0.158))),
    );
    const bone = sdf
      .union(
        skull.bone('head'),
        boneGrip(GRIP).bone('hand.L'),
        boneOpenHand(WRIST_R).bone('hand.R'),
        pair(foot),
        necklaceSkulls.bone('chest'),
      )
      .paintWhere(sockets.round(0.016), C.boneShade, 0.01)
      .paintWhere(sockets.round(0.007), C.socket, 0.003)
      .paintWhere(noseHole.round(0.003), C.socket, 0.003)
      .paintWhere(mouthLine, C.socket, 0.002)
      .paintWhere(gaps.intersect(sdf.box([0.15, 0.07, 0.4]).at(0, TEETH_Y, 0.2)), C.socket, 0.002)
      .paintWhere(miniEyes, C.socket, 0.002);
    k.body('bone', bone, { color: C.bone, roughness: 0.6, textureDensity: 2 });

    // Glowing eyes deep in the sockets.
    const eyes = pair(sdf.sphere(0.029).at(EYE[0] - 0.002, EYE[1] - 0.008, faceZ(EYE[0], EYE[1]) - 0.044));
    k.body('eyes', eyes.bone('head'), { color: C.eye, roughness: 0.2, emissive: C.eye, emissiveIntensity: 0.8 });

    // ------------------------------------------------------------------ the candle on the skull
    // A thick candle standing on the cranium, with a pool of melted wax that runs down over the
    // top of the skull in drips.
    const CANDLE_R = 0.16;
    const candle = sdf.cylinder(CANDLE_R, 0.18, 0.03).at(0, 0.86, -0.01).smoothSubtract(0.02, sdf.cylinder(CANDLE_R - 0.03, 0.06, 0.01).at(0, 0.965, -0.01));
    const skullTop = (x: number, z: number) => sdf.raycast(skullSolid, [x, 2, z], [0, -1, 0])!;
    const pool = sdf.smoothIntersect(0.02, skullSolid.round(0.02), sdf.halfSpace([0, -1, 0], -0.79));
    const drip = (a: number, len: number, r: number) => {
      const x = Math.sin(a) * 0.17;
      const z = Math.cos(a) * 0.15 - 0.01;
      const start = skullTop(x * 0.9, z * 0.9);
      const dir: V3 = [Math.sin(a), 0, Math.cos(a)];
      const out = sdf.surfacePoint(skullSolid, [start[0] + dir[0] * 0.2, start[1] - len, start[2] + dir[2] * 0.2], 0.004);
      return sdf.chain(
        [
          [start[0], start[1], start[2], r],
          [(start[0] + out[0]) / 2 + dir[0] * 0.01, (start[1] + out[1]) / 2, (start[2] + out[2]) / 2 + dir[2] * 0.01, r * 0.9],
          [out[0], out[1], out[2], r * 1.1],
        ],
        0.008,
      );
    };
    const drips = sdf.union(
      ...[
        [-1.2, 0.1, 0.024],
        [-0.55, 0.15, 0.028],
        [-0.1, 0.07, 0.022],
        [0.3, 0.12, 0.026],
        [0.75, 0.16, 0.026],
        [1.3, 0.1, 0.024],
        [2.0, 0.13, 0.026],
        [2.8, 0.15, 0.026],
        [3.6, 0.1, 0.022],
        [4.4, 0.14, 0.026],
        [5.3, 0.11, 0.024],
      ].map(([a, len, r]) => drip(a!, len!, r!)),
    );
    // Drips on the candle's own side, from its rim.
    const candleDrips = sdf.union(
      ...[0.3, 1.4, 2.6, 3.9, 5.0].map((a, i) =>
        sdf.capsule(
          [Math.sin(a) * (CANDLE_R - 0.006), 0.93, Math.cos(a) * (CANDLE_R - 0.006) - 0.01],
          [Math.sin(a) * (CANDLE_R - 0.002), 0.93 - 0.04 - (i % 3) * 0.025, Math.cos(a) * (CANDLE_R - 0.002) - 0.01],
          0.015,
        ),
      ),
    );
    const wax = sdf
      .smoothUnion(0.02, candle, pool, drips, candleDrips)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.8).intersect(sdf.cylinder(0.3, 1).at(0, 0.5, 0)), C.waxShade, 0.03);
    k.body('wax', wax.bone('head'), { color: C.wax, roughness: 0.35, textureDensity: 1.5 });
    k.body('wick', sdf.capsule([0, 0.93, -0.01], WICK_TOP, 0.007).bone('head'), { color: C.wick, roughness: 0.8, detail: 0.003 });
    const candleFlame = flame(0.15).at(...CANDLE_FIRE);
    k.body('candle-fire', candleFlame.paintFn(flamePaint(CANDLE_FIRE, 0.15, C.fireCore, C.fire)), {
      bone: 'candle',
      color: C.fire,
      roughness: 0.4,
      emissive: '#ff5a14',
      emissiveIntensity: 0.45,
      detail: 0.0035,
    });

    // ------------------------------------------------------------------ robe: to the ground, a torn hem, a hood fallen on the shoulders
    const robeShape = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.125, 0.4],
            [0.13, 0.34],
            [0.13, 0.29],
            [0.14, 0.24],
            [0.165, 0.16],
            [0.195, 0.08],
            [0.215, 0.03],
            [0.205, 0.02],
            [0, 0.02],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.82]);
    // Ragged points along the hem: V notches of different depths all around.
    const notch = (angle: number, top: number, w: number) =>
      sdf
        .extrude(
          profile.polygon([
            [-w, -0.01],
            [w, -0.01],
            [0, top],
          ]),
          0.6,
        )
        .rotateY(angle);
    const hem = sdf.union(...Array.from({ length: 9 }, (_, i) => notch(i * 20 + 7, 0.05 + 0.03 * ((i * 5) % 3) * 0.5, 0.024 + 0.006 * (i % 2))));
    // The fallen hood: a thick soft roll around the neck and over the shoulders at the back.
    const hood = sdf
      .revolve(
        profile.polygon(
          [
            [0.06, 0.53],
            [0.12, 0.52],
            [0.17, 0.48],
            [0.18, 0.43],
            [0.15, 0.41],
            [0.1, 0.45],
            [0.06, 0.47],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.9])
      .smoothUnion(0.04, sdf.ellipsoid([0.16, 0.075, 0.06]).at(0, 0.485, -0.12)) // the hood's folds behind the neck
      .subtract(sdf.box([0.16, 0.3, 0.3]).at(0, 0.55, 0.2)); // open in front of the jaw
    // Wide bell sleeves with ragged ends.
    const sleeve = (s: V3, e: V3, w: V3) => {
      const end = lerp(e, w, 0.55);
      const notches = sdf.union(sdf.sphere(0.024).at(end[0], end[1] - 0.074, end[2]), sdf.sphere(0.02).at(end[0], end[1] + 0.01, end[2] + 0.074));
      return sdf
        .cone([s[0] * 0.85, 0.41, 0], end, 0.05, 0.072)
        .subtract(sdf.sphere(0.058).at(...lerp(e, w, 0.82))) // a dark opening for the hand
        .subtract(notches);
    };
    const robe = sdf
      .union(
        robeShape.subtract(hem).bone('spine'),
        hood.bone('chest'),
        sleeve(SHOULDER, ELBOW_L, WRIST_L).bone('upperarm.L'),
        sleeve(mx(SHOULDER), ELBOW_R, WRIST_R).bone('upperarm.R'),
      )
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.12), C.robeDark, 0.04)
      .paintFn((x, y, z, base) => (noise.fbm(x * 20, y * 20, z * 20, 2) > 0.35 ? [base[0] * 0.85, base[1] * 0.85, base[2] * 0.85] : base));
    k.body('robe', robe, { color: C.robe, roughness: 0.85, bump: (x, y, z) => 0.0008 * noise.fbm(x * 70, y * 30, z * 70, 2) });

    // A purple sash at the waist with a hanging end, and a cord for the necklace.
    const beltY = 0.25;
    const sash = robeShape.round(0.012).smoothIntersect(0.006, sdf.box([0.6, 0.05, 0.6], 0.01).at(0, beltY, 0));
    const sashEnd = sdf.box([0.04, 0.12, 0.016], 0.006).rotateZ(-8).at(0.04, beltY - 0.07, sdf.raycast(sash, [0.04, beltY, 1], [0, 0, -1])![2] - 0.002);
    const cord = sdf.chain(
      [
        [-0.09, 0.47, 0.08, 0.006],
        [-0.045, 0.455, 0.125, 0.006],
        [0.0, 0.448, 0.135, 0.006],
        [0.045, 0.455, 0.125, 0.006],
        [0.09, 0.47, 0.08, 0.006],
      ],
      0.004,
    );
    k.body('sash', sdf.union(sash.bone('spine'), sashEnd.bone('spine'), cord.bone('chest')), { color: C.sash, roughness: 0.75 });

    // ------------------------------------------------------------------ the satchel on the right hip
    const bagAt = sdf.surfacePoint(robeShape, [-0.15, 0.2, 0.12], 0);
    const bagPose = (s: sdf.Shape) => s.rotateY(-40).at(bagAt[0] - 0.018, bagAt[1], bagAt[2] + 0.012);
    const satchel = sdf.union(
      sdf.box([0.1, 0.09, 0.04], 0.012),
      sdf.box([0.104, 0.045, 0.046], 0.01).at(0, 0.024, 0.002).paint(C.leatherDark),
      sdf.box([0.014, 0.024, 0.01], 0.003).at(0, 0.006, 0.026).paint(C.brass),
    );
    const bagStrap = robeShape.round(0.01).smoothIntersect(0.004, sdf.box([0.7, 0.024, 0.7], 0.004).rotateZ(38).at(0, 0.34, 0));
    k.body('satchel', sdf.union(bagPose(satchel), bagStrap).bone('spine'), { color: C.leather, roughness: 0.65 });

    // ------------------------------------------------------------------ the gnarled staff with a hanging lantern
    const staffPts: [number, number, number, number][] = [
      [GRIP[0] - 0.004, 0.02, GRIP[2] + 0.006, 0.014],
      [GRIP[0] + 0.006, 0.2, GRIP[2] - 0.004, 0.016],
      [GRIP[0], 0.45, GRIP[2] + 0.004, 0.017],
      [GRIP[0] - 0.006, 0.7, GRIP[2], 0.018],
      [GRIP[0] + 0.004, STAFF_TOP - 0.03, GRIP[2], 0.02],
    ];
    const crook = sdf.chain(
      [
        [GRIP[0] + 0.004, STAFF_TOP - 0.03, GRIP[2], 0.02],
        [GRIP[0] + 0.03, STAFF_TOP + 0.04, GRIP[2], 0.016],
        [HOOK[0] - 0.02, HOOK[1] + 0.03, HOOK[2], 0.013],
        [HOOK[0], HOOK[1], HOOK[2], 0.01],
      ],
      0.01,
    );
    // Vines wind around the staff.
    const twist = sdf.chain(
      Array.from({ length: 14 }, (_, i) => {
        const y = 0.35 + i * 0.04;
        const a = i * 1.1;
        return [GRIP[0] + Math.cos(a) * 0.02, y, GRIP[2] + Math.sin(a) * 0.02, 0.008] as [number, number, number, number];
      }),
      0.006,
    );
    const staff = sdf
      .smoothUnion(0.012, sdf.chain(staffPts, 0.02), crook, twist)
      .paintFn((x, y, z, base) => (noise.fbm(x * 90, y * 12, z * 90, 2) > 0.25 ? rgb(C.woodDark) : base));
    k.body('staff', staff, { color: C.wood, roughness: 0.8, bone: 'weapon', bump: (x, y, z) => 0.0012 * noise.fbm(x * 160, y * 25, z * 160, 2) });
    const lanternFrame = sdf
      .union(
        sdf.cylinder(0.036, 0.014, 0.004).at(0, 0.036, 0), // cap
        sdf.cone([0, 0.042, 0], [0, 0.062, 0], 0.028, 0.01), // roof
        sdf.cylinder(0.038, 0.014, 0.004).at(0, -0.04, 0), // base
        sdf.cone([0, -0.046, 0], [0, -0.07, 0], 0.02, 0.004), // the point below
        ...[0, 90, 180, 270].map((a) => sdf.capsule([0.032, -0.034, 0], [0.032, 0.03, 0], 0.005).rotateY(a + 45)), // bars
        sdf.torus(0.022, 0.004).rotateX(90).at(0, 0.086, 0), // bail
      )
      .scale(1.35)
      .at(...LANTERN);
    k.body('lantern-frame', lanternFrame.bone('lantern'), { color: C.iron, roughness: 0.45, metalness: 0.6 });
    const lanternFlame = flame(0.08).at(LANTERN[0], LANTERN[1] - 0.044, LANTERN[2]);
    k.body('lantern-light', lanternFlame.paintFn(flamePaint([LANTERN[0], LANTERN[1] - 0.044, LANTERN[2]], 0.08, C.purpleCore, C.purple)).bone('lantern'), {
      color: C.purple,
      roughness: 0.3,
      emissive: C.purple,
      emissiveIntensity: 0.9,
      detail: 0.0035,
    });

    // ------------------------------------------------------------------ the purple flame over the open right hand
    const palmFlame = flame(0.17).at(...PALM);
    k.body('palm-fire', palmFlame.paintFn(flamePaint(PALM, 0.17, C.purpleCore, C.purple)), {
      bone: 'palmfire',
      color: C.purple,
      roughness: 0.3,
      emissive: C.purple,
      emissiveIntensity: 0.9,
      detail: 0.0035,
    });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const LEG = 0.19;

    k.animation('idle', {
      duration: 2.8,
      pose: (_t, p) => ({
        hips: { move: [0, -0.004 * bump(p), 0], rotate: [0, 0, 2 * wave(p)] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        // The skull tilts, curious and a bit creepy.
        head: { rotate: [2 * wave(p, 1, 0.3), 6 * wave(p, 1, 0.1), 8 * wave(p, 1, 0.25)] },
        lantern: { rotate: [4 * wave(p, 1, 0.4), 0, 6 * wave(p, 1, 0.2)] },
        'upperarm.R': { rotate: [-3 * bump(p), 0, -2 * wave(p, 1, 0.2)] },
        'forearm.R': { rotate: [-6 * bump(p), 0, 0] },
      }),
    });

    // A gliding shuffle: short steps under the robe, a gentle bob and sway.
    const glide = (duration: number, legSwing: number, lean: number, sway: number, swing: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        return {
          hips: { move: [0, -legDrop(LEG, legSwing * s) * 0.6 + 0.006 * bump(p, 2), 0] as const, rotate: [0, 5 * s, sway * s] as const },
          spine: { rotate: [lean, 0, -sway * 0.5 * s] as const },
          head: { rotate: [-lean, 4 * s, 3 * wave(p, 1, 0.25)] as const },
          lantern: { rotate: [lean * 2 + swing * wave(p, 2, 0.2), 0, swing * 0.6 * wave(p, 1, 0.3)] as const },
          'leg.L': { rotate: [-legSwing * s, 0, 0] as const },
          'leg.R': { rotate: [legSwing * s, 0, 0] as const },
          'foot.L': { rotate: [legSwing * 0.5 * s, 0, 0] as const },
          'foot.R': { rotate: [-legSwing * 0.5 * s, 0, 0] as const },
          'upperarm.R': { rotate: [-6 * s, 0, 0] as const },
          'upperarm.L': { rotate: [4 * s, 0, 0] as const },
        };
      },
    });
    k.animation('walk', glide(1.1, 18, 4, 3, 10));
    k.animation('run', glide(0.7, 28, 12, 4, 18));

    // A cast, solved by targets. The wrist follows keys in the chest's rest frame (reach); the
    // flame axis (the hand's rest +Y) follows its own keys (orient), and the fingers stay pointed
    // out to the right, so the palm turns from up to forward about one axis. Gather: the flame
    // hand pulls back and down to the right hip, and the body leans back and turns the right
    // shoulder away. Push: the arm thrusts straight, forward and out to the right at chest height,
    // below and outside the skull, and the flame points at the target. Recovery: back to rest.
    // The flame shares `hand.R` with the bony hand, so it keeps its size.
    const { keys, reach, orient } = motion;
    const unit = (v: V3): V3 => {
      const l = Math.hypot(v[0], v[1], v[2]);
      return [v[0] / l, v[1] / l, v[2] / l];
    };
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const FLAME_UP: V3 = [0, 1, 0]; // the flame's axis at rest
    const FINGERS: V3 = [-1, 0, 0]; // the open hand's fingers at rest
    const HIP_R: V3 = [-0.215, 0.255, -0.05];
    const PUSH: V3 = [-0.255, 0.37, 0.115];
    k.animation('attack', {
      duration: 1.0,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [0.14, [-0.25, 0.3, 0.03]],
            [0.3, HIP_R],
            [0.4, [-0.22, 0.26, -0.055]], // the hold at the hip
            [0.46, [-0.275, 0.32, 0.03]], // out past the robe
            [0.52, PUSH],
            [0.66, [-0.252, 0.366, 0.11]],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        const dir = unit(
          keys(
            p,
            [
              [0, FLAME_UP],
              [0.3, [-0.35, 1, -0.25]], // up, out, and back at the hip
              [0.4, [-0.35, 1, -0.25]],
              [0.46, [-0.4, 0.75, 0.55]],
              [0.52, [-0.45, 0.1, 0.89]], // at the target: forward and out to the right
              [0.66, [-0.42, 0.14, 0.9]],
              [1, FLAME_UP],
            ] as const,
          ),
        );
        const fingers = keys(p, [[0, FINGERS], [0.3, [-1, 0, 0.3]], [0.4, [-1, 0, 0.3]], [0.52, [-1, 0.4, 0]], [0.66, [-1, 0.4, 0]], [1, FINGERS]] as const);
        // The elbow bends back and out at the hip, down and out in the thrust.
        const pole = keys(p, [[0, ELBOW_R], [0.3, [-0.35, 0.3, -0.25]], [0.4, [-0.35, 0.3, -0.25]], [0.52, [-0.35, 0.2, 0.05]], [0.66, [-0.35, 0.2, 0.05]], [1, ELBOW_R]] as const);
        const arm = reach(ARM_R, wrist, pole);
        const hand = orient([arm.upper, arm.lower], { dir: FLAME_UP, up: FINGERS }, { dir, up: fingers });
        const twist = keys(p, [[0, 0], [0.3, -14], [0.4, -15], [0.52, 12], [0.66, 10], [1, 0]] as const);
        const lean = keys(p, [[0, 0], [0.3, -6], [0.4, -7], [0.52, 9], [0.66, 8], [1, 0]] as const);
        const fwd = keys(p, [[0, 0], [0.3, -0.012], [0.4, -0.014], [0.52, 0.035], [0.66, 0.03], [1, 0]] as const);
        const look = keys(p, [[0, 0], [0.3, 6], [0.4, 6], [0.52, -18], [0.66, -16], [1, 0]] as const);
        const thrust = keys(p, [[0, 0], [0.4, 0], [0.52, 1], [0.66, 1], [1, 0]] as const);
        const gather = keys(p, [[0, 0], [0.3, 1], [0.4, 1], [0.52, 0]] as const);
        // The feet stay planted: the legs tilt under the hips as the hips move.
        const legA = (Math.atan2(fwd, LEG) * 180) / Math.PI;
        return {
          hips: { move: [0, -legDrop(LEG, legA), fwd] },
          spine: { rotate: [lean, twist * 0.4, 0] },
          chest: { rotate: [0, twist * 0.6, 0] },
          head: { rotate: [-0.7 * lean, look, 0] },
          lantern: { rotate: [8 * thrust - 4 * gather, 0, 10 * wave(p, 3) * thrust] },
          'upperarm.L': { rotate: [8 * thrust - 4 * gather, 0, 0] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          'leg.L': { rotate: [legA, 0, 0] },
          'leg.R': { rotate: [legA, 0, 0] },
          'foot.L': { rotate: [-legA, 0, 0] },
          'foot.R': { rotate: [-legA, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ hit: a blow from the front
    // The chest snaps back and the loose skull rattles on its neck; the candle flame gutters and
    // flares, the robe jolts, and the lantern swings. The staff and the palm flame stay in the
    // hands. Then all returns quickly.
    const { quat, euler } = motion;
    const DEG = Math.PI / 180;
    const SHIN = HIP[1] - ANKLE[1]; // hip joint to ankle joint
    /** The leg angle (degrees) that keeps a foot on its rest spot when the hips move `back` meters. */
    const plantLean = (back: number) => Math.asin(Math.max(-1, Math.min(1, back / SHIN))) / DEG;
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.14, 1], [0.3, 0.8], [0.8, 0]] as const);
        const rattle = keys(p, [[0.06, 0], [0.14, 1], [0.22, -0.8], [0.3, 0.55], [0.38, -0.35], [0.46, 0.18], [0.56, 0]] as const);
        const jolt = keys(p, [[0.06, 0], [0.18, 1], [0.32, -0.6], [0.46, 0.3], [0.6, -0.1], [0.72, 0]] as const);
        const flick = keys(p, [[0.04, 1], [0.1, 0.45], [0.16, 1.3], [0.24, 0.7], [0.32, 1.15], [0.44, 0.9], [0.58, 1]] as const);
        const back = 0.025 * h;
        const lean = plantLean(back);
        const fw = 0.7 + 0.3 * flick;
        return {
          hips: { move: [0, -legDrop(SHIN, lean), -back], rotate: [0, 4 * h, 0] },
          spine: { rotate: [-4 * h + 2 * jolt, 0, 3 * jolt] },
          chest: { rotate: [-10 * h, 5 * h, 2 * h] },
          neck: { rotate: [-8 * h + 3 * rattle, 0, 0] },
          head: { rotate: [-16 * h + 6 * rattle, 8 * rattle, 7 * rattle - 3 * h] },
          candle: { scale: [fw, flick, fw] },
          lantern: { rotate: [-16 * jolt, 0, 8 * jolt] },
          // The staff arm holds the staff near upright and tilts it out, away from the skull.
          'upperarm.L': { rotate: [5 * h, 0, -4 * h] },
          'forearm.L': { rotate: [3 * h, 0, 0] },
          'upperarm.R': { rotate: [-4 * h, 0, -12 * h] },
          'forearm.R': { rotate: [8 * h, 0, 0] },
          palmfire: { scale: [1 - 0.1 * rattle, 1 + 0.15 * rattle, 1 - 0.1 * rattle] },
          'leg.L': { rotate: [-lean, 0, 0] },
          'leg.R': { rotate: [-lean, 0, 0] },
          'foot.L': { rotate: [lean, 0, 0] },
          'foot.R': { rotate: [lean, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: a stagger, then a heap of robe and bones
    // The blow snaps the chest back and rattles the skull, and the palm flame sputters out. The hand
    // lets the staff go: it topples out to the left front and lands flat, the lantern on its side
    // beside it. The robe crumples into a heap (the spine squashes; the chest scales back, so all
    // above it keeps its shape), the legs fold forward under it, and the arms sprawl. At last the
    // skull with its candle topples off to the right, rolls onto its side, and the candle goes out.
    // The `weapon` (staff) and `head` bones are placed in world space under their posed parents.
    type Pose = Record<string, { move?: V3; rotate?: V3; scale?: V3 }>;
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
    /** 0 to 1 from `a` to `b`, speeding up like a drop. */
    const fall = (a: number, b: number, x: number) => clamp01((x - a) / (b - a)) ** 2;
    const vec = (a: V3) => new THREE.Vector3(a[0], a[1], a[2]);
    const arr = (v: THREE.Vector3): V3 => [v.x, v.y, v.z];
    const offsetOf = (name: string): V3 => {
      const b = RIG[name]!;
      const pa: V3 = b.parent ? RIG[b.parent]!.at : [0, 0, 0];
      return [b.at[0] - pa[0], b.at[1] - pa[1], b.at[2] - pa[2]];
    };
    /** A bone's world matrix in a pose, by the rig's rule: rest offset plus move, then rotate, then scale. */
    const worldOf = (name: string, pose: Pose): THREE.Matrix4 => {
      const bp = pose[name] ?? {};
      const o = offsetOf(name);
      const m = bp.move ?? [0, 0, 0];
      const local = new THREE.Matrix4().compose(vec([o[0] + m[0], o[1] + m[1], o[2] + m[2]]), quat(bp.rotate ?? [0, 0, 0]), vec(bp.scale ?? [1, 1, 1]));
      const parent = RIG[name]!.parent;
      return parent ? worldOf(parent, pose).multiply(local) : local;
    };
    /** Where a point bound to bone `name` (given in rest world meters) is in a pose. */
    const pointOf = (name: string, pose: Pose, pt: V3): V3 => {
      const at = RIG[name]!.at;
      return arr(vec([pt[0] - at[0], pt[1] - at[1], pt[2] - at[2]]).applyMatrix4(worldOf(name, pose)));
    };
    const turnOf = (name: string, pose: Pose) => {
      const q = new THREE.Quaternion();
      worldOf(name, pose).decompose(new THREE.Vector3(), q, new THREE.Vector3());
      return q;
    };
    /** The move and rotate that put bone `name`'s pivot at `at` with the world turn `turn`. */
    const placeAt = (name: string, pose: Pose, at: V3, turn: THREE.Quaternion) => {
      const local = worldOf(RIG[name]!.parent!, pose).invert().multiply(new THREE.Matrix4().compose(vec(at), turn, new THREE.Vector3(1, 1, 1)));
      const pos = new THREE.Vector3();
      const q = new THREE.Quaternion();
      local.decompose(pos, q, new THREE.Vector3());
      const o = offsetOf(name);
      return { move: [pos.x - o[0], pos.y - o[1], pos.z - o[2]] as V3, rotate: euler(q) };
    };
    const turned = (v: V3, q: THREE.Quaternion) => arr(vec(v).applyQuaternion(q));
    const plus = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
    // Where the staff comes to rest: flat on the floor, out to the left front, the crook flat.
    const STAFF_FOOT: V3 = [GRIP[0] - 0.004, 0.02, GRIP[2] + 0.006]; // the bottom end of the staff
    const LIE_D = unit([0.75, 0, 0.66]);
    const LIE_U = unit([0.66, 0, -0.75]);
    const STAFF_TURN = quat(orient([], { dir: [0, 1, 0], up: [1, 0, 0] }, { dir: LIE_D, up: LIE_U }));
    const FOOT_DOWN: V3 = [0.31, 0.031, 0.13]; // keeps the staff's axis about 3.6 cm up (vines 2.8 cm)
    // The lantern lies on its side next to the crook, tilted up so its rim clears the floor.
    const lh = unit([-LIE_D[0] + 0.3 * LIE_U[0], 0, -LIE_D[2] + 0.3 * LIE_U[2]]);
    const TILT = 16 * DEG;
    const LANTERN_TURN = quat(
      orient([], { dir: [0, -1, 0], up: [1, 0, 0] }, { dir: [lh[0] * Math.cos(TILT), Math.sin(TILT), lh[2] * Math.cos(TILT)], up: [-lh[2], 0, lh[0]] }),
    );
    const LANTERN_REST = STAFF_TURN.clone().invert().multiply(LANTERN_TURN); // its rotate under the lying staff
    // Where the skull comes to rest: on its left side, to the right, the candle pointing out.
    const SKULL_C: V3 = [0, HEAD_Y + 0.03, -0.005];
    const SKULL_DOWN: V3 = [-0.54, 0.21, 0.02];
    const SKULL_TURN = quat([-12, 25, 78]);
    const HEAP = { y: 0.5, xz: 0.3 }; // the robe's squash: height lost, width gained
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.06, 1], [0.16, 0.5], [0.3, 0.15], [0.36, 0]] as const);
        const rattle = keys(p, [[0.03, 0], [0.08, 1], [0.13, -0.8], [0.18, 0.6], [0.23, -0.35], [0.28, 0.15], [0.33, 0]] as const);
        const wob = keys(p, [[0.1, 0], [0.2, 1], [0.3, -0.4], [0.36, 0]] as const);
        const sag = keys(p, [[0.16, 0], [0.32, 1]] as const);
        // The palm flame sputters and goes out; the candle gutters in the blow.
        const pf = keys(p, [[0, 1], [0.05, 1.3], [0.1, 0.55], [0.15, 0.8], [0.22, 0.25], [0.28, 0]] as const);
        const cf = keys(
          p,
          [[0, 1], [0.05, 0.5], [0.1, 1.3], [0.16, 0.7], [0.24, 1.15], [0.32, 1], [0.62, 1], [0.68, 0.6], [0.74, 1.1], [0.82, 0.85], [0.87, 0.55], [0.91, 0.65], [0.97, 0]] as const,
        );
        // The collapse: the robe crumples, faster and faster, to the impact at 0.52, and settles.
        const c = fall(0.3, 0.52, p);
        const sq = c + 0.12 * keys(p, [[0.52, 0], [0.57, 1], [0.64, 0]] as const);
        const sy = 1 - HEAP.y * sq;
        const sxz = 1 + HEAP.xz * sq;
        const limp = keys(p, [[0.3, 0], [0.46, 0.6], [0.56, 1.12], [0.64, 1]] as const);
        const back = 0.03 * hitB;
        const lean = plantLean(back) * (1 - c);
        // The hem stays on the floor as the robe squashes about the spine pivot (0.24 m above it).
        const pose: Pose = {
          hips: { move: [0, 0.24 * (sy - 1) - legDrop(SHIN, lean), -back * (1 - c) + 0.01 * c], rotate: [0, 8 * c, 0] },
          spine: { rotate: [(-6 * hitB + 3 * sag) * (1 - c), 0, 5 * wob * (1 - c)], scale: [sxz, sy, sxz] },
          // No chest turn while squashed: its counter-scale then keeps all above it rigid.
          chest: {
            rotate: [(-12 * hitB + 3 * sag) * (1 - c), 6 * hitB * (1 - c), 3 * wob * (1 - c)],
            scale: [1 / sxz, 1 / sy, 1 / sxz],
            move: [0, (-0.045 * sq) / sy, (0.025 * sq) / sxz],
          },
          neck: { rotate: [-8 * hitB + 3 * rattle + 10 * sag, 0, 0] },
          head: { rotate: [-18 * hitB + 6 * rattle + 6 * sag, 8 * rattle, 7 * rattle + 8 * wob] },
          candle: { scale: [cf, cf, cf] },
          palmfire: { scale: [pf, pf, pf] },
          // The arms fling in the blow, then sprawl out over the heap.
          'upperarm.L': { rotate: [-6 * hitB - 30 * limp, 0, -4 * hitB + 35 * limp] },
          'forearm.L': { rotate: [-20 * limp, 0, 0] },
          'upperarm.R': { rotate: [-4 * hitB - 50 * limp, 0, -12 * hitB + 14 * limp] }, // forward, clear of the skull's path
          'forearm.R': { rotate: [8 * hitB + 20 * sag - 20 * limp, 0, 0] },
          // The legs fold forward under the heap; the bony feet poke out, toes up.
          'leg.L': { rotate: [-lean - 80 * c, -12 * c, 18 * c] },
          'leg.R': { rotate: [-lean - 80 * c, 12 * c, -18 * c] },
          'foot.L': { rotate: [lean, 0, 0] },
          'foot.R': { rotate: [lean, 0, 0] },
        };
        // The staff: the hand lets go at 0.28; it topples about its foot and lands flat at 0.5.
        const sw = fall(0.28, 0.5, p);
        const swB = keys(p, [[0.5, 0], [0.54, 1], [0.6, 0]] as const);
        const lw = keys(p, [[0.3, 0], [0.5, 1]] as const);
        const lb = keys(p, [[0.5, 0], [0.56, 1], [0.64, -0.4], [0.72, 0]] as const);
        if (p > 0.28) {
          const heldTurn = turnOf('weapon', pose);
          const held = pointOf('weapon', pose, STAFF_FOOT);
          const foot = plus(lerp([held[0], Math.max(STAFF_FOOT[1], held[1]), held[2]], FOOT_DOWN, sw), [0, 0.012 * swB, 0]);
          const turn = heldTurn.clone().slerp(STAFF_TURN, sw);
          pose.weapon = placeAt('weapon', pose, plus(foot, turned([GRIP[0] - STAFF_FOOT[0], GRIP[1] - STAFF_FOOT[1], GRIP[2] - STAFF_FOOT[2]], turn)), turn);
        }
        pose.lantern = { rotate: euler(quat([-14 * hitB + 10 * wob, 0, 8 * rattle]).slerp(LANTERN_REST, lw).multiply(quat([0, 0, 6 * lb]))) };
        // The skull topples off the neck at 0.6, lands on its side at 0.76, and rocks to a stop.
        if (p > 0.6) {
          const heldTurn = turnOf('head', pose);
          const skullNow = pointOf('head', pose, SKULL_C);
          const off = fall(0.6, 0.76, p);
          const offT = keys(p, [[0.6, 0], [0.76, 1]] as const);
          const rock = keys(p, [[0.76, 0], [0.81, 1], [0.87, -0.45], [0.93, 0.15], [0.98, 0]] as const);
          const turnH = heldTurn.clone().slerp(quat([0, 0, -6 * rock]).multiply(SKULL_TURN), offT);
          const skullAt = plus(lerp(skullNow, SKULL_DOWN, off), [0, 0.12 * Math.sin(Math.PI * clamp01((p - 0.6) / 0.16)), 0]);
          pose.head = placeAt('head', pose, plus(skullAt, turned([SKULL_C[0] - RIG.head!.at[0], SKULL_C[1] - RIG.head!.at[1], SKULL_C[2] - RIG.head!.at[2]], turnH), -1), turnH);
        }
        return pose;
      },
    });
  },
});
