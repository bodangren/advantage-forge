# Phase S4 Owner Acceptance Decision

## Decision

**Rejected.** Phase S4 remains in progress. Automated correctness is strong, but
the committed reference loadouts do not yet satisfy the track's Must-level
delivery-resolution readability criteria or the workflow skill's full-pass
visual evidence contract.

Owner review was performed at
`ffb2824184a714118db199b803c953a99734f55f` on 2026-07-19. This decision
supersedes the earlier request for a separate user approval; the orchestrator is
the project owner and owns acceptance.

## Evidence considered

- Deterministic public-MCP workflows pass for Guard, Traveler, Ranger, and
  Caster, including semantic validation, idle/action artifacts, GLB reload,
  eight-direction rendering, pixel metrics, and artifact hashes.
- The substantive local component gates pass: 222 tests, coverage above the
  required threshold, typecheck, lint, dependency checks, build, reference
  build, generators, doctor, and browser tests. Monolithic `pnpm check` did
  not complete because formatting encountered unrelated untracked inputs.
- K3 evidence is partial: Ranger action export timed out, while Guard and
  Traveler did not establish sessions or MCP calls after OpenCode startup
  failures. The isolated Luna attempt stopped at preflight.
- The earlier visual review already recorded partial fidelity and no
  exact-revision interactive 3D inspection.
- The owner directly inspected all eight committed idle/action contact sheets at
  their original bytes. The contact sheets are overview evidence; native-frame
  metrics and the prior native-frame review support, but do not override, the
  visible failures.

## Blocking findings

1. **Guard shield readability:** the kite shield is upright, but reads as an
   almost featureless near-black slab and loses useful identity edge-on. This
   does not meet the required materially distinguishable accessory criterion.
2. **Long-weapon side views:** spear and staff silhouettes become extremely thin
   in E/W views. Passing minimum pixel calculations is not sufficient when the
   equipment is visually lost at delivery scale.
3. **Traveler identity:** the backpack dominates the character as a bright,
   unarticulated cuboid without straps or a readable carried-object silhouette.
4. **Ranger identity:** armor, back equipment, quiver, and waist equipment
   collapse into several oversized rectangular volumes whose semantic roles are
   ambiguous.
5. **Caster identity:** the cape reads as a rigid rectangular board and the pouch
   reads as a pasted-on block. Rigid equipment is in scope, but this particular
   rigid design is not production-readable.
6. **Missing visual surface:** exact-revision interactive 3D inspection was not
   completed. The workflow skill requires interactive 3D, contact sheets, and
   every native frame for a pass.
7. **Incomplete LLM proof:** S4 requires a fresh MCP-capable LLM workflow for
   every reference loadout. Guard and Traveler produced no session or Forge
   calls, and the isolated Luna run did not execute.
8. **Owner sword-plus-shield regression gate:** although the explicit S4 Guard
   loadout uses spear plus kite shield, the product owner requires a direct
   regression for the user-reported sword and shield orientation problem. It
   must show the sword blade down and outside the torso and the shield face
   upright.

## Required remediation

- Refine only bounded accessory templates, materials, parameters, attachments,
  poses, and render profiles exposed by the public workflow.
- Produce new final revisions for affected loadouts and preserve dry-run/apply,
  comparison, validation, render, export, and hash evidence.
- Review exact-revision interactive 3D, all eight contact-sheet directions, and
  every 128x128 frame at native resolution.
- Re-run browser acceptance and the complete local gate suite against the final
  remediation head.
- Complete source-free, Forge-only sandboxed LLM workflows for all four
  loadouts, or record an infrastructure result as inconclusive rather than
  claiming the S4 LLM criterion passed.

## Re-acceptance rule

The owner gate may pass only when every blocking finding above is closed with
evidence targeting one final phase HEAD. Out-of-scope cloth physics, skeletal
deformation, temporal animation, inventory, and external engine import remain
non-blocking limitations.

MEASURE_AGENT_RESULT
role: phase-acceptance
status: blocked
track: character_accessory_library_20260717
phase: Phase S4: Verify Character Readability
baseline_sha: e4090eb084142aa4ddff1276e9debfa481905f25
audited_head_sha: ffb2824184a714118db199b803c953a99734f55f
commits: none
tests_run: existing S4 gate evidence reviewed; eight committed contact sheets inspected from original PNG bytes
files_changed: owner acceptance audit and Measure bookkeeping only
plan_updates: owner checkpoint rejected and bounded remediation reopened
known_failures: eight blocking findings listed above
handoff: remediate fidelity and missing visual and LLM evidence, then rerun phase acceptance against one final HEAD
END_MEASURE_AGENT_RESULT

The textual agent-result status is `blocked` per the Measure agent contract;
the audit JSON status is `fail` per the audit-result contract.
