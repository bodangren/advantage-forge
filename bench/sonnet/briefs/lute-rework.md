# lute rework (equipment/instruments/lute) -> assets/lute.ts

Rebuild the existing file in place. The current build is a bowl lying on the floor with the neck sticking out flat: from the front it reads as a pot with a paddle. Match the mockup docs/item-mockups/lute-mock.jpg: a lute standing upright on its rounded bottom, leaning back slightly, with a teardrop soundboard facing +Z, a deep bowl behind, a neck with two frets bands, a bent peg head with four pegs, and four strings from the bridge to the head.

Stands on y = 0, 0.9 m tall, faces +Z, leaning back 12 degrees (rotateX around the base).

Construction recipe:
1. Bowl and soundboard: a teardrop profile in XY (0.42 m wide at y 0.2, narrowing to 0.12 m at y 0.5, bottom rounded at y 0), extruded 0.02 m as the soundboard (pale wood #e8c07a), plus the bowl: the same profile extruded 0.2 m behind it and rounded (`.round(0.06)` after shrinking), cut flat at the soundboard plane, in dark wood #8a4a2a. Six shallow rib grooves on the bowl painted darker. Two bodies (board, bowl).
2. Sound hole: a disc r 0.06 subtracted 0.01 m into the board at y 0.3 with a dark interior; a gold rosette torus around it.
3. Neck: a box [0.09, 0.4, 0.05] from y 0.5 to y 0.9 in mid wood #b07a48, with two fret bands (torus-like raised rings) and a fingerboard strip in dark wood on the front. The peg head: a box [0.1, 0.16, 0.06] at the top, bent back 60 degrees (rotateX), with four pegs (cylinders r 0.015 length 0.06 sticking out the sides, dark wood with round knobs).
4. Bridge: a small dark bar [0.14, 0.02, 0.02] on the board at y 0.12. Strings: four capsules r 0.004 from the bridge to the head, cream #efe4c8, one body.
5. Under 5,000 triangles.

Checks: `FORGE_WORKERS=2 ./forge render lute --fast`, look at out/lute/render.png; the front view must show the full teardrop soundboard with the neck and pegs above it, upright. At most three looks. Then `FORGE_WORKERS=2 ./forge all lute` once. No `warning:` lines. Update the design note. Never commit. Only edit assets/lute.ts.
