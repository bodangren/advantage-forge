import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Dryad — Chibi Quest monster (catalog `monsters/fey-and-spirit/dryad`), a young tree spirit about
 * 0.95 m to the leaves on her hood, faces +Z. Target: docs/monster-mockups/dryad_001.jpg (made with
 * mmx from the fairy sprite mockup). Built on the villager (`assets/villager.ts`: the rogue's head,
 * face, and skeleton, the stride), re-dressed as a dryad, with both hands free.
 *
 * Role: a shy guardian of the old woods (friend or foe); the leafy hood with leaves on top, the long
 *   olive hair, and the leaf dress read at 128 px.
 * One idea: a gentle girl of the forest in a hood of leaves that frames her face, long wavy olive-blonde
 *   hair down to her waist, pointed ears that poke out of the hood, a dress of overlapping leaves with
 *   a pointed leaf hem and little pink flowers, a twisted vine belt, and boots of bark. Her attack is
 *   a spell: a whirl of glowing leaves that she pushes out with both hands.
 * Proportions: the villager's (head center 0.675, eyes 0.628, shoulders 0.385, waist 0.29); the hood
 *   to 0.9 and its top leaves to 0.95; the leaf hem at 0.15; the hair to 0.3 in front.
 * Shape language: round and soft (face, hood, skirt), with the pointed accents of the leaves, the
 *   ears, and the hem.
 * Palette (60/30/10): leaf green #6aa84a (hood, dress) with darker #4a8a3a leaf edges; olive-blonde
 *   hair #c0b46a; pale skin #f6dcc4; bark boots #7a5a3a; pink flowers #f4a0b0 and the glowing spell
 *   #b8f070 as the accent.
 * Bodies: skin, hair, hood (with the leaves), dress (with the flowers), belt, boots, leaf-whirl.
 * Rig: the villager's skeleton and `spell` (on `chest`; the leaf whirl, hidden in the chest at 35 %
 *   and scaled up in the attack). Clips: idle, walk, run, attack (the leaf spell), hit, death.
 */

const C = {
  skin: '#f6dcc4',
  blush: '#f2988a',
  eyeWhite: '#f6f1ea',
  irisRim: '#1e120a',
  iris: '#5a3a1e',
  irisLow: '#8a5a2a',
  pupil: '#110d0b',
  lid: '#1c130f',
  brow: '#6a5a2a',
  mouth: '#a04a40',
  hair: '#c0b46a',
  hairDark: '#8a8040',
  leaf: '#6aa84a',
  leafDark: '#4a8a3a',
  leafLight: '#9acd6a',
  bark: '#7a5a3a',
  barkDark: '#4a3420',
  vine: '#6a5030',
  flower: '#f4a0b0',
  flowerMid: '#f0d050',
  spell: '#b8f070',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (a: V3): V3 => {
  const n = Math.hypot(...a);
  return [a[0] / n, a[1] / n, a[2] / n];
};
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Joints: both arms hang a little out from the sides, the hands open.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW: V3 = [0.19, 0.334, 0.014];
const WRIST: V3 = [0.24, 0.27, 0.045];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0];
const HIPS_P: V3 = [0, 0.2, 0];
const HIPS_AT: V3 = [0, 0.2, 0];
const SPELL_AT: V3 = [0, 0.345, 0.0];
const SPELL_REST = 0.35;

/** A relaxed open hand hanging from the wrist `w`: the palm turned in, the thumb forward. `s` is 1 on the right, -1 on the left. */
const openHand = (w: V3, s: 1 | -1) =>
  sdf.smoothUnion(
    0.014,
    sdf.ellipsoid([0.021, 0.044, 0.036]).rotateZ(-16 * s).at(w[0] - 0.012 * s, w[1] - 0.036, w[2] + 0.006),
    sdf.cone([w[0] + 0.004 * s, w[1] - 0.018, w[2] + 0.028], [w[0], w[1] - 0.042, w[2] + 0.05], 0.013, 0.01), // thumb
  );

/** A pointed leaf in the XY plane (the stem at the origin, the tip up +Y), `t` thick. */
const leafShape = (len: number, w: number, t = 0.008) =>
  sdf.extrude(
    profile.polygon(
      [
        [0, 0],
        [w * 0.55, len * 0.25],
        [w * 0.5, len * 0.62],
        [0, len],
        [-w * 0.5, len * 0.62],
        [-w * 0.55, len * 0.25],
      ],
      { smooth: true },
    ),
    t,
    t * 0.45,
  );

export default defineAsset({
  name: 'dryad',
  description: 'Chibi dryad monster: a gentle forest girl in a green hood of leaves with leaves on top, long wavy olive-blonde hair, pointed ears, big brown eyes, a dress of overlapping leaves with a pointed hem and little pink flowers, a twisted vine belt, and bark boots; she casts a whirl of glowing leaves.',
  detail: 0.005,
  reference: 'docs/monster-mockups/dryad_001.jpg',
  variants: {
    clothing: { leaf: C.leaf, autumn: '#c8783a', blossom: '#d890a8' },
    hair: { olive: C.hair, honey: '#d8a850', moss: '#7a9a50' },
    skin: { fair: C.skin, tan: '#d8a47a', bark: '#a87a58' },
    eyes: { brown: C.iris, green: '#3d7a35', amber: '#b07020' },
  },
  presets: {
    autumn: { clothing: 'autumn', hair: 'honey', skin: 'tan', eyes: 'amber' },
    blossom: { clothing: 'blossom', hair: 'moss', skin: 'fair', eyes: 'green' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      hairDark: k.tint('hair', { color: C.hairDark, follow: 1 }),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      skin: k.tint('skin'),
      blush: k.tint('skin', { color: C.blush, follow: 0.5 }),
      nose: k.tint('skin', { color: '#f0a090', follow: 0.5 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      leaf: k.tint('clothing'),
      leafDark: k.tint('clothing', { color: C.leafDark, follow: 1 }),
      leafLight: k.tint('clothing', { color: C.leafLight, follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: HIPS_AT },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
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
      spell: { parent: 'chest', at: SPELL_AT },
    });

    // ------------------------------------------------------------------ head, face, arms, and legs (skin)
    const head = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)),
        sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058),
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.ellipsoid([0.022, 0.019, 0.017]).at(0, 0.57, faceZ(0, 0.57) - 0.002).bone('head');
    // Long pointed ears that sweep up and back, out through the hood.
    const ears = pair(
      sdf
        .cone([0.19, 0.6, -0.01], [0.3, 0.69, -0.05], 0.034, 0.005)
        .smoothSubtract(0.006, sdf.cone([0.205, 0.605, 0.012], [0.28, 0.67, -0.03], 0.02, 0.003))
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');
    const arm = (s: 'L' | 'R') => {
      const m = (v: V3) => (s === 'L' ? v : mx(v));
      return sdf.smoothUnion(
        0.02,
        sdf.cone(m(SHOULDER), m(ELBOW), 0.038, 0.034).bone(`upperarm.${s}`),
        sdf.cone(m(ELBOW), m(WRIST), 0.034, 0.03).bone(`forearm.${s}`),
        openHand(m(WRIST), s === 'L' ? -1 : 1).bone(`hand.${s}`),
      );
    };
    // Bare legs below the skirt, down into the boots.
    const legs = pair(sdf.capsule([HIP[0], 0.21, 0], [0.096, 0.075, 0.004], 0.033).bone('leg.L'));

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.056, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.042, 0.049, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.036, 0.043, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.026, 0.029, 0.07]), EYE[0], EYE[1] + 0.002));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.012, 15, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const lashes = pair(
      sdf.union(
        sdf.extrude(profile.rect([0.022, 0.008], 0.003), 0.3).rotateZ(35).at(EYE[0] + 0.05, EYE[1] + 0.038, 0.1),
        sdf.extrude(profile.rect([0.018, 0.007], 0.003), 0.3).rotateZ(15).at(EYE[0] + 0.056, EYE[1] + 0.022, 0.1),
      ),
    );
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.019), at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022)]),
    );
    const brows = pair(sdf.extrude(profile.arc(0.1, 0.014, 64, 114), 0.3).at(0.1, 0.728 - 0.1, 0.1));
    const smile = sdf.extrude(profile.arc(0.05, 0.01, 246, 294), 0.3).at(0, 0.532 + 0.05, 0.1);
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(arm('L'), arm('R'), legs)
      .paintWhere(pair(at(sdf.sphere(0.042), 0.14, 0.565)), T.blush, 0.032)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(lashes, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.brow)
      .paintWhere(smile, T.mouth)
      .paintWhere(sdf.sphere(0.02).at(0, 0.57, faceZ(0, 0.57) + 0.03), T.nose, 0.015);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ hair: a cap, a parted fringe, long wavy locks
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.012, HEAD[1] + 0.014, HEAD[2] + 0.012])
      .at(0, HEAD_Y + 0.008, -0.01)
      .smoothSubtract(0.015, sdf.ellipsoid([0.25, 0.155, 0.23]).at(0, 0.61, 0.14));
    const onHead = (x: number, y: number, r: number, lift = 0.55): [number, number, number, number] => [x, y, faceZ(Math.abs(x), y) + r * lift, r];
    // A fringe parted in the middle, swept down to both temples.
    const fringe = sdf.chain([onHead(0.008, 0.82, 0.03), onHead(0.06, 0.79, 0.032), onHead(0.12, 0.745, 0.028), onHead(0.165, 0.69, 0.02), onHead(0.18, 0.645, 0.01)], 0.02);
    // Long wavy locks: from under the hood at the cheeks, down in front of the shoulders to the waist;
    // a mass behind, down the back. The upper part follows the head, the lower part the chest.
    // Strands that run down the hair and wiggle a little, so the locks read as wavy hair.
    const wavy = (x: number, y: number, z: number) => Math.sin(Math.atan2(x, z + 0.06) * 16 + 1.4 * Math.sin(y * 45)) + 0.3 * noise.fbm(x * 30, y * 10, z * 30, 2);
    const lockTop = sdf.chain([[0.165, 0.64, 0.04, 0.04], [0.185, 0.52, 0.05, 0.045]], 0.02).bone('head');
    const lockLow = sdf.chain([[0.185, 0.52, 0.05, 0.045], [0.19, 0.42, 0.075, 0.04], [0.18, 0.33, 0.085, 0.03], [0.17, 0.29, 0.085, 0.014]], 0.02).bone('chest');
    const backTop = sdf.ellipsoid([0.2, 0.16, 0.1]).at(0, 0.6, -0.12).bone('head');
    const backLow = sdf.chain([[0, 0.5, -0.14, 0.15], [0, 0.4, -0.15, 0.13], [0, 0.33, -0.14, 0.09]], 0.04).scale([1, 1, 0.6]).bone('chest');
    const longHair = sdf.smoothUnion(0.03, pair(sdf.smoothUnion(0.02, lockTop, lockLow)), sdf.smoothUnion(0.04, backTop, backLow)).displace(0.006, wavy);
    const hair = sdf
      .smoothUnion(0.02, cap.bone('head'), pair(fringe).bone('head'), longHair)
      .paintFn((x, y, z, base) => (wavy(x, y, z) > 1.05 ? rgb(T.hairDark) : base));
    k.body('hair', hair, { color: T.hair, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ hood of leaves: over the crown and the back, leaves around the face and on top
    const HOOD_N = unit([0, -0.5, 0.866]);
    const HOOD_OFF = dot(HOOD_N, [0, 0.8, 0.14]);
    const hoodBall = sdf.ellipsoid([HEAD[0] + 0.034, HEAD[1] + 0.036, HEAD[2] + 0.034]).at(0, HEAD_Y + 0.012, -0.016);
    const shingles = (x: number, y: number, z: number) => {
      // Overlapping leaf tips in rows down the hood (a scale pattern).
      const a = Math.atan2(x, z + 0.02) * 4;
      const row = Math.floor(y * 28);
      const u = a + (row % 2) * 0.5;
      return Math.abs(Math.sin(u * Math.PI)) - (y * 28 - row);
    };
    const hoodShell = hoodBall
      .intersect(sdf.halfSpace(HOOD_N, HOOD_OFF))
      .intersect(sdf.halfSpace([0, -1, 0], -0.5))
      .subtract(sdf.ellipsoid([HEAD[0] + 0.008, HEAD[1] + 0.01, HEAD[2] + 0.008]).at(0, HEAD_Y + 0.008, -0.012))
      .displace(0.0018, shingles);
    // Leaves around the face: points on the hood's front rim, each leaf tipped outward.
    const up: V3 = [0, 0.866, 0.5];
    const c: V3 = [0, 0.8 - 0.06 * 0.866, 0.14 - 0.06 * 0.5];
    const rimLeaves: sdf.Shape[] = [];
    for (let i = 0; i < 11; i++) {
      const a = (-120 + i * 24) * (Math.PI / 180);
      const d: V3 = unit([Math.sin(a), Math.cos(a) * up[1], Math.cos(a) * up[2]]);
      const hit = sdf.raycast(hoodBall, [c[0] + d[0], c[1] + d[1], c[2] + d[2]], [-d[0], -d[1], -d[2]]);
      if (!hit) continue;
      const len = 0.075 + 0.012 * (i % 2);
      rimLeaves.push(
        leafShape(len, 0.05, 0.01)
          .at(0, -0.01, 0)
          .rotateX(-25)
          .rotateZ(-(a * 180) / Math.PI)
          .rotateX(-30)
          .at(hit[0], hit[1], hit[2] - 0.01),
      );
    }
    // Three tall leaves on top of the hood.
    const crown = sdf.union(
      leafShape(0.13, 0.09, 0.014).rotateX(-18).at(0, 0.9, -0.01),
      leafShape(0.12, 0.08, 0.014).rotateX(-10).rotateZ(52).at(-0.07, 0.885, -0.03),
      leafShape(0.12, 0.08, 0.014).rotateX(-10).rotateZ(-52).at(0.07, 0.885, -0.03),
      leafShape(0.1, 0.07, 0.014).rotateX(35).rotateZ(25).at(-0.04, 0.89, -0.09),
      leafShape(0.1, 0.07, 0.014).rotateX(35).rotateZ(-25).at(0.04, 0.89, -0.09),
    );
    const hood = sdf
      .smoothUnion(0.008, hoodShell, sdf.union(...rimLeaves).paint(T.leafLight), crown.paint(T.leafLight))
      .paintFn((x, y, z, base) => (shingles(x, y, z) < -0.82 ? rgb(T.leafDark) : base));
    k.body('hood', hood.bone('head'), { color: T.leaf, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ leaf dress: a bodice, leaf cap sleeves, a skirt with a pointed leaf hem
    const bodice = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.107, 0.44],
            [0.128, 0.4],
            [0.134, 0.35],
            [0.128, 0.3],
            [0.123, 0.27],
            [0.118, 0.25],
            [0, 0.25],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.82]);
    const skirtBase = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.295],
            [0.127, 0.295],
            [0.133, 0.27],
            [0.15, 0.235],
            [0.168, 0.195],
            [0.18, 0.165],
            [0.182, 0.15],
            [0.172, 0.142],
            [0, 0.142],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.86]);
    // The hem: 12 pointed leaf tongues; rows of leaf scales above it.
    const N_LEAVES = 12;
    const tongue = (x: number, y: number, z: number) => {
      const u = Math.abs(Math.cos(Math.atan2(x, z) * (N_LEAVES / 2)));
      return (u ** 3 - 0.5) * clamp01((0.175 - y) / 0.03);
    };
    const scales = (x: number, y: number, z: number) => {
      const row = Math.floor((0.3 - y) / 0.04);
      const a = Math.atan2(x, z) * (N_LEAVES / (2 * Math.PI)) + (row % 2) * 0.5;
      const v = ((0.3 - y) / 0.04) % 1;
      return v - Math.abs(Math.sin(a * Math.PI)) * 0.8;
    };
    const skirt = skirtBase
      .displace(0.004, (x, y, z) => 2 * tongue(x, y, z) + 0.6 * Math.sin(Math.atan2(x, z) * N_LEAVES) * clamp01((0.27 - y) / 0.1))
      .intersect(sdf.halfSpace([0, -1, 0], -0.11));
    const sleeve = (s: V3, e: V3, tag: string) =>
      sdf
        .smoothUnion(0.015, sdf.ellipsoid([0.052, 0.046, 0.05]).at(...lerp([s[0] * 0.95, 0.395, 0], e, 0.25)), leafShape(0.07, 0.06, 0.012).rotateX(90).rotateZ(s[0] > 0 ? 120 : -120).at(...lerp(s, e, 0.45)))
        .bone(tag);
    const flowers = sdf.union(
      ...(
        [
          [0.06, 0.22],
          [-0.09, 0.19],
          [0.11, 0.17],
          [-0.03, 0.25],
          [0.0, 0.36],
        ] as const
      ).map(([x, y]) => {
        const p = sdf.raycast(y > 0.3 ? bodice : skirtBase, [x, y, 1], [0, 0, -1])!;
        return sdf
          .smoothUnion(0.003, ...Array.from({ length: 5 }, (_, i) => sdf.sphere(0.009).at(Math.cos((i * 2 * Math.PI) / 5) * 0.011, Math.sin((i * 2 * Math.PI) / 5) * 0.011, 0)))
          .union(sdf.sphere(0.007).at(0, 0, 0.004).paint(C.flowerMid))
          .at(p[0], p[1], p[2] + 0.004);
      }),
    );
    const dress = sdf
      .union(
        bodice.intersect(sdf.halfSpace([0, -1, 0], -0.33)).bone('chest'),
        bodice.intersect(sdf.halfSpace([0, 1, 0], 0.33)).bone('spine'),
        skirt.bone('hips'),
        sleeve(SHOULDER, ELBOW, 'upperarm.L'),
        sleeve(mx(SHOULDER), mx(ELBOW), 'upperarm.R'),
      )
      .paintFn((x, y, z, base) => {
        if (y < 0.29 && y > 0.15 && scales(x, y, z) < 0.12) return rgb(T.leafDark);
        if (y <= 0.175 && tongue(x, y, z) > 0.2) return rgb(T.leafLight);
        return base;
      })
      .union(flowers.paint(C.flower).bone('hips'));
    k.body('dress', dress, { color: T.leaf, roughness: 0.75 });

    // ------------------------------------------------------------------ a twisted vine belt with a little leaf
    const shellOf = (s: sdf.Shape, outer: number, inner: number) => s.round(outer).subtract(s.round(inner));
    const twist = (x: number, y: number, z: number) => Math.sin(Math.atan2(x, z) * 14 + y * 300);
    const belt = shellOf(bodice, 0.011, 0.001)
      .smoothIntersect(0.004, sdf.box([0.5, 0.022, 0.5], 0.006).at(0, 0.29, 0))
      .displace(0.002, twist)
      .union(leafShape(0.05, 0.035, 0.008).rotateZ(-50).at(0.06, 0.29, sdf.raycast(bodice, [0.06, 0.29, 1], [0, 0, -1])![2] + 0.012).paint(T.leafLight))
      .paintFn((x, y, z, base) => (twist(x, y, z) > 0.6 ? rgb('#4a3820') : base));
    k.body('belt', belt.bone('spine'), { color: C.vine, roughness: 0.8, detail: 0.004 });

    // ------------------------------------------------------------------ bark boots: round toes, a ridged shaft, a leafy cuff
    const bootFoot = sdf
      .smoothUnion(
        0.03,
        sdf.cylinder(0.05, 0.064, 0.018).at(0, 0.034, 0),
        sdf.ellipsoid([0.056, 0.045, 0.098]).at(0, 0.04, 0.042),
        sdf.cylinder(0.044, 0.09, 0.012).at(0, 0.085, 0.002),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const ridges = (x: number, y: number, z: number) => Math.sin(Math.atan2(x, z) * 9 + 4 * noise.fbm(x * 30, y * 8, z * 30, 2));
    const cuff = sdf.union(...Array.from({ length: 6 }, (_, i) => leafShape(0.04, 0.03, 0.008).rotateX(-20).rotateY(i * 60).at(Math.sin((i * Math.PI) / 3) * 0.042, 0.115, Math.cos((i * Math.PI) / 3) * 0.042)));
    const boot = bootFoot
      .displace(0.0025, ridges)
      .paintFn((x, y, z, base) => (ridges(x, y, z) > 0.55 ? rgb(C.barkDark) : y < 0.014 ? rgb(C.barkDark) : base))
      .union(cuff.paint(T.leafDark))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.bark, roughness: 0.85 });

    // ------------------------------------------------------------------ the spell: a whirl of glowing leaves (hidden in the chest at rest)
    const whirl = sdf.smoothUnion(
      0.01,
      sdf.sphere(0.04),
      ...Array.from({ length: 6 }, (_, i) => leafShape(0.07, 0.04, 0.018).at(0, 0.03, 0).rotateZ(i * 60 + 15)),
    );
    k.body('leaf-whirl', whirl.scale(SPELL_REST).at(...SPELL_AT), {
      color: C.spell,
      emissive: C.spell,
      emissiveIntensity: 1.4,
      roughness: 0.4,
      detail: 0.002,
      bone: 'spell',
    });

    // ------------------------------------------------------------------ animation
    const { wave, bump, keys, legDrop } = motion;
    const HIDE = { scale: [1, 1, 1] as V3 };
    const ARM = (s: 'L' | 'R') => ({ root: s === 'L' ? SHOULDER : mx(SHOULDER), mid: s === 'L' ? ELBOW : mx(ELBOW), end: s === 'L' ? WRIST : mx(WRIST) });

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [1.5 * wave(p, 3), 7 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.R': { rotate: [-5 * bump(p), 0, 0] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.6), 0, 3 * bump(p, 1, 0.5)] },
        'forearm.L': { rotate: [-5 * bump(p, 1, 0.5), 0, 0] },
        spell: HIDE,
      }),
    });

    // The villager's stride (motion.gait legs), with both arms swinging.
    const stride = (duration: number, step: number, lift: number, duty: number, hop: number, armSwing: number, lean: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift,
          duty,
          bob: hop,
          roll: 10,
          heel: [0.092, 0, -0.022],
          toe: [0.112, 0, 0.078],
          hips: { at: HIPS_P, rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -10 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          'upperarm.R': { rotate: [-armSwing * s, 0, -6] as const },
          'forearm.R': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, s), 0, 0] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 6] as const },
          'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
          spell: HIDE,
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.6, 0.006, 22, 3));
    k.animation('run', stride(0.58, 0.14, 0.04, 0.42, 0.025, 36, 9));

    // Attack: the leaf spell. Gather (0 to 0.3): both hands come together in front of the chest and the
    // whirl of leaves grows between them, spinning. Push (0.3 to 0.5): she leans in and pushes both
    // palms out; the whirl flies forward and grows. It fades out ahead (0.5 to 0.7), and she settles.
    k.animation('attack', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const gather = ease(0.02, 0.28, p) * (1 - ease(0.7, 0.95, p));
        const push = ease(0.3, 0.46, p) * (1 - ease(0.62, 0.9, p));
        const hand = (s: 1 | -1): V3 => [s * (0.09 - 0.03 * push), 0.31 + 0.02 * push, 0.12 + 0.08 * push];
        const target = (s: 1 | -1) => lerp(s === 1 ? WRIST : mx(WRIST), hand(s), gather);
        const armL = motion.reach(ARM('L'), target(1), [0.45, 0.2, -0.15]);
        const armR = motion.reach(ARM('R'), target(-1), [-0.45, 0.2, -0.15]);
        const grow = ease(0.04, 0.3, p);
        const fly = ease(0.32, 0.6, p);
        const fade = ease(0.56, 0.7, p);
        const size = p < 0.72 ? (1 / SPELL_REST) * (0.8 * grow + 0.7 * fly) * (1 - 0.97 * fade) : 1;
        const out = p < 0.72 ? 0.22 * grow + 0.5 * fly : 0;
        return {
          hips: { move: [0, -0.004 * push, -0.01 * push] },
          spine: { rotate: [4 * push, 0, 0] },
          chest: { rotate: [3 * push - 2 * gather, 0, 0] },
          head: { rotate: [-4 * gather + 3 * push, 0, 0] },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'hand.L': { rotate: [-60 * push, 0, -30 * gather] },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: [-60 * push, 0, 30 * gather] },
          spell: { move: [0, -0.03 * grow, out], rotate: [0, 0, 720 * p], scale: [size, size, size] },
        };
      },
    });

    // Hit: a blow from the front. The chest and the head snap back, the right foot steps back, the
    // arms fling out, and she comes back quickly.
    const LEG = KNEE[1] - ANKLE[1] + (HIP[1] - KNEE[1]);
    k.animation('hit', {
      duration: 0.45,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.14, 1], [0.32, 0.8], [0.72, 0.1], [1, 0]] as const);
        return {
          hips: { move: [0, -legDrop(LEG, 12 * h), -0.03 * h], rotate: [-3 * h, 4 * h, 0] },
          spine: { rotate: [-6 * h, 0, 0] },
          chest: { rotate: [-9 * h, -4 * h, -2 * h] },
          neck: { rotate: [-3 * h, 0, 0] },
          head: { rotate: [-8 * h, 5 * h, -4 * h] },
          'upperarm.L': { rotate: [-8 * h, 0, 18 * h] },
          'forearm.L': { rotate: [-12 * h, 0, 0] },
          'upperarm.R': { rotate: [-8 * h, 0, -18 * h] },
          'forearm.R': { rotate: [-12 * h, 0, 0] },
          'leg.L': { rotate: [-9 * h, 0, 0] },
          'leg.R': { rotate: [14 * h, 0, 0] },
          'foot.L': { rotate: [9 * h, 0, 0] },
          'foot.R': { rotate: [-8 * h, 0, 0] },
          spell: HIDE,
        };
      },
    });

    // Death: she reels back from the blow, sways, and topples onto her left side, pivoting on her
    // left foot (the druid's fall). The hood is wide, so the body lifts a little as she lands and the
    // neck and the head bend up, so the hood props her head; the arms fall loose.
    const FOOT_PIVOT: V3 = [ANKLE[0] + 0.02, 0, 0];
    const LIFT: V3 = [-0.02, 0.09, 0.02];
    const rotZ = (v: V3, deg: number): V3 => {
      const a = (deg * Math.PI) / 180;
      return [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a), v[2]];
    };
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const st = keys(p, [[0, 0], [0.1, 1], [0.24, 0.75], [0.42, 0]] as const);
        const tt = clamp01((p - 0.24) / 0.44);
        const f = tt * tt; // the fall speeds up until she hits the ground
        const land = bump(clamp01((p - 0.68) / 0.14));
        const lift = ease(0.42, 0.68, p);
        const rel: V3 = [HIPS_AT[0] - FOOT_PIVOT[0], HIPS_AT[1] - FOOT_PIVOT[1], 0];
        const r = rotZ(rel, -88 * f);
        const hb = ease(0.5, 0.72, p);
        return {
          hips: {
            move: [r[0] - rel[0] + LIFT[0] * lift, r[1] - rel[1] + LIFT[1] * lift + 0.012 * land, -0.03 * st + LIFT[2] * lift],
            rotate: [-4 * st, 0, -88 * f],
          },
          spine: { rotate: [-5 * st, 0, 0] },
          chest: { rotate: [-8 * st, -3 * st, 0] },
          neck: { rotate: [-3 * st, 0, 16 * hb] },
          head: { rotate: [-9 * st + 6 * hb, 4 * hb, 26 * hb + 4 * land] },
          'upperarm.L': { rotate: [-6 * st - 20 * f, 0, 14 * st - 10 * f] },
          'forearm.L': { rotate: [-20 * f, 0, 0] },
          'upperarm.R': { rotate: [4 * st - 12 * f, 0, -12 * st + 12 * f] },
          'forearm.R': { rotate: [10 * f, 0, 0] },
          'leg.L': { rotate: [-6 * st - 15 * f, 0, 0] },
          'leg.R': { rotate: [14 * st * (1 - f) - 30 * f, 0, 0] },
          'foot.L': { rotate: [6 * st + 15 * f, 0, 0] },
          'foot.R': { rotate: [-8 * st + 12 * f, 0, 0] },
          spell: HIDE,
        };
      },
    });
  },
});
