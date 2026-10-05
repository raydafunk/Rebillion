import assert from 'node:assert/strict';
import { fakeEmitter } from '../shared/fakeEmitter.mjs';
import { EVENTS } from '../shared/events.js';
import { createRoundState, RoundStatus } from './roundState.js';
import { createHitResolver } from '../combat/hitResolver.js';

function rig() {
  const ev = fakeEmitter(); const log = [];
  for (const n of Object.values(EVENTS)) ev.on(n, (p) => log.push([n, p]));
  return { ev, log, of: (n) => log.filter((l) => l[0] === n).map((l) => l[1]) };
}

// timeout
{
  const { ev, of } = rig(); const s = createRoundState(ev, { seconds: 3 });
  s.tick(1000); s.tick(1500);
  assert.deepEqual(of(EVENTS.TIMER_TICK).map((p) => p.secondsLeft), [2, 1]);
  s.tick(600);
  assert.deepEqual(of(EVENTS.ROUND_LOST), [{ reason: 'timeout' }]);
  assert.equal(s.status, RoundStatus.LOST);
  s.tick(5000); assert.equal(of(EVENTS.ROUND_LOST).length, 1);
}
// cleared + ko once only
{
  const { ev, of } = rig(); const s = createRoundState(ev);
  ev.emit(EVENTS.ENTITY_DIED, { id: 'g1', team: 'rust' });
  assert.equal(s.status, RoundStatus.RUNNING);
  ev.emit(EVENTS.ARENA_CLEARED, {});
  ev.emit(EVENTS.ENTITY_DIED, { id: 'player', team: 'player' });
  assert.deepEqual(of(EVENTS.ROUND_WON), [{ reason: 'cleared' }]);
  assert.equal(of(EVENTS.ROUND_LOST).length, 0);
}
// integration: full round with retry
{
  const { ev, of } = rig(); const s = createRoundState(ev, { seconds: 10 });
  createHitResolver(ev, () => 0);
  const hurt = { x: -10, y: -40, w: 20, h: 40 };
  const reg = (id, team, maxHp, x) => ev.emit(EVENTS.ENTITY_REGISTERED,
    { id, team, maxHp, hurtbox: hurt, getState: () => ({ x, y: 0, facing: 1 }) });
  reg('player', 'player', 20, 0); reg('g1', 'rust', 10, 30);
  const hit = (att, team, id, ox, dmg) => ev.emit(EVENTS.HIT_REQUEST, { attackerId: att, attackId: id, team,
    hitbox: { x: 0, y: -40, w: 60, h: 40 }, origin: { x: ox, y: 0 }, facing: ox === 0 ? 1 : -1, damage: dmg, knockback: 0, hitstun: 0 });
  s.start(); s.tick(2000);
  hit('player', 'player', 'p1', 0, 10); // kills g1
  assert.equal(of(EVENTS.ENTITY_DIED)[0].id, 'g1');
  ev.emit(EVENTS.ARENA_CLEARED, {});
  assert.equal(s.status, 'won');
  hit('g1', 'rust', 'e1', 30, 5); // ignored after end
  assert.equal(of(EVENTS.DAMAGE_APPLIED).length, 1);
  ev.emit(EVENTS.RETRY, {});
  assert.equal(s.status, 'running'); assert.equal(s.secondsLeft, 10);
  assert.equal(of(EVENTS.TIMER_TICK).at(-1).secondsLeft, 10);
  assert.deepEqual(of(EVENTS.PLAYER_HEALTH_CHANGED).at(-1), { hp: 20, maxHp: 20 });
  // lose by KO after retry
  reg('g2', 'rust', 10, 30);
  hit('g2', 'rust', 'e2', 30, 20);
  assert.deepEqual(of(EVENTS.ROUND_LOST), [{ reason: 'ko' }]);
  assert.deepEqual(of(EVENTS.PLAYER_HEALTH_CHANGED).at(-1), { hp: 0, maxHp: 20 });
}
console.log('state tests passed');
