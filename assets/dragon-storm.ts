import { dragonAsset } from './parts/dragon-kind.js';

/**
 * Storm dragon — Chibi Quest monster (catalog `monsters/dragon/dragon-storm`), about 1.0 m to the
 * horn tips, faces +Z. Target: docs/monster-mockups/dragon-storm_001.jpg (made with mmx).
 *
 * The fire dragon (`assets/dragon-fire.ts`; body, rig, and clips from `assets/parts/dragon-kind.ts`)
 * as a storm dragon: deep royal blue scales, a sky-blue belly, glowing yellow lightning crest
 * spikes, yellow-orange wing membranes, silver metal horns, yellow eyes, and a lightning breath.
 * Role: a mountain or sky boss of the same weight class as the fire dragon.
 * Palette (60/30/10): royal blue #3a5ab0 (darker back); sky-blue belly; yellow crest and wings as
 *   the complement; silver horns; yellow eyes under black brows as the focal point. Slot options
 *   stay in the blues.
 * Breath: white at the core, bright yellow, then electric blue at the edge (lightning).
 */
export default dragonAsset({
  name: 'dragon-storm',
  description: 'Chibi storm dragon monster: a huge royal blue head with silver horns, a glowing yellow lightning crest, black brows, yellow eyes, and a toothy grin; yellow-orange bat wings; a sky-blue belly; a finned tail; and a lightning breath.',
  reference: 'docs/monster-mockups/dragon-storm_001.jpg',
  variants: {
    scales: { storm: '#3a5ab0', navy: '#283a7a', sky: '#4a7ad0' },
    belly: { sky: '#a8d4ee', cloud: '#dce6f0', teal: '#7ac8c0' },
    eyes: { bolt: '#ffd830', white: '#f4f6ff', cyan: '#5ae0ff' },
  },
  presets: {
    navy: { scales: 'navy', belly: 'cloud', eyes: 'cyan' },
    sky: { scales: 'sky', belly: 'teal', eyes: 'white' },
  },
  palette: {
    redDark: '#283f80',
    creamLine: '#78a4c4',
    eyeLow: '#e0a010',
    orange: '#ffd23a',
    horn: '#dde2ea',
    hornBase: '#9aa2b0',
    claw: '#e8ecf2',
    fireCore: '#ffffff',
    fire: '#fff070',
    fireTip: '#4ab8ff',
  },
  looks: {
    horns: { roughness: 0.25, metalness: 0.85 },
    crest: { emissive: '#ffd23a', emissiveIntensity: 0.45 },
    crestMid: { color: '#ffe060', emissive: '#ffd23a', emissiveIntensity: 0.5 },
    wings: { color: '#f6b43a' },
  },
});
