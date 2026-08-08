# S3 Delivery-Claim Gate Verification

## Implemented slice

The automated gate reads the exact S2 live dossier and its immutable delivery
claim, then fails closed with a stable contract clause, evidence path, and
record ID where applicable. It checks:

- canonical manifest and Pixel profile digests;
- public-MCP-only operation and argument boundaries;
- pinned asset, revision, manifest, artifact, and evidence identities;
- contiguous bounded chunk coverage and per-chunk/full-record digests;
- exact workflow bytes, provenance reference, and raw evidence boundaries;
- every Forge source artifact's Pixel completeness-profile binding; and
- SHA-256/byte-length freshness for four evidence files and the complete
  current 62-file producer inventory.

Gate implementation files are excluded from the inventory to avoid a circular
accepted-digest dependency. The inventory includes the Vite entrypoint,
renderer/compiler inputs, and the real stdio replay runner.

## Verification on 2026-07-22

| Command                                 | Result                                                                                                         |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| combined S1/S2/interchange suite        | Pass: 11 files, 66 tests                                                                                       |
| `pnpm typecheck`                        | Pass                                                                                                           |
| scoped ESLint                           | Pass                                                                                                           |
| scoped Prettier check                   | Pass                                                                                                           |
| `pnpm check:interchange-evidence`       | Pass: claim `7550675d...bcb3bbe`, 62 producer files, 9 artifacts, 1 evidence, 10 records, 9 downstream members |
| two independent source-overlay clones   | Initial S3 pass: claim `ac456aa8...0b9e89e`, tests, typecheck, and gate                                        |
| two independent clone stdio MCP replays | Initial S3 pass: byte-identical discovery, manifest, chunks, and reconstructed records                         |

The 24 focused tests cover canonical-manifest drift, stale ledger identity,
non-public calls/arguments, incomplete or misattributed chunk coverage,
workflow byte drift, downstream binding drift, profile digest drift, raw
boundary leakage, arbitrary/missing chunk digests, stale producer bytes,
provenance-reference drift, archive fallback, deterministic claim generation,
and public replay reconstruction failures.

Independent correctness review accepted the automated S3 implementation after
`index.html` coverage and executable double-generation regression were added.
The later public runner/helper and Playwright-resolved browser path are now
included in the rebound claim and reverified in both final clones.

## First successor-source rebind on 2026-07-22

Delegated successor sequencing first changed the novel-identity producer
surface. The gate failed Red on the exact changed producer files before any new
claim was accepted. A real public stdio MCP replay then exposed 23 capability
facts, created and validated the fixed adventurer reference, rendered eight
directional PNGs plus a contact sheet, exported GLB, retrieved the pinned
manifest, and reconstructed all 10 allowlisted records from 11 digest-bound
chunks.

The first replay exposed a missing Playwright-bundled Chromium path. Kimi
WebBridge independently confirmed that the real inspector loaded and its
`renderArtifacts()` browser API returned all eight directions, isolating the
failure to the service launch path. The service now resolves an installed
system browser only from a bounded candidate list and rejects an explicit
missing executable before rendering. After that repair, independent temporary
runtime roots produced byte-identical `tools-list.json`, manifest, chunks,
public call ledger, and reconstructed record trees.

After atomic create-only handling, directly executable bounded public grammar
plans, concrete archetype defaults/ports, and style-originality evidence were
integrated, two more empty runtime roots reproduced the same 16-tool catalog,
revision, manifest, 17-call ledger, 11 chunks, and 10-record tree byte-for-byte.
The final post-S2 claim is
`073e3aa8236a9b3896b40526a9e561f44fe56eff424c3e1770c4cbe69810dab8`.
The gate is bound to that exact digest and passes with 60 producer files.
Pixel's nine-file admission suite passes 126 tests with 9 live-environment
tests correctly skipped until explicitly enabled. This successor rebind does
not replace the initial source-overlay clone proof and does not claim a new
clean-commit checkout.

## Novel-revision successor rebind on 2026-07-22

After deterministic revision planning, immutable restore, file-backed
compare-and-swap locking, convergent lineage, bounded semantic pagination, and
pre-mutation response-size checks were integrated, the stale-claim gate failed
on the changed producer files as required. The focused S3 matrix passed 36
tests; an independent temporary-directory audit passed the concurrency,
lineage, canonical-reload, maximum-response, stale/live-lock, and external
sentinel probes with no remaining High or Medium blocker.

Two final real public-MCP replays ran from empty roots:
`/tmp/faf-s3-public-replay-ledger-normalized-20260722-1941` and
`/tmp/faf-s3-public-replay-ledger-normalized-b-20260722-1943`. They were
byte-identical for discovery, manifest, chunks, the normalized evidence-gate
ledger, and every reconstructed record. The runner now emits the exact
gate-compatible eight-field ledger directly, with 17 contiguous public calls,
10 records totaling 86,548 bytes, response digests, retrieval coverage, no
base64 payloads, and no host paths. Stable replay hashes are:

- discovery: `7351a54b5cbdf63edcc06f08a0650680dd950c70260c7b5c615fe7e22f833644`;
- manifest: `030412b9fd5165b78e885ac8579b360f8e811efd3e41c3f650451e462c572d12`;
- chunks: `e56d3affa47ed638c201ec77f43f03bae004e7c7bc728e0da0459420a3327e72`;
  and
- normalized ledger:
  `e56dd337d52aaa5dbecfac65312e1a01ed8d7d7de3d0bafbbf1de6b3b8a8feb9`.

The rebound claim is
`7550675d3c7f4e0ff7d1879a7bb77ef1d7c807a15d29e1cb86c409a01bcb3bbe`
over 62 producer files. The claim-bound gate and 22 focused
claim/replay/evidence tests pass.

## Novel-workflow successor rebind on 2026-07-22

The next producer change added the public novel-workflow replay runner and
extended the registered guard/container composition grammar. Before rebinding,
`pnpm check:interchange-evidence` failed Red on the exact stale `package.json`
and `src/fantasy-kit/novel-composition.ts` bytes.

Two real public-stdio MCP replays from empty roots,
`/tmp/faf-static-rebind-20260722-a` and
`/tmp/faf-static-rebind-20260722-b`, were byte-identical for discovery,
manifest, chunks, the normalized public-call ledger, and every reconstructed
record. Their stable portable hashes were:

- discovery: `7351a54b5cbdf63edcc06f08a0650680dd950c70260c7b5c615fe7e22f833644`;
- manifest: `030412b9fd5165b78e885ac8579b360f8e811efd3e41c3f650451e462c572d12`;
- chunks: `e56d3affa47ed638c201ec77f43f03bae004e7c7bc728e0da0459420a3327e72`;
  and
- normalized ledger:
  `e56dd337d52aaa5dbecfac65312e1a01ed8d7d7de3d0bafbbf1de6b3b8a8feb9`.

Regenerating the claim produced
`17c8ded00b73a8cd65c2b769fedb7d199e28c294e4ed12194eb8faef389ea3ef`
over the current 62 producer files. The first gate run after generation failed
only because the gate still accepted the preceding claim digest; rebinding that
explicit constant to the new digest restored Green. The claim-bound gate then
passed with 4 evidence files, 9 artifacts, 1 evidence record, 10 total records,
and 9 downstream members. The focused claim/generator/replay suite passed 3
files and 14 tests.

This rebind preserves only the static interchange boundary. The mechanically
valid chibi-guard iteration was subsequently rejected on visual quality and is
not evidence of novel-character, animation, atlas, or theme-pack acceptance.

## Reference-contract static rebind on 2026-07-22

The stabilized reference-character and humanoid-morphology contracts, compiler,
and public exports extended the producer inventory after the `17c8ded0...a3ef`
rebind. The claim gate correctly failed on the first changed producer export.

Two final real public-stdio MCP replays from empty roots,
`/tmp/faf-static-final-rebind-20260722-a` and
`/tmp/faf-static-final-rebind-20260722-b`, were byte-identical for discovery,
manifest, chunks, normalized ledger, and the complete reconstructed-record
trees. The portable hashes remained discovery `7351a54b...f833644`, manifest
`030412b9...72d12`, chunks `e56d3aff...27e72`, and ledger
`e56dd337...feb9`.

The regenerated overlay claim at that point was
`837ef81c0eab7fdff79fcb2b64bf91fbd4b61b9971c49c5f6cff0490068557e4`
over 65 producer files. Before acceptance the gate failed only on
`delivery-claim.accepted-digest`; after rebinding the excluded accepted-digest
constant, the gate passed with 4 evidence files, 9 artifacts, 1 evidence
record, 10 records, and 9 downstream members. The focused claim,
double-generation, and replay suite passed 3 files and 14 tests.

This final rebind records static source-delivery freshness. It does not accept
the reference design itself, visual convergence, animation, atlases, or a
theme-pack artifact.

## Rigid-contract definitive rebind on 2026-07-22

After the bounded rigid-animation contract joined the producer inventory, the
first real replay exposed a browser-boundary defect: the morphology compiler's
doctor-compliant Node document-barrel import pulled `node:crypto` into the Vite
renderer. Public MCP failed closed with no artifact response. The incomplete
`/tmp/faf-static-definitive-rebind-20260722-a` root is diagnostic only and no
claim was accepted from it.

The compiler was rerouted through the repository's browser-safe document
boundary. `pnpm doctor`, the browser production build, and the focused
reference/morphology/rigid contract suite then passed before replay restarted.
Two new real public-stdio MCP runs from
`/tmp/faf-static-definitive2-rebind-20260722-a` and
`/tmp/faf-static-definitive2-rebind-20260722-b` completed successfully and were
byte-identical for discovery, manifest, chunks, normalized ledger, and the full
reconstructed-record trees. Portable hashes remained discovery
`7351a54b...f833644`, manifest `030412b9...72d12`, chunks
`e56d3aff...27e72`, and ledger `e56dd337...feb9`.

The static overlay candidate at that point was
`39be2bd8098aa17abde17e1a618c14eaf0d55f9895644f64b2f8acad37fe2071`
over 66 producer files. The pre-acceptance gate failed only on
`delivery-claim.accepted-digest`; after rebinding the excluded accepted-digest
constant, the gate passed with 4 evidence files, 9 artifacts, 1 evidence
record, 10 records, and 9 downstream members. The focused claim/generator/replay
suite passed 3 files and 14 tests.

The rigid contract is freshness-bound here only because it is public producer
source. This result does not accept temporal execution, animation output,
atlases, playback, or downstream animated theme-pack delivery.

## Inventory-complete post-alias final rebind on 2026-07-22

The `39be2bd8...2071` candidate was revoked after a concurrent
`src/animation/` implementation landed during claim generation. The previous
gate checked all listed bytes but did not prove that the list still equaled the
current recursive producer inventory. The generator and gate now use one shared
recursive inventory helper, and a new regression proves that any unclaimed
`src/**` path fails with `delivery-claim.implementation-inventory`.

A later single replay under `/tmp/faf-static-final3-rebind-20260722-a` was also
rejected before pairing when integration inspection found that committed
references use anatomy ID `torso` while the novel public workflow uses
`body.root`. The bounded morphology part map now accepts both registered IDs,
with focused reference and novel-path tests.

After the alias repair and final producer freeze, two new public-stdio MCP
replays at `/tmp/faf-static-final4-rebind-20260722-a` and
`/tmp/faf-static-final4-rebind-20260722-b` both exited successfully. Discovery,
manifest, chunks, normalized ledger, and the complete reconstructed-record
trees were byte-identical. Final portable hashes are discovery
`881f8154...6c434c`, manifest `030412b9...72d12`, chunks
`e56d3aff...27e72`, and ledger `ef7c1758...945852`.

The final inventory-complete static claim is
`dacab165e0ad370136a3ac67abca4f086c21dabb8b45dcd225372b615b416ab4`
over 68 producer files. Its pre-acceptance gate failed only on the expected
accepted-digest clause. After rebinding, the hardened gate passes with exact
recursive producer-inventory equality, 4 evidence files, 9 artifacts, 1
evidence record, 10 records, and 9 downstream members. The focused
claim/generator/replay suite passes 3 files and 15 tests, including the new-file
inventory regression.

Post-freeze repository verification also passes:

- full Vitest: 129 files and 390 tests;
- official V8 coverage: 91.63% statements, 81.17% branches, 97.78%
  functions, and 92.16% lines;
- full ESLint plus dependency-cruiser: 76 modules, 174 dependencies, and no
  violations;
- TypeScript project build and Vite browser production build, with only the
  existing non-blocking large-chunk warning;
- generated-fact refresh and architecture doctor;
- targeted formatting for the active closeout files; and
- `git diff --check`.

The repository-wide Prettier baseline still reports historical benchmark and
archived-evidence files outside this closeout scope, and the required clean
checkpoint remains unauthorized. Therefore `pnpm check`, clean-clone proof for
the final overlay, the checkpoint Git note, and Measure archive closeout remain
open even though the current implementation gates above are Green.

This is static delivery evidence only. It does not promote the animation
contract/module to accepted temporal output, and it does not accept novel visual
quality, atlases, playback, or downstream theme-pack delivery.

## Acceptance boundary

Technical S3 evidence is green, including real browser-backed stdio MCP replay
and Pixel consumption. The current implementation remains uncommitted by owner
direction, so a genuinely clean Git checkout, explicit owner manual approval,
checkpoint commit/Git note, and Measure archive closeout cannot yet be
completed. This file does not claim the phase or track is closed.
