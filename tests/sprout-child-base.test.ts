import { NodeIO, type Document } from '@gltf-transform/core';
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { preProcessFile } from 'typescript';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE_FILE = join(ROOT, 'assets', 'parts', 'humanoid-kim-child.ts');
const TOM_GLB = join(ROOT, 'out', 'sprout-tom-kim', 'sprout-tom-kim.glb');
const BONE_NAMES = [
  'hips',
  'spine',
  'chest',
  'neck',
  'head',
  'upperarm.L',
  'forearm.L',
  'hand.L',
  'upperarm.R',
  'forearm.R',
  'hand.R',
  'leg.L',
  'shin.L',
  'foot.L',
  'leg.R',
  'shin.R',
  'foot.R',
] as const;
const JOINT_TARGETS: Record<string, number> = {
  'upperarm.L': 0.623,
  'leg.L': 0.351,
  'shin.L': 0.214,
  'hand.L': 0.368,
  'foot.L': 0.035,
};

type Vec3 = readonly [number, number, number];
type ChildModule = {
  BASE_CROWN_Y: number;
  BASE_CHIN_Y: number;
  BASE_JOINTS: Record<string, Vec3>;
  BASE_HANDS: {
    L: { palmCentre: Vec3; thumbTip: Vec3; fingerTip: Vec3 };
    R: { palmCentre: Vec3; thumbTip: Vec3; fingerTip: Vec3 };
  };
};

function expectWithin(actual: number, expected: number, tolerance: number, label: string): void {
  expect(
    Math.abs(actual - expected) <= tolerance,
    `landmark ${label}: ${actual} not ${expected} ± ${tolerance}`,
  ).toBe(true);
}

function expectInventory(kind: string, found: unknown, expected: unknown): void {
  expect(found, `inventory ${kind}: ${JSON.stringify(found)}`).toEqual(expected);
}

async function loadBase(): Promise<ChildModule> {
  expect(existsSync(BASE_FILE), `base humanoid-kim-child: not built: ${BASE_FILE}`).toBe(true);
  return (await import(pathToFileURL(BASE_FILE).href)) as ChildModule;
}

async function loadTom(): Promise<Document> {
  expect(existsSync(TOM_GLB), `asset sprout-tom-kim: not built: ${TOM_GLB}`).toBe(true);
  return await new NodeIO().readBinary(readFileSync(TOM_GLB));
}

describe('child base landmarks and Tom GLB', () => {
  it('pins the crown, chin, and left fingertip landmarks', { timeout: 300_000 }, async () => {
    const base = await loadBase();
    expectWithin(base.BASE_CROWN_Y, 1.05, 0.002, 'BASE_CROWN_Y');
    expectWithin(base.BASE_CHIN_Y, 0.687, 0.002, 'BASE_CHIN_Y');
    expect(Object.keys(base.BASE_HANDS).sort(), 'BASE_HANDS sides').toEqual(['L', 'R']);
    for (const side of ['L', 'R'] as const) {
      for (const name of ['palmCentre', 'thumbTip', 'fingerTip'] as const) {
        const point = base.BASE_HANDS[side][name];
        expect(point, `BASE_HANDS.${side}.${name}`).toHaveLength(3);
        expect(point.every(Number.isFinite), `BASE_HANDS.${side}.${name}`).toBe(true);
      }
    }
    expectWithin(base.BASE_HANDS.L.fingerTip[0], 0.139, 0.005, 'BASE_HANDS.L.fingerTip.x');
    expectWithin(base.BASE_HANDS.L.fingerTip[1], 0.292, 0.005, 'BASE_HANDS.L.fingerTip.y');
  });

  it('pins all 17 BASE_JOINTS and the five fixed joint heights', { timeout: 300_000 }, async () => {
    const base = await loadBase();
    expect(Object.keys(base.BASE_JOINTS).sort(), 'BASE_JOINTS bone names').toEqual([...BONE_NAMES].sort());
    for (const [name, expected] of Object.entries(JOINT_TARGETS)) {
      const point = base.BASE_JOINTS[name]!;
      expect(point, `BASE_JOINTS.${name}`).toHaveLength(3);
      expect(point.every(Number.isFinite), `BASE_JOINTS.${name}`).toBe(true);
      expectWithin(point[1], expected, 0.005, `BASE_JOINTS.${name}.y`);
    }
  });

  it('imports only src/index.js', { timeout: 300_000 }, async () => {
    await loadBase();
    const source = readFileSync(BASE_FILE, 'utf8');
    const imports = preProcessFile(source, true, true).importedFiles.map((file) => file.fileName);
    expect(imports.length, 'base import declarations').toBeGreaterThan(0);
    expect(imports.every((specifier) => specifier === '../../src/index.js')).toBe(true);
    expect(source).not.toContain('humanoid-kim.js');
  });

  it('Tom GLB holds the 17 joints, one idle clip, and one hands body', { timeout: 300_000 }, async () => {
    const doc = await loadTom();
    const root = doc.getRoot();
    const skins = root.listSkins();
    expectInventory('skins', skins.length, 1);
    const joints = skins[0]!.listJoints().map((joint) => joint.getName());
    expectInventory('joints', joints.length, 17);
    expectInventory('joints', [...joints].sort(), [...BONE_NAMES].sort());
    expectInventory(
      'animations',
      root.listAnimations().map((animation) => animation.getName()),
      ['idle'],
    );
    const hands = root.listNodes().filter((node) => node.getName() === 'hands');
    expectInventory('hands body', hands.length, 1);
    expectInventory('hands primitives', hands[0]!.getMesh()?.listPrimitives().length, 1);
    expectInventory('hands meshes', root.listMeshes().filter((mesh) => mesh.getName() === 'hands').length, 1);
  });

  it('Tom GLB joint heights match BASE_JOINTS within 0.002 m', { timeout: 300_000 }, async () => {
    const base = await loadBase();
    const doc = await loadTom();
    for (const name of BONE_NAMES) {
      const joint = doc
        .getRoot()
        .listNodes()
        .find((node) => node.getName() === name);
      expect(joint, `built joint ${name}`).toBeDefined();
      const y = joint!.getWorldMatrix()[13]!;
      expectWithin(y, base.BASE_JOINTS[name]![1], 0.002, `built joint ${name}.y`);
    }
  });

  it('Tom GLB lowest left-hand vertex matches BASE_HANDS within 0.005 m', { timeout: 300_000 }, async () => {
    const base = await loadBase();
    const doc = await loadTom();
    const hands = doc
      .getRoot()
      .listNodes()
      .filter((node) => node.getName() === 'hands');
    expectInventory('hands body', hands.length, 1);
    const position = hands[0]!.getMesh()!.listPrimitives()[0]!.getAttribute('POSITION');
    expect(position, 'hands POSITION').toBeDefined();
    const world = hands[0]!.getWorldMatrix();
    let tip: [number, number, number] | null = null;
    for (let index = 0; index < position!.getCount(); index += 1) {
      const local = position!.getElement(index, []) as number[];
      const point: [number, number, number] = [
        world[0]! * local[0]! + world[4]! * local[1]! + world[8]! * local[2]! + world[12]!,
        world[1]! * local[0]! + world[5]! * local[1]! + world[9]! * local[2]! + world[13]!,
        world[2]! * local[0]! + world[6]! * local[1]! + world[10]! * local[2]! + world[14]!,
      ];
      if (point[0] > 0 && (tip === null || point[1] < tip[1])) tip = point;
    }
    expect(tip, 'left-hand fingertip').not.toBeNull();
    expectWithin(tip![0], base.BASE_HANDS.L.fingerTip[0], 0.005, 'built fingertip.x');
    expectWithin(tip![1], base.BASE_HANDS.L.fingerTip[1], 0.005, 'built fingertip.y');
  });
});
