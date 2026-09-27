# Color variants

Characters can be individualized: each has up to four color slots (usually eyes, hair, skin,
and clothing) with three or more options each. A game picks one option per slot, so three
options in four slots give 81 looks per character.

## What a textured build writes

| Output | Contents |
| --- | --- |
| `<name>.glb` base color texture | The default look (the first option of every slot). An engine that ignores variants shows this. |
| GLB root `extras.forgeVariants` | The slot table (below). |
| GLB texture `tintMask` | RGBA: one channel per slot (R, G, B, A in the order of the slots). 255 = fully in the slot, 0 = not in it; soft paint edges give values in between. |
| GLB `KHR_materials_variants` | One variant per preset: every textured material with a ready recolored base color texture. |
| `textures/tint-mask.png`, `textures/baseColor.<preset>.png` | The same images as files. |
| `sprites/presets/<preset>/` | A full sprite set (static and every clip) per preset, same layout as `sprites/`. |

The slot table:

```json
{
  "slots": {
    "eyes":     { "channel": "R", "default": "brown", "options": { "brown": [0.157, 0.051, 0.014], "blue": [...], "green": [...] } },
    "hair":     { "channel": "G", "default": "brown", "options": { ... } },
    "skin":     { "channel": "B", "default": "fair",  "options": { ... } },
    "clothing": { "channel": "A", "default": "teal",  "options": { ... } }
  },
  "presets": { "ranger": { "eyes": "green", "hair": "auburn", "skin": "tan", "clothing": "forest" } },
  "mask": "tintMask"
}
```

Option colors are linear RGB. A glowing part in a slot (for example glowing eyes) has material
extras `forgeEmissiveTint: "<slot>"`: set its emissive color to the chosen option's color.

## Recoloring in a game

For each slot, multiply the base color by the option's color divided by the default color, as
far as the mask covers the texel (in linear light):

```
color *= mix(1, option / default, mask[channel])     // per slot, per color channel
```

three.js, with `tintMask` loaded as a linear texture (flipY false, same UVs as the base map):

```js
material.onBeforeCompile = (shader) => {
  shader.uniforms.tintMask = { value: tintMaskTexture };
  shader.uniforms.tintRatio = { value: ratios }; // 4 x THREE.Vector3: option / default per slot (1,1,1 if unused)
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <map_pars_fragment>', '#include <map_pars_fragment>\nuniform sampler2D tintMask;\nuniform vec3 tintRatio[4];')
    .replace(
      '#include <map_fragment>',
      `#include <map_fragment>
       vec4 tm = texture2D(tintMask, vMapUv);
       diffuseColor.rgb *= mix(vec3(1.0), tintRatio[0], tm.r) * mix(vec3(1.0), tintRatio[1], tm.g)
                         * mix(vec3(1.0), tintRatio[2], tm.b) * mix(vec3(1.0), tintRatio[3], tm.a);`,
    );
};
```

Sprite games use the baked preset sets in `sprites/presets/`, or bake more presets by adding
them to the asset.

## Authoring (in the asset file)

```ts
export default defineAsset({
  name: 'rogue',
  variants: {
    eyes: { brown: C.iris, blue: '#2f6aa8', green: '#3d7a35' }, // the first option is the default
    hair: { brown: C.hair, black: '#231a17', auburn: '#8e3b1c' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    clothing: { teal: C.hood, crimson: '#7a2a30', forest: '#3b5a2a' },
  },
  presets: { ranger: { eyes: 'green', hair: 'auburn', skin: 'tan', clothing: 'forest' } },
  build(k) {
    const iris = k.tint('eyes');            // the slot's default color
    const irisLow = k.tint('eyes', 0.2);    // lighter by 0.2 (toward white); negative = darker
    // Use these wherever a color goes: body colors, paintWhere, paint, emissive.
  },
});
```

Every color that should follow a slot must come from `k.tint`, including darker and lighter
shades that were written as separate hex values (a hood lining, a hem band, a lower iris). A
shade is a mix of the slot color toward white (`shade > 0`) or black (`shade < 0`); pick the
shade whose result is closest to the old hex value. Colors that are not in a slot (eye whites,
pupils, gold, leather, stitches) keep their hex values and are left out of the mask, even when
they are painted over a slot color.

A color that should partly follow a slot keeps its exact default color with
`k.tint('skin', { color: C.blush, follow: 0.5 })`: half of the skin's recoloring applies to it,
so a blush or lips darken on a darker skin but stay pink.

Check a variant with `./forge render <name> --preset all` (one textured build; writes
`render.png` and `render.<preset>.png`). Variants need a textured build; `--fast` shows only
the default look.
