import { defineAsset, motion, noise, profile, rgb, sdf } from '../../src/index.js';
import type { AssetContext, AssetDefinition, BodyOptions } from '../../src/index.js';
import type { VariantPresets, VariantSlots } from '../../src/variants.js';

/**
 * Ogre kinds — the ogre brute of `assets/ogre-brute.ts` (catalog `enemies/humanoid/ogre-brute`) and
 * its kinds (the hill, fire, and frost giants and the cyclops). One body, head, rig, and clip set;
 * each kind sets the size, the palette, and the slots, and may change the nose, the eyes, the
 * tusks, the mane, and the weapon, and add bodies (armor, a helmet). The design notes of the body,
 * the rig, and the clips are in `assets/ogre-brute.ts`.
 */

const OGRE_COLORS = {
  skin: '#c8925a',
  skinDark: '#a06f3f',
  skinLight: '#e0b078',
  eye: '#2a2016',
  sclera: '#e6d3a0',
  lid: '#a06f3f',
  mouth: '#5a2a1a',
  mane: '#5a3a22',
  maneShade: '#3a2414', // the dark and the light hair strands
  maneHi: '#7a5232',
  tusk: '#efe4cc',
  leather: '#6e3f24',
  leatherDark: '#4a2a18',
  hide: '#8a5a35',
  red: '#b83a2e',
  redDark: '#7a2a20',
  rope: '#c2a06a',
  ropeDark: '#8a6a3a',
  wood: '#6b4226',
  stone: '#8a94a0',
};

type V3 = readonly [number, number, number];

const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const pair = (s: sdf.Shape) => s.mirror('x');
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const smooth01 = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const DEG = Math.PI / 180;
const rotXv = (v: V3, d: number): V3 => [v[0], v[1] * Math.cos(d * DEG) - v[2] * Math.sin(d * DEG), v[1] * Math.sin(d * DEG) + v[2] * Math.cos(d * DEG)];
const rotZv = (v: V3, d: number): V3 => [v[0] * Math.cos(d * DEG) - v[1] * Math.sin(d * DEG), v[0] * Math.sin(d * DEG) + v[1] * Math.cos(d * DEG), v[2]];
/** The X then Z rotation (degrees) that turns the +Y axis to `d`. */
const yTo = (d: V3): [number, number] => [Math.asin(d[2]) / DEG, Math.atan2(-d[0], d[1]) / DEG];

// Joints (D space): wide shoulders, arms hanging out, a wide stance. The right arm is raised.
const SH: V3 = [0.3, 0.6, 0];
const EL: V3 = [0.38, 0.43, 0.03];
const WR: V3 = [0.41, 0.28, 0.06];
const EL_R: V3 = [-0.46, 0.62, 0.11];
const WR_R: V3 = [-0.47, 0.775, 0.14];
const HIP: V3 = [0.115, 0.25, 0];
const ANKLE: V3 = [0.17, 0.075, 0];
const KNEE: V3 = [0.14, 0.1625, 0];
const SOLE_HEEL: V3 = [0.17, 0, -0.022];
const SOLE_TOE: V3 = [0.184, 0, 0.09];
const HEAD_Y = 0.72; // the orc head's center, in orc head space
const HEAD_NEW = 0.775; // where the ogre head's center sits
const LEG = HIP[1] - ANKLE[1];
const GRIP: V3 = add(WR_R, [0, 0.06, 0.02]);
const ARM_REACH = 0.335; // the most an arm reaches in the smash (upper + lower arm, less a margin)
const CLUB_DIR = norm([-0.08, 1, -0.1]);
const [CLUB_RX, CLUB_RZ] = yTo(CLUB_DIR);
const perp = (d: V3, pref: V3): V3 => {
  const p = sub(pref, mul(d, dot(pref, d)));
  return Math.hypot(...p) < 0.2 ? norm(sub([0, 0, 1], mul(d, d[2]))) : norm(p);
};
const SIDE: V3 = [-1, 0, 0];
const CLUB_UP = perp(CLUB_DIR, SIDE);

/** A fist hanging from the wrist `w`, `f` times the orc's size; `s` mirrors it. */
const fistAt = (w: V3, s: 1 | -1, f: number) => {
  const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx * f * s, w[1] + dy * f, w[2] + dz * f];
  return sdf.smoothUnion(
    0.024,
    sdf.ellipsoid([0.07 * f, 0.072 * f, 0.074 * f]).at(...o(0.006, -0.062, 0.006)),
    ...[-0.045, -0.015, 0.015, 0.045].map((x) => sdf.sphere(0.024).at(...o(x * 0.7 / f * f, -0.02, 0.058))), // four knuckle bumps
    sdf.capsule(o(-0.016, -0.096, 0.052), o(-0.01, -0.06, 0.074), 0.03 * f), // curled fingers
    sdf.cone(o(0.036, -0.036, 0.042), o(0.004, -0.05, 0.08), 0.029 * f, 0.023 * f), // thumb
  );
};
/** The right fist closed around the club's handle, above the wrist. */
const fistGrip = (w: V3) => {
  const c = GRIP;
  return sdf.smoothUnion(
    0.02,
    sdf.ellipsoid([0.1, 0.09, 0.1]).at(...c),
    ...[-0.045, -0.015, 0.015, 0.045].map((x) => sdf.sphere(0.024).at(c[0] + x, c[1] + 0.078, c[2] + 0.045)), // four knuckle bumps on top
    ...[-0.036, -0.012, 0.012, 0.036].map((dy) => sdf.capsule([c[0] - 0.05, c[1] + dy, c[2] + 0.065], [c[0] + 0.05, c[1] + dy, c[2] + 0.065], 0.022)),
    sdf.capsule([c[0] - 0.05, c[1] - 0.06, c[2] + 0.02], [c[0] + 0.03, c[1] - 0.04, c[2] - 0.02], 0.024), // thumb/heel of the hand
  );
};

/** An ogre kind: the size, the slots, the face, the mane, the weapon, and extra bodies. */
export interface OgreKind {
  readonly name: string;
  readonly description: string;
  readonly reference: string;
  /** The scale from orc space (1.25 for the ogre brute; giants are bigger). */
  readonly scale?: number;
  /** Slots `skin`, `cloth`, `leather`, and `mane`; the first option of each is the default. */
  readonly variants: VariantSlots;
  readonly presets?: VariantPresets;
  /** Fixed colors and the default shades of the slots (skinDark, skinLight, wood, stone, ...). */
  readonly colors?: Partial<typeof OGRE_COLORS>;
  /** The size of the head as a share of the ogre brute's small head. */
  readonly headScale?: number;
  /** The ogre's pig snout (the default) or a broad human nose. */
  readonly nose?: 'snout' | 'human';
  /** Two eyes (the default) or one big eye in the middle of the face. */
  readonly eyes?: 'two' | 'one';
  /** The ogre's frown (the default) or a wide grin with a row of teeth. */
  readonly mouth?: 'frown' | 'grin';
  /** The size of the tusks as a share of the ogre brute's (0: no tusks). */
  readonly tusks?: number;
  /** The parts of the mane (all on by default): the beard with its strands, the side locks, the back, the top tuft. */
  readonly mane?: { readonly beard?: boolean; readonly locks?: boolean; readonly back?: boolean; readonly tuft?: boolean };
  /** Body options for the mane (a glow for flame hair). */
  readonly maneBody?: BodyOptions;
  /** A weapon in place of the spiked club: build it in the club's frame (`ogre.weapon`), rigid on `hand.R`. */
  weapon?(k: AssetContext, ogre: OgreShape): void;
  /** Extra bodies (armor, a helmet, a fur collar, a horn). */
  extra?(k: AssetContext, ogre: OgreShape): void;
}

/** The ogre's frames, shapes, and slot colors that a kind builds on. Shapes are in orc space (D). */
export interface OgreShape {
  /** Add a body designed in orc space (scaled up by the kind's scale). */
  put(name: string, shape: sdf.Shape, options: BodyOptions): void;
  /** Move a shape from head space (the orc head) to its place on the body; `headShape` and `faceZ` are in head space. */
  head(s: sdf.Shape): sdf.Shape;
  readonly headShape: sdf.Shape;
  faceZ(x: number, y: number): number;
  /** The eye center in head space (x 0 for one eye). */
  readonly eye: V3;
  /** The torso (chest, belly, hips, traps, pecs). */
  readonly trunk: sdf.Shape;
  /** Move a shape from the weapon frame (the grip at the origin, the haft up +Y) to the right fist. */
  weapon(s: sdf.Shape): sdf.Shape;
  readonly joints: {
    readonly SH: V3;
    readonly EL: V3;
    readonly WR: V3;
    readonly EL_R: V3;
    readonly WR_R: V3;
    readonly HIP: V3;
    readonly KNEE: V3;
    readonly ANKLE: V3;
    readonly GRIP: V3;
    readonly BELT_Y: number;
    readonly HEAD_NEW: number;
  };
  /** A ring around the axis `d`, at `c`, of radius R and tube r. */
  ring(c: V3, d: V3, R: number, r: number): sdf.Shape;
  readonly tint: { readonly skin: string; readonly skinDark: string; readonly cloth: string; readonly leather: string; readonly mane: string };
  /** A fixed default color that follows a slot (`k.tint(slot, { color, follow })`). */
  tone(slot: string, color: string, follow?: number): string;
}

export function ogreAsset(kind: OgreKind): AssetDefinition {
  // The base colors of the slots are the first options, so the painted shades (a lighter belly,
  // darker cloth) are offsets from the kind's own colors.
  const first = (slot: string) => {
    const c = Object.values(kind.variants[slot] ?? {})[0];
    return typeof c === 'string' ? { [slot === 'cloth' ? 'red' : slot]: c } : {};
  };
  const C = { ...OGRE_COLORS, ...first('skin'), ...first('cloth'), ...first('leather'), ...first('mane'), ...kind.colors };
  const hs = kind.headScale ?? 1;
  const HC = HEAD_NEW + (hs - 1) * 0.22; // a bigger head rises, so its jaw stays above the chest
  const SC = kind.scale ?? 1.25;
  return defineAsset({
    name: kind.name,
    description: kind.description,
    detail: 0.006,
    reference: kind.reference,
    variants: kind.variants,
    ...(kind.presets ? { presets: kind.presets } : {}),

    build(k) {
      const T = {
        skin: k.tint('skin'),
        skinDark: k.tint('skin', { color: C.skinDark, follow: 1 }),
        skinLight: k.tint('skin', { color: C.skinLight, follow: 1 }),
        lid: k.tint('skin', { color: C.lid, follow: 1 }),
        mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
        red: k.tint('cloth'),
        redDark: k.tint('cloth', { color: C.redDark, follow: 1 }),
        leather: k.tint('leather'),
        leatherDark: k.tint('leather', { color: C.leatherDark, follow: 1 }),
        hide: k.tint('leather', { color: C.hide, follow: 1 }),
        mane: k.tint('mane'),
      };
      const shadeOf = (body: string, shade: string) => {
        const a = rgb(body);
        const b = rgb(shade);
        return [b[0] - a[0], b[1] - a[1], b[2] - a[2]] as const;
      };
      const plus = (c: readonly [number, number, number], d: readonly [number, number, number], t = 1) =>
        [c[0] + d[0] * t, c[1] + d[1] * t, c[2] + d[2] * t] as const;
      /** Add a body designed in D space, scaled up by SC. */
      const put = (name: string, shape: sdf.Shape, o: Parameters<typeof k.body>[2]) => k.body(name, shape.scale(SC), o);
      const tone = (slot: string, color: string, follow = 1) => k.tint(slot, { color, follow });
      const S = (p: V3): V3 => mul(p, SC);

      // ------------------------------------------------------------------ skeleton
      k.skeleton({
        hips: { at: S([0, 0.26, 0]) },
        spine: { parent: 'hips', at: S([0, 0.34, 0]) },
        chest: { parent: 'spine', at: S([0, 0.46, 0]) },
        neck: { parent: 'chest', at: S([0, 0.6, -0.01]) },
        head: { parent: 'neck', at: S([0, 0.65, -0.01]) },
        'upperarm.L': { parent: 'chest', at: S(SH) },
        'forearm.L': { parent: 'upperarm.L', at: S(EL) },
        'hand.L': { parent: 'forearm.L', at: S(WR) },
        'upperarm.R': { parent: 'chest', at: S(mx(SH)) },
        'forearm.R': { parent: 'upperarm.R', at: S(EL_R) },
        'hand.R': { parent: 'forearm.R', at: S(WR_R) },
        'leg.L': { parent: 'hips', at: S(HIP) },
        'shin.L': { parent: 'leg.L', at: S(KNEE), split: 0.019 },
        'foot.L': { parent: 'shin.L', at: S(ANKLE) },
        'leg.R': { parent: 'hips', at: S(mx(HIP)) },
        'shin.R': { parent: 'leg.R', at: S(mx(KNEE)), split: 0.019 },
        'foot.R': { parent: 'shin.R', at: S(mx(ANKLE)) },
      });

      // ------------------------------------------------------------------ head (built in orc head space, then shrunk and lowered)
      const hx = (s: sdf.Shape) => s.at(0, -HEAD_Y, 0).scale([0.85 * hs, 0.9 * hs, 0.85 * hs]).at(0, HC, 0.07);
      const headBase = sdf.smoothUnion(
        0.05,
        sdf.ellipsoid([0.19, 0.2, 0.18]).at(0, HEAD_Y, -0.01),
        sdf.ellipsoid([0.185, 0.09, 0.15]).at(0, 0.565, 0.05), // the wide jaw
        pair(sdf.sphere(0.085).at(0.11, 0.645, 0.07)), // cheeks
        sdf.ellipsoid([0.17, 0.048, 0.075]).at(0, 0.752, 0.115), // a heavy brow shelf
      );
      const faceZ0 = (x: number, y: number) => sdf.raycast(headBase, [x, y, 1], [0, 0, -1])![2];
      const SNOUT_Z = faceZ0(0, 0.618);
      const human = kind.nose === 'human';
      const snout = human
        ? // A broad, round nose with two nostril wings.
          sdf.smoothUnion(0.018, sdf.ellipsoid([0.056, 0.05, 0.05]).at(0, 0.618, SNOUT_Z + 0.022), pair(sdf.sphere(0.03).at(0.038, 0.598, SNOUT_Z + 0.006)))
        : sdf
            .smoothUnion(
              0.02,
              sdf.ellipsoid([0.104, 0.074, 0.084]).at(0, 0.618, SNOUT_Z),
              sdf.ellipsoid([0.078, 0.056, 0.042]).at(0, 0.6, SNOUT_Z + 0.078), // the pig snout disc on top
            )
            .smoothSubtract(0.006, ...[0.03, -0.03].map((x) => sdf.sphere(0.014).at(x, 0.598, SNOUT_Z + 0.118))); // two nostril dimples
      const head = headBase.smoothUnion(0.02, snout);
      const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
      const EB: V3 = [0.15, 0.7, -0.01];
      const eg = (p: V3): V3 => add(EB, mul(sub(p, EB), 1.3));
      const ears = pair(
        sdf
          .cone(eg([0.15, 0.7, -0.01]), eg([0.245, 0.765, -0.045]), 0.065, 0.013)
          .smoothSubtract(0.008, sdf.cone(eg([0.16, 0.705, 0.012]), eg([0.235, 0.76, -0.02]), 0.036, 0.005)),
      );
      const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
      // Two eyes, or one big eye in the middle of the face (the cyclops).
      const one = kind.eyes === 'one';
      const EYE: V3 = one ? [0, 0.684, 0] : [0.074, 0.686, 0];
      const eyeBall = one ? at(sdf.ellipsoid([0.082, 0.07, 0.09]), 0, EYE[1]) : pair(at(sdf.ellipsoid([0.04, 0.033, 0.07]), EYE[0], EYE[1]));
      const pupil = one ? at(sdf.ellipsoid([0.04, 0.044, 0.09]), 0, EYE[1] - 0.004) : pair(at(sdf.ellipsoid([0.026, 0.029, 0.07]), EYE[0] - 0.004, EYE[1] - 0.002));
      const lids = one
        ? sdf.extrude(profile.polygon([[-0.12, EYE[1] + 0.05], [0.12, EYE[1] + 0.05], [0.12, EYE[1] + 0.12], [-0.12, EYE[1] + 0.12]]), 0.4).at(0, 0, 0.2)
        : pair(
            sdf
              .extrude(
                profile.polygon([
                  [EYE[0] - 0.06, EYE[1] + 0.006],
                  [EYE[0] + 0.06, EYE[1] + 0.034],
                  [EYE[0] + 0.06, EYE[1] + 0.08],
                  [EYE[0] - 0.06, EYE[1] + 0.08],
                ]),
                0.4,
              )
              .at(0, 0, 0.2),
          );
      const shine = one ? at(sdf.sphere(0.012), -0.016, EYE[1] + 0.016) : sdf.union(...[EYE[0], -EYE[0]].map((x) => at(sdf.sphere(0.006), x - 0.003, EYE[1] + 0.003)));
      const MOUTH_Y = 0.53;
      const grin = kind.mouth === 'grin';
      // A wide grin (a dark band with a row of white teeth along its top), or the ogre's frown.
      const mouth = grin ? sdf.extrude(profile.arc(0.11, 0.03, 220, 320), 0.4).at(0, 0.61, 0.2) : sdf.extrude(profile.arc(0.12, 0.012, 50, 130), 0.4).at(0, MOUTH_Y - 0.12, 0.2);
      const teeth = sdf
        .extrude(profile.arc(0.103, 0.013, 224, 316), 0.4)
        .at(0, 0.61, 0.2)
        .subtract(...[-0.054, -0.027, 0, 0.027, 0.054].map((x) => sdf.box([0.005, 0.2, 0.5]).at(x, 0.5, 0.2)));
      const nostrils = human ? pair(sdf.sphere(0.012).at(0.021, 0.572, SNOUT_Z + 0.036)) : pair(sdf.sphere(0.019).at(0.03, 0.598, SNOUT_Z + 0.118));
      const muzzle = sdf.ellipsoid([0.135, 0.1, 0.11]).at(0, 0.6, SNOUT_Z + 0.03);
      const face = head
        .smoothUnion(0.015, ears)
        .paintWhere(muzzle, T.skinLight, 0.012)
        .paintWhere(eyeBall, C.sclera, 0.002)
        .paintWhere(pupil, C.eye, 0.002)
        .paintWhere(shine, '#ffffff', 0.002)
        .paintWhere(lids.intersect(eyeBall.round(0.006)), T.lid, 0.002)
        .paintWhere(mouth, T.mouth, 0.003);
      const headSkin = (grin ? face.paintWhere(teeth, C.tusk, 0.002) : face).paintWhere(nostrils, T.mouth, 0.003).bone('head');

      // Mane, beard, brows, and a small tuft on top (dark brown), all on the head bone.
      const jawFront = faceZ(0, 0.52);
      const strands = (x: number, y: number, z: number) => Math.sin(x * 80 + Math.sin(y * 26) * 1.6 + z * 22);
      // A shaggy surface: fbm noise plus the strand ridges (amplitude 0.012 in head space).
      const shag = (x: number, y: number, z: number) => noise.fbm(x * 26, y * 18, z * 26, 2) + 0.5 * strands(x, y, z);
      const beard = sdf
        .smoothUnion(
          0.03,
          sdf.ellipsoid([0.15, 0.065, 0.085]).at(0, 0.45, jawFront - 0.01),
          sdf.cone([0, 0.45, jawFront - 0.02], [0, 0.38, jawFront + 0.02], 0.13, 0.05),
          pair(sdf.ellipsoid([0.06, 0.08, 0.07]).at(0.14, 0.5, jawFront - 0.04)), // sideburn tufts under the cheek
        )
        .displace(0.012, shag);
      // Loose strands of hair hanging from the beard.
      const strandChains = sdf.union(
        ...[-3, -2, -1, 0, 1, 2, 3].map((i) => {
          const x = i * 0.036;
          const z0 = jawFront + 0.035 - Math.abs(x) * 0.5;
          const endY = 0.325 + noise.random(i + 4, 2, 1) * 0.03;
          return sdf.chain(
            [
              [x, 0.42, z0, 0.026],
              [x * 1.1, 0.37, z0 + 0.008, 0.018],
              [x * 1.2, endY, z0 + 0.014, 0.008],
            ],
            0.01,
          );
        }),
      );
      const sideLocks = pair(
        sdf.chain(
          [
            [0.19, 0.78, -0.03, 0.05],
            [0.205, 0.68, -0.005, 0.06],
            [0.18, 0.58, 0.03, 0.065],
            [0.12, 0.48, jawFront - 0.04, 0.065],
          ],
          0.03,
        ),
      ).displace(0.012, shag);
      const backMane = sdf
        .smoothUnion(0.04, sdf.ellipsoid([0.2, 0.2, 0.15]).at(0, 0.7, -0.09), sdf.ellipsoid([0.17, 0.11, 0.12]).at(0, 0.58, -0.07))
        .displace(0.012, shag);
      const tuft = sdf.smoothUnion(
        0.02,
        sdf.cone([0, 0.9, 0.0], [0.0, 0.975, 0.05], 0.05, 0.02),
        sdf.cone([0.0, 0.94, 0.03], [0.02, 0.99, -0.03], 0.03, 0.008),
        sdf.ellipsoid([0.16, 0.06, 0.11]).at(0, 0.86, -0.05),
      );
      const browAt = (x: number, y: number): V3 => [x, y, faceZ(Math.abs(x), y) - 0.008];
      const brows = one
        ? // One heavy unibrow in an angry V over the eye.
          sdf.chain(
            [
              [...browAt(-0.115, EYE[1] + 0.096), 0.024],
              [...browAt(-0.045, EYE[1] + 0.084), 0.03],
              [...browAt(0, EYE[1] + 0.074), 0.028],
              [...browAt(0.045, EYE[1] + 0.084), 0.03],
              [...browAt(0.115, EYE[1] + 0.096), 0.024],
            ],
            0.012,
          )
        : pair(
            sdf.chain(
              [
                [...browAt(EYE[0] + 0.066, EYE[1] + 0.062), 0.022],
                [...browAt(EYE[0] + 0.01, EYE[1] + 0.046), 0.028],
                [...browAt(EYE[0] - 0.05, EYE[1] + 0.02), 0.022],
              ],
              0.01,
            ),
          );
      const maneShade = shadeOf(C.mane, C.maneShade);
      const maneHi = shadeOf(C.mane, C.maneHi);
      const M = { beard: true, locks: true, back: true, tuft: true, ...kind.mane };
      const maneParts = [M.beard && beard, M.beard && strandChains, M.locks && sideLocks, M.back && backMane, M.tuft && tuft, brows].filter((s): s is sdf.Shape => !!s);
      const mane = sdf
        .union(...maneParts)
        .bone('head')
        .paintFn((x, y, z, base) => {
          const s = strands(x, y, z);
          if (s > 0.5) return plus(base, maneShade);
          if (s < -0.7) return plus(base, maneHi);
          return base;
        });

      // Tusks: two curved, upward tusks that rise from the lower jaw, beside the snout.
      const tuskPath = [
        [0.09, MOUTH_Y - 0.05, 0.034, 0.0],
        [0.106, MOUTH_Y - 0.004, 0.029, 0.018],
        [0.118, MOUTH_Y + 0.045, 0.021, 0.026],
        [0.124, MOUTH_Y + 0.09, 0.009, 0.024],
      ].map(([x, y, r, lift]) => [x!, y!, faceZ(0.11, Math.max(y!, 0.55)) + lift! - 0.01, r!] as [number, number, number, number]);
      // A kind may scale the tusks about their roots (0: no tusks).
      const ts = kind.tusks ?? 1;
      const t0 = tuskPath[0]!;
      const tusks = pair(sdf.chain(ts === 1 ? tuskPath : tuskPath.map(([x, y, z, r]) => [t0[0] + (x - t0[0]) * ts, t0[1] + (y - t0[1]) * ts, t0[2] + (z - t0[2]) * ts, r * ts] as [number, number, number, number]), 0.014 * ts)).bone('head');
      const tuskRoot = rgb('#b9a57a');
      const tuskTip = rgb(C.tusk);

      // ------------------------------------------------------------------ torso, arms, legs (D space)
      const trunk = sdf.smoothUnion(
        0.06,
        sdf.ellipsoid([0.27, 0.17, 0.19]).at(0, 0.57, 0).bone('chest'),
        sdf.ellipsoid([0.285, 0.245, 0.285]).at(0, 0.4, 0.05).bone('spine'),
        sdf.ellipsoid([0.21, 0.11, 0.17]).at(0, 0.28, 0).bone('hips'),
        pair(sdf.sphere(0.13).at(0.2, 0.68, -0.03).bone('chest')), // traps
      ).smoothUnion(0.04, pair(sdf.ellipsoid([0.115, 0.09, 0.08]).at(0.105, 0.6, 0.15).bone('chest'))); // two soft pec bulges
      const neck = sdf.capsule([0, 0.62, -0.01], [0, 0.72, -0.01], 0.115).bone('neck');
      const armAt = (s: 1 | -1) => {
        const raised = s < 0;
        const sh: V3 = s > 0 ? SH : mx(SH);
        const el: V3 = s > 0 ? EL : EL_R;
        const wr: V3 = s > 0 ? WR : WR_R;
        const side = s > 0 ? 'L' : 'R';
        return sdf.smoothUnion(
          0.035,
          sdf.sphere(0.125).at(sh[0], sh[1] + 0.015, sh[2]).bone(`upperarm.${side}`), // the round shoulder
          sdf.cone(sh, el, 0.108, 0.092).bone(`upperarm.${side}`),
          sdf.ellipsoid([0.095, 0.1, 0.09]).at(...lerp(sh, el, 0.5)).bone(`upperarm.${side}`), // biceps
          sdf.ellipsoid([0.055, 0.09, 0.055]).at(...add(lerp(sh, el, 0.45), [0, 0.01, 0.075])).bone(`upperarm.${side}`), // the biceps peak
          sdf.ellipsoid([0.06, 0.095, 0.055]).at(...add(lerp(sh, el, 0.45), [0, 0.01, -0.075])).bone(`upperarm.${side}`), // the triceps
          sdf.ellipsoid([0.06, 0.06, 0.06]).at(...add(lerp(sh, el, 0.12), [0, 0.02, 0.04])).bone(`upperarm.${side}`), // the deltoid
          sdf.cone(el, wr, 0.092, 0.078).bone(`forearm.${side}`),
          (raised ? fistGrip(wr) : fistAt(wr, 1, 1.37)).bone(`hand.${side}`),
        );
      };
      const legs = pair(sdf.cone([HIP[0], 0.27, 0], [ANKLE[0], 0.1, 0.01], 0.1, 0.08).bone('leg.L'));
      const footLocal = sdf
        .smoothUnion(
          0.02,
          sdf.ellipsoid([0.088, 0.052, 0.115]).at(0, 0.045, 0.035),
          ...[-0.055, -0.028, 0, 0.028, 0.055].map((x, i) => sdf.sphere(0.025 - Math.abs(i - 2) * 0.0012).at(x, 0.03, 0.14 - Math.abs(x) * 0.35)),
        )
        .intersect(sdf.halfSpace([0, -1, 0], 0));
      const feet = pair(footLocal.rotateY(12).at(ANKLE[0], 0, 0).bone('foot.L'));

      // A lighter belly and a soft shade under it.
      const light = shadeOf(C.skin, C.skinLight);
      const dark = shadeOf(C.skin, C.skinDark);
      const nip = (sx: number) => sdf.raycast(trunk, [sx * 0.125, 0.585, 1], [0, 0, -1])!;
      const nipples = pair(sdf.sphere(0.014).at(...nip(1)));
      const NAVEL_Z = 0.05 + 0.285 * Math.sqrt(1 - ((0.415 - 0.4) / 0.245) ** 2);
      const skin = sdf
        .smoothUnion(0.045, hx(headSkin), neck, trunk)
        .union(armAt(1), armAt(-1))
        .smoothUnion(0.035, legs)
        .union(feet)
        .smoothSubtract(0.008, sdf.sphere(0.018).at(0, 0.415, NAVEL_Z + 0.009)) // the navel dimple
        .paintWhere(nipples, T.skinDark, 0.004)
        .paintWhere(sdf.sphere(0.024).at(0, 0.415, NAVEL_Z), T.skinDark, 0.006)
        .paintFn((x, y, z, base) => {
          if (y > 0.7) return base;
          // A lighter belly: a gradient from the chest (y 0.62) down the front of the torso.
          // Base tan at the chest (y 0.66), the light belly color at the navel (y 0.415) and below.
          const front = smooth01(0.0, 0.12, z) * (1 - smooth01(0.26, 0.31, Math.abs(x))) * smooth01(0.66, 0.42, y) * smooth01(0.22, 0.3, y);
          // Dark under each pec bulge (the bulges sit at y 0.6, x +-0.105) and a soft fold between them.
          const pecUnder = Math.exp(-Math.pow((y - 0.52) / 0.026, 2)) * smooth01(0.06, 0.14, z) * smooth01(0.02, 0.06, Math.abs(x)) * (1 - smooth01(0.2, 0.25, Math.abs(x)));
          const fold = Math.max(pecUnder, 0.5 * Math.exp(-Math.pow((y - 0.505) / 0.014, 2)) * smooth01(0.0, 0.1, z) * (1 - smooth01(0.16, 0.24, Math.abs(x))));
          const lower = y < 0.28 && Math.abs(x) < 0.25 && z > 0 ? 0.4 * smooth01(0.28, 0.2, y) : 0;
          // Arms and legs a little darker than the belly.
          const limbs = (Math.abs(x) > 0.3 && y > 0.3) || y < 0.25 ? 0.25 : 0;
          return plus(plus(plus(base, light, front * 1.4), dark, Math.min(1, Math.max(fold * 1.1, lower))), dark, limbs);
        });
      put('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2, paintWeight: 2 });
      put('mane', hx(mane), { color: T.mane, roughness: 0.75, detail: 0.007, ...kind.maneBody });
      if (ts > 0) {
        put(
          'tusks',
          hx(tusks).paintFn((x, y) => {
            const t = 1 - smooth01(HC + (MOUTH_Y - HEAD_Y) * 0.9 * hs - 0.04, HC + (MOUTH_Y + 0.09 - HEAD_Y) * 0.9 * hs, y);
            return [tuskRoot[0] + (tuskTip[0] - tuskRoot[0]) * (1 - t), tuskRoot[1] + (tuskTip[1] - tuskRoot[1]) * (1 - t), tuskRoot[2] + (tuskTip[2] - tuskRoot[2]) * (1 - t)];
          }),
          { color: C.tusk, roughness: 0.4, detail: 0.004 },
        );
      }

      // ------------------------------------------------------------------ bracers, wraps, anklet (D space)
      /** A ring around the axis `d`, at `c`, of radius R and tube r. */
      const ring = (c: V3, d: V3, R: number, r: number) => {
        const [a, b] = yTo(d);
        return sdf.torus(R, r).rotate(a, 0, b).at(...c);
      };
      const bracersFor = (e: V3, w: V3, side: 'L' | 'R') => {
        const d = norm(sub(w, e));
        const radius = (t: number) => 0.092 - 0.014 * t;
        // Three stacked flat leather bands (a torus squashed along the arm), and a red wrap above them.
        const flatRing = (t: number, R: number, r: number, squash: number) => {
          const [a, b] = yTo(d);
          return sdf.torus(R, r).scale([1, squash, 1]).rotate(a, 0, b).at(...lerp(e, w, t));
        };
        const bands = sdf.union(...[0.46, 0.64, 0.82].map((t) => flatRing(t, radius(t) + 0.02, 0.028, 0.75)));
        const wrap = flatRing(0.2, radius(0.2) + 0.024, 0.032, 0.8).displace(0.005, (x, y, z) => noise.fbm(x * 30, y * 30, z * 30, 2));
        return {
          leather: bands.bone(`forearm.${side}`),
          wrap: wrap.bone(`forearm.${side}`),
        };
      };
      const brL = bracersFor(EL, WR, 'L');
      const brR = bracersFor(EL_R, WR_R, 'R');
      // The anklet: two leather coils on the left shin.
      const anklet = sdf
        .union(sdf.torus(0.08, 0.026).at(ANKLE[0] - 0.003, 0.14, 0.006), sdf.torus(0.083, 0.024).at(ANKLE[0] - 0.003, 0.105, 0.006))
        .bone('shin.L');
      // The belt buckle: a dark leather disc in the middle of the rope knot.
      const BELT_Y = 0.31;
      const beltRadius = (y: number) => Math.sqrt(Math.max(0, 1 - ((y - 0.4) / 0.24) ** 2));
      const beltFront = 0.05 + 0.285 * beltRadius(BELT_Y);
      const buckle = sdf.sphere(0.03).scale([1, 1, 0.5]).at(0, BELT_Y, beltFront + 0.024).bone('spine');
      put('leather', sdf.union(brL.leather, brR.leather, anklet, buckle), { color: T.leather, roughness: 0.6, detail: 0.008 });

      // ------------------------------------------------------------------ rope belt with a tassel
      const row = (y: number) => sdf.torus(0.285 * beltRadius(y), 0.027).at(0, y, 0.05);
      const beltRope = sdf.union(row(0.345), row(0.315), row(0.285)).bone('spine');
      const knotFront = beltFront + 0.02;
      const knot = sdf
        .union(
          sdf.torus(0.042, 0.017).rotateX(90).at(0, BELT_Y, knotFront),
          sdf.torus(0.034, 0.015).rotateX(90).rotateZ(40).at(0.03, BELT_Y - 0.01, knotFront + 0.01),
          sdf.torus(0.034, 0.015).rotateX(90).rotateZ(-40).at(-0.03, BELT_Y - 0.01, knotFront + 0.01),
        )
        .bone('spine');
      const tassel = sdf
        .union(
          ...[-0.03, 0, 0.03].map((x0, i) =>
            sdf.union(
              sdf.chain(
                [
                  [x0, BELT_Y - 0.02, knotFront + 0.005, 0.012],
                  [x0 * 1.3, BELT_Y - 0.1, knotFront + 0.014, 0.01],
                  [x0 * 1.5, BELT_Y - 0.2 - i * 0.012 + (i === 1 ? 0.012 : 0), knotFront + 0.016, 0.01],
                ],
                0.01,
              ),
              sdf.sphere(0.014).at(x0 * 1.5, BELT_Y - 0.212 - i * 0.012 + (i === 1 ? 0.012 : 0), knotFront + 0.016),
            ),
          ),
        )
        .bone('spine');
      const clubLocal = (s: sdf.Shape) => s.rotate(CLUB_RX, 0, CLUB_RZ).at(...GRIP);
      // The haft is 0.6 D (0.75 m) long, r 0.048 at the grip to 0.08 at the head. The stone spike is
      // 0.176 D (0.22 m) tall and is held by two lashing coils (local frame).
      const SPIKE_BASE = 0.38;
      const SPIKE_H = 0.176;
      const spikeR = (y: number) => 0.066 * (1 - (y - SPIKE_BASE) / SPIKE_H);
      const lashing = sdf.union(...[0.43, 0.462].map((y) => sdf.torus(spikeR(y) + 0.01, 0.014).at(0, y, 0)));
      // A rope hangs from the club head (0.25 m) and ends in a small bone toggle.
      const hangRope = sdf.chain(
        [
          [-0.08, 0.36, 0.0, 0.012],
          [-0.135, 0.3, 0.0, 0.01],
          [-0.15, 0.22, 0.0, 0.009],
          [-0.145, 0.15, 0.0, 0.009],
        ],
        0.01,
      );
      const toggle = sdf.ellipsoid([0.017, 0.036, 0.017]).rotateZ(-8).at(-0.144, 0.112, 0);
      const ropeShade = shadeOf(C.rope, C.ropeDark);
      put(
        'rope',
        sdf.union(beltRope, knot, tassel, ...(kind.weapon ? [] : [clubLocal(sdf.union(lashing, hangRope)).bone('hand.R')])).paintFn((x, y, z, base) =>
          Math.sin(Math.atan2(x, z - 0.05) * 70 + y * 150 + x * 40) > 0.3 ? plus(base, ropeShade) : base,
        ),
        { color: C.rope, roughness: 0.9, detail: 0.008, bump: (x, y, z) => 0.0012 * Math.sin(Math.atan2(x, z - 0.05) * 70 + y * 150 + x * 40) },
      );

      // ------------------------------------------------------------------ the club (local frame: grip at the origin, up along +Y)
      const club = sdf
        .chain(
          [
            [0, -0.1, 0, 0.045],
            [0, 0.05, 0, 0.05],
            [0, 0.25, 0, 0.068],
            [0, 0.36, 0, 0.08],
          ],
          0.03,
        )
        .displace(0.004, (x, y, z) => noise.fbm(x * 22, y * 8, z * 22, 3));
      if (!kind.weapon) put('club', clubLocal(club), {
        color: C.wood,
        roughness: 0.8,
        bone: 'hand.R',
        detail: 0.005,
        bump: (x, y, z) => 0.0015 * noise.fbm(x * 40, y * 30, z * 40, 2),
      });
      const spike = sdf.cone([0, SPIKE_BASE - 0.03, 0], [0.005, SPIKE_BASE + SPIKE_H, 0.0], 0.072, 0.004).displace(0.004, (x, y, z) => noise.fbm(x * 30, y * 30, z * 30, 2));
      if (!kind.weapon) {
        put('spike', clubLocal(spike), { color: C.stone, roughness: 0.85, bone: 'hand.R', detail: 0.004, flat: true });
        put('toggle', clubLocal(toggle), { color: '#e6d8b8', roughness: 0.6, bone: 'hand.R', detail: 0.004 });
      }

      // ------------------------------------------------------------------ loincloth: strips of hide and red cloth
      const strip = (a: number, i: number) => {
        const L = 0.17 + noise.random(i, 3, 1) * 0.08;
        const w = 0.05;
        const shape = sdf
          .extrude(
            profile.polygon([
              [-w, 0.02],
              [w, 0.02],
              [w, -L * 0.9],
              [w * 0.35, -L],
              [-w * 0.1, -L * (0.84 + noise.random(i, 4, 1) * 0.08)],
              [-w * 0.6, -L * 0.98],
              [-w, -L * 0.86],
            ]),
            0.014,
            0.004,
          )
          .rotateZ((noise.random(i, 5, 1) - 0.5) * 12)
          .rotateX(-9 - noise.random(i, 6, 1) * 6)
          .rotateY(a);
        const rr = 0.285 * beltRadius(0.3);
        const back = Math.abs(a) > 120 ? 0.98 : 1;
        return shape.at(rr * Math.sin(a * DEG) * 1.02 * back, 0.3, 0.05 + rr * Math.cos(a * DEG) * 1.02 * back).bone('hips');
      };
      const angles = [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100, 145, 180, -145];
      const stripsRed = sdf.union(...angles.filter((_, i) => i % 2 === 1).map((a) => strip(a, angles.indexOf(a))));
      const stripsHide = sdf.union(...angles.filter((_, i) => i % 2 === 0).map((a) => strip(a, angles.indexOf(a))));
      put('cloth', sdf.union(stripsRed, brL.wrap, brR.wrap).paintFn((x, y, z, base) => ((y < 0.2 || y > 0.5) && noise.fbm(x * 30, y * 30, z * 30, 2) > 0 ? plus(base, shadeOf(C.red, C.redDark)) : base)), {
        color: T.red,
        roughness: 0.88,
        detail: 0.006,
      });
      put('strips-hide', stripsHide, { color: T.hide, roughness: 0.85, detail: 0.006 });

      // ------------------------------------------------------------------ the kind's weapon and extra bodies
      const shape: OgreShape = {
        put,
        head: hx,
        headShape: head,
        faceZ,
        eye: EYE,
        trunk,
        weapon: clubLocal,
        joints: { SH, EL, WR, EL_R, WR_R, HIP, KNEE, ANKLE, GRIP, BELT_Y, HEAD_NEW: HC },
        ring,
        tint: { skin: T.skin, skinDark: T.skinDark, cloth: T.red, leather: T.leather, mane: T.mane },
        tone,
      };
      kind.weapon?.(k, shape);
      kind.extra?.(k, shape);

      // ------------------------------------------------------------------ animation
      const { wave, bump, legDrop, keys, reach, orient } = motion;
      type Bone = { rotate?: V3; move?: V3; scale?: V3 };
      /** Add a clip; the poses are written in D space, so every `move` is scaled by SC. */
      const clip = (name: string, def: { duration: number; loop?: boolean; pose: (t: number, p: number) => Record<string, Bone> }) =>
        k.animation(name, {
          ...def,
          pose: (t: number, p: number) => {
            const raw = def.pose(t, p);
            const out: Record<string, Bone> = {};
            for (const [b, v] of Object.entries(raw)) out[b] = v.move ? { ...v, move: mul(v.move, SC) } : v;
            return out;
          },
        });
      const deg = (r: number) => r / DEG;
      const shake = (p: number, a: number, len: number, n: number) => (p < a ? 0 : Math.exp((-(p - a) / len) * 3) * Math.sin(((p - a) / len) * Math.PI * n));
      const ARM_L = { root: SH, mid: EL, end: WR };
      const ARM_R = { root: mx(SH), mid: EL_R, end: WR_R };
      const CLUB = { dir: CLUB_DIR, up: CLUB_UP };

      clip('idle', {
        duration: 2.8,
        pose: (_t, p) => ({
          hips: { move: [0, -0.005 * bump(p), 0] },
          spine: { rotate: [1.5 * wave(p), 0, 0] },
          chest: { rotate: [2 * wave(p), 0, 0], scale: [1 + 0.02 * bump(p), 1, 1 + 0.025 * bump(p)] },
          neck: { rotate: [-1.5 * wave(p), 0, 0] },
          head: { rotate: [0, 5 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
          'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 4 * bump(p)] },
          'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
          'upperarm.R': { rotate: [1.5 * wave(p, 1, 0.1), 0, -2 * bump(p)] },
          'forearm.R': { rotate: [0, 0, 3 * wave(p, 1, 0.3)] },
        }),
      });

      // A heavy, rolling walk with the club held up: long planted steps and a wide sway.
      const stride = (duration: number, step: number, footLift: number, duty: number, bob: number, armSwing: number, lean: number, sway: number) => ({
        duration,
        pose: (_t: number, p: number): Record<string, Bone> => {
          const s = wave(p);
          const hipsTurn: V3 = [0, 5 * s, sway * s];
          const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
            stride: step,
            lift: footLift,
            duty,
            bob,
            roll: 8,
            heel: SOLE_HEEL,
            toe: SOLE_TOE,
            hips: { at: [0, 0.26, 0], rotate: hipsTurn },
          });
          return {
            ...legs.pose,
            hips: { move: [0, legs.hipsY, 0], rotate: hipsTurn },
            spine: { rotate: [lean, 0, -sway * 0.6 * s] },
            chest: { rotate: [lean * 0.5, -8 * s, 0] },
            head: { rotate: [-lean, 4 * s, 0] },
            'upperarm.L': { rotate: [armSwing * s, 0, 4] },
            'forearm.L': { rotate: [-armSwing * 0.4 - armSwing * 0.3 * Math.max(0, -s), 0, 0] },
            'upperarm.R': { rotate: [-armSwing * 0.12 * s, 0, 0] },
            'forearm.R': { rotate: [0, 0, 2 * s] },
          };
        },
      });
      clip('walk', stride(1.1, 0.11, 0.025, 0.62, 0.008, 18, 4, 4));
      clip('run', stride(0.65, 0.16, 0.045, 0.42, 0.03, 32, 12, 3));

      // ------------------------------------------------------------------ attack: a two-hand overhead smash
      // The club goes up and back beside the head, the ogre coils and holds; the body drives forward,
      // the club comes over the top and smashes down in front, the left hand joins the handle, the
      // spike hits the floor with a shake, then a slow recovery. All targets are in the chest's rest frame.
      clip('attack', {
        duration: 1.4,
        loop: false,
        pose: (_t, p) => {
          const wristKey = keys(
            p,
            [
              [0, WR_R],
              [0.1, [-0.44, 0.79, 0.07]],
              [0.3, [-0.3, 0.92, -0.15]],
              [0.4, [-0.3, 0.93, -0.17]], // the hold, up and back beside the head
              [0.47, [-0.36, 0.95, -0.02]], // over the top
              [0.53, [-0.3, 0.74, 0.2]],
              [0.555, [-0.27, 0.62, 0.36]],
              [0.58, [-0.03, 0.46, 0.34]], // the smash: both hands on the handle, in front of the belly
              [0.66, [-0.03, 0.46, 0.34]],
              [0.78, [-0.03, 0.46, 0.34]],
              [0.85, [-0.3, 0.5, 0.36]],
              [0.92, [-0.38, 0.7, 0.16]],
              [1, WR_R],
            ] as const,
            'spline',
          );
          const dir = keys(
            p,
            [
              [0, CLUB_DIR],
              [0.1, [-0.1, 0.8, -0.4]],
              [0.3, [-0.06, 0.55, -0.83]], // tilted back behind the shoulder
              [0.4, [-0.06, 0.45, -0.89]],
              [0.47, [-0.02, 0.98, -0.1]], // straight up
              [0.53, [-0.1, 0.3, 0.95]], // level in front
              [0.58, [-0.3, -0.1, 0.95]], // down: the spike meets the floor
              [0.66, [-0.3, -0.1, 0.95]],
              [0.78, [-0.3, -0.1, 0.95]],
              [0.92, [-0.1, 0.2, 0.97]],
              [1, CLUB_DIR],
            ] as const,
            'spline',
          );
          const d = norm(dir);
          // The wrist stays within the arm's reach, so the left hand can meet the club where it really is.
          const clampTo = (root: V3, t: V3): V3 => {
            const v = sub(t, root);
            const l = Math.hypot(...v);
            return l > ARM_REACH ? add(root, mul(v, ARM_REACH / l)) : t;
          };
          const wrist = clampTo(mx(SH), wristKey);
          const arm = reach(ARM_R, wrist, EL_R);
          const hand = orient([arm.upper, arm.lower], CLUB, { dir: d, up: perp(d, SIDE) });
          // The left hand: out to the side in the wind-up, then it closes on the handle for the smash.
          const free = keys(p, [[0, WR], [0.3, [0.4, 0.72, -0.05]], [0.45, [0.38, 0.78, -0.05]], [0.53, [0.2, 0.7, 0.16]], [0.92, [0.38, 0.4, 0.1]], [1, WR]] as const, 'smooth');
          const onClub = clampTo(SH, sub(wrist, mul(d, 0.12)));
          const w = keys(p, [[0, 0], [0.5, 0], [0.56, 1], [0.8, 1], [0.92, 0], [1, 0]] as const);
          const off = reach(ARM_L, lerp(free, onClub, w), EL);
          const sh = shake(p, 0.58, 0.16, 5);
          const spineX = keys(p, [[0, 0], [0.36, -8], [0.44, -9], [0.52, 4], [0.58, 12], [0.72, 12], [1, 0]] as const);
          const chestX = keys(p, [[0, 0], [0.36, -6], [0.44, -7], [0.52, 3], [0.58, 10], [0.72, 10], [1, 0]] as const) + 3 * sh;
          const chestY = keys(p, [[0, 0], [0.36, -12], [0.44, -14], [0.52, 5], [0.58, 6], [0.72, 5], [1, 0]] as const);
          const hipsZ = keys(p, [[0, 0], [0.36, -0.02], [0.44, -0.022], [0.54, 0.04], [0.72, 0.04], [1, 0]] as const);
          const stepL = keys(p, [[0, 0], [0.34, -6], [0.44, -8], [0.53, -22], [0.74, -20], [1, 0]] as const);
          const legR = deg(Math.atan2(hipsZ, LEG));
          const legL = stepL + legR;
          const drop = keys(p, [[0, 0], [0.4, 0.008], [0.56, 0.02], [0.62, 0.022], [0.74, 0.018], [1, 0]] as const);
          return {
            hips: { move: [0, -Math.max(legDrop(LEG, legL), legDrop(LEG, legR)) - drop - 0.006 * sh, hipsZ] },
            spine: { rotate: [spineX, 0, 0] },
            chest: { rotate: [chestX, chestY, 0], scale: [1 + 0.02 * sh, 1, 1 + 0.02 * sh] },
            head: { rotate: [-(spineX + chestX) * 0.6 - 3 * sh - 16 * keys(p, [[0, 0], [0.5, 0], [0.56, 1], [0.86, 1], [0.97, 0]] as const), -chestY * 0.6, 0] },
            'upperarm.R': { rotate: arm.upper },
            'forearm.R': { rotate: arm.lower },
            'hand.R': { rotate: hand },
            'upperarm.L': { rotate: off.upper },
            'forearm.L': { rotate: off.lower },
            'leg.L': { rotate: [legL, 0, 0] },
            'leg.R': { rotate: [legR, 0, 0] },
            'foot.L': { rotate: [-legL, 0, 0] },
            'foot.R': { rotate: [-legR, 0, 0] },
          };
        },
      });

      // ------------------------------------------------------------------ attack2: a belly-first charge, then a backhand swipe
      const { edgeUp } = motion;
      void edgeUp;
      const ease = (a: number, b: number, x: number) => smooth01(a, b, x);
      type Step = readonly [number, number, number, number];
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
      const STEPS_R: readonly Step[] = [[0.26, 0.36, 0, 0.26], [0.72, 0.83, 0.26, 0]];
      const swipeAt = (q: number) =>
        keys(
          q,
          [
            [0, CLUB_DIR],
            [0.15, [0.5, -0.3, 0.8]],
            [0.36, [0.5, -0.25, 0.83]],
            [0.45, [0.5, -0.25, 0.83]],
            [0.49, [0.78, -0.12, 0.42]], // cocked: the head to the left
            [0.54, [0.35, -0.12, 0.93]],
            [0.58, [-0.3, -0.12, 0.95]], // contact: level and forward
            [0.62, [-0.8, -0.1, 0.55]],
            [0.66, [-0.95, -0.1, 0]], // follow-through, out to the right
            [0.72, [-0.92, -0.2, 0]],
            [0.86, [-0.6, -0.3, 0.3]],
            [1, CLUB_DIR],
          ] as const,
          'spline',
        );
      clip('attack2', {
        duration: 1.25,
        loop: false,
        pose: (_t, p) => {
          const sh = shake(p, 0.36, 0.1, 5);
          const hipsY = keys(p, [[0, 0], [0.15, 8], [0.45, 8], [0.48, 9], [0.66, -8], [0.72, -8], [0.9, 0]] as const);
          const spineY = keys(p, [[0, 0], [0.15, 8], [0.45, 8], [0.48, 9], [0.66, -8], [0.72, -8], [0.92, 0]] as const);
          const chestY = keys(p, [[0, 0], [0.15, 12], [0.36, 14], [0.45, 14], [0.48, 16], [0.66, -14], [0.72, -14], [0.95, 0]] as const);
          const turn = hipsY + spineY + chestY;
          const lean = keys(p, [[0, 0], [0.15, 14], [0.26, 16], [0.36, 22], [0.45, 20], [0.48, 15], [0.66, 6], [0.72, 6], [0.95, 0]] as const);
          const headX = keys(p, [[0, 0], [0.15, 2], [0.36, -6], [0.45, -6], [0.6, -6], [0.72, -4], [1, 0]] as const);
          const fL = footAt(STEPS_L, p);
          const fR = footAt(STEPS_R, p);
          const hipsZ = (fL.z + fR.z) / 2 + keys(p, [[0, 0], [0.3, 0], [0.36, 0.02], [0.45, 0.015], [0.6, 0.02], [0.72, 0]] as const);
          const legL = legTo(fL.z, hipsZ, hipsY, 1);
          const legR = legTo(fR.z, hipsZ, hipsY, -1);
          const wrist = keys(
            p,
            [
              [0, WR_R],
              [0.15, [-0.25, 0.37, 0.26]],
              [0.36, [-0.24, 0.37, 0.27]],
              [0.45, [-0.24, 0.37, 0.27]],
              [0.49, [-0.2, 0.38, 0.26]],
              [0.54, [-0.26, 0.4, 0.27]],
              [0.58, [-0.28, 0.43, 0.22]],
              [0.62, [-0.34, 0.43, 0.14]],
              [0.66, [-0.37, 0.42, 0.04]],
              [0.72, [-0.37, 0.41, 0.04]],
              [0.86, [-0.37, 0.36, 0.06]],
              [1, WR_R],
            ] as const,
            'spline',
          );
          const arm = reach(ARM_R, wrist, EL_R);
          const d = norm(swipeAt(p));
          const pref = keys(p, [[0, SIDE], [0.5, SIDE], [0.56, [0, 1, 0]], [0.74, [0, 1, 0]], [0.86, SIDE], [1, SIDE]] as const);
          const hand = orient([arm.upper, arm.lower], CLUB, { dir: d, up: perp(d, pref) });
          const offWrist = keys(p, [[0, WR], [0.15, [0.34, 0.4, 0.16]], [0.3, [0.36, 0.38, -0.1]], [0.45, [0.36, 0.38, -0.1]], [0.6, [0.4, 0.42, 0.1]], [0.72, [0.4, 0.42, 0.1]], [1, WR]] as const);
          const off = reach(ARM_L, offWrist, EL);
          return {
            hips: { move: [0, -Math.min(legL.drop + fL.lift, legR.drop + fR.lift), hipsZ], rotate: [0, hipsY, 0] },
            spine: { rotate: [lean * Math.cos(hipsY * DEG), spineY, lean * Math.sin(hipsY * DEG)] },
            chest: { rotate: [3 * sh, chestY, 2 * sh], scale: [1 + 0.02 * sh, 1, 1 + 0.02 * sh] },
            head: { rotate: [headX - 3 * sh, -turn * 0.7, 0] },
            'upperarm.R': { rotate: arm.upper },
            'forearm.R': { rotate: arm.lower },
            'hand.R': { rotate: hand },
            'upperarm.L': { rotate: off.upper },
            'forearm.L': { rotate: off.lower },
            'leg.L': { rotate: [legL.rot, -hipsY, 0], move: [0, fL.lift, 0] },
            'leg.R': { rotate: [legR.rot, -hipsY, 0], move: [0, fR.lift, 0] },
            'foot.L': { rotate: [-legL.rot, 0, 0] },
            'foot.R': { rotate: [-legR.rot, 0, 0] },
          };
        },
      });

      // ------------------------------------------------------------------ roar: a war cry, the club held high
      clip('roar', {
        duration: 1.9,
        loop: false,
        pose: (_t, p) => {
          const rise = keys(p, [[0, 0], [0.16, -0.5], [0.3, 1], [0.8, 1], [1, 0]] as const);
          const lift = Math.max(0, rise);
          const crouch = Math.max(0, -rise);
          const tremble = p > 0.3 && p < 0.82 ? wave((p - 0.3) / 0.52, 7) * Math.sin(((p - 0.3) / 0.52) * Math.PI) : 0;
          const wristR = keys(p, [[0, WR_R], [0.16, [-0.44, 0.7, 0.16]], [0.3, [-0.4, 0.88, 0.08]], [0.8, [-0.4, 0.88, 0.08]], [1, WR_R]] as const, 'smooth');
          const dirR = norm(keys(p, [[0, CLUB_DIR], [0.16, CLUB_DIR], [0.3, [-0.2, 0.95, 0.05]], [0.8, [-0.2, 0.95, 0.05]], [1, CLUB_DIR]] as const, 'smooth'));
          const arm = reach(ARM_R, wristR, EL_R);
          const hand = orient([arm.upper, arm.lower], CLUB, { dir: dirR, up: perp(dirR, SIDE) });
          const fist = reach(ARM_L, keys(p, [[0, WR], [0.16, [0.36, 0.34, 0.14]], [0.3, [0.42, 0.86, 0.06]], [0.8, [0.42, 0.86, 0.06]], [1, WR]] as const, 'smooth'), EL);
          return {
            hips: { move: [0, -0.03 * crouch - 0.003 * Math.abs(tremble), 0] },
            spine: { rotate: [10 * crouch - 6 * lift, 0, 0] },
            chest: { rotate: [8 * crouch - 10 * lift + 1.5 * tremble, 2 * tremble, 0], scale: [1 + 0.05 * lift, 1, 1 + 0.04 * lift] },
            neck: { rotate: [6 * crouch - 8 * lift, 0, 0] },
            head: { rotate: [8 * crouch - 12 * lift + 2 * tremble, 3 * tremble, 0] },
            'upperarm.R': { rotate: arm.upper },
            'forearm.R': { rotate: arm.lower },
            'hand.R': { rotate: hand },
            'upperarm.L': { rotate: fist.upper },
            'forearm.L': { rotate: fist.lower },
            'leg.L': { rotate: [0, 0, 4 * lift] },
            'leg.R': { rotate: [0, 0, -4 * lift] },
          };
        },
      });

      // ------------------------------------------------------------------ hit and death
      clip('hit', {
        duration: 0.5,
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
            'upperarm.R': { rotate: [8 * r, 0, 10 * r] },
            'forearm.R': { rotate: [0, 0, 8 * r] },
            'leg.L': { rotate: [legL, 0, 0] },
            'foot.L': { rotate: [-legL, 0, 0] },
            'leg.R': { rotate: [12 * r, 0, 0] },
            'foot.R': { rotate: [-12 * r, 0, 0] },
          };
        },
      });

      clip('death', {
        duration: 1.6,
        loop: false,
        pose: (_t, p) => {
          const fall = keys(p, [[0, 0], [0.2, -8], [0.4, 3], [0.54, -40], [0.66, -88], [0.72, -84], [0.8, -88], [1, -88]] as const);
          const hipsY = keys(p, [[0, 0], [0.4, 0], [0.54, -0.006], [0.66, -0.05], [0.72, -0.038], [0.8, -0.05], [1, -0.05]] as const);
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
            'upperarm.R': { rotate: [keys(p, [[0, 0], [0.2, 10], [0.4, -6], [0.58, -30], [0.7, 20], [1, 24]] as const), 0, keys(p, [[0, 0], [0.2, 10], [0.4, 20], [0.58, 50], [0.7, 70], [1, 74]] as const)] },
            'forearm.R': { rotate: [keys(p, [[0, 0], [0.58, -10], [1, 0]] as const), 0, keys(p, [[0, 0], [0.4, 10], [0.7, 30], [1, 34]] as const)] },
            'hand.R': { rotate: [keys(p, [[0, 0], [0.62, 0], [0.8, 40], [1, 40]] as const), 0, 0] },
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

/**
 * Two shoulder plates (pauldrons) in orc space: a dome over each shoulder with a rolled rim,
 * tagged to the upper arms. `r` is the dome radius (the shoulder ball is 0.125).
 */
export function ogrePauldrons(o: OgreShape, r = 0.15): sdf.Shape {
  const [x, y, z] = o.joints.SH;
  const c: V3 = [x + 0.012, y + 0.03, z];
  const dome = sdf.sphere(r).at(...c).intersect(sdf.halfSpace([0, -1, 0], -(c[1] - 0.035)));
  const rim = sdf.torus(r * 0.97, 0.02).scale([1, 0.8, 1]).at(c[0], c[1] - 0.03, c[2]);
  return sdf.smoothUnion(0.01, dome, rim).bone('upperarm.L').mirror('x');
}
