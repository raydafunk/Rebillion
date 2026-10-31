import assert from 'node:assert/strict';
import { createScore, SCORE } from './score.js';

// kills: toughness scales the points; a parry boost doubles them
{
  const sc = createScore();
  assert.equal(sc.onKill(1, 0).delta, 100);
  assert.equal(sc.onKill(3, 0).delta, 300, '3x-health Breaker');
  assert.equal(sc.onKill(0.2, 0).delta, 100, 'never below a grunt');
  assert.equal(sc.state.total, 500);
}

// parry: chained parries build the streak; the first starts a x2 boost on kills
{
  const sc = createScore();
  const p1 = sc.onParry(1000);
  assert.equal(p1.delta, 150); assert.equal(p1.streak, 1);
  assert.equal(sc.multiplier(1001), SCORE.BOOST_MULT);
  assert.equal(sc.onKill(1, 1500).delta, 200, 'kill inside the boost pays double');
  const p2 = sc.onParry(3000); // 2 s later: rhythm kept
  assert.equal(p2.delta, 300); assert.equal(p2.streak, 2);
  const p3 = sc.onParry(6500); // 3.5 s later: still chained
  assert.equal(p3.delta, 450); assert.equal(p3.streak, 3);
  assert.equal(sc.state.bestStreak, 3);
  assert.equal(sc.boostLeft(6500), SCORE.BOOST_MS, 'every parry refreshes the boost');
  assert.equal(sc.onKill(1, 6500 + SCORE.BOOST_MS + 1).delta, 100, 'boost has run out');
}

// the streak breaks when the rhythm is lost (too slow) or when Zed is hit
{
  const sc = createScore();
  sc.onParry(0); sc.onParry(1000);
  const slow = sc.onParry(1000 + SCORE.STREAK_MS + 1);
  assert.equal(slow.streak, 1); assert.equal(slow.delta, 150, 'too slow: back to x1');
  sc.onParry(6000);
  sc.onDamage();
  assert.equal(sc.onParry(6500).streak, 1, 'a hit ends the streak');
}

// the streak multiplier is capped but the best streak still counts
{
  const sc = createScore();
  let last;
  for (let i = 0; i < 8; i++) last = sc.onParry(i * 500);
  assert.equal(last.delta, SCORE.PARRY_BASE * SCORE.STREAK_MAX);
  assert.equal(sc.state.bestStreak, 8);
}

// flawless waves: no health lost; consecutive flawless waves pay more; a hit resets the run
{
  const sc = createScore();
  sc.onWaveStart();
  assert.equal(sc.onWaveCleared(0).delta, 500);
  sc.onWaveStart();
  assert.equal(sc.onWaveCleared(0).delta, 1000, 'second flawless wave in a row');
  sc.onWaveStart(); sc.onDamage();
  assert.equal(sc.onWaveCleared(0), null, 'hit during the wave: no bonus');
  sc.onWaveStart();
  assert.equal(sc.onWaveCleared(0).delta, 500, 'run starts over');
  for (let i = 0; i < 8; i++) { sc.onWaveStart(); sc.onWaveCleared(0); }
  sc.onWaveStart();
  assert.equal(sc.onWaveCleared(0).delta, SCORE.FLAWLESS_BASE * SCORE.FLAWLESS_STREAK_MAX, 'capped');
  assert.equal(sc.state.flawlessWaves, 12);
}

// a hit keeps the boost running but spoils the flawless bonus
{
  const sc = createScore();
  sc.onWaveStart(); sc.onParry(0); sc.onDamage();
  assert.ok(sc.multiplier(100) === SCORE.BOOST_MULT);
  assert.equal(sc.onWaveCleared(100), null);
}

// reset (retry)
{
  const sc = createScore();
  sc.onKill(1, 0); sc.onParry(0); sc.onWaveStart(); sc.onWaveCleared(0);
  sc.reset();
  assert.deepEqual([sc.state.total, sc.state.parries, sc.state.flawlessWaves, sc.multiplier(1), sc.streakAt(1)], [0, 0, 0, 1, 0]);
}
console.log('score ok');
