import { mixRgb, profile, rgb, sdf } from '../src/index.js';
import { dragonAsset } from './parts/dragon-kind.js';

/**
 * Basilisk — Chibi Quest monster (catalog `monsters/beast/basilisk`), a serpent-king lizard about
 * 0.95 m to the top of its frill, faces +Z. Target: docs/monster-mockups/basilisk_001.jpg (made
 * with mmx from the drake mockup).
 *
 * The drake (`assets/drake.ts`; body, rig, and clips from `assets/parts/dragon-kind.ts`) as a
 * basilisk: no wings, no horns, and no head spines; dark green scales, a pale yellow belly, a tall
 * red spiked frill behind the head like a crown (with dark red rays), dark green spines down the
 * back, and bright yellow eyes. The attack breathes a grey-green petrifying mist in place of fire.
 * Role: a dangerous beast of the ruins; the red frill on the dark body reads at 128 px, also from
 *   behind.
 * Palette (60/30/10): dark green #3e6a3a; pale yellow belly #e8e0a0; red frill #d8402a with dark
 *   red rays; yellow eyes as the accent.
 * Bodies added: frill (rigid on the head).
 * Clips: idle, walk, run, attack (a petrifying breath), hit, death, roar.
 */

const FRILL_C = [0, 0.74, -0.07] as const;

export default dragonAsset({
  name: 'basilisk',
  description: 'Chibi basilisk monster: a dark green hornless lizard with a tall red spiked frill behind its head like a crown, bright yellow eyes, a pale yellow belly, dark spines down its back, and a petrifying breath.',
  reference: 'docs/monster-mockups/basilisk_001.jpg',
  variants: {
    scales: { forest: '#3e6a3a', slate: '#3a4a52', umber: '#5a4a32' },
    belly: { pale: '#e8e0a0', cream: '#f2e4c0', grey: '#d0d4c8' },
    eyes: { yellow: '#ffd020', amber: '#ff9a20', green: '#b0f040' },
    frill: { red: '#d8402a', violet: '#8a4ab8', orange: '#e8802a' },
  },
  presets: {
    slate: { scales: 'slate', belly: 'grey', eyes: 'green', frill: 'violet' },
    umber: { scales: 'umber', belly: 'cream', eyes: 'amber', frill: 'orange' },
  },
  palette: {
    redDark: '#2a4a28',
    creamLine: '#c8c080',
    eyeLow: '#e09a10',
    brow: '#1a2618',
    claw: '#e8dcb8',
    fireCore: '#eef4e8',
    fire: '#a8b8a0',
    fireTip: '#6a7a68',
  },
  looks: {
    crest: { color: '#2a4a28' },
  },
  wings: false,
  horn: false,
  headCrest: false,
  extra(k) {
    // The frill: a fan of nine spikes behind the head, standing up and leaning back, with dark rays
    // from its center.
    const pts: [number, number][] = [];
    for (let i = 0; i <= 18; i++) {
      const a = (i / 18) * Math.PI;
      const r = i % 2 === 0 ? 0.25 : 0.19;
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    pts.push([-0.12, -0.04], [0.12, -0.04]);
    const dark = rgb(k.tint('frill', { color: '#8a2418', follow: 1 }));
    const fan = sdf
      .extrude(profile.polygon(pts, { smooth: false }), 0.022, 0.008)
      .paintFn((x, y, _z, c) => {
        const a = Math.atan2(y + 0.02, x);
        const ray = Math.abs(Math.sin(a * 9)) < 0.18 ? 1 : 0;
        return mixRgb(c, dark, ray * Math.min(1, Math.max(0, (Math.hypot(x, y) - 0.06) * 12)));
      })
      .rotateX(-28)
      .at(...FRILL_C);
    k.body('frill', fan, { color: k.tint('frill'), roughness: 0.5, bone: 'head', detail: 0.004 });
  },
});
