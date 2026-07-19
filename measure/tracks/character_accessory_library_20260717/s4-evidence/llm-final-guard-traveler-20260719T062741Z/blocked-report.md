# Guard and Traveler source-free LLM acceptance: blocked startup report

## Outcome

The requested OpenCode 1.18.3 clients were configured for
`kimi-for-coding/k3`, `--pure`, built-in permission default `deny`, and the
single allowed tool pattern `forge_*`. Neither loadout reached session creation
or emitted a raw JSON event. No MCP tool call occurred.

- Guard attempt 1 ran from `2026-07-19T06:31:55.649Z` to
  `2026-07-19T06:38:13.581Z`. The OpenCode log recorded
  `background dependency install failed` with `ReleaseError: token mismatch`
  before session creation. It was terminated with `SIGTERM` after remaining at
  zero events.
- Guard attempt 2 used a distinct `guard-retry2` client/runtime from
  `2026-07-19T06:39:57.417Z` to `2026-07-19T06:48:36.416Z`. It remained at the
  OpenCode `init` boundary while another acceptance client was active and was
  terminated with `SIGTERM`, still with zero events.
- Guard final attempt used a third distinct `guard-final3` client/runtime from
  `2026-07-19T06:49:17.330Z` to `2026-07-19T07:01:42.666Z`. It remained at the
  `init` boundary through other client/session-export activity and still did
  not create a session or emit an event after an uncontended bounded window.
  It was terminated with `SIGTERM` and is the final blocked Guard result.
- Traveler used its own `traveler-only` client/runtime from
  `2026-07-19T07:02:56.153Z` to `2026-07-19T07:05:31.868Z`. With no other
  OpenCode run/export process active at launch, it still emitted zero events.
  It was terminated with `SIGTERM` after the explicit first-event observation
  bound was exhausted.

## Preserved evidence

Each attempt preserves its exact prompt and SHA-256, exact client/MCP
configuration, zero-byte raw `events.jsonl`, empty stderr, ordered zero-call
ledger, empty semantic comparison set, explicit visual-review Not Assessed
record, run metadata, and per-directory SHA-256 inventory. Session export is
Not Assessed because no session ID was created.

The valid Ranger and Caster source-free LLM runs are separate evidence produced
by another isolated client pair. They must not be presented as Guard or
Traveler acceptance, and the deterministic public Node harness must not be
presented as an LLM run.

## Verdict

- Guard fresh-LLM acceptance: **Blocked** at OpenCode client startup.
- Traveler fresh-LLM acceptance: **Blocked** at OpenCode client startup.
- Capability preflight, accessory discovery, mutation discipline, revision
  lineage, validation, render/export, artifact verification, and visual review:
  **Not Assessed** for these two source-free clients.
- Production implementation verdict: **Not implied by this report**. Existing
  deterministic public-tool and independent visual evidence remains separate.

No missing session, MCP call, revision, artifact path, or visual observation was
reconstructed from the prompts or from another run.
