import { describe, expect, it } from 'vitest';
import avatarBase from '../assets/avatar-base.js';
import sproutBase from '../assets/sprout-base.js';
import { AGE5, HERO } from '../assets/parts/humanoid-kind.js';
import { collectBodies } from '../src/asset.js';
import { SOCKETS } from '../src/equip.js';

describe('sprout-base (age-5 humanoid)', () => {
  it('has the bone names, clip names, and equip sockets of the avatar base', async () => {
    const hero = await collectBodies(avatarBase);
    const sprout = await collectBodies(sproutBase);
    expect(Object.keys(sprout.skeleton!).sort()).toEqual(Object.keys(hero.skeleton!).sort());
    for (const [bone, def] of Object.entries(hero.skeleton!)) expect(sprout.skeleton![bone]!.parent, bone).toBe(def.parent);
    expect([...sprout.animations.keys()]).toEqual([...hero.animations.keys()]);
    for (const [name, socket] of Object.entries(SOCKETS)) expect(sprout.skeleton![socket.bone], name).toBeDefined();
  });

  it('keeps the hero head and a shorter body', () => {
    expect(AGE5.head).toEqual(HERO.head);
    expect(AGE5.headY).toBeLessThan(HERO.headY);
    expect(AGE5.ankle[1]).toBeGreaterThan(0); // the age-5 legs are longer than the hero's (pass 3), so the ankle is not lower
    expect(AGE5.shoulder[1]).toBeLessThan(HERO.shoulder[1]); // a shorter torso: the shoulders sit lower than the hero's
  });
});
