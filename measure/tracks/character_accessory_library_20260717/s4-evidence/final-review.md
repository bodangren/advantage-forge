# Phase S4 Final Visual Review

Date: 2026-07-19

## Verdict

The four reference loadouts pass semantic validation, the frozen accessory
pixel contract, deterministic public-tool reconstruction, GLB reload, artifact
hash verification, and browser acceptance. The visual verdict is **partial**:
the corrected equipment is usable and attached, but several shapes remain too
crude to call polished at 128x128.

The final public evidence is
[`public-final-candidate-20260719T075230Z`](public-final-candidate-20260719T075230Z/summary.json).
It contains 166 public MCP calls across Guard, Traveler, Ranger, and Caster.
Every loadout reports `passes: true` with an empty issue list under the original
all-eight-direction thresholds: maximum occlusion 0.8 and minimum OKLab
distance 0.05.

## Orientation and attachment findings

- Guard: the kite shield is upright and vertical instead of tray-like. Its
  broad face is yawed 45 degrees and remains readable in cardinal and oblique
  views. The spear leans outward from the hand, stays in front of the body, and
  follows the action pose without visible detachment.
- Sword: S4's committed Guard loadout uses a spear, so S4 does not substitute a
  sword test. The prior S3 native-resolution sword-and-round-shield review still
  applies: the kit-owned sword points down from the hand, remains outside the
  leg silhouette, and the round shield is vertical. The workflow skill now
  requires these exact sword and shield checks in every native frame.
- Traveler: the staff clears the head and the backpack is unmistakably attached.
- Ranger: the spear and quiver remain attached in idle and action.
- Caster: staff, hood, cape, and pouch remain grounded and attached.
- Across all final sheets and native frames, no occupied pixels touch an image
  edge, feet remain grounded, and no clear floating accessory was found.

The eight final idle/action contact sheets are byte-identical to the renders
used by the independent visual audit. This proves the later evidence-engine
repairs did not silently change the reviewed pixels.

## Remaining visual debt

- **Medium:** the Caster cape reads as a rigid purple board, especially from
  S/SW/W. The pouch can look pasted onto it. There is no cloth drape or motion.
- **Medium:** Ranger leather armor develops an oversized rear/side volume that
  can resemble a backpack or shell. The pouch is disproportionately large.
- **Low:** spear and staff shafts become thin in E/W views and are easy to lose
  against the dark scene.
- **Low:** the Traveler backpack is an oversized plain cuboid without straps or
  shaping.
- **Low:** the Guard shield is nearly black against the dark contact-sheet
  background, so surface detail is weak even though its silhouette is correct.

## Product limits

Equipment remains rigid parametric geometry. The app does not provide cloth or
equipment physics, skeletal deformation, inverse kinematics, gameplay
inventory/combat state, arbitrary uploaded meshes, procedural garment fitting,
or pose-aware cape shaping. Exact persisted revisions also cannot yet be
reopened through a public long-lived interactive 3D inspector route. Unity,
Godot, and gameplay-runtime import remain Not Assessed.
