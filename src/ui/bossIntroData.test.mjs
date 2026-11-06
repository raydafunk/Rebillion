import assert from 'node:assert/strict';
import { BOSS_INTROS, bossIntroFor, bossIntroProblems, introPortraitAssets, introTriggered } from './bossIntroData.js';
import { KANE_ID, } from '../enemies/kaneData.js';
import { KaneBoss, KaneState } from '../enemies/KaneBoss.js';

assert.deepEqual(bossIntroProblems(), []);
assert.ok(bossIntroFor(KANE_ID).beats.length >= 2);
assert.equal(bossIntroFor('nobody'), null);
assert.ok(bossIntroProblems({ x: { beats: [{ side: 'x', text: 'a' }], portraits: {} } }).length > 0);
assert.equal(introPortraitAssets([KANE_ID]).length, 2);
assert.ok(introTriggered({ bossX: 900, zedX: 200, viewLeft: 0, viewRight: 1280 }));
assert.ok(!introTriggered({ bossX: 1900, zedX: 200, viewLeft: 0, viewRight: 1280 }));

// Kane stands in idle through the hold, then approaches once released.
const k = new KaneBoss({ id: 'k', x: 800, y: 500 });
const target = { x: 200, y: 500 };
k.update(300, target); assert.equal(k.state, KaneState.APPROACH);
k.holdIdle();
for (let i = 0; i < 100; i++) k.update(100, target);
assert.equal(k.state, KaneState.IDLE);
assert.equal(k.x, 800);
k.releaseIdle(); k.update(16, target);
assert.equal(k.state, KaneState.APPROACH);
console.log('bossIntroData ok');
