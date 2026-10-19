# Monorepo sync workflow: handoff, delivery, and record of Forge changes

Status: new. The plan records execution state. The [specification](./spec.md) records the gaps, the
scope, and the open decisions. `docs/apk-port.md` ("Release flow") will retain the workflow.

## Phase 1: Design and agreement

- [ ] Task: Write the workflow in `docs/apk-port.md` ("Release flow"): the steps, who runs each
  step, the handoff format, the ledger, the freeze rule, and the heavy lock.
- [ ] Task: Agree the handoff format and the receiving steps with the monorepo session. Record its
  answer and the open decisions of the specification here.

## Phase 2: Tests

- [ ] Task: Test the handoff generator with git fixtures: the last synced Forge commit from a
  monorepo log, the commit range in the synced paths, the commit classes, the affected games from
  changed game folders, models (`GAME_LOADS`), and kit files, and the byte-identical model list.
- [ ] Task: Test that a release with byte-identical outputs changes no pack version and no pack
  file, and that the model is not stale at the next `apk-release.ts --check`.

## Phase 3: Implementation

- [ ] Task: Write `scripts/monorepo-handoff.ts` (read-only): the handoff text and
  `out/monorepo-sync/handoff-<forge-sha>.md`.
- [ ] Task: Add `--status` (the Forge commits that the monorepo has not received) and
  `--record <monorepo-sha>` (check the subject, add a row to `measure/monorepo-syncs.md`).
- [ ] Task: Change `apk-release.ts`: take the heavy lock itself, keep the pack files of a
  byte-identical rebuild, and remember the checked source revision.
- [ ] Task: Add `monorepo-sync.ts --forge-commit <sha>` (copy from a clean worktree at that commit).
- [ ] Task: Write the Forge skill `.claude/skills/monorepo-sync/SKILL.md`: commit, release, handoff,
  `SendMessage` to the monorepo session, wait, record.

## Phase 4: Monorepo side (monorepo session)

- [ ] Task: The monorepo session writes its receiving steps (sync, checks, commit, merge into
  integration, answer with the monorepo commit). Record its commit or document path here.

## Phase 5: Verification

- [ ] Task: Use the workflow for the first sync after the Primary cutover (it carries the XP guard
  `a70e1ebf`). Record the handoff, the monorepo commit, and the ledger row here.
- [ ] Task: Run `./measure/doctor.sh` and close the track.
