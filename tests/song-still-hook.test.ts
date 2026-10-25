import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';

const forbidden = vi.hoisted(() => () => { throw new Error('Forbidden real operation'); });
vi.mock('node:child_process', () => ({ spawn: forbidden, spawnSync: forbidden, exec: forbidden,
  execSync: forbidden, execFile: forbidden, execFileSync: forbidden, fork: forbidden }));
vi.mock('playwright', () => ({ chromium: { launch: forbidden } }));
vi.mock('vite', () => ({ createServer: forbidden }));

function fixture() {
  const camera = new THREE.PerspectiveCamera(37, 1.3, 0.2, 99);
  camera.position.set(2, 3, 7);
  return { scene: new THREE.Scene(), camera, renderer: {}, lookTarget: new THREE.Vector3(1, 0.5, -2) };
}

describe('Book still hook', () => {
  it('T42: publish creates the hook and clear removes the stale hook', async () => {
    // Falsification: a hook exists before publication or survives clear.
    const { publishBookStill, clearBookStill } = await import('../src/song/still-hook.js');
    const target: Record<string, unknown> = {};
    const parts = fixture();
    expect(Object.hasOwn(target, '__bookStill')).toBe(false);
    publishBookStill(target, parts);
    expect(target.__bookStill).toMatchObject({ scene: parts.scene, camera: parts.camera, renderer: parts.renderer });
    expect(target.__bookStill).toHaveProperty('cameraState');
    clearBookStill(target);
    expect(Object.hasOwn(target, '__bookStill')).toBe(false);
    publishBookStill(target, parts);
    expect(target.__bookStill).toHaveProperty('cameraState');
    clearBookStill(target);
    expect(Object.hasOwn(target, '__bookStill')).toBe(false);
  });

  it('T43: the published camera state is a complete value copy', async () => {
    // Falsification: a field differs, is missing, or changes with the live camera.
    const { publishBookStill, cameraStateOf } = await import('../src/song/still-hook.js');
    const target: Record<string, unknown> = {};
    const parts = fixture();
    const expected = { position: [2, 3, 7], target: [1, 0.5, -2], fov: 37, aspect: 1.3, near: 0.2, far: 99 };
    expect(cameraStateOf(parts.camera, parts.lookTarget)).toEqual(expected);
    publishBookStill(target, parts);
    const state = (target.__bookStill as { cameraState: unknown }).cameraState;
    expect(state).toEqual(expected);
    parts.camera.position.set(8, 9, 10);
    parts.lookTarget.set(4, 5, 6);
    Object.assign(parts.camera, { fov: 55, aspect: 2, near: 1, far: 200 });
    expect(state).toEqual(expected);
    expect(cameraStateOf(parts.camera, parts.lookTarget)).toEqual({
      position: [8, 9, 10], target: [4, 5, 6], fov: 55, aspect: 2, near: 1, far: 200,
    });
  });

  it('T44: only load and seek call the hooks; the song API stays byte-identical', () => {
    // Falsification: the API changes, or a hook runs outside its required position.
    const text = readFileSync(new URL('../src/song/main.ts', import.meta.url), 'utf8');
    // These two exact lines come from the immutable phase baseline, 1d39b8fd.
    expect(text.split('\n').filter((line) => line.includes('window.__song ='))).toEqual([
      'window.__song = { ready: true, portrait, load, seek };',
    ]);
    expect(text.split('\n').filter((line) => line.includes('__song?:'))).toEqual([
      '    __song?: { ready: boolean; portrait: boolean; load: (tl: Timeline) => Promise<string[]>; seek: (t: number) => void };',
    ]);
    const source = ts.createSourceFile('main.ts', text, ts.ScriptTarget.Latest, true);
    const calls: { name: string; owner: string; position: number; node: ts.CallExpression }[] = [];
    function walk(node: ts.Node, owner = '') {
      if (ts.isFunctionDeclaration(node)) owner = node.name?.text ?? '';
      if (ts.isCallExpression(node)) calls.push({ name: node.expression.getText(source), owner, position: node.pos, node });
      ts.forEachChild(node, (child) => walk(child, owner));
    }
    walk(source);
    const publishes = calls.filter((call) => call.name === 'publishBookStill');
    const clears = calls.filter((call) => call.name === 'clearBookStill');
    expect(publishes).toHaveLength(1); expect(clears).toHaveLength(1);
    expect(publishes[0]!.owner).toBe('seek'); expect(clears[0]!.owner).toBe('load');
    expect(publishes[0]!.node.arguments[0]?.getText(source)).toBe('window');
    expect(clears[0]!.node.arguments[0]?.getText(source)).toBe('window');
    const renders = calls.filter((call) => call.owner === 'seek' && call.name === 'renderer.render');
    expect(renders).toHaveLength(1);
    expect(publishes[0]!.position).toBeGreaterThan(renders[0]!.position);
    const seek = source.statements.find((node): node is ts.FunctionDeclaration =>
      ts.isFunctionDeclaration(node) && node.name?.text === 'seek');
    const last = seek!.body!.statements.at(-1)!;
    expect(ts.isExpressionStatement(last) && ts.isCallExpression(last.expression)
      && last.expression.expression.getText(source) === 'publishBookStill').toBe(true);
  });
});
