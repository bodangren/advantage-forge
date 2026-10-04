import { mixRgb, noise, rgb } from '../src/index.js';
import { dragonAsset } from './parts/dragon-kind.js';

/**
 * Giant lizard — Chibi Quest monster (catalog `monsters/beast/giant-lizard`), a big four-legged
 * lizard about 0.85 m tall, faces +Z. Target: docs/monster-mockups/giant-lizard_001.jpg (made with
 * mmx from the drake mockup).
 *
 * The drake (`assets/drake.ts`; body, rig, and clips from `assets/parts/dragon-kind.ts`) as a
 * giant lizard: no wings, no horns, and no spines on the head; green scales with round yellow
 * spots on the back, the flanks, and the tail; a cream belly; small yellow spines down the back
 * and the tail; and gold eyes. The attack spits pale green acid in place of fire.
 * Role: a common beast of the swamps and the jungle, below the drakes; the yellow spots and the
 *   hornless round head set it apart from the dragons at 128 px.
 * Palette (60/30/10): green #6aa84a with yellow spots #e8c840; cream belly #f2ecc8; yellow
 *   spines; gold eyes as the accent.
 * Clips: idle, walk, run, attack (an acid spit), hit, death, roar.
 */
export default dragonAsset({
  name: 'giant-lizard',
  description: 'Chibi giant lizard monster: a big hornless green lizard with round yellow spots, a cream belly, small yellow spines down its back and tail, gold eyes, and a toothy grin; it spits acid.',
  reference: 'docs/monster-mockups/giant-lizard_001.jpg',
  variants: {
    scales: { green: '#6aa84a', teal: '#4a9a8a', sand: '#b8a060' },
    belly: { cream: '#f2ecc8', pale: '#e8f0d0', ochre: '#e8c890' },
    eyes: { gold: '#f0c830', orange: '#f08a2a', lime: '#a0d040' },
  },
  presets: {
    teal: { scales: 'teal', belly: 'pale', eyes: 'orange' },
    desert: { scales: 'sand', belly: 'ochre', eyes: 'lime' },
  },
  palette: {
    redDark: '#3e7a34',
    creamLine: '#d8cc98',
    eyeLow: '#c09020',
    brow: '#3a6a2e',
    claw: '#f0e4b8',
    fireCore: '#f4ffb0',
    fire: '#c8e050',
    fireTip: '#7aa830',
  },
  looks: {
    crest: { color: '#e8c840' },
  },
  wings: false,
  horn: false,
  headCrest: false,
  paint(scales) {
    const spot = rgb('#e8c840');
    // Round yellow spots on the back, the flanks, and the tail; none on the face or the belly.
    return scales.paintFn((x, y, z, c) => {
      const face = z > 0.1 && y > 0.45 && Math.abs(x) < 0.16;
      const belly = z > 0.08 && y < 0.42 && Math.abs(x) < 0.17;
      if (face || belly) return c;
      // The nearest of the jittered points of an 8.5 cm grid (about 60 % of them make a spot); a
      // spot is a disc of 2.2 cm around its point.
      const G = 0.085;
      const [i, j, l] = [Math.floor(x / G), Math.floor(y / G), Math.floor(z / G)];
      let d = Infinity;
      for (let a = -1; a <= 1; a++)
        for (let b = -1; b <= 1; b++)
          for (let e = -1; e <= 1; e++) {
            const [ci, cj, cl] = [i + a, j + b, l + e];
            if (noise.random(ci + 7, cj, cl) > 0.6) continue;
            const q = [(ci + 0.2 + 0.6 * noise.random(ci, cj, cl)) * G, (cj + 0.2 + 0.6 * noise.random(cj, cl, ci)) * G, (cl + 0.2 + 0.6 * noise.random(cl, ci, cj)) * G];
            d = Math.min(d, Math.hypot(x - q[0]!, y - q[1]!, z - q[2]!));
          }
      return mixRgb(c, spot, Math.min(1, Math.max(0, (0.022 - d) / 0.003)));
    });
  },
});
