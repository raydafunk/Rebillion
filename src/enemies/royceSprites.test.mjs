import assert from 'node:assert/strict';
import fs from 'node:fs';
import { royceAssets, royceAnimDefs, roycePose, royceAnimKey, royceRotationKey, ROYCE_ANIMS } from './royceSprites.js';

// every file the scene will load exists on disk
const missing = royceAssets().filter((a) => !fs.existsSync(a.path));
assert.deepEqual(missing, [], 'all Royce art paths resolve');
assert.ok(royceAnimDefs().length === 27, 'anims registered');
assert.ok(royceAssets().some((a) => a.key.includes('.dash.')) && royceAssets().some((a) => a.key.includes('.trap.')), 'every canon move is loaded');

const base = { facing: 1, vx: 0, vy: 0, moveSeq: 3, blockSeq: 0 };
assert.equal(roycePose({ ...base, state: 'idle' }).anim, royceAnimKey('idle', 'east'));
assert.equal(roycePose({ ...base, state: 'idle', facing: -1 }).anim, royceAnimKey('idle', 'west'));
assert.equal(roycePose({ ...base, state: 'approach', vx: -50 }).anim, royceAnimKey('walk', 'west'));
assert.ok(roycePose({ ...base, state: 'approach', vx: -50, vy: -50 }).anim.includes('.walk.'), 'diagonal walk falls back to an existing clip');
assert.ok(roycePose({ ...base, state: 'hitstun' }).hit);
assert.ok(roycePose({ ...base, state: 'dead' }).death);
assert.equal(roycePose({ ...base, state: 'recover' }).anim, royceAnimKey('idle', 'east'));
console.log('royceSprites ok');
