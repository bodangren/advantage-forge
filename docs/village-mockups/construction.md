# Village — construction contract

Shared design rules for the chibi village kit. The village is an outdoor scene (no walls,
no roof) that reuses the hamlet and forest kits extensively. The new pieces are roads,
cottages, farm field, fence, barn, clothesline, shop-stall.

## 1 · Road system

Two modular 2 m dirt road tiles: `dirt-road-straight`, `dirt-road-corner`. They tile on
the same 2 m grid as the hamlet's `dirt-road-*` family, sharing the same warm earth
palette so the village road reads as a continuation of the hamlet road.

- Compacted dirt: `#a87a4a`, dry shade `#7d5630`, wet rut `#4f3a26`.
- Soft worn edges; sparse grass tufts (`#5fb14d`) creeping in at the shoulders.
- Tracks in the centre (slight darker shade) for wagon ruts.

## 2 · Cottage grammar

`cottage` is a small, single-storey building:

- Whitewashed plaster walls `#f0e4cc` shading to `#d8c9a8` near the ground.
- Thatched roof (`#caa14a` to `#a07830`) on a steep pitch, soft bevel on every reed.
- One chimney (`#5e5e58` stone) on the roof, with a thin smoke wisp.
- One wooden door (walnut `#6b4226`), one shuttered window with honey-oak frame.
- Soft bevels everywhere; reads at 128 px as one stout little thatched cottage.

## 3 · Barn grammar

`barn` mirrors the cottage shape but is larger and timber-frame:

- Walnut posts (`#6b4226`) with horizontal plank infill (`#8a5a35`).
- Thatched roof (same family as cottage).
- Big barn doors (split double-door, swung half-open), iron strap hinges.
- A small hayloft window high on the gable.

## 4 · Farm field

`farm-field` is a 2 m × 2 m tilled plot:

- Soil base `#6e5236` with `#8a6a48` rows.
- Three to four furrows per tile, evenly spaced.
- Slight grass tufts (`#5fb14d`) at the edges.

## 5 · Fence

`fence` is a 2 m wooden plank section:

- Three horizontal honey-oak rails between two walnut posts, 0.6 m tall.
- Posts slightly taller than the rails, soft bevel.
- Reads at 128 px as one stout low fence.

## 6 · Shop-stall

`shop-stall` is an open-air market stall:

- Two walnut posts holding up a striped canvas awning (warm yellow `#caa14a` +
  warm red `#a04638` stripes).
- A wooden counter at the front, an open back.
- Two crates and a few bottles on the counter.
- Reads at 128 px as one stout little market stall.

## 7 · Clothesline

`clothesline` is a 2 m line strung between two walnut posts:

- Posts 0.9 m tall, 2 m apart.
- A hemp line between them at 0.85 m.
- Three small cloth items (shirt, trousers, bedsheet) hanging from the line in
  warm tan / soft cream / muted blue.

## 8 · Reuse from prior kits

`oak-tree`, `pine-tree`, `bush`, `wildflowers`, `fallen-log`, `rock-cluster`,
`well`, `hero/farmer`, `hero/merchant`, `npc/adventurer` are reused from the
hamlet and forest kits (per their construction contracts).
