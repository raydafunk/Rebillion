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
