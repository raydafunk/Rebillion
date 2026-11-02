// "Brick" Dugan: Level 1 mini-boss data (Tier 2). No Phaser. Numbers mirror content/enemies/mini-bosses.json (rust-brick-dugan):
// maxHp 300 (raised from 150), moveSpeed 55, attackRange 85, damage 16, knockback 400, hitstun 280. Telegraph timings are the file's (all >= 300 ms).
// Times in ms, speeds in px/s, rects relative to the entity origin (feet) facing right.
// The five canon moves: Brick Breaker Punch, Running Shoulder Charge, Ground Stomp, Grab and Wall Slam, Rage Punch.
import { COMBAT_DEFAULTS } from '../shared/combatData.js';

export const DUGAN_ID = 'rust-brick-dugan';
export const DUGAN_SPRITE_KEY = 'rust.brick-dugan';
export const DUGAN_SKIN = 'rust-brick-dugan';
export const DUGAN_MAX_HP = 300; // was 150: about 12 full light combos (6+7+12) or 17 heavies (18) to win
export const DUGAN_RAGE_THRESHOLD = 0.3;   // proposed: below 30 percent health he enters Rage Punch mode

// RAGE PHASE (below DUGAN_RAGE_THRESHOLD): he stays enraged for the rest of the fight. Telegraphs are NOT shortened (still readable and
// parryable); he is harder because he is faster, recovers sooner (smaller punish window), picks moves more often and hits harder.
// The Rage Punch comes back every ragePunchEveryMs. Proposed values for playtest.
export const DUGAN_ENRAGED = Object.freeze({
  moveSpeedMult: 1.4, recoverMult: 0.7, moveCooldownMult: 0.5, chargeCooldownMult: 0.6, stompCooldownMult: 0.7,
  damageMult: 1.25, grabAfterMeleeMult: 0.6, ragePunchEveryMs: 7000,
});

// BLOCK (simple guard): when Zed starts a melee swing near him he may raise his arms. While blocking, combat's hit resolver reads
// guard:'block' off his state and applies COMBAT_DEFAULTS.BLOCK_DAMAGE_MULT / KNOCKBACK_MULT (0.25) and no hitstun, exactly as for Zed;
// unblockable hits (the Mega Stomp wave, grabs) still do full damage. A heavy hit (damage >= guardBreakDamage, Zed's K) breaks the guard:
// the block drops and he is staggered for guardBreakStunMs. The cooldown (counted from the start of a block) stops him turtling.
// He never blocks while telegraphing, attacking (grab hold, stomp wave, charge), in hitstun or dead. Proposed values for playtest.
export const DUGAN_BLOCK = Object.freeze({
  blockChance: 0.35, blockChanceEnraged: 0.55, blockMs: 700, blockCooldownMs: 2500,
  reactRangePx: 190,         // Zed's swing must start within this distance of him
  guardBreakDamage: 18, guardBreakStunMs: 600,
  clipMs: 280,               // the raise-arms clip is fitted to this, then holds its last frame
});

const hit = (atMs, damage, knockback, hitstun, pierceInvuln = false) => Object.freeze({ atMs, damage, knockback, hitstun, pierceInvuln });
const move = (o) => Object.freeze({ ...o, hits: Object.freeze(o.hits), attackMs: o.attackMs });

// kind 'finisher' = the heavy hit worth parrying, drawn with the orange ring; 'strike' shows only the wind-up pose.
export const DUGAN_MOVES = Object.freeze({
  punch: move({
    id: 'punch', name: 'Brick Breaker Punch', kind: 'strike',
    telegraphMs: 650, attackMs: 350, recoverMs: 900,
    hits: [hit(130, 16, 400, 280)], markIndex: 0,
    hitbox: Object.freeze({ x: 20, y: -85, w: 90, h: 60 }),
  }),
  charge: move({
    id: 'charge', name: 'Running Shoulder Charge', kind: 'strike',            // ends in a grab (catchGrab): not parryable or blockable, so the answers are jump, sidestep or out-mash
    telegraphMs: 800, attackMs: 2400, recoverMs: 700, wallRecoverMs: 1800,   // dodge sideways and he crashes into the wall: long recovery to punish
    hits: [hit(0, 20, 520, 400, true)], markIndex: 0,
    hitbox: Object.freeze({ x: 10, y: -85, w: 75, h: 65 }),
    chargeSpeed: 430, chargeMaxPx: 1000, minRange: 140, maxRange: 720,
    // If the charge catches Zed (in the lane, feet on the floor) it does not hit: it grabs him, holds, then slams (same hold as Grab and Wall Slam).
    catchGrab: Object.freeze({ holdMs: 1400, slamDamage: 40, slamKnockback: 640, slamLingerMs: 350, breakStunMs: 800, catchLiftPx: 30 }),
  }),
  stomp: move({
    id: 'stomp', name: 'Ground Stomp', kind: 'strike',
    // MEGA STOMP (owner request, art spec in design/art/dugan-mega-stomp.md): he leaps and slams at +150 ms, and a shockwave rolls out along the
    // ground in both directions. It ignores depth (the whole lane), cannot be blocked (a parry still negates it) and misses anything lifted 30 px or
    // more off the floor, so the answer is to jump as the front passes. attackMs covers the slam plus the travel (150 + 760/850 s) and the recovery tail.
    telegraphMs: 700, attackMs: 1100, recoverMs: 1000,
    hits: [hit(150, 14, 360, 350)], markIndex: 0,   // the slam; cue clock only (the wave replaces the single hit-request)
    hitbox: Object.freeze({ x: -95, y: -40, w: 190, h: 40 }),
    wave: Object.freeze({ startAt: 150, speed: 850, reachPx: 760, thickness: 70, tickMs: 33, damage: 14, knockback: 360, hitstun: 350, unblockable: true }),
  }),
  grab: move({
    id: 'grab', name: 'Grab and Wall Slam', kind: 'strike',                  // not parryable or blockable: the answer is to back-step or break free
    telegraphMs: 600, attackMs: 450, recoverMs: 1100,
    hits: [hit(180, 0, 0, 0)], markIndex: 0,                                 // cue clock only: the grab is not a hit-request
    hitbox: Object.freeze({ x: 0, y: -85, w: 75, h: 60 }),                  // short reach: back-step it
    // reachAt: the moment he checks his reach. If Zed is held: holdMs max hold, then the slam (damage/knockback go to Zed's slam
    // hit-request), slamLingerMs he stays planted after it. grabBreakStunMs: how long he is stunned when Zed button-mashes free.
    grab: Object.freeze({ reachAt: 180, reachSlackPx: 20, holdMs: 1400, slamDamage: 40, slamKnockback: 640, slamLingerMs: 350, breakStunMs: 800 }),
  }),
  rage: move({
    id: 'rage', name: 'Rage Punch', kind: 'finisher',
    telegraphMs: 900, attackMs: 450, recoverMs: 1300,
    hits: [hit(200, 28, 700, 500, true)], markIndex: 0,
    hitbox: Object.freeze({ x: 20, y: -90, w: 105, h: 70 }),
  }),
});

export const DUGAN = Object.freeze({
  team: 'rust',
  boss: true,
  spriteKey: DUGAN_SPRITE_KEY,
  skin: DUGAN_SKIN,
  maxHp: DUGAN_MAX_HP,
  moveSpeed: 55,
  circleSpeed: 40,
  attackRange: 85,        // distance at which a close move may start
  laneTolerance: 26,      // depth offset allowed for a swing to connect; otherwise he lines up first
  spawnIdleMs: 500,
  hitstunMinMs: 0,
  parryStunMs: 900,       // a parried move stuns him; ordinary hits never do (boss hitstun immunity, no juggle loops)
  knockbackScale: 0.15,   // heavy: Zed's hits barely move him
  knockbackDecay: 600,
  hurtbox: Object.freeze({ x: -32, y: -115, w: 64, h: 115 }),
  visualScale: 1.35,      // drawn larger than a grunt: "built like a human battering ram"
  tint: 0xb9bccb,         // gunmetal wash over the Rust sprite so he reads as a different unit
  grabAfterMeleeMs: 2500, // Grab and Wall Slam if Zed stays in melee range this long
  stompCrowdPx: 45,       // Zed this close counts as crowding him
  stompAirLift: COMBAT_DEFAULTS.AIR_DODGE_LIFT, // Zed this far off the floor in range draws the Ground Stomp
  chargeLaneTolerance: 34,
  chargeCooldownMs: 3500,
  stompCooldownMs: 5000,  // the Mega Stomp is a set piece: not back to back
  stompFirstMs: 2500,     // first one a little after he walks in
  stompRangePx: 650,      // he may start it from this far away: the wave reaches 760 px each side
  moveCooldownMs: 600,    // pause after any move before the next decision
});

/**
 * Pick his next move. Pure; rng: () => [0,1).
 * @param {{dist:number, dy:number, lift:number, meleeMs:number, ragePending:boolean, chargeReady:boolean, stompReady?:boolean, lastId:string|null}} s
 * @returns {object} an entry of DUGAN_MOVES
 */
export function pickDuganMove(s, rng = Math.random, d = DUGAN) {
  const inMelee = s.dist <= d.attackRange;
  if (s.ragePending && inMelee) return DUGAN_MOVES.rage;                      // below 30 percent: one extra-heavy punch, as soon as he is in reach
  if (inMelee) {
    if (s.stompReady && (s.lift >= d.stompAirLift || s.dist <= d.stompCrowdPx)) return DUGAN_MOVES.stomp; // airborne or crowding him
    if (s.meleeMs >= d.grabAfterMeleeMs) return DUGAN_MOVES.grab;                       // stayed in melee too long
    return s.stompReady && rng() < 0.3 && s.lastId !== 'stomp' ? DUGAN_MOVES.stomp : DUGAN_MOVES.punch;
  }
  if (s.chargeReady && s.dist >= DUGAN_MOVES.charge.minRange && s.dist <= DUGAN_MOVES.charge.maxRange
      && Math.abs(s.dy) <= d.chargeLaneTolerance) return DUGAN_MOVES.charge;       // from range, along his lane
  if (s.stompReady && s.dist <= d.stompRangePx) return DUGAN_MOVES.stomp;      // the wave covers the whole lane: he can start it from across the screen
  return null;
}
