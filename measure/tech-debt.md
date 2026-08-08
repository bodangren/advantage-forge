# Tech Debt Registry

> Curated working memory. Keep this file at or below 50 lines.
>
> **Severity:** `Critical` | `High` | `Medium` | `Low`
> **Status:** `Open` | `Resolved`

| Date       | Track                                     | Item                                                  | Severity | Status   | Notes                                                                                                                          |
| ---------- | ----------------------------------------- | ----------------------------------------------------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 2026-07-18 | llm_authoring_workflow_hardening_20260717 | Accessory library stops at sword and shield           | Medium   | Resolved | Seventeen static templates are registered; public workflows and four readability loadouts plus a sword-and-shield regression are committed. |
| 2026-07-18 | llm_authoring_workflow_hardening_20260717 | Novel identity support remains bounded                 | High     | Open     | Registered rustic-humanoid and banded-container identities are implemented; arbitrary creature anatomy and culture families remain unsupported. |
| 2026-07-18 | llm_authoring_workflow_hardening_20260717 | Temporal pipeline is mechanical, not product-complete | High     | Open     | Single-clip rigid sampling, atlas/source-GLB delivery, and public retrieval are implemented; batch five-clip authoring, accepted motion, Pixel playback, deforming animation, and animated GLB remain incomplete or unsupported. |
| 2026-07-18 | llm_authoring_workflow_hardening_20260717 | Equipped sword is weak at native sprite resolution    | Medium   | Open     | The current torso metric does not detect thin edge-on equipment; the unequipped S4 run did not close this limitation.          |
| 2026-07-18 | llm_authoring_workflow_hardening_20260717 | External game-engine compatibility remains unassessed | Medium   | Open     | Three.js GLTFLoader passes; Unity, Godot, and gameplay-runtime scale/material behavior still need direct evidence.             |
| 2026-07-18 | llm_authoring_workflow_hardening_20260717 | Preferred browser harness entrypoint is broken        | Low      | Open     | The installed harness raises `ModuleNotFoundError: No module named 'run'`; pinned Playwright is the verified fallback.         |
| 2026-07-19 | character_accessory_library_20260717      | Omitted compatible slots allow an instance override   | Medium   | Open     | Current templates declare slots; default to the template slot in assembly validation before exposing S3 equipment operations.  |
| 2026-07-19 | character_accessory_library_20260717      | Omitted handedness conflicts with two-handed metadata | Low      | Open     | No two-handed template exists; normalize omitted instance handedness before adding one.                                        |
