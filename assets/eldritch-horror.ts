import { motion, profile, sdf } from '../src/index.js';
import { slimeAsset } from './parts/slime-kind.js';

/**
 * Eldritch horror — Chibi Quest monster (catalog `monsters/abyssal-and-cosmic/eldritch-horror`), a
 * squat purple blob about 0.7 m tall with a brain-like orb on top, faces +Z. Target:
 * docs/monster-mockups/eldritch-horror_001.jpg (made with mmx from the green slime mockup).
 *
 * The slime of `assets/parts/slime-kind.ts` (dome, belly, puddle, brow ridges, rig, and clips) with
 * a matte purple skin: dark hollow eyes set deep in raised sockets, a wide open maw with a thick lip,
 * a green throat, and white teeth above and below; nine thick tentacles that spread from the base;
 * small studs all over; a round orb on top (the crown bone); and no floating bubbles.
 * Role: a creeping horror of the abyss; the orb, the tentacles, and the toothy maw read at 128 px.
 * Palette (60/30/10): purple #7a4cc0 (lighter top, darker base); near-black eyes; a green throat
 *   #6aa030 and white teeth as the accent.
 * Bodies added: tentacles, studs, sockets, lip, throat, teeth, orb (on the crown bone).
 */

type V3 = [number, number, number];
const DEG = 180 / Math.PI;

/** Point `s` (built facing +Z at the origin) along the normal `n` and move it to `p`. */
const facing = (s: sdf.Shape, n: readonly number[], p: V3) => s.rotateX(-Math.asin(n[1]!) * DEG).rotateY(Math.atan2(n[0]!, n[2]!) * DEG).at(...p);

/** Studs: a low dome with a small knob, half sunk at each point. */
const studsAt = (points: V3[], r: number) => sdf.union(...points.map((p) => sdf.union(sdf.sphere(r).at(...p), sdf.sphere(r * 0.45).at(p[0], p[1] + r * 0.6, p[2]))));

export default slimeAsset({
  name: 'eldritch-horror',
  description: 'Chibi eldritch horror monster: a squat matte purple blob with a round orb on top, dark hollow eyes in raised sockets, a wide toothy maw with a green throat, small studs all over, and nine thick tentacles spreading from its base.',
  reference: 'docs/monster-mockups/eldritch-horror_001.jpg',
  variants: {
    jelly: { purple: '#7a4cc0', teal: '#3a8a8a', crimson: '#a03a4a' },
    highlight: { purple: '#9a74d4', teal: '#62b0aa', crimson: '#c86272' },
    eyes: { green: '#6aa030', orange: '#e07a2a', blue: '#4a8ad0' },
  },
  presets: {
    deep: { jelly: 'teal', highlight: 'teal', eyes: 'orange' },
    blood: { jelly: 'crimson', highlight: 'crimson', eyes: 'blue' },
  },
  matte: true,
  eyes: 'hollow',
  frown: false,
  bubbles: false,
  crown: {
    at: [0, 0.47, 0],
    build(k, s) {
      // A round orb on top of the dome, with a few studs.
      const orb = sdf.ellipsoid([0.185, 0.165, 0.175]).at(0, 0.6, -0.01);
      const on = (x: number, y: number, z: number): V3 => sdf.surfacePoint(orb, [x, y, z], -0.007) as V3;
      const studs = studsAt([on(0.08, 0.6, 0.18), on(-0.15, 0.64, 0.08), on(0.17, 0.56, -0.04), on(-0.04, 0.72, -0.14), on(0.08, 0.74, 0.02)], 0.02);
      k.body('orb', sdf.smoothUnion(0.006, orb, studs), { color: s.tint.jelly, roughness: 0.6, bone: 'crown', detail: 0.004 });
    },
    pose(clip, p) {
      const n = clip === 'walk' ? 2 : 1;
      return { rotate: [3 * motion.wave(p, n, 0.3), 0, 4 * motion.wave(p, n)] };
    },
  },
  extra(k, s) {
    const [ex, ey] = s.eye;
    // Nine thick tentacles from under the rim, spread out on the floor, the tips curled up a little.
    const tentacle = (deg: number, len: number) => {
      const a = deg / DEG;
      const at = (r: number, y: number, rad: number): [number, number, number, number] => [Math.sin(a) * r, y, Math.cos(a) * r * 0.92, rad];
      return sdf.chain([at(0.2, 0.072, 0.072), at(0.33 * len, 0.058, 0.058), at(0.43 * len, 0.044, 0.042), at(0.5 * len, 0.052, 0.028)], 0.02);
    };
    const tentacles = sdf.union(...Array.from({ length: 9 }, (_, i) => tentacle(i * 40 + 20, 1 + 0.06 * Math.sin(i * 2.3))));
    k.body('tentacles', tentacles.bone('core'), { color: s.tint.low, roughness: 0.6, detail: 0.005 });

    // Studs over the dome and the sides.
    const onBody = (x: number, y: number, z: number): V3 => s.surf(x, y, z, -0.008) as V3;
    const studs = studsAt(
      [
        onBody(-0.05, 0.43, 0.14),
        onBody(0.06, 0.42, 0.15),
        onBody(-0.2, 0.36, 0.08),
        onBody(0.21, 0.35, 0.06),
        onBody(-0.26, 0.2, 0.12),
        onBody(0.27, 0.18, 0.12),
        onBody(-0.28, 0.24, -0.06),
        onBody(0.26, 0.3, -0.1),
        onBody(-0.12, 0.38, -0.18),
        onBody(0.1, 0.24, -0.25),
        onBody(-0.2, 0.14, -0.2),
        onBody(0.2, 0.42, -0.04),
      ],
      0.018,
    );
    k.body('studs', studs.bone('top'), { color: s.tint.jelly, roughness: 0.6, detail: 0.004 });

    // Raised sockets around the deep eyes.
    const socket = (x: number) => {
      const p = s.faceHit(x, ey);
      const n = sdf.normalAt(s.body, p);
      return facing(sdf.torus(0.074, 0.016).rotateX(90), n, [p[0] - n[0] * 0.012, p[1] - n[1] * 0.012, p[2] - n[2] * 0.012]);
    };
    k.body('sockets', sdf.union(socket(ex), socket(-ex)).bone('top'), { color: s.tint.jelly, roughness: 0.6, detail: 0.004 });

    // The maw: a green throat as a thin layer on the front, a thick lip around it, and white teeth.
    const MAW_Y = 0.15;
    const outline = profile.polygon(
      [
        [-0.13, 0.045],
        [0, 0.058],
        [0.13, 0.045],
        [0.115, -0.03],
        [0, -0.05],
        [-0.115, -0.03],
      ],
      { smooth: true, samples: 4 },
    );
    const front = sdf.halfSpace([0, 0, -1], -0.12);
    const hole = sdf.extrude(outline, 0.4).at(0, MAW_Y, 0.2);
    const throat = s.body.round(0.002).intersect(hole).intersect(front);
    k.body('throat', throat.bone('top'), { color: s.tint.iris, roughness: 0.5, detail: 0.003 });
    const rim = sdf.extrude(profile.offsetProfile(outline, 0.024), 0.4).at(0, MAW_Y, 0.2).subtract(sdf.extrude(profile.offsetProfile(outline, 0.002), 0.5).at(0, MAW_Y, 0.2));
    const lip = s.body.round(0.018).intersect(rim).intersect(front);
    k.body('lip', lip.bone('top'), { color: s.tint.jelly, roughness: 0.6, detail: 0.004 });
    const tooth = (x: number, y: number, down: boolean) => {
      const p = s.surf(x, y, 0.4, -0.006) as V3;
      return sdf.cone(p, [p[0], p[1] + (down ? -0.042 : 0.036), p[2] + 0.006], 0.016, 0.002);
    };
    const teeth = sdf.union(
      ...[-0.09, -0.054, -0.018, 0.018, 0.054, 0.09].map((x) => tooth(x, MAW_Y + 0.05 - 0.6 * x * x, true)),
      ...[-0.072, -0.036, 0, 0.036, 0.072].map((x) => tooth(x, MAW_Y - 0.04 + 0.5 * x * x, false)),
    );
    k.body('teeth', teeth.bone('top'), { color: '#f4f0e2', roughness: 0.35, detail: 0.003 });
  },
});
