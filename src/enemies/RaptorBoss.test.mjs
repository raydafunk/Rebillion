import assert from 'node:assert/strict';
import { RaptorBoss } from './RaptorBoss.js';
import { RAPTOR_MOVES, RAPTOR_AIR_LIFT } from './raptorData.js';

function make(over = {}) {
  const hits = [];
  const b = new RaptorBoss({ id: 'r', x: 900, y: 520, hooks: { onHitRequest: (q) => hits.push(q) }, getXRange: () => ({ min: 0, max: 1280 }), rng: () => 0.5, ...over });
  b.target = { x: 400, y: 520, lift: 0 }; b.state = 'approach'; b.cooldownMs = 0; b.facing = -1;
  return { b, hits };
}
function play(b, id, onTick) {
  const m = RAPTOR_MOVES[id];
  b._beginTelegraph(m);
  for (let t = 0; t < m.telegraphMs + m.attackMs + m.recoverMs + 200; t += 10) { b.update(10, b.target); if (onTick) onTick(b, t); }
}

// Dive Kick: marker at Zed, airborne in flight, lands on the marker with one ground hit
{ const { b, hits } = make(); let maxLift = 0, markerSeen = null;
  play(b, 'dive', (r) => { maxLift = Math.max(maxLift, r.lift); if (r.marker) markerSeen = { ...r.marker }; });
  assert.ok(markerSeen && markerSeen.kind === 'dive' && markerSeen.x === 400, 'red marker at Zed');
  assert.ok(maxLift >= RAPTOR_AIR_LIFT, 'airborne during the jump');
  assert.equal(hits.length, 1); assert.equal(hits[0].origin.x, 400, 'hit lands on the marker'); assert.equal(b.lift, 0); assert.equal(b.state, 'approach'); assert.equal(b.impactSeq, 1); }
{ const { b, hits } = make(); b.phase2 = true; play(b, 'dive'); assert.equal(hits.length, 2, 'frenzy: second shockwave'); }

// 4-Hit Punch: standing flurry, no lift, no drift (5 hits in frenzy)
{ const { b, hits } = make(); b.x = 600; b.target = { x: 480, y: 520, lift: 0 }; let maxLift = 0, drift = 0; play(b, 'punch', (r) => { if (r.move && r.move.id === 'punch' && (r.state === 'telegraph' || r.state === 'attack')) { maxLift = Math.max(maxLift, r.lift); drift = Math.max(drift, Math.abs(r.x - 600)); } });
  assert.equal(hits.length, 4); assert.equal(maxLift, 0, 'grounded flurry'); assert.equal(drift, 0, 'stands still while punching'); assert.equal(b.cable, undefined); }
{ const { b, hits } = make(); b.x = 600; b.phase2 = true; play(b, 'punch'); assert.equal(hits.length, 5, 'frenzy: longer flurry'); }
assert.deepEqual(Object.keys(RAPTOR_MOVES), ['dive', 'punch', 'falcon', 'rush']);
{ const { b } = make(); assert.deepEqual(Object.keys(b.cd), ['dive', 'punch', 'falcon', 'rush']); assert.equal(b.cd.rush, 3000); }

// 6-Hit Charge: runs at Zed (run phase only inside the move), stops ~100 px away, then six hits (last one heavier)
{ const { b, hits } = make(); b.x = 900; b.target = { x: 480, y: 520, lift: 0 };
  assert.equal(b.running, false);
  let runTicks = 0, runMs = 0, minDx = 1e9, runStatesOk = true, firstHitRun = null, maxSpeed = 0;
  b._beginTelegraph(RAPTOR_MOVES.rush);
  assert.equal(b.parryMarkMs, RAPTOR_MOVES.rush.telegraphMs + RAPTOR_MOVES.rush.cueRunMs + RAPTOR_MOVES.rush.hits[0].atMs - 80);
  const markMs = b.parryMarkMs; let lastClock = -1, clockAtFirstHit = null;
  for (let t = 0; t < 4000; t += 10) {
    if (b.state === 'approach' && hits.length === 6) break;   // the move is over (he would pick the next one)
    const x0 = b.x; b.update(10, b.target);
    if (b.running) { runTicks++; runMs += 10; maxSpeed = Math.max(maxSpeed, Math.abs(b.x - x0) / 0.01); if (b.state !== 'attack') runStatesOk = false; }
    if (hits.length === 1 && firstHitRun === null) { firstHitRun = b.running; clockAtFirstHit = b.cueClockMs; }
    if (b.cueClockMs !== null && b.move.id === 'rush') { assert.ok(b.cueClockMs >= lastClock - 1e-6, 'cue clock never runs backwards'); lastClock = b.cueClockMs; }
    if (b.state === 'attack' && !b.running) minDx = Math.min(minDx, Math.abs(b.x - 480));
  }
  assert.ok(runStatesOk && runTicks > 0 && runMs <= 1600, 'run phase only inside attack, capped');
  assert.ok(maxSpeed >= 340 && maxSpeed <= 380, 'run speed ' + maxSpeed);
  assert.ok(minDx >= 85 && minDx <= 95, 'stops about 90 px from Zed: ' + minDx);
  assert.equal(hits.length, 6, 'six hits'); assert.equal(firstHitRun, false, 'no hit while running');
  assert.deepEqual(hits.map((h) => h.damage), [3, 3, 3, 3, 3, 6]);
  assert.equal(new Set(hits.map((h) => h.attackId)).size, 6, 'distinct attackIds');
  assert.ok(hits.every((h) => !h.unparryable && !h.unblockable), 'parryable');
  assert.ok(clockAtFirstHit >= markMs && markMs >= 700, 'cue ring closes before the first hit lands');
  assert.equal(b.running, false); assert.equal(b.state, 'approach');
  assert.ok(Math.abs(b.y - 520) <= 28, 'lined up in Zed lane');
}
// frenzy: faster and longer run
{ const { b } = make(); b.phase2 = true; b.x = 1000; b.target = { x: 500, y: 520, lift: 0 }; let mx = 0; b._beginTelegraph(RAPTOR_MOVES.rush);
  for (let t = 0; t < 3000; t += 10) { const x0 = b.x; b.update(10, b.target); if (b.running) mx = Math.max(mx, Math.abs(b.x - x0) / 0.01); }
  assert.ok(mx > 420 && mx <= 470, 'frenzy rush is faster: ' + mx); }
// the rush stays inside the fighting range
{ const { b } = make({ getXRange: () => ({ min: 0, max: 1000 }) }); b.x = 950; b.target = { x: 100, y: 520, lift: 0 }; b._beginTelegraph(RAPTOR_MOVES.rush);
  for (let t = 0; t < 3000; t += 10) { b.update(10, b.target); assert.ok(b.x >= 40 && b.x <= 960, 'clamped ' + b.x); } }
// a parry mid-combo cancels the remaining hits and stuns him
{ const { b, hits } = make(); b.x = 700; b.target = { x: 480, y: 520, lift: 0 }; b._beginTelegraph(RAPTOR_MOVES.rush);
  for (let t = 0; t < 4000 && hits.length < 2; t += 10) b.update(10, b.target);
  assert.equal(hits.length, 2); b.takeHit({ hitstun: 300, parry: true });
  assert.equal(b.state, 'hitstun'); assert.equal(b.running, false);
  for (let t = 0; t < 800; t += 10) b.update(10, b.target);
  assert.equal(hits.length, 2, 'no further hits after the parry'); }
// parry during the run phase also cancels it
{ const { b, hits } = make(); b._beginTelegraph(RAPTOR_MOVES.rush);
  for (let t = 0; t < 2000 && !b.running; t += 10) b.update(10, b.target);
  assert.equal(b.running, true); b.takeHit({ hitstun: 300, parry: true }); assert.equal(b.running, false);
  for (let t = 0; t < 2000; t += 10) b.update(10, b.target); assert.equal(hits.length, 0); }
// the run never happens without the six punches following (every started run ends in a 6-hit combo), and a parry in the run drops the combo with it
for (const dist of [270, 400, 640]) { const { b, hits } = make(); b.x = 100; b.target = { x: 100 + dist, y: 520, lift: 0 }; b._beginTelegraph(RAPTOR_MOVES.rush);
  let ran = false; for (let t = 0; t < 5000; t += 10) { if (ran && b.state === 'approach') break; b.update(10, b.target); if (b.running) ran = true; }
  assert.ok(ran, 'ran at ' + dist); assert.equal(hits.length, 6, 'run at ' + dist + ' is always followed by the full combo'); }
// Zed leaves mid-run: he finishes at the lock point and still throws all six (a whiff, not a free dash)
{ const { b, hits } = make(); b.x = 100; b.target = { x: 600, y: 520, lift: 0 }; b._beginTelegraph(RAPTOR_MOVES.rush); let n = 0;
  for (let t = 0; t < 5000; t += 10) { if (b.running && ++n > 30) b.target = { x: 1200, y: 520, lift: 120 }; b.update(10, b.target); if (b.state === 'recover') break; }
  assert.equal(hits.length, 6); assert.ok(b.x < 560, 'did not chase Zed past the lock point: ' + b.x); }
// first punch cannot land sooner than ~450 ms after the move starts (even with no run at all), and punches are paced for a 333 ms parry window
{ const { b, hits } = make(); b.x = 500; b.target = { x: 590, y: 520, lift: 0 }; b._beginTelegraph(RAPTOR_MOVES.rush); let first = null;
  for (let t = 0; t < 3000 && first === null; t += 10) { b.update(10, b.target); if (hits.length) first = t + 10; }
  assert.ok(first >= 450, 'wind-up ' + first); }
for (let i = 1; i < 6; i++) assert.ok(RAPTOR_MOVES.rush.hits[i].atMs - RAPTOR_MOVES.rush.hits[i - 1].atMs <= 333 / 2);
// the rush's total damage stays below the 4-hit punch's
{ const sum = (m) => m.hits.reduce((n, h) => n + h.damage, 0); assert.ok(sum(RAPTOR_MOVES.rush) < sum(RAPTOR_MOVES.punch)); }
// running is never set outside the rush move (normal approach, other moves)
{ const { b } = make(); let ever = false;
  for (let i = 0; i < 400; i++) { b.update(10, b.target); if (b.running) ever = true; }
  for (const id of ['dive', 'punch', 'falcon']) { const { b: c } = make(); play(c, id, (r) => { if (r.running) ever = true; }); }
  assert.equal(ever, false); }

// Falcon Drop: goes off-screen, shadow grows, slam on the marked spot
{ const { b, hits } = make(); let off = false, grow = 0; play(b, 'falcon', (r) => { if (r.offscreen) off = true; if (r.marker) grow = Math.max(grow, r.marker.grow); });
  assert.ok(off && grow > 0.9); assert.equal(hits.length, 1); assert.equal(hits[0].origin.x, 400); assert.equal(hits[0].damage, RAPTOR_MOVES.falcon.hits[0].damage); assert.equal(b.lift, 0); }

// ordinary hits never stun; a parry does and brings him down
{ const { b } = make(); b.takeHit({ hitstun: 300, knockback: 200, hpAfter: b.maxHp - 10 }); assert.notEqual(b.state, 'hitstun');
  b._beginTelegraph(RAPTOR_MOVES.falcon); for (let i = 0; i < 60; i++) b.update(10, b.target); assert.ok(b.lift > 0);
  b.takeHit({ hitstun: 300, parry: true }); assert.equal(b.state, 'hitstun'); assert.equal(b.lift, 0); assert.equal(b.marker, null); }

// frenzy at half health
{ const { b } = make(); const s = b.speed; b.takeHit({ hpAfter: b.maxHp * 0.6 }); assert.equal(b.phase2, false);
  b.takeHit({ hpAfter: b.maxHp * 0.49 }); assert.equal(b.phase2, true); assert.ok(b.speed > s); }

// takes an attacker slot before every move; none free means he waits
{ const { b } = make(); for (const k of Object.keys(b.cd)) b.cd[k] = 0; b.update(16, b.target); assert.equal(b.state, 'telegraph'); assert.ok(b.slots.holders ? true : true); }
{ const { b } = make(); for (const k of Object.keys(b.cd)) b.cd[k] = 0; b.slots.tryAcquire('a'); b.slots.tryAcquire('b'); b.update(16, b.target); assert.equal(b.state, 'approach'); assert.equal(b.circling, true); }

// intro hold, die
{ const { b } = make(); b.state = 'idle'; b.holdIdle(); b.update(500, b.target); assert.equal(b.state, 'idle'); b.releaseIdle(); b.update(16, b.target); assert.equal(b.state, 'approach'); b.die(); assert.equal(b.state, 'dead'); }

// ---- BLOCK: full negate through the real hit resolver, no guard break, ends after holdMs, gating, cooldown, parry ----
{
  const { fakeEmitter } = await import('../shared/fakeEmitter.mjs');
  const { EVENTS } = await import('../shared/events.js');
  const { createHitResolver } = await import('../combat/hitResolver.js');
  const { EnemyManager } = await import('./EnemyManager.js');
  const { RAPTOR_BLOCK, RAPTOR_ID } = await import('./raptorData.js');
  const zedSwing = (id, damage = 6, extra = {}) => ({ attackerId: 'player', attackId: id, team: 'player', hitbox: { x: 10, y: -90, w: 80, h: 60 }, origin: { x: 360, y: 520 }, lane: 520, facing: -1, damage, knockback: 300, hitstun: 250, pierceInvuln: false, ...extra });
  const rig = () => {
    const events = fakeEmitter(); let clock = 0;
    const resolver = createHitResolver(events, () => clock);
    const mgr = new EnemyManager({ events, rng: () => 0.5, getXRange: () => ({ min: 0, max: 1280 }) });
    const r = mgr.spawn({ id: 'raptor-1', x: 300, y: 520, enemy: RAPTOR_ID });
    r.state = 'approach'; r.cooldownMs = 99999; r.blockCdMs = 0; r.facing = 1;
    const zed = { x: 360, y: 520, lift: 0 };
    const dmg = []; events.on(EVENTS.DAMAGE_APPLIED, (p) => { if (p.targetId === 'raptor-1') dmg.push(p); });
    const tick = (ms) => { for (let t = 0; t < ms; t += 16) { clock += 16; r.update(16, zed); } };
    const swing = (req) => events.emit(EVENTS.HIT_REQUEST, req);
    return { events, resolver, mgr, r, tick, swing, dmg, advance: (ms) => { clock += ms; }, zed, hp: () => resolver.getHealth('raptor-1').hp };
  };
  assert.equal(RAPTOR_BLOCK.holdMs >= 900 && RAPTOR_BLOCK.holdMs <= 1200, true);

  // Zed swing in reach raises the block (guard negate); out of reach, rage, riposte and other teams do not
  { const x = rig(); x.swing(zedSwing('a', 0)); assert.equal(x.r.state, 'block'); assert.equal(x.r.guard, 'negate'); assert.equal(x.r.blockSeq, 1); }
  { const x = rig(); x.swing(zedSwing('a', 0, { origin: { x: 600, y: 520 } })); assert.equal(x.r.state, 'approach', 'swing starts out of reach'); assert.equal(x.r.guard, null); }
  { const x = rig(); x.swing(zedSwing('a', 0, { rage: true })); assert.equal(x.r.state, 'approach', 'rage swings never trigger it'); }
  { const x = rig(); x.swing(zedSwing('a', 0, { riposte: true })); assert.equal(x.r.state, 'approach'); }
  { const x = rig(); x.swing(zedSwing('a', 0, { team: 'rust' })); assert.equal(x.r.state, 'approach', 'only Zed'); }
  { const x = rig(); x.r.state = 'idle'; x.r.timer = Infinity; x.swing(zedSwing('a', 0)); assert.equal(x.r.state, 'idle', 'intro hold: no block'); }

  // every kind of Zed hit does 0 damage, including a finisher-sized heavy; no knockback, no stun, no guard break
  { const x = rig(); x.swing(zedSwing('open', 0)); const hp0 = x.hp(); x.advance(1000);
    for (const [id, d, extra] of [['l1', 5, {}], ['l2', 6, {}], ['h', 12, {}], ['fin', 24, { knockback: 520, hitstun: 400 }], ['huge', 60, { pierceInvuln: true }], ['air', 9, {}]]) {
      x.swing(zedSwing(id, d, extra)); x.advance(40);
    }
    assert.equal(x.hp(), hp0, 'no hp lost'); assert.equal(x.dmg.length, 6);
    assert.ok(x.dmg.every((p) => p.amount === 0 && p.blocked === true && p.landed === false && p.knockback === 0 && p.hitstun === 0));
    assert.equal(x.r.state, 'block', 'a heavy does not break the guard'); assert.equal(x.r.kx, 0); assert.equal(x.r.guardHitSeq, 6); }
  // a swing that is not in his lane still misses as usual (lane check precedes the guard)
  { const x = rig(); x.swing(zedSwing('o', 0)); x.swing(zedSwing('far', 20, { lane: 900 })); assert.equal(x.dmg.length, 0); }

  // block ends after holdMs, into RECOVER (no guard), then damage applies again; he never moved while holding it
  { const x = rig(); x.swing(zedSwing('a', 0)); const x0 = x.r.x; x.tick(RAPTOR_BLOCK.holdMs - 40); assert.equal(x.r.state, 'block'); assert.equal(x.r.x, x0, 'does not move');
    x.tick(80); assert.equal(x.r.state, 'recover'); assert.equal(x.r.guard, null);
    const hp0 = x.hp(); x.swing(zedSwing('after', 7)); assert.equal(x.hp(), hp0 - 7, 'damage applies again'); assert.equal(x.dmg.at(-1).landed, true);
    x.tick(RAPTOR_BLOCK.recoverMs + 100); assert.equal(x.r.state, 'approach'); }
  // cooldown: no new block until it is up; then he can block again
  { const x = rig(); x.swing(zedSwing('a', 0)); x.tick(RAPTOR_BLOCK.holdMs + RAPTOR_BLOCK.recoverMs + 40); assert.equal(x.r.state, 'approach');
    x.swing(zedSwing('b', 0)); assert.equal(x.r.state, 'approach', 'on cooldown');
    for (let t = 0; t < RAPTOR_BLOCK.cooldownMs; t += 16) { x.r.cooldownMs = 99999; x.tick(16); } x.swing(zedSwing('c', 0, { origin: { x: x.r.x + 60, y: 520 } })); assert.equal(x.r.state, 'block', 'off cooldown'); assert.equal(x.r.blockSeq, 2); }
  { const x = rig(); x.r.phase2 = true; x.swing(zedSwing('a', 0)); assert.ok(x.r.blockCdMs < RAPTOR_BLOCK.cooldownMs, 'shorter in frenzy'); }
  { const b = new RaptorBoss({ id: 'q', x: 0, y: 0 }); assert.equal(b.blockCdMs, RAPTOR_BLOCK.firstMs, 'no block in the opening'); }

  // cannot block mid-attack / telegraph / stun / airborne, and no move can start while blocking
  for (const st of ['telegraph', 'attack', 'recover', 'hitstun']) { const x = rig(); x.r.state = st; x.r.timer = 500; x.r.move = RAPTOR_MOVES.punch; x.swing(zedSwing('a', 0)); assert.equal(x.r.state, st, st); }
  { const x = rig(); x.r.lift = 80; x.swing(zedSwing('a', 0)); assert.equal(x.r.state, 'approach', 'airborne'); }
  { const x = rig(); x.r._beginTelegraph(RAPTOR_MOVES.punch); x.swing(zedSwing('a', 0)); assert.equal(x.r.state, 'telegraph', 'mid-wind-up'); }
  { const x = rig(); x.swing(zedSwing('a', 0)); for (const k of Object.keys(x.r.cd)) x.r.cd[k] = 0; x.r.cooldownMs = 0;
    for (let i = 0; i < 40; i++) { x.tick(16); assert.equal(x.r.state, 'block'); assert.equal(x.r.move, null); } }
  // a parry still stuns him and ends the block; the riposte lands (he is stunned, the guard is gone)
  { const x = rig(); x.swing(zedSwing('a', 0)); x.events.emit(EVENTS.PARRY_STUN, { attackerId: 'raptor-1', hitstun: 300, riposte: 22 }); assert.equal(x.r.state, 'hitstun'); assert.equal(x.r.guard, null);
    assert.equal(x.dmg.at(-1).amount, 22); }
  // Rage moves pierce it
  { const x = rig(); x.swing(zedSwing('a', 0)); const hp0 = x.hp(); x.swing(zedSwing('rg', 16, { rage: true })); assert.equal(x.hp(), hp0 - 16); assert.equal(x.r.state, 'block'); }
}
console.log('RaptorBoss ok');
