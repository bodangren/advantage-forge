import { defineAsset, mixRgb, motion, noise, rgb, sdf } from '../src/index.js';

/**
 * Horned boar: a chunky forest monster. Heavy front, small hind end, big head with tusks and swept
 * horns, a bristle mane along the spine, glowing eyes. Quadruped rig with walk, idle, and charge.
 * About 0.95 m long, 0.62 m to the top of the horns, facing +Z.
 */

const C = {
  fur: '#6e3f28',
  furDark: '#3c2116',
  belly: '#a87650',
  snout: '#c7917b',
  nostril: '#3a1e18',
  tusk: '#efe4c9',
  horn: '#3b302a',
  hornTip: '#b9ab94',
  hoof: '#2a211d',
  mane: '#2a1710',
  eye: '#ff5a2a',
};

const pair = (s: sdf.Shape) => s.mirror('x');

// Joint positions (rest pose). Short, thick legs keep the body low and heavy.
const SHOULDER = [0.15, 0.32, 0.2] as const;
const FKNEE = [0.155, 0.16, 0.22] as const;
const HIP = [0.14, 0.32, -0.26] as const;
const BKNEE = [0.145, 0.16, -0.29] as const;

export default defineAsset({
  name: 'horned-boar',
  description: 'Chunky horned boar monster with tusks, bristle mane, and glowing eyes; quadruped rig.',
  detail: 0.006,

  build(k) {
    k.skeleton({
      hips: { at: [0, 0.38, -0.22] },
      spine: { parent: 'hips', at: [0, 0.41, 0.02] },
      neck: { parent: 'spine', at: [0, 0.42, 0.27] },
      head: { parent: 'neck', at: [0, 0.42, 0.36] },
      tail: { parent: 'hips', at: [0, 0.43, -0.42] },
      'fleg.L': { parent: 'spine', at: SHOULDER },
      'fshin.L': { parent: 'fleg.L', at: FKNEE },
      'fleg.R': { parent: 'spine', at: [-SHOULDER[0], SHOULDER[1], SHOULDER[2]] },
      'fshin.R': { parent: 'fleg.R', at: [-FKNEE[0], FKNEE[1], FKNEE[2]] },
      'bleg.L': { parent: 'hips', at: HIP },
      'bshin.L': { parent: 'bleg.L', at: BKNEE },
      'bleg.R': { parent: 'hips', at: [-HIP[0], HIP[1], HIP[2]] },
      'bshin.R': { parent: 'bleg.R', at: [-BKNEE[0], BKNEE[1], BKNEE[2]] },
    });

    // ------------------------------------------------------------------ body: heavy chest, small rump
    const chest = sdf.smoothUnion(
      0.08,
      sdf.ellipsoid([0.26, 0.24, 0.28]).at(0, 0.4, 0.07),
      sdf.ellipsoid([0.21, 0.17, 0.17]).at(0, 0.52, 0.13), // shoulder hump
    );
    const rump = sdf.ellipsoid([0.19, 0.18, 0.22]).at(0, 0.38, -0.2);
    const neck = sdf.ellipsoid([0.17, 0.16, 0.14]).at(0, 0.41, 0.3);

    // Head held low: a wedge that narrows into a flat snout disc.
    const skull = sdf.smoothUnion(
      0.06,
      sdf.ellipsoid([0.16, 0.15, 0.16]).at(0, 0.42, 0.42),
      sdf.cone([0, 0.38, 0.46], [0, 0.32, 0.63], 0.12, 0.08),
    );
    const snoutDisc = sdf.cylinder(0.082, 0.05, 0.02).rotateX(90).at(0, 0.32, 0.65);
    const headBase = sdf.smoothUnion(0.03, skull, snoutDisc);

    // Details are placed on the modeled surface by probing it, not by guessing coordinates.
    const eyeHit = sdf.raycast(headBase, [0.075, 0.46, 2], [0, 0, -1])!;
    const eyeNormal = sdf.normalAt(headBase, eyeHit);
    const eyePos = [eyeHit[0] - eyeNormal[0] * 0.006, eyeHit[1], eyeHit[2] - eyeNormal[2] * 0.006] as const;
    // Heavy, angry brow: slanted down toward the snout.
    const brow = pair(
      sdf
        .ellipsoid([0.055, 0.022, 0.04])
        .rotateZ(24)
        .at(eyePos[0] + 0.006, eyePos[1] + 0.03, eyePos[2] - 0.004),
    );
    const ears = pair(
      sdf
        .ellipsoid([0.04, 0.08, 0.024])
        .subtract(sdf.ellipsoid([0.026, 0.058, 0.02]).at(0, 0.005, 0.016))
        .rotate(-20, 0, -60)
        .at(0.15, 0.51, 0.33),
    );
    const head = sdf.smoothUnion(0.02, headBase, brow, ears);

    // Legs: thick at the top, tapering to the hoof.
    const leg = (
      hip: readonly [number, number, number],
      knee: readonly [number, number, number],
      upper: string,
      lower: string,
    ) =>
      sdf.smoothUnion(
        0.03,
        sdf.cone(hip, knee, 0.1, 0.066).bone(upper),
        sdf.cone(knee, [knee[0], 0.05, knee[2] + 0.01], 0.066, 0.055).bone(lower),
      );
    const legs = sdf.union(
      pair(leg(SHOULDER, FKNEE, 'fleg.L', 'fshin.L')),
      pair(leg(HIP, BKNEE, 'bleg.L', 'bshin.L')),
    );
    const tail = sdf
      .chain(
        [
          [0, 0.43, -0.4, 0.028],
          [0, 0.4, -0.47, 0.02],
          [0.02, 0.34, -0.48, 0.014],
          [0.035, 0.33, -0.44, 0.01],
        ],
        0.015,
      )
      .bone('tail');

    // Fur: stroked along the body, darker legs, paler belly, pink snout with nostrils.
    const trunk = sdf.smoothUnion(
      0.07,
      chest.bone('spine'),
      rump.bone('hips'),
      neck.bone('neck'),
      head.bone('head'),
    );
    const fur = trunk
      .smoothUnion(0.035, legs)
      .smoothUnion(0.02, tail)
      .displace(0.004, (x, y, z) => noise.fbm(x * 40, y * 40, z * 10, 3))
      .paintFn((x, y, z, base) =>
        mixRgb(base, rgb(C.furDark), 0.35 * (0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 6, 2))),
      )
      .paintWhere(sdf.ellipsoid([0.2, 0.09, 0.38]).at(0, 0.2, -0.02), C.belly, 0.05)
      .paintWhere(legs.intersect(sdf.halfSpace([0, 1, 0], 0.24)), C.furDark, 0.04)
      .paintWhere(snoutDisc.round(0.004).intersect(sdf.halfSpace([0, 0, -1], -0.63)), C.snout, 0.008)
      .paintWhere(pair(sdf.ellipsoid([0.015, 0.024, 0.05]).at(0.03, 0.32, 0.68)), C.nostril);
    k.body('fur', fur, { color: C.fur, roughness: 0.85, textureDensity: 1.3 });

    // Hooves: split, dark, glossy.
    const hoof = (at: readonly [number, number, number], bone: string) =>
      sdf
        .cylinder(0.06, 0.07, 0.015)
        .subtract(sdf.box([0.012, 0.1, 0.08]).at(0, -0.02, 0.055)) // cloven front
        .at(at[0], 0.035, at[2] + 0.012)
        .bone(bone);
    const hooves = sdf.union(pair(hoof(FKNEE, 'fshin.L')), pair(hoof(BKNEE, 'bshin.L')));
    k.body('hooves', hooves, { color: C.hoof, roughness: 0.4 });

    // Bristle mane: spikes rooted on the actual back line, tallest over the shoulder hump.
    const spikes = Array.from({ length: 13 }, (_, i) => {
      const t = i / 12;
      const z = 0.36 - t * 0.66;
      const root = sdf.raycast(trunk, [0, 2, z], [0, -1, 0])!;
      const h = 0.05 + 0.1 * Math.max(0, 1 - Math.abs(t - 0.3) * 1.6);
      const bone = z > 0.3 ? 'head' : z > 0.2 ? 'neck' : z > -0.1 ? 'spine' : 'hips';
      return sdf
        .cone([root[0], root[1] - 0.03, root[2]], [root[0], root[1] + h, root[2] - 0.06], 0.034, 0.005)
        .rotateZ((noise.random(i, 9) - 0.5) * 16)
        .bone(bone);
    });
    k.body('mane', sdf.smoothUnion(0.02, ...spikes), { color: C.mane, roughness: 0.9 });

    // Tusks and horns: ivory and horn with a pale tip. Horns sweep out, then forward like a bull.
    const tusks = pair(
      sdf.chain(
        [
          [0.06, 0.29, 0.58, 0.022],
          [0.105, 0.3, 0.66, 0.017],
          [0.12, 0.38, 0.69, 0.006],
        ],
        0.01,
      ),
    );
    k.body('tusks', tusks, { color: C.tusk, roughness: 0.35, bone: 'head' });
    const hornRoot = sdf.raycast(headBase, [0.085, 2, 0.4], [0, -1, 0])!;
    const [hx, hy, hz] = hornRoot;
    const horns = pair(
      sdf
        .chain(
          [
            [hx, hy - 0.03, hz, 0.05],
            [hx + 0.08, hy + 0.09, hz - 0.03, 0.038],
            [hx + 0.16, hy + 0.15, hz + 0.03, 0.025],
            [hx + 0.18, hy + 0.16, hz + 0.13, 0.01],
          ],
          0.02,
        )
        .displace(0.003, (x, y, z) => Math.sin((x + y) * 160)) // growth rings
        .paintFn((x, _y, _z, base) =>
          mixRgb(base, rgb(C.hornTip), Math.max(0, Math.min(1, (x - 0.19) / 0.07))),
        ),
    );
    k.body('horns', horns, { color: C.horn, roughness: 0.5, bone: 'head' });

    // Glowing eyes, set into the surface under the brow.
    const eyes = pair(
      sdf
        .ellipsoid([0.03, 0.021, 0.016])
        .rotateY(25)
        .at(...eyePos),
    );
    k.body('eyes', eyes, {
      color: C.eye,
      roughness: 0.2,
      emissive: C.eye,
      emissiveIntensity: 2.2,
      bone: 'head',
    });

    // ------------------------------------------------------------------ animation
    const { wave, bump } = motion;

    // Trot: diagonal pairs move together (front-left with back-right).
    const gait = (duration: number, swing: number, lift: number, bob: number, headDip: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const a = wave(p); // +1: front-left forward
        const liftA = Math.max(0, wave(p, 1, 0.25)); // raise the pair that is swinging forward
        const liftB = Math.max(0, -wave(p, 1, 0.25));
        return {
          hips: { move: [0, -bob * bump(p, 2), 0] as const, rotate: [0, 0, 3 * a] as const },
          spine: { rotate: [2 * wave(p, 2), 0, -3 * a] as const },
          neck: { rotate: [headDip, 0, 0] as const },
          head: { rotate: [-4 * wave(p, 2, 0.25), 4 * a, 0] as const },
          tail: { rotate: [10 * wave(p, 2), 25 * wave(p, 2, 0.1), 0] as const },
          'fleg.L': { rotate: [-swing * a, 0, 0] as const },
          'bleg.R': { rotate: [-swing * a, 0, 0] as const },
          'fleg.R': { rotate: [swing * a, 0, 0] as const },
          'bleg.L': { rotate: [swing * a, 0, 0] as const },
          'fshin.L': { rotate: [lift * liftA, 0, 0] as const },
          'bshin.R': { rotate: [-lift * liftA, 0, 0] as const },
          'fshin.R': { rotate: [lift * liftB, 0, 0] as const },
          'bshin.L': { rotate: [-lift * liftB, 0, 0] as const },
        };
      },
    });
    k.animation('walk', gait(0.8, 22, 35, 0.012, 0));
    k.animation('charge', gait(0.45, 38, 60, 0.03, 14));
    k.animation('idle', {
      duration: 3,
      pose: (_t, p) => ({
        spine: { move: [0, 0.004 * bump(p, 2), 0] },
        neck: { rotate: [4 * bump(p), 6 * wave(p, 1, 0.2), 0] },
        head: { rotate: [-6 * Math.max(0, wave(p, 3)) * bump(p), 0, 3 * wave(p)] }, // sniffing
        tail: { rotate: [0, 30 * wave(p, 4), 0] },
      }),
    });
  },
});
