// Run: node --test src/player/test/grab.test.mjs
// Controller tests are pure; the Zed tests use a tiny fake Phaser scene (no browser).
import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { GrabController } from '../grab.js';
import { GRAB_CONFIG as C } from '../grabConfig.js';
import { PlayerStateMachine } from '../stateMachine.js';
import { EVENTS } from '../../shared/events.js';
import { COMBAT_DEFAULTS } from '../../shared/combatData.js';
import { createHitResolver } from '../../combat/hitResolver.js';

const REQ = { attackerId: 'dugan-1', holdMs: 1200, slamDamage: 25, slamKnockback: 500, slamDir: 1 };
const mk = () => { const log = []; const g = new GrabController(C, (n, p) => log.push(n)); return { g, log }; };

test('held: start locks, cannot regrab, no tap outside held', () => {
  const { g, log } = mk();
  assert.equal(g.tap(), false);
  assert.equal(g.start(REQ), true);
  assert.equal(g.held, true); assert.equal(g.invulnerable, true);
  assert.equal(g.start(REQ), false);
  assert.deepEqual(log, ['held']);
});

test('break: enough taps break early, then lock + 250 ms total invulnerability', () => {
  const { g, log } = mk(); g.start(REQ);
  for (let i = 0; i < C.breakTaps - 1; i++) assert.equal(g.tap(), false);
  assert.ok(g.progress > 0.8 && g.progress < 1);
  assert.equal(g.tap(), true);
  assert.equal(g.state, 'broken'); assert.equal(g.slam(), false);
  g.update(C.breakLockMs); assert.equal(g.state, 'none');
  assert.equal(g.invulnerable, true); assert.equal(g.canGrab(), false);
  g.update(C.breakInvulnMs - C.breakLockMs); assert.equal(g.invulnerable, false); assert.equal(g.canGrab(), true);
  assert.deepEqual(log, ['held', 'broken', 'recovered']);
});

test('slam: hold timeout slams, 700 ms down, get-up, then free', () => {
  const { g, log } = mk(); g.start(REQ);
  g.update(REQ.holdMs - 1); assert.equal(g.held, true);
  g.update(1); assert.equal(g.state, 'slammed'); assert.equal(g.invulnerable, true);
  g.update(C.slamDownMs - 1); assert.equal(g.state, 'slammed');
  g.update(1); assert.equal(g.state, 'getup');
  g.update(C.getupMs); assert.equal(g.state, 'none'); assert.equal(g.invulnerable, false);
  assert.deepEqual(log, ['held', 'slam', 'getup', 'recovered']);
});

test('slam now: explicit slam ends the hold early; taps after the slam do nothing', () => {
  const { g } = mk(); g.start(REQ);
  assert.equal(g.slam(), true); assert.equal(g.tap(99), false); assert.equal(g.slam(), false);
});

test('release: only while held, brief invulnerability, no slam', () => {
  const { g, log } = mk();
  assert.equal(g.release('died'), false);
  g.start(REQ);
  assert.equal(g.release('stunned'), true);
  assert.equal(g.state, 'none'); assert.equal(g.invulnerable, true);
  g.update(C.releaseInvulnMs); assert.equal(g.invulnerable, false);
  g.update(5000); assert.deepEqual(log, ['held', 'released']);
});

test('machine lock: step is inert until unlock; no moves start', () => {
  const m = new PlayerStateMachine();
  m.lock('held');
  for (let i = 0; i < 10; i++) m.step({ pressed: { light: true }, held: {}, moveX: 1 });
  assert.equal(m.state, 'held'); assert.equal(m.guardType, null);
  m.unlock(); assert.equal(m.state, 'idle');
});

// ---- Zed with a fake scene ----
async function mkZed() {
  globalThis.Phaser = { Math: { Between: () => 0, FloatBetween: () => 0 } };
  const { Zed } = await import('../Zed.js');
  const body = { velocity: { x: 0, y: 0 }, blocked: { down: true }, touching: {}, gravity: true,
    setGravityY() {}, setAllowGravity(v) { this.gravity = v; }, setVelocity(x, y) { this.velocity = { x, y }; },
    setVelocityX(x) { this.velocity.x = x; }, setVelocityY(y) { this.velocity.y = y; } };
  const sprite = { x: 100, y: 300, body, setCollideWorldBounds() {}, setPosition(x, y) { this.x = x; this.y = y; return this; },
    setVelocity(x, y) { body.setVelocity(x, y); return this; }, setFlipX() {}, setTint() {}, clearTint() { return this; }, destroy() {} };
  const events = new EventEmitter();
  const scene = { game: { events }, textures: { exists: () => true }, cache: { audio: { exists: () => false } },
    physics: { add: { sprite: () => sprite }, world: { bounds: { bottom: 336 } } },
    input: { keyboard: { on() {}, off() {}, addCapture() {}, removeCapture() {} } },
    events: { on() {}, off() {} }, time: { delayedCall() {} }, sound: { play() {} } };
  // A resolver with the real rules (created first so it sees Zed register); the player has 100 hp.
  let t = 0;
  const resolver = createHitResolver(events, () => t);
  const zed = new Zed(scene, 100, 300);
  zed.laneY = zed.floorY;
  const advance = (ms) => { t += ms; zed.update(t, ms); };
  return { zed, events, resolver, advance, sprite, body };
}
const anchor = { x: 200, y: 280, facing: -1 }; // Dugan to the right of Zed, facing left
const grabReq = (extra = {}) => ({ ...REQ, targetId: 'player', anchor: () => anchor, ...extra });
const tapKey = (zed, code) => { zed.tapped.add(code); };

test('Zed: held pins at the hand offset facing Dugan, ignores moves, other hits do nothing', async () => {
  const { zed, events, resolver, advance, sprite } = await mkZed();
  const results = []; events.on(EVENTS.GRAB_RESULT, (r) => results.push(r));
  events.emit(EVENTS.GRAB, grabReq());
  assert.deepEqual(results, [{ attackerId: 'dugan-1', targetId: 'player', accepted: true }]);
  assert.equal(zed.state, 'held');
  zed.down.add('ArrowLeft'); advance(16);
  assert.equal(sprite.x, anchor.x + anchor.facing * C.handOffset.x);
  assert.equal(zed.facing, 1); // toward Dugan
  // an ordinary enemy hit is ignored (lift reads as airborne to combat)
  const hp0 = resolver.getHealth('player').hp;
  events.emit(EVENTS.HIT_REQUEST, { attackerId: 'grunt-1', attackId: 'g:1', team: 'rust', hitbox: { x: -50, y: -50, w: 100, h: 100 },
    origin: { x: sprite.x, y: sprite.y }, lane: zed.laneY, facing: 1, damage: 10, knockback: 100, hitstun: 100 });
  assert.equal(resolver.getHealth('player').hp, hp0);
  assert.equal(zed.state, 'held');
  // cannot be grabbed again
  events.emit(EVENTS.GRAB, grabReq());
  assert.equal(results[1].accepted, false);
});

test('Zed: jump taps do not count toward breaking a hold (only light J and heavy K)', async () => {
  const { zed, advance } = await mkZed();
  zed.startGrab(grabReq());
  for (let i = 0; i < C.breakTaps * 2; i++) { tapKey(zed, 'Space'); advance(16); }
  assert.equal(zed.state, 'held'); assert.equal(zed.grab.progress, 0);
  tapKey(zed, 'KeyK'); advance(16); assert.ok(zed.grab.progress > 0, 'a heavy tap counts');
});

test('Zed: mashing breaks the hold, emits grab-broken, lands in front of Dugan, no damage', async () => {
  const { zed, events, resolver, advance, sprite, body } = await mkZed();
  const out = []; events.on(EVENTS.GRAB_BROKEN, (e) => out.push(e)); events.on(EVENTS.PLAYER_SLAMMED, () => out.push('slammed'));
  zed.startGrab(grabReq());
  const hp0 = resolver.getHealth('player').hp;
  for (let i = 0; i < C.breakTaps; i++) { tapKey(zed, i % 2 ? 'KeyK' : 'KeyJ'); advance(16); }
  assert.deepEqual(out, [{ attackerId: 'dugan-1' }]);
  assert.equal(sprite.x, anchor.x - C.breakDropDx);
  assert.equal(body.gravity, true);
  advance(C.breakLockMs + 16); assert.equal(zed.state, 'idle');
  assert.equal(zed._hitLift(), COMBAT_DEFAULTS.AIR_DODGE_LIFT); // still invulnerable for the rest of 250 ms
  advance(C.breakInvulnMs); assert.equal(zed.grab.invulnerable, false);
  assert.equal(resolver.getHealth('player').hp, hp0);
});

test('Zed: slam goes through damage-applied, throws toward the wall, knockdown then get-up', async () => {
  const { zed, events, resolver, advance, body } = await mkZed();
  const log = []; events.on(EVENTS.PLAYER_SLAMMED, (e) => log.push(['slammed', e.damage, e.slamDir]));
  events.on(EVENTS.DAMAGE_APPLIED, (d) => log.push(['damage', d.amount, Math.sign(d.knockback)]));
  zed.rage.reset(2);
  zed.startGrab(grabReq({ slamDir: -1 }));
  advance(16);
  events.emit(EVENTS.GRAB_SLAM, { attackerId: 'dugan-1' });
  assert.deepEqual(log, [['damage', 25, -1], ['slammed', 25, -1]]);
  assert.equal(resolver.getHealth('player').hp, 75);
  assert.equal(zed.state, 'slammed'); assert.ok(body.velocity.x < 0);
  advance(C.slamDownMs - 20); assert.equal(zed.state, 'slammed');
  advance(40); assert.equal(zed.state, 'getup');
  advance(C.getupMs + 16); assert.equal(zed.state, 'idle');
  assert.equal(zed.rage.state, 'BUILDING'); // rage meter untouched by the grab itself
});

test('Zed: hold timeout slams by itself; down Zed ignores further hits', async () => {
  const { zed, events, resolver, advance, sprite } = await mkZed();
  zed.startGrab(grabReq());
  for (let t = 0; t < REQ.holdMs + 32; t += 16) advance(16);
  assert.equal(zed.state, 'slammed');
  const hp = resolver.getHealth('player').hp;
  events.emit(EVENTS.HIT_REQUEST, { attackerId: 'grunt-1', attackId: 'g:2', team: 'rust', hitbox: { x: -50, y: -50, w: 100, h: 100 },
    origin: { x: sprite.x, y: sprite.y }, lane: zed.laneY, facing: 1, damage: 10, knockback: 100, hitstun: 100 });
  assert.equal(resolver.getHealth('player').hp, hp);
});

test('Zed: release (event or Dugan death) frees safely, no slam damage', async () => {
  for (const mode of ['release', 'died']) {
    const { zed, events, resolver, advance, body } = await mkZed();
    zed.startGrab(grabReq());
    advance(16);
    if (mode === 'release') events.emit(EVENTS.GRAB_RELEASE, { attackerId: 'dugan-1', reason: 'stunned' });
    else events.emit(EVENTS.ENTITY_DIED, { id: 'dugan-1', team: 'rust' });
    assert.equal(zed.state, 'idle'); assert.equal(body.gravity, true);
    assert.equal(resolver.getHealth('player').hp, 100);
    for (let t = 0; t < 2000; t += 16) advance(16);
    assert.equal(resolver.getHealth('player').hp, 100);
  }
});

test('Zed: the slam never kills him, even with huge damage', async () => {
  const { zed, events, advance } = await mkZed();
  zed.startGrab(grabReq({ slamDamage: 500 }));
  events.emit(EVENTS.GRAB_SLAM, { attackerId: 'dugan-1' });
  assert.equal(zed.dead, false);
  advance(16);
});

test('Zed: the slam knockdown does not end an active Rage', async () => {
  const { zed, events } = await mkZed();
  zed.rage.reset(2); while (zed.rage.state === 'BUILDING') zed.rage.onBlowLanded();
  zed.rage.pressSpecial(true); zed.machine.rage = true;
  assert.equal(zed.rage.state, 'ACTIVE');
  zed.startGrab(grabReq());
  events.emit(EVENTS.GRAB_SLAM, { attackerId: 'dugan-1' });
  assert.equal(zed.rage.state, 'ACTIVE'); assert.equal(zed.machine.rage, true);
});
