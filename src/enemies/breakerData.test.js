import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  DIRECTIONS, BREAKER_FRAMES, directionFromVelocity, breakerPose, breakerFramePath, breakerRotationPath,
  breakerWalkAnimKey, breakerRotationKey, BREAKER_ATTACK_FRAMES, breakerAttackFramePath, breakerAttackAnimKey,
  BREAKER_HIT_FRAMES, BREAKER_HIT_DIRS, breakerHitFramePath, breakerHitAnimKey,
  BREAKER_DEATH_FRAMES, BREAKER_DEATH_DIRS, BREAKER_DEATH_MS, BREAKER_DEATH_HOLD_MS, BREAKER_DEATH_FADE_MS,
  breakerDeathFramePath, breakerDeathFrameKey, breakerDeathAnimKey, breakerDeathTimeScale, deathViewPhase,
} from './breakerData.js';

assert.equal(directionFromVelocity(5, 0), 'east');
assert.equal(directionFromVelocity(-5, 0), 'west');
assert.equal(directionFromVelocity(0, 5), 'south');
assert.equal(directionFromVelocity(0, -5), 'north');
assert.equal(directionFromVelocity(5, 5), 'south-east');
assert.equal(directionFromVelocity(-5, -5), 'north-west');
assert.equal(directionFromVelocity(-5, 5), 'south-west');
assert.equal(directionFromVelocity(5, -5), 'north-east');
assert.equal(directionFromVelocity(0, 0), null);

assert.deepEqual(breakerPose({ vx: 0, vy: 0, facing: -1, state: 'idle' }), { rotation: breakerRotationKey('west'), dir: 'west' });
assert.equal(breakerPose({ vx: 50, vy: 0, facing: 1, state: 'approach' }).anim, breakerWalkAnimKey('east'));
assert.equal(breakerPose({ vx: 0, vy: 0, facing: 1, state: 'attack' }).anim, breakerAttackAnimKey('east'));
assert.equal(breakerPose({ vx: 0, vy: 0, facing: -1, state: 'attack' }).anim, breakerAttackAnimKey('west'));
assert.equal(breakerPose({ vx: 0, vy: 0, facing: 1, state: 'telegraph' }).rotation, breakerRotationKey('east'));

const hitW = breakerPose({ vx: 0, vy: 0, facing: -1, state: 'hitstun' });
assert.equal(hitW.anim, breakerHitAnimKey('west'));
assert.equal(hitW.rotation, breakerRotationKey('west')); // fallback pose if the anim is missing
assert.equal(breakerPose({ vx: 9, vy: 9, facing: 1, state: 'hitstun' }).anim, breakerHitAnimKey('east'));
for (const d of Object.keys(BREAKER_HIT_DIRS)) {
  for (let i = 0; i < BREAKER_HIT_FRAMES; i++) assert.ok(fs.existsSync(breakerHitFramePath(d, i)), breakerHitFramePath(d, i));
}

const deadW = breakerPose({ vx: 0, vy: 0, facing: -1, state: 'dead' });
assert.equal(deadW.anim, breakerDeathAnimKey('west'));
assert.ok(deadW.death && deadW.once);
assert.equal(breakerPose({ vx: 0, vy: 0, facing: 1, state: 'dead' }).anim, breakerDeathAnimKey('east'));
assert.equal(breakerDeathFrameKey('west', 3), 'rust.breaker.death.west.3');
assert.ok(breakerDeathFramePath('west', 0).endsWith('/west/frame_000.png'));
assert.ok(Math.abs(breakerDeathTimeScale() - 300 / BREAKER_DEATH_MS) < 1e-9);
assert.deepEqual(deathViewPhase(0), { phase: 'anim', alpha: 1 });
assert.equal(deathViewPhase(BREAKER_DEATH_MS).phase, 'hold');
assert.equal(deathViewPhase(BREAKER_DEATH_MS + BREAKER_DEATH_HOLD_MS).phase, 'fade');
assert.equal(deathViewPhase(BREAKER_DEATH_MS + BREAKER_DEATH_HOLD_MS + BREAKER_DEATH_FADE_MS / 2).alpha, 0.5);
assert.equal(deathViewPhase(BREAKER_DEATH_MS + BREAKER_DEATH_HOLD_MS + BREAKER_DEATH_FADE_MS).phase, 'done');
for (const d of Object.keys(BREAKER_DEATH_DIRS)) {
  for (let i = 0; i < BREAKER_DEATH_FRAMES; i++) assert.ok(fs.existsSync(breakerDeathFramePath(d, i)), breakerDeathFramePath(d, i));
}

// every file the loader will request exists (tests run from the project root)
for (const d of DIRECTIONS) {
  assert.ok(fs.existsSync(breakerRotationPath(d)), breakerRotationPath(d));
  for (let i = 0; i < BREAKER_FRAMES; i++) assert.ok(fs.existsSync(breakerFramePath(d, i)), breakerFramePath(d, i));
  for (let i = 0; i < BREAKER_ATTACK_FRAMES; i++) assert.ok(fs.existsSync(breakerAttackFramePath(d, i)), breakerAttackFramePath(d, i));
}
