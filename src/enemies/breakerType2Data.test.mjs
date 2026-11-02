import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  BREAKER2_SKIN, BREAKER2_DIRS, BREAKER2_WALK_FRAMES, BREAKER2_ATTACK_FRAMES, BREAKER2_HIT_FRAMES, BREAKER2_HIT_DIRS, BREAKER2_DEATH_FRAMES,
  isBreaker2, breaker2Pose, breaker2RotationKey, breaker2WalkAnimKey, breaker2AttackAnimKey, breaker2HitAnimKey, breaker2DeathAnimKey,
  breaker2RotationPath, breaker2WalkFramePath, breaker2AttackFramePath, breaker2HitFramePath, breaker2DeathFramePath, breaker2DeathTimeScale,
} from './breakerType2Data.js';

assert.ok(isBreaker2(BREAKER2_SKIN) && !isBreaker2('rust-breaker') && !isBreaker2(null));
assert.equal(breaker2Pose({ vx: 50, vy: 0, facing: 1, state: 'approach' }).anim, breaker2WalkAnimKey('east'));
assert.equal(breaker2Pose({ vx: 0, vy: 0, facing: -1, state: 'idle' }).rotation, breaker2RotationKey('west'));
assert.equal(breaker2Pose({ vx: 0, vy: 0, facing: -1, state: 'attack' }).anim, breaker2AttackAnimKey('west'));
const hitW = breaker2Pose({ vx: 0, vy: 0, facing: -1, state: 'hitstun' });
assert.equal(hitW.anim, breaker2HitAnimKey('east'));
assert.ok(hitW.flipX && hitW.hit, 'west hit mirrors the east frames');
assert.ok(!breaker2Pose({ vx: 0, vy: 0, facing: 1, state: 'hitstun' }).flipX);
const dead = breaker2Pose({ vx: 0, vy: 0, facing: 1, state: 'dead' });
assert.equal(dead.anim, breaker2DeathAnimKey('east'));
assert.ok(dead.death && dead.once);
assert.ok(Math.abs(breaker2DeathTimeScale() - 300 / 700) < 1e-9);

// every file the loader will request exists (tests run from the project root)
for (const d of BREAKER2_DIRS) {
  assert.ok(fs.existsSync(breaker2RotationPath(d)), breaker2RotationPath(d));
  for (let i = 0; i < BREAKER2_WALK_FRAMES; i++) assert.ok(fs.existsSync(breaker2WalkFramePath(d, i)), breaker2WalkFramePath(d, i));
  for (let i = 0; i < BREAKER2_ATTACK_FRAMES; i++) assert.ok(fs.existsSync(breaker2AttackFramePath(d, i)), breaker2AttackFramePath(d, i));
  for (let i = 0; i < BREAKER2_DEATH_FRAMES; i++) assert.ok(fs.existsSync(breaker2DeathFramePath(d, i)), breaker2DeathFramePath(d, i));
}
for (const d of BREAKER2_HIT_DIRS) for (let i = 0; i < BREAKER2_HIT_FRAMES; i++) assert.ok(fs.existsSync(breaker2HitFramePath(d, i)), breaker2HitFramePath(d, i));
console.log('breakerType2Data ok');
