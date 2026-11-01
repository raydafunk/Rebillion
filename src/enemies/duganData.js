// "Brick" Dugan: Level 1 mini-boss data (Tier 2). No Phaser. Numbers mirror content/enemies/mini-bosses.json (rust-brick-dugan):
// maxHp 150, moveSpeed 55, attackRange 85, damage 16, knockback 400, hitstun 280. Telegraph timings are the file's (all >= 300 ms).
// Times in ms, speeds in px/s, rects relative to the entity origin (feet) facing right.
// The five canon moves: Brick Breaker Punch, Running Shoulder Charge, Ground Stomp, Grab and Wall Slam, Rage Punch.
import { COMBAT_DEFAULTS } from '../shared/combatData.js';

export const DUGAN_ID = 'rust-brick-dugan';
export const DUGAN_SPRITE_KEY = 'rust.brick-dugan';
export const DUGAN_SKIN = 'rust-brick-dugan';
export const DUGAN_MAX_HP = 150;
export const DUGAN_RAGE_THRESHOLD = 0.3;   // proposed: below 30 percent health he enters Rage Punch mode

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
    id: 'charge', name: 'Running Shoulder Charge', kind: 'finisher',
    telegraphMs: 800, attackMs: 2400, recoverMs: 700, wallRecoverMs: 1800,   // dodge sideways and he crashes into the wall: long recovery to punish
    hits: [hit(0, 20, 520, 400, true)], markIndex: 0,
    hitbox: Object.freeze({ x: 10, y: -85, w: 75, h: 65 }),
    chargeSpeed: 430, chargeMaxPx: 1000, minRange: 140, maxRange: 720,
  }),
  stomp: move({
    id: 'stomp', name: 'Ground Stomp', kind: 'strike',
    telegraphMs: 700, attackMs: 300, recoverMs: 1000,
    hits: [hit(150, 14, 360, 350)], markIndex: 0,
    hitbox: Object.freeze({ x: -95, y: -40, w: 190, h: 40 }),               // a circle on the ground around his boots: jump it
  }),
  grab: move({
    id: 'grab', name: 'Grab and Wall Slam', kind: 'finisher',
    telegraphMs: 600, attackMs: 450, recoverMs: 1100,
    hits: [hit(180, 22, 640, 500, true)], markIndex: 0,
    hitbox: Object.freeze({ x: 0, y: -85, w: 75, h: 60 }),                  // short reach: back-step it
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
  moveCooldownMs: 600,    // pause after any move before the next decision
});

/**
 * Pick his next move. Pure; rng: () => [0,1).
 * @param {{dist:number, dy:number, lift:number, meleeMs:number, ragePending:boolean, chargeReady:boolean, lastId:string|null}} s
 * @returns {object} an entry of DUGAN_MOVES
 */
export function pickDuganMove(s, rng = Math.random, d = DUGAN) {
  const inMelee = s.dist <= d.attackRange;
  if (s.ragePending && inMelee) return DUGAN_MOVES.rage;                      // below 30 percent: one extra-heavy punch, as soon as he is in reach
  if (inMelee) {
    if (s.lift >= d.stompAirLift || s.dist <= d.stompCrowdPx) return DUGAN_MOVES.stomp; // airborne or crowding him
    if (s.meleeMs >= d.grabAfterMeleeMs) return DUGAN_MOVES.grab;                       // stayed in melee too long
    return rng() < 0.2 && s.lastId !== 'stomp' ? DUGAN_MOVES.stomp : DUGAN_MOVES.punch;
  }
  if (s.chargeReady && s.dist >= DUGAN_MOVES.charge.minRange && s.dist <= DUGAN_MOVES.charge.maxRange
      && Math.abs(s.dy) <= d.chargeLaneTolerance) return DUGAN_MOVES.charge;       // from range, along his lane
  return null;
}
