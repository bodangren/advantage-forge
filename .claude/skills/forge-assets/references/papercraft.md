# Paper pop-up dioramas (papercraft skill) — parked trial

Status: one-off trial on 2026-11-22. Parked. The trial is closed. Daniel's word:
"Keep it in your back pocket. It is interesting, but maybe not right for Riven Lands."
Use this note only if a later task asks for a paper diorama.

## What it is

The papercraft skill builds paper dioramas in a browser. It prints cardstock, folds the sheets,
and pops the pieces up. Source: `github.com/xikhar/papercraft`, commit
`62aca0ecdd066b16d83edbf39f4aea41abddd00c` (version 0.5.0). The licence is MIT, copyright 2026
Shikhar.

Treat the code as an untrusted download. Read it before you use it. Vendor it into a scratch
folder only. Never vendor it into Forge source.

## Method that worked

- Print every surface on canvas with the skill's `paperkit` libs. Do not use image generation.
- Copy `three.module.js`, `three.core.js`, and `three.webgpu.js` from the local Forge install
  into the page. A local copy keeps the captures independent of a CDN.
- Capture the still headless at t=8 s. This is the settled overview.
- Record the video as a deterministic fixed-step capture. Step the clock by `1/fps` and write one
  PNG for each frame: 480 frames for 16 s at 30 fps. Encode the frames with the system ffmpeg.
  Playwright `recordVideo` needs its bundled ffmpeg, and that binary is absent on this machine.
- Run every capture through `heavy-run.sh`.
- Probe a suspect glow with a raycast and a texture sample. The probe fires a ray at the screen
  pixel, lists the object chain, and reads the texel under the hit. This proves which object
  makes the glow.

Video encode:

```
ffmpeg -y -framerate 30 -i out/vframes/f%04d.png -c:v libx264 -pix_fmt yuv420p -crf 18 out/riven-papercraft.mp4
```

## Defaults taken

- A fold-out map board with 5 labelled story places.
- One figure only: a faceless paper silhouette in one colour.
- Day light. No sound.

## Faults after round 2

- Two white bokeh glows stay on the bridge: one at the far ramp foot, one on the rail. They are
  pixel-identical through about 10 changes. The probe shows the glow needs bridge geometry.
  Darker print, edge, lip, and posts did not move it.
- The Harbor label sits in the focus blur. It is hard to read.
- Two tiny leaf specks appear in the first frame.

## Faults from round 1 that round 2 fixed

- Label text fit: each label now measures its text with `measureText` and shrinks the font to fit
  the card. The text was wider than its card, so the card hid the ends.
- The muddied bottom-left corner: the oversized near pine left the frame and shrank from scale
  1.7 to 1.3.
- Leaf specks in the first second: the leaf band dropped from 7.5 to 4 H units, and the count
  from 26 to 20.

## Outputs

The still and the video are on Google Drive, in folders `1hj_AV-v2obuKDOivvV5kX10sAs-iRePw` and
`1TslSHRgrC11OpuDE1EUb3Bqcz_3CNGvt`. The scratch folder is deleted.
