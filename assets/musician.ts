import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Musician — Chibi Quest settlement NPC (catalog `npcs/settlement/musician`), about 1.0 m to the top
 * of the beret, faces +Z. Target: docs/npc-mockups/musician_001.jpg. Built on the humanoid kind
 * (worked example: assets/baker.ts).
 *
 * Role: a town and tavern NPC who plays music; seen in 3D and as a 128 px sprite. The little wooden
 *   fiddle under the chin, the bow, the long red hair, and the tilted green beret must read.
 * One idea: a joyful girl in a floppy green beret with a long feather, long wavy copper hair, and a
 *   wooden fiddle on her shoulder with a bow drawn across it.
 * Shape language: round and soft (hair, beret, puffed sleeves, pleated skirt), with the bow and the
 *   fiddle neck as the thin hard forms.
 * Palette (60/30/10): hair #b0482a and vest #b03a3a (cloth slot) with #e0b040 stripes; blouse #f0ead8;
 *   beret #3f6a44; skirt #7a5a3a; shoes #5a3a24; fiddle #a8602a on a #3a2a20 fingerboard.
 * Value plan: the dark green beret over the light face and the copper hair is the focal point; the
 *   cream blouse frames the red vest; the fiddle is the warm accent against the cream sleeves.
 * Bodies: skin, beret, feather, hair, blouse, cuffs, vest, skirt, stockings, shoes, fiddle, fingerboard,
 *   bow, bowhair.
 * Rig: the humanoid kind's skeleton and clips. Both arms keep the held `pose`; the fiddle is rigid on
 *   `knife.L` and the bow on `knife.R`.
 */

const C = {
  cream: '#f0ead8',
  cuff: '#ddd0b0',
  beret: '#566b3c',
  feather: '#a8502c',
  leaf: '#efe2c4',
  gold: '#e0b040',
  skirt: '#7a5a3a',
  skirtDark: '#5f4428',
  shoe: '#5a3a24',
  sole: '#33211a',
  fiddle: '#c0702e',
  fiddleDark: '#6a3a18',
  fiddleRim: '#8a4a1c',
  strings: '#cbb98a',
  board: '#3a2a20',
  bow: '#6b4226',
  bowHair: '#f0ead8',
};

type V3 = readonly [number, number, number];

export default humanoidAsset({
  name: 'musician',
  description: 'A joyful young street musician in a feathered green beret and a striped red vest, playing a little wooden fiddle with a bow.',
  reference: 'docs/npc-mockups/musician_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { copper: '#b0482a', brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { scarlet: '#b03a3a', wine: '#7a2f3f', rust: '#b8693a', plum: '#6a3f7a' },
  },
  presets: {
    street: { skin: 'fair', hair: 'copper', eyes: 'brown', cloth: 'scarlet' },
    dusk: { skin: 'tan', hair: 'black', eyes: 'green', cloth: 'plum' },
  },
  // The fiddle rests on the left shoulder under the chin: the left forearm rises to the neck out at
  // the side, and the right fist draws the bow across the strings in front of the chest.
  pose: {
    L: { elbow: [0.2, 0.335, 0.01], wrist: [0.235, 0.38, 0.1] },
    R: { elbow: [0.09, 0.37, 0.095], wrist: [0.03, 0.4, 0.19] },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,

  // The mockup's face: open brown eyes, high arched brows, and a small happy smile.
  paintSkin(skin, h) {
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.034, 56, 124), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.06, 0.012, 62, 118), 0.3).at(0.1, 0.664, 0.1).mirror('x');
    const smile = sdf.extrude(profile.arc(0.064, 0.0125, 229, 311), 0.3).at(0, 0.543 + 0.064, 0.1);
    // The kind's smile arc is covered with skin first: two arcs read as a squiggle.
    const oldSmile = sdf.extrude(profile.arc(0.07, 0.018, 236, 304), 0.3).at(0, 0.6, 0.1);
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(oldSmile, h.tint.skin!, 0.002)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(smile, h.tint.mouth!, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const rad = Math.PI / 180;
    const redTint = h.tint.shirt ?? '#b03a3a';
    const hairColor = k.tint('hair');

    // ------------------------------------------------------------------ the tilted green beret
    const beretPose = (s: sdf.Shape) => s.rotateX(-9).rotateZ(12).at(0, HEAD_Y, 0);
    const disc = sdf.smoothUnion(
      0.04,
      sdf.ellipsoid([0.25, 0.09, 0.235]).at(-0.01, 0.15, -0.005),
      sdf.sphere(0.105).at(-0.13, 0.12, -0.005), // the soft fold over the right temple
    );
    const cover = sdf.ellipsoid([0.235, 0.222, 0.215]).at(0, 0.008, -0.005).intersect(sdf.halfSpace([0, -1, 0], -0.078));
    const beretSolid = beretPose(sdf.smoothUnion(0.03, disc, cover));
    k.body('beret', beretSolid.bone('head'), {
      color: C.beret,
      roughness: 0.9,
      detail: 0.005,
      bump: (x, y, z) => 0.003 * Math.sin(x * 55 + z * 35) * Math.cos(y * 45),
    });

    // Small feathers tucked into the right fold of the beret: two red-brown ones and a cream one.
    const featherPose = (s: sdf.Shape) => beretPose(s);
    const plume = (x: number, y: number, tilt: number, len: number, w: number) =>
      sdf
        .smoothUnion(
          0.006,
          sdf.ellipsoid([w, len, 0.008]).at(0, len * 0.8, 0),
          sdf.capsule([0, -0.02, 0], [0, len * 1.4, 0], 0.007),
        )
        .rotateZ(tilt)
        .at(x, y, 0.035);
    const feather = sdf.smoothUnion(0.004, plume(-0.215, 0.12, 26, 0.105, 0.03), plume(-0.2, 0.135, 8, 0.085, 0.025));
    const leaf = plume(-0.225, 0.1, 58, 0.065, 0.021);
    k.body('feather', featherPose(feather).bone('head'), { color: C.feather, roughness: 0.8, detail: 0.003 });
    k.body('leaf', featherPose(leaf).bone('head'), { color: C.leaf, roughness: 0.8, detail: 0.003 });

    // ------------------------------------------------------------------ long wavy copper hair: locks
    const hp = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);
    const lockW = (pts: number[][], r = 0.02) => sdf.chain(pts.map((p) => [p[0]!, p[1]!, p[2]!, p[3]!]) as [number, number, number, number][], r);
    const hairCap = hp(
      sdf
        .ellipsoid([0.217, 0.212, 0.202])
        .at(0, 0.004, -0.008)
        .smoothIntersect(0.03, sdf.halfSpace([0, -1, 0], 0.12))
        .smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], 0.055)),
    );
    // Locks beside the face, over the ears, ending at the chin.
    const temples = pair(sdf.union(sdf.sphere(0.06).at(0.17, 0.085, 0.06), sdf.sphere(0.045).at(0.19, 0.04, 0.045))).intersect(sdf.halfSpace([0, -1, 0], 0.12));
    const sideLock = (s: 1 | -1) =>
      lockW(
        [
          [0.19 * s, 0.745, 0.04, 0.034],
          [0.2 * s, 0.67, 0.045, 0.03],
          [0.19 * s, 0.6, 0.06, 0.028],
          [0.186 * s, 0.53, 0.062, 0.026],
          [0.196 * s, 0.47, 0.06, 0.018],
        ],
        0.012,
      );
    // Back hair (review 3: the separate locks read as drips): one smooth sheet behind the head and
    // shoulders, with broad S-waves across it and a wavy lower edge at the shoulder blades.
    const sheet = sdf
      .smoothUnion(0.05, sdf.ellipsoid([0.2, 0.15, 0.08]).at(0, 0.6, -0.15), sdf.ellipsoid([0.205, 0.12, 0.07]).at(0, 0.45, -0.165))
      .smoothIntersect(0.03, sdf.halfSpace([0, -1, 0], -0.37).displace(0.028, (x) => Math.sin(x * 30 + 0.5)))
      .displace(0.006, (x, y) => Math.sin(x * 32 + 1.6 * Math.sin(y * 16)));
    const backLocks = [sheet];
    // The fringe: two broad swept locks across the forehead under the beret, with curled tips.
    const fz = (x: number, y: number) => {
      const p = sdf.raycast(h.head, [x, y, 1], [0, 0, -1]);
      return (p ? p[2] : 0.12) + 0.014;
    };
    const fringeA = lockW(
      [
        [0.06, 0.8, fz(0.06, 0.8), 0.04],
        [0.0, 0.76, fz(0, 0.76), 0.036],
        [-0.09, 0.735, fz(-0.09, 0.735), 0.034],
        [-0.17, 0.7, fz(-0.17, 0.7), 0.028],
        [-0.19, 0.64, fz(-0.19, 0.64) + 0.02, 0.02],
      ],
      0.012,
    );
    const fringeB = lockW(
      [
        [0.04, 0.8, fz(0.04, 0.8), 0.04],
        [0.1, 0.765, fz(0.1, 0.765), 0.036],
        [0.17, 0.73, fz(0.17, 0.73), 0.032],
        [0.2, 0.68, fz(0.2, 0.68) + 0.01, 0.026],
        [0.205, 0.62, fz(0.2, 0.62) + 0.02, 0.018],
      ],
      0.012,
    );
    const hairSolid = sdf
      .smoothUnion(0.02, hairCap, hp(temples), sideLock(1), sideLock(-1), fringeA, fringeB, ...backLocks)
      .subtract(beretSolid.round(0.003));
    k.body('hair', hairSolid.bone('head'), { color: hairColor, roughness: 0.6, detail: 0.005 });

    // ------------------------------------------------------------------ cream blouse with puffed sleeves
    const sleeves = h.perArm((j) => {
      const puff = lerp(SHOULDER, j.ELBOW, 0.42);
      return sdf.smoothUnion(
        0.02,
        sdf.sphere(0.052).at(puff[0], puff[1], puff[2]).bone('upperarm.L'),
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.046, 0.044).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.92), 0.046, 0.041).bone('forearm.L'),
      );
    });
    const blouseTorso = h.torso.round(-0.002).intersect(h.band(0.2, 0.5));
    // A short peplum that flares over the skirt waist, under the vest hem.
    const peplum = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.292],
            [0.132, 0.292],
            [0.148, 0.262],
            [0.158, 0.236],
            [0, 0.236],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.84]);
    k.body('blouse', sdf.smoothUnion(0.012, h.weighted(blouseTorso), h.weighted(peplum), sleeves), { color: C.cream, roughness: 0.85, detail: 0.005 });
    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.7), lerp(j.ELBOW, j.WRIST, 1.0), 0.043, 0.042).round(0.003).bone('forearm.L'));
    const collar = sdf.torus(0.06, 0.017).at(0, 0.452, -0.012).bone('chest');
    k.body('cuffs', sdf.union(cuffs, collar), { color: C.cuff, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ red vest with gold stripes
    const shell = h.torso.round(0.014).subtract(h.torso.round(0.0));
    const armholes = h.perArm((j) => sdf.sphere(0.075).at(lerp(SHOULDER, j.ELBOW, 0.42)[0], lerp(SHOULDER, j.ELBOW, 0.42)[1], lerp(SHOULDER, j.ELBOW, 0.42)[2]));
    const neckCut = sdf.ellipsoid([0.05, 0.07, 0.2]).at(0, 0.44, 0.1);
    let vest = shell.intersect(h.band(0.268, 0.432)).subtract(armholes).subtract(neckCut);
    const stripes = sdf.union(...[-0.095, -0.045, 0.045, 0.095].map((x) => sdf.box([0.012, 0.5, 1]).at(x, 0.35, 0)));
    const trims = sdf.union(h.band(0.268, 0.28), h.band(0.42, 0.436));
    vest = vest.paintWhere(stripes, C.gold, 0.002).paintWhere(trims, C.gold, 0.002);
    k.body('vest', h.weighted(vest), { color: redTint, roughness: 0.8, detail: 0.004 });

    // ------------------------------------------------------------------ short pleated brown skirt
    const folds = (x: number, y: number, z: number) => 0.005 * Math.sin(Math.atan2(z, x) * 10) * Math.min(1, Math.max(0, (0.25 - y) / 0.09));
    const skirt = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.262],
            [0.136, 0.262],
            [0.15, 0.22],
            [0.178, 0.165],
            [0, 0.165],
          ],
          { smooth: false },
        ),
      )
      .scale([1, 1, 0.9])
      .paintWhere(h.band(0.23, 0.27), C.skirtDark, 0.004);
    k.body('skirt', skirt.bone('hips'), { color: C.skirt, roughness: 0.85, detail: 0.006, bump: folds });

    // ------------------------------------------------------------------ striped stockings and ankle boots
    const stockLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.046).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.1, 0.002], 0.044, 0.041).bone('shin.L'),
    );
    const bandAt = (y: number) => h.band(y, y + 0.009);
    const redBands = sdf.union(...[0.092, 0.11, 0.128, 0.146].map(bandAt));
    k.body('stockings', pair(stockLeg).paintWhere(redBands, redTint, 0.0015), { color: C.cream, roughness: 0.85, detail: 0.004 });
    const boot = sdf
      .smoothUnion(
        0.025,
        sdf.cone([0, 0.1, 0.002], [0, 0.05, 0.002], 0.045, 0.042).bone('shin.L'),
        sdf.ellipsoid([0.045, 0.036, 0.084]).at(0, 0.036, 0.036),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const bootPosed = boot.rotateY(10).at(ANKLE[0], 0, 0).bone('foot.L').paintWhere(h.band(-0.2, 0.016), C.sole, 0.002);
    k.body('shoes', pair(bootPosed), { color: C.shoe, roughness: 0.65 });

    // ------------------------------------------------------------------ the fiddle (left fist) and the bow (right fist)
    const GL = h.arms.L.GRIP;
    const GR: V3 = [-h.arms.R.GRIP[0], h.arms.R.GRIP[1], h.arms.R.GRIP[2]];
    // The fiddle's axis runs from the chin rest to the fist, then on to the scroll (local +Z).
    const chin: V3 = [0.15, 0.4, 0.15]; // the lower bout on the left shoulder, under the jaw (review 3)
    const dv: V3 = [GL[0] - chin[0], GL[1] - chin[1], GL[2] - chin[2]];
    const dl = Math.hypot(...dv);
    const d: V3 = [dv[0] / dl, dv[1] / dl, dv[2] / dl];
    const yawF = Math.atan2(d[0], d[2]) / rad;
    const pitchF = -Math.asin(d[1]) / rad;
    // local frame (origin at the fist): +Z along the neck to the scroll, -X is the face of the plate, +Y is the width.
    // Full size (review 3: the small fiddle read as a stick); the roll turns the plate face up and
    // a little toward the viewer, so the figure-eight outline reads.
    // The fist holds the neck near its heel (local z -0.03), so the tail end stays clear of the chin.
    const FS = 1.0;
    const ROLL = -45;
    const GZ = 0.03;
    const fiddleAt = (s: sdf.Shape) => s.at(0, 0, GZ).scale(FS).rotateZ(ROLL).rotateX(pitchF).rotateY(yawF).at(GL[0], GL[1], GL[2]);
    const toWorld = (p0: V3, yaw: number, pitch: number, o: V3): V3 => {
      const cz = Math.cos(ROLL * rad);
      const sz = Math.sin(ROLL * rad);
      const p: V3 = [FS * (p0[0] * cz - p0[1] * sz), FS * (p0[0] * sz + p0[1] * cz), FS * (p0[2] + GZ)];
      const cx = Math.cos(pitch * rad);
      const sx = Math.sin(pitch * rad);
      const y1 = p[1] * cx - p[2] * sx;
      const z1 = p[1] * sx + p[2] * cx;
      const cy = Math.cos(yaw * rad);
      const sy = Math.sin(yaw * rad);
      return [p[0] * cy + z1 * sy + o[0], y1 + o[1], -p[0] * sy + z1 * cy + o[2]];
    };

    // A figure-eight body 0.18 m long (two bouts and a waist), a neck, a pegbox, and a scroll.
    // Two bouts with a clear waist between them.
    const lower = sdf.ellipsoid([0.028, 0.064, 0.06]).at(0, 0, -0.17);
    const upper = sdf.ellipsoid([0.028, 0.052, 0.048]).at(0, 0, -0.075);
    const bodyShape = sdf.smoothUnion(0.006, lower, upper);
    const neck = sdf.capsule([0, 0, -0.04], [0, 0, 0.075], 0.016);
    const pegbox = sdf.box([0.028, 0.03, 0.05], 0.008).at(0, 0, 0.09);
    const scroll = sdf.sphere(0.023).at(0, 0, 0.128).smoothUnion(0.008, sdf.sphere(0.016).at(-0.012, 0.016, 0.114));
    const pegs = sdf.union(...[-1, 1].flatMap((s) => [0.08, 0.1].map((z) => sdf.sphere(0.009).at(0.022 * s, 0.014 * s, z))));
    const darkParts = sdf.union(neck, pegbox, scroll, pegs);
    const rim = bodyShape.round(0.002).subtract(bodyShape.round(-0.006).scale([0.98, 1, 1]).at(-0.012, 0, 0)); // a darker outer rim on the plate side
    const wood = sdf
      .smoothUnion(0.01, bodyShape, darkParts)
      .paintWhere(darkParts.subtract(bodyShape.round(0.004)), C.fiddleDark, 0.004)
      .paintWhere(rim, C.fiddleRim, 0.003)
      // The f-holes are paint on the top plate (boxes stood off the curved plate as dark sticks).
      .paintWhere(sdf.union(...[-1, 1].map((s) => sdf.box([0.06, 0.007, 0.04], 0.002).at(-0.03, 0.033 * s, -0.13))), C.board, 0.002);
    k.body('fiddle', fiddleAt(wood).bone('knife.L'), {
      color: C.fiddle,
      roughness: 0.4,
      detail: 0.003,
      bump: (x, y, z) => 0.0012 * Math.sin(z * 120 + Math.sin(y * 40)),
    });
    // The dark fingerboard and tailpiece, and the pale strings with the bridge.
    const board = sdf.box([0.012, 0.026, 0.2], 0.004).at(-0.036, 0, -0.01);
    const tail = sdf.box([0.01, 0.028, 0.05], 0.004).at(-0.031, 0, -0.21);
    k.body('fingerboard', fiddleAt(sdf.union(board, tail)).bone('knife.L'), { color: C.board, roughness: 0.5, detail: 0.003 });
    const bridge = sdf.box([0.016, 0.042, 0.008], 0.003).at(-0.037, 0, -0.148);
    const strings = sdf.box([0.005, 0.012, 0.235], 0.002).at(-0.046, 0, -0.0325);
    k.body('strings', fiddleAt(sdf.union(strings, bridge)).bone('knife.L'), { color: C.strings, roughness: 0.4, detail: 0.003 });

    // The bow: a thin stick with a pale hair ribbon; its hair meets the strings in front of the plate.
    const contact = toWorld([-0.055, 0, -0.112], yawF, pitchF, GL);
    const bv: V3 = [contact[0] - GR[0], contact[1] - GR[1], contact[2] - GR[2]];
    const bl = Math.hypot(...bv);
    const bd: V3 = [bv[0] / bl, bv[1] / bl, bv[2] / bl];
    const yawB = Math.atan2(bd[0], bd[2]) / rad;
    const pitchB = -Math.asin(bd[1]) / rad;
    // The fist holds the stick a little ahead of the frog, so the tip stays clear of the head.
    const slide = 0.0;
    const bowAt = (s: sdf.Shape) => s.rotateX(pitchB).rotateY(yawB).at(GR[0] - slide * bd[0], GR[1] - slide * bd[1], GR[2] - slide * bd[2]);
    // The stick ends 6 cm past the strings.
    const BL = bl + 0.06;
    const stick = sdf.capsule([0, 0.02, -0.06], [0, 0.02, BL], 0.0075);
    const frog = sdf.box([0.026, 0.044, 0.05], 0.01).at(0, 0.008, -0.04);
    const tipBlock = sdf.box([0.016, 0.036, 0.02], 0.006).at(0, 0.006, BL - 0.005);
    k.body('bow', bowAt(sdf.smoothUnion(0.008, stick, frog, tipBlock)).bone('knife.R'), { color: C.bow, roughness: 0.55, detail: 0.003 });
    const hairRibbon = sdf.box([0.01, 0.01, BL + 0.02], 0.003).at(0, -0.006, (BL - 0.06) / 2);
    k.body('bowhair', bowAt(hairRibbon).bone('knife.R'), { color: C.bowHair, roughness: 0.8, detail: 0.003 });
  },
});
