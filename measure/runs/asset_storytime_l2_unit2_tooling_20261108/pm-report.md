# Unit 2 tooling: PM report

Status: done.

## Hand-off

The hand-off folder `/home/daniebo/Desktop/handoff/storytime-l2u2-picture-prep/` holds 258
files. `MANIFEST.txt` lists 257 files. `sha256sum -c MANIFEST.txt` gives 257 OK and 0 FAILED.

## Guard

Guard: U2_RUN cap empty, every unit 2 call refused until the PM writes the approved limit.
The refusal message is `refused: the unit 2 cap is empty; the PM writes the approved limit in U2_RUN.capUsd`.

## Tools

- Judge option: `--unit2` of `scripts/storytime-judge-batch.mjs` reads the unit 2 specs and cost
  rows, writes the batch files to `docs/storytime/l2-unit2/judge/prod/`, and writes the judge
  copies to `out/storytime-review/judge/prod-u2/`.
- Delivery writer: `deliverMuseUnit2` of `src/storytime/muse-delivery-u2.ts` copies the approved
  color and line files and the 48 reuse files under the list names, checks the list pin, the
  size, the PNG format, the bit depth, the alpha channel, and the line art, and writes
  `manifest.json`.

## Line sentences

Each face word has its own line feature sentence. A duck, a doll, and a fish get no ears. The
elephant line names the trunk. The 24 face-word specs were regenerated, and the hand-off folder
was rebuilt.

## Spend

Spend: 0 USD. No Muse call and no OpenRouter call ran. The 16 `costs.tsv` hashes equal the hashes
of `measure/runs/asset_storytime_l2_unit2_prep_20261108/costs-after.txt`.

## Facts changed:

- The hand-off `MANIFEST.txt` changed: the folder holds 258 files and 257 OK lines.
- The line prompts of the duck, doll, fish, hen, elephant, horse, goat, dog, and cat rows changed.
- No price, date, status, or name changed. No unit 2 picture is accepted. No "Go" exists.
