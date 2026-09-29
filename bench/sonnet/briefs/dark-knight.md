# dark-knight (enemies/humanoid/dark-knight) -> assets/dark-knight.ts

A heavy armored enemy about 1.05 m to the horn tips, faces +Z, on the death knight base (assets/death-knight.ts: the skeleton-knight rig with knee bones and the weapon hand; clips idle, walk, run, attack, hit, death, rise; variant slots and presets). Bar 8/10 (character). The dark knight is a living armored villain, not undead: no rise clip is needed, but keep it if it comes free from the base.

Mockup: docs/enemy-mockups/dark-knight_001.jpg (set `reference` to that path). Match its idea: a closed matte black great helm with a tall center crest fin and two thick curved horns sweeping out sideways, a wide dark visor slit with a faint red glow; black plate armor with magenta-purple edge trim and etched panels, a red gem on the chest, a spiked pauldron on each shoulder, a tabard plate with an emblem, a ragged dark red cape; a plain black greatsword held low in the right hand; black iron boots.

Palette: plate matte black #23222a with lit #3d3b46 (roughness 0.6, metalness 0.6); trim magenta #8a3f8a with #b05ab0 highlights; gem red #d02a2a (emissive 1.2 on a dark base); visor glow red #ff3030 emissive 1.6 on #2a0808; cape #7a1c1c with #4a1010 shade, torn hem; sword black steel #2e2e34 with a #6a6a72 edge.
Variants: trim (magenta default, teal #2f8a8a, gold #d4a93a), cape (red default, black, purple), glow (red default, green, blue).

Construction recipe:
1. Copy assets/death-knight.ts. Replace the horned helmet with a rounder great helm: a sphere-cylinder bowl r 0.24 with a flat visor plate, a tall crest fin (a flat wedge 0.04 x 0.16 x 0.2 on the crown), and two horns (`sdf.chain` sweeping out to x +-0.3 and up to y 0.95, r 0.05 to 0.02) in black; the visor slit is a dark box 0.2 x 0.03 with a red emissive strip behind it.
2. Plate: keep the base plate bodies; paint magenta trim strips along every plate edge (`paintWhere` thin boxes), add three etched panel lines per plate in bump; a red gem (rotated rounded box 0.04) at the chest center; a spiked pauldron per shoulder (dome + two short cones).
3. Tabard plate: a flat rounded box 0.16 x 0.22 hanging from the belt in front with a painted magenta emblem; the cape: a flat box behind with a jagged hem (subtract wedges), `bone: 'chest'`.
4. Sword: a plain black greatsword 0.85 m in `hand.R`, held point-down at rest, overhead chop in `attack`. `./forge check dark-knight` must end with `result ok`.
5. Sprites: the horns, crest, and red visor must read at 128 px.

Limits: under 70,000 triangles, `detail` 0.004 on the helm, 0.006 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/dark-knight.ts. Finish with one `./forge all dark-knight`.
