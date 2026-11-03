import assert from 'node:assert/strict';
import { fakeEmitter } from '../shared/fakeEmitter.mjs';
import { EVENTS } from '../shared/events.js';
import { EnemyManager } from './EnemyManager.js';
import { ROYCE, ROYCE_ID } from './royceData.js';
import { BOSS_PROFILES } from '../ui/bossBarData.js';
import { victoryFor, victoryProblems } from '../ui/victoryData.js';

const events = fakeEmitter(); const regs = [];
events.on(EVENTS.ENTITY_REGISTERED, (p) => regs.push(p));
const m = new EnemyManager({ events });
const r = m.spawn({ id: 'railgun-royce-1', x: 100, y: 500, enemy: ROYCE_ID, hpMult: 1 });
const reg = regs.find((p) => p.id === 'railgun-royce-1');
assert.ok(reg.boss && reg.bossProfile === ROYCE_ID && reg.team === 'rust', 'registered as a boss: health bar and victory card key off bossProfile');
assert.equal(r.maxHp, ROYCE.maxHp);
assert.equal(r.maxHp, 160, 'content/enemies/mini-bosses.json maxHp');
assert.ok(r.miniBoss && !r.isBoss, 'miniBoss flag, never isBoss (that flag means Dugan art and voice)');
assert.equal(r.data.tint, ROYCE.tint); assert.equal(r.constructor.name, "RoyceBoss", "his own AI, not the grunt");
assert.equal(m.spawn({ id: 'g1', x: 0, y: 500 }).maxHp, 30, 'plain grunts are untouched');
assert.equal(m.spawn({ id: 'railgun-royce-2', x: 0, y: 500, enemy: ROYCE_ID, hpMult: 2 }).maxHp, 320, 'hpMult scales him');
assert.ok(BOSS_PROFILES[ROYCE_ID] && BOSS_PROFILES[ROYCE_ID].maxHpFallback === 160, 'boss bar profile exists');
assert.ok(victoryFor(ROYCE_ID), 'victory card entry exists (placeholder lines until the owner supplies them)');
assert.deepEqual(victoryProblems(), []);
console.log('royce ok');

// speedMult: waves can make enemies (and Royce) move faster; a watcher kind carries its tint.
{
  const ev = fakeEmitter(); const mm = new EnemyManager({ events: ev });
  const base = mm.spawn({ id: 'a', x: 0, y: 500 }).data.moveSpeed;
  const fast = mm.spawn({ id: 'b', x: 0, y: 500, speedMult: 1.3 });
  assert.equal(fast.data.moveSpeed, Math.round(base * 1.3));
  assert.ok(fast.data.circleSpeed > mm.spawn({ id: 'c', x: 0, y: 500 }).data.circleSpeed);
  assert.ok(mm.spawn({ id: 'w', x: 0, y: 500, skin: 'rust-watcher' }).data.tint, 'watchers are tinted');
  assert.equal(mm.spawn({ id: 'r', x: 0, y: 500, enemy: ROYCE_ID, speedMult: 1.3 }).data.moveSpeed, Math.round(ROYCE.moveSpeed * 1.3));
  console.log('speed ok');
}
