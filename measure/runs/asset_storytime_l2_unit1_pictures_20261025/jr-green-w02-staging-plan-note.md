Plan note for Phase 4 Task 2 (not yet in plan.md: measure-guard blocked the edit).

Change the Task 2 line from `- [ ] Task: Produce weeks 2 to 7 after the week 1 review.` to `- [~] ...`
and add this block under it:

  - Week 2 staging (inputs only; no page candidate until Daniel's week 1 answer). Green round of
    2026-11-02, claude-code/claude-sonnet-5-5#high. role_base_sha `fc76c272`, phase_base_sha
    `fc76c272`. Red model opencode-go/deepseek-v4.1-flash. Image model meta/muse-image. Coder: none.
    Specs commit `38ab28a9`: 27 page specs in `docs/storytime/l2-unit1/w02/muse/<row id>.json` and 11
    element specs in `docs/storytime/l2-unit1/w02/muse-elements/` (a sibling folder, so the stage
    check sees only row ids). The stage-check script is not written yet. Red writes the tests first.
    - Page specs: `text` is the list `text` and `goal` is the list `prompt`, as exact strings. The 9
      check rows (class C) have the list prompt `""`, so their `goal` is `""`. The object
      description sits in `colorPrompt`. `outDir` is `out/storytime/l2/unit1/w02/muse`. Class A and
      B specs have 2 to 6 references each. Class C specs have one reference each, and the `sun`,
      `ant`, and `alligator` rows use a Muse sheet. The week 1 lessons are in the prompts: thick,
      even, closed line art; no blush, eyelash ticks (Nan keeps her eyelash mark), hair strands,
      gray, or text; five-digit hands; smooth ears; even clothing color; the props of each sentence.
    - Character elements (reused by path, nothing copied): `out/storytime/l2/unit1/w01/muse/elements/`
      `cast-group-a-2.png` (Pat, May, Sam, Mia), `cast-group-b-2.png` (Ben, Nan, Teacher Kim, Pip),
      `nan-ref-clean-look-reference.png`, `nan-ref-clean-face-crop.png`, `ben-ref-clean-2.png`.
    - Forge 3D views used as elements (by path): `out/pond`, `out/beam`, `out/wicker-basket`,
      `out/storytime-low-branch`, `out/storytime-review/batch-19/storytime-school-bag.png`,
      `out/apple`, `out/dog`, `out/storytime-school-bus`, `out/fish`, `out/pig`, `out/bed`.
      No new 3D shot and no heavy-runner job in this round. No Forge asset exists for the park, the
      playground, the slide, the climbing frame, the kites, the ducks, the birds, the balls, the
      cupcakes, the picnic blanket, the sun, the ant, or the alligator.
    - Muse element sheets (11, in `out/storytime/l2/unit1/w02/muse/elements/`, named with no row id):
      `set-park-empty`, `set-playground-empty`, `prop-kites-sheet`, `prop-ducks-sheet`,
      `prop-birds-sheet`, `prop-balls-sheet`, `prop-cupcakes-sheet`, `prop-picnic-blanket-sheet`,
      `prop-sun-sheet`, `prop-ant-sheet`, `prop-alligator-sheet`. All are `-m1-color.png`. They are
      inputs, never page candidates. The first look by this Green found them usable. Known gaps: the
      ant shows 4 legs (6 asked), the park tree is small, the climbing frame looks like a low
      table-frame. The sheets need an independent look. Review folder:
      `out/storytime-review/w02-staging/` (`index.md`, `sheets-1.png` to `sheets-3.png`).
    - Muse element calls: 12 calls, 11 billed. The alligator call failed with
      `UND_ERR_CONNECT_TIMEOUT` (cost 0, logged) and its retry worked. Cost 0.11 USD (`usage.cost`
      0.01 per call) in `elements/costs.tsv`. Running total 3.36 USD before this run, 3.47 USD after
      it. Page calls: 0. Page candidates: 0.
    - Self-check (a short script in `/tmp/opencode/w02/selfcheck.mjs`, not in the repository; the
      stage-check script is not written yet):

      list sha256: 6d05dfc596c7f1891577a800a9375228136acc332c7c8b975c9df0bf6c062a58
      rows: 27
      specs found: 27
      text mismatches: 0
      goal mismatches: 0
      outDir mismatches: 0
      rows with no reference (class A and B): 0
      element paths checked: 82
      missing element paths: 0
      characters without a reference: 0
      page candidates: 0
      self-check: pass

      This proves that the inputs exist and match the list. It proves nothing about picture quality.
    - Open: no task is `[x]`. The stage-check script and its tests follow in a later round. No week
      2 page call before Daniel answers on week 1.
