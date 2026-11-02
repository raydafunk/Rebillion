import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import {
  DUGAN_ANIMS, duganAssets, duganAnimDefs, duganPose, duganMoveMs, duganFitScale, duganDeathTimeScale,
  duganAnimKey, duganRotationKey, duganFrameKey, ALL_DIRS,
} from './duganSprites.js';
import { DUGAN_MOVES } from './duganData.js';
import { BrickDugan, DuganState } from './BrickDugan.js';

// every image the scene will load exists on disk
const assets = duganAssets();
const missing = [];
await Promise.all(assets.map(async (a) => { try { await access(new URL(`../../${a.path}`, import.meta.url)); } catch { missing.push(a.path); } }));
assert.deepEqual(missing, [], 'all Dugan sprite paths exist');
assert.equal(new Set(assets.map((a) => a.key)).size, assets.length, 'unique texture keys');
assert.equal(new Set(assets.map((a) => a.path)).size, assets.length, 'no frame loaded twice');

// one clip per move, every direction a pose can ask for is registered
const defs = new Map(duganAnimDefs().map((d) => [d.key, d]));
for (const m of Object.values(DUGAN_MOVES)) for (const side of ['east', 'west']) assert.ok(defs.has(duganAnimKey(m.id, side)), `${m.id} ${side} clip`);
for (const d of ALL_DIRS) { assert.ok(defs.has(duganAnimKey('walk', d))); assert.ok(defs.has(duganAnimKey('idle', 'east'))); }
assert.equal(defs.get(duganAnimKey('walk', 'east')).repeat, -1, 'walk loops');
assert.equal(defs.get(duganAnimKey('punch', 'east')).repeat, 0, 'punch plays once');
assert.equal(defs.get(duganAnimKey('death', 'west')).frames.length, 6, 'death stops on the flat frame, not the legs-up rebound');
assert.ok(duganAnimDefs().every((d) => d.frames.every((k) => assets.some((a) => a.key === k))), 'every frame key is loaded');

// fitting: the punch clip spans wind-up + strike
assert.equal(duganMoveMs(DUGAN_MOVES.punch), 650 + 350);
assert.equal(duganMoveMs(DUGAN_MOVES.charge), 800 + 1200, 'charge clip is the wind-up plus a stretch of running');
assert.equal(duganMoveMs(DUGAN_MOVES.stomp), 700 + 150 + 250, 'stomp clip ends just after the slam');
assert.ok(Math.abs(duganFitScale('punch', 1000) - (9 * 1000 / 30) / 1000) < 1e-9);
assert.ok(duganDeathTimeScale() > 0);

// pose per state
const d = new BrickDugan({ id: 'dugan-1', x: 400, y: 580, rng: () => 0.9, getXRange: () => ({ min: 40, max: 1240 }) });
const zed = { x: 470, y: 580, lift: 0 };
assert.equal(duganPose(d).anim, duganAnimKey('idle', 'west'), 'idle faces his facing');
d.state = DuganState.APPROACH; d.vx = 50; d.vy = 0; d.facing = 1;
assert.deepEqual([duganPose(d).anim, duganPose(d).walk], [duganAnimKey('walk', 'east'), true], 'walking follows the movement direction');
d.vx = 0; assert.equal(duganPose(d).anim, duganAnimKey('idle', 'east'), 'planted: idle');
d.cooldownMs = 0; d.update(16, zed);
assert.equal(d.state, DuganState.TELEGRAPH);
let p = duganPose(d);
assert.equal(p.anim, duganAnimKey('punch', 'east')); assert.equal(p.move, true); assert.equal(p.totalMs, 1000); assert.equal(p.seq, d.moveSeq);
const firstSeq = d.moveSeq;
d.state = DuganState.APPROACH; d.cooldownMs = 0; d.stompCdMs = 0; d.lastMoveId = 'punch'; d.move = null; d.update(16, { ...zed, lift: 50 });
p = duganPose(d); assert.equal(p.anim, duganAnimKey('stomp', 'east'), 'airborne Zed draws the stomp clip'); assert.equal(p.totalMs, 1100);
assert.ok(d.moveSeq > firstSeq, 'a new move restarts the clip');
d.state = DuganState.RECOVER; d.crashed = true; assert.equal(duganPose(d).anim, duganAnimKey('recoil', 'east'));
d.crashed = false; assert.equal(duganPose(d).anim, duganAnimKey('idle', 'east'));
d.state = DuganState.HITSTUN; p = duganPose(d); assert.deepEqual([p.anim, p.hit, p.frames], [duganAnimKey('hit', 'east'), true, 6]);
d.state = DuganState.DEAD; d.facing = -1; p = duganPose(d); assert.deepEqual([p.anim, p.death], [duganAnimKey('death', 'west'), true]);
assert.equal(p.rotation, duganRotationKey('west'));
{ // the charge caught Zed: the grab clip, ending on the slam
  const c = new BrickDugan({ id: 'dugan-2', x: 400, y: 580, rng: () => 0.9, getXRange: () => ({ min: 40, max: 1240 }), hooks: { onGrab: () => true } });
  c.facing = 1; c.cooldownMs = 0; c.chargeCdMs = 0; c.state = DuganState.APPROACH; c.update(16, { x: 700, y: 580, lift: 0 });
  for (let i = 0; i < 200 && !c.grab; i++) c.update(16, { x: 700, y: 580, lift: 0 });
  const hm = c.grab.params.holdMs;
  c.grab.holdLeft = hm; assert.equal(duganPose(c).still, duganFrameKey('lift', 'east', 3), 'start of the hold: the lift begins');
  c.grab.holdLeft = hm * 0.7; assert.equal(duganPose(c).still, duganFrameKey('lift', 'east', 4), 'early hold: lifting');
  c.grab.holdLeft = hm * 0.5; assert.equal(duganPose(c).still, duganFrameKey('lift', 'east', 6), 'mid hold: lifting');
  c.grab.holdLeft = hm * 0.1; assert.equal(duganPose(c).still, duganFrameKey('lift', 'east', 7), 'late hold: the peak, held until the slam');
  c.grab.holdLeft = 0; assert.equal(duganPose(c).still, duganFrameKey('lift', 'east', 7), 'never past the peak frame');
  c.grab.phase = 'slam'; c.grab.lingerLeft = c.grab.params.slamLingerMs; assert.equal(duganPose(c).still, duganFrameKey('grab', 'east', 5), 'start of the slam');
  c.grab.lingerLeft = 0; assert.equal(duganPose(c).still, duganFrameKey('grab', 'east', 8), 'end of the slam: bent over');
}
for (const name of ['punch', 'stomp', 'charge', 'grab', 'rage', 'lift']) assert.ok(DUGAN_ANIMS[name]);

console.log('Dugan sprite tests passed');
