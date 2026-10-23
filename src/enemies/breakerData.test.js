import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  DIRECTIONS, BREAKER_FRAMES, directionFromVelocity, breakerPose, breakerFramePath, breakerRotationPath,
  breakerWalkAnimKey, breakerRotationKey, BREAKER_ATTACK_FRAMES, breakerAttackFramePath, breakerAttackAnimKey,
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

// every file the loader will request exists (tests run from the project root)
for (const d of DIRECTIONS) {
  assert.ok(fs.existsSync(breakerRotationPath(d)), breakerRotationPath(d));
  for (let i = 0; i < BREAKER_FRAMES; i++) assert.ok(fs.existsSync(breakerFramePath(d, i)), breakerFramePath(d, i));
  for (let i = 0; i < BREAKER_ATTACK_FRAMES; i++) assert.ok(fs.existsSync(breakerAttackFramePath(d, i)), breakerAttackFramePath(d, i));
}
