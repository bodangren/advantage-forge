import { motion, profile, sdf } from '../src/index.js';
import { spiderAsset } from './parts/spider-kind.js';

/**
 * Giant crab — Chibi Quest monster (catalog `monsters/beast/giant-crab`), about 0.85 m to the tips
 * of its raised claws, faces +Z. Target: docs/monster-mockups/giant-crab_001.jpg (made with mmx from
 * the giant spider mockup).
 *
 * The giant spider (`assets/giant-spider.ts`; thorax, eight legs, rig, and clips from
 * `assets/parts/spider-kind.ts`) as a giant crab: the head is a wide, low red dome (the shell) with a
 * cream underside; no abdomen, fangs, leg bands, chest mark, or web spit; a grumpy face painted on
 * the shell front (two dot eyes and a flat mouth); two white eyeballs on stalks on top; and two big
 * claws raised on arms (the outer finger of each claw opens on its own bone).
 * Role: a beach and sea-cave enemy; the raised claws and the eye stalks read at 128 px.
 * Palette (60/30/10): red #e8503a; cream underside #f4e4c8; dark leg tips; white eyeballs with
 *   black pupils as the accent.
 * Bodies added: stalks and eyeballs (rigid on the head), claws (tagged to the arms).
 * Clips: idle (the claws snap), walk, run, attack (the spider's lunge, with the claws swung forward
 *   and snapping), hit, death.
 */

type V3 = [number, number, number];
const mxv = (p: V3): V3 => [-p[0], p[1], p[2]];

// A claw arm (left): the root in the side of the shell, the elbow, and the wrist; the outer finger
// pivots at NIP.
const ARM_ROOT: V3 = [0.22, 0.27, 0.12];
const ARM_ELBOW: V3 = [0.34, 0.39, 0.16];
const ARM_WRIST: V3 = [0.34, 0.51, 0.16];
const NIP: V3 = [0.4, 0.66, 0.16];

export default spiderAsset({
  name: 'giant-crab',
  description: 'Chibi giant crab monster: a wide red shell with a cream underside, a grumpy painted face, two white eyeballs on stalks, two big raised claws, and eight short red legs with dark tips.',
  reference: 'docs/monster-mockups/giant-crab_001.jpg',
  variants: {
    body: { red: '#e8503a', blue: '#3a7ab8', orange: '#e88a2a' },
    markings: { cream: '#f4e4c8', white: '#f8f6f0', sand: '#e8d0a0' },
    eyes: { black: '#1a1416', brown: '#4a2a18', green: '#2a4a20' },
  },
  presets: {
    blue: { body: 'blue', markings: 'white', eyes: 'brown' },
    hermit: { body: 'orange', markings: 'sand', eyes: 'green' },
  },
  colors: { bodyDark: '#b83a2a', claw: '#2a1a1a' },
  head: { size: [0.29, 0.2, 0.23], at: [0, 0.34, 0.1] },
  abdomen: false,
  web: false,
  chestMark: false,
  fangScale: 0,
  bands: 'none',
  face: {
    build(k, s) {
      // Two eyeballs on short stalks on the top of the shell, looking forward.
      const stalk = (x: number) => {
        const t = s.topHit(x, 0.12);
        return { base: t, top: [t[0] + x * 0.15, t[1] + 0.08, t[2] + 0.01] as V3 };
      };
      const L = stalk(0.07);
      const stalks = sdf.capsule([L.base[0], L.base[1] - 0.02, L.base[2]], L.top, 0.022).mirror('x');
      k.body('stalks', s.headPose(stalks), { color: s.tint.body, roughness: 0.6, bone: 'head', detail: 0.004 });
      const c: V3 = [L.top[0], L.top[1] + 0.055, L.top[2]];
      const ball = sdf
        .sphere(0.066)
        .at(...c)
        .paintWhere(sdf.sphere(0.036).at(c[0] - 0.007, c[1] - 0.005, c[2] + 0.054), s.tint.eye, 0.002)
        .paintWhere(sdf.sphere(0.011).at(c[0] + 0.01, c[1] + 0.014, c[2] + 0.065), '#ffffff', 0.002);
      k.body('eyeballs', s.headPose(ball.mirror('x')), { color: '#fbfaf6', roughness: 0.15, bone: 'head', textureDensity: 2, detail: 0.003 });
    },
    paint(carapace, s) {
      // The cream underside below the rim of the shell, and the grumpy face on its front.
      const through = (p: ReturnType<typeof profile.circle>, x: number, y: number) => sdf.extrude(p, 0.2).at(x, y, s.faceHit(Math.abs(x), y)[2]);
      const dots = sdf.union(through(profile.circle(0.026), 0.09, 0.37), through(profile.circle(0.026), -0.09, 0.37));
      const mouth = through(profile.rect([0.12, 0.018], 0.008), 0, 0.3);
      return carapace
        .paintWhere(sdf.halfSpace([0, 1, 0], 0.215), s.tone('markings', '#f4e4c8'), 0.012)
        .paintWhere(s.headPose(sdf.union(dots, mouth)), s.tone('eyes', '#1a1416'), 0.002);
    },
  },
  bones: {
    'arm.L': { parent: 'body', at: ARM_ROOT },
    'claw.L': { parent: 'arm.L', at: ARM_WRIST },
    'nip.L': { parent: 'claw.L', at: NIP, tail: [0.43, 0.78, 0.16] },
    'arm.R': { parent: 'body', at: mxv(ARM_ROOT) },
    'claw.R': { parent: 'arm.R', at: mxv(ARM_WRIST) },
    'nip.R': { parent: 'claw.R', at: mxv(NIP), tail: [-0.43, 0.78, 0.16] },
  },
  extra(k, s) {
    // A claw: an arm in two parts, a big palm with the inner finger, and the outer finger.
    const arm = sdf
      .smoothUnion(
        0.02,
        sdf.chain([[...ARM_ROOT, 0.045], [...ARM_ELBOW, 0.055]], 0.01),
        sdf.chain([[...ARM_ELBOW, 0.055], [...ARM_WRIST, 0.06]], 0.01),
      )
      .bone('arm.L');
    const palm = sdf
      .smoothUnion(
        0.02,
        sdf.ellipsoid([0.11, 0.12, 0.09]).at(0.34, 0.6, 0.16),
        sdf.cone([0.31, 0.68, 0.16], [0.28, 0.83, 0.16], 0.07, 0.03),
      )
      .bone('claw.L');
    const finger = sdf.cone(NIP, [0.43, 0.78, 0.16], 0.058, 0.026).bone('nip.L');
    k.body('claws', sdf.smoothUnion(0.018, arm, palm).union(finger).mirror('x'), { color: s.tint.body, roughness: 0.6 });
  },
  pose(clip, p) {
    const { wave, keys } = motion;
    // The claws snap now and then; the arms bob with the walk.
    let open = 8 + 8 * Math.max(0, wave(p, clip === 'idle' ? 2 : 1, 0.2));
    let fwd = 4 * wave(p, clip === 'run' ? 2 : 1);
    let out = 0;
    if (clip === 'attack') {
      // The claws swing forward and open wide in the rear-up, then snap shut on the bite.
      fwd = keys(p, [[0, 0], [0.3, -12], [0.42, -14], [0.48, 40], [0.62, 36], [1, 0]] as const);
      open = keys(p, [[0, 8], [0.3, 34], [0.44, 36], [0.48, -6], [0.62, -6], [1, 8]] as const);
    } else if (clip === 'hit') {
      fwd = keys(p, [[0, 0], [0.2, -18], [1, 0]] as const);
      out = keys(p, [[0, 0], [0.2, 14], [1, 0]] as const);
    } else if (clip === 'death') {
      out = keys(p, [[0, 0], [0.5, 40], [1, 46]] as const);
      open = keys(p, [[0, 8], [0.5, 20], [1, 20]] as const);
    }
    return {
      'arm.L': { rotate: [fwd, 0, -out] },
      'arm.R': { rotate: [fwd, 0, out] },
      'nip.L': { rotate: [0, 0, -open] },
      'nip.R': { rotate: [0, 0, open] },
    };
  },
});
