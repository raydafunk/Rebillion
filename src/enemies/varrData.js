// Overseer Halden Varr, "The Architect of Rust": Level 8 final boss. No Phaser. A real boss (VarrBoss.js), not a grunt stand-in.
// Names and moves mirror content/enemies/rust-gdd-units.json (rust-halden-varr, the-rebellion#19-20).
// Phase 1 "Authority" (100 % to 30 % HP): Authority Strike, Command Shield, Command Override, Adaptive Counter (stances).
// Phase 2 "Rust Protocol": at 30 % HP he cannot be hurt, rebuilds himself (TRANSFORM state, HP restored), then fights with a NEW move set:
//   Hybrid Assault (Breaker slam, Watcher taser shot, Copper Fang gauntlet combo, Overseer control pulse), Drone Command (laser patterns),
//   and Rust Collapse (super: huge blast, walls electrify, from then on he is RELENTLESS). The shield is gone in phase 2.
// Times in ms, speeds in px/s, rects relative to the entity origin (feet) facing right. Stats and timings are proposed values for playtest.
export const VARR_ID = 'rust-halden-varr';
export const VARR_MAX_HP = 320;            // the level multiplies this (hpMult)
export const VARR_PHASE2_AT = 0.3;         // canon: Rust Protocol starts at 30 percent HP (the-rebellion#17)
export const VARR_P2_RESTORE = 1.0;        // share of max HP he is rebuilt to when phase 2 starts (1 = full). Tune here.
export const VARR_COLLAPSE_AT = 0.5;       // phase-2 HP share (of the restored bar) at which Rust Collapse fires
export const VARR_SUMMON_KINDS = Object.freeze(['rust-watcher', 'rust-breaker', 'rust-copper-fang', null]); // null = plain Grunt

const hit = (atMs, damage, knockback, hitstun, extra = {}) => Object.freeze({ atMs, damage, knockback, hitstun, pierceInvuln: false, ...extra });
const move = (o) => Object.freeze({ ...o, hits: Object.freeze(o.hits) });
const NONE = Object.freeze({ x: 0, y: -80, w: 10, h: 10 });
const bolt = (speed, damage, hitstun, extra = {}) => Object.freeze({ speed, maxDist: 900, damage, knockback: 160, hitstun, hitbox: Object.freeze({ x: -12, y: -68, w: 26, h: 26 }), muzzle: Object.freeze({ x: 44, y: 0 }), ...extra });

export const VARR_MOVES = Object.freeze({
  // ---------------- phase 1: Authority ----------------
  strike: move({          // 400 ms: gauntlet crackles. High damage, big knockback, fast startup.
    id: 'strike', name: 'Authority Strike', kind: 'strike', phase: 1,
    telegraphMs: 400, attackMs: 280, recoverMs: 900,
    hits: [hit(120, 18, 380, 220)], markIndex: 0,
    hitbox: Object.freeze({ x: 10, y: -92, w: 110, h: 84 }),
    minRange: 0, maxRange: 130,
  }),
  shield: move({          // 250 ms: emitter flares. For holdMs every blow from the FRONT is negated; flank him or break it (shieldHp).
    id: 'shield', name: 'Command Shield', kind: 'guard', phase: 1,
    telegraphMs: 250, attackMs: 2200, recoverMs: 600,
    hits: [], markIndex: 0, hitbox: NONE,
    shieldHp: 80, brokenStunMs: 1500,
    minRange: 0, maxRange: 420,
  }),
  override: move({        // 700 ms: he raises a hand, a call goes out. Summons a Grunt, Watcher or Copper Fang that fights beside him.
    id: 'override', name: 'Command Override', kind: 'summon', phase: 1,
    telegraphMs: 700, attackMs: 600, recoverMs: 900,
    hits: [hit(300, 0, 0, 0, { summon: true })], markIndex: 0, hitbox: NONE,
    maxAlive: 2,
    minRange: 160, maxRange: 900,
  }),
  // ---------------- phase 2: Rust Protocol (Hybrid Assault = the four below) ----------------
  slam: move({            // Breaker slam
    id: 'slam', name: 'Breaker Slam', kind: 'strike', phase: 2, group: 'hybrid',
    telegraphMs: 650, attackMs: 360, recoverMs: 900,
    hits: [hit(180, 24, 440, 300)], markIndex: 0,
    hitbox: Object.freeze({ x: 0, y: -100, w: 190, h: 100 }),
    minRange: 0, maxRange: 200,
  }),
  taser: move({           // Watcher taser shot
    id: 'taser', name: 'Taser Shot', kind: 'strike', phase: 2, group: 'hybrid',
    telegraphMs: 520, attackMs: 300, recoverMs: 650,
    hits: [hit(140, 0, 0, 0, { shot: 'taser' })], markIndex: 0, hitbox: NONE,
    shot: bolt(520, 10, 240),
    minRange: 230, maxRange: 800,
  }),
  combo: move({           // Copper Fang gauntlet combo: three punches
    id: 'combo', name: 'Gauntlet Combo', kind: 'finisher', phase: 2, group: 'hybrid',
    telegraphMs: 450, attackMs: 780, recoverMs: 800,
    hits: [hit(120, 9, 180, 180), hit(380, 9, 180, 180), hit(640, 16, 400, 300)], markIndex: 2,
    hitbox: Object.freeze({ x: 10, y: -92, w: 120, h: 84 }),
    minRange: 0, maxRange: 150,
  }),
  control: move({         // Overseer-style control pulse: wide frontal sweep that pins (long hitstun, little damage)
    id: 'control', name: 'Control Pulse', kind: 'strike', phase: 2, group: 'hybrid',
    telegraphMs: 600, attackMs: 400, recoverMs: 850,
    hits: [hit(200, 10, 120, 520)], markIndex: 0,
    hitbox: Object.freeze({ x: 0, y: -100, w: 320, h: 100 }),
    minRange: 0, maxRange: 330,
  }),
  drones: move({          // Drone Command: elite drones circle and fire laser patterns. Four beats, each a different pattern. Slip between lanes.
    id: 'drones', name: 'Drone Command', kind: 'strike', phase: 2,
    telegraphMs: 600, attackMs: 2000, recoverMs: 1100,
    hits: [0, 1, 2, 3].map((n) => hit(150 + n * 500, 0, 0, 0, { shot: 'drone', n })), markIndex: 0, hitbox: NONE,
    shot: bolt(380, 7, 200, { maxDist: 820, muzzle: Object.freeze({ x: 0, y: 0 }) }),
    // lane offsets (px from Zed's depth) per beat: fan, cross, sweep, ring
    patterns: Object.freeze([[-90, -45, 0, 45, 90], [-60, 60], [-90, 0, 90], [-45, 45, 0, -90, 90]]),
    minRange: 0, maxRange: 900,
  }),
  collapse: move({        // Rust Collapse: armour overloads (long, loud wind-up), then a huge blast. Jump it. Walls electrify afterwards.
    id: 'collapse', name: 'Rust Collapse', kind: 'super', phase: 2,
    telegraphMs: 1500, attackMs: 600, recoverMs: 1200,
    hits: [hit(250, 40, 620, 600, { aoe: true })], markIndex: 0,
    hitbox: Object.freeze({ x: -440, y: -130, w: 880, h: 140 }),     // both sides of him; ignores depth (see _emitHit lane = null)
    minRange: 0, maxRange: 1e9,
  }),
});

export const VARR = Object.freeze({
  team: 'rust',
  miniBoss: true,
  spriteKey: 'rust.halden-varr',
  skin: VARR_ID,
  maxHp: VARR_MAX_HP,
  moveSpeed: 80,
  circleSpeed: 70,
  keepNearPx: 120,        // walks in until Zed is this close
  laneTolerance: 24,      // depth offset allowed for a melee move
  spawnIdleMs: 700,
  parryStunMs: 700,       // a parried move stuns him; ordinary hits never do
  knockbackScale: 0.25,
  knockbackDecay: 600,
  hurtbox: Object.freeze({ x: -26, y: -104, w: 52, h: 104 }),
  visualScale: 1.3,
  moveCooldownMs: 500,
  // phase 1 pacing
  shieldCooldownMs: 9000, shieldFirstMs: 5000,
  overrideCooldownMs: 18000, overrideFirstMs: 3500,
  // Adaptive Counter: what he watches for. Counts decay; a stance needs `need` of them inside `windowMs`.
  counter: Object.freeze({ windowMs: 6000, jumps: 3, rushSpeed: 260, rushes: 2, comboHits: 4, comboGapMs: 900, stanceMs: 7000 }),
  stanceStrikeTelegraphMult: 0.7,    // anti-rush / anti-air stances make his Authority Strike quicker
  stanceStrikeReachMult: 1.35,       // anti-air: wider reach
  stanceShieldHpMult: 1.5,           // anti-combo: tougher shield
  // transformation
  transformMs: 2800, restoreAtMs: 1500,
  // phase 2 pacing
  p2: Object.freeze({
    speedMult: 1.25, moveCooldownMs: 380, recoverMult: 0.85,
    dronesCooldownMs: 9000, dronesFirstMs: 2500,
    controlCooldownMs: 6000, controlFirstMs: 3500,
    taserCooldownMs: 3500, taserFirstMs: 1500,
    slamCooldownMs: 4500, slamFirstMs: 800,
    comboCooldownMs: 4000, comboFirstMs: 600,
  }),
  // relentless (after Rust Collapse): faster, no breathing room, walls zap anyone pinned against them
  relentless: Object.freeze({ speedMult: 1.5, moveCooldownMs: 120, recoverMult: 0.55, cooldownMult: 0.6, wallEdgePx: 70, wallZapMs: 900, wallZapDamage: 6, wallZapHitstun: 200 }),
});

/**
 * Pick his next move. Pure; rng: () => [0,1).
 * @param {{phase:1|2, dist:number, dy:number, lift:number, ready:Object<string,boolean>, lastId:string|null, stance:string|null,
 *   collapseDue?:boolean, summonsAlive?:number}} s
 * @returns {object|null} an entry of VARR_MOVES (null = keep walking in)
 */
export function pickVarrMove(s, rng = Math.random, d = VARR) {
  const M = VARR_MOVES;
  const inLane = Math.abs(s.dy) <= d.laneTolerance * 1.5;
  const ok = (m) => s.ready[m.id] && s.dist >= m.minRange && s.dist <= m.maxRange && s.lastId !== m.id;
  const pick = (pool) => pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
  if (s.phase === 2) {
    if (s.collapseDue && s.ready.collapse) return M.collapse;
    const pool = [];
    if (ok(M.drones)) pool.push(M.drones);
    if (inLane) {
      if (ok(M.combo)) pool.push(M.combo);
      if (ok(M.slam)) pool.push(M.slam);
      if (ok(M.control)) pool.push(M.control);
      if (ok(M.taser)) pool.push(M.taser);
    }
    return pool.length ? pick(pool) : null;
  }
  // phase 1
  if (ok(M.override) && (s.summonsAlive ?? 0) < M.override.maxAlive) return M.override;
  if (s.stance === 'anti-rush' && s.dist <= 200 && ok(M.shield)) return M.shield;       // charged in: raise the shield
  if (s.stance === 'anti-combo' && s.dist <= 260 && ok(M.shield)) return M.shield;      // long strings: shield up
  if (inLane && ok(M.strike)) {
    if (ok(M.shield) && s.dist > 60 && rng() < 0.25) return M.shield;                    // sometimes shield up instead of punching
    return M.strike;
  }
  return null;
}

/** Adaptive Counter: which stance does Zed's recent play call for? counts = { jumps, rushes, comboHits } inside the window. */
export function counterStance(counts, d = VARR) {
  const c = d.counter;
  const cands = [];
  if (counts.jumps >= c.jumps) cands.push(['anti-air', counts.jumps / c.jumps]);
  if (counts.rushes >= c.rushes) cands.push(['anti-rush', counts.rushes / c.rushes]);
  if (counts.comboHits >= c.comboHits) cands.push(['anti-combo', counts.comboHits / c.comboHits]);
  if (!cands.length) return null;
  cands.sort((a, b) => b[1] - a[1]);
  return cands[0][0];
}
