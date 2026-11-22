# JSON prompt template for generated video clips

Template only, 2026-11-22. Source: a public post of 2026-11-21 that showed a JSON timeline prompt
for Gemini video (PM backlog item 2026-11-22).

Purpose: this file holds a JSON timeline prompt for a generated multi-shot clip. One timeline
step gives one shot. Generation needs the owner's approval, because it costs money. Do not
generate a clip from this file in a normal work session.

## The template

```json
{
  "type": "<multi-shot scene>",
  "duration": "<8 s>",
  "aspect_ratio": "<16:9>",
  "resolution": "<1920x1080>",
  "style": "<soft daylight, calm>",
  "camera": { "style": "<handheld>", "depth_of_field": "<shallow>", "focus": "<book>", "movement": "<pan>" },
  "environment": "<primary classroom reading corner>",
  "main_subject": "<a picture book on a rug>",
  "timeline": [{ "time": "<0-3 s>", "scene": "<frame>", "action": "<motion>", "camera": "<move>" }],
  "negative": ["<item to avoid>"],
  "constraints": ["<fixed rule>"]
}
```

## The fixed rules

The `constraints` block holds our rules, word for word. The `negative` block holds the same items.

- Real products only (show real printed books and workbooks; never AI-drawn workbooks).
- No student faces.
- No white Western teacher.
- No added text or logos (no captions, titles, watermarks, or brand marks in the picture).

## Field guide

- `type`: clip kind; `<multi-shot clip>`.
- `duration`: length in seconds; `<8 s>`.
- `aspect_ratio`: frame shape; `<16:9>`.
- `resolution`: pixel size; `<1920x1080>`.
- `style`: look, light, and mood; `<soft daylight, calm>`.
- `camera`: four camera fields; `style` `<gentle handheld>`, `depth_of_field` `<shallow>`,
  `focus` `<the open book>`, `movement` `<slow push in>`.
- `environment`: place and time of day; `<primary classroom reading corner>`.
- `main_subject`: the one thing the clip shows; `<a picture book on a rug>`.
- `timeline`: ordered steps, each with time, scene, action, and camera; `0-3 s`.
- `negative`: items to keep out of the picture; `<caption>`.
- `constraints`: the fixed rules above; `<no student faces>`.

## Worked example: Storytime reading corner

A cozy reading corner in a Thai primary classroom, late morning. A picture book lies open on a
rug. Children show only from behind, or as hands that turn the pages. No faces. The clip is rated
G.

```json
{
  "type": "multi-shot scene",
  "duration": "8 s",
  "aspect_ratio": "16:9",
  "resolution": "1920x1080",
  "style": "soft daylight, warm and calm, natural color",
  "camera": {
    "style": "gentle handheld, steady",
    "depth_of_field": "shallow",
    "focus": "the open picture book on the rug",
    "movement": "slow push in"
  },
  "environment": "a cozy reading corner in a Thai primary classroom, late morning",
  "main_subject": "one open picture book on a soft rug, with a low shelf of books behind it",
  "timeline": [
    { "time": "0-3 s", "scene": "wide corner, rug, shelf", "action": "lays the book", "camera": "push in" },
    { "time": "3-6 s", "scene": "two children behind", "action": "turns one page", "camera": "settles low" },
    { "time": "6-8 s", "scene": "new spread, book stack", "action": "hands rest", "camera": "holds steady" }
  ],
  "negative": [
    "AI-drawn workbook",
    "student faces",
    "white Western teacher",
    "captions, titles, watermarks, brand marks"
  ],
  "constraints": [
    "real products only (show real printed books and workbooks; never AI-drawn workbooks)",
    "no student faces",
    "no white Western teacher",
    "no added text or logos (no captions, titles, watermarks, or brand marks in the picture)"
  ]
}
```
