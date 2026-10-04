import { noise, sdf } from '../src/index.js';
import { ogreAsset } from './parts/ogre-kind.js';

/**
 * Cyclops — Chibi Quest monster (catalog `monsters/giant-and-ancient/cyclops`), about 1.45 m to
 * the top of its head, faces +Z. Target: docs/monster-mockups/cyclops_001.jpg (made with mmx).
 *
 * The ogre brute (`assets/ogre-brute.ts`; body, rig, and clips from `assets/parts/ogre-kind.ts`)
 * as a cyclops giant, a little bigger: olive green skin, a bald head with one big eye in the
 * middle of the face under one heavy brow, a broad round nose, a wide grin with a row of teeth and
 * two small tusks, a short brown horn on the top of the head, and a wooden mallet in place of the
 * spiked club.
 * Role: a giant brute of the giant family; the one big eye and the grin read at 128 px.
 * Palette (60/30/10): olive green skin #8a9a4a (darker limbs, a lighter belly); brown fur and
 *   leather #7a4a2a; a wooden mallet; the white eye and teeth as the accent.
 * Bodies added: horn (rigid on the head), mallet (rigid on the right hand).
 */
export default ogreAsset({
  name: 'cyclops',
  description:
    'Chibi cyclops monster: a stocky olive green giant with one big eye under a heavy brow, a broad nose, a wide toothy grin with small tusks, a short horn on its bald head, a fur loincloth, and a wooden mallet.',
  reference: 'docs/monster-mockups/cyclops_001.jpg',
  scale: 1.4,
  headScale: 1.22,
  variants: {
    skin: { olive: '#8a9a4a', moss: '#6e8a4a', stone: '#8a8a7a' },
    cloth: { fur: '#7a4a2a', grey: '#6a625a', ochre: '#9a7a3a' },
    leather: { brown: '#6e3f24', dark: '#3f2818', tan: '#9a7448' },
    mane: { brown: '#5a3a22', black: '#241a14', ginger: '#7a4a1e' },
  },
  presets: {
    mossback: { skin: 'moss', cloth: 'grey', leather: 'dark', mane: 'black' },
    stone: { skin: 'stone', cloth: 'ochre', leather: 'tan', mane: 'ginger' },
  },
  colors: { skinDark: '#6a7a34', skinLight: '#9cac58', lid: '#6a7a34', mouth: '#3a2a1a', sclera: '#f4f0e4', eye: '#141010', redDark: '#5a3418', hide: '#8a6a45' },
  nose: 'human',
  eyes: 'one',
  mouth: 'grin',
  tusks: 0.5,
  mane: { beard: false, locks: false, back: false, tuft: false },
  weapon(_k, o) {
    // A wooden mallet: a stout haft and a round drum of a head across it (along the side axis, which
    // stays level in the swipe), bound with two iron rings.
    const haft = sdf.chain(
      [
        [0, -0.1, 0, 0.038],
        [0, 0.12, 0, 0.042],
        [0, 0.25, 0, 0.046],
      ],
      0.02,
    );
    const drum = sdf.cylinder(0.078, 0.17, 0.02).rotateZ(90).at(0, 0.29, 0);
    const wood = sdf.smoothUnion(0.012, haft, drum).displace(0.003, (x, y, z) => noise.fbm(x * 24, y * 10, z * 24, 3));
    o.put('mallet', o.weapon(wood), { color: '#7a5030', roughness: 0.8, bone: 'hand.R', detail: 0.005, bump: (x, y, z) => 0.0015 * noise.fbm(x * 40, y * 30, z * 40, 2) });
    const bands = sdf.union(...[-0.056, 0.056].map((x) => sdf.cylinder(0.084, 0.02, 0.006).rotateZ(90).at(x, 0.29, 0)));
    o.put('mallet-bands', o.weapon(bands), { color: '#5a5a62', roughness: 0.45, metalness: 0.6, bone: 'hand.R', detail: 0.004 });
  },
  extra(k, o) {
    // A short, blunt horn on the top of the head, leaning a little forward.
    const horn = sdf.cone([0, 0.88, 0.02], [0, 0.99, 0.05], 0.04, 0.012).smoothUnion(0.02, sdf.sphere(0.045).at(0, 0.87, 0.02));
    o.put('horn', o.head(horn), { color: o.tone('mane', '#6a4a2a'), roughness: 0.6, bone: 'head', detail: 0.004 });
    void k;
  },
});
