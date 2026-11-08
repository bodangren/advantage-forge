# PM report: Storytime Level 2 unit 2 picture prep (unpaid)

Status: done.

- Hand-off folder: `/home/daniebo/Desktop/handoff/storytime-l2u2-picture-prep/`
- File count: 258 files (257 files in `MANIFEST.txt` plus `MANIFEST.txt`). `sha256sum -c MANIFEST.txt` gives 0 FAILED.
- Rows: 229. New rows: 181. Reuse rows (D3): 48.
- New element sheets: 9 (draft specs in `specs/elements/`).
- Forge renders reused: 14 view files. Forge renders made now: 0. Every named asset had a views file.
- Unit 1 element files reused (not copied): 24, with SHA-256 in `elements-reused.tsv`.
- Cost estimate for the paid run: 181 x 0.080 USD plus 9 x 0.01 USD = 14.57 USD.
- Spend now: 0 USD. `costs-after.txt` equals `costs-before.txt`.
- Spec test: 4 tests pass.

## Open questions with defaults

1. "Printed-book style B" is read as the unit 1 look without change (Workbooks D8).
   Default: keep the unit 1 look.
2. A class C check-row whose word already has a unit 1 check-row picture is marked `reuse`.
   Default: copy the reuse source under the new row name (0 USD).
3. The 9 new element sheets are part of the paid run. Default: generate them first.
4. The next unpaid steps of D8 start after the "Go": the unit 2 guard entry with the cap of the
   Go, the unit 2 judge batch flag, and the unit 2 delivery writer.

## Next unpaid steps (D8, after the "Go")

1. Add a unit 2 entry to `scripts/storytime-muse-guards.mjs` with the cap of Daniel's "Go".
2. Add a unit 2 flag to the judge batch builder.
3. Write the unit 2 delivery writer.

## Facts changed

- New files: the unit 2 element map, the row table, 229 row specs, 9 element specs, the spec maker,
  and its test.
- New hand-off folder: `/home/daniebo/Desktop/handoff/storytime-l2u2-picture-prep/`.
- Counts: 229 rows, 181 new rows, 48 reuse rows, 9 new element sheets, 0 renders made,
  14 Forge view files reused, 24 unit 1 element files reused.
- Cost estimate: 14.57 USD for the paid run. No spend now.
- No price, date, status, number, or name of a product changed.
