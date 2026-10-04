import { dragonAsset } from './parts/dragon-kind.js';

/**
 * Ice dragon — Chibi Quest monster (catalog `monsters/dragon/dragon-ice`), about 1.0 m to the horn
 * tips, faces +Z. Target: docs/monster-mockups/dragon-ice_001.jpg (made with mmx).
 *
 * The fire dragon (`assets/dragon-fire.ts`; body, rig, and clips from `assets/parts/dragon-kind.ts`)
 * as an ice dragon: pale frost-blue scales, a snow-white belly, horns and crest spikes of clear,
 * faceted ice, pale cyan wing membranes, and a frost breath instead of fire.
 * Role: a cold-area boss of the same weight class as the fire dragon.
 * Palette (60/30/10): frost blue #9fd4ec (darker back); a snow belly; clear ice horns and crest;
 *   ice-blue eyes under dark blue brows as the focal point. Slot options stay in the cold colors.
 * Breath: white at the core, pale blue, then deep sky blue at the edge (frost).
 */
export default dragonAsset({
  name: 'dragon-ice',
  description: 'Chibi ice dragon monster: a huge frost-blue head with clear ice horns and an ice crest, dark blue brows, and a toothy grin; pale cyan bat wings; a snow-white belly; a finned tail; and a frost breath.',
  reference: 'docs/monster-mockups/dragon-ice_001.jpg',
  variants: {
    scales: { frost: '#9fd4ec', glacier: '#6fa8d4', snow: '#d4e8f2' },
    belly: { snow: '#f2f8fc', pearl: '#e4ecf0', mint: '#dcf2ea' },
    eyes: { ice: '#4fb8e8', violet: '#8a7ae0', teal: '#3aa8a0' },
  },
  presets: {
    glacier: { scales: 'glacier', belly: 'pearl', eyes: 'violet' },
    snow: { scales: 'snow', belly: 'mint', eyes: 'teal' },
  },
  palette: {
    redDark: '#72aacb',
    creamLine: '#b8d0dc',
    eyeLow: '#2a88c0',
    orange: '#d8f2fc',
    horn: '#e8f8ff',
    hornBase: '#a8dcf2',
    brow: '#2e4a68',
    claw: '#eaf6ff',
    fireCore: '#ffffff',
    fire: '#bfeaff',
    fireTip: '#5cb8ec',
  },
  looks: {
    horns: { roughness: 0.08, opacity: 0.9, flat: true, emissive: '#bfefff', emissiveIntensity: 0.15 },
    crest: { roughness: 0.08, opacity: 0.88, flat: true, emissive: '#bfefff', emissiveIntensity: 0.15 },
    crestMid: { color: '#e8f8ff', roughness: 0.08, opacity: 0.88, flat: true, emissive: '#bfefff', emissiveIntensity: 0.15 },
    wings: { color: '#c4e8f6', opacity: 0.92 },
  },
});
