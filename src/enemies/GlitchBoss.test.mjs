import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fakeEmitter } from '../shared/fakeEmitter.mjs';
import { EVENTS } from '../shared/events.js';
import { EnemyManager } from './EnemyManager.js';
import { GlitchBoss } from './GlitchBoss.js';
import { GLITCH, GLITCH_MOVES, GLITCH_ID, pickGlitchMove } from './glitchData.js';
import { glitchAssets, glitchAnimDefs, glitchPose, glitchAnimKey, glitchRotationKey, glitchFitScale, glitchMoveMs } from './glitchSprites.js';
import { KANE } from './kaneData.js';
import { ROYCE } from './royceData.js';
import { BOSS_PROFILES } from '../ui/bossBarData.js';
import { victoryFor } from '../ui/victoryData.js';

const rdy = (o = {}) => ({ disk: true, drones: true, decoy: true, spike: true, teleport: true, ...o });
const ctx = (o) => ({ dist: 400, dy: 0, lift: 0, ready: rdy({ teleport: false }), lastId: null, forceTeleport: false, ...o });

// --- data: tougher than every other mini-boss, canon telegraphs
assert.ok(GLITCH.maxHp > ROYCE.maxHp && GLITCH.maxHp >= 300, 'Glitch is tougher than Royce (Kane was later raised to 400)');
assert.ok(GLITCH.moveSpeed > ROYCE.moveSpeed, 'faster than the other mini-bosses');
const order = ['drones', 'decoy', 'disk', 'spike', 'teleport'];
assert.deepEqual(order.map((k) => GLITCH_MOVES[k].telegraphMs), [700, 500, 550, 600, 400], 'telegraphs match mini-bosses.json');
assert.deepEqual(order.map((k) => GLITCH_MOVES[k].name), ['Drone Barrage', 'Hologram Duplicate', 'Shock Disk Throw', 'Data Spike', 'Emergency Teleport']);

// --- move picker
assert.equal(pickGlitchMove(ctx({ dist: 90, ready: rdy() }), () => 0.5).id, 'teleport', 'Zed got close: Emergency Teleport');
assert.equal(pickGlitchMove(ctx({ dist: 90 }), () => 0.5).id, 'spike', 'Zed close, no teleport: Data Spike');
assert.equal(pickGlitchMove(ctx({ dist: 400, forceTeleport: true, ready: rdy() }), () => 0.5).id, 'teleport', 'health threshold forces the teleport');
assert.equal(pickGlitchMove(ctx({ dist: 400, ready: rdy({ drones: false, decoy: false, spike: false, teleport: false }) }), () => 0).id, 'disk', 'in line at range: Shock Disk Throw');
assert.equal(pickGlitchMove(ctx({ dist: 400, dy: 90, ready: rdy({ drones: false, decoy: false, spike: false, teleport: false }) }), () => 0), null, 'out of lane: no disk');
assert.equal(pickGlitchMove(ctx({ dist: 400, ready: rdy({ disk: false, decoy: false, spike: false, teleport: false }) }), () => 0).id, 'drones');
assert.equal(pickGlitchMove(ctx({ dist: 400, ready: rdy({ disk: false, drones: false, spike: false, teleport: false }) }), () => 0).id, 'decoy');
assert.equal(pickGlitchMove(ctx({ dist: 400, lastId: 'disk', ready: rdy({ drones: false, decoy: false, spike: false, teleport: false }) }), () => 0), null, 'never the same move twice');
assert.equal(pickGlitchMove(ctx({ dist: 400, ready: { disk: false, drones: false, decoy: false, spike: false, teleport: false } }), () => 0), null, 'all on cooldown');

// --- state machine
function make(over = {}) {
  const hits = [], shots = [];
  const b = new GlitchBoss({ id: 'g', x: 900, y: 520, hooks: { onHitRequest: (q) => hits.push(q), onProjectileRequest: (s) => shots.push(s) }, getXRange: () => ({ min: 0, max: 1280 }), rng: () => 0.5, ...over });
  b.target = { x: 400, y: 520, lift: 0 }; b.state = 'approach'; b.cooldownMs = 0; b.facing = -1;
  return { b, hits, shots };
}
function play(b, moveId) {
  b._beginTelegraph(GLITCH_MOVES[moveId]);
  const m = GLITCH_MOVES[moveId];
  for (let t = 0; t < m.telegraphMs + m.attackMs + m.recoverMs + 200; t += 10) b.update(10, b.target);
}
{ const { b, shots, hits } = make(); play(b, 'disk'); assert.equal(shots.length, 1, 'disk: one projectile'); assert.equal(hits.length, 0); assert.equal(shots[0].spec.damage, GLITCH_MOVES.disk.shot.damage); assert.equal(b.state, 'approach'); }
{ const { b, shots } = make(); play(b, 'drones'); assert.equal(shots.length, 3, 'drones: three in the volley');
  assert.equal(new Set(shots.map((s) => s.lane)).size, 3, 'each drone flies its own lane'); }
{ const { b, hits } = make(); play(b, 'spike'); assert.equal(hits.length, 1, 'spike: one ground hit'); assert.equal(hits[0].damage, 14); }
{ const { b, hits } = make(); b.target = { x: 700, y: 520, lift: 0 }; b._beginTelegraph(GLITCH_MOVES.decoy);
  assert.equal(b.decoys.length, 1, 'a decoy appears with the wind-up'); assert.equal(b.decoys[0].state, 'warn');
  for (let t = 0; t < 2600; t += 10) b.update(10, b.target);
  assert.equal(hits.length, 1, 'the decoy throws one weak punch'); assert.ok(hits[0].damage < 10);
  assert.ok(Math.abs(hits[0].origin.x - b.x) > 50, 'the punch comes from the decoy, not from Glitch'); assert.equal(b.decoys.length, 0, 'it fades away'); }
{ const { b } = make(); const from = b.x; play(b, 'teleport'); assert.ok(b.x < 400 || b.x > 880, 'teleports to the far side of Zed'); assert.notEqual(b.x, from); assert.equal(b.teleportSeq, 1); }

// --- health thresholds: overclock + forced teleports
{ const { b } = make(); const slow = b.speed;
  b.takeHit({ knockback: 100, hpAfter: b.maxHp * 0.6 }); assert.equal(b.phase2, false); assert.equal(b.forceTeleport, false);
  b.takeHit({ knockback: 100, hpAfter: b.maxHp * 0.49 }); assert.equal(b.phase2, true, 'overclock at half health'); assert.equal(b.forceTeleport, true, 'and he blinks away');
  assert.ok(b.speed > slow, 'overclocked he is faster');
  b.update(1, b.target); assert.equal(b.state, 'telegraph'); assert.equal(b.move.id, 'teleport');
  b.state = 'approach'; b.cooldownMs = 0; b.takeHit({ hpAfter: b.maxHp * 0.2 }); assert.equal(b.forceTeleport, true, 'second threshold at 25 %'); }
{ const { b, shots } = make(); b.phase2 = true; play(b, 'drones'); assert.ok(shots.length >= 5, 'overclocked drone volley is bigger'); }
{ const { b, shots } = make(); b.phase2 = true; play(b, 'disk'); assert.equal(shots.length, 2, 'overclocked disk comes in twice'); }
{ const { b, hits } = make(); b.phase2 = true; play(b, 'spike'); assert.equal(hits.length, 2, 'overclocked spike runs further'); }
{ const { b } = make(); b.phase2 = true; b.target = { x: 700, y: 520, lift: 0 }; b._beginTelegraph(GLITCH_MOVES.decoy); assert.equal(b.decoys.length, 2, 'overclocked: a decoy each side'); }

// --- keeps his distance
{ const { b } = make(); b.x = 500; b.cooldownMs = 5000; const x0 = b.x; for (let i = 0; i < 20; i++) b.update(16, { x: 400, y: 520, lift: 0 }); assert.ok(b.x > x0, 'Zed too close: he backs away'); }

// --- ordinary hits do not stun him; a parry does
{ const { b } = make(); b.takeHit({ hitstun: 300, knockback: 200, hpAfter: b.maxHp - 10 }); assert.notEqual(b.state, 'hitstun'); b._beginTelegraph(GLITCH_MOVES.spike); b.takeHit({ hitstun: 300, parry: true }); assert.equal(b.state, 'hitstun'); }
{ const { b } = make(); b.die(); assert.equal(b.state, 'dead'); }

// --- wiring: EnemyManager spawns him as a registered boss
{
  const ev = fakeEmitter(), reg = [];
  ev.on(EVENTS.ENTITY_REGISTERED, (p) => reg.push(p));
  const mgr = new EnemyManager({ events: ev, getXRange: () => ({ min: 0, max: 1280 }) });
  const g = mgr.spawn({ id: 'e1', x: 900, y: 520, enemy: GLITCH_ID, hpMult: 1 });
  assert.ok(g instanceof GlitchBoss); assert.equal(g.maxHp, GLITCH.maxHp);
  assert.equal(reg[0].bossProfile, GLITCH_ID); assert.equal(reg[0].boss, true);
  g.hooks.onProjectileRequest({ ownerId: 'e1', x: 900, y: 520, lane: 520, facing: -1, spec: GLITCH_MOVES.disk.shot, damage: 11, knockback: 1, hitstun: 1 });
  assert.equal(mgr.bolts.length, 1, 'disks fly as bolts');
  mgr.dispose();
}
assert.ok(BOSS_PROFILES[GLITCH_ID] && BOSS_PROFILES[GLITCH_ID].maxHpFallback === GLITCH.maxHp, 'boss bar profile');
assert.ok(victoryFor(GLITCH_ID), 'victory card lines');

// --- sprites: every clip resolves on disk and every move has one
const missing = glitchAssets().filter((a) => !fs.existsSync(a.path));
assert.deepEqual(missing, [], 'all Glitch art paths resolve');
const keys = new Set(glitchAnimDefs().map((d) => d.key));
const base = { facing: 1, vx: 0, vy: 0 };
for (const id of Object.keys(GLITCH_MOVES)) {
  const p = glitchPose({ ...base, state: 'telegraph', move: GLITCH_MOVES[id], moveSeq: 2 });
  assert.ok(p.move && keys.has(p.anim) && p.totalMs === glitchMoveMs(GLITCH_MOVES[id]), `${id}: clip registered and fitted`);
  assert.ok(glitchFitScale(p.clip, p.totalMs) > 0);
}
assert.ok(keys.has(glitchAnimKey('punch', 'east')) && keys.has(glitchAnimKey('punch', 'west')), 'the decoy uppercut clip is registered');
assert.ok(glitchPose({ ...base, state: 'hitstun' }).hit && keys.has(glitchPose({ ...base, state: 'hitstun' }).anim));
assert.ok(glitchPose({ ...base, state: 'dead' }).death && keys.has(glitchPose({ ...base, state: 'dead', facing: -1 }).anim));
assert.equal(glitchPose({ ...base, state: 'idle' }).anim, glitchAnimKey('idle', 'east'));
assert.equal(glitchPose({ ...base, state: 'approach', vx: -50, facing: 1 }).anim, glitchAnimKey('walk', 'east'), 'backing away he still faces Zed');
assert.ok(keys.has(glitchPose({ ...base, state: 'approach', vy: 50 }).anim));
assert.ok(keys.has(glitchPose({ ...base, state: 'approach', vx: 50, vy: 50 }).anim));
assert.equal(glitchPose({ ...base, state: 'idle' }).rotation, glitchRotationKey('east'));
console.log('GlitchBoss ok');
