# Two-Fresh-Runtime Determinism Comparison

Two isolated producer runtime roots and two isolated Pixel consumer roots ran
the same 17-call public MCP workflow. The labels below deliberately replace
ephemeral host paths.

| Portable record | Bytes | Run A SHA-256 | Run B SHA-256 | Result |
| --- | ---: | --- | --- | --- |
| `frame.n` | 3,716 | `415cacf519bd05effa5d00ce85188db866a02e9ed4e115532c7eff9ed83c973b` | same | Match |
| `frame.ne` | 3,725 | `2eb022062f1f79f32d9bf5495668eac81fa82baae1d6244e08a2abca2800dcab` | same | Match |
| `frame.e` | 2,511 | `fb21cd2e186db539747e8c47eeed35d32d0ed99ded67467bff95d65cdfcbde55` | same | Match |
| `frame.se` | 3,538 | `27c97fd26f140ad1fd88e417a92345a0d3048ef18f3d77b2201b5382c1061e86` | same | Match |
| `frame.s` | 3,488 | `7ef24e8965f864f4381e8d143360fd582ce8da50e639f831bd75477cf0ed8280` | same | Match |
| `frame.sw` | 3,132 | `74001caef0f3deea74f9bfc4b0fb894ca02fe43a15813227aad4b1ab530f67e9` | same | Match |
| `frame.w` | 2,242 | `17984b1c6f389f2ff699542720c2d18330b68255fde663932fd84c84bf0d1c30` | same | Match |
| `frame.nw` | 3,560 | `febcbfbd244c724693bbde08b5e940a3bee93735f50811afd71d8766dac2e62a` | same | Match |
| `model.glb` | 60,320 | `ef22ce2bad7e2c3051c4839a70a7cb568c75c4df99cf76c39a1d652e43d4099c` | same | Match |
| `workflow.public-mcp` | 316 | `c9a504ddd7b7cdda0a8e54121e2970bc7d42f271cd021e2256377c79fd207ef4` | same | Match |
| Persisted interchange JSON | 6,341 | `3a1bed1f07c9278c0c06cc49cea5d54f4ada5c9ad2a971acb9aee08c1cda9493` | same | Match |
| Persisted completeness-profile JSON | 8,757 | `b1cf92ed1210b6f0cab58a3c1c79b1e935aff97667745dc0b04b20a2c1ac886f` | same | Match |

Both runs produced revision
`revision.ee5d0a35c6d53befb6422c9df637b7a2679adf57cb8913aeec793afb0b01df67`,
canonical manifest digest
`0d8c1380938e1bd5cbfb4c940b797727a01ba167884b222afcfe92485b49551d`,
and completeness-profile digest
`e071abd2f121fd40c40f976b3ed09c232a1e6f132a9ef53cabe2e14328184011`.

This proves deterministic output across two fresh isolated runtimes. It does
not yet satisfy the stronger clean-clone criterion because neither run began
from a separately checked-out clean clone.
