# Clone-Replay Portability Verification

## Scope

The initial A/B replay was invalidated because its source copy included hidden
`.forge` runtime state. It is not acceptance evidence.

The corrected final proof used two new local no-hardlink clones:

- `/tmp/forge-clone-proof-e-20260722`
- `/tmp/forge-clone-proof-f-20260722`

The exact current uncommitted source snapshot was replayed into each clone while
excluding `.git`, `.forge`, current `artifacts`, `node_modules`, `dist`,
`coverage`, `.vite`, and `.opencode`. A local Git clone retains any artifact
files already tracked by the baseline, but neither proof copied current runtime
state and both real MCP runs wrote to separate new output roots.

Because the owner prohibits commits, this is source-overlay clone-replay
evidence. It is not a claim that the current implementation is Git-clean or
reachable from a commit.

## Dependency bootstrap

One earlier `pnpm fetch --frozen-lockfile` populated the local store with the
lockfile-pinned `esbuild@0.25.12` package. Both final clones then completed
`pnpm install --offline --frozen-lockfile` with 281 packages reused and zero
downloads. No replay or verification command used the network.

## Independent source verification

Each clone independently produced:

- canonical claim
  `ac456aa8827e3a8a6c0ebe84c19669b613997ab53d3906b3f0d0592400b9e89e`;
- 56 claim-bound producer source/config files;
- a passing claim-bound gate for 9 artifacts, 1 evidence record, 10 retrieved
  records, and 9 downstream members;
- 5 passing focused files with 24 tests; and
- a passing TypeScript build.

The second clone's first concurrent typecheck received an external SIGTERM; an
immediate isolated retry passed. No source change was made for that retry.

## Independent real MCP replay

Each clone ran `pnpm replay:public-mcp-interchange` into a separate empty
runtime/output root. Both runs passed with:

- 16 public tools in the same order;
- 17 successful public calls;
- immutable revision
  `revision.ee5d0a35c6d53befb6422c9df637b7a2679adf57cb8913aeec793afb0b01df67`;
- manifest digest
  `0d8c1380938e1bd5cbfb4c940b797727a01ba167884b222afcfe92485b49551d`;
- 10 retrieved records in 11 chunks; and
- byte-identical raw discovery, manifest, chunks, eight PNGs, GLB, and
  workflow-evidence records.

The browser executable is resolved by the pinned Playwright package rather than
a hard-coded host path.

## Remaining acceptance boundary

This proves the uncommitted source snapshot is portable across independent
clone roots and that its real stdio MCP/browser workflow is deterministic and
network-free. It cannot prove a clean Git checkout of the current
implementation until the owner authorizes commits. Explicit owner manual
approval, checkpoint commits/Git notes, and Measure archive closeout also
remain pending.
