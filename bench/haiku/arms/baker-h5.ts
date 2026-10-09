import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';
import type { AssetContext, HumanoidShape } from './parts/humanoid-kind.js';

/**
 * Baker (catalog `npcs/settlement/baker`), a cheerful village baker about 1.0 m to the top of the
 * chef hat, faces +Z. Target: docs/npc-mockups/baker_001.jpg. Built on the humanoid kind
 * (assets/parts/humanoid-kind.ts), the avatar base's skeleton and face, dressed in `extra`.
 *
 * Role: a town NPC (the bakery); the tall chef hat, the cream apron, and the tray of loaves must
 *   read at 128 px, and the smile.
 * One idea: a round, happy baker in a puffy white chef hat and a cream bib apron, who carries a
 *   wooden tray of two golden loaves at the waist.
 * Palette: skin #f2c7a4; hat, cuffs, socks #f3ead6; hair #5a301d; shirt #8a5a3a; apron #e8dcc0 with
 *   #cdbb94 seams; trousers #4a3428; shoes #c89a6a; tray #9a6a3a; loaves #c88a3a with #e0a850 tops.
 * Bodies: skin, hair (a tuft under the hat), undershirt (the long sleeves), trousers, shoes, socks,
 *   hat, apron, tray, loaves.
 * Rig: the humanoid kind's skeleton and clips. The tray and loaves are skin-weighted to both hands
 *   (`hand.L`, `hand.R`) and the sleeves follow the forearms.
 */

const C = {
  hat: '#f3ead6',
  hair: '#5a301d',
  apron: '#e8dcc0',
  seam: '#cdbb94',
  pants: '#4a3428',
  shoe: '#c89a6a',
  tray: '#9a6a3a',
  loaf: '#c88a3a',
  loafTop: '#e0a850',
  sesame: '#f4e6c4',
};

/** The chef hat: a cream band on the forehead and a soft, tall, puffed top. */
const hatShape = (): sdf.Shape => {
  const band = sdf.cylinder(0.19, 0.06, 0.02).at(0, 0.81, 0);
  const puff = sdf.revolve(
    profile.polygon(
      [
        [0, 0.84],
        [0.19, 0.84],
        [0.205, 0.88],
        [0.24, 0.93],
        [0.25, 0.97],
        [0.2, 1.0],
        [0.1, 1.01],
        [0, 1.01],
      ],
      { smooth: true, samples: 8 },
    ),
  );
  return sdf.smoothUnion(0.01, band, puff).bone('head');
};

function dressBaker(k: AssetContext, h: HumanoidShape): void {
  const shirt = k.tint('cloth');
  const hair = k.tint('hair');

  // Hat and the hair tuft at the front of the band.
  k.body('hat', hatShape(), { color: C.hat, roughness: 0.8, detail: 0.006 });
  const tuft = sdf.union(
    sdf.ellipsoid([0.05, 0.03, 0.035]).at(0, 0.79, 0.2),
    sdf.ellipsoid([0.034, 0.024, 0.03]).at(0.04, 0.8, 0.19),
    sdf.ellipsoid([0.034, 0.024, 0.03]).at(-0.04, 0.8, 0.19),
  );
  k.body('hair', tuft.bone('head'), { color: hair, roughness: 0.6, detail: 0.004 });

  // Long sleeves with cream rolled cuffs, reaching the tray.
  const { ELBOW, WRIST } = h.joints;
  const wristEdge: [number, number, number] = [
    ELBOW[0] + 0.8 * (WRIST[0] - ELBOW[0]),
    ELBOW[1] + 0.8 * (WRIST[1] - ELBOW[1]),
    ELBOW[2] + 0.8 * (WRIST[2] - ELBOW[2]),
  ];
  const sleeve = sdf.cone(ELBOW, wristEdge, 0.04, 0.042).bone('forearm.L');
  k.body('sleeve', sleeve.mirror('x'), { color: shirt, roughness: 0.85, detail: 0.005 });
  const cuff = sdf.cone(wristEdge, WRIST, 0.044, 0.04).bone('forearm.L');
  k.body('cuffs', cuff.mirror('x'), { color: C.hat, roughness: 0.8, detail: 0.005 });

  // Socks: cream cuffs over the ankles.
  const sock = sdf.cone([0.098, 0.07, 0], [0.098, 0.11, 0], 0.044, 0.046).bone('shin.L');
  k.body('socks', sdf.union(sock).mirror('x'), { color: C.hat, roughness: 0.85, detail: 0.005 });

  // Apron: a cream bib with two straps and a skirt to the knees.
  const bib = sdf.box([0.2, 0.2, 0.03], 0.01).at(0, 0.27, 0.125).bone('spine');
  const skirt = sdf.box([0.25, 0.13, 0.03], 0.01).at(0, 0.09, 0.125).bone('hips');
  const straps = sdf.union(
    sdf.cone([0.07, 0.37, 0.115], [0.115, 0.42, 0.04], 0.012, 0.012).bone('chest'),
    sdf.cone([-0.07, 0.37, 0.115], [-0.115, 0.42, 0.04], 0.012, 0.012).bone('chest'),
  );
  const apron = sdf.union(bib, skirt, straps);
  k.body('apron', apron.paintWhere(sdf.box([0.2, 0.012, 0.04]).at(0, 0.18, 0.13), C.seam), { color: C.apron, roughness: 0.9, detail: 0.005 });

  // Tray with two loaves, held level in front of the belly on both hands.
  const trayBoard = sdf.box([0.46, 0.022, 0.15], 0.006).at(0, 0.2, 0.16);
  const trayLeft = trayBoard.intersect(sdf.halfSpace([-1, 0, 0], 0.0)).bone('hand.L');
  const trayRight = trayBoard.intersect(sdf.halfSpace([1, 0, 0], 0.0)).bone('hand.R');
  const loafBig = sdf.ellipsoid([0.08, 0.06, 0.07]).at(-0.06, 0.245, 0.16).paintFn((x, y, z, base) => (y > 0.27 ? C.loafTop : base));
  const loafSmall = sdf.ellipsoid([0.065, 0.05, 0.06]).at(0.075, 0.24, 0.16).paintFn((_x, y, _z, base) => (y > 0.26 ? C.loafTop : base));
  const tray = sdf.union(trayLeft, trayRight);
  k.body('tray', tray, { color: C.tray, roughness: 0.6, detail: 0.004 });
  k.body('loaves', sdf.union(loafBig.paint(C.loaf), loafSmall.paint(C.loaf)), { color: C.loaf, roughness: 0.8, detail: 0.006 });

}

export default humanoidAsset({
  name: 'baker-h5',
  description: 'A cheerful village baker NPC: a tall white chef hat, a warm brown shirt, a cream bib apron, and a tray of two loaves.',
  reference: 'docs/npc-mockups/baker_001.jpg',
  hair: false,
  pants: C.pants,
  shoes: C.shoe,
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35' },
    cloth: { brown: '#8a5a3a', linen: '#a88a62', slate: '#5a6270' },
  },
  presets: {
    default: { skin: 'fair', hair: 'brown', eyes: 'brown', cloth: 'brown' },
    warm: { skin: 'tan', hair: 'black', eyes: 'brown', cloth: 'linen' },
  },
  extra: dressBaker,
});
