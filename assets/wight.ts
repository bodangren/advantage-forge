import { defineAsset, mixRgb, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Wight — Chibi Quest dungeon enemy (undead noble), about 1.0 m to the crown points, faces +Z.
 * Built on the vampire base (assets/vampire.ts, itself the rogue rig): same skeleton, knee bones,
 * face layout, and clip set; the swirl clips now swing a rusted long sword held in hand.R.
 * Target: docs/enemy-mockups/wight_001.jpg (one front view; side and back are designed here).
 *
 * Role: an enemy seen in 3D and as a 128 px sprite; the white hair, the crown points, and the
 *   pale violet eyes under the heavy brows must read.
 * One idea: a gaunt grey-green child-king under a huge rusted iron crown with long white hair;
 *   the crown points and the long pointed ears are the silhouette.
 * Shape language: triangles for menace (crown points, ears, torn hem, sword), round for the head.
 * Palette: skin #a9b8a6 (shade #7d8c7b); eyes #8a86c8; hair #efece4; robe #3f4045 (#2a2b2f);
 *   iron #5a4a3a with rust #8a5a35 and iron #4a4f55; sword edge #6a6a72.
 * Value plan: the white hair and pale face against the dark robe; rust iron is the mid value.
 * Rig: the rogue's chibi skeleton with a `cloak` bone for the torn back drape. Clips idle, walk,
 *   run, attack (a rising slash), attack2 (a spin), hit, death, victory.
 */

const C = {
  skin: '#a9b8a6',
  skinShade: '#7d8c7b',
  nail: '#e6d8c8',
  eyeRim: '#0a0910',
  iris: '#2c3560',
  irisLow: '#4a5896',
  sclera: '#dcdde6',
  leather: '#6a4a2a',
  leatherDark: '#45301c',
  leatherRust: '#a25e2c',
  pupil: '#0c0a12',
  lid: '#15131c',
  mouth: '#4a4048',
  hair: '#efece4',
  hairShade: '#cfcabb',
  robe: '#3f4045',
  robeShade: '#2a2b2f',
  ironBase: '#5a4a3a',
  rust: '#8a5a35',
  iron: '#4a4f55',
  edge: '#6a6a72',
};

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const; // x (each side), y
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);
// A half space from an unnormalized normal: solid where dot(n, p) <= d.
const plane = (n: readonly [number, number, number], d: number) => sdf.halfSpace([n[0], n[1], n[2]], d / Math.hypot(n[0], n[1], n[2]));
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export default defineAsset({
  name: 'wight',
  description: 'Chibi undead noble: grey-green skin, big pale violet eyes under heavy brows, long pointed ears, long white hair, a rusted iron crown, rusted armor over a torn grey burial robe, and a rusted long sword.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/wight_001.jpg',
  variants: {
    skin: { sage: C.skin, bone: '#cfcdbd', slate: '#8f9aa6' },
    eyes: { navy: C.iris, ice: '#2f6a86', ember: '#7a4628' },
    hair: { white: C.hair, ash: '#b9b6b0', slate: '#8c94a3' },
    cloth: { grey: C.robe, slate: '#36445a', moss: '#38463a' },
  },
  presets: {
    barrow: { skin: 'sage', eyes: 'navy', hair: 'white', cloth: 'grey' },
    frost: { skin: 'slate', eyes: 'ice', hair: 'ash', cloth: 'slate' },
    bone: { skin: 'bone', eyes: 'ember', hair: 'slate', cloth: 'moss' },
  },

  build(k) {
    const T = {
      skin: k.tint('skin'),
      skinShade: k.tint('skin', { color: C.skinShade, follow: 1 }),
      nail: k.tint('skin', { color: C.nail, follow: 0.15 }),
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      hairShade: k.tint('hair', { color: C.hairShade, follow: 1 }),
      robe: k.tint('cloth'),
      robeShade: k.tint('cloth', { color: C.robeShade, follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    const SHOULDER = [0.13, 0.385, 0] as const;
    const ELBOW = [0.18, 0.332, 0.012] as const;
    const WRIST = [0.205, 0.238, 0.03] as const;
    const HIP = [0.068, 0.195, 0] as const;
    const ANKLE = [0.098, 0.07, 0] as const;
    const KNEE = [0.083, 0.1325, 0] as const; // the knee: splits the leg (shin.L takes the weight below it)
    const HAND = [0.232, 0.172, 0.022] as const; // the hand's end, for the arm solver
    const mx = (p: readonly [number, number, number]) => [-p[0], p[1], p[2]] as const;
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      cloak: { parent: 'chest', at: [0, 0.41, -0.13] },
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

    // ------------------------------------------------------------------ head and face
    const head = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
        pair(sdf.sphere(0.088).at(0.092, 0.578, 0.07)), // gaunt cheeks
        sdf.ellipsoid([0.095, 0.05, 0.08]).at(0, 0.535, 0.055), // narrow chin
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.ellipsoid([0.02, 0.017, 0.016]).at(0, 0.568, faceZ(0, 0.568) - 0.005).bone('head');
    // Heavy brow ridges: two rounded boxes lowered toward the nose in a V.
    const browRidge = pair(
      sdf
        .box([0.11, 0.03, 0.055], 0.013)
        .rotateZ(24)
        .at(0.09, 0.717, faceZ(0.09, 0.717) - 0.002)
        .bone('head'),
    );
    // Long pointed ears: flat cones angled out, up, and back.
    const earPose = (s: sdf.Shape) => s.rotateY(24).at(0.19, 0.592, -0.012);
    const earShape = sdf.cone([-0.02, 0, 0], [0.125, 0.07, 0], 0.041, 0.005).scale([1, 1, 0.4]);
    const ears = pair(earPose(earShape).bone('head'));
    const earInner = pair(earPose(sdf.ellipsoid([0.05, 0.03, 0.04]).at(0.055, 0.022, 0.02)));
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.046).bone('neck');

    // Arms: thin grey arms inside the sleeves; the left hand hangs open with pale nails.
    const arm = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW, 0.036, 0.032).bone('upperarm.L'),
      sdf.cone(ELBOW, WRIST, 0.032, 0.028).bone('forearm.L'),
    );
    const fingerZ = [0.016, 0.0295, 0.043, 0.0565];
    const fingerLen = [0.036, 0.044, 0.042, 0.034];
    const fingers = fingerZ.map((z, i) => sdf.capsule([0.212, 0.186, z], [0.205, 0.186 - fingerLen[i]!, z + 0.007], 0.0088));
    const nails = sdf.union(...fingerZ.map((z, i) => sdf.sphere(0.0105).at(0.205, 0.186 - fingerLen[i]! + 0.002, z + 0.008)));
    const handL = sdf
      .smoothUnion(
        0.008,
        sdf.ellipsoid([0.026, 0.036, 0.036]).at(0.213, 0.203, 0.035),
        ...fingers,
        sdf.cone([0.2, 0.212, 0.06], [0.192, 0.186, 0.075], 0.013, 0.009),
      )
      .bone('hand.L');
    // The right hand is a fist around the sword grip (the grip runs along Z at x -0.2, y 0.197).
    const GRIP = [-0.2, 0.197] as const;
    const fistFingers = fingerZ.map((z) =>
      sdf.chain(
        [
          [-0.222, 0.208, z + 0.004, 0.0092],
          [GRIP[0], 0.222, z + 0.004, 0.0092],
          [-0.177, 0.2, z + 0.004, 0.0092],
          [-0.196, 0.176, z + 0.004, 0.0088],
        ],
        0.004,
      ),
    );
    const fistNails = sdf.union(...fingerZ.map((z) => sdf.sphere(0.0105).at(-0.196, 0.174, z + 0.005)));
    const fist = sdf
      .smoothUnion(
        0.008,
        sdf.ellipsoid([0.026, 0.034, 0.036]).at(-0.216, 0.203, 0.035),
        ...fistFingers,
        sdf.cone([-0.21, 0.212, 0.064], [-0.19, 0.205, 0.056], 0.014, 0.01),
      )
      .bone('hand.R');

    // Face paint: stencils cross the face along Z, so they always meet the curved surface.
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeRim = pair(at(sdf.ellipsoid([0.07, 0.076, 0.07]), EYE[0], EYE[1]));
    const sclera = pair(at(sdf.ellipsoid([0.064, 0.07, 0.07]), EYE[0], EYE[1]));
    const iris = pair(at(sdf.ellipsoid([0.055, 0.061, 0.07]), EYE[0] - 0.002, EYE[1] - 0.003));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.028));
    const pupil = pair(at(sdf.ellipsoid([0.021, 0.026, 0.07]), EYE[0] - 0.002, EYE[1] - 0.003));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.0155), x + 0.02, EYE[1] + 0.026),
        at(sdf.sphere(0.0075), x - 0.02, EYE[1] - 0.03),
      ]),
    );
    const hollows = pair(at(sdf.ellipsoid([0.062, 0.03, 0.07]), 0.108, 0.575));
    const MOUTH_Y = 0.518;
    const mouth = sdf
      .extrude(
        profile.polygon(
          [
            [-0.032, -0.004],
            [-0.012, 0.0035],
            [0.012, 0.0035],
            [0.032, -0.004],
            [0.012, -0.001],
            [-0.012, -0.001],
          ],
          { smooth: true },
        ),
        0.3,
      )
      .at(0, MOUTH_Y, 0.1);

    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .smoothUnion(0.014, browRidge)
      .smoothUnion(0.02, pair(arm), handL, fist)
      .paintWhere(hollows, T.skinShade, 0.03)
      .paintWhere(earInner, '#8c7a76', 0.01)
      .paintWhere(nails, T.nail)
      .paintWhere(fistNails, T.nail)
      .paintWhere(eyeRim, C.eyeRim)
      .paintWhere(sclera, C.sclera)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.014)
      .paintWhere(pupil, C.pupil)
      .paintWhere(shine, '#ffffff')
      .paintWhere(mouth, C.mouth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ hair: a thin cap and long flat strands
    const cap = sdf
      .smoothUnion(
        0.03,
        sdf.ellipsoid([HEAD[0] + 0.012, HEAD[1] + 0.012, HEAD[2] + 0.012]).at(0, HEAD_Y + 0.002, -0.006),
        sdf.ellipsoid([0.13, 0.024, 0.12]).at(0, 0.872, -0.018), // fills the crown: a dome above the band
      )
      .displace(0.003, (x, y, z) => Math.sin(Math.atan2(x, z + 0.02) * 26))
      .subtract(sdf.box([0.012, 0.06, 0.6], 0.004)  .at(0, 0.905, -0.1)); // the center parting groove
    const capCut = cap
      .smoothIntersect(0.01, plane([0, -0.6, 1], 0.03 - 0.6 * 0.8)) // no hair over the forehead
      .smoothIntersect(0.01, plane([0, -1, 0.35], -0.6)); // the lower edge: above the ears, down to the nape
    // Seven wavy shoulder-length locks close to the skull, all ending at the shoulder line (y 0.40).
    const lockAngles = [114, 138, 160, 180, 200, 222, 246];
    const lockRho = (y: number) => (y > 0.6 ? 0.205 : y > 0.5 ? 0.203 - (0.6 - y) * 0.1 : 0.193 + (0.5 - y) * 0.12);
    const lockYs = [0.74, 0.66, 0.58, 0.5, 0.45, 0.4];
    const locks = sdf.union(
      ...lockAngles.map((a, i) => {
        const pts = lockYs.map((y, j) => {
          const th = ((180 + (a - 180) * (1 + 0.05 * j) + 9 * Math.sin(j * 1.5 + i * 1.7)) * Math.PI) / 180;
          const rho = lockRho(y) + 0.006 * Math.sin(j * 1.2 + i);
          const r = [0.03, 0.026, 0.021, 0.017, 0.014, 0.008][j]!;
          return [rho * Math.sin(th), y, 0.85 * rho * Math.cos(th) - 0.01, r] as [number, number, number, number];
        });
        return sdf.chain(pts, 0.02);
      }),
    );
    // Three flat locks on each side frame the face, in front of the ears, down past the jaw.
    const framing = pair(
      sdf.union(
        ...[0.035, 0.07, 0.105].map((zz, i) =>
          sdf
            .chain(
              [
                [0.2 + i * 0.001, 0.74, zz / 2, 0.02],
                [0.222 + (i === 1 ? 0.006 : 0), 0.6, zz / 2 + 0.004, 0.015],
                [0.232, 0.5, zz / 2, 0.012],
                [0.236 - i * 0.002, [0.42, 0.44, 0.42][i]!, zz / 2 - 0.002, 0.005],
              ],
              0.02,
            )
            .scale([1, 1, 2]),
        ),
      ),
    );
    const hairShape = sdf
      .smoothUnion(0.012, capCut, locks, framing)
      .paintFn((x, y, z, base) => (Math.sin((Math.atan2(x, z) + y * 0.9) * 70) > 0.55 ? rgb(T.hairShade) : base));
    k.body('hair', hairShape.bone('head'), {
      color: T.hair,
      roughness: 0.55,
      detail: 0.007,
      bump: (x, y, z) => 0.0014 * noise.fbm(x * 110, y * 9, z * 110, 2),
    });

    // ------------------------------------------------------------------ the iron: shared rust paint
    const rust = (s: sdf.Shape, amount = 0.6, cut = 0.18) =>
      s.paintFn((x, y, z, base) => {
        const n = noise.fbm(x * 26, y * 26, z * 26, 3);
        const patch = clamp01((n - cut) * 3);
        const dark = clamp01((-n - 0.1) * 3);
        return mixRgb(mixRgb(base, rgb(C.rust), patch * amount), rgb(C.iron), dark * 0.85);
      });
    const ironBump = (x: number, y: number, z: number) => 0.0009 * noise.fbm(x * 55, y * 55, z * 55, 2);
    const ironOpts = { color: C.ironBase, roughness: 0.8, metalness: 0.5, bump: ironBump };

    // ------------------------------------------------------------------ crown: a band that hugs the head, a front peak, side points
    const band = sdf
      .ellipsoid([HEAD[0] + 0.034, HEAD[1] + 0.034, HEAD[2] + 0.034])
      .at(0, HEAD_Y, 0)
      .subtract(sdf.ellipsoid([HEAD[0] + 0.004, HEAD[1] + 0.004, HEAD[2] + 0.004]).at(0, HEAD_Y, 0))
      .intersect(sdf.box([0.7, 0.056, 0.7]).rotateX(6).at(0, 0.8, 0));
    const peak = sdf
      .extrude(
        profile.polygon(
          [
            [-0.12, 0],
            [0.12, 0],
            [0.115, 0.05],
            [0.07, 0.09],
            [0.04, 0.13],
            [0, 0.2],
            [-0.04, 0.13],
            [-0.07, 0.09],
            [-0.115, 0.05],
          ],
          { smooth: false },
        ),
        0.028,
        0.005,
      )
      .rotateX(-14)
      .at(0, 0.775, 0.168);
    const diamond = sdf
      .extrude(profile.polygon([[0, 0.043], [0.036, 0], [0, -0.043], [-0.036, 0]], { smooth: false }), 0.026, 0.004)
      .rotateX(-16)
      .at(0, 0.865, 0.16);
    const diamondCore = sdf
      .extrude(profile.polygon([[0, 0.021], [0.017, 0], [0, -0.021], [-0.017, 0]], { smooth: false }), 0.06)
      .rotateX(-16)
      .at(0, 0.865, 0.16);
    const point = (angle: number, h: number, w: number, lean: number) =>
      sdf
        .extrude(
          profile.polygon(
            [
              [-w, 0],
              [w, 0],
              [0, h],
            ],
            { smooth: false },
          ),
          0.017,
          0.003,
        )
        .rotateX(lean)
        .at(0, 0.79, 0.207)
        .rotateY(angle);
    const points = pair(sdf.union(point(54, 0.17, 0.03, 8), point(122, 0.13, 0.028, 4)));
    const crown = sdf.smoothUnion(0.006, band, peak, diamond, points).paintWhere(diamondCore, C.iron, 0.004);
    k.body('crown', rust(crown.bone('head'), 0.9, 0.32), { ...ironOpts, color: '#3f3a34', detail: 0.006 });

    // ------------------------------------------------------------------ robe: torso, skirt with a torn hem, hood collar, mantle, sleeves
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.125, 0.4],
            [0.13, 0.34],
            [0.124, 0.29],
            [0.13, 0.25],
            [0.136, 0.215],
            [0.128, 0.198],
            [0, 0.198],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    const torsoZ = (x: number, y: number) => sdf.raycast(torso, [x, y, 1], [0, 0, -1])![2];
    const HEM = 0.14;
    const skirtWall = sdf
      .revolve(
        profile.polygon(
          [
            [0.12, 0.24],
            [0.146, 0.24],
            [0.168, 0.2],
            [0.19, HEM - 0.004],
            [0.176, HEM - 0.004],
            [0.157, 0.2],
            [0.132, 0.228],
          ],
          { smooth: false },
        ),
      )
      .scale([1, 1, 0.84]);
    const notch = (angle: number, size: number) => sdf.box([size, size, 0.6], 0.003).rotateZ(45).at(0, HEM - 0.004, 0).rotateY(angle);
    const skirt = skirtWall.subtract(
      ...[0, 34, 70, 108, 146].map((a, i) => notch(a + 6, [0.05, 0.062, 0.046, 0.058, 0.05][i]!)),
      ...[17, 52, 90, 127].map((a, i) => notch(a + 6, [0.03, 0.036, 0.03, 0.034][i]!)),
    );
    const hood = sdf
      .torus(0.098, 0.034)
      .scale([1, 0.85, 0.95])
      .displace(0.004, (x, _y, z) => Math.sin(Math.atan2(z, x) * 9))
      .at(0, 0.458, -0.006);
    // The capelet: open in front so the breastplate shows.
    const mantleSolid = sdf
      .revolve(
        profile.polygon(
          [
            [0.07, 0.482],
            [0.13, 0.458],
            [0.19, 0.412],
            [0.228, 0.35],
            [0.245, 0.292],
            [0.226, 0.288],
            [0.21, 0.343],
            [0.175, 0.4],
            [0.12, 0.44],
            [0.064, 0.462],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.82]);
    const frontGap = sdf
      .extrude(
        profile.polygon([
          [-0.075, 0.5],
          [0.075, 0.5],
          [0.16, 0.25],
          [-0.16, 0.25],
        ]),
        0.4,
      )
      .at(0, 0, 0.22);
    const mantle = mantleSolid.smoothSubtract(0.01, frontGap);
    const capZone = sdf.ellipsoid([0.1, 0.13, 0.085]).at(0.26, 0.33, 0);
    const bandZone = sdf.ellipsoid([0.135, 0.165, 0.13]).at(0.26, 0.33, 0);
    const mantleSkin = sdf.union(
      mantle,
      pair(mantle.intersect(bandZone).bone('upperarm.L')),
      mantle.subtract(hard(capZone)).bone('chest'),
    );
    const sleeves = pair(
      sdf.smoothUnion(
        0.012,
        sdf.cone([0.11, 0.405, 0], [0.18, 0.34, 0.012], 0.044, 0.041).bone('upperarm.L'),
        sdf.cone([0.18, 0.345, 0.012], [0.203, 0.245, 0.028], 0.04, 0.037).bone('forearm.L'),
      ),
    );
    const robeCloth = (s: sdf.Shape) =>
      s.paintFn((x, y, z, base) => (noise.fbm(x * 14, y * 9, z * 14, 3) > 0.12 - Math.max(0, 0.16 - y) * 3 ? rgb(T.robeShade) : base));
    const robe = sdf.union(torso.bone('spine'), skirt.bone('hips'), hood.bone('chest'), mantleSkin, sleeves);
    k.body('robe', robeCloth(robe), { color: T.robe, roughness: 0.9, detail: 0.006 });

    // ------------------------------------------------------------------ torn back drape (bone: cloak)
    const folds = (x: number, y: number, z: number) => Math.sin(Math.atan2(z, x) * 7) * Math.min(1, Math.max(0, (0.4 - y) / 0.3));
    const capeCone = (r0: number, r1: number, y0: number, y1: number) =>
      sdf
        .revolve(
          profile.polygon([
            [0, y0],
            [r0, y0],
            [r1, y1],
            [0, y1],
          ]),
        )
        .scale([1, 1, 0.85])
        .displace(0.012, folds)
        .at(0, 0, -0.03);
    const capeHem = 0.13;
    const cape = capeCone(0.182, 0.27, 0.43, capeHem)
      .subtract(capeCone(0.166, 0.254, 0.45, capeHem - 0.02))
      .intersect(plane([0, 0.1, 1], -0.035 + 0.1 * 0.43))
      .subtract(
        ...[100, 128, 156, 184, 212, 240].map((a, i) =>
          sdf.box([0.05, 0.05, 0.7], 0.003).rotateZ(45).at(0, capeHem + 0.004 + (i % 2) * 0.012, 0).rotateY(a),
        ),
      );
    k.body('cape', robeCloth(cape.bone('cloak')), { color: T.robe, roughness: 0.9, detail: 0.006 });

    // ------------------------------------------------------------------ armor: breastplate, shoulder plate, belt, tasset, bracers
    const lame = (y: number, h: number, w: number, grow: number) => torso.round(grow).intersect(sdf.box([w, h, 0.5], 0.01).at(0, y, 0.25));
    const breast = sdf.smoothUnion(
      0.006,
      lame(0.397, 0.075, 0.2, 0.011),
      lame(0.338, 0.062, 0.19, 0.013),
      lame(0.285, 0.055, 0.17, 0.015),
      sdf.capsule([0, 0.31, torsoZ(0, 0.31) + 0.012], [0, 0.43, torsoZ(0, 0.43) + 0.008], 0.013),
    );
    const rivets = pair(sdf.union(...[0.395].map((y) => sdf.sphere(0.0105).at(0.062, y, torsoZ(0.062, y) + 0.011))));
    const belt = torso.round(0.017).intersect(sdf.box([0.5, 0.042, 0.5]).at(0, 0.238, 0));
    const buckle = sdf.box([0.056, 0.05, 0.02], 0.007).at(0, 0.238, torsoZ(0, 0.238) + 0.022);
    const buckleHole = sdf.box([0.026, 0.024, 0.2], 0.004).at(0, 0.238, torsoZ(0, 0.238) + 0.03);
    const tasset = skirtWall.round(0.008).intersect(sdf.box([0.08, 0.1, 0.5], 0.012).at(0, 0.185, 0.25));
    const domeShell = sdf
      .ellipsoid([0.082, 0.05, 0.076])
      .at(0.19, 0.392, 0)
      .subtract(sdf.ellipsoid([0.068, 0.038, 0.062]).at(0.19, 0.386, 0))
      .intersect(sdf.halfSpace([0, -1, 0], -0.345));
    const domeRib = sdf
      .ellipsoid([0.09, 0.054, 0.082])
      .at(0.196, 0.375, 0)
      .subtract(sdf.ellipsoid([0.075, 0.04, 0.067]).at(0.196, 0.37, 0))
      .intersect(sdf.box([0.3, 0.03, 0.3]).at(0.2, 0.365, 0));
    const shoulderPlate = sdf
      .smoothUnion(0.006, domeShell, domeRib, sdf.sphere(0.011).at(0.18, 0.438, 0.02), sdf.sphere(0.011).at(0.18, 0.438, -0.02))
      ;
    const bracerAxis = (t: number) =>
      [ELBOW[0] + (WRIST[0] - ELBOW[0]) * t, ELBOW[1] + (WRIST[1] - ELBOW[1]) * t, ELBOW[2] + (WRIST[2] - ELBOW[2]) * t] as const;
    const bracer = sdf
      .smoothUnion(
        0.004,
        ...[0.4, 0.62, 0.84].map((t) => sdf.cone(bracerAxis(t), bracerAxis(t + 0.18), 0.053 - t * 0.005, 0.052 - t * 0.005).round(0.004)),
      )
      .bone('forearm.L');
    // Three small buckles ride a leather chest strap across the middle lame.
    const chestStrap = torso.round(0.02).intersect(sdf.box([0.2, 0.03, 0.5], 0.006).at(0, 0.338, 0.25));
    const chestBuckles = sdf.union(
      ...[-0.07, 0, 0.07].map((x) => {
        const z = torsoZ(x, 0.338) + 0.029;
        return sdf
          .box([0.03, 0.028, 0.016], 0.005)
          .subtract(sdf.box([0.014, 0.012, 0.1], 0.003))
          .at(x, 0.338, z);
      }),
    );
    // Rust-brown leather bracers with two dark straps each.
    const strapRing = (t: number) => sdf.cone(bracerAxis(t), bracerAxis(t + 0.05), 0.058 - t * 0.005, 0.058 - t * 0.005).round(0.003);
    const bracerStraps = sdf.union(strapRing(0.5), strapRing(0.72)).bone('forearm.L');
    const leatherSpots = (s: sdf.Shape) =>
      s.paintFn((x, y, z, base) => {
        const n = noise.fbm(x * 40, y * 40, z * 40, 3);
        return n > 0.22 ? mixRgb(base, rgb(C.leatherRust), clamp01((n - 0.22) * 6) * 0.85) : base;
      });
    const leather = sdf.union(
      hard(bracer),
      hard(bracerStraps).paintWhere(sdf.box([2, 2, 2]).at(0, 0, 0), C.leatherDark),
      chestStrap.bone('spine').paintWhere(sdf.box([2, 2, 2]).at(0, 0, 0), C.leatherDark),
    );
    k.body('leather', leatherSpots(leather), {
      color: C.leather,
      roughness: 0.75,
      metalness: 0.1,
      detail: 0.005,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 70, y * 70, z * 70, 2),
    });
    const iron = sdf.union(
      chestBuckles.bone('spine'),
      breast.bone('spine'),
      rivets.bone('spine'),
      belt.bone('spine'),
      buckle.subtract(buckleHole).bone('spine'),
      tasset.bone('hips'),
      shoulderPlate.bone('upperarm.L'),
    );
    k.body('iron', rust(iron), { ...ironOpts, detail: 0.006 });

    // ------------------------------------------------------------------ the rusted long sword in hand.R, held low and forward
    const blade = sdf
      .extrude(
        profile.polygon(
          [
            [-0.03, 0],
            [0.03, 0],
            [0.031, 0.4],
            [0.0, 0.47],
            [-0.031, 0.4],
          ],
          { smooth: false },
        ),
        0.017,
        0.005,
      )
      .rotateX(90)
      .at(0, 0, 0.115);
    const sword = sdf
      .smoothUnion(
        0.004,
        blade,
        sdf.cylinder(0.0145, 0.12, 0.004).rotateX(90).at(0, 0, 0.03),
        sdf.sphere(0.021).at(0, 0, -0.03),
        sdf.box([0.115, 0.024, 0.026], 0.008).at(0, 0, 0.113),
      )
      .paintWhere(sdf.box([0.5, 0.05, 0.5]).at(0.022 + 0.25, 0, 0.35), C.edge, 0.004)
      .paintWhere(sdf.box([0.5, 0.05, 0.5]).at(-0.022 - 0.25, 0, 0.35), C.edge, 0.004)
      .rotateX(11)
      .at(GRIP[0], GRIP[1], 0);
    k.body('sword', rust(sword.bone('hand.R')), { ...ironOpts, detail: 0.004 });

    // ------------------------------------------------------------------ bare legs, shin wraps, bare feet
    const legs = pair(
      sdf.smoothUnion(
        0.012,
        sdf.cone(HIP, KNEE, 0.041, 0.033).bone('leg.L'),
        sdf.cone(KNEE, ANKLE, 0.032, 0.026).bone('shin.L'),
        sdf
          .smoothUnion(
            0.012,
            sdf.ellipsoid([0.043, 0.031, 0.064]).at(0, 0.031, 0.024),
            sdf.capsule([0, 0.075, -0.004], [0, 0.03, 0.004], 0.028),
            ...[
              [-0.028, 0.118, 0.0125],
              [-0.0135, 0.124, 0.0095],
              [0.0, 0.12, 0.009],
              [0.0135, 0.113, 0.0085],
              [0.027, 0.103, 0.008],
            ].map(([x, z, r]) => sdf.capsule([x! * 0.9, 0.02, 0.06], [x! * 1.05, 0.014, z!], r!)),
          )
          .intersect(sdf.halfSpace([0, -1, 0], 0))
          .rotateY(12)
          .at(ANKLE[0], 0, 0)
          .bone('foot.L'),
      ),
    );
    k.body('legs', legs, { color: T.skin, roughness: 0.55, detail: 0.005 });
    const wrap = pair(
      sdf
        .cone([KNEE[0], 0.15, 0], [ANKLE[0] - 0.008, 0.086, 0], 0.041, 0.036)
        .displace(0.003, (_x, y) => Math.sin(y * 230))
        .bone('shin.L'),
    );
    k.body('wraps', robeCloth(wrap), { color: T.robe, roughness: 0.9, detail: 0.007 });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach } = motion;
    const LEG = 0.19;
    const rad = Math.PI / 180;
    type V3 = readonly [number, number, number];

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 5 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        cloak: { rotate: [3 * wave(p, 1, 0.3), 0, 0] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [1.5 * wave(p, 1, 0.1), 0, -2 * bump(p)] },
        'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
        'forearm.R': { rotate: [-3 * bump(p), 0, 0] },
        'hand.L': { rotate: [-4 * bump(p, 1, 0.2), 0, 0] },
        'hand.R': { rotate: [-2 * bump(p, 1, 0.2), 0, 0] },
      }),
    });

    // The legs come from motion.gait, as on the rogue. The sword arm swings a little.
    const stride = (duration: number, step: number, lift: number, duty: number, armSwing: number, lean: number, hop: number, flow: number) => ({
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
          heel: [ANKLE[0], 0, -0.045],
          toe: [ANKLE[0], 0, 0.11],
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -11 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          cloak: { rotate: [flow + 4 * wave(p, 2, 0.15), 0, 3 * s] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 6] as const },
          'upperarm.R': { rotate: [-armSwing * 0.08 * s - armSwing * 0.5, 0, -6] as const },
          'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
          'forearm.R': { rotate: [-armSwing * 0.15, 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.6, 24, 3, 0.006, 8));
    k.animation('run', stride(0.56, 0.15, 0.045, 0.4, 44, 12, 0.03, 26));

    // ------------------------------------------------------------------ attack: a rising slash
    // He coils to his right with the sword drawn back and low, then unwinds with a step of the left
    // foot and swings the blade up and across; the left arm swings out to balance; then all returns.
    k.animation('attack', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const coil = keys(p, [[0, 0], [0.28, 1], [0.36, 1], [0.5, 0]] as const);
        const strike = keys(p, [[0.3, 0], [0.5, 1], [0.7, 1], [0.94, 0]] as const);
        const swirl = keys(p, [[0, 0], [0.28, -24], [0.36, -26], [0.5, 12], [0.7, 9], [1, 0]] as const);
        const lean = keys(p, [[0, 0], [0.28, -5], [0.36, -6], [0.5, 16], [0.7, 14], [1, 0]] as const);
        const legX = keys(p, [[0, 0], [0.28, 3], [0.36, 3], [0.5, -20], [0.7, -20], [1, 0]] as const);
        const stepZ = keys(p, [[0, 0], [0.28, -0.012], [0.36, -0.014], [0.5, 0.05], [0.7, 0.05], [1, 0]] as const);
        const drop = LEG * (1 - Math.cos(legX * rad));
        const armX = keys(p, [[0, 0], [0.28, 24], [0.36, 24], [0.5, -55], [0.7, -50], [1, 0]] as const);
        const armZ = keys(p, [[0, 0], [0.28, -34], [0.36, -34], [0.5, -34], [0.7, -40], [1, 0]] as const);
        const foreR = keys(p, [[0, 0], [0.28, -26], [0.36, -26], [0.5, -34], [0.7, -30], [1, 0]] as const);
        const handR = keys(p, [[0, 0], [0.28, -22], [0.36, -22], [0.5, 16], [0.7, 12], [1, 0]] as const);
        return {
          hips: { move: [0, -drop - 0.012 * coil, stepZ], rotate: [0, swirl, 0] },
          spine: { rotate: [0.5 * lean, 0, 0] },
          chest: { rotate: [0.5 * lean, 0.6 * swirl, 0] },
          head: { rotate: [-0.5 * lean, -0.7 * swirl, 0] },
          cloak: { rotate: [10 * strike, -8 * coil, 0] },
          'upperarm.L': { rotate: [10 * coil - 34 * strike, 0, 14 * coil + 20 * strike] },
          'forearm.L': { rotate: [-12 * coil - 20 * strike, 0, 0] },
          'upperarm.R': { rotate: [armX, 0, armZ] },
          'forearm.R': { rotate: [foreR, 0, 0] },
          'hand.R': { rotate: [handR, 0, 0] },
          'leg.L': { rotate: [legX, 0, 0] },
          'leg.R': { rotate: [-legX, 0, 0] },
          'foot.L': { rotate: [-legX, 0, 0] },
          'foot.R': { rotate: [legX, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ hit: a blow from the front
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.14, 1], [0.34, 0.6], [1, 0]] as const);
        const whip = keys(p, [[0, 0], [0.2, 1], [0.4, 0.5], [0.6, -0.2], [0.82, 0]] as const, 'spline');
        const step = keys(p, [[0.04, 0], [0.24, 1], [0.58, 1], [0.9, 0]] as const);
        const lift = bump(clamp01((p - 0.04) / 0.2)) + bump(clamp01((p - 0.58) / 0.32));
        const lag = keys(p, [[0, 0], [0.12, 0.3], [0.28, 1], [0.5, -0.45], [0.74, 0.15], [1, 0]] as const, 'spline');
        const back = 0.03 * step;
        const lean = Math.asin(back / LEG) / rad; // the left foot stays planted as the hips move back
        return {
          hips: { move: [0, -legDrop(LEG, lean), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-7 * h, 0, 0] },
          chest: { rotate: [-9 * h, 6 * h, -3 * h] },
          neck: { rotate: [-3 * whip, 0, 0] },
          head: { rotate: [-7 * whip, -6 * whip, 4 * whip] },
          cloak: { rotate: [12 * lag, 0, 4 * lag] },
          'upperarm.L': { rotate: [-12 * h, 0, 16 * h] },
          'forearm.L': { rotate: [-16 * h, 0, 0] },
          'upperarm.R': { rotate: [-8 * h, 0, -14 * h] },
          'forearm.R': { rotate: [-12 * h, 0, 0] },
          'leg.L': { rotate: [-lean, 0, 0] },
          'leg.R': { rotate: [lean + 8 * lift, 0, 0] },
          'foot.L': { rotate: [lean, 0, 0] },
          'foot.R': { rotate: [-lean - 8 * lift, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: a stagger, then a fall on the back
    const norm = (a: V3): V3 => {
      const l = Math.hypot(a[0], a[1], a[2]);
      return [a[0] / l, a[1] / l, a[2] / l];
    };
    const turnX = (v: V3, deg: number): V3 => {
      const c = Math.cos(deg * rad);
      const s = Math.sin(deg * rad);
      return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
    };
    const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
    const lerp = (a: V3, b: V3, t: number): V3 => add(a, add(b, a, -1), t);
    const LIE = 78; // the hips' final tilt back, degrees
    const LIE_Y = 0.178; // the hips' height when he lies on his back
    const HEEL = 0.05; // the back of the foot, behind the ankle's ground point
    const FIST_Y = 0.03; // the hand center on the ground
    const BEND_NECK = 10;
    const BEND_HEAD = 12;
    const TURN = 22; // the head turns toward his left
    const HIPS0: V3 = [0, 0.2, 0];
    const END: V3 = [0, LIE_Y - 0.2, -HEEL - 0.2 * Math.sin(LIE * rad) + HEEL * Math.cos(LIE * rad)];
    const toWorld = (v: V3): V3 => add(add(HIPS0, END), turnX(add(v, HIPS0, -1), -LIE));
    const toBody = (w: V3): V3 => add(HIPS0, turnX(add(w, add(HIPS0, END), -1), LIE));
    const LEG_DOWN = Math.asin(clamp01((LIE_Y - 0.035) / 0.165)) / rad - (90 - LIE);
    type Weights = { hitB: number; sag: number; fly: number; land: number };
    const deathArm = (side: 1 | -1) => {
      const f = (v: V3): V3 => [v[0] * side, v[1], v[2]];
      const tag = side === 1 ? 'L' : 'R';
      const chain = { root: f(SHOULDER), mid: f(ELBOW), end: f(HAND) };
      const shoulderW = toWorld(chain.root);
      const span = Math.sqrt(Math.max(0, 0.23 ** 2 - (shoulderW[1] - FIST_Y) ** 2));
      const out = norm([0.93 * side, 0, 0.37]);
      const fistEnd = toBody([shoulderW[0] + out[0] * span, FIST_Y, shoulderW[2] + out[2] * span]);
      return (w: Weights) => {
        const stand = add(add(add(chain.end, f([0.05, 0.05, 0.05]), w.hitB), [0, -0.03, 0.02], w.sag), f([0.08, 0.06, 0.03]), w.fly);
        const arm = reach(chain, lerp(stand, fistEnd, w.land), lerp(f([0.58, 0.6, -0.015]), f([0.6, 0.45, 0.1]), w.land));
        return {
          [`upperarm.${tag}`]: { rotate: arm.upper },
          [`forearm.${tag}`]: { rotate: arm.lower },
        };
      };
    };
    const deathL = deathArm(1);
    const deathR = deathArm(-1);
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.18, 0.5], [0.3, 0.2], [0.4, 0]] as const);
        const sag = keys(p, [[0.1, 0], [0.26, 1], [0.36, 0.8], [0.5, 0]] as const);
        const wob = keys(p, [[0.12, 0], [0.22, 1], [0.32, -0.6], [0.42, 0]] as const);
        const u = clamp01((p - 0.36) / 0.24); // the fall speeds up to the impact
        const bounce = keys(p, [[0.6, 0], [0.66, 1], [0.73, 0]] as const);
        const tilt = LIE * u * u - 4 * bounce;
        const fly = keys(p, [[0.36, 0], [0.5, 1], [0.62, 0.2], [0.7, 0]] as const);
        const land = keys(p, [[0.44, 0], [0.62, 1]] as const);
        const settle = keys(p, [[0.56, 0], [0.8, 1]] as const);
        const flat = keys(p, [[0.4, 0], [0.62, 1]] as const);
        const crumple = keys(p, [[0.42, 0], [0.56, 1], [0.72, 1], [0.9, 0]] as const);
        const back = 0.022 * hitB;
        const lean = Math.asin(back / LEG) / rad;
        const a = tilt * rad;
        const hipsY = Math.max(LIE_Y, 0.2 * Math.cos(a) + HEEL * Math.sin(a));
        const hipsMove: V3 = [0, hipsY - 0.2 - legDrop(LEG, lean), -HEEL - 0.2 * Math.sin(a) + HEEL * Math.cos(a) - back];
        const legs = LEG_DOWN * clamp01((tilt - LIE + 18) / 18);
        const w = { hitB, sag, fly, land };
        return {
          hips: { move: hipsMove, rotate: [-tilt, 0, 0] },
          spine: { rotate: [-8 * hitB + 6 * sag, 0, 4 * wob] },
          chest: { rotate: [-10 * hitB + 5 * sag, 6 * hitB, 5 * wob] },
          neck: { rotate: [-6 * hitB + 5 * sag + BEND_NECK * land, 0, 0] },
          head: { rotate: [-10 * hitB + 8 * sag + BEND_HEAD * land, -8 * hitB + TURN * settle, 8 * wob] },
          cloak: {
            rotate: [10 * hitB - 8 * flat - 12 * crumple, 0, 5 * wob],
            scale: [1 + 0.12 * flat, 1 - 0.15 * crumple, 1 - 0.6 * flat],
          },
          'leg.L': { rotate: [-lean + legs, 0, 8 * land] },
          'leg.R': { rotate: [-lean + legs, 0, -8 * land] },
          'foot.L': { rotate: [lean + 10 * settle, 18 * settle, 0] },
          'foot.R': { rotate: [lean + 10 * settle, -18 * settle, 0] },
          ...deathL(w),
          ...deathR(w),
        };
      },
    });

    // ------------------------------------------------------------------ attack2: a spinning slash
    // He crouches and coils to his right, then spins one full turn to his left on the spot with a
    // small hop, both arms out wide at chest height; the torn drape lags and flares with the spin.
    const spinArm = (side: 1 | -1) => {
      const m = (v: V3): V3 => [side === 1 ? -v[0] : v[0], v[1], v[2]];
      const tag = side === 1 ? 'L' : 'R';
      const chain = { root: m(mx(SHOULDER)), mid: m(mx(ELBOW)), end: m(mx(WRIST)) };
      const rest = m([-0.58, 0.6, -0.015]);
      const coil = m([-0.62, 0.3, -0.14]);
      const wide = m([-0.55, 0.45, -0.05]);
      const out = m([-0.25, 0.355, 0.075]);
      const wristKeys: [number, V3][] = [
        [0, chain.end],
        [0.18, m([-0.21, 0.255, 0.005])],
        [0.24, m([-0.215, 0.26, 0])],
        [0.34, out],
        [0.64, out],
        [0.76, m([-0.21, 0.265, 0.025])],
        [1, chain.end],
      ];
      const poleKeys: [number, V3][] = [
        [0, rest],
        [0.18, coil],
        [0.24, coil],
        [0.34, wide],
        [0.64, wide],
        [0.76, coil],
        [1, rest],
      ];
      return (p: number) => {
        const a = reach(chain, keys(p, wristKeys), keys(p, poleKeys));
        return { [`upperarm.${tag}`]: { rotate: a.upper }, [`forearm.${tag}`]: { rotate: a.lower } };
      };
    };
    const spinR = spinArm(-1);
    const spinL = spinArm(1);
    k.animation('attack2', {
      duration: 0.85,
      loop: false,
      pose: (_t, p) => {
        const hipsY = keys(p, [[0, 0], [0.18, -20], [0.24, -20], [0.66, 360], [1, 360]] as const);
        const lead = keys(p, [[0, 0], [0.18, -22], [0.24, -22], [0.36, 22], [0.56, 16], [0.7, 0], [1, 0]] as const);
        const lean = keys(p, [[0, 0], [0.18, 12], [0.28, 7], [0.45, 3], [0.68, 9], [0.78, 9], [1, 0]] as const);
        const legZ = keys(p, [[0, 0], [0.18, 13], [0.28, 9], [0.42, 3], [0.56, 3], [0.68, 13], [0.8, 13], [1, 0]] as const);
        const hop = 0.03 * keys(p, [[0.28, 0], [0.45, 1], [0.62, 0]] as const);
        const flare = keys(p, [[0.24, 0], [0.42, 1], [0.64, 1], [0.82, 0.15], [1, 0]] as const);
        const drop = LEG * (1 - Math.cos(legZ * rad));
        return {
          hips: { move: [0, hop - drop, 0], rotate: [0, hipsY, 0] },
          spine: { rotate: [lean, 0, 0] },
          chest: { rotate: [lean / 3, lead, 0] },
          head: { rotate: [-0.6 * lean, -0.6 * lead, 0] },
          cloak: { rotate: [0.4 * lean + 34 * flare, -12 * flare, 0], scale: [1 + 0.14 * flare, 1, 1 + 0.1 * flare] },
          'leg.L': { rotate: [0, 0, legZ] },
          'leg.R': { rotate: [0, 0, -legZ] },
          'foot.L': { rotate: [0, 0, -legZ] },
          'foot.R': { rotate: [0, 0, legZ] },
          ...spinR(p),
          ...spinL(p),
        };
      },
    });

    // ------------------------------------------------------------------ victory: the sword raised out to the side
    // He lifts the sword out and up on his right, spreads the left arm, leans back, and shakes with
    // a cold laugh; he rises a few centimeters with the toes pointed down and holds the pose.
    k.animation('victory', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const c = keys(p, [[0, 0], [0.35, 1], [1, 1]] as const, 'spline');
        const rise = keys(p, [[0.15, 0], [0.55, 1], [1, 1]] as const, 'spline');
        const laugh = keys(p, [[0.35, 0], [0.45, 1], [0.9, 1], [1, 0.6]] as const);
        return {
          hips: { move: [0, 0.03 * rise, 0] },
          spine: { rotate: [-4 * c, 0, 0] },
          chest: { rotate: [-5 * c, 0, 0] },
          neck: { rotate: [-3 * c, 0, 0] },
          head: { rotate: [-9 * c + 3 * laugh * wave(p, 4), 0, 4 * laugh * wave(p, 3)] },
          cloak: { rotate: [20 * c + 3 * wave(p, 2), 0, 0], scale: [1 + 0.18 * c, 1, 1 + 0.12 * c] },
          'upperarm.L': { rotate: [-18 * c, 0, 68 * c] },
          'upperarm.R': { rotate: [-22 * c, 0, -70 * c] },
          'forearm.L': { rotate: [-28 * c, 0, 0] },
          'forearm.R': { rotate: [-24 * c, 0, 0] },
          'hand.L': { rotate: [-15 * c, 0, 0] },
          'hand.R': { rotate: [-10 * c, 0, 0] },
          'leg.L': { rotate: [-5 * rise, 0, 0] },
          'leg.R': { rotate: [8 * rise, 0, 0] },
          'foot.L': { rotate: [18 * rise, 0, 0] },
          'foot.R': { rotate: [22 * rise, 0, 0] },
        };
      },
    });
  },
});
