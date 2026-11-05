import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GRUNT, ATTACK_VARIANTS } from './gruntData.js';
import {
  specialistPose, specialistIdlePath, specialistWalkFramePath, specialistWalkDir, specialistWalkAnimKey, SPECIALIST_WALK_DIRS, SPECIALIST_WALK_FRAMES, specialistStrikePath, specialistWindupPath, specialistWindupKey, specialistHitFramePath, specialistDeathFramePath,
  SPECIALIST_DIRS, SPECIALIST_HIT_DIRS, SPECIALIST_HIT_FRAMES, SPECIALIST_DEATH_FRAMES, isSpecialist,
  specialistStrikeKey, specialistHitAnimKey,
  SPECIALIST_TASER_FRAMES, SPECIALIST_TASER_FPS, SPECIALIST_TASER_DIRS, specialistTaserDir, specialistTaserFramePath, specialistTaserFrameKey, specialistTaserAnimKey, isTaserAttack,
  SPECIALIST_BATON_FRAMES, SPECIALIST_BATON_FPS, SPECIALIST_BATON_DIRS, specialistBatonDir, specialistBatonFramePath, specialistBatonFrameKey, specialistBatonAnimKey, specialistDeathAnimKey,
} from './specialistData.js';

assert.ok(isSpecialist('rust-specialist') && !isSpecialist('rust-ranger') && !isSpecialist('grunt'));
// Every file the loader asks for exists on disk.
for (const d of SPECIALIST_DIRS) for (const p of [specialistIdlePath(d), specialistStrikePath(d), specialistWindupPath(d)]) assert.ok(fs.existsSync(p), p);
for (const d of SPECIALIST_WALK_DIRS) for (let i = 0; i < SPECIALIST_WALK_FRAMES; i++) assert.ok(fs.existsSync(specialistWalkFramePath(d, i)), specialistWalkFramePath(d, i));
for (const d of SPECIALIST_HIT_DIRS) for (let i = 0; i < SPECIALIST_HIT_FRAMES; i++) assert.ok(fs.existsSync(specialistHitFramePath(d, i)), specialistHitFramePath(d, i));
for (const d of ['east', 'west']) for (let i = 0; i < SPECIALIST_DEATH_FRAMES; i++) assert.ok(fs.existsSync(specialistDeathFramePath(d, i)), specialistDeathFramePath(d, i));
// Poses
const w = specialistPose({ state: 'approach', vx: 5, vy: 0, facing: 1 });
assert.ok(w.walk && w.anim === specialistWalkAnimKey('east') && !w.bob && !w.rotation);
assert.equal(specialistPose({ state: 'approach', vx: 0, vy: -5, facing: 1 }).anim, specialistWalkAnimKey('north'));
assert.equal(specialistPose({ state: 'approach', vx: 0, vy: 5, facing: 1 }).anim, specialistWalkAnimKey('south'));
assert.deepEqual(['north-east', 'south-east', 'east', 'north-west', 'south-west', 'west', 'north', 'south'].map(specialistWalkDir), ['east', 'east', 'east', 'west', 'west', 'west', 'north', 'south']);
assert.ok(specialistPose({ state: 'approach', vx: -5, vy: 0, facing: -1 }).walk);
assert.equal(specialistPose({ state: 'attack', facing: -1 }).rotation, specialistStrikeKey('west')); // fallback pose when the baton frames are missing
const hit = specialistPose({ state: 'hitstun', facing: -1 });
assert.ok(hit.hit && hit.flipX && hit.anim === specialistHitAnimKey('east'));
assert.equal(specialistPose({ state: 'hitstun', facing: 1 }).flipX, false);
const dead = specialistPose({ state: 'dead', facing: -1 });
assert.ok(dead.death && dead.anim === specialistDeathAnimKey('west') && dead.deathTimeScale > 0);
assert.equal(specialistPose({ state: 'telegraph', facing: 1 }).rotation, specialistWindupKey('east'));
assert.ok(specialistStrikePath('east').includes('Taser_Shot'));
assert.ok(!specialistPose({ state: 'telegraph', vx: 9, vy: 0, facing: 1 }).walk);
// Baton Strike animation
assert.equal(SPECIALIST_BATON_FRAMES, 9);
assert.deepEqual([...SPECIALIST_BATON_DIRS], ['east', 'north', 'west']);
for (const d of SPECIALIST_BATON_DIRS) for (let i = 0; i < SPECIALIST_BATON_FRAMES; i++) assert.ok(fs.existsSync(specialistBatonFramePath(d, i)), specialistBatonFramePath(d, i));
assert.deepEqual(['north-east', 'south-east', 'east', 'north-west', 'south-west', 'west', 'north', 'south'].map(specialistBatonDir), ['east', 'east', 'east', 'west', 'west', 'west', 'north', 'east']);
assert.ok(SPECIALIST_BATON_DIRS.every((d) => specialistBatonDir(d) === d));
assert.equal(specialistBatonFrameKey('east', 3), 'rust.copper-fang.baton.east.3');
// Total play time fits the grunt's attack state: matches the plain string (GRUNT.attackMs) to within a frame, and never outlasts any variant (the finisher flurry runs longer; the last frame holds).
const batonMs = SPECIALIST_BATON_FRAMES * 1000 / SPECIALIST_BATON_FPS;
assert.ok(Math.abs(batonMs - GRUNT.attackMs) <= 1000 / SPECIALIST_BATON_FPS, `${GRUNT.attackMs} vs ${batonMs}`);
for (const v of ATTACK_VARIANTS) assert.ok(batonMs <= v.attackMs, `${v.id}: ${v.attackMs} vs ${batonMs}`);
const atk = specialistPose({ state: 'attack', facing: -1 });
assert.ok(atk.strike && atk.once && atk.anim === specialistBatonAnimKey('west') && atk.frames === 9 && atk.dir === 'west');
assert.equal(specialistPose({ state: 'attack', facing: 1 }).anim, specialistBatonAnimKey('east'));
// Taser Shot animation (heavy finisher attacks)
assert.equal(SPECIALIST_TASER_FRAMES, 9);
assert.deepEqual([...SPECIALIST_TASER_DIRS], ['east', 'north', 'south', 'west']);
for (const d of SPECIALIST_TASER_DIRS) for (let i = 0; i < SPECIALIST_TASER_FRAMES; i++) assert.ok(fs.existsSync(specialistTaserFramePath(d, i)), specialistTaserFramePath(d, i));
assert.deepEqual(['north-east', 'south-east', 'east', 'north-west', 'south-west', 'west', 'north', 'south'].map(specialistTaserDir), ['east', 'east', 'east', 'west', 'west', 'west', 'north', 'south']);
assert.equal(specialistTaserFrameKey('west', 2), 'rust.copper-fang.taser.west.2');
const taserMs = SPECIALIST_TASER_FRAMES * 1000 / SPECIALIST_TASER_FPS;
for (const v of ATTACK_VARIANTS) assert.ok(taserMs <= v.attackMs, `${v.id}: ${v.attackMs} vs ${taserMs}`);
const byId = (id) => ATTACK_VARIANTS.find((v) => v.id === id);
assert.deepEqual(ATTACK_VARIANTS.filter((v) => isTaserAttack({ variant: v })).map((v) => v.id), ['finisher', 'hold-finisher']);
const tz = specialistPose({ state: 'attack', facing: -1, variant: byId('finisher') });
assert.ok(tz.strike && tz.once && tz.anim === specialistTaserAnimKey('west') && tz.frames === 9 && tz.dir === 'west');
assert.equal(specialistPose({ state: 'attack', facing: 1, variant: byId('hold-finisher') }).anim, specialistTaserAnimKey('east'));
assert.equal(specialistPose({ state: 'attack', facing: 1, variant: byId('string') }).anim, specialistBatonAnimKey('east')); // light strings keep the baton
assert.equal(specialistPose({ state: 'attack', facing: 1 }).anim, specialistBatonAnimKey('east')); // no variant: baton
console.log('specialistData ok');
