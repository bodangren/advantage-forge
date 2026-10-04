import { defineAsset, motion, noise, profile, sdf } from '../../src/index.js';
import type { AssetContext, AssetDefinition } from '../../src/index.js';
import type { VariantPresets, VariantSlots } from '../../src/variants.js';

/**
 * Golem kinds — the stone golem of `assets/stone-golem.ts` (a P1 dungeon enemy) and its kinds
 * (the colossal golem). One rig, body of boulders, and clip set; each kind sets the palette and
 * the slots, may drop the moss and facet the stone, and may add bodies (glowing veins). The design
 * notes of the body, the rig, and the clips are in `assets/stone-golem.ts`.
 */

const GOLEM_COLORS = {
  stone: '#575b5e',
  sage: '#6b8769',
  olive: '#5a6e3e',
  sageDark: '#34403a',
  moss: '#56752a',
  mossDark: '#3d561b',
  glow: '#3fd6ff',
};

type V3 = readonly [number, number, number];
type Rgb = readonly [number, number, number];

const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

// Joints: high, wide shoulders under the boulders, arms hanging far out, a short wide stance.
const SHOULDER: V3 = [0.3, 0.68, 0];
const ELBOW: V3 = [0.4, 0.53, 0.03];
const WRIST: V3 = [0.45, 0.4, 0.06];
const HIP: V3 = [0.13, 0.3, 0];
const KNEE: V3 = [0.16, 0.19, 0.005]; // the knee: splits the leg (shin.L takes the weight below it)
const ANKLE: V3 = [0.18, 0.09, 0.01];
// The ends of the flat bottom of the left foot block (y = 0): heel and toe.
const SOLE_HEEL: V3 = [0.18, 0, -0.1];
const SOLE_TOE: V3 = [0.18, 0, 0.15];
const HEAD_Y = 0.85;

/** Mottled stone: a slow and a fine grey variation over the color underneath. */
const mottle = (x: number, y: number, z: number, base: Rgb): Rgb => {
  const n = 1 + 0.1 * noise.fbm(x * 7, y * 7, z * 7, 3) + 0.05 * noise.fbm(x * 31, y * 31, z * 31, 2);
  return [base[0] * n, base[1] * n, base[2] * n];
};

/**
 * A chiselled block of rock at the origin: a box with seven corner cuts at random angles and a
 * little rough displacement, painted mottled.
 */
const rock = (size: V3, seed: number, cut = 0.74, rough = 0.005): sdf.Shape => {
  const h: V3 = [size[0] / 2, size[1] / 2, size[2] / 2];
  let s: sdf.Shape = sdf.box(size, Math.min(size[0], size[1], size[2]) * 0.14);
  for (let i = 0; i < 9; i++) {
    const r = (j: number) => noise.random(seed, i, j);
    const sg = (j: number) => (r(j) < 0.5 ? -1 : 1);
    const n = norm([sg(1) * (0.25 + r(2)), sg(3) * (0.25 + r(4)), sg(5) * (0.25 + r(6))]);
    const support = Math.abs(n[0]) * h[0] + Math.abs(n[1]) * h[1] + Math.abs(n[2]) * h[2];
    s = s.intersect(sdf.halfSpace(n, support * (cut + 0.1 * r(7))));
  }
  return s.displace(rough, (x, y, z) => noise.fbm(x * 14 + seed * 3.1, y * 14, z * 14, 2)).paintFn(mottle);
};

/** A groove where `cutter` crosses the outer `depth` of `s` (a crack between two stones). */
const crack = (s: sdf.Shape, cutter: sdf.Shape, depth = 0.018) => s.subtract(cutter.subtract(s.round(-depth)));

/** A ragged region above height `top` (local or world): moss on the tops of stones. */
const mossAbove = (top: number, amp = 0.02) =>
  sdf
    .box([1.6, 0.4, 1.6])
    .at(0, top + 0.2, 0)
    .displace(amp, (x, y, z) => noise.fbm(x * 20 + 5, y * 20, z * 20, 2));

/** A golem kind: the slots, fixed colors, moss, faceted stone, and extra bodies. */
export interface GolemKind {
  readonly name: string;
  readonly description: string;
  readonly reference: string;
  /** Slots `stone` and `glow` (and up to two more); the first option of each is the default. */
  readonly variants: VariantSlots;
  readonly presets?: VariantPresets;
  /** Fixed colors and the default shades of the slots (sage, olive, sageDark, moss, mossDark). */
  readonly colors?: Partial<typeof GOLEM_COLORS>;
  /** Moss on the tops of the stones and on the core (on by default). */
  readonly moss?: boolean;
  /** Faceted shading on the stone blocks (mantle, belt, limbs). */
  readonly flat?: boolean;
  /** Extra bodies (glowing veins, crystals). */
  extra?(k: AssetContext, golem: GolemShape): void;
}

/** The golem's stone shapes and slot colors that a kind builds on. */
export interface GolemShape {
  /** The shoulder boulders, collar, rune plate, and back stone (rigid on `chest`). */
  readonly mantle: sdf.Shape;
  /** The waist band (rigid on `hips`). */
  readonly belt: sdf.Shape;
  /** The forearm and fist blocks, knee blocks, and feet (tagged to their bones). */
  readonly limbs: sdf.Shape;
  /** The head block and the torso (tagged). */
  readonly head: sdf.Shape;
  readonly trunk: sdf.Shape;
  readonly tint: { readonly stone: string; readonly glow: string; readonly glowDark: string };
  /** A fixed default color that follows a slot (`k.tint(slot, { color, follow })`). */
  tone(slot: string, color: string, follow?: number): string;
}

export function golemAsset(kind: GolemKind): AssetDefinition {
  const C = { ...GOLEM_COLORS, ...kind.colors };
  return defineAsset({
    name: kind.name,
    description: kind.description,
    detail: 0.005,
    reference: kind.reference,
    variants: kind.variants,
    ...(kind.presets ? { presets: kind.presets } : {}),

    build(k) {
      // The slot colors (see variants). The sage core and the olive plates keep their own hue and
      // follow the stone slot partly, so a sandstone or basalt golem keeps a mossy core.
      const T = {
        stone: k.tint('stone'),
        sage: k.tint('stone', { color: C.sage, follow: 0.6 }),
        olive: k.tint('stone', { color: C.olive, follow: 0.6 }),
        sageDark: k.tint('stone', { color: C.sageDark, follow: 0.6 }),
        glow: k.tint('glow'),
        glowDark: k.tint('glow', -0.7),
        glowPale: k.tint('glow', 0.6),
      };
      const tone = (slot: string, color: string, follow = 1) => k.tint(slot, { color, follow });
      /** Paint moss inside `region`, with darker clumps (a kind may have no moss). */
      const moss = (s: sdf.Shape, region: sdf.Shape, soft: number) =>
        kind.moss === false
          ? s
          : s
              .paintWhere(region, C.moss, soft)
              .paintWhere(region.round(-0.01).displace(0.014, (x, y, z) => noise.fbm(x * 55, y * 55, z * 55, 2)), C.mossDark, 0.003);
      const flat = kind.flat ? { flat: true } : {};
      // ------------------------------------------------------------------ skeleton
      k.skeleton({
        hips: { at: [0, 0.3, 0] },
        spine: { parent: 'hips', at: [0, 0.4, 0] },
        chest: { parent: 'spine', at: [0, 0.54, 0] },
        neck: { parent: 'chest', at: [0, 0.72, -0.02] },
        head: { parent: 'neck', at: [0, 0.79, -0.01] },
        'upperarm.L': { parent: 'chest', at: SHOULDER },
        'forearm.L': { parent: 'upperarm.L', at: ELBOW },
        'hand.L': { parent: 'forearm.L', at: WRIST },
        'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
        'forearm.R': { parent: 'upperarm.R', at: mx(ELBOW) },
        'hand.R': { parent: 'forearm.R', at: mx(WRIST) },
        'leg.L': { parent: 'hips', at: HIP },
        'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
        'foot.L': { parent: 'shin.L', at: ANKLE },
        'leg.R': { parent: 'hips', at: mx(HIP) },
        'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
        'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
      });

      const stoneBump = (x: number, y: number, z: number) => 0.0015 * noise.fbm(x * 45, y * 45, z * 45, 2);

      // ------------------------------------------------------------------ head: a square stone block with a brow ridge and a cheek visor
      const skull = sdf.smoothUnion(
        0.04,
        sdf.box([0.3, 0.2, 0.26], 0.05).at(0, HEAD_Y - 0.01, 0.005), // the square face
        sdf.ellipsoid([0.15, 0.085, 0.13]).at(0, HEAD_Y + 0.055, -0.01), // the flat dome
      );
      const brow = sdf.box([0.32, 0.06, 0.09], 0.016).rotateX(-14).at(0, HEAD_Y + 0.05, 0.13); // the heavy brow ridge
      const visor = sdf.box([0.27, 0.06, 0.09], 0.02).rotateX(8).at(0, HEAD_Y - 0.05, 0.13); // the cheek plate
      const head0 = skull.smoothUnion(0.02, brow).smoothUnion(0.012, visor);
      const faceZ0 = (x: number, y: number) => sdf.raycast(head0, [x, y, 1], [0, 0, -1])![2];
      const EYE: V3 = [0.062, HEAD_Y - 0.003, 0];
      const eyeZ = faceZ0(EYE[0], EYE[1]);
      const sockets = pair(sdf.ellipsoid([0.048, 0.035, 0.034]).at(EYE[0], EYE[1], eyeZ));
      const head = head0.smoothSubtract(0.008, sockets).bone('head');
      const neck = sdf.capsule([0, 0.68, -0.02], [0, 0.8, -0.02], 0.08).bone('neck');

      // ------------------------------------------------------------------ trunk: sage stone with olive plates
      const chestE = sdf.ellipsoid([0.22, 0.17, 0.155]).at(0, 0.6, 0);
      const bellyE = sdf.ellipsoid([0.19, 0.13, 0.15]).at(0, 0.45, 0.02);
      const hipsE = sdf.ellipsoid([0.19, 0.1, 0.14]).at(0, 0.33, 0.005);
      const traps = pair(sdf.sphere(0.1).at(0.15, 0.7, -0.03));
      const trunkBase = sdf.smoothUnion(0.06, chestE, bellyE, hipsE, traps);
      const onTrunk = (x: number, y: number) => sdf.raycast(trunkBase, [x, y, 1], [0, 0, -1])!;
      const slab = (size: V3, seed: number, x: number, y: number, tilt: number, out = 0.25) => {
        const p = onTrunk(x, y);
        return rock(size, seed, 0.84, 0.002).rotateZ(tilt).at(p[0], p[1], p[2] - size[2] * (0.5 - out));
      };
      const pecs = pair(slab([0.17, 0.115, 0.09], 11, 0.115, 0.605, -8, 0.4));
      const abs = pair(
        sdf.union(
          slab([0.1, 0.042, 0.055], 12, 0.08, 0.542, 3, 0.4),
          slab([0.1, 0.042, 0.055], 13, 0.08, 0.497, -3, 0.4),
          slab([0.095, 0.042, 0.055], 14, 0.075, 0.452, 2, 0.4),
        ),
      );
      const trunk = sdf
        .smoothUnion(0.06, chestE.bone('chest'), bellyE.bone('spine'), hipsE.bone('hips'), traps.bone('chest'))
        .smoothUnion(0.012, pecs.bone('chest'), abs.bone('spine'));

      // Upper arms of sage stone; the forearm is hidden in the forearm block.
      const KNUCKLE: V3 = [0.44, 0.3, 0.08]; // inside the fist block
      const armAt = (s: 1 | -1) => {
        const f = (p: V3): V3 => (s > 0 ? p : mx(p));
        const side = s > 0 ? 'L' : 'R';
        return sdf.smoothUnion(
          0.03,
          sdf.cone(f(SHOULDER), f(ELBOW), 0.09, 0.08).bone(`upperarm.${side}`),
          sdf.sphere(0.078).at(...f(lerp(SHOULDER, ELBOW, 0.8))).bone(`upperarm.${side}`),
          sdf.cone(f(ELBOW), f(WRIST), 0.08, 0.07).bone(`forearm.${side}`),
          sdf.capsule(f(WRIST), f(KNUCKLE), 0.05).bone(`hand.${side}`),
        );
      };
      const legs = pair(sdf.smoothUnion(0.02, sdf.capsule(HIP, KNEE, 0.1).bone('leg.L'), sdf.capsule(KNEE, ANKLE, 0.08).bone('shin.L')));

      // Moss on the core: around the neck and the chest top, on the outer thighs, at the elbows.
      const mossCore = sdf
        .union(
          sdf.ellipsoid([0.32, 0.07, 0.22]).at(0, 0.73, -0.01),
          pair(sdf.ellipsoid([0.1, 0.06, 0.12]).at(0.2, 0.27, 0.03)),
          pair(sdf.sphere(0.075).at(ELBOW[0], ELBOW[1] + 0.02, ELBOW[2])),
          sdf.ellipsoid([0.17, 0.028, 0.2]).at(0.03, 0.44, 0.05),
        )
        .displace(0.02, (x, y, z) => noise.fbm(x * 22, y * 22, z * 22, 2));
      const core = sdf
        .smoothUnion(0.035, head, neck)
        .smoothUnion(0.04, trunk)
        .union(armAt(1), armAt(-1))
        .smoothUnion(0.03, legs)
        .paintFn(mottle)
        .paintWhere(brow.round(0.004).union(visor.round(0.004)), T.stone, 0.004)
        .paintWhere(sdf.box([0.6, 0.3, 0.6]).at(0, HEAD_Y + 0.03 + 0.15, 0), T.stone, 0.008) // a grey stone top and back of the head // the stone brow and cheek plate
        .paintWhere(sdf.ellipsoid([0.2, 0.17, 0.2]).at(0, 0.53, 0.09), T.sageDark, 0.01) // the dark seams between the plates
        .paintWhere(pecs.round(0.004).union(abs.round(0.004)), T.olive, 0.004)
        .paintWhere(sockets.round(0.012), T.sageDark, 0.006);
      const coreMossy = moss(core, mossCore, 0.008);
      const coreBump = (x: number, y: number, z: number) =>
        kind.moss !== false && mossCore.dist(x, y, z) < 0.01 ? 0.0025 * noise.fbm(x * 140, y * 140, z * 140, 2) : stoneBump(x, y, z);
      k.body('core', coreMossy, { color: T.sage, roughness: 0.85, textureDensity: 1.5, bump: coreBump });

      // ------------------------------------------------------------------ mantle: shoulder boulders, collar, rune plate
      const boulderL = sdf.union(
        crack(rock([0.3, 0.26, 0.31], 21), sdf.union(sdf.box([0.5, 0.014, 0.5]).rotateZ(14).at(0, 0.02, 0), sdf.box([0.014, 0.5, 0.5]).rotateY(25).at(0.035, 0, 0), sdf.box([0.5, 0.5, 0.014]).rotateY(-10).at(0, 0.12, 0.06))).rotateZ(-22).at(0.37, 0.73, -0.015),
        rock([0.22, 0.12, 0.25], 22).rotateZ(-30).at(0.33, 0.845, -0.02), // high at the neck, low outside: round shoulders
        rock([0.23, 0.11, 0.27], 23).rotateZ(-8).at(0.4, 0.6, 0.0),
        rock([0.12, 0.16, 0.2], 27).rotateZ(-15).at(0.475, 0.72, 0.01), // the outer bulge
      );
      const collar = sdf.union(
        rock([0.3, 0.1, 0.13], 24, 0.84).at(0, 0.77, 0.095),
        pair(rock([0.075, 0.18, 0.12], 25).rotateZ(-8).at(0.168, 0.82, 0.03)),
      );
      const RUNE: V3 = [0, 0.64, 0.19];
      const plate = sdf
        .extrude(
          profile.polygon([
            [-0.075, 0.72],
            [0.075, 0.72],
            [0.085, 0.625],
            [0, 0.49],
            [-0.085, 0.625],
          ]),
          0.1,
          0.012,
        )
        .at(0, 0, 0.135)
        .displace(0.003, (x, y, z) => noise.fbm(x * 14, y * 14, z * 14, 2))
        .smoothSubtract(0.006, sdf.cylinder(0.046, 0.06, 0.004).rotateX(90).at(...RUNE))
        .paintFn(mottle)
        .paintWhere(sdf.cylinder(0.052, 0.08).rotateX(90).at(...RUNE), T.glowDark, 0.004); // the dark socket
      const backStone = rock([0.3, 0.24, 0.12], 28).rotateX(-8).at(0, 0.6, -0.135);
      const mantle = moss(sdf.union(pair(boulderL), collar, plate, backStone), mossAbove(0.86), 0.006);
      k.body('mantle', mantle, { color: T.stone, roughness: 0.9, bone: 'chest', detail: 0.0055, bump: stoneBump, ...flat });

      // ------------------------------------------------------------------ belt: a stone band around the waist
      const waist = sdf.smoothUnion(0.06, sdf.ellipsoid([0.19, 0.13, 0.15]).at(0, 0.45, 0.02), sdf.ellipsoid([0.19, 0.1, 0.14]).at(0, 0.33, 0.005));
      const BELT_Y = 0.355;
      const grooves = sdf.union(...[35, 80, 125, 180, -125, -80, -35].map((a) => sdf.box([0.014, 0.4, 0.5]).at(0, BELT_Y, 0.25).rotateY(a)));
      const band = crack(waist.round(0.034).smoothIntersect(0.012, sdf.box([0.8, 0.14, 0.8]).at(0, BELT_Y, 0)), grooves, 0.02).paintFn(mottle);
      const beltZ = sdf.raycast(band, [0, BELT_Y, 1], [0, 0, -1])![2];
      const beltFront = crack(rock([0.15, 0.13, 0.08], 26, 0.86), sdf.box([0.012, 0.5, 0.5])).at(0, BELT_Y - 0.005, beltZ - 0.012);
      const belt = moss(sdf.union(band, beltFront), mossAbove(0.405, 0.03).intersect(sdf.box([0.3, 1, 1])), 0.006);
      k.body('belt', belt, { color: T.stone, roughness: 0.9, bone: 'hips', detail: 0.0055, bump: stoneBump, ...flat });

      // ------------------------------------------------------------------ limbs: forearm and fist blocks, knee blocks, feet
      const gauntletL = moss(crack(rock([0.2, 0.18, 0.23], 31), sdf.box([0.5, 0.014, 0.5]).rotateZ(-18).rotateX(12)), mossAbove(0.075), 0.005)
        .rotateZ(20)
        .at(...lerp(ELBOW, WRIST, 0.62))
        .bone('forearm.L');
      // The fist: three stacked, chamfered stone blocks with two green knuckle stones set in the front.
      const fistBlocks = sdf.union(
        rock([0.25, 0.1, 0.27], 41, 0.86, 0.003).at(0, -0.085, 0),
        rock([0.23, 0.1, 0.25], 42, 0.86, 0.003).rotateY(8).at(0.005, 0.017, -0.005),
        rock([0.2, 0.08, 0.22], 43, 0.86, 0.003).rotateY(-10).at(-0.01, 0.097, -0.01),
      );
      const knuckles = sdf.union(sdf.sphere(0.026).at(-0.05, -0.01, 0.118), sdf.sphere(0.026).at(0.05, -0.01, 0.118));
      const fistL = sdf
        .union(fistBlocks, knuckles)
        .paintWhere(knuckles.round(0.003), T.sage, 0.004)
        .rotateZ(6)
        .at(0.47, 0.28, 0.06)
        .bone('hand.L');
      const kneeL = moss(crack(rock([0.21, 0.14, 0.23], 33), sdf.box([0.014, 0.5, 0.5]).rotateY(20).at(-0.02, 0, 0)), mossAbove(0.06), 0.005).at(0.168, 0.182, 0.025).bone('shin.L');
      const footL = rock([0.25, 0.14, 0.31], 34, 0.82).intersect(sdf.halfSpace([0, -1, 0], 0.06)).at(0.18, 0.06, 0.03).bone('foot.L');
      const limbs = pair(sdf.union(gauntletL, fistL, kneeL, footL));
      k.body('limbs', limbs, { color: T.stone, roughness: 0.9, detail: 0.0055, bump: stoneBump, ...flat });

      // ------------------------------------------------------------------ glow: rune eyes and the chest rune (emissive on a dark base)
      const eyes = pair(sdf.ellipsoid([0.035, 0.029, 0.017]).at(EYE[0], EYE[1], eyeZ - 0.012));
      k.body('eyes', eyes, { color: T.glowDark, emissive: T.glow, emissiveIntensity: 2.2, roughness: 0.3, bone: 'head', detail: 0.004 });
      const star = sdf.union(...[0, 60, 120].map((a) => sdf.box([0.056, 0.009, 0.1], 0.003).rotateZ(a).at(RUNE[0], RUNE[1], RUNE[2])));
      const rune = sdf.cylinder(0.04, 0.03, 0.006).rotateX(90).at(RUNE[0], RUNE[1], RUNE[2] - 0.025).paintWhere(star, T.glowPale, 0.002);
      k.body('rune', rune, { color: T.glowDark, emissive: T.glow, emissiveIntensity: 2.2, roughness: 0.3, bone: 'chest', detail: 0.004, textureDensity: 2 });

      // ------------------------------------------------------------------ the kind's extra bodies
      kind.extra?.(k, { mantle, belt, limbs, head, trunk, tint: { stone: T.stone, glow: T.glow, glowDark: T.glowDark }, tone });

      // ------------------------------------------------------------------ animation
      const { wave, bump, legDrop, keys } = motion;
      const LEG = HIP[1] - ANKLE[1];
      const DEG = Math.PI / 180;
      const deg = (r: number) => r / DEG;
      // A damped shake after `at`, with `n` swings in `len` of the clip.
      const shake = (p: number, at: number, len: number, n: number) =>
        p < at ? 0 : Math.exp((-(p - at) / len) * 3) * Math.sin(((p - at) / len) * Math.PI * n);

      k.animation('idle', {
        duration: 2.8,
        pose: (_t, p) => ({
          hips: { move: [0, -0.004 * bump(p), 0] },
          chest: { rotate: [2 * wave(p), 0, 0] },
          neck: { rotate: [-1.5 * wave(p), 0, 0] },
          head: { rotate: [0, 10 * wave(p, 1, 0.25), 0] },
          'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
          'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
          'forearm.L': { rotate: [-4 * bump(p), 0, 0] },
          'forearm.R': { rotate: [-4 * bump(p, 1, 0.3), 0, 0] },
        }),
      });

      // A heavy, rolling walk: the weight shifts from side to side at each step, the fists swing.
      // The legs come from motion.gait (planted stance feet, a knee lift in the swing, heel strike and
      // toe-off); the gait phase runs a quarter cycle behind the clip.
      const stride = (duration: number, step: number, footLift: number, duty: number, bob: number, armSwing: number, lean: number, sway: number) => ({
        duration,
        pose: (_t: number, p: number) => {
          const s = wave(p);
          const hipsTurn = [0, 5 * s, sway * s] as const;
          const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
            stride: step,
            lift: footLift,
            duty,
            bob,
            roll: 8,
            heel: SOLE_HEEL,
            toe: SOLE_TOE,
            hips: { at: [0, 0.3, 0], rotate: hipsTurn },
          });
          return {
            ...legs.pose,
            hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
            spine: { rotate: [lean, 0, -sway * 0.6 * s] as const },
            chest: { rotate: [lean * 0.5, -8 * s, 0] as const },
            head: { rotate: [-lean, 5 * s, 0] as const },
            'upperarm.L': { rotate: [armSwing * s, 0, 4] as const },
            'upperarm.R': { rotate: [-armSwing * s, 0, -4] as const },
            'forearm.L': { rotate: [-armSwing * 0.3 - armSwing * 0.3 * Math.max(0, -s), 0, 0] as const },
            'forearm.R': { rotate: [-armSwing * 0.3 - armSwing * 0.3 * Math.max(0, s), 0, 0] as const },
          };
        },
      });
      k.animation('walk', stride(1.1, 0.12, 0.03, 0.62, 0.01, 16, 4, 4));
      k.animation('run', stride(0.7, 0.17, 0.05, 0.45, 0.025, 28, 10, 3));

      // ------------------------------------------------------------------ attack: a two-fist ground slam
      // Both fists swing up and back over the head while the golem rises and leans back; then the
      // trunk folds forward, the knees bend, and both fists drive down into the floor in front of
      // the feet (outside them). An impact shake, a hold, and a slow recovery.
      k.animation('attack', {
        duration: 1.3,
        loop: false,
        pose: (_t, p) => {
          const sh = shake(p, 0.52, 0.2, 5);
          const armX = keys(p, [[0, 0], [0.3, -150], [0.4, -158], [0.5, -70], [0.53, -64], [0.74, -64], [1, 0]] as const, 'smooth');
          const foreX = keys(p, [[0, 0], [0.3, -50], [0.4, -58], [0.5, -8], [0.74, -8], [1, 0]] as const, 'smooth');
          const handX = keys(p, [[0, 0], [0.3, -15], [0.4, -15], [0.5, 12], [0.74, 12], [1, 0]] as const, 'smooth');
          const spineX = keys(p, [[0, 0], [0.3, -6], [0.4, -8], [0.5, 20], [0.53, 22], [0.74, 20], [1, 0]] as const, 'smooth');
          const chestX = keys(p, [[0, 0], [0.3, -10], [0.4, -12], [0.5, 26], [0.53, 28], [0.74, 25], [1, 0]] as const, 'smooth') + 2 * sh;
          const c = keys(p, [[0, 0], [0.16, 0.35], [0.32, 0.05], [0.42, 0], [0.52, 1], [0.74, 0.95], [1, 0]] as const, 'smooth');
          return {
            hips: { move: [0, -0.05 * c - 0.004 * sh, -0.02 * c] },
            spine: { rotate: [spineX, 0, 0] },
            chest: { rotate: [chestX, 0, 0] },
            head: { rotate: [-(spineX + chestX) * 0.55 - 3 * sh, 0, 0] },
            'upperarm.L': { rotate: [armX, 0, 0] },
            'upperarm.R': { rotate: [armX, 0, 0] },
            'forearm.L': { rotate: [foreX, 0, 0] },
            'forearm.R': { rotate: [foreX, 0, 0] },
            'hand.L': { rotate: [handX, 0, 0] },
            'hand.R': { rotate: [handX, 0, 0] },
            'leg.L': { rotate: [-45 * c, 0, 0] },
            'shin.L': { rotate: [80 * c, 0, 0] },
            'foot.L': { rotate: [-35 * c, 0, 0] },
            'leg.R': { rotate: [-45 * c, 0, 0] },
            'shin.R': { rotate: [80 * c, 0, 0] },
            'foot.R': { rotate: [-35 * c, 0, 0] },
          };
        },
      });

      // ------------------------------------------------------------------ attack2: a shoulder charge, then a backhand swipe
      // Plan: the golem sinks into a wide stance (the left foot steps back) and turns the right
      // boulder shoulder at the target; two heavy steps carry it forward into the ram, a short hold
      // with a shake. Then the body unwinds and the right fist swings backhand across the front and
      // out to the right. Two steps back to rest. A planted foot keeps its world position.
      const ease = (a: number, b: number, x: number) => {
        const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
        return t * t * (3 - 2 * t);
      };
      type Step = readonly [number, number, number, number]; // phase start, phase end, from z, to z
      const footAt = (steps: readonly Step[], p: number) => {
        let z = 0;
        let lift = 0;
        for (const [a, b, from, to] of steps) {
          if (p >= a) z = from + (to - from) * ease(a, b, p);
          if (p > a && p < b) lift = 0.03 * Math.sin(((p - a) / (b - a)) * Math.PI);
        }
        return { z, lift };
      };
      const legTo = (footZ: number, hipsZ: number, hipsY: number, side: 1 | -1) => {
        const hipZ = hipsZ - side * HIP[0] * Math.sin(hipsY * DEG);
        const a = Math.asin(Math.max(-0.95, Math.min(0.95, (hipZ - footZ) / LEG)));
        return { rot: deg(a), drop: LEG * (1 - Math.cos(a)) };
      };
      const STEPS_L: readonly Step[] = [[0.02, 0.13, 0, -0.18], [0.16, 0.26, -0.18, 0.1], [0.85, 0.95, 0.1, 0]];
      const STEPS_R: readonly Step[] = [[0.26, 0.36, 0, 0.24], [0.72, 0.83, 0.24, 0]];

      k.animation('attack2', {
        duration: 1.2,
        loop: false,
        pose: (_t, p) => {
          const sh = shake(p, 0.36, 0.1, 5);
          const hipsY = keys(p, [[0, 0], [0.15, 14], [0.45, 14], [0.48, 15], [0.66, -10], [0.72, -10], [0.9, 0]] as const);
          const spineY = keys(p, [[0, 0], [0.15, 12], [0.45, 12], [0.48, 13], [0.66, -10], [0.72, -10], [0.92, 0]] as const);
          const chestY = keys(p, [[0, 0], [0.15, 18], [0.36, 20], [0.45, 20], [0.48, 24], [0.66, -16], [0.72, -16], [0.95, 0]] as const);
          const turn = hipsY + spineY + chestY;
          const lean = keys(p, [[0, 0], [0.15, 12], [0.26, 13], [0.36, 18], [0.45, 16], [0.48, 12], [0.66, 6], [0.72, 6], [0.95, 0]] as const);
          const dip = keys(p, [[0, 0], [0.15, -4], [0.36, -8], [0.45, -7], [0.6, 0]] as const); // the ramming shoulder drops
          const fL = footAt(STEPS_L, p);
          const fR = footAt(STEPS_R, p);
          const hipsZ = (fL.z + fR.z) / 2 + keys(p, [[0, 0], [0.3, 0], [0.36, 0.02], [0.45, 0.015], [0.6, 0.02], [0.72, 0]] as const);
          const legL = legTo(fL.z, hipsZ, hipsY, 1);
          const legR = legTo(fR.z, hipsZ, hipsY, -1);
          // The right fist: tucked in front of the belly in the charge, cocked across, then a
          // backhand swing out to the right at chest height.
          const rX = keys(p, [[0, 0], [0.15, -35], [0.45, -35], [0.49, -50], [0.58, -80], [0.66, -72], [0.72, -60], [0.9, -20], [1, 0]] as const, 'smooth');
          const rZ = keys(p, [[0, 0], [0.15, 12], [0.45, 12], [0.49, 28], [0.58, -10], [0.66, -45], [0.72, -45], [0.9, -10], [1, 0]] as const, 'smooth');
          const rFore = keys(p, [[0, 0], [0.15, -55], [0.45, -55], [0.49, -60], [0.58, -15], [0.66, -10], [0.72, -10], [0.9, -20], [1, 0]] as const, 'smooth');
          // The off arm braces forward, pulls back to drive the charge, and swings out in the swipe.
          const lX = keys(p, [[0, 0], [0.15, -30], [0.3, 15], [0.45, 15], [0.6, -20], [0.72, -20], [1, 0]] as const, 'smooth');
          const lZ = keys(p, [[0, 0], [0.15, 8], [0.45, 8], [0.6, 22], [0.72, 22], [1, 0]] as const, 'smooth');
          const h = hipsY * DEG;
          return {
            hips: { move: [0, -Math.min(legL.drop + fL.lift, legR.drop + fR.lift), hipsZ], rotate: [0, hipsY, 0] },
            spine: { rotate: [lean * Math.cos(h), spineY, lean * Math.sin(h)] },
            chest: { rotate: [3 * sh, chestY, dip + 2 * sh] },
            head: { rotate: [-lean * 0.6 - 3 * sh, -turn * 0.5, 0] },
            'upperarm.R': { rotate: [rX, 0, rZ] },
            'forearm.R': { rotate: [rFore, 0, 0] },
            'upperarm.L': { rotate: [lX, 0, lZ] },
            'forearm.L': { rotate: [-20 * ease(0, 0.15, p) * (1 - ease(0.8, 1, p)), 0, 0] },
            'leg.L': { rotate: [legL.rot, -hipsY, 0], move: [0, fL.lift, 0] },
            'leg.R': { rotate: [legR.rot, -hipsY, 0], move: [0, fR.lift, 0] },
            'foot.L': { rotate: [-legL.rot, 0, 0] },
            'foot.R': { rotate: [-legR.rot, 0, 0] },
          };
        },
      });

      // ------------------------------------------------------------------ roar: both fists raised, the stones tremble
      k.animation('roar', {
        duration: 1.8,
        loop: false,
        pose: (_t, p) => {
          const rise = keys(p, [[0, 0], [0.16, -0.5], [0.3, 1], [0.8, 1], [1, 0]] as const);
          const lift = Math.max(0, rise);
          const crouch = Math.max(0, -rise);
          // Seven quick trembles while it roars (odd, so the strip does not freeze on them).
          const tremble = p > 0.3 && p < 0.82 ? wave((p - 0.3) / 0.52, 7) * Math.sin(((p - 0.3) / 0.52) * Math.PI) : 0;
          return {
            hips: { move: [0, -0.025 * crouch - 0.003 * Math.abs(tremble), 0] },
            spine: { rotate: [10 * crouch - 6 * lift, 0, 0] },
            chest: { rotate: [8 * crouch - 10 * lift + 1.5 * tremble, 2 * tremble, 0] },
            neck: { rotate: [6 * crouch - 6 * lift, 0, 0] },
            head: { rotate: [8 * crouch - 12 * lift + 2 * tremble, 3 * tremble, 0] },
            'upperarm.L': { rotate: [-25 * lift + 10 * crouch, 0, 65 * lift] },
            'upperarm.R': { rotate: [-25 * lift + 10 * crouch, 0, -65 * lift] },
            'forearm.L': { rotate: [-55 * lift - 20 * crouch, 0, 0] },
            'forearm.R': { rotate: [-55 * lift - 20 * crouch, 0, 0] },
            'leg.L': { rotate: [0, 0, 4 * lift] },
            'leg.R': { rotate: [0, 0, -4 * lift] },
          };
        },
      });

      // ------------------------------------------------------------------ hit: snap back from a blow, a step back, recover
      k.animation('hit', {
        duration: 0.45,
        loop: false,
        pose: (_t, p) => {
          const r = keys(p, [[0, 0], [0.16, 1], [0.38, 0.8], [1, 0]] as const);
          const back = -0.025 * r;
          const legL = deg(Math.atan2(back, LEG));
          return {
            hips: { move: [0, -legDrop(LEG, 12 * r), back], rotate: [0, 5 * r, 0] },
            spine: { rotate: [-8 * r, 0, 3 * r] },
            chest: { rotate: [-9 * r, 7 * r, 0] },
            neck: { rotate: [-5 * r, 0, 0] },
            head: { rotate: [-14 * r, -9 * r, 6 * r] },
            'upperarm.L': { rotate: [12 * r, 0, 24 * r] },
            'forearm.L': { rotate: [-22 * r, 0, 0] },
            'upperarm.R': { rotate: [10 * r, 0, -18 * r] },
            'forearm.R': { rotate: [-12 * r, 0, 0] },
            'leg.L': { rotate: [legL, 0, 0] },
            'foot.L': { rotate: [-legL, 0, 0] },
            'leg.R': { rotate: [12 * r, 0, 0] }, // a small step back
            'foot.R': { rotate: [-12 * r, 0, 0] },
          };
        },
      });

      // ------------------------------------------------------------------ death: stagger back, topple, lie on the back
      k.animation('death', {
        duration: 1.5,
        loop: false,
        pose: (_t, p) => {
          const fall = keys(p, [[0, 0], [0.2, -8], [0.4, 3], [0.54, -40], [0.66, -88], [0.72, -84], [0.8, -88], [1, -88]] as const);
          const hipsY = keys(p, [[0, 0], [0.4, 0], [0.54, -0.01], [0.66, -0.1], [0.72, -0.085], [0.8, -0.1], [1, -0.1]] as const);
          const hipsZ = keys(p, [[0, 0], [0.2, -0.035], [0.4, -0.02], [0.66, -0.13], [1, -0.13]] as const);
          const legs = keys(p, [[0, 0], [0.2, 4], [0.4, -3], [0.54, 36], [0.66, 50], [1, 50]] as const);
          const stepR = keys(p, [[0, 0], [0.2, 14], [0.4, 4], [0.54, 0], [1, 0]] as const);
          const spill = keys(p, [[0, 0], [0.54, 0], [0.62, 1], [1, 1]] as const);
          return {
            hips: { move: [0, hipsY, hipsZ], rotate: [fall, keys(p, [[0, 0], [0.2, 8], [0.66, -6], [1, -6]] as const), 0] },
            spine: { rotate: [keys(p, [[0, 0], [0.2, -10], [0.4, 8], [0.56, 6], [0.66, -4], [1, 0]] as const), 0, 0] },
            chest: { rotate: [keys(p, [[0, 0], [0.2, -8], [0.4, 6], [0.66, -2], [1, 0]] as const), keys(p, [[0, 0], [0.2, 10], [0.5, -6], [1, 0]] as const), 0] },
            neck: { rotate: [keys(p, [[0, 0], [0.2, -8], [0.4, 8], [0.6, 16], [0.7, -6], [0.8, 0], [1, 0]] as const), 0, 0] },
            head: { rotate: [keys(p, [[0, 0], [0.2, -14], [0.4, 10], [0.6, 14], [0.7, -10], [0.8, 0], [1, 0]] as const), keys(p, [[0, 0], [0.7, 0], [0.9, 28], [1, 28]] as const), 0] },
            'upperarm.L': { rotate: [keys(p, [[0, 0], [0.2, 12], [0.4, -8], [0.58, -55], [0.7, 30], [1, 34]] as const), 0, keys(p, [[0, 0], [0.2, 28], [0.4, 12], [0.58, 40], [0.7, 60], [1, 62]] as const)] },
            'forearm.L': { rotate: [keys(p, [[0, 0], [0.2, -30], [0.58, -20], [0.7, -6], [1, -8]] as const), 0, 0] },
            'upperarm.R': { rotate: [keys(p, [[0, 0], [0.2, 10], [0.4, -6], [0.58, -45], [0.7, 30], [1, 34]] as const), 0, keys(p, [[0, 0], [0.2, -22], [0.4, -10], [0.58, -35], [0.7, -58], [1, -60]] as const)] },
            'forearm.R': { rotate: [keys(p, [[0, 0], [0.2, -20], [0.58, -15], [0.7, 0], [1, 0]] as const), 0, 0] },
            'leg.L': { rotate: [legs + keys(p, [[0, 0], [0.2, -6], [0.4, 0]] as const), 0, 6 * spill] },
            'leg.R': { rotate: [legs + stepR, 0, -8 * spill] },
            'foot.L': { rotate: [-keys(p, [[0, 0], [0.4, 0], [0.66, 12], [1, 12]] as const), 0, 0] },
            'foot.R': { rotate: [-stepR * 0.8, 0, 0] },
          };
        },
      });
    },
  });
}
