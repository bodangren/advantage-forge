# S14 Public-Path Authoring Evidence

Date: 2026-07-23

Current disposition: **mechanically complete; visual acceptance pending Kimi
WebBridge review**. Kimi was not run in this pass because the shared execution
quota was unavailable. S14 is not visually accepted, pack-admitted, or a basis
for temporal rendering.

## Public-path repair and reusable geometry gates

The public morphology handler previously persisted only the 15 morphology
transforms and the morphology profile. It did not apply the compiled reference
geometry patch used by the authoring comparison. S14 repairs that contract:
`morphology.reference-chibi-guard` now atomically applies 16 morphology
operations followed by 69 reference-geometry operations, for an exact 85/100
operations. Other morphology profile IDs retain the prior 16-operation
behavior and receive no guard-specific shape overrides. Public-handler coverage
proves its saved document equals the direct combined compiler result.

Reusable evaluated-world-geometry regressions now prove:

- head-plus-helmet/total-height ratio: `0.4386781166658611` (required `0.42-0.50`)
- side/front projected-width ratio: `0.7284958763185367` (required `>=0.60`)
- helmet emblem, ridge, and two studs contact the dome with maximum gap `0`
- exactly two helmet studs
- arm chain maximum gap `0`, positive 3D/front/side overlap, and arms beyond tunic
- boot chain maximum gap `0` and positive 3D/front/side overlap
- stable raw brim/head ratio `23/19` and transformed brim/helmet ratio
  `1.6362857142857143`

The neutral public recipe remains 46 composition operations, 47 parts, and 46
connections. The evaluated result is 2,192/2,500 triangles.

## Deterministic public-MCP replay

Primary command:

```text
node --import tsx scripts/replay-public-mcp-reference-comparison.ts /tmp/faf-reference-comparison-s14-public-20260723-0433 --s14
```

Two isolated runtime roots used only the 16-tool stdio MCP surface. Both roots
produced:

- asset: `guard.reference-ready.s14-public-path`
- revision: `revision.467805e417bf74faef9e57c1dd538783a58f88bc257f0f051f510b1b753b5a68`
- delivery and manifest SHA-256: `4bd4acef98fc4cddd5fa0f65798fc3c205e0ced7a5776c7a1e5b8ad0cb6b2bd1`
- front, 61,946 bytes: `6cd11180ae0dd2c0acbc1fc3b137c4ed3368bb14e2e05771ae5bbb2a9ead4f28`
- three-quarter, 62,881 bytes: `7a770c2856b5ef7b7c80a54392012222e8a5124e3dabb4e8bdb4eb8893413d7f`
- side, 48,061 bytes: `c93647b756837e13b09671b5199342b6d4266826a27f430dacda8fa4678d7b63`
- back, 50,388 bytes: `e4d84b62307fb23226479400991a88e1ac34fae167a1432d344a7cf0491d6fbe`
- contact sheet, 203,072 bytes: `bc577e0ab790aa73391360206802307c916ad3a3f34b798595b345c5f13a73f7`

The static manifest remained unchanged across authoring rendering at
`cd3a7886be7bdceac6fb914bad37927d20518c851af5fd4cbd1b76d20396135e`;
the normalized response remained
`c9e886eb74d5c283fb50e562d71cac53022bcfba87531ae431b0548ed16fde73`.

The emitted public-call ledger was replayed through two more fresh roots:

- `/tmp/faf-reference-comparison-s14-ledger-replay-20260723-0436/result.json`

It reproduced the exact revision, delivery, artifacts, tool surface, and static
non-mutation result. Claim freshness was rebound at
`8c7e6ddffc73155086464e187328db9dc207758bc97abbd4da677766269843e5`
across 77 implementation files.

## Pending browser-visible acceptance

The already-served native review page is:

- `http://127.0.0.1:8933/s14-authoring-v1/index.html`

Native files are staged under
`/tmp/faf-kimi-review-20260722/s14-authoring-v1/`: `reference.jpg`,
`front.png`, `three-quarter.png`, `side.png`, `back.png`, and
`contact-sheet.png`. The page returned HTTP 200. The required Kimi WebBridge
comparison must inspect the historical reference, four native 512x512 views,
and native 2048x530 sheet. Until that review explicitly accepts the base
character, S14 remains visually pending and no temporal or pack-admission work
may resume.

