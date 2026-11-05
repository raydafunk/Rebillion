// "Glitch", the Level 4 (Stewpot Gardens) mini-boss. No Phaser. A real boss (GlitchBoss.js), not a grunt stand-in.
// Names, telegraphs and the five canon moves mirror content/enemies/mini-bosses.json (rust-glitch): Drone Barrage 700 ms, Hologram Duplicate 500 ms,
// Shock Disk Throw 550 ms, Data Spike 600 ms, Emergency Teleport 400 ms. OWNER CHANGE: far more health than the content file's 110 (now 340) and a
// harder fight: he is faster, keeps his distance, and OVERCLOCKS at half health (shorter cooldowns, bigger volleys, two decoys, a teleport at each
// health threshold). Times in ms, speeds in px/s, rects relative to the entity origin (feet) facing right.
// Stats, timings and layouts are proposed values for playtest.
import { COMBAT_DEFAULTS } from '../shared/combatData.js';

export const GLITCH_ID = 'rust-glitch';
export const GLITCH_SKIN = GLITCH_ID;   // his own art (glitchSprites.js)
export const GLITCH_MAX_HP = 340;       // Kane 220, Royce 160, Dugan 300: the toughest mini-boss
export const GLITCH_PHASE2_AT = 0.5;    // overclock below this share of his health
export const GLITCH_TELEPORT_AT = Object.freeze([0.5, 0.25]);   // health shares that force an Emergency Teleport

const hit = (atMs, damage, knockback, hitstun, extra = {}) => Object.freeze({ atMs, damage, knockback, hitstun, pierceInvuln: false, ...extra });
const move = (o) => Object.freeze({ ...o, hits: Object.freeze(o.hits) });
const NONE = Object.freeze({ x: 0, y: -80, w: 10, h: 10 });

export const GLITCH_MOVES = Object.freeze({
  disk: move({            // 550 ms: disk spun up in his hand, red line of flight. A fast straight projectile along his lane.
    id: 'disk', name: 'Shock Disk Throw', kind: 'strike',
    telegraphMs: 550, attackMs: 380, recoverMs: 700,
    hits: [hit(160, 0, 0, 0, { shot: 'disk' })], markIndex: 0,
    hitbox: NONE,
    shot: Object.freeze({ speed: 640, maxDist: 900, damage: 11, knockback: 220, hitstun: 280, hitbox: Object.freeze({ x: -14, y: -72, w: 28, h: 30 }), muzzle: Object.freeze({ x: 40, y: 0 }) }),
    minRange: 200, maxRange: 800,
  }),
  drones: move({          // 700 ms: pack opens and the lights blink. A volley of slow drones fanning across the lanes; jump or slip between them.
    id: 'drones', name: 'Drone Barrage', kind: 'strike',
    telegraphMs: 700, attackMs: 900, recoverMs: 1000,
    hits: [hit(120, 0, 0, 0, { shot: 'drone', n: 0 }), hit(380, 0, 0, 0, { shot: 'drone', n: 1 }), hit(640, 0, 0, 0, { shot: 'drone', n: 2 })], markIndex: 0,
    hitbox: NONE,
    shot: Object.freeze({ speed: 360, maxDist: 760, damage: 7, knockback: 140, hitstun: 220, hitbox: Object.freeze({ x: -12, y: -66, w: 24, h: 26 }), muzzle: Object.freeze({ x: -10, y: 0 }) }),
    laneOffsets: Object.freeze([0, -46, 46]),           // each drone's depth lane relative to Zed's (phase 2 adds two more)
    laneOffsetsP2: Object.freeze([0, -46, 46, -92, 92]),
    minRange: 250, maxRange: 800,
  }),
  decoy: move({           // 500 ms: mask flickers and a hologram double shimmers in beside Zed, then throws a weak punch. Only Glitch has a pack.
    id: 'decoy', name: 'Hologram Duplicate', kind: 'strike',
    telegraphMs: 500, attackMs: 1200, recoverMs: 900,
    hits: [hit(900, 8, 260, 260, { from: 'decoy' })], markIndex: 0,
    hitbox: Object.freeze({ x: 10, y: -90, w: 80, h: 80 }),
    decoy: Object.freeze({ offsetX: 120, lifeMs: 1500 }),          // appears this far from Zed; phase 2 sends one to each side
    minRange: 0, maxRange: 800,
  }),
  spike: move({           // 600 ms: crouches, cyan line draws on the floor, then the spike runs along it. A short ground line.
    id: 'spike', name: 'Data Spike', kind: 'finisher',
    telegraphMs: 600, attackMs: 420, recoverMs: 800,
    hits: [hit(140, 14, 300, 320)], markIndex: 0,
    hitbox: Object.freeze({ x: 10, y: -70, w: 330, h: 70 }),
    hitboxFar: Object.freeze({ x: 330, y: -70, w: 260, h: 70 }),   // phase 2: a second spike chases the first further out
    minRange: 0, maxRange: 340,
  }),
  teleport: move({        // 400 ms: mask static, cyan flash, then he reappears on the far side and is helpless for recoverMs (the punish window).
    id: 'teleport', name: 'Emergency Teleport', kind: 'strike',
    telegraphMs: 400, attackMs: 200, recoverMs: 700, recoverMsP2: 480,
    hits: [hit(0, 0, 0, 0, { teleport: true })], markIndex: 0,
    hitbox: NONE,
    edgeInsetPx: 150,
  }),
});

export const GLITCH = Object.freeze({
  team: 'rust',
  miniBoss: true,
  spriteKey: 'rust.glitch',
  skin: GLITCH_SKIN,
  maxHp: GLITCH_MAX_HP,
  moveSpeed: 120,         // faster than Royce (85) and Kane (55): the evasive one
  circleSpeed: 95,
  keepAwayPx: 260,        // backs off when Zed is closer than this ...
  keepNearPx: 520,        // ... and walks in when Zed is farther than this
  closePx: 150,           // "Zed got close": spike or teleport
  laneTolerance: 22,      // depth offset allowed for a lane move (disk, spike); otherwise he lines up first
  spawnIdleMs: 400,
  hitstunMinMs: 0,
  parryStunMs: 800,       // a parried move stuns him; ordinary hits never do (boss hitstun immunity, no juggle loops)
  knockbackScale: 0.35,
  knockbackDecay: 600,
  hurtbox: Object.freeze({ x: -24, y: -92, w: 48, h: 92 }),
  visualScale: 1.2,
  // pacing
  diskCooldownMs: 2600, diskFirstMs: 1500,
  dronesCooldownMs: 7000, dronesFirstMs: 4500,
  decoyCooldownMs: 8500, decoyFirstMs: 3200,
  spikeCooldownMs: 3200, spikeFirstMs: 1200,
  teleportCooldownMs: 7000, teleportFirstMs: 2500,
  moveCooldownMs: 650,    // pause after any move before the next decision
  // overclock (phase 2)
  p2: Object.freeze({ speedMult: 1.3, cooldownMult: 0.65, moveCooldownMs: 380, diskBurst: 2, diskBurstGapMs: 260, decoys: 2 }),
});

/**
 * Pick his next move. Pure; rng: () => [0,1).
 * @param {{dist:number, dy:number, lift:number, ready:{disk:boolean,drones:boolean,decoy:boolean,spike:boolean,teleport:boolean}, lastId:string|null, forceTeleport?:boolean}} s
 * @returns {object|null} an entry of GLITCH_MOVES
 */
export function pickGlitchMove(s, rng = Math.random, d = GLITCH) {
  const M = GLITCH_MOVES;
  if (s.ready.teleport && (s.forceTeleport || s.dist <= d.closePx)) return M.teleport;     // health threshold, or Zed got close
  const pool = [];
  const ok = (m) => s.ready[m.id] && s.dist >= m.minRange && s.dist <= m.maxRange && s.lastId !== m.id;
  if (s.dist <= d.closePx) {
    if (s.ready.spike && s.lastId !== 'spike') return M.spike;                               // punish rushing him
    if (ok(M.decoy)) return M.decoy;
    return null;                                                                              // otherwise he backs away
  }
  if (ok(M.spike) && s.dist <= M.spike.maxRange - 40 && Math.abs(s.dy) <= d.laneTolerance * 1.5) pool.push(M.spike);
  if (ok(M.disk) && Math.abs(s.dy) <= d.laneTolerance) pool.push(M.disk);
  if (ok(M.drones)) pool.push(M.drones);
  if (ok(M.decoy)) pool.push(M.decoy);
  if (!pool.length) return null;
  return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
}

export const GLITCH_AIR_LIFT = COMBAT_DEFAULTS.AIR_DODGE_LIFT;
