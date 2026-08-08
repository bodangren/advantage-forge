# Kimi WebBridge visual review — 2026-07-22

Kimi WebBridge session `faf-asset-qa-20260722` loaded the browser gallery at a
loopback URL. The gallery showed the selected generated structural reference,
the current Forge candidate's eight spatial views, native 128x128 temporal
frames, 4x nearest-neighbor playback at 125 ms, manual pause/step controls, and
the derived atlas. Manual stepping verified the paused 250 ms source frame.

## Guard candidate: rejected

The candidate is mechanically valid but not close enough to the selected
reference. The helmet dominates as a broad dark cap, the face reads as a narrow
dark band rather than eyes/nose/cheeks, the body and limbs remain thin and
rectilinear, and the clothing/equipment silhouette lacks the reference's soft,
round, cohesive chibi mass. The new feature geometry is useful direction, but
this candidate is diagnostic and must not enter either theme pack.

## Temporal proof: rejected as production motion

All four source frames are distinct, camera scale is stable, and the ground
anchor remains fixed. However, the sequence is an arm-lowering interpolation,
not locomotion: there is no alternating leg step, weight transfer, contact,
passing pose, or clean walk-loop read. The character is also too small and too
dark at native size. This proves timed capture and atlas assembly only.

No sprite, clip, character, or pack artifact was visually accepted by this
review.

## S4 novel candidate: rejected

Kimi WebBridge then loaded the first-class novel candidate
`guard.reference-ready.s4` at
`revision.a966deffd62d618b277ac7eb1bd199b9836984e252bc67e6fa07e6ad72eda9eb`
beside the selected structural target. The browser evidence is
`/tmp/kimi-webbridge-screenshots/screenshot_20260722_235343.334.png`.

The added hair, tunic, eyes, and nose make the grammar more complete, but the
render still fails convergence. The helmet reads as a flattened mushroom cap
rather than the target's fitted decorated helmet; the face remains a dark
horizontal band with no readable eyes, cheeks, nose, or mouth at review size;
the head is an oblate oval instead of the target's round chibi cranium and
cheeks; and the torso, limbs, hands, and feet remain narrow and rectilinear.
The shield/spear silhouette also dominates the small body rather than reading
as coherent fitted equipment. Multi-view attachment and mechanical validity
pass, but visual identity, proportion, palette readability, and target
similarity fail. This revision is diagnostic and is not admissible pack art.

## S5 convergence candidate: rejected

Kimi WebBridge compared `guard.reference-ready.s5` at
`revision.53b6f89a8eababb646a8751a5007b8a64112e60850ef2bc7f61ce53717f9467c`
with the same structural target. Browser evidence is
`/tmp/kimi-webbridge-screenshots/screenshot_20260723_000847.665.png`.

The wider, shorter body, rounder joints, hands, and boot toes are a material
improvement over S4. The candidate still fails admission. Its skin renders as
saturated orange rather than soft peach; eyes, cheeks, and mouth remain
unreadable in the front view; the helmet is a smooth spherical cap with no
readable brim, ear coverage, crest, or emblem; the hair fringe is absent; and
the clothing is dark green rather than the target's readable teal/blue layers.
The held shield and spear also confound the comparison because the approved
structural target is an unequipped base character. Future convergence review
must first accept the neutral base morphology and palette, then verify equipment
as a separate stable overlay. S5 remains mechanically valid but visually
rejected and unadmitted.

## S6 neutral-base candidate: rejected

Kimi WebBridge compared the corrected unequipped candidate
`guard.reference-ready.s6-neutral` at
`revision.66e7562c1557a30ef6d2ce521e0d14d24d8323737c282b229fd0da6fc32076ed`
against the structural target. Browser evidence is
`/tmp/kimi-webbridge-screenshots/screenshot_20260723_001934.683.png`.

The neutral/equipped separation and teal/peach palette are correct workflow
improvements. The model still fails. Separate protruding cheek, nose, and mouth
volumes combine into a moustache-like muzzle and obscure the eyes. The helmet
still reads as a smooth cap with large gray ear-pad discs rather than a fitted
dome, brim, hair fringe, and restrained decoration. The torso and legs read as
stacked armor beads instead of the reference's clean broad tunic and simple
limbs. This is now a construction failure, not a parameter-tuning failure.

The next iteration must replace the geometry approach: one smooth cranium/cheek
mass, shallow planar facial marks, a registered lathed dome-and-brim helmet
profile, and a cleaner tunic silhouette. S6 is rejected and unadmitted.
