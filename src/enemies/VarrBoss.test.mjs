import assert from 'node:assert/strict';
import { fakeEmitter } from '../shared/fakeEmitter.mjs';
import { EVENTS } from '../shared/events.js';
import { createHitResolver } from '../combat/hitResolver.js';
import { EnemyManager } from './EnemyManager.js';
import { VarrBoss, VarrState } from './VarrBoss.js';
import { VARR, VARR_MOVES, VARR_ID, VARR_P2_RESTORE, pickVarrMove, counterStance } from './varrData.js';
import { BOSS_PROFILES } from '../ui/bossBarData.js';
import { victoryFor } from '../ui/victoryData.js';

const rdy = (o = {}) => Object.fromEntries(Object.keys(VARR_MOVES).map((k) => [k, true])) && ({ ...Object.fromEntries(Object.keys(VARR_MOVES).map((k) => [k, true])), ...o });
const ctx = (o) => ({ phase: 1, dist: 80, dy: 0, lift: 0, ready: rdy(), lastId: null, stance: null, collapseDone: false, summonsAlive: 2, ...o });

// --- data: canon moves and telegraphs
assert.equal(VARR_MOVES.strike.name, 'Authority Strike'); assert.equal(VARR_MOVES.strike.telegraphMs, VARR_MOVES.strike.telegraphMs);
assert.equal(VARR_MOVES.strike.hits[0].damage, 18); assert.equal(VARR_MOVES.strike.hits[0].knockback, 380);
assert.deepEqual(['strike', 'shield', 'override'].map((k) => VARR_MOVES[k].phase), [1, 1, 1], 'phase 1 moves');
assert.ok(['slam', 'taser', 'combo', 'control', 'drones', 'collapse'].every((k) => VARR_MOVES[k].phase === 2), 'phase 2 has its own move set');
assert.equal(new Set(Object.values(VARR_MOVES).filter((m) => m.phase === 2).map((m) => m.id)).size, 6);
assert.ok(VARR_MOVES.collapse.telegraphMs >= 1200, 'the super is readable');

// --- move picker
assert.equal(pickVarrMove(ctx({ summonsAlive: 0, dist: 300 }), () => 0).id, 'override', 'phase 1: calls crew when none are out');
assert.equal(pickVarrMove(ctx({ dist: 80, ready: rdy({ override: false, shield: false }) }), () => 0.9).id, 'strike', 'in reach: Authority Strike');
assert.equal(pickVarrMove(ctx({ dist: 150, stance: 'anti-rush' }), () => 0.9).id, 'shield', 'anti-rush stance: shield up');
assert.equal(pickVarrMove(ctx({ dist: 600, ready: rdy({ override: false }) }), () => 0), null, 'too far: keep walking');
assert.equal(pickVarrMove(ctx({ phase: 2, collapseDue: true }), () => 0).id, 'collapse', 'phase 2: Collapse when due');
assert.ok(['slam', 'combo', 'control', 'taser', 'drones'].includes(pickVarrMove(ctx({ phase: 2, dist: 100 }), () => 0).id), 'phase 2 uses the hybrid set');
assert.ok(pickVarrMove(ctx({ phase: 2, dist: 100 }), () => 0.5).phase === 2, 'never a phase-1 move in phase 2');
assert.equal(counterStance({ jumps: 3, rushes: 0, comboHits: 0 }), 'anti-air');
assert.equal(counterStance({ jumps: 0, rushes: 2, comboHits: 0 }), 'anti-rush');
assert.equal(counterStance({ jumps: 0, rushes: 0, comboHits: 4 }), 'anti-combo');
assert.equal(counterStance({ jumps: 1, rushes: 0, comboHits: 0 }), null);

// --- state machine helpers
function make(over = {}) {
  const hits = [], shots = [], crew = [], restores = [], phases = [], walls = [];
  const b = new VarrBoss({
    id: 'v', x: 900, y: 520, maxHp: 1000, getXRange: () => ({ min: 0, max: 1280 }), rng: () => 0.5,
    hooks: { onHitRequest: (q) => hits.push(q), onProjectileRequest: (s) => shots.push(s), onSummon: (k) => crew.push(k), onRestoreHp: (s) => restores.push(s), onPhaseChange: (p) => phases.push(p), onWalls: (w) => walls.push(w) },
    ...over,
  });
  b.target = { x: 800, y: 520, lift: 0 }; b.state = 'approach'; b.cooldownMs = 0; b.facing = -1;
  return { b, hits, shots, crew, restores, phases, walls };
}
function play(b, moveId, extra = 200) {
  const m = VARR_MOVES[moveId];
  b._beginTelegraph(m);
  for (let t = 0; t < m.telegraphMs + m.attackMs + m.recoverMs + extra; t += 10) b.update(10, b.target);
}

// --- phase 1 moves
{ const { b, hits } = make(); play(b, 'strike'); assert.equal(hits.length, 1); assert.equal(hits[0].damage, 18); assert.equal(b.state, 'approach'); }
{ const { b, crew } = make(); play(b, 'override'); assert.equal(crew.length, 1, 'Command Override calls one crew member'); }
{ const { b, crew } = make(); b.crewAdded('a'); b.crewAdded('b'); play(b, 'override'); assert.equal(crew.length, 0, 'crew cap holds'); }
{ const { b } = make(); b._beginTelegraph(VARR_MOVES.shield); assert.equal(b.shieldUp, false, 'not up during the wind-up');
  for (let t = 0; t < 300; t += 10) b.update(10, b.target); assert.equal(b.state, 'attack'); assert.equal(b.shieldUp, true, 'shield is up');
  b.takeHit({ shield: true, shieldDmg: 20 }); assert.equal(b.shieldUp, true, 'a few blows do not break it');
  b.takeHit({ shield: true, shieldDmg: 100 }); assert.equal(b.shieldUp, false); assert.equal(b.state, 'hitstun', 'broken shield staggers him'); assert.equal(b.shieldBreakSeq, 1); }

// --- Adaptive Counter reads Zed
{ const { b } = make(); for (let i = 0; i < 4; i++) { b.target = { x: 800, y: 520, lift: 40 }; b.update(10, b.target); b.target = { x: 800, y: 520, lift: 0 }; b.update(10, b.target); }
  assert.equal(b.stance, 'anti-air', 'jumping too often: anti-air stance'); }
{ const { b } = make(); for (let i = 0; i < 5; i++) { b.takeHit({ hpAfter: b.hp - 5 }); b.update(100, b.target); }
  assert.equal(b.stance, 'anti-combo', 'long strings: anti-combo stance'); }

// --- phase change: floor, transform, HP restored, then phase 2
{ const { b, restores, phases } = make();
  assert.equal(b.hpFloor, 300, 'phase-1 damage is floored at 30 %');
  b.takeHit({ hpAfter: 700 }); assert.equal(b.phase, 1); assert.equal(b.state, 'approach');
  b.takeHit({ hpAfter: 300 });
  assert.equal(b.state, 'transform', 'reaching 30 % starts the transformation'); assert.equal(b.invulnerable, true, 'cannot be hurt during it');
  assert.equal(b.phase, 1, 'still phase 1 until it ends');
  b.takeHit({ hpAfter: 100, knockback: 400 }); assert.equal(b.hp, 300, 'blows during the transformation do nothing');
  for (let t = 0; t < VARR.restoreAtMs - 10; t += 10) b.update(10, b.target); assert.equal(restores.length, 0, 'not restored yet');
  for (let t = 0; t < 40; t += 10) b.update(10, b.target); assert.deepEqual(restores, [VARR_P2_RESTORE], 'HP restored mid-transformation');
  assert.equal(b.hp, Math.ceil(1000 * VARR_P2_RESTORE), 'his own HP is restored too');
  for (let t = 0; t < VARR.transformMs; t += 10) b.update(10, b.target);
  assert.equal(b.phase, 2); assert.deepEqual(phases, [2]); assert.notEqual(b.state, 'transform'); assert.equal(b.invulnerable, false); assert.equal(b.hpFloor, null, 'phase 2 can be killed');
  assert.equal(b.cd.shield > 1e6 && b.cd.override > 1e6, true, 'no shield and no summons in phase 2');
  const r = b._ready(); assert.equal(r.strike, false, 'Authority Strike is a phase-1 move'); assert.equal(r.drones, false, 'drones on a first cooldown'); }

// --- phase 2 moves
{ const { b } = make(); b.phase = 2; const { shots } = { shots: [] };
  const sh = []; b.hooks.onProjectileRequest = (s) => sh.push(s); play(b, 'drones'); assert.ok(sh.length >= 12, 'Drone Command: laser patterns in four beats'); assert.equal(b.droneSeq, 4); }
{ const { b, hits } = make(); b.phase = 2; play(b, 'combo'); assert.equal(hits.length, 3, 'gauntlet combo is three hits'); }
{ const { b, shots } = make(); b.phase = 2; play(b, 'taser'); assert.equal(shots.length, 1); }
{ const { b, hits, walls } = make(); b.phase = 2; b.target = { x: 600, y: 520, lift: 0 };
  play(b, 'collapse'); assert.equal(hits.length, 1, 'Rust Collapse: one huge hit'); assert.equal(hits[0].damage, 40); assert.equal(hits[0].lane, null, 'it ignores depth: jump it');
  assert.equal(b.relentless, true, 'afterwards he is relentless'); assert.deepEqual(walls, [true], 'the walls electrify'); assert.ok(b.speed > VARR.moveSpeed * VARR.p2.speedMult);
  b.target = { x: 20, y: 520, lift: 0 }; hits.length = 0; for (let t = 0; t < 2000; t += 10) b.update(10, b.target);
  assert.ok(hits.some((h) => h.attackId.includes(':wall:')), 'an electrified wall zaps Zed standing against it'); }
{ const { b } = make(); b.phase = 2; b.hp = 400; b.cd.collapse = 0; b.cd.drones = 0; b.cd.combo = 0; b.cd.slam = 0;
  b.update(10, b.target); for (let t = 0; t < 20; t += 10) b.update(10, b.target); assert.equal(b.move?.id, 'collapse', 'below half of the restored bar he uses Rust Collapse'); }

// --- parry and death
{ const { b } = make(); b._beginTelegraph(VARR_MOVES.strike); b.takeHit({ parry: true, hitstun: 100 }); assert.equal(b.state, 'hitstun'); }
{ const { b, walls } = make(); b._startRelentless(); b.die(); assert.equal(b.alive, false); assert.deepEqual(walls, [true, false], 'walls shut off when he falls'); }

// --- integration: combat floor, shield and restore through the real resolver and manager
{
  const events = fakeEmitter(); let t = 1000;
  const resolver = createHitResolver(events, () => t);
  const mgr = new EnemyManager({ events, rng: () => 0.5 });
  events.emit(EVENTS.ENTITY_REGISTERED, { id: 'zed', team: 'player', maxHp: 500, hurtbox: { x: -20, y: -80, w: 40, h: 80 }, getState: () => ({ x: 400, y: 520, lane: 520, facing: 1 }) });
  const v = mgr.spawn({ id: 'varr', x: 700, y: 520, enemy: VARR_ID, hpMult: 2 });
  assert.ok(v instanceof VarrBoss); assert.equal(v.maxHp, 640);
  const hitVarr = (dmg, fromX, id, facing = 1) => events.emit(EVENTS.HIT_REQUEST, { attackerId: 'zed', attackId: id, team: 'player', hitbox: { x: 0, y: -90, w: 400, h: 100 }, origin: { x: fromX, y: 520 }, lane: 520, facing, damage: dmg, knockback: 100, hitstun: 100 });
  v.facing = -1;
  // a huge blow cannot skip the phase change: floor 192
  hitVarr(5000, 400, 'a1');
  assert.equal(resolver.getHealth('varr').hp, 192, 'combat stops his hp at the 30 % floor');
  assert.equal(v.state, 'transform', 'and the floor starts the transformation');
  hitVarr(50, 400, 'a2'); assert.equal(resolver.getHealth('varr').hp, 192, 'untouchable while he transforms');
  for (let i = 0; i < 400; i++) mgr.update(10, { x: 400, y: 520 });
  assert.equal(v.phase, 2); assert.equal(resolver.getHealth('varr').hp, 640, 'combat HP restored for phase 2');
  hitVarr(5000, 400, 'a3'); assert.equal(resolver.getHealth('varr').dead, true, 'phase 2 can be killed');
  // shield negates frontal blows, flank hurts
  const v2 = mgr.spawn({ id: 'varr2', x: 700, y: 520, enemy: VARR_ID, hpMult: 2 });
  v2.facing = -1; v2.state = 'attack'; v2.move = VARR_MOVES.shield; v2.shieldHp = 80;
  hitVarr(10, 400, 'b1'); assert.equal(resolver.getHealth('varr2').hp, 640, 'frontal blow negated by the Command Shield'); assert.equal(v2.shieldHp, 70, 'and the shield wears down');
  hitVarr(10, 1000, 'b2', -1); assert.equal(resolver.getHealth('varr2').hp, 630, 'a flank blow goes through');
  resolver.destroy(); mgr.dispose();
}

// --- UI wiring
assert.ok(BOSS_PROFILES[VARR_ID], 'boss bar profile'); assert.ok(victoryFor(VARR_ID), 'victory card line');

console.log('VarrBoss ok');
