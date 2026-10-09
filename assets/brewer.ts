import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Brewer — Chibi Quest settlement NPC (catalog `npcs/settlement/brewer`), about 1.0 m to the top of
 * the flat cap, faces +Z. Target: docs/npc-mockups/brewer_001.jpg. Built on the humanoid kind.
 *
 * Role: a village NPC who brews and sells cider and ale, seen at the brewery and the tavern in 3D
 *   and as a 128 px sprite; the wide flat cap with its hop flower, the rosy grin, and the keg read.
 * One idea: a jolly round brewer under a big floppy brown cap with a green hop flower, hugging a
 *   small iron-hooped keg in both arms.
 * Shape language: round and soft (cap, cheeks, keg belly), with the two iron hoops as the hard accent.
 * Palette (60/30/10): brown #7a4a2c (vest; the `cloth` slot), #6b4a32 (cap), #5a4434 (trousers),
 *   #3a2a20 (boots); cream #f0ead8 (shirt); dark green #3f5e44 (apron); keg wood #a8743e with
 *   iron #5a5e66 hoops; hop green #6a8a4a and ginger hair #b0582a as the accents.
 * Value plan: the cap over the light face is the focal point; the dark vest and boots frame the
 *   cream sleeves; the keg and the hop are the accents.
 * Bodies: skin (open smile), cap, hop, tuft, hair, shirt, cuffs, vest, apron, pants, boots, keg, hoops.
 * Rig: the humanoid kind's skeleton and clips with a two-hand `hold`; the keg is rigid on `hand.R`.
 */

const HOLD_ELBOW = [0.17, 0.33, 0.03] as const;
const HOLD_WRIST = [0.15, 0.3, 0.13] as const;
// The keg: its center, length along X, and the radius at the belly.
const KEG = { y: 0.3, z: 0.178, len: 0.23, r: 0.088 };

const C = {
  cap: '#6b4a32',
  hop: '#6a8a4a',
  hopDark: '#557a3c',
  shirt: '#f0ead8',
  apron: '#3f5e44',
  seam: '#2f4a35',
  pants: '#a89a68',
  boot: '#3a2a20',
  sole: '#2a1e18',
  wood: '#8a5a2c',
  woodDark: '#6e4420',
  iron: '#c4c8d0',
  button: '#a8acb4',
  blush: '#e8705e',
  mouth: '#8a2e2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
};

export default humanoidAsset({
  name: 'brewer',
  description: 'A jolly, round village brewer in a big flat cap with a hop flower and a brown vest, carrying a small wooden keg.',
  reference: 'docs/npc-mockups/brewer_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { ginger: '#b0582a', brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { blue: '#2f6aa8', brown: '#6e4020', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { brown: '#7a4a2c', rust: '#9a4a2a', olive: '#6a6a34', plum: '#6a3a4e' },
  },
  presets: {
    default: { skin: 'fair', hair: 'ginger', eyes: 'blue', cloth: 'brown' },
    harvest: { skin: 'tan', hair: 'auburn', eyes: 'hazel', cloth: 'olive' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  lashes: false,
  hold: { elbow: HOLD_ELBOW, wrist: HOLD_WRIST },

  // A wide open smile with a row of teeth, and high arched ginger brows over the kind's straight ones.
  paintSkin(skin, h) {
    const y = 0.538;
    const grin = profile.polygon(
      [
        [-0.05, 0.007],
        [-0.026, 0.002],
        [0, 0.0],
        [0.026, 0.002],
        [0.05, 0.007],
        [0.04, -0.01],
        [0.02, -0.025],
        [0, -0.03],
        [-0.02, -0.025],
        [-0.04, -0.01],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.006))).intersect(sdf.box([0.056, 0.1, 1]).at(0, y, 0));
    const tongue = h.onFace(sdf.ellipsoid([0.022, 0.012, 0.08]), 0, y - 0.025);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.075, 0.015, 58, 122), 0.3).at(0.1, 0.652, 0.1).mirror('x');
    const blush = h.onFace(sdf.ellipsoid([0.05, 0.042, 0.08]), 0.13, 0.56).mirror('x');
    return skin
      .paintWhere(blush, C.blush, 0.02)
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(mouth, C.mouth)
      .paintWhere(tongue.intersect(mouth), C.tongue, 0.004)
      .paintWhere(teeth, C.teeth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, ELBOW, WRIST, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];

    // ------------------------------------------------------------------ flat cap with a hop flower
    // A wide, soft crown that overhangs the head, a short brim at the front, tipped a little to the
    // viewer's right (+X), where the hop sits.
    const capPose = (s: sdf.Shape) => s.rotateZ(-6).rotateX(-6).at(0, HEAD_Y, 0);
    const crown = sdf.ellipsoid([0.255, 0.125, 0.235]).at(0, 0.185, 0.01).intersect(sdf.halfSpace([0, -1, 0], -0.108));
    const rim = sdf.torus(0.21, 0.022).scale([1.12, 1, 1.04]).at(0, 0.122, 0.005);
    const peak = sdf.ellipsoid([0.15, 0.022, 0.1]).rotateX(12).at(0, 0.122, 0.2);
    const cap = capPose(sdf.smoothUnion(0.03, crown, rim, peak)).bone('head');
    k.body('cap', cap, {
      color: C.cap,
      roughness: 0.9,
      detail: 0.005,
      bump: (x, y, z) => 0.003 * Math.sin(x * 70 + z * 50) * Math.cos(y * 60),
    });

    // The hop: a cone of overlapping scale bracts in rings, with two small leaves at the base.
    const bracts: sdf.Shape[] = [];
    const rings: Array<[number, number, number, number]> = [
      [0.0, 0.04, 8, 0.024],
      [0.03, 0.035, 7, 0.023],
      [0.058, 0.028, 6, 0.021],
      [0.083, 0.018, 4, 0.018],
    ];
    rings.forEach(([y, r, n, sz], ri) => {
      for (let i = 0; i < n; i++) {
        const a = ((i + (ri % 2) * 0.5) / n) * 360;
        const ar = (a * Math.PI) / 180;
        bracts.push(sdf.ellipsoid([sz, sz * 1.35, sz * 0.5]).rotateX(38).rotateY(a).at(r * Math.sin(ar), y, r * Math.cos(ar)));
      }
    });
    bracts.push(sdf.sphere(0.016).at(0, 0.105, 0));
    const hopShape = sdf.union(...bracts);
    const hopAt = (s: sdf.Shape) => capPose(s.rotateZ(-30).at(0.15, 0.245, 0.0)).bone('head');
    k.body('hop', hopAt(hopShape), { color: C.hop, roughness: 0.75, detail: 0.003 });
    const leaf = (dir: number, tilt: number) =>
      sdf.ellipsoid([0.05, 0.009, 0.026]).rotateZ(tilt * dir).at(0.045 * dir, 0.01, 0.0);
    k.body('hopLeaf', hopAt(sdf.union(leaf(-1, -22), leaf(1, 26).rotateY(40))), { color: C.hopDark, roughness: 0.75, detail: 0.004 });

    // The ginger fringe under the front of the cap, and the hair under the cap at the back and temples.
    const hairColor = k.tint('hair');
    const curl = (x0: number, s: number) =>
      sdf.chain(
        [
          [x0, 0.082, 0.17, 0.022],
          [x0 + 0.014 * s, 0.098, 0.19, 0.02],
          [x0 + 0.03 * s, 0.092, 0.205, 0.015],
        ],
        0.01,
      );
    const tuft = capPose(sdf.smoothUnion(0.012, sdf.ellipsoid([0.075, 0.03, 0.03]).at(0.0, 0.082, 0.165), curl(-0.045, -1), curl(0.0, 1), curl(0.045, 1)));
    k.body('tuft', tuft.bone('head'), { color: hairColor, roughness: 0.6, detail: 0.004 });

    const hairShell = sdf.ellipsoid([0.214, 0.208, 0.198]);
    const tips = sdf.union(
      ...[-70, -45, -22, 0, 22, 45, 70].map((a) => sdf.sphere(0.026).at(0.18 * Math.sin((a * Math.PI) / 180), -0.062, -0.167 * Math.cos((a * Math.PI) / 180))),
    );
    const back = hairShell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.06)).smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.02));
    const temples = hairShell
      .smoothIntersect(0.015, sdf.halfSpace([0, -1, 0], 0.03))
      .smoothIntersect(0.015, sdf.halfSpace([-1, 0, 0], -0.15).mirror('x'))
      .smoothIntersect(0.015, sdf.halfSpace([0, 0, 1], 0.11));
    const hairBack = capPose(sdf.smoothUnion(0.015, back, tips, temples)).bone('head');
    k.body('hair', hairBack, { color: hairColor, roughness: 0.6, detail: 0.005 });

    // ------------------------------------------------------------------ the round face: jowls, nose, ears
    const fz = h.faceZ(0, 0.588);
    const jowls = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.19, 0.1, 0.125]).at(0, 0.54, 0.0),
      pair(sdf.sphere(0.075).at(0.14, 0.55, 0.06)),
    );
    const noseShape = sdf.ellipsoid([0.046, 0.042, 0.046]).at(0, 0.588, fz - 0.008);
    const bigEars = pair(
      sdf
        .ellipsoid([0.03, 0.058, 0.04])
        .subtract(sdf.sphere(0.02).at(0.018, 0, 0.008))
        .rotateY(-12)
        .at(0.208, 0.612, -0.01),
    );
    const face = sdf.smoothUnion(0.012, jowls, noseShape, bigEars).bone('head');
    k.body('face', face, { color: k.tint('skin'), roughness: 0.55, detail: 0.004, textureDensity: 2 });

    // ------------------------------------------------------------------ shirt: short sleeves rolled at the elbow
    const upper = sdf.cone(lerp(SHOULDER, ELBOW, -0.1), ELBOW, 0.05, 0.047).bone('upperarm.L');
    const foreStub = sdf.cone(ELBOW, lerp(ELBOW, WRIST, 0.3), 0.047, 0.045).bone('forearm.L');
    const sleeve = sdf.smoothUnion(0.015, upper, foreStub);
    const wide = (sh: sdf.Shape) => sh.scale([1.24, 1, 1.22]);
    const wideTorso = wide(h.torso);
    const belly = sdf.ellipsoid([0.16, 0.095, 0.15]).at(0, 0.285, 0.01);
    const shirtBody = sdf.smoothUnion(0.04, wideTorso.round(0.003), belly).smoothIntersect(0.01, sdf.halfSpace([0, -1, 0], -0.245));
    const shirt = sdf.smoothUnion(0.012, h.weighted(shirtBody), pair(sleeve));
    k.body('shirt', shirt, { color: C.shirt, roughness: 0.9 });
    const roll = sdf.cone(lerp(ELBOW, WRIST, 0.12), lerp(ELBOW, WRIST, 0.36), 0.053, 0.05).round(0.004).bone('forearm.L');
    k.body('cuffs', pair(roll), { color: C.shirt, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ suspenders with metal buttons
    const strapShell = wideTorso.round(0.014).subtract(wideTorso.round(-0.002));
    const strap = strapShell
      .intersect(sdf.box([0.046, 0.5, 0.7]).at(0.075, 0.4, 0))
      .intersect(sdf.halfSpace([0, 1, 0], 0.49))
      .intersect(sdf.halfSpace([0, -1, 0], -0.27))
      .bone('chest');
    k.body('suspenders', h.weighted(pair(strap)), { color: h.tint.shirt ?? '#7a4a2c', roughness: 0.85, detail: 0.004 });
    const btnZ = sdf.raycast(wideTorso, [0.075, 0.375, 1], [0, 0, -1])![2];
    const button = pair(sdf.sphere(0.017).scale([1, 1, 0.6]).at(0.075, 0.375, btnZ + 0.012)).bone('chest');
    k.body('buttons', button, { color: C.button, roughness: 0.35, metalness: 0.85, detail: 0.003 });

    // ------------------------------------------------------------------ short green apron
    const shell = wideTorso.round(0.02).subtract(wideTorso.round(-0.003));
    const skirtOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.285],
            [0.14, 0.285],
            [0.152, 0.245],
            [0.162, 0.205],
            [0.17, 0.185],
            [0, 0.185],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1.2, 1, 1.0]);
    const skirtInner = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.126, 0.3],
            [0.138, 0.245],
            [0.148, 0.205],
            [0.156, 0.17],
            [0, 0.17],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1.2, 1, 0.98]);
    const skirt = skirtOuter.subtract(skirtInner).intersect(sdf.box([0.34, 0.25, 0.4], 0.02).at(0, 0.22, 0.2));
    const waist = shell.intersect(h.band(0.262, 0.285)).intersect(sdf.box([0.4, 0.5, 0.6]).at(0, 0.3, 0));
    const apron = sdf
      .smoothUnion(0.008, h.weighted(skirt), h.weighted(waist))
      .paintWhere(h.band(0.185, 0.197), C.seam, 0.002);
    k.body('apron', apron, { color: C.apron, roughness: 0.9, detail: 0.005 });

    // ------------------------------------------------------------------ khaki shorts and tall boots
    const shortEnd = lerp(HIP, KNEE, 0.78);
    const shortLeg = sdf.capsule(HIP, shortEnd, 0.057).bone('leg.L');
    const hipsBlock = sdf.ellipsoid([0.135, 0.058, 0.1]).at(0, 0.2, 0).bone('hips');
    const waistBlock = h.weighted(wideTorso.round(0.006).intersect(h.band(0.14, 0.262)));
    k.body('pants', sdf.smoothUnion(0.03, hipsBlock, waistBlock, pair(shortLeg)), { color: C.pants, roughness: 0.85 });
    const boot = sdf
      .smoothUnion(
        0.025,
        sdf.ellipsoid([0.058, 0.044, 0.102]).at(0, 0.042, 0.04),
        sdf.sphere(0.052).at(0, 0.052, -0.005),
        sdf.cylinder(0.052, 0.09, 0.015).at(0, 0.098, 0.0).bone('shin.L'),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ the keg: on its side between the fists
    const { y: ky, z: kz, len, r } = KEG;
    const h2 = len / 2;
    const kegProfile = profile.polygon(
      [
        [0, h2],
        [r * 0.78, h2],
        [r * 0.94, h2 * 0.55],
        [r, 0],
        [r * 0.94, -h2 * 0.55],
        [r * 0.78, -h2],
        [0, -h2],
      ],
      { smooth: true, samples: 8 },
    );
    const kegAt = (s: sdf.Shape) => s.rotateZ(90).at(0, ky, kz);
    const kegBody = kegAt(sdf.revolve(kegProfile))
      .bone('hand.R')
      .paintFn((x, y, z, base) => {
        const stave = Math.floor(((Math.atan2(z - kz, y - ky) + Math.PI) / (2 * Math.PI)) * 12);
        const t = stave % 2 === 0 ? 0 : 1;
        return t ? [base[0] * 0.93, base[1] * 0.93, base[2] * 0.93] : base;
      });
    k.body('keg', kegBody, { color: C.wood, roughness: 0.8, detail: 0.004 });
    const hoop = (x: number) =>
      sdf
        .torus(r * 0.93, 0.0105)
        .rotateZ(90)
        .at(x, ky, kz);
    const hoops = sdf.union(hoop(-h2 * 0.5), hoop(h2 * 0.5)).bone('hand.R');
    k.body('hoops', hoops, { color: C.iron, roughness: 0.4, metalness: 0.8, detail: 0.003 });
  },
});
