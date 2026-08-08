# Public MCP temporal verification — 2026-07-23

## Accepted mechanical boundary

The existing 16-tool public MCP surface remains stable. `render_preview` now
accepts an optional bounded semantic animation request. The caller supplies
declared rig joints, named pose channels, clip timing/keyframes, directions,
FPS, and seed; Forge derives morphology, equipment, rig, pose, clip, frame-plan,
frame, and delivery identities. The caller cannot supply those hashes.

The real public stdio MCP replay produced four distinct transparent 128x128
source frames for the S view at 0, 125, 250, and 375 ms and one Forge-derived
512x128 atlas. The warm browser session uses a union bound for every temporal
sample. The accepted replay reports constant `worldUnitsPerPixel`
`0.035811160897346345`, constant 46-pixel top margin, and zero ground-anchor
deviation for every frame.

The successor portable replay also binds the exact 60,320-byte source GLB in
the same `forge-temporal-render-artifacts/v1` manifest and retrieves every
declared artifact exclusively through the public bounded-chunk operation. Four
source frames, one derived atlas, and the source GLB were retrieved; the GLB
correctly required two 32 KiB-bounded chunks.

Final independent fresh roots:

- `/tmp/faf-public-temporal-20260723-k`
- `/tmp/faf-public-temporal-20260723-l`

`diff -qr` reported no artifact-subtree differences. Both public MCP response
files have SHA-256
`00144033e4074721c89f4e3588ec52a8831ceecc0a06295ad0460a7828995ad1`,
and both complete public retrieval records have SHA-256
`3770037f65129b0ebfbe1b4c57d53ed88b2e24ea93d25d5ab8d5e951b34bae5f`.
The accepted mechanical delivery ID is
`delivery.150f89aa05ef6beab82d4196fad0e58ad22183c7bb0b2484602fed6087fe7b75`.
The source GLB identity and SHA-256 are both bound to
`glb.ef22ce2bad7e2c3051c4839a70a7cb568c75c4df99cf76c39a1d652e43d4099c`.

## Rejected races retained as evidence

The first successful atlas replay exposed per-sample camera fitting. Its
world-units-per-pixel scale changed between frames and therefore visibly pumped.
That output was rejected. The next implementation passed stable bounds only to
the interactive camera; the sprite renderer still recomputed per-frame bounds,
so its bytes remained identical to the rejected run. That output was rejected
too. The final replay routes one union bound into the actual directional sprite
renderer.

## Five-clip batch successor — mechanically accepted, visually rejected

The public surface now also accepts the bounded
`forge-reference-five-clip-authoring/v1` request and publishes one closed
`forge-temporal-render-batch-artifacts/v1` delivery. The exact ordered actions
and per-direction sample counts are `idle` (4), `walk_forward` (6),
`walk_right` (6), `attack` (6), and `receive_damage` (4). One warm browser
session produces 26 source frames, five per-clip pose sheets, one combined
atlas, one source GLB, and one canonical animation bundle retaining semantic
keyframe phase labels.

Fresh public-MCP roots:

- `/tmp/faf-public-reference-five-20260723-d`
- `/tmp/faf-public-reference-five-20260723-e`

Their complete public response, retrieval, and verification files are
byte-identical. The respective SHA-256 values are
`caf3baac5956871c87014720e1cade5f6ac69a2bd9a46bb6d8b2ff0fa2cf07f7`,
`23504070f5c8385a91d9a2edda8ebf59d62eca03d6995606f6b5c1ffb3a1f2c6`,
and `04f9baca8bc54d726b2f743bb0b45e0da3bf4af4b1adc82deeca1ccd6344f4b8`.
`diff -qr` reports no differences between the two public artifact subtrees.
The internal revision JSON differs only outside the public artifact subtree and
is not used as deterministic delivery evidence. The batch delivery ID is
`delivery.590e7568eaedbfa32650371e09621ee97d410037bd4547cba956f39b001473e6`;
its manifest SHA-256 is
`2133b6973ea55baaf09a9c6d57adb2e5856f3789bfaee72304c05436ea5edf96`.
The hardened replay independently reassembles all 37 retrieved chunks, verifies
every chunk and full-artifact digest, validates PNG dimensions and GLB
structure, and checks the five ordered bundle clips and their phase labels.

Pixel's strict consumer ingested the fresh `d` delivery and produced only a
`validated_unadmitted` staging plan. It correctly permits an identical neutral
frame across different clips while rejecting repeated/filler bytes within one
clip-direction.

Kimi WebBridge session `faf-five-clip-qa-d` loaded and displayed all five pose
sheets at enlarged native-pixel rendering. The browser-rendered evidence is
`/tmp/kimi-webbridge-pdfs/Five clip pose sheet QA.pdf`. Every one of the 26
frames was visible in the five sheets. The motion verdict is **reject**: the
reference rig only drives shoulders, so both walks leave the legs effectively
static; attack is mostly an arm swing; receive-damage lacks convincing
torso/root recoil; and idle is too weak to establish a production loop. This
delivery proves the transport and artifact contract, not acceptable animation.

## Full-body V2 motion scaffold — deterministic, browser-played, pack rejected

The successor reference rig drives root motion plus paired shoulders, elbows,
hips, and knees. The V2 correction holds `walk_right` at one three-quarter
facing instead of reversing yaw between samples, increases hip/knee separation,
reduces side-walk shoulder noise, and gives `receive_damage` a stable
impact, recoil, and recovery arc. Focused animation/contract tests reject yaw
reversal, weak side-view leg separation, unstable damage facing, and inadequate
recoil displacement.

Two same-source public stdio MCP replays were executed while the Forge source
tree was deliberately paused:

- `/tmp/faf-public-reference-full-body-v2-20260723-m`
- `/tmp/faf-public-reference-full-body-v2-20260723-n`

The MCP responses are byte-identical at SHA-256
`54415d099576c58070fea295d3bf93efe653d17c46312449ce29f77f5ec725e0`.
The complete 38-chunk public retrieval records are byte-identical at
`e6f3e53d4a8b83a8daf0d550d46b0910d4c2074a7321968c4e9b795702e24419`,
and the independent verification summaries are byte-identical at
`ae8f008fbbe2c6af52ea353a36760ca220d614e66fa369626b63347b3ff88b6b`.
The closed 34-artifact delivery is
`delivery.1cd3d8e17ba86b33432da3756ad24080aafa6f18e0629257db47aa60d7a0ba4f`;
its manifest SHA-256 is
`3b843972deaf555bff51af955e663152190adcb8e57e5104b09b72e5b44cea34`.

Kimi WebBridge loaded all five pose sheets and all 26 native frames with
nonzero intrinsic dimensions. The browser ran every clip at its declared
timing; all five playback counters advanced from tick 2 to tick 8 while every
current image remained a decoded 128x128 PNG. The browser-rendered all-frame
evidence is
`/tmp/kimi-webbridge-pdfs/Full body V2 five clip QA.pdf`.

The motion-specific verdict is **usable scaffold, not pack admission**.
`walk_forward`, `walk_right`, attack, and damage now have distinct
full-body temporal phases, and the side walk no longer flips equipment/facing.
The rendered placeholder character remains a crude, low-detail model that does
not match the approved reference target, so neither character quality nor
theme-pack visual acceptance is claimed. These clips must be rerendered and
reviewed on the accepted reference-matched character before S4 can close.

One prior replay returned the safe generic public repository error. The handler
had discarded the underlying exception despite directing operators to trusted
logs. The boundary now writes the internal exception to private stderr while
keeping the public response generic; the focused handler suite passes 13/13 and
Forge typecheck is green. This is observability evidence, not a claim that the
intermittent browser failure's root cause has been reproduced.

## Not accepted by this evidence

- The four-frame arm-swing proof is not a readable walk cycle.
- It does not meet the six-frame `walk_forward` requirement.
- It does not prove idle, walk-right, attack, or receive-damage.
- Pixel must ingest the successor manifest including its now-inline source GLB;
  the earlier consumer run covered the predecessor frame-plus-atlas shape.
- The implemented public contract is
  `forge-temporal-render-artifacts/v1`. Its relationship to the broader
  internal `forge-temporal-delivery/v1` metadata contract must be reconciled
  before final multi-clip pack admission; this evidence does not silently claim
  the two contracts are interchangeable.
- Pixel ingestion/playback and downstream runtime acceptance are not complete.
- This evidence accepts a mechanical producer boundary only, not production art.
