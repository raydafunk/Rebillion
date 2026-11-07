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
for (const id of ['rust-brick-dugan', 'rust-railgun-royce', 'rust-crusher-kane', 'rust-glitch', 'rust-halden-varr']) assert.ok(bossIntroFor(id), id);
import { BrickDugan, DuganState } from '../enemies/BrickDugan.js';
import { RoyceBoss, RoyceState } from '../enemies/RoyceBoss.js';
import { GlitchBoss, GlitchState } from '../enemies/GlitchBoss.js';
import { VarrBoss, VarrState } from '../enemies/VarrBoss.js';
for (const [C, S] of [[BrickDugan, DuganState], [RoyceBoss, RoyceState], [GlitchBoss, GlitchState], [VarrBoss, VarrState]]) {
  const b = new C({ id: 'b', x: 800, y: 500 });
  b.update(100000, null); b.update(300, target);
  b.holdIdle();
  for (let i = 0; i < 100; i++) b.update(100, target);
  assert.equal(b.state, S.IDLE, C.name); assert.equal(b.x, 800, C.name);
  b.releaseIdle(); b.update(16, target);
  assert.equal(b.state, S.APPROACH, C.name);
}
import { RustGrunt, GruntState } from '../enemies/RustGrunt.js';
{ const g = new RustGrunt({ id: 'g', x: 800, y: 500 });
  g.update(300, target); g.holdIdle();
  for (let i = 0; i < 100; i++) g.update(100, target);
  assert.equal(g.state, GruntState.IDLE); assert.equal(g.x, 800);
  g.releaseIdle(); g.update(16, target); assert.equal(g.state, GruntState.APPROACH); }
assert.ok(bossIntroFor('rust-raptor') && bossIntroFor('rust-holts-experiment-subject-88'));
console.log('bossIntroData ok');
