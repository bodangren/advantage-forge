import { mixRgb, profile, rgb, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Forager — Chibi Quest settlement NPC (catalog `npcs/settlement/forager`), about 0.95 m to the top
 * of the hood, faces +Z. Target: docs/npc-mockups/forager_001.jpg. Built on the humanoid kind.
 *
 * Role: a forest-edge NPC who trades mushrooms, berries, and herbs; seen in 3D and as a 128 px sprite.
 *   The green hood, the red-and-white mushroom, and the berry basket must read.
 * One idea: a cheerful girl in a big soft green hood who holds out a red spotted mushroom, the one
 *   bright spot of a green and brown body.
 * Shape language: round and soft (hood, cape, mushroom cap, basket); the woven basket is the small texture.
 * Palette (60/30/10): forest green #3f5e3a (cape, hood); brown #7a5a3a (skirt), #5a4434 (leggings),
 *   #5a3a24 (boots), #6b3e22 (hair); cream #f0ead8 (blouse, stem); accents red #c8402a (cap), berries #b03a4a.
 * Value plan: the mid green hood frames the light face; brown legs and skirt are the dark base; the red
 *   cap and the berries are the accent.
 * Bodies: skin, hair, braids, hood, cape, bow, blouse, skirt, boots, mushroom, stem, basket, leaves, berries.
 * Rig: the humanoid kind's skeleton and clips. The right arm holds the mushroom forward in a rest pose
 *   (`pose.R`); the mushroom is rigid on `knife.R`. The basket hangs on `knife.L` from the left fist.
 */

const C = {
  hood: '#4a5e40',
  blouse: '#f0ead8',
  cuff: '#e0d6bc',
  skirt: '#7a5a3a',
  skirtDark: '#5f4428',
  legs: '#5a4434',
  boot: '#5a3a24',
  bootCuff: '#7a5434',
  tie: '#c8402a',
  basket: '#b08a50',
  weave: '#8a6a3a',
  leaf: '#3a5a2e',
  leafDark: '#2f4a28',
  berry: '#b03a4a',
  cap: '#c8402a',
  spot: '#f6f1ea',
  stem: '#f0ead8',
  gill: '#e6d8bc',
};

// The right hand holds the mushroom out in front at chest height (left-side values; the kind mirrors R).
const RIGHT_ARM = { elbow: [0.17, 0.335, 0.05], wrist: [0.2, 0.33, 0.15] } as const;

// The left forearm is bent forward at the hip; the basket handle hooks over it.
const LEFT_ARM = { elbow: [0.18, 0.31, 0.03], wrist: [0.2, 0.275, 0.13] } as const;

export default humanoidAsset({
  name: 'forager',
  description: 'A cheerful young forager in a green hooded cape, holding out a red spotted mushroom and a basket of berries.',
  reference: 'docs/npc-mockups/forager_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#6b3e22', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { sage: '#5c6f4e', indigo: '#3f5a70', madder: '#8a4a3a', heather: '#7a5a80' },
  },
  presets: {
    dusk: { skin: 'tan', hair: 'black', eyes: 'hazel', cloth: 'indigo' },
  },
  hair: false,
  undershirt: false,
  pants: C.legs,
  shoes: false,
  pose: { L: LEFT_ARM, R: RIGHT_ARM },

  // A small closed smile and thin, cheerful brows: the kind's straight brows are painted over with skin.
  paintSkin(skin, h) {
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.07, 0.014, 54, 122), 0.3).at(0.1, 0.628, 0.1).mirror('x');
    return skin.paintWhere(oldBrows, h.tint.skin!, 0.002).paintWhere(brows, h.tint.brow!, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');
    const cape = h.tint.shirt ?? '#5c6f4e';
    const capeDark = k.tint('cloth', { color: C.hood, follow: 1 });
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);

    // ------------------------------------------------------------------ hair under the hood
    // A cap a little larger than the skull, open at the face, with swept fringe locks over the forehead
    // and short locks at the temples.
    const hoodInner = sdf.ellipsoid([0.238, 0.212, 0.218]).at(0, -0.004, -0.006);
    // The opening is a wide arch: its edge runs from above the brow back to behind the ears, so the
    // face shows from the side as well as the front.
    const faceCut = sdf.ellipsoid([0.3, 0.2, 0.2]).at(0, -0.06, 0.16);
    const faceMask = sdf.ellipsoid([0.15, 0.135, 0.12]).at(0, -0.085, 0.18);
    const earCut = pair(sdf.ellipsoid([0.05, 0.06, 0.05]).at(0.2, -0.08, -0.01));
    const hairCap = sdf
      .ellipsoid([0.213, 0.207, 0.197])
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.09))
      .smoothSubtract(0.02, faceMask, earCut);
    const lock = (pts: [number, number, number, number][]) => sdf.chain(pts, 0.03);
    // The fringe sweeps from a part above the right brow across the forehead to the left temple.
    const fringe = sdf.union(
      lock([[-0.13, 0.17, 0.12, 0.032], [-0.06, 0.14, 0.175, 0.034], [0.02, 0.11, 0.195, 0.03], [0.1, 0.075, 0.185, 0.024], [0.15, 0.04, 0.16, 0.016]]),
      lock([[-0.15, 0.125, 0.11, 0.03], [-0.09, 0.1, 0.17, 0.03], [-0.02, 0.085, 0.195, 0.026], [0.05, 0.066, 0.196, 0.017]]),
      lock([[-0.17, 0.085, 0.1, 0.026], [-0.15, 0.07, 0.15, 0.026], [-0.105, 0.06, 0.185, 0.016]]),
      lock([[-0.05, 0.19, 0.1, 0.034], [0.03, 0.16, 0.16, 0.032], [0.1, 0.12, 0.17, 0.028], [0.16, 0.08, 0.14, 0.02], [0.185, 0.03, 0.1, 0.014]]),
    );
    const temples = pair(
      sdf.chain(
        [
          [0.17, 0.04, 0.115, 0.022],
          [0.195, -0.03, 0.08, 0.02],
          [0.2, -0.09, 0.04, 0.016],
        ],
        0.02,
      ),
    );
    k.body('hair', headPose(sdf.smoothUnion(0.02, hairCap, fringe, temples).smoothIntersect(0.008, sdf.ellipsoid([0.226, 0.222, 0.21]))).bone('head'), { color: hairColor, roughness: 0.6, detail: 0.005 });

    // Two short braids hang from inside the hood in front of the shoulders, each tied with a red band.
    const braid = (s: number) => {
      const spine: [number, number, number, number][] = [
        [0.2 * s, 0.53, 0.03, 0.03],
        [0.2 * s, 0.5, 0.06, 0.033],
        [0.193 * s, 0.468, 0.082, 0.033],
        [0.187 * s, 0.437, 0.094, 0.03],
      ];
      const beads = spine.slice(1).map(([x, y, z, r], i) => sdf.ellipsoid([r * 1.05, r * 1.0, r * 1.15]).rotateZ((i % 2 ? 34 : -34) * s).at(x, y, z));
      const tip = sdf.chain([[0.186 * s, 0.418, 0.096, 0.022], [0.184 * s, 0.398, 0.098, 0.02]], 0.02);
      return sdf.smoothUnion(0.006, sdf.chain(spine.map(([x, y, z, r]) => [x, y, z, r * 0.8] as [number, number, number, number]), 0.03), ...beads, tip);
    };
    k.body('braids', sdf.union(braid(1), braid(-1)).bone('chest'), { color: hairColor, roughness: 0.6, detail: 0.004 });
    const tie = (s: number) => sdf.torus(0.03, 0.009).rotateX(8).at(0.187 * s, 0.428, 0.095);
    k.body('braid-ties', sdf.union(tie(1), tie(-1)).bone('chest'), { color: C.tie, roughness: 0.7, detail: 0.005 });

    // ------------------------------------------------------------------ the hood: a big soft shell with the face open
    const hoodOuter = sdf.smoothUnion(
      0.06,
      sdf.ellipsoid([0.262, 0.232, 0.24]).at(0, 0.0, -0.01),
      sdf.ellipsoid([0.16, 0.17, 0.11]).at(0, -0.08, -0.14), // the drape down the back
      sdf.sphere(0.1).at(0.0, 0.1, -0.12), // the soft peak at the back of the crown
    );
    const hood = headPose(hoodOuter.smoothSubtract(0.02, hoodInner, faceCut).smoothIntersect(0.01, sdf.halfSpace([0, -1, 0], 0.205))).bone('head');
    k.body('hood', hood, { color: cape, roughness: 0.9, detail: 0.005, bump: (x, y, z) => 0.002 * Math.sin(x * 55 + y * 40) * Math.cos(z * 50 + y * 20) });

    // ------------------------------------------------------------------ blouse: cream, long sleeves, a soft collar
    const sleeve = h.perArm((j) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.047, 0.043).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.9), 0.043, 0.04).bone('forearm.L'),
      ),
    );
    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.76), lerp(j.ELBOW, j.WRIST, 1.0), 0.045, 0.047).round(0.002).bone('forearm.L'));
    const collar = sdf.torus(0.062, 0.017).at(0, 0.452, -0.012).bone('chest');
    k.body('blouse', sdf.smoothUnion(0.012, h.weighted(h.torso), sleeve, collar), { color: C.blouse, roughness: 0.9, detail: 0.005 });
    k.body('cuffs', cuffs, { color: C.cuff, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ the cape: a short shoulder cape, open at the front
    const capeFlare = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.4],
            [0.1, 0.4],
            [0.15, 0.33],
            [0.19, 0.26],
            [0.205, 0.215],
            [0, 0.215],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.85]);
    const capeArms = h.perArm((j) => sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.07, 0.062));
    const capeRaw = sdf
      .smoothUnion(0.04, h.torso.round(0.03).intersect(h.band(0.215, 0.47)), capeFlare, capeArms)
      .intersect(h.band(0.215, 0.47));
    const front = sdf.extrude(
      profile.polygon([
        [-0.014, 0.45],
        [0.014, 0.45],
        [0.065, 0.2],
        [-0.065, 0.2],
      ]),
      0.4,
    ).at(0, 0, 0.2);
    const capeShell = capeRaw.subtract(capeRaw.round(-0.014)).subtract(front);
    const zoneL = sdf.cone(SHOULDER, h.arms.L.ELBOW, 0.075, 0.095);
    const capeTagged = sdf.union(h.weighted(capeShell.subtract(zoneL)), capeShell.intersect(zoneL).bone('upperarm.L'));
    k.body('cape', capeTagged, { color: cape, roughness: 0.9, detail: 0.005, bump: (x, y, z) => 0.002 * Math.sin(x * 50 + z * 45) * Math.cos(y * 40) });

    // The bow at the throat: a knot, two loops, and two short tails.
    const bowZ = 0.128;
    const bow = sdf.smoothUnion(
      0.008,
      sdf.sphere(0.017).at(0, 0.425, bowZ),
      pair(sdf.ellipsoid([0.032, 0.02, 0.016]).rotateZ(-18).at(0.034, 0.431, bowZ - 0.004)),
      pair(sdf.chain([[0.012, 0.418, bowZ], [0.026, 0.39, bowZ - 0.002], [0.034, 0.37, bowZ - 0.01]].map(([x, y, z]) => [x!, y!, z!, 0.011] as [number, number, number, number]), 0.01)),
    );
    k.body('bow', bow.bone('chest'), { color: capeDark, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ the brown skirt, to above the knee
    const skirtShape = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.13, 0.3],
            [0.14, 0.26],
            [0.158, 0.22],
            [0.176, 0.185],
            [0.19, 0.15],
            [0, 0.15],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.9]);
    const skirt = h
      .weighted(skirtShape)
      .paintWhere(h.band(0.15, 0.168), C.skirtDark, 0.004)
      .paintWhere(h.band(0.268, 0.3), C.skirtDark, 0.004);
    k.body('skirt', skirt, { color: C.skirt, roughness: 0.9, detail: 0.005, bump: (x, y, z) => 0.002 * Math.sin(x * 70 + y * 50) * Math.cos(z * 60) });

    // ------------------------------------------------------------------ short boots with a turned cuff
    const bootBody = sdf
      .smoothUnion(0.025, sdf.cylinder(0.052, 0.11, 0.016).at(0, 0.055, 0), sdf.ellipsoid([0.058, 0.05, 0.1]).at(0, 0.048, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const bootCuff = sdf.cylinder(0.058, 0.028, 0.01).at(0, 0.1, 0);
    const sole = bootBody.round(0.004).intersect(sdf.halfSpace([0, 1, 0], 0.014)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = sdf.union(bootBody, bootCuff.paint(C.bootCuff), sole.paint('#3a2418')).rotateY(10).at(ANKLE[0], 0, 0).bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.65, detail: 0.005 });

    // ------------------------------------------------------------------ the mushroom in the right fist
    // Built upright with the grip at the origin (the stem runs through the fist), then tilted out and
    // forward as in the mockup and moved to the posed grip.
    const G = h.arms.R.GRIP;
    const capY = 0.09;
    const capShape = sdf.ellipsoid([0.086, 0.068, 0.086]).at(0, capY, 0).intersect(sdf.halfSpace([0, -1, 0], -(capY - 0.016)));
    const spotDirs: [number, number, number][] = [
      [0, 1, 0],
      [0.6, 0.7, 0.2],
      [-0.55, 0.72, 0.3],
      [0.2, 0.6, -0.75],
      [-0.4, 0.65, -0.62],
      [0.85, 0.35, -0.3],
      [-0.85, 0.3, -0.2],
      [0.25, 0.55, 0.8],
      [-0.2, 0.4, 0.88],
      [0.8, 0.3, 0.45],
    ];
    const spots = sdf.union(
      ...spotDirs.map(([dx, dy, dz], i) => {
        const n = Math.hypot(dx, dy, dz);
        return sdf.sphere(i === 0 ? 0.017 : 0.014).at((0.086 * dx) / n, capY + (0.068 * dy) / n, (0.086 * dz) / n);
      }),
    );
    const capPainted = capShape
      .paintWhere(spots, C.spot, 0.002)
      .paintWhere(sdf.halfSpace([0, 1, 0], capY - 0.012), C.gill, 0.004);
    const stem = sdf.smoothUnion(
      0.012,
      sdf.cone([0, -0.06, 0], [0, capY, 0], 0.03, 0.024),
      sdf.ellipsoid([0.036, 0.03, 0.036]).at(0, -0.045, 0),
    );
    const mushroomPose = (s: sdf.Shape) => s.rotateZ(44).rotateX(6).at(-G[0], G[1], G[2]).bone('knife.R');
    k.body('mushroom-cap', mushroomPose(capPainted), { color: C.cap, roughness: 0.5, detail: 0.004 });
    k.body('mushroom-stem', mushroomPose(stem), { color: C.stem, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ the wicker basket on the left fist
    // The handle arches over the basket and hooks over the left forearm. Leaves and red berries fill it.
    const AL = h.arms.L;
    const br = 0.08;
    const bd = 0.065;
    const mid = lerp(AL.ELBOW, AL.WRIST, 0.5); // the handle hooks over the middle of the forearm
    const bx = mid[0] + 0.095;
    const by = 0.205;
    const bz = mid[2];
    const bowlOuter = sdf.revolve(
      profile.polygon(
        [
          [0, -bd],
          [br * 0.6, -bd],
          [br * 0.82, -bd * 0.7],
          [br * 0.96, -bd * 0.3],
          [br, 0.004],
          [br, 0.014],
          [0, 0.014],
        ],
        { smooth: true, samples: 8 },
      ),
    );
    const bowlInner = sdf.revolve(
      profile.polygon(
        [
          [0, -bd + 0.016],
          [br * 0.56, -bd + 0.016],
          [br * 0.78, -bd * 0.7],
          [br * 0.92, -bd * 0.3],
          [br * 0.93, 0.02],
          [0, 0.02],
        ],
        { smooth: true, samples: 8 },
      ),
    );
    const rim = sdf.torus(br - 0.004, 0.01).at(0, 0.006, 0);
    const handle = sdf.chain(
      [0, 1, 2, 3, 4, 5, 6].map((i) => {
        const a = (i / 6) * Math.PI;
        return [(br - 0.004) * Math.cos(a) - (bx - mid[0]) * Math.sin(a), (mid[1] + 0.012 - by) * Math.sin(a), 0, 0.0165] as [number, number, number, number];
      }),
      0.02,
    );
    const basketShape = sdf
      .smoothUnion(0.008, bowlOuter.subtract(bowlInner), rim, handle)
      .at(bx, by, bz)
      .paintFn((x, y, z, base) => {
        const a = Math.atan2(z - bz, x - bx);
        const row = Math.floor((y - by) / 0.02);
        const cell = Math.floor((a * br) / 0.024 + (row % 2 ? 0.5 : 0));
        return (row + cell) % 2 === 0 ? rgb(C.weave) : base;
      })
      .bone('knife.L');
    k.body('basket', basketShape, {
      color: C.basket,
      roughness: 0.85,
      detail: 0.004,
      bump: (x, y, z) => 0.003 * Math.sin(Math.atan2(z - bz, x - bx) * 30 + Math.floor((y - by) / 0.02) * 2),
    });

    const leafAt = (x: number, y: number, z: number, rx: number, ry: number, rz: number, ay: number, ax: number) =>
      sdf.ellipsoid([rx, ry, rz]).rotateX(ax).rotateY(ay).at(bx + x, by + y, bz + z);
    const leaves = sdf
      .smoothUnion(
        0.01,
        sdf.ellipsoid([br * 0.86, 0.024, br * 0.86]).at(bx, by + 0.0, bz),
        leafAt(-0.03, 0.045, -0.045, 0.02, 0.01, 0.05, 20, -40),
        leafAt(0.02, 0.06, -0.05, 0.022, 0.01, 0.05, -25, -45),
        leafAt(0.045, 0.04, -0.02, 0.018, 0.01, 0.045, -70, -30),
        leafAt(-0.05, 0.04, -0.01, 0.018, 0.01, 0.045, 100, -30),
        leafAt(0.0, 0.07, -0.06, 0.02, 0.01, 0.045, 5, -55),
      )
      .paintFn((x, y, z, base) => mixRgb(base, rgb(C.leafDark), 0.5 + 0.5 * Math.sin(x * 60 + z * 45 + y * 30)))
      .bone('knife.L');
    k.body('leaves', leaves, { color: C.leaf, roughness: 0.8, detail: 0.004 });
    const berries = sdf.union(
      ...(
        [
          [-0.02, 0.026, 0.03, 0.014],
          [0.025, 0.028, 0.025, 0.014],
          [0.0, 0.036, 0.0, 0.014],
          [-0.045, 0.02, 0.0, 0.013],
          [0.05, 0.022, -0.005, 0.013],
          [-0.015, 0.03, -0.03, 0.013],
          [0.03, 0.03, -0.035, 0.013],
        ] as const
      ).map(([x, y, z, r]) => sdf.sphere(r).at(bx + x, by + y, bz + z)),
    );
    k.body('berries', berries.bone('knife.L'), { color: C.berry, roughness: 0.35, detail: 0.005 });
  },
});
