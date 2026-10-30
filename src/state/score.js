// Score and the rhythm reward. Pure: time is passed in (ms), no Phaser.
//   kill      100 x the enemy's toughness (a 3x-health Breaker is worth 300), times the boost multiplier
//   parry     150 x the parry streak; parries within STREAK_MS of each other chain (x1, x2 ... x5). The streak is the rhythm.
//   boost     every parry starts (or refreshes) BOOST_MS of x2 on kill points, so a parry pays off in the next few punches
//   flawless  a wave cleared without Zed losing any health: 500 x consecutive flawless waves (x1 ... x5)
// Taking damage ends the parry streak and spoils the current wave's flawless bonus (it does not end the boost).
export const SCORE = Object.freeze({
  KILL_BASE: 100,
  PARRY_BASE: 150,
  STREAK_MS: 4000,
  STREAK_MAX: 5,
  BOOST_MS: 5000,
  BOOST_MULT: 2,
  FLAWLESS_BASE: 500,
  FLAWLESS_STREAK_MAX: 5,
});

export function createScore(cfg = SCORE) {
  const s = {
    total: 0,
    parries: 0, bestStreak: 0, flawlessWaves: 0, kills: 0,
    streak: 0, lastParryAt: -Infinity,
    boostUntil: -Infinity,
    waveHit: false, flawlessRun: 0,
  };

  const boostLeft = (now) => Math.max(0, s.boostUntil - now);
  const multiplier = (now) => (boostLeft(now) > 0 ? cfg.BOOST_MULT : 1);
  const streakAt = (now) => (now - s.lastParryAt <= cfg.STREAK_MS ? s.streak : 0);
  const add = (delta, reason, now, extra = {}) => {
    s.total += delta;
    return { delta, total: s.total, reason, multiplier: multiplier(now), streak: streakAt(now), ...extra };
  };

  return {
    get state() { return s; },
    boostLeft, multiplier, streakAt,

    /** toughness = enemy maxHp / grunt maxHp (1 for a grunt). */
    onKill(toughness, now) {
      s.kills++;
      const pts = Math.round(cfg.KILL_BASE * Math.max(1, toughness) * multiplier(now));
      return add(pts, 'kill', now);
    },

    onParry(now) {
      s.streak = streakAt(now) + 1;
      const streak = Math.min(s.streak, cfg.STREAK_MAX);
      s.lastParryAt = now;
      s.parries++;
      s.bestStreak = Math.max(s.bestStreak, s.streak);
      s.boostUntil = now + cfg.BOOST_MS;
      return add(cfg.PARRY_BASE * streak, 'parry', now, { streak: s.streak, boostMs: cfg.BOOST_MS });
    },

    /** Zed lost health. */
    onDamage() { s.waveHit = true; s.streak = 0; s.lastParryAt = -Infinity; },

    onWaveStart() { s.waveHit = false; },

    /** Returns the flawless bonus result, or null when Zed was hit during the wave. */
    onWaveCleared(now) {
      if (s.waveHit) { s.flawlessRun = 0; return null; }
      s.flawlessRun++; s.flawlessWaves++;
      return add(cfg.FLAWLESS_BASE * Math.min(s.flawlessRun, cfg.FLAWLESS_STREAK_MAX), 'flawless', now, { run: s.flawlessRun });
    },

    reset() {
      Object.assign(s, { total: 0, parries: 0, bestStreak: 0, flawlessWaves: 0, kills: 0, streak: 0, lastParryAt: -Infinity, boostUntil: -Infinity, waveHit: false, flawlessRun: 0 });
    },
  };
}
