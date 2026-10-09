import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Baker (arm s1) — Chibi Quest settlement NPC (catalog `npcs/settlement/baker`), about 1.0 m to the
 * top of the chef hat, faces +Z. Target: docs/npc-mockups/baker_001.jpg. Built on the humanoid kind.
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
 * Rig: the humanoid kind's skeleton and clips. The tray is rigid on `spine` (level, in front of the
 *   fists), 0.04 m or more from the face in every clip.
 */

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
  seed: '#f3ead6',
  mouth: '#8a2e2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
};

export default humanoidAsset({
  name: 'baker-s1',
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

  // The open, laughing mouth: a dark D with a row of teeth at the top and a tongue at the bottom.
  paintSkin(skin, h) {
    const y = 0.538;
    const mouth = h.onFace(sdf.ellipsoid([0.05, 0.036, 0.08]).intersect(sdf.halfSpace([0, 1, 0], 0)), 0, y);
    const teeth = h.onFace(
      sdf.ellipsoid([0.043, 0.034, 0.08]).intersect(sdf.halfSpace([0, 1, 0], 0)).intersect(sdf.halfSpace([0, -1, 0], 0.01)),
      0,
      y,
    );
    const tongue = h.onFace(sdf.ellipsoid([0.026, 0.016, 0.08]), 0, y - 0.027);
    return skin.paintWhere(mouth, C.mouth).paintWhere(tongue.intersect(mouth), C.tongue, 0.004).paintWhere(teeth, C.teeth, 0.002);
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
      sdf.ellipsoid([0.17, 0.1, 0.16]).at(0, 0.25, -0.01),
      sdf.sphere(0.12).at(-0.1, 0.25, -0.005), // the big fold, on the viewer's left
      sdf.sphere(0.095).at(0.1, 0.265, 0.0),
      sdf.sphere(0.09).at(0, 0.25, -0.1),
      sdf.sphere(0.07).at(-0.02, 0.27, 0.085),
    );
    const hat = hatPose(sdf.smoothUnion(0.03, cap, band, puff)).bone('head');
    k.body('hat', hat, { color: C.cream, roughness: 0.9, detail: 0.005, bump: (x, y, z) => 0.003 * Math.sin(x * 60 + z * 40) * Math.cos(y * 50) });

    // The hair tuft at the front, under the band.
    const tuft = hatPose(
      sdf.smoothUnion(
        0.012,
        sdf.sphere(0.024).at(-0.025, 0.088, 0.178),
        sdf.sphere(0.026).at(0.012, 0.094, 0.18),
        sdf.sphere(0.02).at(0.045, 0.082, 0.17),
        sdf.sphere(0.018).at(-0.004, 0.112, 0.17),
      ),
    ).bone('head');
    const hairColor = k.tint('hair');
    k.body('tuft', tuft, { color: hairColor, roughness: 0.6, detail: 0.004 });

    // The hair at the back and sides, under the hat.
    const hairBack = hatPose(
      sdf
        .ellipsoid([0.212, 0.206, 0.196])
        .intersect(sdf.box([0.6, 0.2, 0.6]).at(0, 0.05, -0.3))
        .intersect(sdf.halfSpace([0, -1, 0], 0.0))
        .intersect(sdf.halfSpace([0, 0, 1], -0.02)),
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
    const cuff = sdf.cone(lerp(ELBOW, WRIST, 0.6), lerp(ELBOW, WRIST, 1.08), 0.047, 0.05).round(0.004).bone('forearm.L');
    const sock = sdf.cylinder(0.04, 0.034, 0.012).at(ANKLE[0], 0.098, 0).bone('shin.L');
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
            [0.156, 0.2],
            [0.168, 0.18],
            [0.176, 0.148],
            [0, 0.148],
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
            [0.142, 0.2],
            [0.154, 0.18],
            [0.162, 0.14],
            [0, 0.14],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    const skirt = skirtOuter.subtract(skirtInner).intersect(sdf.box([0.27, 0.25, 0.4], 0.02).at(0, 0.2, 0.2));
    const apron = sdf
      .smoothUnion(0.008, h.weighted(bib), pair(strap), h.weighted(skirt))
      .paintWhere(h.band(0.262, 0.274), C.seam, 0.002)
      .paintWhere(h.band(0.148, 0.16), C.seam, 0.002);
    k.body('apron', apron, { color: C.apron, roughness: 0.9, detail: 0.005 });

    // ------------------------------------------------------------------ short trousers, socks, and round shoes
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.05).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.108, 0.002], 0.048, 0.046).bone('shin.L'),
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
    const trayShape = sdf
      .box([0.46, 0.05, 0.3], 0.012)
      .at(0, 0.2, 0.17)
      .subtract(sdf.box([0.42, 0.05, 0.26], 0.006).at(0, 0.215, 0.17))
      .bone('spine');
    k.body('tray', trayShape, { color: C.tray, roughness: 0.75, detail: 0.004, bump: (x, y, z) => 0.002 * Math.sin(z * 90 + Math.sin(x * 20)) });

    const loaf1 = sdf.smoothUnion(0.02, sdf.ellipsoid([0.082, 0.062, 0.078]).at(-0.085, 0.2, 0.17), sdf.ellipsoid([0.066, 0.04, 0.062]).at(-0.085, 0.235, 0.17));
    const loaf2 = sdf.smoothUnion(0.02, sdf.ellipsoid([0.078, 0.052, 0.07]).at(0.095, 0.2, 0.19), sdf.ellipsoid([0.06, 0.032, 0.055]).at(0.095, 0.225, 0.19));
    const top = sdf.halfSpace([0, -1, 0], -0.215);
    const seeds = sdf.union(
      ...[
        [-0.11, 0.268, 0.15],
        [-0.085, 0.276, 0.14],
        [-0.06, 0.272, 0.16],
        [-0.1, 0.276, 0.18],
        [-0.07, 0.278, 0.19],
        [-0.12, 0.262, 0.17],
      ].map(([x, y, z]) => sdf.sphere(0.0085).at(x!, y!, z!)),
    );
    const loaves = sdf
      .union(loaf1, loaf2)
      .bone('spine')
      .paintWhere(top.intersect(sdf.box([1, 1, 1])), C.loafTop, 0.015)
      .paintWhere(seeds.round(0.003), C.seed, 0.002);
    k.body('loaves', loaves, { color: C.loaf, roughness: 0.8, detail: 0.004 });
  },
});
