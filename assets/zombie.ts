import { defineAsset, motion, noise, profile, rgb, sdf, THREE } from '../src/index.js';

/**
 * Zombie — Chibi Quest enemy (catalog `enemies/undead/zombie`), about 0.98 m to the top of its
 * hair, faces +Z. Target: docs/enemy-mockups/zombie_001.jpg (made with mmx; one front view).
 * Built on the rogue's head and skeleton, so it reads as a villager who came back wrong.
 *
 * Role: a slow undead enemy, seen in 3D and as a 128 px sprite; the mismatched eyes must read.
 * One idea: a shambling villager with one huge bulging yellow eye and one glossy black eye, a
 *   toothy grimace, and thin green arms reaching out for you.
 * Proportions: the rogue's (head center 0.675, eyes 0.64, chin 0.48, shoulders 0.385, waist
 *   0.25); the hair rises to 0.98; the hands reach out to x 0.32.
 * Shape language: round, soft head and body (cute), with ragged edges and claw fingers (spooky).
 * Palette (60/30/10): grey-green skin #8fa878; a brown shirt #8a6a4a and blue trousers #3e4a6e;
 *   black hair; a yellow eye #f2c21e as the accent against the black eye.
 * Value plan: the yellow eye next to the black eye is the strongest contrast (focal point); the
 *   dark mouth with yellow teeth is the second.
 * Bodies: skin, eye-yellow, eye-black, teeth, hair, shirt, trousers, rope, sandals.
 * Rig: the rogue's skeleton plus `jaw`-free face; clips: idle (sway and head loll), walk (a
 *   shamble that drags the right foot), run (a faster lurch), attack (a lunging two-hand grab), hit (a
 *   late, floppy recoil), death (the knees give way and it crumples forward onto its face), rise
 *   (the spawn: it claws its way up out of a grave through the floor and stands).
 */

const C = {
  skin: '#768f60',
  skinDark: '#566e48',
  skinBlotch: '#6f8859', // the skin darkened by the blotch noise (linear x 0.88, 0.9, 0.86)
  line: '#1e2418',
  yellow: '#f2c21e',
  rim: '#a8601e',
  black: '#141416',
  mouth: '#2a1a1a',
  teeth: '#e8d68a',
  hair: '#1c1c1e',
  shirt: '#8a6a4a',
  shirtDark: '#6a4e34',
  patch: '#a88a62',
  trousers: '#3e4a6e',
  trousersDark: '#2c3654',
  fray: '#c2a878',
  rope: '#c8ac78',
  ropeDark: '#9a8052',
  sandal: '#6e4228',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.212, 0.2, 0.19] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Joints: the arms reach out and a little forward; the hands hang open.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW: V3 = [0.215, 0.345, 0.045];
const WRIST: V3 = [0.29, 0.285, 0.095];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)

/** An open clawing hand at the wrist `w`, fingers drooping forward and down; `s` mirrors it. */
const handAt = (w: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx * s, w[1] + dy, w[2] + dz];
  const finger = (dx: number, len: number) =>
    sdf.chain(
      [
        [...o(dx, -0.03, 0.02), 0.011],
        [...o(dx * 1.3, -0.055, 0.04 + len * 0.3), 0.0095],
        [...o(dx * 1.4, -0.075 - len * 0.2, 0.05 + len * 0.3), 0.008],
      ],
      0.004,
    );
  return sdf.smoothUnion(
    0.012,
    sdf.ellipsoid([0.034, 0.03, 0.032]).at(...o(0.004, -0.024, 0.012)),
    finger(-0.02, 0.02),
    finger(-0.006, 0.04),
    finger(0.009, 0.035),
    finger(0.022, 0.01),
    sdf.cone(o(0.03, -0.018, 0.012), o(0.046, -0.04, 0.04), 0.011, 0.008), // thumb
  );
};

export default defineAsset({
  name: 'zombie',
  description: 'Chibi zombie enemy: grey-green skin, one bulging yellow eye and one black eye, a toothy grimace, ragged clothes, and reaching arms.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/zombie_001.jpg',
  // Color slots for individual zombies (the first option is the default look). The eyes slot is
  // the bulging yellow eye only; the black eye, the pupil, the teeth, and the stitches keep theirs.
  variants: {
    eyes: { yellow: C.yellow, green: '#9ac83c', pale: '#dce6ea' },
    hair: { black: C.hair, brown: '#3e2a1c', grey: '#7c7a78' },
    skin: { green: C.skin, ashen: '#848c92', mauve: '#968a94' },
    clothing: { brown: C.shirt, blue: '#6c7e96', white: '#c8bea6' },
  },
  presets: {
    drowned: { eyes: 'pale', hair: 'black', skin: 'ashen', clothing: 'white' },
    plague: { eyes: 'green', hair: 'brown', skin: 'green', clothing: 'blue' },
    ancient: { eyes: 'yellow', hair: 'grey', skin: 'mauve', clothing: 'brown' },
  },

  build(k) {
    // The slot colors (see variants): shades of a slot follow it when a game recolors the slot.
    const T = {
      eye: k.tint('eyes'),
      // The rim stays brown: it has the yellow's tiny blue value, so a pale option made it violet.
      rim: C.rim,
      hair: k.tint('hair'),
      skin: k.tint('skin'),
      skinDark: k.tint('skin', { color: C.skinDark, follow: 1 }),
      skinBlotch: k.tint('skin', { color: C.skinBlotch, follow: 1 }),
      line: k.tint('skin', { color: C.line, follow: 1 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      shirt: k.tint('clothing'),
      patch: k.tint('clothing', { color: C.patch, follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
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
    });

    // ------------------------------------------------------------------ head, with a carved mouth
    const headSolid = sdf.smoothUnion(
      0.06,
      sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
      pair(sdf.sphere(0.1).at(0.1, 0.578, 0.07)),
      sdf.ellipsoid([0.13, 0.058, 0.09]).at(0, 0.53, 0.058),
    );
    const faceZ = (x: number, y: number) => sdf.raycast(headSolid, [x, y, 1], [0, 0, -1])![2];
    const MOUTH: V3 = [0, 0.545, faceZ(0, 0.545)];
    const mouthCut = sdf.ellipsoid([0.075, 0.03, 0.05]).at(MOUTH[0], MOUTH[1], MOUTH[2] + 0.012);
    // A small skull-like nose: a bump with two nostril holes.
    const nose = sdf.ellipsoid([0.026, 0.02, 0.018]).at(0, 0.6, faceZ(0, 0.6) - 0.004);
    const nostrils = pair(sdf.sphere(0.0075).at(0.011, 0.594, faceZ(0, 0.594) + 0.012));
    const head = sdf.smoothUnion(0.012, headSolid, nose).smoothSubtract(0.008, mouthCut).smoothSubtract(0.003, nostrils).bone('head');
    const ears = pair(
      sdf
        .ellipsoid([0.026, 0.042, 0.03])
        .subtract(sdf.sphere(0.016).at(0.016, 0, 0.007))
        .rotateY(-15)
        .at(0.205, 0.625, -0.005)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.046).bone('neck');

    // Arms: thin and green, reaching; open clawing hands.
    const arm = (s: 1 | -1) => {
      const side = s > 0 ? 'L' : 'R';
      const sh = s > 0 ? SHOULDER : mx(SHOULDER);
      const el = s > 0 ? ELBOW : mx(ELBOW);
      const wr = s > 0 ? WRIST : mx(WRIST);
      return sdf.smoothUnion(
        0.018,
        sdf.cone(sh, el, 0.036, 0.03).bone(`upperarm.${side}`),
        sdf.cone(el, wr, 0.03, 0.026).bone(`forearm.${side}`),
        handAt(wr, s).bone(`hand.${side}`),
      );
    };
    // Shins below the torn trouser hems, and bare toes over the sandals.
    const shins = pair(sdf.capsule([0.094, 0.13, 0.004], [ANKLE[0], 0.045, 0.01], 0.034).bone('leg.L'));
    const toes = pair(
      sdf
        .union(...[-0.03, -0.01, 0.01, 0.03].map((x, i) => sdf.sphere(0.017 - Math.abs(i - 1.5) * 0.002).at(x, 0.034, 0.092 - Math.abs(x) * 0.5)), sdf.ellipsoid([0.05, 0.025, 0.07]).at(0, 0.03, 0.03))
        .rotateY(12)
        .at(ANKLE[0], 0, 0)
        .bone('foot.L'),
    );

    // Face lines: a thin brow over the yellow eye, a scar slash over the black eye, a bag line.
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const lines = sdf.union(
      sdf.extrude(profile.arc(0.075, 0.007, 60, 130), 0.3).at(-0.1, 0.62, 0.1), // brow over the right (yellow) eye
      sdf.extrude(profile.rect([0.12, 0.007], 0.003), 0.3).rotateZ(14).at(0.1, 0.735, 0.1), // scar over the left (black) eye
      sdf.extrude(profile.rect([0.014, 0.006], 0.002), 0.3).rotateZ(-30).at(0.035, 0.72, 0.1),
      sdf.extrude(profile.arc(0.07, 0.006, 225, 290), 0.3).at(-0.1, 0.645, 0.1), // bag line under the yellow eye
    );
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, ears)
      .union(arm(1), arm(-1))
      .union(shins, toes)
      // Blotchy, sickly skin: a darker skin shade (made inside the function, so it is in the slot).
      .paintFn((x, y, z, base) => (noise.fbm(x * 16, y * 16, z * 16, 2) > 0.3 ? rgb(T.skinBlotch) : base))
      .paintWhere(mouthCut.round(0.004), T.mouth, 0.004)
      .paintWhere(nostrils.round(0.004), T.line, 0.003)
      .paintWhere(lines, T.line, 0.002);
    k.body('skin', skin, { color: T.skin, roughness: 0.6, textureDensity: 2 });

    // ------------------------------------------------------------------ the mismatched eyes
    const EYE_Y = 0.66;
    const EYE_X = 0.1;
    // The right eye (-X): a bulging yellow eyeball with a brown rim and a small black pupil.
    const yz = faceZ(EYE_X, EYE_Y);
    const yellowC: V3 = [-EYE_X, EYE_Y, yz - 0.022];
    const yellowEye = sdf
      .sphere(0.072)
      .at(...yellowC)
      .paintWhere(sdf.sphere(0.076).at(...yellowC).subtract(sdf.cylinder(0.056, 1).rotateX(90).at(yellowC[0], yellowC[1], 0)), T.rim, 0.004)
      .paintWhere(sdf.cylinder(0.014, 1).rotateX(90).at(yellowC[0] + 0.006, yellowC[1] - 0.004, 0), C.black, 0.002)
      .paintWhere(sdf.sphere(0.007).at(yellowC[0] + 0.022, yellowC[1] + 0.026, yellowC[2] + 0.066), '#ffffff', 0.002);
    k.body('eye-yellow', yellowEye.bone('head'), { color: T.eye, roughness: 0.2, textureDensity: 2 });
    // The left eye (+X): a glossy black eye with one big white highlight.
    const blackC: V3 = [EYE_X, EYE_Y, yz - 0.026];
    const blackEye = sdf
      .sphere(0.07)
      .at(...blackC)
      .paintWhere(sdf.sphere(0.013).at(blackC[0] + 0.006, blackC[1] + 0.008, blackC[2] + 0.07), '#ffffff', 0.003);
    k.body('eye-black', blackEye.bone('head'), { color: C.black, roughness: 0.12, textureDensity: 2 });

    // ------------------------------------------------------------------ teeth: uneven, yellow
    const teeth = sdf.union(
      ...[
        [-0.052, 1, 0.012],
        [-0.028, 1, 0.017],
        [-0.004, 1, 0.014],
        [0.02, 1, 0.018],
        [0.046, 1, 0.012],
        [-0.04, -1, 0.012],
        [-0.012, -1, 0.015],
        [0.018, -1, 0.013],
        [0.042, -1, 0.016],
      ].map(([x, side, h]) => {
        const y = MOUTH[1] + side! * 0.024;
        const z = faceZ(Math.abs(x!), y) - 0.012;
        return sdf.box([0.018, h!, 0.02], 0.004).at(x!, y - side! * h! * 0.5, z);
      }),
    );
    k.body('teeth', teeth.bone('head'), { color: C.teeth, roughness: 0.4, detail: 0.003 });

    // ------------------------------------------------------------------ hair: black spikes
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.012, HEAD[1] + 0.014, HEAD[2] + 0.012])
      .at(0, HEAD_Y + 0.01, -0.012)
      .smoothSubtract(0.012, sdf.ellipsoid([0.26, 0.15, 0.24]).at(0, 0.64, 0.12))
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.6)); // the nape shows below the hair
    // Messy locks: each starts on the cap, rises, and flops over at the tip.
    const spike = (x: number, z: number, dx: number, dz: number, len: number) => {
      const root = sdf.raycast(cap, [x, 1.2, z], [0, -1, 0])!;
      return sdf.chain(
        [
          [root[0], root[1] - 0.02, root[2], 0.034],
          [root[0] + dx * 0.5, root[1] + len * 0.7, root[2] + dz * 0.5, 0.022],
          [root[0] + dx * 1.2, root[1] + len * 0.6, root[2] + dz * 1.2, 0.007],
        ],
        0.012,
      );
    };
    const hair = sdf.smoothUnion(
      0.015,
      cap,
      spike(0.0, 0.08, 0.03, 0.06, 0.07),
      spike(-0.08, 0.06, -0.07, 0.04, 0.06),
      spike(0.09, 0.05, 0.08, 0.03, 0.06),
      spike(-0.03, -0.04, -0.02, -0.05, 0.08),
      spike(0.05, -0.06, 0.04, -0.06, 0.07),
      spike(-0.15, -0.02, -0.08, -0.01, 0.05),
      spike(0.15, -0.03, 0.08, -0.02, 0.05),
      spike(0.0, -0.13, 0.0, -0.07, 0.05),
      // Locks hanging down the back of the head.
      ...[-0.1, -0.03, 0.04, 0.11].map((x, i) =>
        sdf.chain(
          [
            [x, 0.76, -0.17 - 0.01 * (i % 2), 0.03],
            [x * 1.1, 0.67, -0.2, 0.022],
            [x * 1.15, 0.6, -0.195, 0.008],
          ],
          0.012,
        ),
      ),
      // Two locks falling over the forehead.
      sdf.cone([-0.03, 0.83, 0.15], [-0.07, 0.765, 0.19], 0.028, 0.006),
      sdf.cone([0.05, 0.83, 0.15], [0.02, 0.775, 0.19], 0.024, 0.005),
    );
    k.body('hair', hair.bone('head'), { color: T.hair, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ ragged shirt
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.122, 0.4],
            [0.124, 0.34],
            [0.118, 0.29],
            [0.124, 0.25],
            [0.13, 0.22],
            [0.126, 0.208],
            [0, 0.208],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    // Torn hem notches, a frayed V collar, and stitched patches.
    const notch = (angle: number, top: number) =>
      sdf
        .extrude(
          profile.polygon([
            [-0.02, 0.18],
            [0.02, 0.18],
            [0, top],
          ]),
          0.5,
        )
        .rotateY(angle);
    const collar = sdf
      .extrude(
        profile.polygon([
          [-0.05, 0.48],
          [0.05, 0.48],
          [0, 0.4],
        ]),
        0.3,
      )
      .at(0, 0, 0.2);
    const sleeves = sdf.union(
      sdf.cone([SHOULDER[0] * 0.85, 0.405, 0], lerp(SHOULDER, ELBOW, 0.55), 0.046, 0.044).bone('upperarm.L'),
      sdf.cone([-SHOULDER[0] * 0.85, 0.405, 0], lerp(mx(SHOULDER), mx(ELBOW), 0.55), 0.046, 0.044).bone('upperarm.R'),
    );
    const patches = sdf.union(
      sdf.extrude(profile.rect([0.05, 0.045], 0.006), 0.3).rotateZ(8).at(0.06, 0.37, 0.2),
      sdf.extrude(profile.rect([0.04, 0.036], 0.006), 0.3).rotateZ(-10).at(-0.07, 0.3, 0.2),
    );
    const stitchLines = rgb(C.shirtDark);
    const shirt = sdf
      .union(torso.bone('spine'), sleeves)
      .subtract(sdf.union(...[0, 36, 72, 108, 144].map((a, i) => notch(a + 10, 0.228 + 0.012 * ((i * 3) % 2)))))
      .smoothSubtract(0.008, collar)
      .paintWhere(patches, T.patch, 0.003)
      // Dashed stitches just inside each patch's edge.
      .paintFn((x, y, z, base) => {
        if (z < 0.05) return base;
        const d = patches.dist(x, y, 0.2);
        return Math.abs(d + 0.006) < 0.002 && Math.sin((x + y) * 420) > 0 ? stitchLines : base;
      });
    k.body('shirt', shirt, { color: T.shirt, roughness: 0.9 });
    k.body('collar-skin', torso.round(-0.004).intersect(collar).bone('spine'), { color: T.skin, roughness: 0.6 });

    // ------------------------------------------------------------------ torn trousers
    const hemNotch = (x: number, z: number) => sdf.cone([x, 0.085, z], [x, 0.125, z], 0.018, 0.002);
    const legShape = sdf.smoothUnion(0.01, sdf.capsule([HIP[0], 0.2, 0], [0.096, 0.12, 0.004], 0.052), sdf.cylinder(0.056, 0.03, 0.01).at(0.096, 0.12, 0.004));
    const legCut = sdf.union(
      sdf.box([0.3, 0.1, 0.3]).at(0.1, 0.05, 0), // everything below the hem
      hemNotch(0.07, 0.05),
      hemNotch(0.12, 0.04),
      hemNotch(0.14, -0.02),
      hemNotch(0.09, -0.05),
      hemNotch(0.05, -0.02),
    );
    const trousers = sdf
      .smoothUnion(0.03, sdf.ellipsoid([0.118, 0.055, 0.088]).at(0, 0.205, 0).bone('hips'), pair(legShape.subtract(legCut).bone('leg.L')))
      // Holes that show the green skin, and pale frayed threads at the hem.
      .paintWhere(sdf.union(sdf.sphere(0.018).at(-0.08, 0.17, 0.05), sdf.sphere(0.014).at(0.11, 0.14, 0.05)), T.skinDark, 0.004)
      .paintWhere(sdf.box([0.5, 0.012, 0.5]).at(0, 0.122, 0), C.fray, 0.004)
      .paintFn((x, y, z, base) => (noise.fbm(x * 30, y * 30, z * 30, 2) > 0.4 ? rgb(C.trousersDark) : base));
    k.body('trousers', trousers, { color: C.trousers, roughness: 0.9 });

    // ------------------------------------------------------------------ rope belt with frayed ends
    const beltY = 0.235;
    const ropeRing = torso.round(0.012).smoothIntersect(0.008, sdf.box([0.5, 0.03, 0.5], 0.01).at(0, beltY, 0));
    const knot = sdf.sphere(0.022).at(0.03, beltY, sdf.raycast(ropeRing, [0.03, beltY, 1], [0, 0, -1])![2] - 0.004);
    const ropeEnds = sdf.union(
      sdf.chain(
        [
          [0.03, beltY - 0.01, 0.12, 0.009],
          [0.04, beltY - 0.06, 0.13, 0.008],
          [0.045, beltY - 0.1, 0.125, 0.006],
        ],
        0.004,
      ),
      sdf.chain(
        [
          [0.036, beltY - 0.01, 0.118, 0.009],
          [0.058, beltY - 0.05, 0.125, 0.007],
          [0.066, beltY - 0.08, 0.12, 0.005],
        ],
        0.004,
      ),
    );
    k.body('rope', sdf.union(ropeRing, knot, ropeEnds).bone('spine'), {
      color: C.rope,
      roughness: 0.9,
      bump: (x, y, z) => 0.0012 * Math.sin((Math.atan2(z, x) * 40 + y * 300)),
    });

    // ------------------------------------------------------------------ sandals
    const sole = sdf.box([0.086, 0.016, 0.17], 0.008).at(0, 0.008, 0.03);
    const strap = sdf.torus(0.045, 0.008).scale([1, 1, 0.8]).rotateX(12).at(0, 0.03, 0.03).intersect(sdf.halfSpace([0, -1, 0], -0.018));
    const sandal = sdf.union(sole, strap).rotateY(12).at(ANKLE[0], 0, 0).bone('foot.L');
    k.body('sandals', pair(sandal), { color: C.sandal, roughness: 0.7 });

    // ------------------------------------------------------------------ animation
    const { wave, bump } = motion;

    k.animation('idle', {
      duration: 3.0,
      pose: (_t, p) => ({
        hips: { move: [0, -0.004 * bump(p), 0], rotate: [0, 0, 3 * wave(p)] },
        spine: { rotate: [4, 0, -2 * wave(p)] },
        chest: { rotate: [2 * wave(p, 1, 0.2), 0, 0] },
        // The head lolls to one side and back.
        head: { rotate: [4 + 3 * wave(p, 1, 0.3), 6 * wave(p, 1, 0.1), 10 * wave(p, 1, 0.25)] },
        'upperarm.L': { rotate: [-6 + 4 * wave(p, 1, 0.15), 0, 4 * wave(p, 1, 0.4)] },
        'upperarm.R': { rotate: [-6 + 4 * wave(p, 1, 0.35), 0, -4 * wave(p, 1, 0.1)] },
        'forearm.L': { rotate: [-6 * bump(p), 0, 0] },
        'forearm.R': { rotate: [-6 * bump(p, 1, 0.5), 0, 0] },
      }),
    });

    // A shamble on the knees: the left leg steps (motion.gait, heel strike to toe-off), the right
    // foot drags on its toe (a second gait with a short stride, almost no lift, no roll, and the
    // foot pitched `drag` degrees toe down; the ankle rises by `raise` so the toe rests on the
    // floor). The hips heave up on the side of the swing leg (the left at p = 0.06, the right at
    // 0.56) to haul it forward; both gait calls get this turn, so the planted feet do not slide.
    // Both calls share the phase, duty, sit, and bob, so their hips heights are the same.
    // Sole points measured on the sandal SDF at y = 0 (left foot).
    const SOLE_HEEL: V3 = [0.1225, 0, -0.056];
    const SOLE_TOE: V3 = [0.085, 0, 0.1145];
    const LEGS = { hip: HIP, knee: KNEE, ankle: ANKLE };
    const SHAMBLE_HIPS: V3 = [0, 0.2, 0];
    interface Shamble {
      strideL: number; liftL: number; strideR: number; liftR: number; drag: number;
      duty: number; sit: number; bob: number; lean: number; lurch: number;
    }
    const shamble = (duration: number, o: Shamble) => {
      const t = (o.drag * Math.PI) / 180;
      const low = (q: V3) => (q[1] - ANKLE[1]) * Math.cos(t) - (q[2] - ANKLE[2]) * Math.sin(t);
      const raise = -Math.min(low(SOLE_HEEL), low(SOLE_TOE)) - ANKLE[1];
      const dragHeel: V3 = [SOLE_HEEL[0], -raise, SOLE_HEEL[2]];
      const dragToe: V3 = [SOLE_TOE[0], -raise, SOLE_TOE[2]];
      return {
        duration,
        pose: (_t: number, p: number) => {
          const s = wave(p);
          const heave = wave(p, 1, 0.19); // +1 at p = 0.06 (left hip up), -1 at 0.56 (right hip up)
          const hipsTurn: V3 = [0, 8 * s, o.lurch * heave];
          const shared = { duty: o.duty, sit: o.sit, bob: o.bob, hips: { at: SHAMBLE_HIPS, rotate: hipsTurn } };
          const step = motion.gait(p - 0.25, LEGS, { ...shared, stride: o.strideL, lift: o.liftL, roll: 10, heel: SOLE_HEEL, toe: SOLE_TOE });
          const dragged = motion.gait(p - 0.25, LEGS, { ...shared, stride: o.strideR, lift: o.liftR, roll: 0, heel: dragHeel, toe: dragToe });
          const legR = dragged.pose['leg.R']!.rotate;
          const shinR = dragged.pose['shin.R']!.rotate;
          const footR = motion.orient([hipsTurn, legR, shinR], { dir: [0, 0, 1], up: [0, 1, 0] }, { dir: [0, -Math.sin(t), Math.cos(t)], up: [0, Math.cos(t), Math.sin(t)] });
          return {
            'leg.L': step.pose['leg.L']!,
            'shin.L': step.pose['shin.L']!,
            'foot.L': step.pose['foot.L']!,
            'leg.R': { rotate: legR },
            'shin.R': { rotate: shinR },
            'foot.R': { rotate: footR }, // dragged: the toe stays down on the floor
            hips: { move: [0, Math.min(step.hipsY, dragged.hipsY), 0] as const, rotate: hipsTurn },
            spine: { rotate: [o.lean, 0, -o.lurch * 0.6 * heave] as const },
            chest: { rotate: [2 * wave(p, 2, 0.1), -6 * s, 0] as const },
            head: { rotate: [-o.lean * 0.5 + 4 * wave(p, 2, 0.3), 6 * s, 8 * wave(p, 1, 0.25)] as const },
            // Both arms reach out in front, bobbing out of step with each other.
            'upperarm.L': { rotate: [-62 + 6 * wave(p, 2, 0.2), 0, -10 + 3 * s] as const },
            'upperarm.R': { rotate: [-62 + 6 * wave(p, 2, 0.45), 0, 10 + 3 * s] as const },
            'forearm.L': { rotate: [-4 * wave(p, 2, 0.3), 0, 0] as const },
            'forearm.R': { rotate: [-4 * wave(p, 2, 0.55), 0, 0] as const },
          };
        },
      };
    };
    k.animation('walk', shamble(1.3, { strideL: 0.1, liftL: 0.026, strideR: 0.05, liftR: 0.004, drag: 8, duty: 0.62, sit: 0.006, bob: 0.005, lean: 8, lurch: 6 }));
    k.animation('run', shamble(0.75, { strideL: 0.14, liftL: 0.04, strideR: 0.07, liftR: 0.006, drag: 8, duty: 0.55, sit: 0.014, bob: 0.008, lean: 16, lurch: 8 }));

    // ------------------------------------------------------------------ attack: a lunging two-hand grab
    // Wind-up: a slow, heavy sway back; the arms rise up and out at full length, the claws open
    // forward, and the head lolls back. Lunge: the left foot lurches 0.19 m forward, the hips drop,
    // and the body falls forward; both arms reach out full length at a target in front, then close
    // in. Grab: the hands clutch the target's shoulders and hold with a shake, pulling it in.
    // Recovery: a clumsy step back to rest. Solved by targets: the stiff legs (no knee) point at
    // ankle targets, and the hips take the height that the loaded feet allow, so a planted foot
    // never slides or sinks; a swinging leg that is too long for its target swings out to the side.
    // The wrists follow world targets, converted into the chest's rest frame for `reach`.
    {
      const { keys, reach, orient, quat, euler, follow } = motion;
      const HIPS_AT: V3 = [0, 0.2, 0];
      const SPINE_AT: V3 = [0, 0.26, 0];
      const CHEST_AT: V3 = [0, 0.33, 0];
      const LEG_LEN = Math.hypot(ANKLE[0] - HIP[0], ANKLE[1] - HIP[1]);
      const STEP = 0.19; // the left ankle's lunge, meters forward
      const ARM_L = { root: SHOULDER, mid: ELBOW, end: WRIST };
      const ARM_R = { root: mx(SHOULDER), mid: mx(ELBOW), end: mx(WRIST) };
      // The left hand's rest frame: the middle finger's direction from the wrist, and the back of the hand.
      const HAND_DIR: V3 = [-0.1, -0.8, 0.6];
      const HAND_UP: V3 = [0, 0.6, 0.8];
      const vec = (p: V3) => new THREE.Vector3(p[0], p[1], p[2]);
      const arr = (p: THREE.Vector3): V3 => [p.x, p.y, p.z];
      const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
      // Left-arm paths in world meters (the right arm mirrors them, a beat late).
      const wristPath = [
        [0, WRIST],
        [0.12, [0.33, 0.42, 0.02]],
        [0.3, [0.42, 0.8, -0.08]], // up and out, past full reach: the arm is straight
        [0.39, [0.36, 0.8, 0.2]],
        [0.46, [0.3, 0.62, 0.55]], // the long reach, wide and past full length: the arms are straight
        [0.52, [0.28, 0.6, 0.56]],
        [0.58, [0.12, 0.44, 0.34]], // closed in: the clutch at the target's shoulders
        [0.72, [0.12, 0.44, 0.32]],
        [0.86, [0.24, 0.31, 0.2]],
        [1, WRIST],
      ] as const;
      const polePath = [
        [0, ELBOW],
        [0.3, [0.45, 0.4, -0.12]], // the elbows out and back
        [0.46, [0.36, 0.26, 0.16]],
        [0.58, [0.4, 0.2, 0.12]],
        [0.72, [0.4, 0.2, 0.12]],
        [1, ELBOW],
      ] as const;
      const dirPath = [
        [0, HAND_DIR],
        [0.3, [0.35, 0.9, 0.05]], // claws up, palms forward
        [0.46, [-0.05, 0.25, 1]], // fingers straight out at the target
        [0.52, [-0.1, 0.2, 1]],
        [0.58, [-0.35, -0.45, 0.8]], // curled in and down: the clutch
        [0.72, [-0.35, -0.5, 0.78]],
        [0.86, [0, -0.7, 0.6]],
        [1, HAND_DIR],
      ] as const;
      const upPath = [
        [0, HAND_UP],
        [0.3, [0.1, 0.05, -1]],
        [0.46, [0.15, 1, -0.2]],
        [0.52, [0.15, 1, -0.2]],
        [0.58, [0.2, 0.85, 0.45]],
        [0.72, [0.2, 0.85, 0.45]],
        [0.86, [0, 0.65, 0.75]],
        [1, HAND_UP],
      ] as const;
      k.animation('attack', {
        duration: 1.1,
        loop: false,
        pose: (_t, p) => {
          // The hold (0.58 to 0.72, 0.15 s): a shake and two tugs that pull the target in.
          const hold = clamp01((p - 0.58) / 0.14);
          const env = Math.sin(Math.PI * hold);
          const shake = wave(hold, 2) * env;
          const tug = bump(hold, 2) * env;
          const shrug = 0.03 * keys(p, [[0, 0], [0.3, 1], [0.44, 0]] as const);

          // ---- trunk
          const hipsR: V3 = [
            keys(p, [[0, 0], [0.3, -4], [0.5, 8], [0.72, 7], [0.9, 1], [1, 0]] as const),
            keys(p, [[0, 0], [0.3, 4], [0.48, -8], [0.72, -8], [0.92, -1], [1, 0]] as const),
            // The hips roll up on the side of the swinging leg, so the foot clears the ground.
            keys(p, [[0, 0], [0.31, 0], [0.38, 5], [0.48, 0], [0.74, 0], [0.82, 5], [0.95, 0], [1, 0]] as const),
          ];
          const spineR: V3 = [keys(p, [[0, 0], [0.3, -8], [0.5, 13], [0.58, 10], [0.72, 10], [0.9, 2], [1, 0]] as const) - 3 * tug, 0, -0.7 * hipsR[2]];
          const chestR: V3 = [
            keys(p, [[0, 0], [0.3, -8], [0.5, 7], [0.72, 6], [1, 0]] as const) - 3 * tug,
            keys(p, [[0, 0], [0.3, -4], [0.48, 7], [0.72, 7], [1, 0]] as const) + 3 * shake,
            -0.4 * hipsR[2],
          ];
          const hipsZ = keys(p, [[0, 0], [0.3, -0.035], [0.48, STEP / 2], [0.72, STEP / 2], [0.95, 0], [1, 0]] as const);

          // ---- legs: the right foot stays planted; the left steps out and back
          const lift = keys(p, [[0, 0], [0.32, 0], [0.39, 0.035], [0.44, 0.028], [0.48, 0], [0.74, 0], [0.8, 0.03], [0.88, 0.024], [0.94, 0]] as const);
          const zL = keys(p, [[0, 0], [0.33, 0], [0.475, STEP], [0.74, STEP], [0.93, 0]] as const);
          const loadL = keys(p, [[0, 1], [0.31, 1], [0.35, 0], [0.47, 0], [0.49, 1], [0.72, 1], [0.76, 0], [0.93, 0], [0.96, 1]] as const);
          const hipsQ = quat(hipsR);
          const hipJoint = (s: 1 | -1) => vec([s * HIP[0], HIP[1], HIP[2]]).sub(vec(HIPS_AT)).applyQuaternion(hipsQ).add(vec(HIPS_AT)).add(vec([0, 0, hipsZ]));
          // The hips' move y at which a stiff leg from hip joint `h` just reaches the ankle target `a` ([y, z]).
          const need = (h: THREE.Vector3, s: 1 | -1, a: readonly [number, number]) => {
            const dx = s * ANKLE[0] - h.x;
            const dz = a[1] - h.z;
            return a[0] - h.y + Math.sqrt(Math.max(0, LEG_LEN ** 2 - dx * dx - dz * dz));
          };
          const aL = [ANKLE[1] + lift, zL] as const;
          const aR = [ANKLE[1], 0] as const;
          const hL = hipJoint(1);
          const hR = hipJoint(-1);
          const nR = need(hR, -1, aR);
          const hipsY = nR + loadL * Math.max(0, need(hL, 1, aL) - nR);
          hL.y += hipsY;
          hR.y += hipsY;
          // Leg and foot rotations that point the leg at its ankle target and keep the sole flat.
          const legTo = (h: THREE.Vector3, s: 1 | -1, a: readonly [number, number]) => {
            const dy = h.y - a[0];
            const dz = a[1] - h.z;
            const x = s * Math.max(ANKLE[0], s * h.x + Math.sqrt(Math.max(0, LEG_LEN ** 2 - dy * dy - dz * dz)));
            const rest = vec([s * (ANKLE[0] - HIP[0]), ANKLE[1] - HIP[1], 0]).normalize();
            const world = new THREE.Quaternion().setFromUnitVectors(rest, vec([x, a[0], a[1]]).sub(h).normalize());
            return { leg: euler(hipsQ.clone().invert().multiply(world)), foot: euler(world.clone().invert()) };
          };
          const legL = legTo(hL, 1, aL);
          const legR = legTo(hR, -1, aR);

          // ---- arms: world wrist targets in the chest's rest frame
          const hipsMove: V3 = [0, hipsY, hipsZ];
          const chestAt = vec(follow([HIPS_AT, SPINE_AT], [hipsR, spineR], CHEST_AT)).add(vec(hipsMove));
          const inv = quat(hipsR).multiply(quat(spineR)).multiply(quat(chestR)).invert();
          const toChest = (w: V3): V3 => arr(vec(w).sub(chestAt).applyQuaternion(inv).add(vec(CHEST_AT)));
          const dirToChest = (d: V3): V3 => arr(vec(d).applyQuaternion(inv));
          const lift3 = (w: V3): V3 => [w[0], w[1] - shrug, w[2]];
          const arm = (s: 1 | -1, q: number) => {
            const m = (w: V3): V3 => (s > 0 ? w : mx(w));
            const pull: V3 = [0, 0.008 * shake, -0.02 * tug];
            const w = keys(q, wristPath, 'spline');
            const wrist = toChest(m([w[0], w[1] + pull[1], w[2] + pull[2]]));
            const pole = m(keys(q, polePath));
            const ik = reach(s > 0 ? ARM_L : ARM_R, lift3(wrist), lift3(pole));
            const hand = orient(
              [ik.upper, ik.lower],
              { dir: m(HAND_DIR), up: m(HAND_UP) },
              { dir: dirToChest(m(keys(q, dirPath))), up: dirToChest(m(keys(q, upPath))) },
            );
            return { upper: ik.upper, lower: ik.lower, hand };
          };
          const L = arm(1, p);
          const R = arm(-1, p - 0.025 * Math.sin(Math.PI * p)); // the right arm lags a beat

          return {
            hips: { move: hipsMove, rotate: hipsR },
            spine: { rotate: spineR },
            chest: { rotate: chestR },
            // The head lolls back and to the side in the wind-up, looks up at the target in the lunge, and shakes in the hold.
            neck: { rotate: [keys(p, [[0, 0], [0.3, -8], [0.5, -8], [0.72, -7], [1, 0]] as const), 0, 0] },
            head: {
              rotate: [
                keys(p, [[0, 0], [0.06, 0], [0.32, -16], [0.42, -6], [0.5, -14], [0.72, -12], [0.88, 3], [1, 0]] as const) - 4 * tug,
                5 * shake,
                keys(p, [[0, 0], [0.32, 10], [0.46, -4], [0.72, -4], [1, 0]] as const),
              ],
            },
            'upperarm.L': { move: [0, shrug, 0], rotate: L.upper },
            'forearm.L': { rotate: L.lower },
            'hand.L': { rotate: L.hand },
            'upperarm.R': { move: [0, shrug, 0], rotate: R.upper },
            'forearm.R': { rotate: R.lower },
            'hand.R': { rotate: R.hand },
            'leg.L': { rotate: legL.leg },
            'foot.L': { rotate: legL.foot },
            'leg.R': { rotate: legR.leg },
            'foot.R': { rotate: legR.foot },
          };
        },
      });
    }

    // ------------------------------------------------------------------ hit: a late, floppy recoil
    // The chest rocks back first. The head follows late, lolls far back, flops forward past the
    // stance, and sways back. The arms fling up loosely a beat behind the chest and drop again.
    // The hips give way backward over planted feet (`SHIN` keeps the ankles on their rest spot).
    const { keys } = motion;
    const DEG = Math.PI / 180;
    const SHIN = 0.125; // hip joint to ankle joint
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
    /** The leg angle (degrees, + = the hips in front of the ankle) for the hips `dz` meters ahead of it. */
    const legFor = (dz: number) => Math.asin(Math.max(-1, Math.min(1, dz / SHIN))) / DEG;
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.15, 1], [0.32, 0.75], [0.6, -0.2], [0.82, 0.06], [1, 0]] as const);
        const loll = keys(p, [[0, 0], [0.07, 0], [0.3, 1], [0.48, 0.3], [0.66, -0.45], [0.85, 0.14], [1, 0]] as const);
        const flop = keys(p, [[0, 0], [0.1, 0], [0.3, 1], [0.52, -0.35], [0.72, 0.14], [0.9, -0.04], [1, 0]] as const);
        const roll = keys(p, [[0, 0], [0.12, 0], [0.34, 1], [0.58, -0.5], [0.8, 0.18], [1, 0]] as const);
        const leg = legFor(-0.022 * h);
        return {
          hips: { move: [0, -SHIN * (1 - Math.cos(leg * DEG)), -0.022 * h], rotate: [0, 4 * roll, 3 * roll] },
          spine: { rotate: [4 - 7 * h, 0, -4 * roll] },
          chest: { rotate: [-12 * h, 5 * h, 2 * roll] },
          neck: { rotate: [-10 * loll, 0, 0] },
          head: { rotate: [-24 * loll, 8 * roll, 14 * roll] },
          'upperarm.L': { rotate: [-30 * flop, 0, 16 * flop] },
          'upperarm.R': { rotate: [-24 * flop, 0, -19 * flop] },
          'forearm.L': { rotate: [-22 * flop, 0, 0] },
          'forearm.R': { rotate: [-16 * flop, 0, 0] },
          'hand.L': { rotate: [18 * flop, 0, 0] },
          'hand.R': { rotate: [14 * flop, 0, 0] },
          'leg.L': { rotate: [leg, 0, -3 * roll] },
          'leg.R': { rotate: [leg, 0, -3 * roll] },
          'foot.L': { rotate: [-leg, 0, 0] },
          'foot.R': { rotate: [-leg, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: the knees give way, a forward crumple
    // The blow lolls the head back and the zombie sways. Then the knees give way: the legs fold back
    // as the hips sink forward over the planted feet, and the trunk slumps. Then it topples forward,
    // faster and faster, onto its face; the legs lie flat behind it, soles up. The arms trail in the
    // fall, then flop onto the ground beside the head. At last the head rolls onto its cheek.
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.18, 0.45], [0.3, 0]] as const);
        const loll = keys(p, [[0, 0], [0.04, 0], [0.15, 1], [0.26, 0.25], [0.34, -0.25], [0.42, 0]] as const);
        const sway = keys(p, [[0.06, 0], [0.18, 1], [0.3, -0.6], [0.42, 0]] as const);
        const buckle = keys(p, [[0.24, 0], [0.46, 1]] as const); // the knees give way
        const u = clamp01((p - 0.42) / 0.22);
        const topple = u * u; // the fall speeds up to the impact at 0.64
        const bounce = keys(p, [[0.64, 0], [0.69, 1], [0.76, 0]] as const);
        const trail = keys(p, [[0.44, 0], [0.6, 1], [0.66, 0]] as const); // the arms lag in the fall
        const land = keys(p, [[0.6, 0], [0.7, 1]] as const); // the arms flop onto the ground
        const whip = keys(p, [[0.46, 0], [0.6, 1], [0.68, -0.4], [0.76, 0]] as const);
        const roll = keys(p, [[0.72, 0], [0.9, 1]] as const); // the head rolls onto its cheek
        // The legs fold back over the planted ankles; the hips follow the hip joint's arc.
        const leg = legFor(-0.02 * hitB) + 45 * buckle + 45 * topple;
        const ankleY = 0.07 - 0.02 * topple;
        const hipsY = ankleY + SHIN * Math.cos(leg * DEG) + 0.005 + 0.012 * bounce;
        const hipsTilt = 16 * buckle + 44 * topple - 3 * bounce;
        const trunk = hipsTilt + 4 + 8 * buckle; // hips + spine + chest, for the limp arms
        return {
          hips: { move: [0, hipsY - 0.2, SHIN * Math.sin(leg * DEG)], rotate: [hipsTilt, 6 * buckle, 4 * sway] },
          spine: { rotate: [4 - 6 * hitB + 4 * buckle, 0, -4 * sway] },
          chest: { rotate: [-10 * hitB + 4 * buckle - 6 * whip, 4 * hitB, 3 * sway] },
          neck: { rotate: [-10 * loll - 8 * topple * (1 - land) - 6 * roll, 0, 0] },
          head: {
            rotate: [-24 * loll + 10 * buckle - 20 * topple * (1 - land) + 14 * whip - 12 * roll, 10 * sway + 62 * roll, 12 * sway + 14 * roll],
          },
          // Limp arms: they hang as the trunk slumps, trail up in the fall, and slap down out wide.
          'upperarm.L': { rotate: [-24 * hitB - 0.8 * trunk * (1 - land) + 70 * trail - 6 * land, 0, 20 * hitB + 36 * land] },
          'upperarm.R': { rotate: [-20 * hitB - 0.8 * trunk * (1 - land) + 60 * trail - 10 * land, 0, -18 * hitB - 30 * land] },
          'forearm.L': { rotate: [-14 * hitB - 10 * buckle + 10 * land, 0, 12 * land] },
          'forearm.R': { rotate: [-10 * hitB - 16 * buckle + 16 * land, 0, -8 * land] },
          'hand.L': { rotate: [10 * hitB + 20 * buckle - 10 * land, 0, 0] },
          'hand.R': { rotate: [10 * hitB + 24 * buckle - 16 * land, 0, 0] },
          'leg.L': { rotate: [leg - hipsTilt, 0, 4 * buckle - 4 * sway] },
          'leg.R': { rotate: [leg - hipsTilt, -8 * buckle, -6 * buckle - 4 * sway] },
          'foot.L': { rotate: [150 * topple - leg, 0, 0] }, // flat on the ground, then soles up
          'foot.R': { rotate: [140 * topple - leg, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ rise: it claws its way up out of a grave
    // The spawn clip. In the game the floor hides everything below y = 0, so this clip keeps the
    // body under the floor (`ground: false`, `dig: 1.0`). At the start the zombie is bent forward
    // in the grave, the hips about 0.5 m down: the short chibi arms cannot reach the floor from
    // deeper. Only the left hand breaks the surface. It bursts up and claws the air; the right hand
    // follows. Both hands slam down flat on the floor beside the hole and push, and the body comes
    // up in three jerks: the head and shoulders break through, lolling; the arms lock straight; the
    // hands let go and the zombie stands, its feet on the floor. Then a shudder and a groan (the
    // head rolls back and the chest lifts), and it settles into the rest pose. The wrists follow
    // world targets, converted into the chest's rest frame for `reach`, so the planted hands stay
    // flat on the floor while the body rises past them.
    {
      const { reach, orient, quat, follow } = motion;
      const HIPS_AT: V3 = [0, 0.2, 0];
      const SPINE_AT: V3 = [0, 0.26, 0];
      const CHEST_AT: V3 = [0, 0.33, 0];
      const ARM_L = { root: SHOULDER, mid: ELBOW, end: WRIST };
      const ARM_R = { root: mx(SHOULDER), mid: mx(ELBOW), end: mx(WRIST) };
      // The left hand's rest frame: the middle finger's direction from the wrist, and the back of the hand.
      const HAND_DIR: V3 = [-0.1, -0.8, 0.6];
      const HAND_UP: V3 = [0, 0.6, 0.8];
      const FLAT_Y = 0.041; // the wrist's height when the hand lies flat on the floor
      const PLANT: V3 = [0.25, FLAT_Y, 0.1]; // where the left hand pushes on the floor
      const vec = (p: V3) => new THREE.Vector3(p[0], p[1], p[2]);
      const arr = (p: THREE.Vector3): V3 => [p.x, p.y, p.z];
      const unit = (d: V3): V3 => arr(vec(d).normalize());
      /** A weighted sum of points or directions. */
      const blend = (...parts: (readonly [V3, number])[]): V3 =>
        parts.reduce<V3>((s, [v, w]) => [s[0] + v[0] * w, s[1] + v[1] * w, s[2] + v[2] * w], [0, 0, 0]);
      k.animation('rise', {
        duration: 2.0,
        loop: false,
        ground: false,
        dig: 1.0,
        pose: (t, p) => {
          // ---- the trunk: three jerky heaves (a fast pull up, then a stall or a sag back)
          const hy = keys(p, [[0, -0.5], [0.07, -0.45], [0.2, -0.43], [0.27, -0.39], [0.31, -0.39], [0.37, -0.27], [0.41, -0.29], [0.44, -0.29], [0.5, -0.17], [0.58, -0.18], [0.61, -0.18], [0.7, 0]] as const);
          const hz = keys(p, [[0, -0.16], [0.31, -0.14], [0.37, -0.1], [0.5, -0.06], [0.61, -0.06], [0.7, 0]] as const);
          const lean = keys(p, [[0, 85], [0.27, 82], [0.31, 82], [0.37, 64], [0.44, 63], [0.5, 40], [0.61, 38], [0.7, 4], [0.76, 0]] as const);
          // The strain in the push, the shudder after the stand, and the groan.
          const strain = keys(p, [[0.47, 0], [0.52, 1], [0.58, 1], [0.62, 0]] as const) * Math.sin(2 * Math.PI * 11 * t);
          const shud = keys(p, [[0.68, 0], [0.72, 1], [0.8, 0.5], [0.88, 0]] as const) * Math.sin(2 * Math.PI * 7 * t);
          const groan = keys(p, [[0.74, 0], [0.82, 1], [0.9, 1], [1, 0]] as const);
          // The head hangs in the grave, then lolls from side to side at each heave.
          const loll = keys(p, [[0, 0], [0.31, 0], [0.37, 1], [0.44, -0.7], [0.5, 0.8], [0.58, -0.4], [0.66, 0.5], [0.74, 0]] as const);
          const nod = keys(p, [[0, 1], [0.31, 1], [0.37, -0.6], [0.44, 0.5], [0.5, -0.5], [0.58, 0.3], [0.66, -0.3], [0.74, 0]] as const);

          const hipsR: V3 = [0.5 * lean, 2 * shud, 3 * shud];
          const spineR: V3 = [0.3 * lean + 2 * strain, 0, -2 * shud];
          const chestR: V3 = [0.2 * lean - 10 * groan, 3 * strain, 4 * shud];
          const hipsMove: V3 = [0, hy, hz];

          // ---- arms: world wrist targets in the chest's rest frame
          const chestAt = vec(follow([HIPS_AT, SPINE_AT], [hipsR, spineR], CHEST_AT)).add(vec(hipsMove));
          const chestQ = quat(hipsR).multiply(quat(spineR)).multiply(quat(chestR));
          const inv = chestQ.clone().invert();
          const toChest = (w: V3): V3 => arr(vec(w).sub(chestAt).applyQuaternion(inv).add(vec(CHEST_AT)));
          const fromChest = (c: V3): V3 => arr(vec(c).sub(vec(CHEST_AT)).applyQuaternion(chestQ).add(chestAt));
          const dirToChest = (d: V3): V3 => arr(vec(unit(d)).applyQuaternion(inv));
          const arm = (s: 1 | -1) => {
            const m = (w: V3): V3 => (s > 0 ? w : mx(w));
            const shoulder = fromChest(m(SHOULDER));
            // Three modes, blended: an arm straight up out of the ground, a hand flat on the floor,
            // and a free arm in the chest's frame (buried, then after the stand).
            const up = s > 0 ? keys(p, [[0, 1], [0.22, 1], [0.29, 0]] as const) : keys(p, [[0.09, 0], [0.16, 1], [0.23, 1], [0.3, 0]] as const);
            const flat = s > 0 ? keys(p, [[0.22, 0], [0.29, 1], [0.57, 1], [0.63, 0]] as const) : keys(p, [[0.23, 0], [0.3, 1], [0.58, 1], [0.64, 0]] as const);
            const free = 1 - up - flat;
            // The raised arm: bent at the start, it bursts up straight and claws the air.
            const claw = s > 0 ? bump(clamp01((p - 0.05) / 0.18), 3) : bump(clamp01((p - 0.15) / 0.08), 2);
            const len = s > 0 ? keys(p, [[0, 0.17], [0.05, 0.5]] as const) : 0.5;
            const upW = blend([shoulder, 1], [[s * (0.08 + 0.03 * wave(p, 3)), 1, 0.08], len]);
            const upDir = blend([[s * 0.1, 1, 0.15], 1 - claw], [[s * 0.1, 0.3, 1], claw]);
            const upBack = blend([[0, 0.15, -1], 1 - claw], [[0, 1, -0.3], claw]);
            // The planted hand: flat, the fingers out and forward, the claw tips down on the floor.
            // At the release the hand lifts straight up first, so the claw tips never scrape into the floor.
            const lift = s > 0 ? keys(p, [[0.56, 0], [0.6, 0.1]] as const) : keys(p, [[0.57, 0], [0.61, 0.1]] as const);
            const flatW = m([PLANT[0], PLANT[1] + lift, PLANT[2] + 0.003 * strain]);
            // The free arm: rest, spread out and up a little in the groan, trembling in the shudder.
            // Right after the release the hands stay up at the chest while the legs come out of the hole.
            const held = keys(p, [[0.5, 0], [0.55, 1], [0.66, 1], [0.74, 0]] as const);
            const freeW = m(blend([WRIST, 1 - 0.8 * groan], [[0.34, 0.36, 0.1], 0.8 * groan], [[0.012 * shud + 0.02 * held, 0.01 * shud + 0.12 * held, 0.02 * held], 1]));
            const target = blend([toChest(upW), up], [toChest(flatW), flat], [freeW, free]);
            const pole = blend(
              [toChest(blend([shoulder, 1], [[s * 0.3, -0.05, -0.2], 1])), up],
              [toChest(blend([shoulder, 1], [[s * 0.45, 0.08, -0.15], 1])), flat],
              [m([0.3, 0.33, 0.06]), free],
            );
            const ik = reach(s > 0 ? ARM_L : ARM_R, target, pole);
            const dir = blend([dirToChest(upDir), up], [dirToChest([s * 0.3, -0.22, 0.93]), flat], [unit(m(HAND_DIR)), free]);
            const back = blend([dirToChest(upBack), up], [dirToChest([0, 1, 0.24]), flat], [unit(m(HAND_UP)), free]);
            const hand = orient([ik.upper, ik.lower], { dir: m(HAND_DIR), up: m(HAND_UP) }, { dir, up: back });
            return { upper: ik.upper, lower: ik.lower, hand };
          };
          const L = arm(1);
          const R = arm(-1);

          // ---- legs: they hang straight down under the leaning hips and kick in the heaves; the
          // left leg steps up out of the hole in the last heave.
          const kick = keys(p, [[0.3, 0], [0.36, 1], [0.58, 1], [0.64, 0]] as const) * wave(p, 5);
          const step = keys(p, [[0.6, 0], [0.65, 1], [0.7, 0]] as const);
          const legX = -hipsR[0];
          return {
            hips: { move: hipsMove, rotate: hipsR },
            spine: { rotate: spineR },
            chest: { rotate: chestR },
            neck: { rotate: [10 * nod - 8 * groan, 0, 4 * loll] },
            head: { rotate: [14 * nod - 16 * groan + 3 * strain, 8 * loll + 10 * groan, 14 * loll + 14 * groan + 3 * shud] },
            'upperarm.L': { rotate: L.upper },
            'forearm.L': { rotate: L.lower },
            'hand.L': { rotate: L.hand },
            'upperarm.R': { rotate: R.upper },
            'forearm.R': { rotate: R.lower },
            'hand.R': { rotate: R.hand },
            'leg.L': { rotate: [legX + 14 * kick - 30 * step, 0, -hipsR[2]] },
            'leg.R': { rotate: [legX - 14 * kick, 0, -hipsR[2]] },
            'foot.L': { rotate: [20 * step, 0, 0] },
            'foot.R': { rotate: [0, 0, 0] },
          };
        },
      });
    }
  },
});
