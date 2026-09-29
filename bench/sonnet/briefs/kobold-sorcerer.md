# kobold-sorcerer (enemies/humanoid/kobold-sorcerer) -> assets/kobold-sorcerer.ts

A small hooded kobold caster about 0.95 m tall to the horn tips, faces +Z, on the kobold warrior base (assets/kobold-warrior.ts: the small lizard rig with knee bones and a weapon hand; clips idle, walk, run, attack, hit, death, taunt; variant slots and presets). For the staff and a cast pose, read assets/goblin-shaman.ts (a staff caster) and copy its staff hold and cast clip pattern. Bar 8/10 (character).

Mockup: docs/enemy-mockups/kobold-sorcerer_001.jpg (set `reference` to that path). Match its idea: a rust-red scaled kobold with a wide flat snout, big round yellow eyes with black pupils, a toothy grin with small fangs, big pointed ears, two ridged bone-colored horns curving up and out; a purple hood and cape over the shoulders, a tan belly plate; a leather belt with a round silver bell and brass trinkets; a bone-and-wood crooked staff with a skull on top that burns with a green flame; a long tail; clawed hands and feet.

Palette: scales #b84a2e with shade #8a3620 and lit #d0684a (roughness 0.8), belly #d8b890; hood and cape #6a4a8a with shade #4a3060; horns #d8ccae; eyes #ffd23a with black pupils and white glints; staff wood #5a3a24, skull #e8e0cc, flame #8aff6a emissive 1.6 (opacity 0.8); belt #4a3020, bell #c8c8d0 (metalness 0.7).
Variants: hood (purple default, green #3a6a3a, black #2a2a30), scales (red default, green #5a8a3a, blue #4a6a9a), flame (green default, blue #6ab0ff, orange #ffa040).

Construction recipe:
1. Copy assets/kobold-warrior.ts. Keep the rig and the clips. Remove the warrior gear. Add a hood (a revolve around the head with a forward opening, the inside dark) with a cape shell behind to the hips, `bone` weights from the head and chest; two ridged horns (`sdf.chain`, r 0.035 to 0.01, curving out to x +-0.16 and up to y 0.95) that pass through the hood.
2. Face: keep the snout; make the eyes big (r 0.04) with pupils and glints, a wide grin cut with four small fang cones, big pointed ears (flattened cones).
3. Body: a tan belly plate (paintWhere), a belt torus with a bell sphere and two small brass trinkets, a long tail (`sdf.chain` from the hips, curling to the side), clawed hands and feet.
4. Staff: 0.9 m in `hand.R`, held upright at rest, a crooked shaft (a chain with two bends), a skull on top (sphere with two dark eye sockets and a nose hole) and a green flame (a tapered displaced ellipsoid, emissive, opacity 0.8). The attack raises the staff and thrusts it forward (a cast); keep taunt. `./forge check kobold-sorcerer` must end with `result ok` and the ground check must be ok.
5. Sprites: the horns, the hood, the yellow eyes, and the skull staff must read at 128 px.

Limits: under 65,000 triangles, `detail` 0.004 on the face, 0.006 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/kobold-sorcerer.ts. Finish with one `./forge all kobold-sorcerer`.
