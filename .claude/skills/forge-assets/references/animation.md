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
4b. **Split bones (knees)**: `'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 }` takes the
   parent's weight beyond the knee (blended over 1.5 cm each side), so a leg tagged as one part
   bends at the knee. A clip that leaves `shin` at 0 keeps a straight leg, as before.
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
offset)` (0 to 1 to 0), `mirrorPose(pose)` (left to right), `legDrop(legLength, degrees)`, and
for posing by targets `reach`, `orient`, `follow`, `keys` (see "Weapon attacks that read").

The rig applies `rotate` in X, then Y, then Z order on world-aligned rest axes, and a child turns
with its parent. So a Z rotation of an upper arm also swings the forearm and the weapon; angles
tuned one bone at a time rarely give the path you want. Solve arm poses with `reach`.

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

## Weapon attacks that read

A weapon attack looks janky when its angles are tuned by hand: the blade points backward in the
wind-up, cuts through the body, or turns flat-side first. Plan the weapon's path, then let
`motion.reach` and `motion.orient` solve the arm.

1. **Plan the path first**, in the chest's rest frame (world meters of the rest pose). Write
   down 3 to 6 keys for the wrist position and the weapon direction:
   - **Slash** (sword, axe): wind up over the shoulder on the weapon side, cut on an arc down and
     across through the space in front of the chest, follow through past the far hip.
   - **Chop or smash** (axe, mace, hammer, club): lift high over the head, the head of the weapon
     lags, then snaps down in front; the body bends forward and the knees drop at impact.
   - **Thrust** (spear, dagger, rapier): pull back to the hip, drive the point along a straight
     line toward the target, the weapon parallel to its motion, the body lunges.
   - **Shoot** (bow): the bow arm points at the target, the string hand draws back along the arrow
     line to the jaw, holds, releases forward; give the string two segments that meet the hand
     (or a string bone), so the draw is visible.
   - **Cast** (staff, wand, book): gather (both hands in, the staff pulled back), then push out
     toward the target with a flare on the focus (scale the glow up for 2 to 3 frames).
2. **The body drives the weapon.** The hips turn and the weight shifts first, the chest follows,
   the arm comes last and the weapon lags, then whips through. Step into the strike: the front
   foot moves forward and the hips drop (`legDrop`). The off hand balances (swings the other way)
   or holds the same weapon (two-handed).
3. **Timing.** Anticipation 30 to 40% of the clip, with a short hold at the top; the strike
   itself is fast (0.08 to 0.15 s); follow-through past the target; a slower recovery back to
   the rest pose. Use `keys(p, list, 'spline')` for the strike, so the weapon keeps its speed
   through the middle keys, and `'smooth'` for holds. Hold the contact pose for about 0.1 s
   (a claw at full reach, a bite, a hammer on the work): a contact that lasts one frame is
   invisible in play. The GLB stores the clip at its `fps` (30 by default) and the game
   interpolates between samples, so put the contact phase on a sample
   (`phase * duration * fps` a whole number) or raise the clip's `fps`; a blacksmith's hammer
   whose impact fell between two samples stopped 9 cm above the work.
4. **The edge leads.** A cutting blade moves edge first: its flat faces across the direction of
   travel. Give `orient` an `up` that is the flat's normal you want (about the cross product of
   the blade direction and the swing direction).
5. **Check** the strike frames from the front, the side, and the top (`--views front,side,top
   --frames 16`): the weapon passes through the space in front of the character, never through
   the head or the body, and the wind-up points the weapon up or back, not into the ground.
6. **Never through the head, in any clip.** A held item (weapon, haft, staff, bow, shield) must
   not pass through the head, the helmet, the hat, or the hood in any clip: attack, victory (a
   weapon raised in celebration), idle, walk, run, hit, death. Chibi heads, hats, and hoods are
   big: route a raised weapon beside the head on the weapon side or clearly above it, and check
   the frames between keys too (a spline between two clear keys can still cut through). Run
   `./forge check <name>`: it poses every clip at 60 fps and fails on any head contact.

### Helpers

- `reach({ root, mid, end }, target, pole)`: two-bone IK. `root/mid/end` are the rest joints
  (shoulder, elbow, wrist; or hip, knee, ankle), `target` the wanted wrist position, `pole` a
  point the elbow bends toward. Returns `{ upper, lower }` rotate values.
- `orient(parents, rest, want)`: the rotate value for a bone (the hand) so a rest direction of
  the weapon points along `want.dir`, rolled so `rest.up` goes toward `want.up`. `parents` are
  the rotate values of the bones above it in the chain (upper arm, forearm).
- `follow(joints, rotations, point)`: where a point bound to the chain goes (forward
  kinematics): the posed grip of a two-handed weapon, so the other hand can `reach` it.
- `keys(p, [[phase, value], ...], mode)`: keyframes for numbers or [x, y, z] values.
- **Legs with knees**: solve a planted or stepping foot with `reach({ root: HIP, mid: KNEE,
  end: ANKLE }, ankleTarget, pole)` with the pole in front of the knee (`[x, KNEE[1], 0.3]`):
  `upper` goes to `leg.L`, `lower` to `shin.L`. Give the foot the opposite pitch so the sole
  stays flat (`orient`, or for pure X turns `foot = -(upper + lower)`). Targets are in the rest
  frame of the hips: if the hips move or turn, move the target by the opposite. A crouch, a
  lunge, a jump, and a kneel all drop the hips and bend the knees; the feet stay planted.
- `plant([{ joints: [HIP, KNEE, ANKLE], rotations: [legRot, shinRot, footRot], sole: [heel, toe] }, ...])`: the
  hips `move` y that keeps the lowest sole point of the feet on the ground. Use it instead of
  `legDrop` in walks and runs (`legDrop` assumes a straight leg): `legDrop` keeps the ankle level, but a foot that rolls (heel
  strike, toe-off) then dips its toe or heel below the floor. `./forge check` fails clips that
  sink more than 1.5 cm below the rest pose.

```ts
const { keys, reach, orient } = motion;
const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
// How the sword is built: the blade direction and its flat's normal at rest.
const BLADE = { dir: BLADE_DIR, up: [0, 0, 1] as V3 };
k.animation('attack', {
  duration: 0.9,
  loop: false,
  pose: (_t, p) => {
    // The wrist: rest, up beside the right side of the head (hold), down and across in front of
    // the chest to the left hip (strike), then back to rest.
    const wrist = keys(p, [[0, WRIST_R], [0.32, [-0.24, 0.6, -0.02]], [0.4, [-0.23, 0.62, 0.0]],
      [0.48, [-0.02, 0.4, 0.2]], [0.56, [0.14, 0.22, 0.16]], [1, WRIST_R]], 'spline');
    const dir = keys(p, [[0, BLADE.dir], [0.35, [-0.3, 0.75, -0.6]], [0.48, [0.3, 0.2, 0.9]],
      [0.56, [0.7, -0.5, 0.4]], [1, BLADE.dir]], 'spline');
    const arm = reach(ARM_R, wrist, [-0.5, 0.2, -0.3]);
    const hand = orient([arm.upper, arm.lower], BLADE, { dir: norm(dir), up: [0, 0, 1] });
    return {
      'upperarm.R': { rotate: arm.upper },
      'forearm.R': { rotate: arm.lower },
      'hand.R': { rotate: hand },
      // ...hips, spine, chest, legs from the same keys' timing
    };
  },
});
```

## The clip set

Every character gets the clips its role needs, not only walk and attack:

- **Heroes**: idle, walk, run, attack (the main weapon), attack2 (a second move: shield bash,
  spin, cast, power shot), hit, death, victory.
- **Humanoid enemies**: idle, walk, run, attack, hit, death (plus a special where the design
  has one).
- **Monsters**: idle, walk (or fly), attack, hit, death, plus specials (charge, reveal, spit).
- **Villagers and NPCs**: idle, walk, work or talk, wave (and attack for guards).

**Hit** (0.35 to 0.45 s, one-shot): the head and chest snap back from the blow, a small step
back, a quick return. **Death** (1.0 to 1.5 s, one-shot): a stagger, then a fall that ends lying
on the ground; the hips come down to the ground (`move`), the body turns about 80 to 90 degrees
about X (backward) or Z (sideways), and nothing sinks below y = 0. Flyers stop flapping and drop.
Held weapons fall with the hand or drop beside the body.

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
