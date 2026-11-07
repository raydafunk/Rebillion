// Wiring checks for the Level 5 / Level 6 mini-bosses (the same checks GlitchBoss.test.mjs makes for Glitch), plus the airborne-Raptor hit rule.
import assert from 'node:assert/strict';
import { fakeEmitter } from '../shared/fakeEmitter.mjs';
import { EVENTS } from '../shared/events.js';
import { EnemyManager } from './EnemyManager.js';
import { createHitResolver } from '../combat/hitResolver.js';
import { RaptorBoss } from './RaptorBoss.js';
import { Subject88Boss } from './Subject88Boss.js';
import { RAPTOR, RAPTOR_ID } from './raptorData.js';
import { SUBJECT88, SUBJECT88_ID } from './subject88Data.js';
import { isRaptorEnemy } from './raptorSound.js';
import { isSubject88Enemy } from './subject88Sound.js';
import { BOSS_PROFILES } from '../ui/bossBarData.js';
import { victoryFor, victoryProblems } from '../ui/victoryData.js';
import { bossIntroFor } from '../ui/bossIntroData.js';

for (const [id, Cls, data] of [[RAPTOR_ID, RaptorBoss, RAPTOR], [SUBJECT88_ID, Subject88Boss, SUBJECT88]]) {
  const ev = fakeEmitter(), reg = [];
  ev.on(EVENTS.ENTITY_REGISTERED, (p) => reg.push(p));
  const mgr = new EnemyManager({ events: ev, getXRange: () => ({ min: 0, max: 1280 }) });
  const g = mgr.spawn({ id: 'e1', x: 900, y: 520, enemy: id, hpMult: 1 });
  assert.ok(g instanceof Cls, `${id}: spawned as its boss class`); assert.equal(g.maxHp, data.maxHp);
  assert.equal(reg[0].bossProfile, id); assert.equal(reg[0].boss, true);
  assert.ok(BOSS_PROFILES[id] && BOSS_PROFILES[id].maxHpFallback === data.maxHp, `${id}: boss bar profile`);
  assert.ok(victoryFor(id), `${id}: victory card lines`);
  assert.ok(bossIntroFor(id), `${id}: intro card`);
  mgr.dispose();
}
assert.deepEqual(victoryProblems(), []);
assert.ok(isRaptorEnemy(new RaptorBoss({ id: 'r' })) && !isRaptorEnemy(new Subject88Boss({ id: 's' })));
assert.ok(isSubject88Enemy(new Subject88Boss({ id: 's' })) && !isSubject88Enemy(new RaptorBoss({ id: 'r' })));
assert.equal(BOSS_PROFILES[RAPTOR_ID].rageThreshold, 0.5);

// Raptor's registered state reports his lift, ground attacks pass under him, and an airborne attacker (Zed jumping) still catches him.
{
  const ev = fakeEmitter(), out = [];
  ev.on(EVENTS.DAMAGE_APPLIED, (p) => out.push(p));
  createHitResolver(ev, () => 0);
  const mgr = new EnemyManager({ events: ev, getXRange: () => ({ min: 0, max: 1280 }) });
  const zed = { x: 500, y: 520, lane: 520, facing: 1, lift: 0 };
  ev.emit(EVENTS.ENTITY_REGISTERED, { id: 'player', team: 'player', maxHp: 100, hurtbox: { x: -10, y: -80, w: 20, h: 80 }, getState: () => zed });
  const r = mgr.spawn({ id: 'r1', x: 540, y: 520, enemy: RAPTOR_ID, hpMult: 1 });
  r.lift = 100;
  let n = 0;
  const swing = () => ev.emit(EVENTS.HIT_REQUEST, { attackerId: 'player', attackId: `p:${++n}`, team: 'player', hitbox: { x: 0, y: -90, w: 120, h: 90 },
    origin: { x: 500, y: 520 }, lane: 520, facing: 1, damage: 10, knockback: 100, hitstun: 100 });
  swing(); assert.equal(out.length, 0, 'ground swing passes under an airborne Raptor');
  zed.lift = 60; swing(); assert.equal(out.length, 1, 'airborne swing catches him');
  r.lift = 0; zed.lift = 0; swing(); assert.equal(out.length, 2, 'grounded Raptor is hit normally');
  mgr.dispose();
}
console.log('raptor / subject 88 wiring ok');
