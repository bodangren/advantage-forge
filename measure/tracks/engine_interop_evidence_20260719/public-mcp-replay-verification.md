# Fresh Public MCP Replay Verification

## Scope

On 2026-07-22 the repository command
`pnpm replay:public-mcp-interchange <new-output-directory>` ran twice against
separate empty runtime roots. Each run started the Forge inspector on loopback,
connected an SDK client to the real stdio MCP entrypoint, and used only public
tool calls for creation, validation, rendering, export, manifest retrieval, and
bounded artifact/evidence retrieval.

The runner stores the raw `tools/list`, manifest, chunks, a bounded call
ledger, reconstructed records, and diagnostics. Its implementation is bound by
the S3 delivery claim.

## Deterministic results

Both runs produced:

- the same 16-tool public catalog in canonical order;
- the same immutable revision
  `revision.ee5d0a35c6d53befb6422c9df637b7a2679adf57cb8913aeec793afb0b01df67`;
- the same manifest digest
  `0d8c1380938e1bd5cbfb4c940b797727a01ba167884b222afcfe92485b49551d`;
- 17 successful public calls;
- 9 artifact records plus 1 workflow-evidence record;
- 11 bounded chunks, including the two-chunk GLB;
- byte-identical manifest JSON, raw discovery JSON, chunk JSON, eight PNGs,
  GLB, and workflow-evidence bytes; and
- empty MCP stderr.

Pixel's package-owned validators consumed the raw discovery, normalized the two
interchange operations, validated the manifest and all 11 chunks, reconstructed
all 10 records totaling 86,548 bytes, and accepted completeness profile digest
`e071abd2f121fd40c40f976b3ed09c232a1e6f132a9ef53cabe2e14328184011`.

## Browser-visible review

Kimi WebBridge navigated the user's real browser to the generated contact
sheet and confirmed the image loaded completely at its natural 512 by 292
dimensions. The screenshot helper timed out twice, so the exact generated PNG
was also inspected directly. It is a valid transparent eight-direction
placeholder, but the E/W silhouettes are visibly thin and the asset is not
acceptable as final theme-pack art. This evidence accepts the interchange
workflow only; it does not accept final artifact quality.

## Post-S2 replay refresh

After atomic initialization, bounded public grammar composition, archetype
discovery, and style-originality evidence were integrated, the replay ran again
against two new empty roots:
`/tmp/faf-s12-public-replay-final-a-20260722-1755` and
`/tmp/faf-s12-public-replay-final-b-20260722-1755`.

The runs again completed successfully and were byte-identical for raw tool
discovery, manifest, chunks, public call ledger, and every reconstructed record.
The stable file digests were:

- tool discovery:
  `7421e545c321b99dc472f36c4c53488a5d49ba943fa900bab46603704c5b0f8f`;
- manifest file:
  `030412b9fd5165b78e885ac8579b360f8e811efd3e41c3f650451e462c572d12`;
- chunks:
  `e56d3affa47ed638c201ec77f43f03bae004e7c7bc728e0da0459420a3327e72`;
  and
- public call ledger:
  `199522ec97aa985c50e303a98908ecb0d2764343d2985541cc7c4d14013c54f3`.

The rebound claim is
`073e3aa8236a9b3896b40526a9e561f44fe56eff424c3e1770c4cbe69810dab8`
over 60 producer files.

## Remaining boundary

The two real runs used separate empty runtime roots but the same dirty source
checkout. Final clone replay, owner/manual acceptance, higher-quality novel
identities, animation/atlas production, and the two downstream theme packs
remain incomplete.

## Post-novel-revision replay refresh

After the revision-safety slice and normalized replay-ledger repair, two new
empty runtime roots reproduced the same 16-tool catalog, immutable adventurer
revision, manifest digest, 17 public calls, 11 chunks, and 10 reconstructed
records:

- `/tmp/faf-s3-public-replay-ledger-normalized-20260722-1941`
- `/tmp/faf-s3-public-replay-ledger-normalized-b-20260722-1943`

The portable outputs and complete record trees were byte-identical. The
normalized ledger now comes directly from the replay runner and passes the
real evidence gate without a manual shape conversion. Its digest is
`e56dd337d52aaa5dbecfac65312e1a01ed8d7d7de3d0bafbbf1de6b3b8a8feb9`.
The delivery claim at that point was
`7550675d3c7f4e0ff7d1879a7bb77ef1d7c807a15d29e1cb86c409a01bcb3bbe`
over 62 producer files.

Kimi WebBridge session `forge-s3-kimi-20260722` opened the freshly generated
`contact-sheet.png` in the user's real browser. The document and image were
complete; natural and displayed dimensions were both 512 by 292, with no
horizontal overflow in a 1920 by 871 viewport. The screenshot helper returned
no file, so this evidence makes no screenshot-file claim. The underlying frame
digests are unchanged, so the earlier thin/dark E/W placeholder-quality debt
remains in force.

## Post-novel-workflow static rebind

After the public novel-workflow replay runner and the registered guard/container
composition grammar changed the producer inventory, the stale gate failed on
the exact changed `package.json` and
`src/fantasy-kit/novel-composition.ts` bytes. Two new real public-stdio MCP
replays then ran from empty roots:

- `/tmp/faf-static-rebind-20260722-a`
- `/tmp/faf-static-rebind-20260722-b`

The two runs again produced byte-identical portable discovery, manifest, chunk,
ledger, and reconstructed-record outputs. Stable portable file hashes are:

- discovery: `7351a54b5cbdf63edcc06f08a0650680dd950c70260c7b5c615fe7e22f833644`;
- manifest: `030412b9fd5165b78e885ac8579b360f8e811efd3e41c3f650451e462c572d12`;
- chunks: `e56d3affa47ed638c201ec77f43f03bae004e7c7bc728e0da0459420a3327e72`;
  and
- normalized ledger:
  `e56dd337d52aaa5dbecfac65312e1a01ed8d7d7de3d0bafbbf1de6b3b8a8feb9`.

Both runs retained the same `adventurer.rustic` immutable revision, manifest
identity, 16-tool catalog, 17 calls, 10 records, and 11 chunks, with empty MCP
stderr. The rebound delivery claim at that point was
`17c8ded00b73a8cd65c2b769fedb7d199e28c294e4ed12194eb8faef389ea3ef`
over 62 producer files, and its claim-bound gate passes.

The separate chibi-guard workflow iteration is mechanically reproducible but
was rejected by the product owner as a visual target. It does not extend this
static transport acceptance to novel-character visual quality, animation,
atlases, or theme-pack acceptance.

## Post-reference-contract static rebind

The stabilized reference-character and humanoid-morphology contract/compiler
slice then extended the static producer inventory. The freshness gate correctly
failed on the first changed producer export, so the preceding `17c8ded0...a3ef`
claim was not reused.

Two final real public-stdio MCP replays ran from empty roots:

- `/tmp/faf-static-final-rebind-20260722-a`
- `/tmp/faf-static-final-rebind-20260722-b`

Discovery, manifest, chunks, the normalized ledger, and the full reconstructed
record trees were byte-identical. Their stable portable hashes remained:

- discovery: `7351a54b5cbdf63edcc06f08a0650680dd950c70260c7b5c615fe7e22f833644`;
- manifest: `030412b9fd5165b78e885ac8579b360f8e811efd3e41c3f650451e462c572d12`;
- chunks: `e56d3affa47ed638c201ec77f43f03bae004e7c7bc728e0da0459420a3327e72`;
  and
- normalized ledger:
  `e56dd337d52aaa5dbecfac65312e1a01ed8d7d7de3d0bafbbf1de6b3b8a8feb9`.

The stabilized overlay claim at that point was
`837ef81c0eab7fdff79fcb2b64bf91fbd4b61b9971c49c5f6cff0490068557e4`
over 65 producer files. The accepted-digest gate passes with 4 evidence files,
9 artifacts, 1 evidence record, 10 records, and 9 downstream members. This is
still static interchange evidence only; it does not accept the new reference
target, character convergence, animation, atlases, or a downstream theme pack.

## Post-rigid-contract definitive static rebind

The next producer slice added the bounded rigid-animation contract to the
contracts barrel. The first attempted replay at
`/tmp/faf-static-definitive-rebind-20260722-a` failed closed during browser
rendering because the morphology compiler's architecture repair imported the
Node-backed document barrel and pulled `node:crypto` into Vite. That root is a
rejected diagnostic only; it did not produce a delivery claim.

After the morphology compiler switched to the repository's browser-safe
document boundary and both `pnpm doctor` and the browser build passed, two new
real public-stdio MCP replays completed from fresh roots:

- `/tmp/faf-static-definitive2-rebind-20260722-a`
- `/tmp/faf-static-definitive2-rebind-20260722-b`

Discovery, manifest, chunks, normalized ledger, and the complete reconstructed
record trees were byte-identical. Their portable hashes remained:

- discovery: `7351a54b5cbdf63edcc06f08a0650680dd950c70260c7b5c615fe7e22f833644`;
- manifest: `030412b9fd5165b78e885ac8579b360f8e811efd3e41c3f650451e462c572d12`;
- chunks: `e56d3affa47ed638c201ec77f43f03bae004e7c7bc728e0da0459420a3327e72`;
  and
- normalized ledger:
  `e56dd337d52aaa5dbecfac65312e1a01ed8d7d7de3d0bafbbf1de6b3b8a8feb9`.

The static overlay candidate at that point was
`39be2bd8098aa17abde17e1a618c14eaf0d55f9895644f64b2f8acad37fe2071`
over 66 producer files. Its accepted-digest gate passes with 4 evidence files,
9 artifacts, 1 evidence record, 10 records, and 9 downstream members.

That candidate was later revoked. A concurrent `src/animation/` implementation
landed during claim generation, after the recursive producer inventory had been
captured. The old gate verified every listed file but did not compare the list
to the current recursive inventory, so it initially missed the newly added
producer files. The generator and gate now share one recursive inventory helper,
and a regression proves that a new unclaimed `src/**` path fails on
`delivery-claim.implementation-inventory`.

Including the rigid-animation contract in producer freshness does not claim
temporal runtime implementation or acceptance. Clip execution, frame
interpolation, animation rendering/export, atlas generation, browser playback,
and downstream animated theme-pack delivery remain outside this static result.

## Post-alias inventory-complete final static rebind

The completed animation module, morphology lineage/public operations, and
registered `torso` / `body.root` morphology alias then stabilized. One replay at
`/tmp/faf-static-final3-rebind-20260722-a` completed just before the alias defect
was identified; it is diagnostic only and was never paired or claimed.

After the alias repair and a new explicit producer freeze, two entirely new
real public-stdio MCP replays completed from:

- `/tmp/faf-static-final4-rebind-20260722-a`
- `/tmp/faf-static-final4-rebind-20260722-b`

Both exited successfully and were byte-identical for discovery, manifest,
chunks, normalized ledger, and the complete reconstructed-record trees. The
final portable hashes are:

- discovery: `881f8154c8316a8a749d182265fd5667fcbb9d0ce7b9f783d7fc5d764e6c434c`;
- manifest: `030412b9fd5165b78e885ac8579b360f8e811efd3e41c3f650451e462c572d12`;
- chunks: `e56d3affa47ed638c201ec77f43f03bae004e7c7bc728e0da0459420a3327e72`;
  and
- normalized ledger:
  `ef7c1758578c308297f17cdc3e83b0a16fc3169e31696ec73e5a8e56cb945852`.

Each replay exposed 16 public tools, made 17 public calls, retained the same
immutable adventurer revision and manifest identity, and reconstructed 10
records from 11 chunks. The inventory-complete static claim is
`dacab165e0ad370136a3ac67abca4f086c21dabb8b45dcd225372b615b416ab4`
over 68 producer files. Before acceptance, the hardened gate failed only on the
expected accepted-digest clause; after rebinding, it passes with exact recursive
inventory equality, 4 evidence files, 9 artifacts, 1 evidence record, 10
records, and 9 downstream members.

This is the current static claim. It proves freshness and deterministic static
public-MCP delivery across the expanded producer inventory. It does not accept
the rejected novel guard, the new reference target, temporal runtime behavior,
animation output, atlases, browser playback, or a downstream theme pack.
