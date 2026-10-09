import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Baker — Chibi Quest settlement NPC (catalog `npcs/settlement/baker`), about 1.0 m to the top of
 * the chef hat, faces +Z. Target: docs/npc-mockups/baker_001.jpg (made with mmx). Built on the
 * humanoid kind. Source: arm s1 of the Haiku trial (bench/haiku/results.md), finished by hand.
 *
 * Role: a town NPC (the bakery), seen in 3D and as a 128 px sprite; the hat, the apron, the tray
 *   with loaves, and the open smile must read.
 * One idea: a cheerful baker whose big white mushroom hat and wooden tray of golden loaves stand out
 *   of a warm brown and cream body.
 * Shape language: round and soft (puffed hat, loaves, round shoes), with the flat tray as the one hard form.
 * Palette (60/30/10): cream #f3ead6 / #e8dcc0 (hat, cuffs, socks, apron); brown #8a5a3a (shirt),
 *   #4a3428 (trousers); golden loaves #c88a3a with #e0a850 tops; hair tuft #5a301d.
 * Value plan: the white hat over the light face is the focal point; the brown shirt and trousers
 *   frame the cream apron; the golden loaves are the accent.
 * Bodies: skin (open smile), hat, tuft, shirt, cuffs, apron, pants, socks, shoes, tray, loaves.
 * Rig: the humanoid kind's skeleton and clips with a two-hand `hold`: the elbows bent and the fists
 *   on the tray rims in the rest pose and in every clip. The tray and the loaves are rigid on `hand.R`.
 */

// The two-hand hold (left arm; the right mirrors it): elbows bent, forearms forward to the tray rims.
const HOLD_ELBOW = [0.165, 0.325, 0.035] as const;
const HOLD_WRIST = [0.185, 0.295, 0.13] as const;
// The tray: its center (top face height) and its size; the fists grip the side rims.
const TRAY = { y: 0.278, z: 0.215, w: 0.37, d: 0.2 };

const C = {
  cream: '#f3ead6',
  apron: '#e8dcc0',
  seam: '#cdbb94',
  hair: '#5a301d',
  pants: '#4a3428',
  shoe: '#c89a6a',
  tray: '#9a6a3a',
  loaf: '#c88a3a',
  loafTop: '#e0a850',
  seed: '#fbf3dc',
  mouth: '#8a2e2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
};

export default humanoidAsset({
  name: 'baker',
  description: 'A cheerful village baker in a tall white chef hat and a cream apron, holding a tray of golden loaves.',
  reference: 'docs/npc-mockups/baker_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { brown: '#8a5a3a', moss: '#64773f', rose: '#a35d68', slate: '#5a6270' },
  },
  presets: {
    sunny: { skin: 'tan', hair: 'auburn', eyes: 'green', cloth: 'moss' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  hold: { elbow: HOLD_ELBOW, wrist: HOLD_WRIST },

  // The open, laughing mouth: a wide crescent with upturned corners, a row of teeth at the top, and
  // a tongue at the bottom. The kind's straight brows are painted over with skin, and thinner, higher
  // arched brows read as cheerful.
  paintSkin(skin, h) {
    const y = 0.538;
    const grin = profile.polygon(
      [
        [-0.056, 0.014],
        [-0.03, 0.003],
        [0, 0.0],
        [0.03, 0.003],
        [0.056, 0.014],
        [0.046, -0.012],
        [0.023, -0.03],
        [0, -0.036],
        [-0.023, -0.03],
        [-0.046, -0.012],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.011))).intersect(sdf.box([0.064, 0.1, 1]).at(0, y, 0));
    const tongue = h.onFace(sdf.ellipsoid([0.026, 0.014, 0.08]), 0, y - 0.03);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.07, 0.013, 55, 125), 0.3).at(0.1, 0.657, 0.1).mirror('x');
    return skin
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

    // ------------------------------------------------------------------ hat: a band, a cap, and a puffed top
    const hatPose = (s: sdf.Shape) => s.rotateX(-8).at(0, HEAD_Y, 0);
    const cap = sdf.ellipsoid([0.218, 0.21, 0.2]).intersect(sdf.halfSpace([0, -1, 0], -0.1));
    const band = sdf.torus(0.192, 0.018).scale([1, 1, 0.91]).at(0, 0.105, 0);
    const puff = sdf.smoothUnion(
      0.05,
      sdf.ellipsoid([0.17, 0.12, 0.16]).at(0, 0.27, -0.01),
      sdf.sphere(0.12).at(-0.1, 0.275, -0.005), // the big fold, on the viewer's left
      sdf.sphere(0.095).at(0.1, 0.29, 0.0),
      sdf.sphere(0.09).at(0, 0.27, -0.1),
      sdf.sphere(0.07).at(-0.02, 0.29, 0.085),
    );
    const hat = hatPose(sdf.smoothUnion(0.03, cap, band, puff)).bone('head');
    k.body('hat', hat, { color: C.cream, roughness: 0.9, detail: 0.005, bump: (x, y, z) => 0.003 * Math.sin(x * 60 + z * 40) * Math.cos(y * 50) });

    // The hair tuft at the front, under the band: a few thick curls.
    const tuft = hatPose(
      sdf.smoothUnion(
        0.014,
        sdf.sphere(0.032).at(-0.03, 0.09, 0.178),
        sdf.sphere(0.034).at(0.014, 0.098, 0.182),
        sdf.sphere(0.027).at(0.052, 0.084, 0.17),
        sdf.sphere(0.024).at(-0.006, 0.122, 0.168),
      ),
    ).bone('head');
    const hairColor = k.tint('hair');
    k.body('tuft', tuft, { color: hairColor, roughness: 0.6, detail: 0.004 });

    // The hair at the back and sides, under the hat.
    const hairBack = hatPose(
      sdf
        .ellipsoid([0.212, 0.206, 0.196])
        .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.07))
        .smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.03)),
    ).bone('head');
    k.body('hair', hairBack, { color: hairColor, roughness: 0.6, detail: 0.005 });

    // ------------------------------------------------------------------ shirt: long sleeves
    const upper = sdf.cone(lerp(SHOULDER, ELBOW, -0.1), ELBOW, 0.047, 0.043).bone('upperarm.L');
    const fore = sdf.cone(ELBOW, lerp(ELBOW, WRIST, 0.9), 0.043, 0.04).bone('forearm.L');
    const sleeve = sdf.smoothUnion(0.015, upper, fore);
    const shirt = sdf.smoothUnion(0.012, h.weighted(h.torso), pair(sleeve));
    k.body('shirt', shirt, { color: h.tint.shirt ?? '#8a5a3a', roughness: 0.85 });

    // The collar and the rolled cuffs.
    const collar = sdf.torus(0.06, 0.017).at(0, 0.452, -0.012).bone('chest');
    const cuff = sdf.cone(lerp(ELBOW, WRIST, 0.74), lerp(ELBOW, WRIST, 1.0), 0.045, 0.046).round(0.002).bone('forearm.L');
    const sock = sdf.cylinder(0.05, 0.034, 0.012).at(ANKLE[0], 0.103, 0.002).bone('shin.L'); // a rolled band above the shoe
    k.body('cream', sdf.union(collar, pair(cuff), pair(sock)), { color: C.cream, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ apron: bib, straps, skirt panel
    const shell = h.torso.round(0.012).subtract(h.torso.round(-0.003));
    const front = (x: number, y0: number, y1: number) => sdf.box([2 * x, y1 - y0, 0.4], 0.01).at(0, (y0 + y1) / 2, 0.2);
    const bib = shell.intersect(front(0.082, 0.255, 0.415));
    const strap = shell
      .intersect(sdf.box([0.034, 0.5, 0.6]).at(0.074, 0.39, 0))
      .intersect(sdf.halfSpace([0, -1, 0], -0.3))
      .intersect(sdf.halfSpace([0, 1, 0], 0.5))
      .bone('chest');
    const skirtOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.29],
            [0.138, 0.29],
            [0.15, 0.25],
            [0.156, 0.21],
            [0.166, 0.19],
            [0.172, 0.168],
            [0, 0.168],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const skirtInner = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.124, 0.3],
            [0.136, 0.25],
            [0.142, 0.21],
            [0.152, 0.19],
            [0.158, 0.16],
            [0, 0.16],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    const skirt = skirtOuter.subtract(skirtInner).intersect(sdf.box([0.27, 0.25, 0.4], 0.02).at(0, 0.2, 0.2));
    const apron = sdf
      .smoothUnion(0.008, h.weighted(bib), pair(strap), h.weighted(skirt))
      .paintWhere(h.band(0.262, 0.274), C.seam, 0.002)
      .paintWhere(h.band(0.168, 0.18), C.seam, 0.002);
    k.body('apron', apron, { color: C.apron, roughness: 0.9, detail: 0.005 });

    // ------------------------------------------------------------------ short trousers, socks, and round shoes
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.05).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.122, 0.002], 0.048, 0.046).bone('shin.L'),
    );
    k.body('pants', sdf.smoothUnion(0.03, sdf.ellipsoid([0.118, 0.052, 0.088]).at(0, 0.2, 0).bone('hips'), pair(trouserLeg)), {
      color: C.pants,
      roughness: 0.85,
    });
    const shoe = sdf
      .smoothUnion(0.025, sdf.ellipsoid([0.056, 0.042, 0.1]).at(0, 0.04, 0.04), sdf.sphere(0.05).at(0, 0.05, -0.005))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('shoes', pair(shoe), { color: C.shoe, roughness: 0.6 });

    // ------------------------------------------------------------------ the tray and the loaves
    // A flat board with a low rim, held level between the fists; both loaves sit on it.
    const { y: ty, z: tz, w: tw, d: td } = TRAY;
    const trayShape = sdf
      .box([tw, 0.03, td], 0.01)
      .at(0, ty - 0.015, tz)
      .subtract(sdf.box([tw - 0.03, 0.03, td - 0.03], 0.006).at(0, ty + 0.006, tz))
      .bone('hand.R');
    k.body('tray', trayShape, { color: C.tray, roughness: 0.75, detail: 0.004, bump: (x, y, z) => 0.002 * Math.sin(z * 90 + Math.sin(x * 20)) });

    const base = ty - 0.01; // the loaves rest on the board, inside the rim
    const loaf1 = sdf.smoothUnion(0.02, sdf.ellipsoid([0.08, 0.06, 0.075]).at(-0.075, base + 0.045, tz), sdf.ellipsoid([0.064, 0.04, 0.06]).at(-0.075, base + 0.075, tz));
    const loaf2 = sdf.smoothUnion(0.02, sdf.ellipsoid([0.075, 0.048, 0.068]).at(0.085, base + 0.035, tz + 0.01), sdf.ellipsoid([0.058, 0.03, 0.052]).at(0.085, base + 0.058, tz + 0.01));
    const top = sdf.halfSpace([0, -1, 0], -(base + 0.06));
    // Sesame seeds on the big loaf (the one on the viewer's left): small light ovals on its crown.
    const seeds = sdf.union(
      ...[
        [-0.1, 0.1, -0.02],
        [-0.075, 0.112, -0.03],
        [-0.05, 0.105, -0.01],
        [-0.09, 0.108, 0.02],
        [-0.062, 0.11, 0.025],
        [-0.11, 0.092, 0.005],
        [-0.04, 0.095, 0.03],
      ].map(([x, y, z]) => sdf.sphere(0.011).at(x!, base + y!, tz + z!)),
    );
    const loaves = sdf
      .union(loaf1, loaf2)
      .bone('hand.R')
      .paintWhere(top.intersect(sdf.box([1, 1, 1]).at(0, base, tz)), C.loafTop, 0.015)
      .paintWhere(seeds, C.seed, 0.002);
    k.body('loaves', loaves, { color: C.loaf, roughness: 0.8, detail: 0.004 });
  },
});
