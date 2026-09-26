# Props (containers, furniture, clutter, interactables)

Worked examples: `assets/barrel.ts` (revolved body, stave grooves, per-stave tint, hoops that
hug the bulge) and `assets/treasure-chest.ts` (plank box, iron fittings, hinged lid that opens,
gold inside).

## Design first

Props fill the world, so they must read fast and fit together. Decide the prop's job: is it
decoration (background barrel), a landmark (well, statue), or interactive (chest, door,
lever)? Interactive props deserve a focal point (the lock, the handle) and an animation.

Real sizes keep a set consistent: barrel 0.9 m tall, crate 0.6 m, chest 0.7 x 0.5 x 0.45 m,
chair seat 0.45 m high, table 0.75 m, door 2 m, lantern 0.3 m, pot 0.3 to 0.5 m.

Stylize by exaggerating the shape's character: barrels bulge more, chests have chunkier
fittings, crates have thicker boards, everything leans slightly or has a small asymmetry.

## Construction recipes

- **Wood boards**: model the solid, then paint boards with `paintFn` — board index from
  `Math.floor(y / boardHeight)`, a dark line near each board edge, a per-board tint from
  `noise.random(board, seed)`, and grain from noise stretched along the board. Put the grain
  and the board gaps in `bump` too (small, 2 to 4 mm) so the normal map shows them.
- **Staves** (barrels, buckets, tubs): angle around the axis `Math.atan2(z, x)`; stave index
  from that; V grooves at stave seams via a small `displace` or `bump`.
- **Metal bands and fittings that hug the shape**: a thin shell of the body intersected with
  a band or box: `shell = body.round(0.009).subtract(body.round(-0.002))`, then
  `shell.intersect(sdf.box(...))`. Corner guards: the shell intersected with boxes at the
  corners (`.mirror('x', 0).mirror('z', 0)`). Studs and rivets: small spheres on the surface.
- **Revolved shapes** (pots, vases, barrels, bottles, lanterns): `sdf.revolve(profile.polygon(points, { smooth: true }))`
  with the profile's U as radius and V as height. Hollow with `.shell()` or by subtracting
  a smaller revolve; add a rim with a torus.
- **Curved lids and arches**: extrude a half-ellipse profile along X
  (`sdf.extrude(profile, W).rotateY(90)`). Hollow the underside so an opened lid shows its inside.
- **Locks, handles, knobs**: extrude a simple shield outline, round it, paint a keyhole with an
  extruded stencil through it. Gold with metalness 1, roughness 0.3 is the accent.
- **Contents** (coins, potions, food): a heap ellipsoid with noise, clipped to the container's
  inside, plus a few loose pieces at random tilts; a gem as the brightest accent.
- **Cloth** (sacks, covers, banners): ellipsoids and boxes with low-frequency `displace`
  (wrinkles 1 to 2 cm), a tie or rope as a torus or `chain`.

## Interactivity

Give interactive props a skeleton and a clip. A chest: bones `base` and `lid` (joint on the
hinge line), a one-shot `open` clip with an overshoot ease, and a looping `rattle`. A door:
`frame` and `door` bones (hinge on the side), `open`. A lever: `base` and `handle`. Bodies that
move are bound rigidly with `bone: 'lid'` and so on. Give the moving body a different name
from its bone (`lid-wood` for bone `lid`).

```ts
const easeOutBack = (t: number) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;
k.animation('open', {
  duration: 1.1,
  loop: false,
  pose: (_t, p) => ({ lid: { rotate: [-105 * easeOutBack(Math.min(1, p * 1.15)), 0, 0] } }),
});
```

## Failure modes seen in practice

- **Fittings as solid slabs**: a band box that covers a whole face turns the face into metal;
  intersect with a thin shell and keep bands narrow.
- **Wavy metal reflections**: noise on metal is magnified by reflections; use roughness 0.5+
  on worn iron and keep metal `bump` tiny.
- **Flat wall when a lid opens**: hollow the lid.
- **Name clash** between a body and a bone (`lid`): the animation silently does nothing.
- **Everything the same brown**: separate wood, iron, and gold by value and metalness.
