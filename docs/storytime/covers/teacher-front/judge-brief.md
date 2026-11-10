# Cover judge brief: Storytime Level 2 unit 1 Teacher Book front

Date: 2026-11-10. From: Forge. For: the frozen Sonnet judge.

This brief names the checks of one cover picture and the form of the result. The judge kit has no
change. The judge reads the two copies of one try in `out/storytime-review/judge/cover/`:

- `<id>-m<n>-clean.png`: the picture at 1448 x 2048 px, with no other change.
- `<id>-m<n>-zones.png`: the same picture with 6 zone lines.

The id is `l2-u1-cover-quest-teacher-front`. The try number `<n>` is the Muse version of the try.

## The zone lines

The zones are read from the height of the picture. Each line has its own color.

| Line | Row at 2048 px | Meaning |
| --- | --- | --- |
| red | 410 (20 percent) | the top of the logo tile |
| orange | 594 (29 percent) | the end of the frame of the brief |
| yellow | 614 (30 percent) | the end of the calm top band |
| green | 1597 (78 percent) | the top of the bottom band |
| blue | 1802 (88 percent) | the lower part of the bottom band |
| magenta | 1925 (94 percent) | the end of the bottom band |

## The checks

The judge answers each check with `pass` or `fail` and one short reason.

1. **AF-1.** Sam's red T-shirt shows exactly two white stripes across the chest and nothing else.
2. **AF-2.** Nan's orange T-shirt shows one white star and no letters.
3. **AF-3.** Nan wears the orange T-shirt with the white star, and Sam wears the red T-shirt with
   the two white stripes. Each child keeps his or her own clothes.
4. **AF-4.** Teacher Kim shows the open book to the children. She does not read it herself, and
   the open pages do not face only the viewer. The pages face Nan and Sam.
5. **No text.** The picture holds no letters, no words, and no numbers. It holds no signature, no
   watermark, no logo, no border, no frame, and no ruler.
6. **The cast.** The picture holds the three people of the cast: Teacher Kim, Nan, and Sam. Each
   one looks like the approved 3D cast picture. The picture holds no Pip and no other animal.
7. **The count.** The picture holds exactly three people.
8. **The free band.** The faces, the hands, and the open book stay between the yellow line (30
   percent) and the green line (78 percent).
9. **The calm top.** The area above the yellow line holds sky and leaves only. It holds no face,
   no hand, no book, and no key object.
10. **The bottom band.** The area below the green line holds grass, flowers, and feet only. It
    holds no face, no hand, and no book.
11. **No flag-like shape.** The picture holds no single circle, star, cross, or stripe pattern on a
    plain field, alone on a book page, a banner, a cloth, or a sign. The white star on Nan's orange
    T-shirt and the two white stripes on Sam's red T-shirt are cast marks, and they stay.
12. **The style.** The picture looks like the accepted student front: bright painted anime fantasy
    key art, soft cel shading, clean line art, lush scenery, warm sunlight, vivid colors, and big
    expressive eyes. It is not 3D, not a render, and not clay.

## The result form

The judge writes one JSON file per round:

- `measure/runs/asset_storytime_l2_retries_cover_20261110/judge-cover-r<round>.json` for the round
  of the 3 tries;
- `measure/runs/asset_storytime_l2_retries_cover_20261110/judge-cover-second.json` for the second
  judge of one file.

The form of one result file:

```json
{
  "id": "l2-u1-cover-quest-teacher-front",
  "try": 1,
  "model": "claude-code/claude-sonnet-5-5#high",
  "judgePrompt": "judge-prompt.md v6",
  "results": [
    {
      "file": "l2-u1-cover-quest-teacher-front-m1-clean.png",
      "verdict": "pass",
      "checks": [
        { "id": "AF-1", "verdict": "pass", "note": "two white stripes and nothing else" },
        { "id": "AF-2", "verdict": "pass", "note": "one white star" }
      ],
      "notes": "one short line about the picture"
    }
  ]
}
```

Every check of the list above has one entry. A missing check makes the result file invalid.

## The rule of the result

The judge result is model evidence. It is not acceptance. The picture goes to Workbooks, and
Workbooks looks at the native size. No file of this track may say that Daniel, the PM, or Workbooks
accepted a picture.
