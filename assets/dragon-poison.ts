import { sdf } from '../src/index.js';
import { dragonAsset } from './parts/dragon-kind.js';

/**
 * Poison dragon — Chibi Quest monster (catalog `monsters/dragon/dragon-poison`), about 1.0 m to the
 * horn tips, faces +Z. Target: docs/monster-mockups/dragon-poison_001.jpg (made with mmx).
 *
 * The fire dragon (`assets/dragon-fire.ts`; body, rig, and clips from `assets/parts/dragon-kind.ts`)
 * as a poison dragon: green scales, a pale yellow belly, purple crest spikes and wing membranes,
 * toxic yellow-green eyes, a drop of glowing venom on its left fang, and a breath of toxic gas.
 * Role: a swamp or cave boss of the same weight class as the fire dragon.
 * Palette (60/30/10): green #56864a (darker back); pale yellow belly; purple crest and wings as the
 *   complement; toxic eyes and the venom drop as the focal point. Slot options stay in the greens.
 * Breath: pale lime at the core, toxic green, then dark green at the edge (gas).
 */
export default dragonAsset({
  name: 'dragon-poison',
  description: 'Chibi poison dragon monster: a huge green head with cream horns, a purple crest, black brows, a toothy grin, and a drop of venom on a fang; purple bat wings; a pale yellow belly; a finned tail; and a toxic breath.',
  reference: 'docs/monster-mockups/dragon-poison_001.jpg',
  variants: {
    scales: { venom: '#56864a', swamp: '#46703a', lime: '#7aa448' },
    belly: { pale: '#f0e6a0', cream: '#f4e0a8', mint: '#d8eebc' },
    eyes: { toxic: '#c8e830', amber: '#f0b020', red: '#e04a2a' },
  },
  presets: {
    swamp: { scales: 'swamp', belly: 'cream', eyes: 'amber' },
    lime: { scales: 'lime', belly: 'mint', eyes: 'red' },
  },
  palette: {
    redDark: '#3a6434',
    creamLine: '#c8b870',
    eyeLow: '#8aa818',
    orange: '#9a5cc0',
    horn: '#efe2c0',
    hornBase: '#d0bc90',
    fireCore: '#e8ff80',
    fire: '#9ad83a',
    fireTip: '#4a8a2a',
  },
  looks: {
    crestMid: { color: '#7a3ca8' },
  },
  extra(k, dragon) {
    // A drop of venom hangs from the tip of the left fang (the fang tip is 4 cm below the grin
    // line at x 0.1; the grin line there is at y 0.501).
    const h = dragon.faceHit(0.1, 0.501);
    const tip: [number, number, number] = [h[0] - 0.004, h[1] - 0.04, h[2] + 0.002];
    const drop = sdf.smoothUnion(0.006, sdf.sphere(0.014).at(tip[0], tip[1] - 0.024, tip[2] + 0.002), sdf.cone([tip[0], tip[1] - 0.004, tip[2]], [tip[0], tip[1] - 0.022, tip[2] + 0.002], 0.004, 0.012));
    k.body('venom', drop, { color: '#9ae03c', roughness: 0.1, emissive: '#8ad42c', emissiveIntensity: 0.4, opacity: 0.9, bone: 'head', detail: 0.002 });
  },
});
