import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Bartender — Chibi Quest settlement NPC (catalog `npcs/settlement/bartender`), about 1.0 m to the
 * top of the hair, faces +Z. Target: docs/npc-mockups/bartender_001.jpg. Built on the humanoid kind.
 *
 * Role: the tavern NPC who serves drinks; seen in 3D and as a 128 px sprite. The curled mustache,
 *   the green vest over the cream apron, and the foaming tankard must read.
 * One idea: a jolly barkeep whose big curled mustache and foam-topped wooden tankard sit on a dark
 *   green vest and a long cream apron.
 * Shape language: round and soft (face, foam, boots), with the straight apron panel and the banded
 *   tankard as the hard forms.
 * Palette (60/30/10): vest #3f5e44 and brown breeches (60 percent of the body), cream #f0ead8 /
 *   #e8dcc0 (shirt, apron, towel), brass #c8a040 (buttons, tankard bands) as the accent.
 * Value plan: dark vest against the light shirt and apron; the white foam is the lightest point.
 * Bodies: skin, hair, mustache, shirt, cuffs, vest, buttons, apron, towel, breeches, boots,
 *   tankard, bands, foam.
 * Rig: the humanoid kind's skeleton and clips. The tankard is rigid on the grip bone `knife.R`.
 */

const C = {
  shirt: '#f0ead8',
  apron: '#e8dcc0',
  seam: '#cdbb94',
    brass: '#c8a040',
  pants: '#4a3a2c',
  boot: '#5a3a24',
  bootSole: '#3a2416',
  wood: '#6a4122',
  towel: '#c9a56e',
  towelStripe: '#7a4a2a',
  foam: '#fbf6ee',
};

// The tankard: radius and height (the position follows the posed right grip).
const MUG = { r: 0.062, h: 0.15 };

export default humanoidAsset({
  name: 'bartender',
  description: 'A cheerful tavern bartender with a curled mustache, a green vest, and a long apron, holding a foaming tankard.',
  reference: 'docs/npc-mockups/bartender_001.jpg',
  variants: {
    skin: { tan: '#d49a72', fair: '#f2c7a4', light: '#e8b48e', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#3a2216', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { forest: '#2d3b2b', walnut: '#7a5230', plum: '#6a3f52', navy: '#34475f' },
  },
  presets: {
    cellar: { skin: 'light', hair: 'black', eyes: 'hazel', cloth: 'walnut' },
  },
  hair: false,
  lashes: false,
  undershirt: false,
  pants: false,
  shoes: false,
  // The right arm raised in a toast beside the head; the tankard sits in the fist.
  pose: { R: { elbow: [0.2, 0.33, 0.035], wrist: [0.255, 0.4, 0.09] } },

  // A bolder closed smile under the mustache and thick brows (painted over the defaults).
  paintSkin(skin, h) {
    const smile = sdf.extrude(profile.arc(0.07, 0.014, 236, 304), 0.3).at(0, 0.6, 0.1);
    const brows = sdf.extrude(profile.arc(0.1, 0.03, 60, 120), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    return skin.paintWhere(brows, h.tint.brow!, 0.002).paintWhere(smile, h.tint.mouth!, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];

    // ------------------------------------------------------------------ mustache: thick and bushy, above the smile
    const my = 0.556;
    const mz = (x: number, y = my) => h.faceZ(x, y) + 0.004;
    const side = sdf.smoothUnion(
      0.014,
      sdf.capsule([0.0, my - 0.002, mz(0.0)], [0.036, my - 0.01, mz(0.036)], 0.0165),
      sdf.capsule([0.036, my - 0.01, mz(0.036)], [0.066, my - 0.002, mz(0.066)], 0.0145),
      sdf.capsule([0.066, my - 0.002, mz(0.066)], [0.086, my + 0.016, mz(0.086)], 0.012),
      sdf.sphere(0.011).at(0.088, my + 0.03, mz(0.088, my + 0.03)),
    );
    const mustache = sdf.smoothUnion(0.012, side, side.mirror('x', 0)).bone('head');
    k.body('mustache', mustache, { color: k.tint('hair'), roughness: 0.6, detail: 0.003 });

    // ------------------------------------------------------------------ shirt: sleeves rolled to the elbow
    const upper = h.perArm((j) => sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), lerp(j.ELBOW, j.WRIST, 0.08), 0.047, 0.044).bone('upperarm.L'));
    const shirt = sdf.smoothUnion(0.012, h.weighted(h.torso), upper);
    k.body('shirt', shirt, { color: C.shirt, roughness: 0.85 });
    const cuff = h.perArm((j) => sdf.cone(lerp(SHOULDER, j.ELBOW, 0.78), lerp(j.ELBOW, j.WRIST, 0.2), 0.049, 0.05).round(0.004).bone('forearm.L'));
    const collar = sdf.torus(0.06, 0.018).at(0, 0.452, -0.008).bone('chest');
    k.body('cuffs', sdf.union(cuff, collar), { color: C.shirt, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ vest: sleeveless, a V at the neck, brass buttons
    const vestBody = h.torso.round(0.011);
    const armhole = sdf.ellipsoid([0.075, 0.085, 0.1]).at(0.152, 0.4, 0).mirror('x', 0);
    const vestCut = sdf.box([0.5, 0.5, 0.7], 0.03).at(0, 0.44, 0).subtract(armhole);
    const vNeck = sdf.extrude(profile.polygon([[-0.062, 0.5], [0.062, 0.5], [0, 0.395]]), 0.3).at(0, 0, 0.15);
    const vest = h
      .weighted(vestBody.smoothIntersect(0.02, vestCut).intersect(sdf.halfSpace([0, 1, 0], 0.425)).subtract(vNeck))
      .intersect(sdf.halfSpace([0, -1, 0], -0.17));
    k.body('vest', vest, { color: h.tint.shirt ?? '#3f5e44', roughness: 0.8, detail: 0.005, bump: (x, y, z) => 0.0015 * Math.sin(x * 140 + y * 20) * Math.cos(z * 120) });

    const buttons = sdf.union(
      ...[0.365, 0.3].flatMap((y) =>
        [-0.042, 0.042].map((x) => {
          const z = sdf.raycast(vestBody, [x, y, 1], [0, 0, -1])![2];
          return sdf.sphere(0.0135).at(x, y, z + 0.002);
        }),
      ),
    );
    k.body('buttons', buttons.bone('chest'), { color: C.brass, roughness: 0.35, metalness: 0.85, detail: 0.003 });

    // ------------------------------------------------------------------ apron: waistband and a long front panel
    const apronOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.29],
            [0.138, 0.29],
            [0.15, 0.25],
            [0.156, 0.21],
            [0.166, 0.185],
            [0.178, 0.14],
            [0.186, 0.112],
            [0, 0.112],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const apronInner = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.124, 0.3],
            [0.136, 0.25],
            [0.142, 0.21],
            [0.152, 0.185],
            [0.165, 0.14],
            [0.173, 0.1],
            [0, 0.1],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    const panel = apronOuter.subtract(apronInner).intersect(sdf.box([0.215, 0.2, 0.4], 0.018).at(0, 0.21, 0.2));
    const tie = h.torso.round(0.012).subtract(h.torso.round(-0.003)).intersect(h.band(0.262, 0.292));
    const apron = sdf
      .smoothUnion(0.008, h.weighted(panel), h.weighted(tie))
      .paintWhere(h.band(0.268, 0.28), C.seam, 0.002)
      .paintWhere(h.band(0.114, 0.126), C.seam, 0.002);
    k.body('apron', apron, { color: C.apron, roughness: 0.9, detail: 0.005 });

    // ------------------------------------------------------------------ towel: a folded cloth over the right shoulder (x < 0)
    const towelShell = h.torso
      .round(0.028)
      .subtract(h.torso.round(0.004))
      .intersect(sdf.box([0.078, 0.2, 1], 0.01).at(-0.098, 0.35, 0))
      .intersect(sdf.halfSpace([0, 1, 0], 0.462));
    const towel = h
      .weighted(towelShell)
      .paintWhere(h.band(0.27, 0.284), C.towelStripe, 0.002)
      .paintWhere(h.band(0.305, 0.317), C.towelStripe, 0.002);
    k.body('towel', towel, { color: C.towel, roughness: 0.95, detail: 0.004 });

    // ------------------------------------------------------------------ breeches and tall boots
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.05).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.12, 0.002], 0.048, 0.046).bone('shin.L'),
    );
    k.body('breeches', sdf.smoothUnion(0.03, sdf.ellipsoid([0.118, 0.052, 0.088]).at(0, 0.2, 0).bone('hips'), pair(trouserLeg)), {
      color: C.pants,
      roughness: 0.85,
    });
    const shoe = sdf.smoothUnion(0.025, sdf.ellipsoid([0.058, 0.044, 0.1]).at(0, 0.04, 0.04), sdf.sphere(0.052).at(0, 0.052, -0.005));
    const shaft = sdf.cylinder(0.054, 0.1, 0.014).at(0, 0.07, 0.0);
    const rim = sdf.torus(0.052, 0.009).at(0, 0.122, 0);
    const boot = sdf
      .smoothUnion(0.02, shoe, shaft, rim)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ hair: a swept, wavy pompadour with short neat sides
    const HY = h.joints.HEAD_Y;
    const faceMask = sdf.ellipsoid([0.24, 0.17, 0.22]).at(0, 0.64, 0.14);
    const earCuts = sdf.ellipsoid([0.06, 0.07, 0.06]).at(0.205, 0.61, -0.01).mirror('x', 0);
    const skull = sdf
      .ellipsoid([0.218, 0.214, 0.203])
      .at(0, HY + 0.008, -0.01)
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.585))
      .smoothSubtract(0.02, faceMask)
      .smoothSubtract(0.015, earCuts);
    const pomp = sdf
      .smoothUnion(
        0.035,
        sdf.ellipsoid([0.14, 0.06, 0.105]).rotateX(-12).at(0, 0.85, 0.05),
        sdf.capsule([0.095, 0.828, 0.15], [-0.085, 0.862, 0.13], 0.046), // the rolled front of the wave
        sdf.capsule([0.105, 0.868, 0.04], [-0.095, 0.9, 0.0], 0.042), // the crest
        sdf.capsule([0.08, 0.88, -0.06], [-0.08, 0.88, -0.07], 0.044), // the wave rolling back
      )
      .rotateZ(-6)
      .smoothIntersect(0.025, sdf.box([0.7, 0.5, 0.7]).at(0, 0.96, 0));
    const hair = sdf.smoothUnion(0.03, skull, pomp).bone('head');
    k.body('hair', hair, {
      color: k.tint('hair'),
      roughness: 0.6,
      detail: 0.004,
      bump: (px, py, pz) => 0.002 * Math.sin((px * 1.0 + pz * 0.5) * 120 + py * 30),
    });

    // ------------------------------------------------------------------ tankard: wood, two brass bands, foam
    // Held by its body in the raised right fist (x < 0): the fist wraps the inner side; the handle is on the far side.
    const g = h.arms.R.GRIP;
    const { r, h: mh } = MUG;
    const x = -g[0] + 0.022 - r;
    const y = g[1] + 0.005;
    const z = g[2] + 0.03;
    const mugBody = sdf.cylinder(r, mh, 0.012).at(x, y, z);
    const handle = sdf.torus(0.034, 0.011).rotateZ(90).at(x, y, z - r - 0.006);
    const wood = sdf.smoothUnion(0.008, mugBody, handle).bone('knife.R');
    k.body('tankard', wood, { color: C.wood, roughness: 0.75, detail: 0.003, bump: (px, py, pz) => 0.0015 * Math.sin(py * 220 + Math.sin(px * 70 + pz * 50) * 2) });
    const band = (by: number) => sdf.cylinder(r + 0.004, 0.017, 0.006).at(x, by, z);
    k.body('bands', sdf.union(band(y - mh / 2 + 0.026), band(y + mh / 2 - 0.026)).bone('knife.R'), {
      color: C.brass,
      roughness: 0.35,
      metalness: 0.85,
      detail: 0.003,
    });
    const top = y + mh / 2;
    const foam = sdf.smoothUnion(
      0.02,
      sdf.ellipsoid([r + 0.003, 0.034, r + 0.003]).at(x, top + 0.008, z),
      sdf.sphere(0.036).at(x - 0.02, top + 0.036, z + 0.008),
      sdf.sphere(0.03).at(x + 0.024, top + 0.032, z - 0.012),
      sdf.sphere(0.026).at(x + 0.006, top + 0.04, z + 0.028),
      sdf.capsule([x - 0.03, top - 0.002, z + 0.05], [x - 0.032, top - 0.04, z + 0.05], 0.012), // a drip down the front
    );
    k.body('foam', foam.bone('knife.R'), { color: C.foam, roughness: 0.95, detail: 0.003 });
  },
});
