import { mixRgb, profile, rgb, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Traveler - Chibi Quest settlement NPC (catalog `npcs/settlement/traveler`), about 1.0 m to the top
 * of the hat, faces +Z, stands on y = 0. Target: docs/npc-mockups/traveler_001.jpg. Built on the
 * humanoid kind.
 *
 * Role: a road NPC (news and travel quests) at the inn and on roads; seen in 3D and as a 128 px
 *   sprite. The wide hat with its red feather, the open map, and the big pack must read.
 * One idea: an eager boy who is half hat and half backpack, reading a map he holds open at his chest.
 * Shape language: round and soft (hat, pack, curls), with the flat map as the one hard form.
 * Palette (60/30/10): brown #6b4a2c / #5a3a24 / #4a3424 (hat, belt, trousers, boots) and tan #c8a878
 *   (tunic), a dark green cloak #2f4a3a (the cloth slot); accents: red feather and blanket #c84040 /
 *   #a83a3a, and the cream map #ece0c4.
 * Value plan: the cream map and the light face are the focal point; the dark cloak and the brown hat
 *   frame them; the red feather and the red blanket are the accents.
 * Bodies: skin, hat, hatband, feather, hair cap, hair locks, cloak, tunic, cuffs, belt, pouches, boots,
 *   pack, blanket, straps, map.
 * Rig: the humanoid kind's skeleton and clips with a two-hand `hold` on the map (rigid on `hand.R`).
 *   The pack, the cloak, and the straps follow the chest and the spine.
 */

// The two-hand hold (left arm; the right mirrors it): the fists grip the side edges of the map.
const HOLD_ELBOW = [0.16, 0.325, 0.04] as const;
const HOLD_WRIST = [0.15, 0.31, 0.13] as const;
// The map: its center, its size, and its tilt toward the face.
const MAP = { x: 0, y: 0.335, z: 0.205, w: 0.27, h: 0.17, t: 0.016, tilt: -32 };

const C = {
  hat: '#6b4a2c',
  band: '#5a3a24',
  feather: '#c84040',
  featherDark: '#a02e34',
  tunic: '#c8a878',
  belt: '#5a3a24',
  brass: '#c8a24a',
  pouch: '#7a5436',
  pants: '#6b4a2c',
  boot: '#4a3424',
  cuff: '#6b4a34',
  sole: '#2e2018',
  pack: '#8a6a3a',
  packDark: '#6e5028',
  blanket: '#a83a3a',
  blanketDark: '#7a2a2e',
  map: '#ece0c4',
  mapEdge: '#cdb88e',
  mapLine: '#7a5a3a',
  mapMark: '#b03a3a',
  mouth: '#8a2e2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
};

const HEAD_AXES = [0.205, 0.2, 0.19] as const;

export default humanoidAsset({
  name: 'traveler',
  description: 'An eager young traveler in a wide feathered hat with a big backpack, reading an open map.',
  reference: 'docs/npc-mockups/traveler_001.jpg',
  variants: {
    skin: { light: '#e8b48e', fair: '#f2c7a4', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { blond: '#c4974a', brown: '#5a301d', black: '#231a17', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { forest: '#2f4a3a', dusk: '#40526e', wine: '#6a3640', umber: '#5e4a34' },
  },
  presets: {
    wayfarer: { skin: 'tan', hair: 'brown', eyes: 'green', cloth: 'wine' },
  },
  hair: false,
  undershirt: false,
  shoes: false,
  pants: C.pants,
  lashes: false,
  hold: { elbow: HOLD_ELBOW, wrist: HOLD_WRIST },

  // The eager smile: a wide open mouth with round corners, a band of teeth, and a tongue; arched brows.
  paintSkin(skin, h) {
    const y = 0.538;
    const grin = profile.polygon(
      [
        [-0.05, 0.012],
        [-0.028, 0.003],
        [0, 0.0],
        [0.028, 0.003],
        [0.05, 0.012],
        [0.042, -0.012],
        [0.021, -0.029],
        [0, -0.034],
        [-0.021, -0.029],
        [-0.042, -0.012],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.011))).intersect(sdf.box([0.06, 0.1, 1]).at(0, y, 0));
    const tongue = h.onFace(sdf.ellipsoid([0.024, 0.013, 0.08]), 0, y - 0.028);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.07, 0.014, 55, 125), 0.3).at(0.1, 0.664, 0.1).mirror('x');
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
    const hard = (s: sdf.Shape) => s.mirror('x', 0);
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const rad = Math.PI / 180;
    const hairColor = k.tint('hair');

    // ------------------------------------------------------------------ hat: a wide brim, a dented crown, a band
    const hatPose = (s: sdf.Shape) => s.rotateX(-9).rotateZ(-4).at(0, HEAD_Y + 0.01, 0);
    const crown = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.295],
            [0.09, 0.29],
            [0.165, 0.268],
            [0.205, 0.225],
            [0.218, 0.17],
            [0.222, 0.09],
            [0, 0.09],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .smoothSubtract(0.035, sdf.ellipsoid([0.045, 0.04, 0.25]).at(0, 0.3, 0));
    const brim = sdf.revolve(
      profile.polygon(
        [
          [0.19, 0.088],
          [0.27, 0.084],
          [0.33, 0.094],
          [0.36, 0.118],
          [0.366, 0.138],
          [0.33, 0.128],
          [0.26, 0.114],
          [0.19, 0.114],
        ],
        { smooth: true, samples: 6 },
      ),
    );
    const hat = hatPose(sdf.smoothUnion(0.018, crown, brim)).bone('head');
    k.body('hat', hat, { color: C.hat, roughness: 0.9, detail: 0.005, bump: (x, y, z) => 0.003 * Math.sin(x * 55 + z * 35) * Math.cos(y * 45) });
    const band = hatPose(sdf.torus(0.224, 0.014).at(0, 0.128, 0)).bone('head');
    k.body('hatband', band, { color: C.band, roughness: 0.8, detail: 0.006 });

    // The red feather: a curved plume that rises from the band at the back right and sweeps up and out.
    const plume = sdf.chain(
      [
        [-0.1, 0.14, -0.1, 0.014],
        [-0.17, 0.2, -0.15, 0.03],
        [-0.23, 0.25, -0.2, 0.036],
        [-0.29, 0.29, -0.23, 0.028],
        [-0.34, 0.31, -0.2, 0.014],
        [-0.36, 0.3, -0.16, 0.005],
      ],
      0.02,
    );
    const feather = hatPose(plume.paintWhere(sdf.box([0.5, 0.06, 0.5]).at(-0.2, 0.33, -0.1), C.featherDark, 0.03)).bone('head');
    k.body('feather', feather, { color: C.feather, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ hair: a small cap and separate locks
    // A point on the skull ellipsoid: az 0 = front, 90 = the character's left; el = elevation; r = reach.
    const P = (az: number, el: number, r = 1.04, lift = 0): [number, number, number] => [
      HEAD_AXES[0] * r * Math.cos(el * rad) * Math.sin(az * rad),
      HEAD_AXES[1] * r * Math.sin(el * rad) + lift,
      HEAD_AXES[2] * r * Math.cos(el * rad) * Math.cos(az * rad),
    ];
    // A lock: a chain of soft spheres along skull points, thinning to the tip.
    const lock = (pts: ReadonlyArray<readonly [number, number, number, number, number?]>) =>
      sdf.chain(
        pts.map(([az, el, rr, r, lift]) => [...P(az, el, rr, lift ?? 0), r] as [number, number, number, number]),
        0.012,
      );
    const skull = sdf.ellipsoid([HEAD_AXES[0] * 1.018, HEAD_AXES[1] * 1.018, HEAD_AXES[2] * 1.018]);
    const capTop = skull.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.075));
    const capBack = skull.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.07)).smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], 0.0));
    const capSide = skull
      .smoothIntersect(0.015, sdf.halfSpace([0, -1, 0], 0.04))
      .smoothIntersect(0.015, sdf.halfSpace([-1, 0, 0], -0.15).mirror('x'))
      .smoothIntersect(0.015, sdf.halfSpace([0, 0, 1], 0.1));
    const cap = sdf.smoothUnion(0.015, capTop, capBack, capSide).at(0, HEAD_Y, 0).bone('head');
    k.body('hairCap', cap, { color: k.tint('hair', -0.18), roughness: 0.6, detail: 0.005 });

    // The fringe: curled locks that sweep across the forehead under the brim.
    const fringe = [
      lock([[-62, 54, 1.04, 0.024], [-50, 40, 1.07, 0.026], [-38, 28, 1.075, 0.022], [-30, 11, 1.07, 0.014]]),
      lock([[-38, 62, 1.04, 0.025], [-26, 44, 1.08, 0.027], [-14, 30, 1.09, 0.023], [-4, 14, 1.08, 0.014]]),
      lock([[-10, 66, 1.04, 0.026], [0, 48, 1.09, 0.028], [12, 32, 1.1, 0.024], [20, 16, 1.09, 0.015]]),
      lock([[18, 62, 1.04, 0.025], [26, 46, 1.09, 0.027], [38, 32, 1.1, 0.022], [48, 14, 1.09, 0.014]]),
      lock([[44, 58, 1.04, 0.024], [54, 42, 1.08, 0.025], [64, 28, 1.08, 0.02], [70, 10, 1.07, 0.013]]),
    ];
    // Temples: longer locks that fall beside the face to the ears, flicked out at the tip.
    const temple = (s: 1 | -1) => [
      lock([[s * 70, 38, 1.04, 0.028], [s * 76, 14, 1.06, 0.027], [s * 82, -8, 1.07, 0.024], [s * 86, -26, 1.09, 0.017]]),
      lock([[s * 84, 40, 1.04, 0.026], [s * 90, 16, 1.07, 0.026], [s * 96, -12, 1.08, 0.022], [s * 103, -30, 1.11, 0.015]]),
    ];
    // The nape: a row of short curled tips around the back and the sides below the hat.
    const nape = [-96, -68, -40, -12, 14, 42, 70, 98].map((a, i) =>
      lock([
        [180 + a, 20, 1.04, 0.034],
        [180 + a * 1.02, -4, 1.08, 0.034],
        [180 + a * 1.1 + (i % 2 ? 7 : -7), -22 - (i % 3) * 5, 1.12, 0.03],
        [180 + a * 1.18 + (i % 2 ? 16 : -16), -28 - (i % 3) * 5, 1.15, 0.02],
      ]),
    );
    const locks = hatPoseFree(sdf.smoothUnion(0.01, ...fringe, ...temple(1), ...temple(-1), ...nape));
    function hatPoseFree(s: sdf.Shape) {
      return s.at(0, HEAD_Y, 0).bone('head');
    }
    k.body('hair', locks, { color: hairColor, roughness: 0.6, detail: 0.0055 });

    // ------------------------------------------------------------------ tunic: long sleeves, a collar, a short skirt
    const upper = sdf.cone(lerp(SHOULDER, ELBOW, -0.1), ELBOW, 0.047, 0.043).bone('upperarm.L');
    const fore = sdf.cone(ELBOW, lerp(ELBOW, WRIST, 0.9), 0.043, 0.04).bone('forearm.L');
    const sleeve = sdf.smoothUnion(0.015, upper, fore);
    const tunic = sdf.smoothUnion(0.012, h.weighted(h.torso), pair(sleeve));
    k.body('tunic', tunic, { color: C.tunic, roughness: 0.85 });

    const collar = sdf.torus(0.06, 0.017).at(0, 0.452, -0.012).bone('chest');
    const cuff = sdf.cone(lerp(ELBOW, WRIST, 0.72), lerp(ELBOW, WRIST, 1.0), 0.046, 0.047).round(0.002).bone('forearm.L');
    k.body('trim', sdf.union(collar, pair(cuff)), { color: C.cuff, roughness: 0.8, detail: 0.004 });

    // ------------------------------------------------------------------ the short green cloak (the cloth slot)
    const outerProfile: Array<[number, number]> = [
      [0.058, 0.478],
      [0.1, 0.47],
      [0.15, 0.448],
      [0.19, 0.402],
      [0.206, 0.34],
      [0.2, 0.27],
      [0.19, 0.2],
    ];
    const cloakProfile = [...outerProfile, ...outerProfile.slice().reverse().map(([r, y]): [number, number] => [r - 0.016, y - 0.004])];
    const bell = sdf.revolve(profile.polygon(cloakProfile, { smooth: true, samples: 6 })).scale([1, 1, 0.66]);
    const vOpening = sdf
      .extrude(
        profile.polygon([
          [-0.045, 0.5],
          [0.045, 0.5],
          [0.11, 0.18],
          [-0.11, 0.18],
        ]),
        0.5,
      )
      .at(0, 0, 0.25);
    const cloak = h
      .weighted(bell.smoothSubtract(0.02, vOpening))
      .paintWhere(h.band(0.19, 0.215), k.tint('cloth', -0.2), 0.004);
    k.body('mantle', cloak, { color: h.tint.shirt ?? '#2f4a3a', roughness: 0.9, detail: 0.005, bump: (x, y, z) => 0.002 * Math.sin(x * 70 + y * 20) * Math.cos(z * 60) });

    // ------------------------------------------------------------------ belt and two pouches
    const beltBand = h.torso.round(0.012).intersect(h.band(0.236, 0.266));
    const buckleZ = sdf.raycast(h.torso.round(0.012), [0, 0.251, 1], [0, 0, -1])?.[2] ?? 0.112;
    k.body('belt', h.weighted(beltBand), { color: C.belt, roughness: 0.75, detail: 0.004 });
    k.body('buckle', sdf.box([0.042, 0.034, 0.012], 0.004).at(0, 0.251, buckleZ).bone('spine'), { color: C.brass, roughness: 0.35, metalness: 0.85, detail: 0.003 });
    const pouchShape = sdf
      .box([0.066, 0.07, 0.05], 0.018)
      .paintWhere(sdf.box([0.2, 0.03, 0.2]).at(0, 0.035, 0), '#5a3a24', 0.004)
      .at(0.092, 0.212, 0.092)
      .rotateY(10)
      .bone('hips');
    const stud = sdf.sphere(0.008).at(0.092, 0.2, 0.121).bone('hips');
    k.body('pouches', sdf.union(hard(pouchShape), hard(stud)), { color: C.pouch, roughness: 0.8, detail: 0.004 });

    // ------------------------------------------------------------------ trousers (the kind), tall boots with folded cuffs
    const boot = sdf
      .smoothUnion(
        0.025,
        sdf.smoothUnion(0.025, sdf.ellipsoid([0.056, 0.044, 0.1]).at(0, 0.042, 0.04), sdf.sphere(0.05).at(0, 0.05, -0.005)).intersect(sdf.halfSpace([0, -1, 0], 0)).bone('foot.L'),
        sdf.cone([0, 0.04, 0], [0, 0.116, 0], 0.052, 0.054).bone('shin.L'),
      )
      .paintWhere(sdf.box([0.4, 0.034, 0.4]).at(0, 0.014, 0.05), C.sole, 0.003);
    const cuffRing = sdf.cylinder(0.059, 0.036, 0.013).at(0, 0.112, 0).bone('shin.L').paint(C.cuff);
    const boots = sdf.smoothUnion(0.006, boot.rotateY(8), cuffRing.rotateY(8)).at(ANKLE[0], 0, 0);
    k.body('boots', pair(boots), { color: C.boot, roughness: 0.65, detail: 0.004 });
    void HIP;
    void KNEE;

    // ------------------------------------------------------------------ the backpack and the rolled blanket
    const PACK = { y: 0.34, z: -0.235 };
    const pack = sdf
      .smoothUnion(
        0.03,
        sdf.box([0.34, 0.33, 0.17], 0.06).at(0, PACK.y, PACK.z),
        sdf.box([0.35, 0.12, 0.18], 0.05).at(0, PACK.y + 0.11, PACK.z - 0.004), // the lid, a bit proud
        sdf.box([0.07, 0.12, 0.09], 0.03).at(0.19, PACK.y - 0.06, PACK.z + 0.01), // side pockets
        sdf.box([0.07, 0.12, 0.09], 0.03).at(-0.19, PACK.y - 0.06, PACK.z + 0.01),
      )
      .paintWhere(sdf.box([0.5, 0.11, 0.5]).at(0, PACK.y + 0.1, PACK.z), C.packDark, 0.012)
      .bone('chest');
    k.body('pack', pack, { color: C.pack, roughness: 0.85, detail: 0.005, bump: (x, y, z) => 0.003 * Math.sin(x * 70) * Math.cos(y * 60 + z * 20) });

    const BLANKET_Y = PACK.y + 0.22;
    const blanketRoll = sdf
      .cylinder(0.064, 0.4, 0.035)
      .paintFn((x, y, z, base) => {
        const rho = Math.hypot(x, z);
        const swirl = Math.sin(rho * 150 + Math.atan2(z, x) * 1.5);
        return Math.abs(y) > 0.185 && swirl > 0.3 ? mixRgb(base, rgb(C.blanketDark), 0.85) : base;
      })
      .rotateZ(90)
      .at(0, BLANKET_Y, PACK.z - 0.01)
      .bone('chest');
    k.body('blanket', blanketRoll, { color: C.blanket, roughness: 0.95, detail: 0.004 });

    // Leather ties around the roll, two straps down the back of the pack, and the shoulder straps.
    const tie = (x: number) => sdf.cylinder(0.068, 0.026, 0.01).rotateZ(90).at(x, BLANKET_Y, PACK.z - 0.01);
    const backStrap = (x: number) => sdf.box([0.03, 0.27, 0.016], 0.006).at(x, PACK.y - 0.02, PACK.z - 0.087);
    const shoulder = (s: 1 | -1) =>
      sdf.chain(
        [
          [s * 0.078, PACK.y + 0.09, PACK.z + 0.05, 0.017],
          [s * 0.08, 0.48, -0.1, 0.017],
          [s * 0.082, 0.5, -0.02, 0.017],
          [s * 0.086, 0.475, 0.06, 0.017],
          [s * 0.084, 0.4, 0.103, 0.017],
          [s * 0.08, 0.31, 0.108, 0.017],
        ],
        0.01,
      );
    const straps = sdf.union(tie(0.085), tie(-0.085), backStrap(0.08), backStrap(-0.08), shoulder(1), shoulder(-1)).bone('chest');
    k.body('straps', straps, { color: C.belt, roughness: 0.75, detail: 0.004 });
    k.body(
      'buckles',
      sdf.union(...[0.08, -0.08].map((x) => sdf.box([0.034, 0.03, 0.012], 0.004).at(x, PACK.y - 0.12, PACK.z - 0.098))).bone('chest'),
      { color: C.brass, roughness: 0.35, metalness: 0.85, detail: 0.003 },
    );

    // ------------------------------------------------------------------ the open map, held between the fists
    const { w, h: mh, t } = MAP;
    const ink = rgb(C.mapLine);
    const mark = rgb(C.mapMark);
    const edge = rgb(C.mapEdge);
    const caret = (x: number, y: number, cx: number, cy: number, s: number) => {
      const dx = Math.abs(x - cx);
      return dx < s && Math.abs(y - cy - (s - dx)) < 0.004;
    };
    const panel = sdf
      .box([w, mh, t], 0.005)
      .paintFn((x, y, _z, base) => {
        if (Math.abs(x) > w / 2 - 0.012 || Math.abs(y) > mh / 2 - 0.01) return mixRgb(base, edge, 0.9);
        if (Math.abs(x) < 0.003) return mixRgb(base, edge, 0.8); // the fold
        const road = y - (-0.025 + 0.028 * Math.sin(x * 30));
        if (Math.abs(road) < 0.0045 && Math.sin(x * 170) > -0.3) return ink;
        const coast = Math.hypot(x - 0.06, y - 0.035);
        if (Math.abs(coast - 0.04) < 0.0042 && x - 0.06 < 0.02) return ink;
        if (caret(x, y, -0.075, 0.025, 0.026) || caret(x, y, -0.04, 0.03, 0.018) || caret(x, y, -0.1, 0.012, 0.014)) return ink;
        const ux = x - 0.075;
        const uy = y + 0.04;
        if (Math.max(Math.abs(ux), Math.abs(uy)) < 0.017 && (Math.abs(ux - uy) < 0.0055 || Math.abs(ux + uy) < 0.0055)) return mark;
        return base;
      })
      .rotateX(MAP.tilt)
      .at(MAP.x, MAP.y, MAP.z)
      .bone('hand.R');
    // Rolled curls at the left and right edges, where the fists grip.
    const grip = (x: number) =>
      sdf
        .cylinder(0.014, mh + 0.016, 0.006)
        .at(x, 0, 0)
        .rotateX(MAP.tilt)
        .at(MAP.x, MAP.y, MAP.z)
        .bone('hand.R');
    k.body('map', sdf.smoothUnion(0.006, panel, grip(w / 2), grip(-w / 2)), { color: C.map, roughness: 0.9, detail: 0.003, textureDensity: 2 });
  },
});
