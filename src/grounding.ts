import * as THREE from 'three';
import type { Rig } from './rig.js';

/**
 * Keeps a clip on the ground: in every frame where the body would sink below the lowest point of
 * the rest pose, the root bone rises by exactly that much. It only raises, so jumps, hops, and
 * flight stay as written. Walks whose feet roll (heel strike, toe-off) and deaths that lie down
 * then rest on the floor instead of passing through it.
 *
 * `exclude` holds meshes that do not count (held weapons: an axe that hits the floor must be
 * fixed in its clip, not by lifting the whole body).
 */
export function groundClip(
  root: THREE.Object3D,
  clip: THREE.AnimationClip,
  rig: Rig,
  exclude: ReadonlySet<string>,
): THREE.AnimationClip {
  const meshes: THREE.SkinnedMesh[] = [];
  root.traverse((o) => {
    if ((o as THREE.SkinnedMesh).isSkinnedMesh && !exclude.has(o.name)) meshes.push(o as THREE.SkinnedMesh);
  });
  const times = clip.tracks[0]?.times;
  if (meshes.length === 0 || !times) return clip;
  const skeletons = [...new Set(meshes.map((m) => m.skeleton))];
  const toRest = () => skeletons.forEach((s) => s.pose());
  const v = new THREE.Vector3();
  const lowest = () => {
    root.updateMatrixWorld(true);
    let min = Infinity;
    for (const m of meshes) {
      const pos = m.geometry.getAttribute('position');
      const stride = Math.max(1, Math.floor(pos.count / 1500));
      for (let j = 0; j < pos.count; j += stride) {
        v.fromBufferAttribute(pos, j);
        m.applyBoneTransform(j, v);
        v.applyMatrix4(m.matrixWorld);
        if (v.y < min) min = v.y;
      }
    }
    return min;
  };

  toRest();
  const rest = lowest();
  const mixer = new THREE.AnimationMixer(root);
  const action = mixer.clipAction(clip);
  // Play once and hold the end: a looping action wraps back to the first frame at the clip's
  // end time, so the last frame would be measured on the wrong pose.
  action.setLoop(THREE.LoopOnce, 1);
  action.clampWhenFinished = true;
  action.play();
  const lift = new Float32Array(times.length);
  let any = false;
  for (let f = 0; f < times.length; f++) {
    mixer.setTime(times[f]!);
    const d = rest - lowest();
    if (d > 0.001) {
      lift[f] = d;
      any = true;
    }
  }
  action.stop();
  mixer.uncacheRoot(root);
  toRest();
  if (!any) return clip;

  // Add the lift to the root bone's position track (make one if the clip has none).
  const name = `${rig.root.name}.position`;
  const tracks = clip.tracks.filter((t) => t.name !== name);
  const old = clip.tracks.find((t) => t.name === name);
  const values = new Float32Array(times.length * 3);
  for (let f = 0; f < times.length; f++) {
    const base = old ? [old.values[f * 3]!, old.values[f * 3 + 1]!, old.values[f * 3 + 2]!] : [rig.root.position.x, rig.root.position.y, rig.root.position.z];
    values.set([base[0]!, base[1]! + lift[f]!, base[2]!], f * 3);
  }
  tracks.push(new THREE.VectorKeyframeTrack(name, times, values));
  const out = new THREE.AnimationClip(clip.name, clip.duration, tracks);
  out.userData = { ...clip.userData, grounded: Math.max(...lift) };
  return out;
}
