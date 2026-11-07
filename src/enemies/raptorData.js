// "Raptor", the Level 5 (Skyline District) mini-boss. No Phaser. A real boss (RaptorBoss.js), not a grunt stand-in.
// OWNER CHANGE: his move set is exactly what his art folder (assets/sprites/Raptor) contains: Dive Kick (450 ms telegraph), 4-Hit Punch (600 ms),
// Falcon Drop (800 ms), plus the 6-Hit Charge (350 ms stance, then a run-in that only exists as the lead-in to six quick punches). Wall Bounce Strike and Grapple Pull were removed (no art of their own). He is the fast, often-airborne one: while he is off the floor
// (lift >= AIR_DODGE_LIFT) ground-only attacks pass under him, so Zed has to jump or catch him on landing. OWNER CHANGE: much more health than the
// content file's 130 (now 320, PROPOSED) and a harder fight: he is quick, chains moves with short pauses, and at half health goes FRENZIED
// (faster, shorter cooldowns, longer kick flurries, a second dive shockwave, a wider Falcon Drop slam).
// Times in ms, speeds in px/s, rects relative to the entity origin (feet) facing right. Every number tagged PROPOSED is for playtest.
import { COMBAT_DEFAULTS } from '../shared/combatData.js';

export const RAPTOR_ID = 'rust-raptor';
export const RAPTOR_SKIN = RAPTOR_ID;     // his own art (raptorSprites.js)
export const RAPTOR_MAX_HP = 320;         // PROPOSED. Content file says 130 (fragile); owner wants tougher. Royce 160, Kane 400, Glitch 340, Dugan 300
export const RAPTOR_PHASE2_AT = 0.5;      // frenzy below this share of his health (same as the others)
export const RAPTOR_AIR_LIFT = COMBAT_DEFAULTS.AIR_DODGE_LIFT;

const hit = (atMs, damage, knockback, hitstun, extra = {}) => Object.freeze({ atMs, damage, knockback, hitstun, pierceInvuln: false, ...extra });
const move = (o) => Object.freeze({ ...o, hits: Object.freeze(o.hits) });
const NONE = Object.freeze({ x: 0, y: -80, w: 10, h: 10 });

export const RAPTOR_MOVES = Object.freeze({
  dive: move({            // 450 ms: crouch and jump, red marker on the floor where he will land. Aimed at Zed's position when he jumps.
    id: 'dive', name: 'Dive Kick', kind: 'strike',
    telegraphMs: 450, attackMs: 560, recoverMs: 850,          // recoverMs PROPOSED: the landing is the punish window
    hits: [hit(300, 14, 320, 260), hit(420, 8, 260, 220, { echo: true })], markIndex: 0,   // the echo shockwave only exists in frenzy
    hitbox: Object.freeze({ x: -75, y: -80, w: 150, h: 80 }),  // centred on the marker
    hitboxEcho: Object.freeze({ x: -120, y: -70, w: 240, h: 70 }),
    flightMs: 300, jumpLift: 170, markerRadius: 70,
    minRange: 120, maxRange: 560,
  }),
  punch: move({           // 420 ms: plants his feet, red cue ring; then a standing 4-hit punch combo (5 in frenzy). Grounded, no lift, no drift.
    id: 'punch', name: '4-Hit Punch', kind: 'finisher',
    telegraphMs: 420, attackMs: 760, recoverMs: 700,   // OWNER: quicker (was 600 / 1000 / 900). Still longer than Zed's parry window, so every swing can be parried
    hits: [hit(120, 5, 180, 160), hit(270, 5, 180, 160), hit(420, 5, 180, 160), hit(585, 9, 320, 260)], markIndex: 3,
    hitsP2: Object.freeze([hit(120, 5, 180, 160), hit(240, 5, 180, 160), hit(360, 5, 180, 160), hit(480, 5, 180, 160), hit(630, 9, 320, 260)]),
    hitbox: Object.freeze({ x: 10, y: -115, w: 125, h: 105 }),
    minRange: 0, maxRange: 200, maxDy: 50,   // he stands still while punching, so he only starts it when Zed is already inside his punch reach and lane
  }),
  falcon: move({          // 800 ms: leaps off-screen, a shadow grows on the marked spot, then a heavy slam. The big punish window after.
    id: 'falcon', name: 'Falcon Drop', kind: 'finisher',
    telegraphMs: 800, attackMs: 680, recoverMs: 1300,
    hits: [hit(340, 24, 420, 380)], markIndex: 0,
    hitbox: Object.freeze({ x: -105, y: -80, w: 210, h: 80 }),
    hitboxP2: Object.freeze({ x: -150, y: -85, w: 300, h: 85 }),
    peakLift: 640, fallMs: 340, trackUntil: 0.6,               // the shadow follows Zed for the first 60 % of the wind-up, then locks
    markerRadius: 100,
    minRange: 150, maxRange: 620,
  }),
  rush: move({            // 6-Hit Charge: the long/mid-range gap closer. 350 ms stand-and-crouch with red chevrons, then he RUNS at Zed (only ever as the lead-in), stops
    // ~90 px away and stands still for six fast punches. The parry ring closes 80 ms before punch 1 (the run is part of the telegraph), so a parry stops the rest.
    id: 'rush', name: '6-Hit Charge', kind: 'finisher',
    telegraphMs: 350, attackMs: 850, recoverMs: 800,   // attackMs counts the punches only (the run is extra, capped by runMaxMs); first punch lands >= 470 ms after the move starts
    hits: [hit(120, 3, 150, 140), hit(230, 3, 150, 140), hit(340, 3, 150, 140), hit(450, 3, 150, 140), hit(560, 3, 150, 140), hit(690, 6, 300, 240)], markIndex: 0,   // 21 total, the 4-hit punch is 24
    hitbox: Object.freeze({ x: 10, y: -115, w: 125, h: 105 }),
    runSpeed: 360, runMaxMs: 1600, stopPx: 90, trackUntil: 0.5,   // run px/s (x1.25 in frenzy), hard cap on the run, stop distance from Zed, share of the run in which the stop point still follows Zed
    cueRunMs: 400,         // the parry ring's clock spends this long on the run (it is stretched over the real run), so the ring closes 80 ms before punch 1
    minRange: 260, maxRange: 650, maxDy: 400,
  }),
});

// BLOCK (his reaction guard, art: Block_state arms-crossed clip). While he is in the block state the resolver sees guard:'negate' and EVERY hit
// from Zed (light/heavy chains, air attacks, finishers) deals 0 damage, 0 knockback, 0 hitstun. There is NO guard break (a heavy hit does not drop it).
// It starts as a reaction when Zed's swing begins within reactRangePx of him (like Dugan), only when he is free (idle / approaching, never while
// telegraphing, attacking, stunned, airborne or in intro hold) and the cooldown is up. He does not move, faces Zed, and cannot start a move while
// blocking. It holds holdMs, then he drops it and is in a recoverMs RECOVER (plus the normal post-move pause): that is the punish window.
// Rage moves (req.rage) pierce the guard and never trigger it (rage is a timed reward). A parry (Zed's counter to his attacks) still stuns him.
export const RAPTOR_BLOCK = Object.freeze({
  reactRangePx: 150,        // PROPOSED: Zed's swing must start within this distance of him
  holdMs: 1000,             // PROPOSED: how long the guard stays up (900-1200)
  raiseMs: 300,             // the arms-crossed clip is fitted to this, then holds its last frame
  recoverMs: 450,           // PROPOSED: guard down, he is hittable (the punish), then the normal moveCooldownMs pause
  cooldownMs: 5500,         // PROPOSED: counted from the start of a block (4.5 s of vulnerability after it ends); x p2.cooldownMult in frenzy
  firstMs: 1500,            // PROPOSED: cannot block in the opening of the fight
});

export const RAPTOR = Object.freeze({
  team: 'rust',
  miniBoss: true,
  spriteKey: 'rust.raptor',
  skin: RAPTOR_SKIN,
  maxHp: RAPTOR_MAX_HP,
  moveSpeed: 135,         // PROPOSED: fastest of the mini-bosses (Glitch 120, Royce 85, Kane 55; content file 130)
  circleSpeed: 95,
  nearPx: 330,            // closes in when Zed is farther than this
  strafeLaneMin: 440, strafeLaneMax: 700,
  strafeBandPx: 70,       // (unused now: he lines up with Zed's lane and stands)
  punchClosePx: 175,    // while the 4-hit flurry is ready he walks in to this range, so it starts when Zed is close and the ring cue can be parried
  backOffPx: 200,         // closer than this (in x) with no move ready: he steps back so a move fits (Dive Kick min range 120)
  spawnIdleMs: 400,
  hitstunMinMs: 0,
  parryStunMs: 850,       // a parried move stuns him; ordinary hits never do (boss hitstun immunity, no juggle loops)
  knockbackScale: 0.3,    // fragile, but light on his feet: ordinary hits only nudge him
  knockbackDecay: 650,
  hurtbox: Object.freeze({ x: -22, y: -88, w: 44, h: 88 }),
  visualScale: 1.2,
  // pacing (PROPOSED)
  diveCooldownMs: 3800, diveFirstMs: 1200,
  punchCooldownMs: 3600, punchFirstMs: 1600,
  falconCooldownMs: 8000, falconFirstMs: 4500,
  rushCooldownMs: 7000, rushFirstMs: 3000,     // the 6-hit rush is the mid/far move: 7 s between rushes (4.55 s in frenzy), first one 3 s into the fight
  weights: Object.freeze({ dive: 3, punch: 2, falcon: 2, rush: 3 }),   // pick weights among the moves that are ready and in range
  moveCooldownMs: 600,    // pause after any move before the next decision
  // frenzy (phase 2)
  p2: Object.freeze({ speedMult: 1.3, cooldownMult: 0.65, moveCooldownMs: 340, rushSpeedMult: 1.25 }),   // frenzy rush: 25 % faster run (450 px/s) and the shorter cooldown
});

/**
 * Pick his next move. Pure; rng: () => [0,1).
 * @param {{dist:number, dy:number, lift:number, ready:{dive:boolean,punch:boolean,falcon:boolean,rush:boolean}, lastId:string|null}} s
 *   dist = distance to Zed, lift = Zed's height off the floor
 * @returns {object|null} an entry of RAPTOR_MOVES
 */
export function pickRaptorMove(s, rng = Math.random, d = RAPTOR) {
  const M = RAPTOR_MOVES;
  if ((s.lift || 0) >= RAPTOR_AIR_LIFT) return null;       // every one of his hits is ground level: wait for Zed to come down
  const ok = (m) => s.ready[m.id] && s.dist >= m.minRange && s.dist <= m.maxRange && s.lastId !== m.id && (!m.maxDy || Math.abs(s.dy || 0) <= m.maxDy);
  if (ok(M.punch)) return M.punch;                          // Zed in his face (punch only fits inside ~200 px / 50 px lane): combo
  const pool = ['dive', 'falcon', 'rush'].map((id) => M[id]).filter(ok);
  if (!pool.length) return s.ready.punch && s.dist <= M.punch.maxRange && Math.abs(s.dy || 0) <= M.punch.maxDy ? M.punch : null;   // nothing else fits: repeat the combo rather than stall
  const w = (m) => (d.weights && d.weights[m.id]) || 1;
  let r = rng() * pool.reduce((n, m) => n + w(m), 0);
  for (const m of pool) { r -= w(m); if (r < 0) return m; }
  return pool[pool.length - 1];
}
