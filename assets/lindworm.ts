import { motion, rgb, sdf } from '../src/index.js';
import { serpentAsset } from './parts/serpent-kind.js';

/**
 * Lindworm — Chibi Quest monster (catalog `monsters/dragon/lindworm`), a wingless serpent dragon on
 * two front legs, about 0.95 m to the tips of the horns, faces +Z. Target:
 * docs/monster-mockups/lindworm_001.jpg (made with mmx).
 *
 * The serpent of `assets/parts/serpent-kind.ts` (a spine path, belly plates, the drake head, rig, and
 * clips) sitting upright: a fat base on the ground, a tall neck with big cream belly plates and ring
 * grooves on the green, a drake head with a big round snout, raised black nostrils, a half-open grin
 * with teeth and two fangs, big round eyes, and a crown of yellow horns. Two short front legs with
 * yellow claws stand in front of the base, and the tail curls back and up with yellow spikes.
 * Role: a dragon of the deep woods and the old ruins; the upright neck, the horn crown, and the open
 *   grin read at 128 px.
 * Palette (60/30/10): olive #98b444 body and head; cream #f2e8c8 belly; yellow #f2d050 horns, spikes,
 *   and claws as the accent.
 * Bodies added: horns (rigid on the head), nostrils (on the head), spikes (tagged to the body bones),
 * legs (on `leg.L` and `leg.R`), claws (with the legs).
 */
type V3 = [number, number, number];

const SHOULDER: V3 = [0.09, 0.13, 0.08];
const FOOT: V3 = [0.12, 0.035, 0.16];

export default serpentAsset({
  name: 'lindworm',
  description: 'Chibi lindworm monster: a wingless olive green serpent dragon sitting upright on two short front legs, big cream belly plates, a drake head with a round snout, black nostrils, a half-open grin with teeth and fangs, big round eyes, a crown of yellow horns, yellow back spikes, and a curled tail; serpent rig with a jaw and legs.',
  reference: 'docs/monster-mockups/lindworm_001.jpg',
  variants: {
    body: { olive: '#98b444', jade: '#4aa86a', rust: '#c0703a' },
    belly: { cream: '#f2e8c8', sand: '#e8d4a0', ivory: '#f6f2e6' },
    horns: { yellow: '#f2d050', ivory: '#efe6cc', amber: '#e0a040' },
    eyes: { black: '#18161a', brown: '#3a2416', green: '#24502c' },
  },
  presets: {
    forest: { body: 'jade', belly: 'ivory', horns: 'ivory', eyes: 'green' },
    ember: { body: 'rust', belly: 'sand', horns: 'amber', eyes: 'brown' },
  },
  colors: { mouth: '#b04656', bellyLine: '#d8cba4' },
  path: [
    [0.12, 0.38, -0.3, 0.025],
    [0.14, 0.28, -0.36, 0.04],
    [0.14, 0.15, -0.34, 0.055],
    [0.1, 0.075, -0.24, 0.075],
    [0.04, 0.1, -0.13, 0.1],
    [0, 0.12, -0.02, 0.12],
    [0, 0.27, 0.02, 0.115],
    [0, 0.42, 0.01, 0.1],
    [0, 0.54, -0.01, 0.09],
    [0, 0.63, 0.02, 0.082],
  ],
  root: 5,
  bellyEdge: 0.25,
  bellyFrom: 0.42,
  plate: 0.065,
  face: { style: 'drake', r: 0.2, fangs: true, open: 9, eyeAt: { x: 0.52, y: 0.4, z: 0.42, lift: -0.55 } },
  bones: {
    'leg.L': { parent: 'root', at: SHOULDER, tail: FOOT },
    'leg.R': { parent: 'root', at: [-SHOULDER[0], SHOULDER[1], SHOULDER[2]], tail: [-FOOT[0], FOOT[1], FOOT[2]] },
  },
  paint(body, s) {
    // Ring grooves across the green back, one every 0.05 m.
    const groove = s.tone('body', '#7a9432');
    return body.paintFn((x, y, z, c) => {
      const a = s.along(x, y, z);
      return a.side > -0.3 && (a.s / 0.05) % 1 < 0.08 ? rgb(groove) : c;
    });
  },
  extra(k, s) {
    const horn = k.tint('horns');
    const skull = s.skull!;
    const [hx, , hz] = s.headC;
    const HR = s.headR;
    // A crown of five horns on the back of the head, swept back and out, the middle ones tallest.
    const horns = (
      [
        [0, -0.3, 0.13, 0],
        [0.3, -0.2, 0.12, 25],
        [-0.3, -0.2, 0.12, -25],
        [0.55, -0.05, 0.09, 50],
        [-0.55, -0.05, 0.09, -50],
      ] as const
    ).map(([u, w, len, out]) => {
      const root = sdf.raycast(skull, [hx + u * HR, 2, hz + w * HR], [0, -1, 0])! as V3;
      const o = (out * Math.PI) / 180;
      const tip: V3 = [root[0] + Math.sin(o) * len * 0.6, root[1] + len, root[2] - len * 0.45];
      const mid: V3 = [(root[0] + tip[0]) / 2, (root[1] + tip[1]) / 2 + 0.005, (root[2] + tip[2]) / 2 + 0.01];
      return sdf.chain([[root[0], root[1] - 0.01, root[2], 0.026], [...mid, 0.017], [...tip, 0.004]], 0.008);
    });
    // Raised black nostrils on top of the snout.
    const nose = sdf.raycast(skull, [hx + HR * 0.24, 2, hz + HR * 1.25], [0, -1, 0])! as V3;
    const nostril = sdf.ellipsoid([0.024, 0.016, 0.03]).rotateY(20).at(nose[0], nose[1] + 0.004, nose[2]).mirror('x');
    k.body('horns', sdf.union(...horns).bone('head'), { color: horn, roughness: 0.5, detail: 0.004 });
    k.body('nostrils', nostril.bone('head'), { color: '#18161a', roughness: 0.3, detail: 0.003 });
    // Spikes along the back of the neck and the tail, and a pair at the tail tip.
    const spike = (t: number, len: number) => {
      const f = s.frame(t);
      const base: V3 = [f.p[0] - f.belly[0] * f.r * 0.8, f.p[1] - f.belly[1] * f.r * 0.8, f.p[2] - f.belly[2] * f.r * 0.8];
      const tip: V3 = [base[0] - f.belly[0] * len - f.dir[0] * len * 0.3, base[1] - f.belly[1] * len - f.dir[1] * len * 0.3, base[2] - f.belly[2] * len - f.dir[2] * len * 0.3];
      return sdf.cone(base, tip, Math.max(0.012, f.r * 0.3), 0.003).bone(f.bone);
    };
    const tip = s.path[0]!;
    const tipSpikes = sdf
      .union(
        sdf.cone([tip[0], tip[1] - 0.02, tip[2]], [tip[0] - 0.01, tip[1] + 0.07, tip[2] + 0.02], 0.022, 0.004),
        sdf.cone([tip[0], tip[1] - 0.02, tip[2]], [tip[0] + 0.03, tip[1] + 0.05, tip[2] - 0.04], 0.018, 0.004),
      )
      .bone(s.boneAt[1]!);
    const spikes = sdf.union(spike(0.12, 0.035), spike(0.22, 0.04), spike(0.32, 0.045), spike(0.62, 0.035), spike(0.72, 0.035), spike(0.82, 0.03), tipSpikes);
    k.body('spikes', spikes, { color: horn, roughness: 0.5, detail: 0.004 });
    // Two short front legs: a chubby arm down to a round foot with three yellow claws.
    const leg = sdf
      .smoothUnion(
        0.03,
        sdf.chain([[...SHOULDER, 0.056], [0.12, 0.08, 0.13, 0.048], [FOOT[0], FOOT[1] + 0.01, FOOT[2], 0.042]], 0.01),
        sdf.ellipsoid([0.05, 0.032, 0.062]).at(FOOT[0], 0.032, FOOT[2] + 0.02),
      )
      .bone('leg.L');
    const claws = sdf
      .union(...[-1, 0, 1].map((i) => sdf.cone([FOOT[0] + i * 0.03, 0.025, FOOT[2] + 0.06], [FOOT[0] + i * 0.04, 0.008, FOOT[2] + 0.1], 0.013, 0.003)))
      .bone('leg.L');
    k.body('legs', leg.mirror('x'), { color: s.tint.body, roughness: 0.6 });
    k.body('claws', claws.mirror('x'), { color: horn, roughness: 0.45, detail: 0.003 });
  },
  pose(clip, p) {
    const { wave, keys } = motion;
    // The front legs paddle in the walk, brace in the attack, and splay in the death.
    if (clip === 'walk') return { 'leg.L': { rotate: [14 * wave(p, 1), 0, 0] }, 'leg.R': { rotate: [-14 * wave(p, 1), 0, 0] } };
    if (clip === 'attack') {
      const b = keys(p, [[0, 0], [0.3, 1], [0.5, -1], [1, 0]]);
      return { 'leg.L': { rotate: [10 * b, 0, 0] }, 'leg.R': { rotate: [10 * b, 0, 0] } };
    }
    if (clip === 'death') {
      const d = keys(p, [[0.3, 0], [0.7, 1]]);
      return { 'leg.L': { rotate: [-20 * d, 0, 20 * d] }, 'leg.R': { rotate: [-20 * d, 0, -20 * d] } };
    }
    return {};
  },
});
