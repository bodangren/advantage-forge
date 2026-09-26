# Hamlet mockups: one layout, two asset languages

These images show one shared hamlet in [Chibi Quest](./chibi-quest.png) and [Riven Lands](./riven-lands-v2.png). Both are concept maps, not final game levels. The [component list](./components.tsv) defines the source assets to build for both treatments.

## Shared layout

The view is an orthographic, three-quarter map. North is at the top. The east-west dirt road crosses the middle. A north-south road runs from the northern edge, passes the central well, and crosses a stream on one wooden bridge near the southern edge. Forest frames the site.

Use a 12-column by 8-row planning grid, with column 1 at the west and row 1 at the north. These coordinates describe zones, not exact final engine positions.

| Zone | Grid area | Shared content |
|---|---|---|
| Northwest grove | Columns 1–4, rows 1–3 | Trees, rocks, three cottages, yards, fences |
| Northeast homes | Columns 8–12, rows 1–3 | Two cottages, yards, fences |
| Center | Columns 5–8, rows 3–5 | One well, four lanterns, two stalls, road crossing |
| West and east exits | Columns 1 and 12, row 4 | One signpost at each road exit |
| Southwest farm | Columns 1–4, rows 5–7 | One barn, one crop field, fences, barrels |
| Southern homes | Columns 4–10, rows 5–6 | One southwest cottage and one southeast cottage |
| Southern stream | Columns 1–12, rows 7–8 | Stream, banks, rocks, one central bridge |

The shared layout contains **seven cottages, one barn, two market stalls, one well, one bridge, two signposts, and four central lanterns**. The trees, rocks, fences, crop rows, barrels, and ground parts repeat. The images show an art direction and approximate placement. The component list controls which source assets get generated.

## Design treatments

| Treatment | Shape and color direction |
|---|---|
| **Chibi Quest** | Rounded cottage forms, broad colorful roofs, bright grass, cheerful market colors, soft stone edges, and open visual spacing. |
| **Riven Lands** | Tall, narrow gables, heavy stone footings, exposed timber braces, dark slate roofs, rugged ground, gnarled trees, and muted earth colors. |

Each component ID receives one Chibi Quest treatment and one Riven Lands treatment. Both versions keep the same gameplay meaning, map positions, pivot, and interaction points. Their visible proportions and surface treatment differ. A cottage may change its roof shape and surface treatment, but it remains a cottage at the same map position.

## Production use

1. Build the unique component IDs from `components.tsv` in both treatments.
2. Reuse each source model for all listed instances.
3. Assemble both scenes with the shared layout.
4. Compare the assembled scenes with these concept maps.
5. Adjust the placement data when gameplay testing requires it.

The current forge does not read map images or extract components automatically. The component list is the explicit bridge from these maps to source asset generation.
