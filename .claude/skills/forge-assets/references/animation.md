# Rigging and animation

Worked examples: `assets/rogue.ts` (humanoid idle, walk, run, a trailing cape),
`assets/archer.ts` (a bow arm that swings less and lifts clear), `assets/horned-boar.ts`
(quadruped trot, charge, idle), `assets/treasure-chest.ts` (one-shot open, looping rattle),
`assets/oak-tree.ts` (wind sway).

## Rigging

1. **Skeleton**: `k.skeleton({ name: { parent?, at: [x, y, z] } })`, where `at` is the joint in
   the rest pose in world meters. One root. Put joints where the body actually bends
   (shoulder, elbow, wrist, hip, knee, ankle, neck base, skull base, hinge line).
2. **Skin weights from tags**: tag the parts you built from with `.bone(name)` *before* you
   blend them: `sdf.cone(SHOULDER, ELBOW, r1, r2).bone('upperarm.L')`. Where tagged parts blend,
   weights blend too, so joints bend smoothly. Build the left side and `.mirror('x')` it:
   tags ending in `.L` are renamed `.R` on the reflection.
3. **Rigid parts** (helmets, hair under a helmet, weapons, buckles, eyes, horns): body option
   `bone: 'head'` so they move as one piece and never deform.
4. **Names**: a bone and a body must never share a name.
5. `skinBlend` (asset option, default 0.015 m) sets how gradually weight passes between bones;
   raise it for soft creatures, lower it for armor.

## Pose conventions

`pose(t, phase)` returns `{ bone: { rotate: [x, y, z], move: [x, y, z] } }`, relative to rest.
Rotations are degrees:

- **+X** swings a hanging limb **backward** (toward -Z) and tilts an upward bone (spine, neck)
  **forward**. So a leg steps forward with a **negative** X rotation.
- **+Z** swings a hanging limb toward +X (the character's left): raise a left arm outward with
  +Z, a right arm with -Z.
- **+Y** twists counterclockwise seen from above.
- `move` is in meters, added to the bone's rest position (hips bob, body hop).
- `scale` multiplies per axis (1 = rest): squash and stretch for slimes, bouncy props,
  breathing bellies. Keep volume roughly constant.

Helpers in `motion`: `wave(phase, cycles, offset)` (a sine, -1 to 1), `bump(phase, cycles,
offset)` (0 to 1 to 0), `mirrorPose(pose)` (left to right), `legDrop(legLength, degrees)`.

## Cycles

A looping clip must end where it starts: build it from `wave` and `bump` with whole numbers of
`cycles`. Offsets (`offset` in periods) create overlap: the head lags the chest, the tail lags
the hips. Things that follow (tails, ears, hair, capes) move later and a bit more.

### Humanoid walk and run (from the rogue)

```ts
const { wave, bump, legDrop } = motion;
const LEG = 0.19; // hip joint height above the ground
const stride = (duration: number, legSwing: number, armSwing: number, lean: number, hop: number, flow: number) => ({
  duration,
  pose: (_t: number, p: number) => {
    const s = wave(p); // +1 when the left leg is fully forward
    return {
      // Drop the hips at each contact so the planted foot stays on the ground.
      hips: { move: [0, -legDrop(LEG, legSwing * s) + hop * bump(p, 2, 0.25), 0], rotate: [0, 7 * s, 0] },
      spine: { rotate: [lean, 0, 0] },
      chest: { rotate: [lean * 0.5, -11 * s, 0] }, // shoulders counter-twist
      head: { rotate: [-lean, 5 * s, 0] },
      // A cape trails behind (flow) and flutters twice per cycle, a little after the steps.
      cloak: { rotate: [flow + 4 * wave(p, 2, 0.15), 0, 3 * s] },
      'leg.L': { rotate: [-legSwing * s, 0, 0] },
      'leg.R': { rotate: [legSwing * s, 0, 0] },
      'foot.L': { rotate: [legSwing * 0.55 * s + 12 * Math.max(0, -s), 0, 0] },
      'foot.R': { rotate: [-legSwing * 0.55 * s + 12 * Math.max(0, s), 0, 0] },
      'upperarm.L': { rotate: [armSwing * s, 0, 6] }, // arms opposite to legs
      'upperarm.R': { rotate: [-armSwing * s, 0, -6] },
      'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s), 0, 0] },
      'forearm.R': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, s), 0, 0] },
    };
  },
});
k.animation('walk', stride(0.9, 26, 28, 3, 0, 6));
k.animation('run', stride(0.56, 40, 50, 12, 0.03, 22)); // bigger swing, forward lean, a hop
```

### Quadruped trot (from the boar)

Diagonal pairs move together: front-left with back-right. The forward-swinging pair lifts
(front knees bend back, hind hocks bend forward). The body rolls a little, the spine
counter-rotates, the head bobs twice per cycle, the tail swings.

```ts
const a = wave(p);                          // +1: front-left forward
const liftA = Math.max(0, wave(p, 1, 0.25)); // pair A is lifted while swinging forward
const liftB = Math.max(0, -wave(p, 1, 0.25));
// 'fleg.L' and 'bleg.R': rotate X = -swing * a;   'fleg.R' and 'bleg.L': +swing * a
// 'fshin.L': +lift * liftA; 'bshin.R': -lift * liftA; 'fshin.R': +lift * liftB; 'bshin.L': -lift * liftB
// hips: move y = -bob * bump(p, 2), rotate z = 3 * a; spine rotate z = -3 * a
```

Walk: duration 0.8 s, swing 22, lift 35. Charge: 0.45 s, swing 38, lift 60, head lowered
(neck +14 on X), bigger bob.

### Idle

Idles are small: breathing (chest rotate X 2 to 3 degrees, hips move down a few millimeters
with `bump`), a slow head turn, arms settling, a tail or ear flick. 2 to 3 s long. Idles that
move too much look nervous.

### One-shots (attack, hit, open, death)

Set `loop: false`. Use easing: anticipation (a small move in the opposite direction first),
a fast main action, then overshoot and settle. `easeOutBack` from `references/props.md` gives
the overshoot. Timing: anticipation 20 to 30%, action 10 to 20%, follow-through the rest.

## Review

`./forge animate <name> --fast` writes `out/<name>/anim/<clip>.png` (rows: views; columns:
poses in time) and a `.gif`. Read the PNG and check:

- Feet stay on the ground at contact (no sliding through the floor, no floating).
- Nothing passes through anything: legs through a tunic hem, arms through the body, a lid
  through the contents.
- The motion reads in the side view (strides, arm swing) and the silhouette changes.
- The first and last columns of a loop match.
- Fast shakes are not accidentally invisible. A strip samples N evenly spaced poses; a
  motion with a cycle count that fits those samples exactly (4 shakes in 8 frames) lands on its
  zero crossings in every column and looks frozen. Use odd cycle counts (5 shakes), check with
  `--frames 12`, and watch the `.gif`.
- Rigid parts stay attached (a helmet moves with the head).

Then check the sprite version: `./forge sprites <name> --clip walk --dirs 4 --frames 6`.
Motion that is too subtle disappears at 128 px; exaggerate it for sprite use.
