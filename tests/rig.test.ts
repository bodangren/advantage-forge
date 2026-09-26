import { NodeIO } from '@gltf-transform/core';
import { describe, expect, it } from 'vitest';
import { buildAsset, defineAsset } from '../src/asset.js';
import { toGlb } from '../src/gltf.js';
import { sdf } from '../src/index.js';
import { mirrorBoneName } from '../src/sdf/core.js';

const rigged = defineAsset({
  name: 'rig-test',
  detail: 0.01,
  texture: false,
  build(k) {
    k.skeleton({
      hips: { at: [0, 0.3, 0] },
      'leg.L': { parent: 'hips', at: [0.1, 0.3, 0], tail: [0.1, 0, 0] },
      'leg.R': { parent: 'hips', at: [-0.1, 0.3, 0], tail: [-0.1, 0, 0] },
      head: { parent: 'hips', at: [0, 0.45, 0] },
    });
    const body = sdf.box([0.3, 0.15, 0.15], 0.02).at(0, 0.37, 0).bone('hips');
    const leg = sdf.capsule([0.1, 0.3, 0], [0.1, 0.03, 0], 0.04).bone('leg.L').mirror('x');
    k.body('body', sdf.smoothUnion(0.03, body, leg), { color: '#88aa66' });
    k.body('hat', sdf.cylinder(0.1, 0.05).at(0, 0.5, 0), { bone: 'head' });
    k.animation('walk', {
      duration: 1,
      fps: 10,
      pose: (_t, phase) => ({
        'leg.L': { rotate: [30 * Math.sin(phase * 2 * Math.PI), 0, 0] },
        'leg.R': { rotate: [-30 * Math.sin(phase * 2 * Math.PI), 0, 0] },
        hips: {
          move: [0, 0.01 * Math.abs(Math.sin(phase * 4 * Math.PI)), 0],
          scale: [1, 1 - 0.05 * Math.abs(Math.sin(phase * 4 * Math.PI)), 1],
        },
      }),
    });
  },
});

describe('rigging', () => {
  it('renames mirrored bones', () => {
    expect(mirrorBoneName('arm.L')).toBe('arm.R');
    expect(mirrorBoneName('hand_r')).toBe('hand_l');
    expect(mirrorBoneName('LeftFoot')).toBe('RightFoot');
    expect(mirrorBoneName('spine')).toBe('spine');
  });

  it('skins from bone tags and exports skin and animation', async () => {
    const { root, stats } = await buildAsset(rigged);
    expect(stats.bones).toBe(4);
    expect(stats.animations).toEqual([{ name: 'walk', duration: 1 }]);

    const doc = await new NodeIO().readBinary(await toGlb(root));
    const skins = doc.getRoot().listSkins();
    expect(skins).toHaveLength(1);
    const joints = skins[0]!.listJoints().map((n) => n.getName());
    expect(joints).toEqual(['hips', 'leg.L', 'leg.R', 'head']);

    const bodyPrim = doc
      .getRoot()
      .listNodes()
      .find((n) => n.getName() === 'body')!
      .getMesh()!
      .listPrimitives()[0]!;
    const pos = bodyPrim.getAttribute('POSITION')!;
    const j = bodyPrim.getAttribute('JOINTS_0')!;
    const w = bodyPrim.getAttribute('WEIGHTS_0')!;
    for (let i = 0; i < pos.getCount(); i++) {
      const [x, y] = pos.getElement(i, []) as number[];
      const [j0] = j.getElement(i, []) as number[];
      const weights = w.getElement(i, []) as number[];
      expect(weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
      // Feet belong to their own leg; the middle of the box belongs to the hips.
      if (y! < 0.1) expect(joints[j0!]).toBe(x! > 0 ? 'leg.L' : 'leg.R');
      if (y! > 0.42 && Math.abs(x!) < 0.05) expect(joints[j0!]).toBe('hips');
    }

    const hatPrim = doc
      .getRoot()
      .listNodes()
      .find((n) => n.getName() === 'hat')!
      .getMesh()!
      .listPrimitives()[0]!;
    const hatJ = hatPrim.getAttribute('JOINTS_0')!.getElement(0, []) as number[];
    const hatW = hatPrim.getAttribute('WEIGHTS_0')!.getElement(0, []) as number[];
    expect(joints[hatJ[0]!]).toBe('head');
    expect(hatW[0]).toBe(1);

    const anim = doc.getRoot().listAnimations()[0]!;
    expect(anim.getName()).toBe('walk');
    const targets = anim.listChannels().map((c) => `${c.getTargetNode()!.getName()}.${c.getTargetPath()}`);
    expect(targets.sort()).toEqual(['hips.scale', 'hips.translation', 'leg.L.rotation', 'leg.R.rotation']);
    expect(anim.listSamplers()[0]!.getInput()!.getCount()).toBe(11);
  });

  it('reports unknown bones clearly', async () => {
    const bad = defineAsset({
      name: 'bad',
      texture: false,
      build(k) {
        k.skeleton({ root: { at: [0, 0, 0] } });
        k.body('b', sdf.sphere(0.1).bone('nope'));
      },
    });
    await expect(buildAsset(bad)).rejects.toThrow(/tagged 'nope', which is not in the skeleton/);
  });
});

describe('motion helpers', () => {
  it('mirrors poses across the character', async () => {
    const { mirrorPose, wave, bump, legDrop } = await import('../src/motion.js');
    expect(
      mirrorPose({ 'arm.L': { rotate: [10, 20, 30], move: [0.1, 0.2, 0.3] }, spine: { rotate: [5, 6, 7] } }),
    ).toEqual({
      'arm.R': { rotate: [10, -20, -30], move: [-0.1, 0.2, 0.3] },
      spine: { rotate: [5, -6, -7] },
    });
    expect(wave(0.25)).toBeCloseTo(1);
    expect(bump(0.5)).toBeCloseTo(1);
    expect(bump(0)).toBeCloseTo(0);
    expect(legDrop(1, 60)).toBeCloseTo(0.5);
  });
});

describe('rig naming', () => {
  it('rejects a bone that shares a name with a part', async () => {
    const { buildAsset, defineAsset } = await import('../src/asset.js');
    const { sdf } = await import('../src/index.js');
    const clash = defineAsset({
      name: 'clash',
      texture: false,
      build(k) {
        k.skeleton({ root: { at: [0, 0, 0] }, lid: { parent: 'root', at: [0, 0.2, 0] } });
        k.body('lid', sdf.sphere(0.1), { bone: 'lid' });
      },
    });
    await expect(buildAsset(clash)).rejects.toThrow(/Bone 'lid' has the same name as a part/);
  });
});
