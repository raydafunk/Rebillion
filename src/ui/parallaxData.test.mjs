import assert from 'node:assert/strict';
import { SCROLL_LAYERS, layerSpeed, scrollOffset } from './parallaxData.js';

assert.equal(SCROLL_LAYERS.length, 2);
assert.ok(SCROLL_LAYERS.every((l) => l.speed > 0));
assert.ok(layerSpeed('sky') < layerSpeed('buildings')); // far layer is slower
assert.equal(layerSpeed('wall'), 0); // the wall art does not move
assert.equal(scrollOffset('wall', 5000), 0);
assert.equal(scrollOffset('nope', 5000), 0);
assert.equal(scrollOffset('buildings', 0), 0);
assert.ok(scrollOffset('buildings', 1000) > 0); // moves right
assert.ok(scrollOffset('buildings', 2000) > scrollOffset('buildings', 1000));
assert.equal(scrollOffset('buildings', 1000, true), 0); // reduced motion
// wraps into [0, width)
for (const t of [0, 1234, 71111, 10 ** 7]) {
  const o = scrollOffset('buildings', t);
  assert.ok(o >= 0 && o < 1280);
}
assert.ok(Math.abs(scrollOffset('buildings', (1280 / layerSpeed('buildings')) * 1000)) < 1e-6); // full loop returns to 0
console.log('parallaxData ok');
