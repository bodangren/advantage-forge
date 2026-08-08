# Artifact Verifier and GLB Import Summary

The repository skill verifier passed for the exact
`adventurer.rustic` revision:

- 8 directional PNGs, each 128x128, in the required
  N/NE/E/SE/S/SW/W/NW order.
- No frame reported clipping.
- Every frame reported zero ground-anchor deviation.
- Contact sheet: 512x292, 25,819 bytes,
  SHA-256 `6386e7cdf958d578f5b33fec966b101eef8ef8b11fba7e6f7c9c249f923afb44`.
- GLB: 60,320 bytes,
  SHA-256 `ef22ce2bad7e2c3051c4839a70a7cb568c75c4df99cf76c39a1d652e43d4099c`.

The pinned Three.js `GLTFLoader` 0.185.1 audit also passed:

- orientation: Y-up; unit: meter;
- bounds matched the GLB manifest with zero deviation;
- 20 semantic nodes were present;
- no missing, unexpected, or duplicate node names;
- materials: `cloth.moss`, `cloth.umber`, `hair.chestnut`,
  `iron.weathered`, `leather.dark`, `skin.warm`, and `wood.oak`;
- zero cameras, lights, skins, textures, and animations;
- no importer errors.

This is representative evidence for the bounded GLB format contract. Godot,
Unity, and gameplay-runtime import remain Not Assessed.
