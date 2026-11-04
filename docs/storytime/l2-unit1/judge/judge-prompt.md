# Storytime L2 unit 1 picture judge: fixed prompt

Version 2, 2026-11-04. Track `asset_storytime_l2_unit1_pictures_20261025`, task T3a.
Judge: Sonnet (`claude-code/claude-sonnet-5-5`) with native image input.
This prompt replaces the MiniMax and Kimi pre-checks of FR-9. The judge result is model evidence.
It is not acceptance.

The orchestrator gives this prompt without change to the judge, with one batch file
(`batch-<group>.json`) and the cast sheets (`cast.json`). The judge reads the picture files that
the batch lists. The judge does not see the expected result of any file.

## Your task

You judge children's book pictures for Storytime Advantage Level 2. Each picture is a color
picture or a line-art picture. A teacher or a child will see it in a printed book.

For each file in the batch, give one verdict: `pass` or `fail`.

## Rules

1. Judge each file at the printed size that it has. The file you get is already at that size.
   Do not zoom in. Do not crop. Do not enlarge the file.
2. A small mark is a note. It is not a fail. Write the small mark in `notes`.
3. A fail names exactly one hard defect class from the bar below and says where it shows in the
   picture. A fail without a defect class is not allowed. If you cannot name a class, give `pass`.
4. Check the character against the cast sheets in `cast.json`. A wrong or changed character
   (hair, face, clothes, age, species, collar, color) is a hard defect.
5. Check the picture against the page text in the batch (`pageText`). A wrong or missing prop,
   action, count, or character that the sentence needs is a hard defect. Count each object that
   the sentence counts.
6. The picture holds no words, letters, numbers, signatures, or watermarks. Text in the picture
   is a hard defect.
7. For a line-art file (`kind` is `line`), also check two more points. Gray or shading is a hard
   defect. A line gap that makes coloring hard is a hard defect. A line-art file must be black
   lines on white.
8. Judge each file alone. Do not compare it with the other files of the batch to decide a verdict.
9. Do not guess. When the picture is clear and has no hard defect, give `pass`.

## The bar

Daniel's text of 2026-11-01 at 14:15 ICT is the bar for every picture. Quote:

> The bar for every page is Daniel's text of 2026-11-01 at 14:15 ICT, quoted verbatim in every
> review prompt: marks of that size are not defects (a small mark at the nose, an open C-shaped ear
> line, outlined eyebrow bands, small dark shading inside the ears, a simplified branch or bush). A
> defect is only what a teacher or a child sees at book size: a wrong or changed character, a
> broken face, a clearly wrong hand or limb, a wrong or missing prop the sentence needs, a layout
> fault, text in the picture, gray or shading in the line art, or a line gap that makes coloring
> hard. Foreshortening is correct.

## The hard defect classes

Use exactly one of these values in `defectClass`:

| Value | Meaning |
| --- | --- |
| `wrong-character` | A wrong or changed character. |
| `broken-face` | A broken face. |
| `wrong-hand-or-limb` | A clearly wrong hand or limb. |
| `wrong-or-missing-prop` | A wrong or missing prop that the sentence needs (this class includes a wrong count). |
| `layout-fault` | A layout fault. |
| `text-in-picture` | Text in the picture. |
| `line-art-gray-or-shading` | Gray or shading in the line art. |
| `line-art-gap` | A line gap that makes coloring hard. |

## Output

Reply with one JSON object and nothing else. The object has the shape below.

```json
{
  "results": [
    {
      "id": "l2-w00-example-row",
      "kind": "color",
      "judgeFile": "out/storytime-review/judge/example/example-v1.png",
      "verdict": "pass",
      "defectClass": null,
      "where": null,
      "notes": ""
    },
    {
      "id": "l2-w00-example-row-b",
      "kind": "color",
      "judgeFile": "out/storytime-review/judge/example/example-b-v1.png",
      "verdict": "fail",
      "defectClass": "text-in-picture",
      "where": "a word on the wall at the top left",
      "notes": "short text; small marks go here"
    }
  ],
  "summary": { "files": 2, "pass": 1, "fail": 1 }
}
```

Field rules:

- `id`, `kind`, and `judgeFile` repeat the batch entry without change.
- `verdict` is `pass` or `fail`.
- `defectClass` is one value of the table for a fail. It is `null` for a pass.
- `where` says where the defect shows for a fail. It is `null` for a pass.
- `notes` holds the small marks and any short comment. It may be an empty string.
- `summary.files` is the number of results. `summary.pass` and `summary.fail` are the counts.
  `pass` plus `fail` equals `files`.
- The `results` array holds one result for each file of the batch, in batch order.
