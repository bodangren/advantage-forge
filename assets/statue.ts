import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — stone statue of a chibi hero knight (props/world/statue).
 *
 * Role: village landmark on the hamlet map; must read at 128 px as "a knight statue".
 *   Static prop: no rig, no clips.
 * Size: 2.2 m tall overall on a square two-step plinth, stands on y = 0, faces +Z.
 * One idea: a chibi knight in a plumed helm clasps a sword upright in front of him —
 *   huge head, tiny body, the plume and the blade breaking the silhouette.
 * Shape language: round dominant (big head, dome helm, chubby torso), one vertical
 *   accent (the upright sword) and a swept plume for the outline.
 * Palette: weathered gray stone #9d9c94 (dominant), darker gray #6d6d65 / mortar
 *   #55554e for seams and carved lines, moss #5f7a3c (small accent, near the ground
 *   and on the plinth top).
 * Materials: one stone body for the figure, one stone body for the plinth (both
 *   roughness ~0.9, metalness 0); carving lines are dark paint, moss is paintFn.
 * Detail list: (1) two-step square plinth, (2) plumed dome helm with brow band and
 *   crest, (3) big chibi face with large carved eyes, (4) clasped hands + upright
 *   sword with guard and pommel, (5) short cape, (6) moss + weathering. Focal point:
 *   the face framed by the helm and the sword.
 */

const C = {
  stone: rgb('#9d9c94'),
  stoneLight: rgb('#b4b3aa'),
  stoneDark: rgb('#6d6d65'),
  mortar: rgb('#55554e'),
  carve: rgb('#413f39'),
  moss: rgb('#5f7a3c'),
  mossDark: rgb('#4d6b3a'),
};

const sstep = (e0: number, e1: number, v: number): number => {
  const t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

const PLINTH_TOP = 0.38;

export default defineAsset({
  name: 'statue',
  description:
    'Weathered gray stone statue of a chibi hero knight on a square two-step plinth: plumed dome helm, big carved eyes, hands clasped on a sword held upright in front, a little moss.',
  detail: 0.006,
  texture: { size: 1024 },
  reference: 'docs/item-mockups/statue-mock.jpg',

  build(k) {
    // ---------------------------------------------------------------- plinth
    const step1 = sdf.box([1.04, 0.15, 1.04], 0.03).at(0, 0.075, 0);
    const step2 = sdf.box([0.86, 0.24, 0.86], 0.025).at(0, 0.26, 0);
    const plinth = sdf.union(step1, step2).intersect(sdf.halfSpace([0, -1, 0], 0));

    const plinthPaint = (x: number, y: number, z: number, base: typeof C.stone) => {
      // Big worn block seams on the sides, a per-block tint, a pale worn top edge.
      const { f1, f2, id } = noise.worley(x * 2.6, y * 4.2, z * 2.6, 5);
      const gap = sstep(0.05, 0.16, f2 - f1);
      const tint = noise.random(id, 3);
      let c = mixRgb(base, C.stoneDark, 0.12 + 0.35 * tint);
      c = mixRgb(c, C.mortar, 0.8 * (1 - gap));
      // Sun-worn pale chamfer on the top slab's upper edge.
      const topEdge = sstep(0.355, 0.375, y) * (1 - sstep(0.378, 0.385, y));
      c = mixRgb(c, C.stoneLight, 0.4 * topEdge);
      // Damp dark foot.
      c = mixRgb(c, C.stoneDark, 0.25 * (1 - sstep(0.02, 0.1, y)));
      // Moss on the plinth top and creeping up from the ground.
      const m = 0.5 + 0.5 * noise.fbm(x * 5 + 3, y * 5, z * 5, 3);
      const onTop = sstep(0.352, 0.372, y) * (1 - sstep(0.378, 0.395, y));
      const w = sstep(0.52, 0.8, m) * Math.min(1, onTop + 0.5 * (1 - sstep(0.1, 0.34, y)));
      c = mixRgb(c, C.moss, 0.75 * w);
      return c;
    };
    const plinthBump = (x: number, y: number, z: number) => {
      const { f1, f2 } = noise.worley(x * 2.6, y * 4.2, z * 2.6, 5);
      return -0.007 * (1 - sstep(0.05, 0.16, f2 - f1)) + 0.002 * noise.fbm(x * 18, y * 18, z * 18, 2);
    };
    k.body('plinth', plinth.paintFn(plinthPaint), {
      color: C.stone,
      roughness: 0.92,
      detail: 0.012,
      bump: plinthBump,
    });

    // ---------------------------------------------------------------- figure: legs and shoes
    const pair = (s: sdf.Shape) => s.mirror('x');
    const shoe = pair(sdf.ellipsoid([0.095, 0.055, 0.15]).at(0.105, PLINTH_TOP + 0.055, 0.035));
    const leg = pair(sdf.capsule([0.1, PLINTH_TOP + 0.08, 0], [0.105, PLINTH_TOP + 0.34, 0], 0.06));
    const legs = sdf.smoothUnion(0.03, shoe, leg);

    // ---------------------------------------------------------------- figure: torso and belt
    const torsoProfile = profile.polygon(
      [
        [0, PLINTH_TOP + 0.28],
        [0.17, PLINTH_TOP + 0.29],
        [0.215, PLINTH_TOP + 0.34],
        [0.245, PLINTH_TOP + 0.42],
        [0.255, PLINTH_TOP + 0.52],
        [0.245, PLINTH_TOP + 0.61],
        [0.21, PLINTH_TOP + 0.67],
        [0.16, PLINTH_TOP + 0.7],
        [0, PLINTH_TOP + 0.71],
      ],
      { smooth: true },
    );
    const torso = sdf.revolve(torsoProfile).scale([1, 1, 0.82]);
    const belt = sdf.torus(0.232, 0.03).scale([1, 1, 0.82]).at(0, PLINTH_TOP + 0.4, 0);
    const neck = sdf.capsule([0, PLINTH_TOP + 0.66, 0.005], [0, PLINTH_TOP + 0.78, 0.005], 0.09);
    const bodyCore = sdf.smoothUnion(0.04, sdf.smoothUnion(0.03, legs, torso), belt, neck);

    // ---------------------------------------------------------------- figure: head and face
    const HEAD_Y = PLINTH_TOP + 1.04; // 1.42
    const headGrp = sdf.smoothUnion(
      0.05,
      sdf.sphere(0.295).at(0, HEAD_Y, 0.01),
      pair(sdf.sphere(0.1).at(0.09, HEAD_Y - 0.05, 0.07)),
      sdf.ellipsoid([0.1, 0.05, 0.08]).at(0, HEAD_Y - 0.26, 0.06),
    );
    const faceZ = (x: number, y: number) => sdf.raycast(headGrp, [x, y, 2.5], [0, 0, -1])![2];
    // Big carved chibi eyes and a small smile, stencils sunk through the face.
    const eye = pair(sdf.ellipsoid([0.072, 0.088, 0.1]).at(0.11, HEAD_Y + 0.015, faceZ(0.11, HEAD_Y + 0.015) + 0.01));
    const smile = sdf.extrude(profile.arc(0.045, 0.009, 238, 302), 0.5).at(0, HEAD_Y - 0.11, 0.15);

    // ---------------------------------------------------------------- figure: plumed helm
    const helmOuter = sdf.ellipsoid([0.335, 0.32, 0.335]).at(0, HEAD_Y + 0.04, -0.015);
    const helmInner = sdf.ellipsoid([0.313, 0.298, 0.313]).at(0, HEAD_Y + 0.04, -0.015);
    // Face opening: brow line, cheek guards closing toward the chin.
    const opening = sdf
      .extrude(
        profile.polygon(
          [
            [-0.175, HEAD_Y + 0.1],
            [0.175, HEAD_Y + 0.1],
            [0.2, HEAD_Y],
            [0.185, HEAD_Y - 0.12],
            [0.15, HEAD_Y - 0.26],
            [0.1, HEAD_Y - 0.32],
            [-0.1, HEAD_Y - 0.32],
            [-0.15, HEAD_Y - 0.26],
            [-0.185, HEAD_Y - 0.12],
            [-0.2, HEAD_Y],
          ],
          { smooth: true },
        ),
        0.5,
        0.012,
      )
      .at(0, 0, 0.15);
    const helmShell = sdf
      .smoothUnion(0.02, helmOuter, pair(sdf.sphere(0.09).at(0.3, HEAD_Y - 0.16, 0.05)))
      .subtract(helmInner)
      .smoothSubtract(0.01, opening)
      .intersect(sdf.halfSpace([0, -1, 0], -(HEAD_Y - 0.34)));
    // Raised crest comb over the crown, front to back.
    const crest = helmOuter
      .round(0.009)
      .subtract(helmOuter.round(-0.006))
      .smoothIntersect(0.006, sdf.box([0.05, 0.5, 0.8], 0.012).at(0, HEAD_Y + 0.26, -0.06))
      .smoothIntersect(0.008, sdf.halfSpace([0, 0, 1], 0.16));
    // Plume: a feather tuft swept up and back from the crown.
    const plumeMain = sdf.chain(
      [
        [0, HEAD_Y + 0.3, -0.14, 0.05],
        [0, HEAD_Y + 0.46, -0.22, 0.062],
        [0, HEAD_Y + 0.6, -0.26, 0.055],
        [0, HEAD_Y + 0.7, -0.23, 0.032],
        [0, HEAD_Y + 0.75, -0.18, 0.012],
      ],
      0.03,
    );
    const plumeSide = pair(
      sdf.chain(
        [
          [0.05, HEAD_Y + 0.28, -0.12, 0.04],
          [0.075, HEAD_Y + 0.42, -0.19, 0.05],
          [0.09, HEAD_Y + 0.54, -0.22, 0.04],
          [0.095, HEAD_Y + 0.63, -0.19, 0.02],
        ],
        0.03,
      ),
    );
    const helm = sdf.union(helmShell, crest, plumeMain, plumeSide);

    // ---------------------------------------------------------------- figure: arms and hands
    const SHOULDER: readonly [number, number, number] = [0.26, PLINTH_TOP + 0.66, 0.01];
    const ELBOW: readonly [number, number, number] = [0.22, PLINTH_TOP + 0.5, 0.1];
    const WRIST: readonly [number, number, number] = [0.06, PLINTH_TOP + 0.55, 0.28];
    const HAND: readonly [number, number, number] = [0.048, PLINTH_TOP + 0.565, 0.325];
    const arm = pair(
      sdf.smoothUnion(
        0.025,
        sdf.smoothUnion(0.03, sdf.capsule(SHOULDER, ELBOW, 0.062), sdf.capsule(ELBOW, WRIST, 0.056)),
        sdf.sphere(0.075).at(...HAND),
        sdf.sphere(0.105).at(...SHOULDER),
      ),
    );

    // ---------------------------------------------------------------- figure: short cape
    const capeProfile = profile.polygon(
      [
        [0, PLINTH_TOP + 0.18],
        [0.27, PLINTH_TOP + 0.18],
        [0.315, PLINTH_TOP + 0.62],
        [0.26, PLINTH_TOP + 0.69],
        [0, PLINTH_TOP + 0.71],
      ],
      { smooth: true },
    );
    const cape = sdf
      .revolve(capeProfile)
      .scale([1, 1, 0.8])
      .at(0, 0, -0.05)
      .intersect(sdf.halfSpace([0, 0, 1], -0.02));

    // ---------------------------------------------------------------- figure: upright sword
    const SWORD_Z = 0.34;
    const blade = sdf
      .extrude(
        profile.polygon([
          [-0.03, 0],
          [0.03, 0],
          [0.026, 0.6],
          [0, 0.68],
          [-0.026, 0.6],
        ]),
        0.024,
        0.004,
      )
      .at(0, PLINTH_TOP + 0.68, SWORD_Z);
    const guard = sdf.box([0.14, 0.028, 0.05], 0.01).at(0, PLINTH_TOP + 0.665, SWORD_Z);
    const grip = sdf.cylinder(0.021, 0.17, 0.005).at(0, PLINTH_TOP + 0.56, SWORD_Z);
    const pommel = sdf.sphere(0.03).at(0, PLINTH_TOP + 0.465, SWORD_Z);
    const sword = sdf.smoothUnion(0.01, blade, guard, grip, pommel);

    // ---------------------------------------------------------------- figure body
    const figure = sdf
      .union(bodyCore, headGrp, helm, arm, cape, sword)
      .paintWhere(eye, C.carve)
      .paintWhere(smile, C.carve)
      .paintFn((x, y, z, base) => {
        // Weathering: soft dark patches and pale worn highlights.
        const patch = noise.fbm(x * 3.5, y * 3.5, z * 3.5, 3);
        let c = mixRgb(base, C.stoneDark, 0.16 * (0.5 + 0.5 * patch));
        c = mixRgb(c, C.stoneLight, 0.12 * (0.5 + 0.5 * noise.fbm(x * 2.2 + 7, y * 2.2, z * 2.2, 2)));
        // A dark carved band along the helm brow.
        c = mixRgb(c, C.stoneDark, 0.55 * sstep(0.02, 0.045, 0.05 - Math.abs(y - (HEAD_Y + 0.145))));
        // Moss: creeping up from the plinth, on upward ledges, in the carving shadow.
        const m = noise.fbm(x * 5 + 3, y * 5, z * 5, 3);
        const low = 1 - sstep(PLINTH_TOP + 0.2, PLINTH_TOP + 0.75, y);
        const w = sstep(0.35, 0.75, m) * Math.min(1, low * 0.85 + 0.15);
        c = mixRgb(c, C.moss, 0.7 * w);
        c = mixRgb(c, C.mossDark, 0.5 * w * sstep(0.4, 0.8, noise.fbm(x * 9, y * 9, z * 9, 2)));
        return c;
      });
    k.body('statue', figure, {
      color: C.stone,
      roughness: 0.9,
      detail: 0.005,
      textureDensity: 2,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 24, y * 24, z * 24, 2),
    });
  },
});
