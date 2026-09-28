import { defineAsset, sdf } from '../src/index.js';

// Design note
// - Role: a hero's accessory (equipment/accessories/brooch), seen small on a sprite and in a pickup view.
// - Size: 0.08 m wide, lying flat on y = 0, front facing +Z, centered on the Y axis.
// - One idea: a round gold brooch whose wavy gold bezel hugs a glowing green gem, ringed by pearls.
// - Shape language: dominant round, secondary soft wavy ring (friendly, treasure-y).
// - Palette: gold #d4a93a (dominant), pearl #f2eadb (secondary), green gem #35c25a glow on dark base (accent).
// - Materials: gold metalness 1 roughness 0.32; gem roughness 0.12 flat facets, small emissive; pearl satin.
// - Details: flat disc, ruffled bezel torus, 9 half-sunk pearls, small clasp bump on the back.
// - No rig or animation: a static item.

export default defineAsset({
  name: 'brooch',
  detail: 0.004,
  reference: 'docs/item-mockups/brooch-mock.jpg',
  texture: { size: 1024 },
  build(k) {
    // Gold base: flat disc + small clasp bump on the back.
    const disc = sdf.cylinder(0.04, 0.007, 0.0035).at(0, 0.0035, 0);
    const clasp = sdf.sphere(0.007).scale([1, 0.5, 1]).at(0, 0.0036, 0);
    const gold = disc.smoothUnion(0.0015, clasp);
    k.body('gold', gold, { color: '#d4a93a', roughness: 0.4, metalness: 1, detail: 0.0035 });
    // Chunky rounded bezel ring hugging the gem; separate body keeps the gold mirror-clean.
    const bezel = sdf.torus(0.0215, 0.0062).at(0, 0.008, 0);
    k.body('bezel', bezel, { color: '#d4a93a', roughness: 0.4, metalness: 1, detail: 0.0038 });

    // Green gem: domed, faceted, glowing from a dark base.
    const gem = sdf.ellipsoid([0.02, 0.011, 0.02]).at(0, 0.0105, 0);
    k.body('gem', gem, {
      color: '#14522a',
      roughness: 0.12,
      metalness: 0.1,
      flat: true,
      emissive: '#35c25a',
      emissiveIntensity: 1.4, detail: 0.0042,
    });

    // Pearls: 9 half-sunk beads around the rim.
    let pearls: any = null;
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + Math.PI / 2;
      const p = sdf.sphere(0.0046).at(Math.cos(a) * 0.0325, 0.008, Math.sin(a) * 0.0325);
      pearls = pearls ? pearls.smoothUnion(0.0008, p) : p;
    }
    k.body('pearls', pearls, { color: '#f2eadb', roughness: 0.28, metalness: 0.05, detail: 0.0042 });
  },
});
