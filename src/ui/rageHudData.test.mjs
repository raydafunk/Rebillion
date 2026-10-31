import assert from 'node:assert/strict';
import { fillColor, pulseHz, rageVisual, slideOffset, barPoints, shouldShowIntro, RAGE_LAYOUT, RAGE_PALETTE } from './rageHudData.js';

assert.equal(fillColor(0), RAGE_PALETTE.ember);
assert.equal(fillColor(1), RAGE_PALETTE.redWhite);
assert.equal(fillColor(0.5), RAGE_PALETTE.orange);
assert.ok(pulseHz('BUILDING', 1) > pulseHz('BUILDING', 0.5) && pulseHz('BUILDING', 0.5) > pulseHz('BUILDING', 0));
assert.ok(pulseHz('READY', 1) > pulseHz('BUILDING', 1));

assert.equal(rageVisual(undefined).visible, false);
assert.equal(rageVisual({ visible: false, state: 'HIDDEN', value: 0, max: 100 }).visible, false);
const b = rageVisual({ visible: true, state: 'BUILDING', value: 50, max: 100 });
assert.equal(b.fillFrac, 0.5); assert.equal(b.icon, 'flame'); assert.equal(b.showPrompt, false);
const r = rageVisual({ visible: true, state: 'READY', value: 100, max: 100, readyTimeLeft: 2 });
assert.equal(r.showPrompt, true); assert.equal(r.windowFrac, 0.5); assert.equal(r.icon, 'burst'); assert.equal(r.label, 'READY!');
const a = rageVisual({ visible: true, state: 'ACTIVE', value: 55, max: 100, rageTimeLeft: 4.5 });
assert.equal(a.windowFrac, 0.5); assert.equal(a.countdownText, '5s'); assert.equal(a.icon, 'fist');
// each state has a distinct icon and label (not colour only)
assert.equal(new Set([b.icon, r.icon, a.icon]).size, 3);
assert.equal(new Set([b.label, r.label, a.label]).size, 3);

assert.equal(slideOffset(0), RAGE_LAYOUT.hiddenOffsetX); assert.equal(slideOffset(1), 0); assert.ok(slideOffset(0.5) > slideOffset(0));
const p = barPoints(0, 0, 100, 20, 10, 0.5);
assert.equal(p.length, 4); assert.equal(p[1].x, 60);
assert.equal(shouldShowIntro(1, false), false); assert.equal(shouldShowIntro(2, false), true); assert.equal(shouldShowIntro(2, true), false);
console.log('rageHudData ok');
