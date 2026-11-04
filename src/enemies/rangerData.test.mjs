import assert from 'node:assert/strict';
import {
  rangerPose, rangerWalkDir, rangerWalkAnimKey, rangerFallState, RANGER_FALL_MS, RANGER_FALL_FRAMES, RANGER_FALL_BOTTOM, RANGER_BOUNCE_MS, RANGER_WALK_FOLDER,
} from './rangerData.js';
import { deathViewPhase } from './breakerData.js';

// Walking uses the real walk cycle, not idle breathing; the five directions without art map onto east / north / west.
assert.ok(RANGER_WALK_FOLDER.includes('walking'));
assert.equal(rangerWalkDir('south-east'), 'east');
assert.equal(rangerWalkDir('north-west'), 'west');
assert.equal(rangerWalkDir('south', 'west'), 'west');
assert.equal(rangerPose({ vx: 0, vy: -9, facing: 1, state: 'approach' }).anim, rangerWalkAnimKey('north'));

// Death: lands flat, never hovers, frame 4 on the ground, mirrored for a west-facing Ranger.
assert.equal(rangerFallState(0).lift, 0);
assert.ok(rangerFallState(RANGER_FALL_MS / 2).lift > 5);
const landed = rangerFallState(RANGER_FALL_MS);
assert.equal(landed.frame, RANGER_FALL_FRAMES - 1);
assert.equal(landed.lift, 0);
assert.equal(landed.bottom, RANGER_FALL_BOTTOM[RANGER_FALL_FRAMES - 1]);
assert.equal(rangerFallState(RANGER_FALL_MS + RANGER_BOUNCE_MS + 1).lift, 0);
assert.equal(rangerFallState(5000).frame, RANGER_FALL_FRAMES - 1);
assert.equal(rangerFallState(100, 'west').flipX, true);
assert.equal(rangerFallState(100, 'east').flipX, false);
assert.ok(RANGER_FALL_MS + RANGER_BOUNCE_MS < 700 || deathViewPhase(RANGER_FALL_MS + RANGER_BOUNCE_MS).phase !== 'done');
const dead = rangerPose({ state: 'dead', facing: -1 });
assert.ok(dead.death && dead.rangerFall && dead.flipX === true);
console.log('rangerData ok');
