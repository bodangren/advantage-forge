# Haiku trial results (baker, 2026-10-09)

Track: measure/tracks/asset_p2_npc_haiku_trial_20261009. Brief: bench/haiku/brief-baker.md.
Mockup: docs/npc-mockups/baker_001.jpg. All seven arms started at 18:54:15 at the same time.
Forge builds ran one at a time under one `flock`, so the agents waited for each other's builds.

## Arms

| Arm | Model | Wall time | Subagent tokens | Tool uses | Renders | `forge check` |
| --- | --- | --- | --- | --- | --- | --- |
| h1 | Haiku 5.5 | 17.6 min | 98,158 | 21 | 3 | ok |
| h2 | Haiku 5.5 | 22.8 min | 98,038 | 25 | 3 | ok |
| h3 | Haiku 5.5 | 10.0 min | 96,887 | 15 | 2 | ok |
| h4 | Haiku 5.5 | 12.3 min | 103,658 | 14 | 2 | ok |
| h5 | Haiku 5.5 | 13.4 min | 97,646 | 22 | 2 | FAIL: tray 6.2 cm into the head in cheer |
| h6 | Haiku 5.5 | 22.5 min | 96,357 | 19 | 2 | ok |
| s1 | Sonnet 5.5 high | 20.0 min | 76,357 | 20 | 3 | no held item (tray on `spine`) |

Haiku total: 590,744 tokens for six arms. Sonnet: 76,357 tokens for one arm.
The h2 and h5 values are from the first hand-back; each stopped with a background build still running.

## Common defect

Every arm left the arms in the kind's rest pose, so no hand grips the tray. The tray rests on
`chest` or `spine`, or floats in front of the body. The `humanoid-kind` base has no hold pose for a
two-hand item, and the brief did not give one. This defect comes from the base and the brief, not
only from the model.

## Review

Round 1 (independent reviewer, cards in bench/haiku/cards/): bench/haiku/review-r1.json.
Reviewer: 106,790 tokens, 3.7 min.

| Arm | Rating | Main defects |
| --- | --- | --- |
| s1 | 6.5 | hands leave the tray (cap 6.5); oven-mitt cuffs; small tuft, bowl back hair |
| h6 | 5.5 | hands leave the tray; default face without the smile |
| h1 | 5.0 | apron stretches to the chin in cheer |
| h4 | 5.0 | muffin hat |
| h2 | 4.5 | the bib flies off in cheer; lipstick mouth |
| h3 | 4.0 | the bib tears in cheer; the loaf looks like a pot |
| h5 | 3.0 | fails `forge check`; the tray goes through the face |

No arm reached 7.0. Best base: s1.

## Round 1 is not a fair model test

s1 ran as the `forge-sonnet-high` agent (Forge instructions, large turn budget). h1 to h6 ran as the
general-purpose agent. The agent setup and the model changed together. Round 2 (f1 to f6) runs
Haiku 5.5 in the `forge-sonnet-high` setup with the same prompt as s1. It started at 19:28:01. Two
lines were added for fairness: do not read other baker files (assets/baker.ts existed by then),
and do not use the new `hold` option (s1 did not have it).
Round 2 builds share the lock with the orchestrator's final baker build.

### Round 2 arms (Haiku 5.5, `forge-sonnet-high` setup)

| Arm | Wall time | Context at end | Tool uses | Renders | `forge check` |
| --- | --- | --- | --- | --- | --- |
| f1 | 10.0 min | 140,339 | 21 | 2 | ok |
| f2 | 17.3 min | 144,605 | 21 | 2 | FAIL: tray 8.3 cm into the skin in cheer |
| f3 | 12.4 min | 124,101 | 20 | 2 | ok |
| f4 | 15.0 min | 127,089 | 23 | 3 | no held item (tray on `chest`) |
| f5 | 21.0 min | 148,997 | 23 | 3 | FAIL: tray 8.9 cm into the head in cheer |
| f6 | 23.4 min | 132,907 | 29 | 2 | ok |

Every round 2 arm left the hands off the tray (the `hold` option was not allowed).

Round 2 review (a new independent reviewer, s1 included as the reference): bench/haiku/review-r2.json.

| Arm | Rating | Fixability | Main defect |
| --- | --- | --- | --- |
| s1 | 6.5 | small | cheer leaves the tray in the air; static model about 7.1 |
| f4 | 6.3 | medium | a plain cylinder hat; the scalp shows bald |
| f1 | 6.1 | medium | the hat is small and reads as a beret |
| f6 | 5.8 | medium | a leaf-shaped tuft, a lopsided hat, a wide tray |
| f3 | 5.3 | large | the apron has no bib; the straps are sticks |
| f2 | 4.8 | medium | the tray goes through the face in cheer |
| f5 | 4.3 | large | the tray goes through the face; a helmet hat |

s1 got 6.5 from both reviewers, so it anchors the two scales. Best Haiku arm: 5.5 (general agent)
to 6.3 (Forge setup). Haiku mean: 4.5 to 5.4. Sonnet stays ahead, and no arm passes alone; the
shared tray defect comes from the base, which had no two-hand hold.

## Token numbers

The `subagent_tokens` number in a task notice is the context size at the agent's last call, not
a total (h1: notice 98,158, last call 97,205). Totals from the transcripts:

| Arm | Calls | Peak context | Cache write | Cache read |
| --- | --- | --- | --- | --- |
| h1 | 17 | 97,205 | 175,302 | 1,137,645 |
| h2 | 18 | 97,186 | 250,524 | 1,208,807 |
| h3 | 14 | 96,054 | 155,279 | 895,082 |
| h4 | 11 | 102,914 | 169,020 | 727,870 |
| h5 | 21 | 97,076 | 156,843 | 1,489,552 |
| h6 | 16 | 95,565 | 228,520 | 988,472 |
| s1 | 18 | 75,658 | 146,391 | 904,853 |
| f1 | 12 | 138,732 | 138,730 | 1,193,906 |
| f2 | 15 | 143,811 | 282,362 | 1,425,755 |
| f3 | 12 | 123,085 | 236,245 | 934,410 |
| f4 | 17 | 126,097 | 240,189 | 1,525,791 |
| f5 | 17 | 147,880 | 422,731 | 1,542,147 |
| f6 | 22 | 131,926 | 373,115 | 2,020,451 |

Uncached input is 22 to 44 tokens for each arm. The transcripts give 118 to 422 output tokens for
each arm. These values are too low for 11 to 22 calls with code edits, so the output counts are
not reliable.

`~/.claude/settings.json` sets `autoCompactWindow: 100000` for `claude-haiku-5-5`. No arm compacted:
the transcripts have 0 compact events, and the context never shrank between two calls, although
round 2 arms went to 148K.

## Finishing pass (orchestrator, on s1)

- `assets/parts/humanoid-kind.ts`: a new `hold` option (rest elbow and wrist, the fist turned with
  the forearm, arm bones out of every clip). Without `hold`, the avatar base is unchanged: an A/B
  build of the committed and the edited kind gave 0 vertex movement in all five bodies, and the
  same animations and nodes.
- `assets/baker.ts`: s1 with the hold, the tray and loaves rigid on `hand.R`, thin cuffs, a bigger
  curled tuft, back hair rounded to the nape, larger and lighter sesame seeds.
- `./forge check baker`: result ok with the tray as a held item; nothing within 5.0 cm of the head.
- Renders: 3 fast renders and 1 cheer strip.
- Review 1 (bench/haiku/review-final.json): 6.8, fail. Smile too small, tray tilts in cast, no socks.
- Pass 2: the hands take back the spine and chest lean and roll (the tray stays level); a wide
  grin with upturned corners and thinner arched brows; a cream sock band; the trousers end higher;
  the apron hem rises to 0.168; the hat puff is 0.02 to 0.025 taller. 2 fast renders, 1 cast strip.
- `./forge check baker`: result ok (closest 4.9 cm). `./forge all baker`: 0 warnings.
- Review 2 (bench/haiku/review-final2.json, a new reviewer): **7.2, pass**. Open notes: a hard
  edge on the back hair, small motion in cast and cheer, two identical loaves.
- Arm sources moved to bench/haiku/arms/ (evidence only; they are not built).

## Conclusion

1. Six parallel Haiku arms did not beat one Sonnet arm. In both rounds, the Sonnet arm was the best
   base (6.5). The best Haiku arm reached 5.5 as a general agent and 6.3 in the Forge setup.
2. Haiku used more tokens in total: six arms read 7.6M (round 1) and 10.3M (round 2) input tokens
   (cache reads and writes), against 1.05M for the one Sonnet arm. Compare with the price per
   token before any decision.
3. Wall time was close: about 23 minutes for each round, because the build lock queued every build.
4. No arm passed alone. The largest shared defect came from the base (no two-hand hold), not from
   the model. The orchestrator pass (two reviews) was necessary for every route.
5. Recommendation: keep one `forge-sonnet-high` arm per NPC. Fix the base defects first, because
   they cap every arm.
