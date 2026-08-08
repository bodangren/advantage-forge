# Chibi Quest guard reference review

These generated images are non-shipping design targets. They do not satisfy Forge validation, animation, Pixel admission, theme-pack completeness, or final-art acceptance.

## Selected references

- Structural modeling target: `chibi-guard-base-turnaround_002.jpg` (`e922d428...71ff64`). It provides the most consistent front, side, and back geometry with no held-equipment drift.
- Secondary art-direction reference: `chibi-guard-base-turnaround_001.jpg` (`4775e436...30726`). It has stronger personality and proportions, but its views are too three-quarter-oriented to be the structural source of truth.

## Rejections

- The entire first equipped batch is rejected because equipment, pose, or view coverage changes between panels.
- Base 003 is rejected for generated logo/text and missing back coverage.
- Base 004 is rejected for accidental shield carryover and missing front coverage.

## Next gate

The selected target is structurally approved under the delegated final
orchestration authority and has been bound to the deterministic reference
geometry workflow. It remains a non-shipping design target.

The first-class novel candidate
`revision.a966deffd62d618b277ac7eb1bd199b9836984e252bc67e6fa07e6ad72eda9eb`
was reviewed side by side in Kimi WebBridge and rejected. Its attached feature
grammar is mechanically useful, but its flattened helmet/cranium, unreadable
dark face band, narrow rectilinear body, and equipment-dominated silhouette do
not converge on the reference.

The S5 candidate materially improved body roundness but was also rejected in
Kimi WebBridge. It still has orange skin, an unreadable face, a smooth cap-like
helmet, no visible hair fringe, and overly dark green clothing. Its held
equipment also obscures the comparison to this unequipped structural target.

The next iteration must render an unequipped neutral base in the same fixed
pose and camera. It must change the actual bounded morphology, materials, and
feature geometry: round cranium and cheek mass, readable face placement and
contrast, soft peach skin, fitted helmet brim/ear coverage and readable
decoration, visible hair fringe, wider/shorter torso and limbs, larger hands and
boots, and teal/blue clothing layers legible at 128x128. Held equipment is a
separate overlay gate after the base character converges. Repeat side-by-side
Kimi review before any pose-sheet work is admitted.

S6 correctly removed held equipment and improved palette/body proportions, but
Kimi rejected its underlying construction. Protruding cheek/nose/mouth parts
formed a muzzle, the cap/ear discs did not read as the reference helmet, and
the segmented torso/legs did not read as a clean tunic silhouette.

Do not continue scaling those same parts. Replace them with one smooth
cranium/cheek mass, shallow facial marks, a bounded lathed dome-and-brim helmet
profile with visible fringe, and a simplified broad tunic. Preserve the neutral
unequipped comparison until the base is accepted.

S7 performed that mechanical replacement but is also rejected. Kimi WebBridge
reviewed the reference/contact-sheet comparison at
`/tmp/kimi-webbridge-screenshots/screenshot_20260723_002853.696.png` and all
eight native frames at
`/tmp/kimi-webbridge-screenshots/screenshot_20260723_003133.408.png`. The
helmet became an oversized saucer that hides the face; the retained full hair
mass intersects it and creates large dark crown patches in E, SE, S, SW, and W.
The exposed face is only a thin orange band with unreadable marks, the head is
too small, and the thin boxy body lacks the target's broad flared tunic.

S8 must keep the comparison neutral while replacing the full crown hair with
restrained under-brim fringe/back hair, opening and enlarging the face, narrowing
and softening the dome/brim silhouette, and widening the shoulders, tunic hem,
and hands. Mechanical validity remains necessary but cannot override the next
Kimi verdict.

S8 is also rejected. Kimi WebBridge session `faf-asset-qa-s8` compared the
approved target with the S8 contact sheet at `/s8-reference.html` and inspected
all eight native frames at `/s8-native.html`. The Kimi screenshot endpoint
timed out after the gallery grew, so the following files are deterministic
montages of the exact source images inspected through Kimi, not captures
returned by that endpoint:

- Target/contact-sheet montage:
  `/tmp/kimi-webbridge-screenshots/s8-reference-comparison-kimi-reviewed.png`.
- All-eight-native-frame montage:
  `/tmp/kimi-webbridge-screenshots/s8-all-native-kimi-reviewed.png`.

The visual verdict came from Kimi `evaluate` canvas-composite inspection. S8's
large detached/intersecting rear hair oval remains unacceptable; its fringe and
facial features read as warpaint, a mask, or a moustache in N, NE, and NW. The
helmet is still a shallow cap rather than the target's taller smooth grey dome
and narrow outward brim, and its orange crest is not present in the approved
target. The tunic remains rectangular, the arms and hands are insufficiently
separated from the torso, and the skin is still too saturated. S9 must replace
those four surfaces from measured target proportions while remaining neutral.

S9 is mechanically stronger but visually rejected. Kimi WebBridge session
`faf-asset-qa-s9` compared the approved target with the S9 contact sheet and
then inspected every native 128x128 direction enlarged three times in the
browser. Preserved evidence is:

- `/tmp/kimi-webbridge-pdfs/S9 reference comparison.pdf` with raster view
  `/tmp/kimi-s9-reference-comparison-1.png`.
- `/tmp/kimi-webbridge-pdfs/S9 all native frames.pdf` with raster view
  `/tmp/kimi-s9-all-native-1.png`.

S9's helmet consumes most of the head and upper character, and its brim hides
the eyes or upper face in oblique and side views. The front face still reads as
a black cross or moustache instead of two vertical eyes and a subtle mouth.
Omitting all hair also removed the approved target's readable under-helmet
sideburn silhouette. The body remains thin and featureless: its tunic lacks the
broad blue garment and pale trim, while belt, pouches, helmet emblem, and boot
details are missing or unreadable. The palette remains dark and low-contrast,
and the hands and arms are still too blocky and small. S10 must be a new
silhouette/modeling pass rather than another ratio adjustment.

S10 is also visually rejected. Kimi WebBridge session `faf-asset-qa-s10`
compared the approved target and S10 contact sheet, then inspected every native
direction enlarged three times. Evidence is retained in
`/tmp/kimi-webbridge-pdfs/S10 reference comparison.pdf` and
`/tmp/kimi-webbridge-pdfs/S10 all native frames.pdf`; raster views are
`/tmp/kimi-s10-reference-comparison-1.png` and
`/tmp/kimi-s10-all-native-1.png`.

S10 materially improves garment color, trim, and equipment detail, but does not
converge. The head and exposed face remain too small while the helmet dominates
and its brim compresses the eyes. The front face reads as tiny marks plus a
central cross or triangle instead of two clear vertical eyes and a subtle
smile. Side hair becomes detached red rectangles, and the helmet emblem remains
an unreadable small mark. Arms and hands remain undersized, trim and belt form
strong diagonal bands in oblique views, and the layered boot pieces read as
orange prongs or claws. S11 must simplify these primitives while enlarging the
rounded face and target silhouette.

S11 is mechanically valid but visually rejected. Kimi WebBridge session
`faf-asset-qa-s11` compared the approved target with the S11 contact sheet and
inspected all eight native 128x128 directions enlarged three times. Evidence is
retained in `/tmp/kimi-webbridge-pdfs/S11 reference comparison.pdf` and
`/tmp/kimi-webbridge-pdfs/S11 all native frames.pdf`; raster views are
`/tmp/kimi-s11-reference-comparison-1.png` and
`/tmp/kimi-s11-all-native-1.png`.

The face still does not read as two vertical eyes and a smile; it collapses into
tiny scattered black and red marks. Rounded primitives alone did not correct
detached dark-red side hair, a brown protruding helmet patch instead of a
centered grey insignia, the small helmet-dominated head, crossing diagonal
belt/trim bands, tiny arms and hands, or the primitive-doll silhouette. Do not
make S12 by tuning the same composition. Audit and extend the reusable grammar
and renderer first, including surface-facing marks, smooth rounded masses,
local orientation, material/light contrast, silhouette proportions, and the
2,000-triangle constraint.
