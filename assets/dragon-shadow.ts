import { sdf } from '../src/index.js';
import { dragonAsset } from './parts/dragon-kind.js';

/**
 * Shadow dragon — Chibi Quest monster (catalog `monsters/dragon/dragon-shadow`), about 1.0 m to
 * the horn tips, faces +Z. Target: docs/monster-mockups/dragon-shadow_001.jpg (made with mmx).
 *
 * The fire dragon (`assets/dragon-fire.ts`; body, rig, and clips from `assets/parts/dragon-kind.ts`)
 * as a shadow dragon: dark purple-black scales, a grey-violet belly, glowing violet crest spikes,
 * dark violet wing membranes, pale grey horns, violet eyes, a glowing gem on the forehead, and a
 * breath of shadow smoke.
 * Role: a late-area or night boss of the same weight class as the fire dragon.
 * Palette (60/30/10): near-black purple #3c3048; grey-violet belly; violet crest, wings, gem, and
 *   eyes as the glowing accent (the focal point is the gem over the eyes). Slot options stay dark.
 * Breath: pale violet at the core, violet, then near-black at the edge (smoke).
 */
export default dragonAsset({
  name: 'dragon-shadow',
  description: 'Chibi shadow dragon monster: a huge dark purple head with grey horns, a glowing violet crest and forehead gem, black brows, violet eyes, and a toothy grin; dark violet bat wings; a grey-violet belly; a finned tail; and a breath of shadow smoke.',
  reference: 'docs/monster-mockups/dragon-shadow_001.jpg',
  variants: {
    scales: { shadow: '#3c3048', night: '#26222e', dusk: '#584468' },
    belly: { ash: '#8a8098', slate: '#6e6a80', lilac: '#a898b8' },
    eyes: { violet: '#c060ff', magenta: '#ff4ac0', cyan: '#4ae0ff' },
  },
  presets: {
    night: { scales: 'night', belly: 'slate', eyes: 'cyan' },
    dusk: { scales: 'dusk', belly: 'lilac', eyes: 'magenta' },
  },
  palette: {
    redDark: '#2a2034',
    creamLine: '#5e5470',
    eyeLow: '#8a3ad0',
    orange: '#7a3ab0',
    horn: '#cdc8d2',
    hornBase: '#8e8898',
    brow: '#120e16',
    claw: '#d4ccdc',
    fireCore: '#e0b0ff',
    fire: '#7a3ab8',
    fireTip: '#2a1a40',
  },
  looks: {
    crest: { color: '#a050e8', emissive: '#9a4ad8', emissiveIntensity: 0.4 },
    crestMid: { color: '#b468f4', emissive: '#9a4ad8', emissiveIntensity: 0.45 },
    wings: { color: '#5a2c86' },
  },
  extra(k, dragon) {
    // A diamond gem on the forehead, over the brow shelf, set a little into the scales.
    const h = dragon.faceHit(0, 0.79);
    const gem = sdf.box([0.042, 0.042, 0.03], 0.004).rotateZ(45).scale([0.8, 1.15, 1]).at(h[0], h[1], h[2] - 0.006);
    k.body('gem', gem, { color: '#c878ff', roughness: 0.1, emissive: '#b060f0', emissiveIntensity: 0.7, bone: 'head', flat: true, detail: 0.002 });
  },
});
