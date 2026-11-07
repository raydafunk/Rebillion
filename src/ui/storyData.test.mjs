import assert from 'node:assert/strict';
import { STORY, storyIsValid } from './storyData.js';

assert.ok(STORY.title.trim().length > 0);
assert.ok(STORY.lines.length >= 3);
assert.ok(STORY.lines.every((l) => typeof l === 'string' && l.trim().length > 0));
assert.ok(STORY.autoMs > 0);
assert.ok(storyIsValid());
assert.ok(!storyIsValid({ title: 'x', lines: ['Rust father', ' '], autoMs: 1 }));
assert.ok(!storyIsValid({ title: 'x', lines: ['no beats here'], autoMs: 1 }));
console.log('storyData ok');

import { STORY_SCENES, storyAssets, storySceneProblems } from './storyData.js';
import { existsSync } from 'node:fs';
assert.deepEqual(storySceneProblems(), []);
assert.deepEqual(STORY_SCENES.map((s) => s.id), ['home', 'angry', 'run']);
assert.deepEqual(STORY_SCENES[2].beats.map((b) => b.text), STORY.lines); // the four lines play on the run card
assert.equal(storyAssets().length, 27);
for (const a of storyAssets()) assert.ok(existsSync(a.path), `missing sprite ${a.path}`);
assert.ok(storySceneProblems([{ id: 'x', bg: 'nope', beats: [], art: null }]).length >= 3);
console.log('story scenes ok');
