Style anchors — this is the critical requirement. Every tavern asset must look like it belongs to the SAME game as the hamlet set. Two reference images are in `reference/`:
- `reference/tavern-quest_001.jpg`: the batch style anchor and layout reference. Match its chunky timber-framed plaster walls, warm plank floor, honey-oak furniture, and warm firelight against the cool dark evening.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms, soft bevels, and cheerful palette so tavern assets sit beside hamlet assets without a style clash.
They are style guides, not traces: keep geometry simple enough to model with primitives.

Art direction (tavern treatment of Chibi Quest): rounded chunky forms, soft bevels everywhere, silhouettes that read at 128 px, and a warm firelit interior. Palette contract:
- Timber frame and beams: dark walnut #6b4226, deep #54331d.
- Plaster: warm white #f0e4cc.
- Wood furniture and floor: honey oak #b5814a, warm brown #8a5a35, pale cut wood #c9a06a.
- Stone (fireplace): cool gray #8a94a0, dark #5b6670.
- Pewter: #9aa3ad (metalness about 0.8). Glass: bottle green #3f7a4f.
- Fabric and sacks: burlap #c8a86b. Food: bread #d9a860, cheese #f0c85a, roast #b56545.
- Fire and candlelight: flame and ember emissive #ff9a3c at intensity 2 to 3 — the same warm accent contract as the dungeon kit. Never bake brightness into plain paint — light sources must be emissive bodies.
