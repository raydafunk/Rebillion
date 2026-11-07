// "Subject 88" (Dr. Holt's Experiment), the Level 6 (Undercity) mini-boss. No Phaser. A real boss (Subject88Boss.js), not a grunt stand-in.
// Names, telegraphs and the five canon moves mirror content/enemies/mini-bosses.json (rust-holts-experiment-subject-88): Toxic Breath 600 ms,
// Acid Spit 650 ms, Frenzied Charge 800 ms, Corrosion Slam 750 ms, Chemical Explosion 1000 ms. He is an AREA-DENIAL BRUISER: he never backs off,
// he walks Zed down, and his breath, spit and slam leave hazards on the ground that slowly fade. He is a person in distress, not a monster: no gore,
// the green glow is the tanks and veins. OWNER CHANGE: far more health than the content file's 200 (now 380), harder fight.
// Times in ms, speeds in px/s, rects relative to the entity origin (feet) facing right.
// Stats, timings, hazard sizes and layouts are proposed values for playtest (tagged PROPOSED where they are new numbers).
export const SUBJECT88_ID = 'rust-holts-experiment-subject-88';
export const SUBJECT88_SKIN = SUBJECT88_ID;     // his own art (subject88Sprites.js)
export const SUBJECT88_MAX_HP = 380;            // PROPOSED: json 200; Kane 220, Royce 160, Dugan 300, Glitch 340: the toughest mini-boss
export const SUBJECT88_FLARE_AT = 0.6;          // PROPOSED: below this share he flares (veins brighten): Frenzied Charge unlocks, faster, shorter cooldowns
export const SUBJECT88_EXPLODE_AT = Object.freeze([0.4, 0.15]);   // PROPOSED: json ~40 percent; the second one at 15 percent is the owner's "harder" add

const hit = (atMs, damage, knockback, hitstun, extra = {}) => Object.freeze({ atMs, damage, knockback, hitstun, pierceInvuln: false, ...extra });
const move = (o) => Object.freeze({ ...o, hits: Object.freeze(o.hits) });
const NONE = Object.freeze({ x: 0, y: -80, w: 10, h: 10 });

export const SUBJECT88_MOVES = Object.freeze({
  breath: move({          // 600 ms: chest swells, green mist leaks from the tanks. A short cone that lingers as a gas cloud (it ticks while Zed stands in it).
    id: 'breath', name: 'Toxic Breath', kind: 'strike',
    telegraphMs: 600, attackMs: 520, recoverMs: 850,
    hits: [hit(140, 8, 180, 200, { spawn: 'gas' })], markIndex: 0,
    hitbox: Object.freeze({ x: 10, y: -92, w: 190, h: 92 }),
    gas: Object.freeze({ lifeMs: 2600, tickMs: 450, damage: 3, hitstun: 0 }),       // PROPOSED
    minRange: 0, maxRange: 210,
  }),
  spit: move({            // 650 ms: head tilts back, a green circle forms on the ground at Zed's spot (marked at wind-up, so walking away dodges it).
    id: 'spit', name: 'Acid Spit', kind: 'strike',
    telegraphMs: 650, attackMs: 420, recoverMs: 900,
    hits: [hit(160, 0, 0, 0, { spawn: 'spit' })], markIndex: 0,
    hitbox: NONE,
    puddle: Object.freeze({ radius: 72, lifeMs: 3000, tickMs: 600, damage: 5, hitstun: 0, landDamage: 9, landKnockback: 140, landHitstun: 220 }),   // PROPOSED: json 3 s
    minRange: 220, maxRange: 760,
  }),
  charge: move({          // 800 ms: he roars, veins brighten, red lane strip. A straight run along his lane; hitting the arena edge leaves him open.
    id: 'charge', name: 'Frenzied Charge', kind: 'finisher',
    telegraphMs: 800, attackMs: 640, recoverMs: 1100,
    hits: [hit(90, 14, 380, 300, { charge: true }), hit(250, 14, 380, 300, { charge: true }), hit(410, 14, 380, 300, { charge: true })], markIndex: 0,
    hitbox: Object.freeze({ x: -30, y: -92, w: 120, h: 92 }),
    charge: Object.freeze({ speed: 640, moveMs: 560, laneHalfH: 34, wallStunMs: 800 }),   // PROPOSED; wallStunMs = extra helpless time after slamming the edge
    minRange: 300, maxRange: 1000,
  }),
  slam: move({            // 750 ms: both fists raised, red circle. Heavy overhead; leaves a small puddle where it lands.
    id: 'slam', name: 'Corrosion Slam', kind: 'finisher',
    telegraphMs: 750, attackMs: 480, recoverMs: 1000,
    hits: [hit(210, 18, 320, 320, { spawn: 'slamPuddle' })], markIndex: 0,
    hitbox: Object.freeze({ x: 10, y: -110, w: 130, h: 110 }),
    puddle: Object.freeze({ radius: 52, lifeMs: 3500, tickMs: 600, damage: 4, hitstun: 0, offsetX: 90 }),   // PROPOSED: small
    minRange: 0, maxRange: 150,
  }),
  explosion: move({       // 1000 ms: tanks glow brighter and rattle, ring warning grows on the floor. The only move where he stops advancing (he is rooted).
    id: 'explosion', name: 'Chemical Explosion', kind: 'finisher',
    telegraphMs: 1000, attackMs: 700, recoverMs: 1500,
    hits: [hit(260, 20, 420, 360, { ring: true })], markIndex: 0,
    hitbox: NONE,
    ring: Object.freeze({ radius: 210, halfH: 46 }),   // PROPOSED; warning ring grows to this radius during the wind-up. Step outside it.
    minRange: 0, maxRange: 2000,
  }),
});

export const SUBJECT88 = Object.freeze({
  team: 'rust',
  miniBoss: true,
  spriteKey: 'rust.subject-88',
  skin: SUBJECT88_SKIN,
  maxHp: SUBJECT88_MAX_HP,
  moveSpeed: 85,          // json 75; relentless, slower than Glitch (120) and Royce (85 equal): he walks Zed down
  circleSpeed: 70,
  stopPx: 110,            // stops walking in when this close in x and in lane
  laneTolerance: 30,      // depth offset allowed for a lane move (charge, breath, slam); otherwise he lines up first
  spawnIdleMs: 500,
  parryStunMs: 800,       // only a parried move stuns him; ordinary hits never do (boss hitstun immunity, no juggle loops)
  knockbackScale: 0.2,    // a big, heavy frame: barely moves when hit
  knockbackDecay: 600,
  hurtbox: Object.freeze({ x: -34, y: -112, w: 68, h: 112 }),
  visualScale: 1.3,
  edgeInsetPx: 40,        // charge stops this far inside the range edge
  // pacing
  breathCooldownMs: 3800, breathFirstMs: 1400,
  spitCooldownMs: 5200, spitFirstMs: 2400,
  chargeCooldownMs: 6500, chargeFirstMs: 0,       // gated by the flare, so no first-use delay needed
  slamCooldownMs: 3800, slamFirstMs: 1000,
  explosionCooldownMs: 4000, explosionFirstMs: 0, // gated by the health thresholds
  moveCooldownMs: 700,    // pause after any move before the next decision
  // flare (phase 2)
  p2: Object.freeze({ speedMult: 1.35, cooldownMult: 0.65, moveCooldownMs: 420 }),
});

/**
 * Pick his next move. Pure; rng: () => [0,1).
 * @param {{dist:number, dy:number, ready:{breath:boolean,spit:boolean,charge:boolean,slam:boolean,explosion:boolean}, lastId:string|null, forceExplosion?:boolean, flared?:boolean}} s
 * @returns {object|null} an entry of SUBJECT88_MOVES
 */
export function pickSubject88Move(s, rng = Math.random, d = SUBJECT88) {
  const M = SUBJECT88_MOVES;
  if (s.forceExplosion && s.ready.explosion) return M.explosion;                  // health threshold: the only time he stops advancing
  const pool = [];
  const ok = (m) => s.ready[m.id] && s.dist >= m.minRange && s.dist <= m.maxRange && s.lastId !== m.id;
  const inLane = Math.abs(s.dy) <= d.laneTolerance;
  if (ok(M.slam) && Math.abs(s.dy) <= d.laneTolerance * 1.2) pool.push(M.slam);
  if (ok(M.breath) && Math.abs(s.dy) <= d.laneTolerance * 1.5) pool.push(M.breath);
  if (ok(M.spit)) pool.push(M.spit);
  if (s.flared && ok(M.charge) && inLane) pool.push(M.charge);
  if (!pool.length) return null;
  return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
}
