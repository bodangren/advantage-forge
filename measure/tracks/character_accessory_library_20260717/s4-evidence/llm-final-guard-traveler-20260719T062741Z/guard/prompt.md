# guard source-free authoring request

SHA-256 of the exact request: `37418d2f5e5c3c1534990eff5ae18bd039bf4a4d49b042dfb38e0062c9491f9d`

Use only the configured Fantasy Asset Forge MCP tools and the supplied workflow instructions. Do not read or search project files, run shell commands, construct canonical asset JSON, edit source, post-process images, or use network tools.

Build and audit the guard reference loadout on a newly created adventurer. The exact requested loadout is equipment.helmet.iron in head, equipment.spear in main-hand, equipment.shield.kite in off-hand, and equipment.armor.mail in body. Use archetypeId guard for every accessory discovery and mutation.

First inspect the exact runtime capabilities needed for the adventurer reference, accessory discovery and task-level operations, immutable revision comparison, static rigid poses, eight-direction transparent 128x128 sprites, a labeled contact sheet, and GLB. List the kit, create the adventurer reference, and record its baseline revision. Inspect its overview, parts, poses, and renderProfiles with bounded public calls. Render the untouched baseline.

Plan the whole loadout through search_accessories. For each requested slot, select the exact requested templateId from the public result and inspect that template. Treat the returned usage, placement, intended orientation, visual checks, required features, compatibility, and complete exampleOperation as authoritative. Never invent a part ID, port, transform, rotation, material, or operation. If a slot is occupied, use the returned replacement operation; do not work around it. Dry-run each complete exampleOperation against the current revision, verify its affected IDs, then replay it byte-for-byte with only dryRun changed from true to false. Record every returned part ID and revision.

With all requested accessories equipped in idle pose, inspect parts and renderProfiles, compare the baseline revision to the equipped-idle revision, validate, render, and export GLB. Assess the returned eight-frame metrics against each selected candidate's public requiredFeatures and visualChecks, but do not claim you visually opened an image.

Then dry-run the action pose and replay the identical request with only dryRun false. Record the action revision, compare idle to action, validate, render all eight directions, and export GLB. After that, unequip every accessory part added for this loadout, one at a time using revision-bound dry-run/apply pairs. Record the unequipped revision, compare action to unequipped, validate, render, and export GLB.

Report the chronological revision lineage; exact affected and preserved IDs; every dry-run/apply pair; accessory feature and directional metric findings; validation and returned artifact paths; retries or corrections; unsupported capabilities; and limitations. Explicitly label interactive 3D review, contact-sheet visual review, actual 128x128 visual review, independent artifact verification, representative importer testing, and external game-engine import Not Assessed because this source-free authoring client has no browser, image, shell, or file-reading tools. A successful render call is not visual inspection. Give an honest pass, partial, fail, or blocked client verdict.
