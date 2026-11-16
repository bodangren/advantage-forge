# Mockup log

Tool: `mmx image generate` (MiniMax Token Plan, image-01). Size 1024 x 1024. The calls use the plan
quota and add no metered charge.

Quota of the `general` model, interval before the calls: 39 percent. After the calls: 36 percent.
Weekly quota: 81 percent before and 81 percent after.

All 3 calls answered with `saved` and no failure. No asset needs a text-only brief.

## towel-stack

```
mmx image generate --prompt "Chibi picture-book 3D prop: a stack of three folded bath towels, one cream, one teal, one terracotta, stacked with a slight lean, soft rounded slab folds, one folded corner that hangs over the edge, a stitched band on the top towel, soft bevels everywhere, warm cheerful palette, clay-toy render, three-quarter view from slightly above, plain warm cream background, soft studio light, one object only, centred, bold readable silhouette, no text, no letters, no numbers, no watermark, no border, rated G." --width 1024 --height 1024 --out docs/bathhouse-mockups/towel-stack-mock.jpg
```

Path: `docs/bathhouse-mockups/towel-stack-mock.jpg`. SHA-256
`ed68da1b64c64f11491b3ada41d6fad6a27027f4d7ae84a64ee0c1e1b9a41a01`.

## wash-basin

```
mmx image generate --prompt "Chibi picture-book 3D prop: a wide shallow wooden wash basin made of fat oak staves with a thick pale rim, two dark iron hoops round its body, a small foot ring, still bright blue water inside, and a chunky little wooden dipper leaning across the rim at the front. Rounded chunky forms, soft bevels everywhere, warm cheerful palette, clay-toy render, three-quarter view from slightly above, plain warm cream background, soft studio light, one object only, centred, bold readable silhouette, no text, no letters, no numbers, no watermark, no border, rated G." --width 1024 --height 1024 --out docs/bathhouse-mockups/wash-basin-mock.jpg
```

Path: `docs/bathhouse-mockups/wash-basin-mock.jpg`. SHA-256
`c8e737f4d21f2d2e758cea2731364e16a277afe0b51e83ce01dfc0d81dfed347`.

Note: the mockup shows a dark foot band and no second body hoop. The brief keeps the 2 iron hoops,
because the brief is the design contract.

## towel-rack

```
mmx image generate --prompt "Chibi picture-book 3D prop: a small wooden towel stand, 0.8 m tall, with two A-frame feet, a thick round oak top rail, a thin lower rail, one wide cream linen towel hanging over the top rail with a teal stripe and a wavy hem, and a small folded hand towel on an iron peg at the side. Rounded chunky forms, soft bevels everywhere, warm cheerful palette, clay-toy render, three-quarter view from slightly above, plain warm cream background, soft studio light, one object only, centred, bold readable silhouette, no text, no letters, no numbers, no watermark, no border, rated G." --width 1024 --height 1024 --out docs/bathhouse-mockups/towel-rack-mock.jpg
```

Path: `docs/bathhouse-mockups/towel-rack-mock.jpg`. SHA-256
`f7d2eaf893546d31e8180641fec6cd16e9e5a9007d3791e1039fa45e4e1882a2`.

## Briefs

One brief per asset. Both arms read the same file, byte for byte.

| Brief | SHA-256 |
| --- | --- |
| `briefs/towel-stack.md` | `1a49883f406eb103d53fde702734d257972b4a24c12bc9c8419ca5f525bd4f2f` |
| `briefs/wash-basin.md` | `2db335f8926e13c51d8a50f8fbb2e4eba751c3fff602d9c0b96e2b5f7f19d8e6` |
| `briefs/towel-rack.md` | `95e6491593527cb6076ed36d8f3355a2008688398f86e61e6875c137abef31c4` |

## Style

The 3 prompts use the chibi picture-book look of `docs/item-mockups/` (for example
`bucket-mock.jpg`): one prop, soft bevels, a warm palette, a plain background, and a
three-quarter view from slightly above.
