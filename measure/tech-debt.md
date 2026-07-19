# Tech Debt Registry

> Curated working memory. Keep this file at or below 50 lines.
>
> **Severity:** `Critical` | `High` | `Medium` | `Low`
> **Status:** `Open` | `Resolved`

| Date       | Track                                     | Item                                                  | Severity | Status   | Notes                                                                                                                          |
| ---------- | ----------------------------------------- | ----------------------------------------------------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 2026-07-18 | llm_authoring_workflow_hardening_20260717 | Accessory library stops at sword and shield           | Medium   | Resolved | Seventeen static templates are registered; public workflows and readability evidence remain active S3/S4 work.                 |
| 2026-07-18 | llm_authoring_workflow_hardening_20260717 | No novel character identity or anatomy authoring      | High     | Open     | Public creation remains limited to four committed references; unsupported identities must be blocked rather than approximated. |
| 2026-07-18 | llm_authoring_workflow_hardening_20260717 | No temporal animation or runtime sprite pipeline      | High     | Open     | Poses are static; clips, interpolation, atlases, skeletal deformation, and animated GLB are unsupported.                       |
| 2026-07-18 | llm_authoring_workflow_hardening_20260717 | Equipped sword is weak at native sprite resolution    | Medium   | Open     | The current torso metric does not detect thin edge-on equipment; the unequipped S4 run did not close this limitation.          |
| 2026-07-18 | llm_authoring_workflow_hardening_20260717 | External game-engine compatibility remains unassessed | Medium   | Open     | Three.js GLTFLoader passes; Unity, Godot, and gameplay-runtime scale/material behavior still need direct evidence.             |
| 2026-07-18 | llm_authoring_workflow_hardening_20260717 | Preferred browser harness entrypoint is broken        | Low      | Open     | The installed harness raises `ModuleNotFoundError: No module named 'run'`; pinned Playwright is the verified fallback.         |
| 2026-07-19 | character_accessory_library_20260717      | Omitted compatible slots allow an instance override   | Medium   | Open     | Current templates declare slots; default to the template slot in assembly validation before exposing S3 equipment operations.  |
| 2026-07-19 | character_accessory_library_20260717      | Omitted handedness conflicts with two-handed metadata | Low      | Open     | No two-handed template exists; normalize omitted instance handedness before adding one.                                        |
